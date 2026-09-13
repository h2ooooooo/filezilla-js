# SSH authentication and trust

The generic transfer APIs on this page are implemented by the independent **Dockline packages**: `@jalsoedesign/dockline-abstract`, `@jalsoedesign/dockline-ftp-client` and `@jalsoedesign/dockline-sftp-client`. Existing FileZilla connector imports remain supported compatibility exports; saved-site factories and FileZilla host-key import stay in FileZilla JS. See [the project boundary and migration](/guide/dockline).

`@jalsoedesign/filezilla-connector-sftp` uses `ssh2-sftp-client` and its SSH transport. It exposes authentication, trust and keepalive options without choosing a CLI, UI or credential vault for your application.

## Pick an authentication method

Password, private-key contents, private-key paths and passphrases remain supported. An optional credential provider resolves authentication material at each connection attempt, including explicit reconnections and permitted transient connection retries:

```ts
import {SftpConnector} from '@jalsoedesign/filezilla-connector-sftp';

const connector = new SftpConnector({
    host: 'sftp.example.com',
    port: 22,
    username: 'deploy',
    initialPath: '/releases',
    siteId: 'production',
    credentialProvider: async ({siteId, purpose, attempt, abortSignal}) => {
        const password = await applicationVault.getPassword(siteId, {abortSignal});

        return {type: 'password', password};
    },
    requireTrustPolicy: true,
    hasTrustPolicy: applicationTrustLookup,
    acceptTrustPolicy: applicationTrustPrompt,
});
```

The provider receives only `siteId`, host, port, protocol, connection purpose, one-based attempt number and the attempt's abort signal. Its result is one of:

```ts
{type: 'password', username?: string, password: string}
{type: 'private-key', username?: string, privateKey: string | Buffer, passphrase?: string}
{type: 'agent', username?: string, socketPath: string}
```

A provider takes precedence over static password, key and agent configuration. Each result selects that authentication method; a rejected agent does not fall back to an unrelated stored password. Applications own credential caching and must decide whether asking again during reconnection is appropriate. Set `maxTransientRetries: 0` to allow only one initial attempt. A provider rejection becomes `CredentialProviderError` with `stage: 'credentials'`; its original message and cause are not exposed.

The connection deadline includes waiting for the provider. Cancellation prevents a late result from starting authentication. The signal is also aborted once that attempt finishes, so a vault or UI can release its pending work. JavaScript strings cannot be securely erased; do not log credentials or serialize connector instances.

## SSH agents

Choose the agent explicitly. The connector does not inspect the environment or discover agents automatically:

```ts
const connector = new SftpConnector({
    ...connection,
    agent: selectedAgentSocket,
    agentForward: false,
    requireTrustPolicy: true,
    hasTrustPolicy: applicationTrustLookup,
    acceptTrustPolicy: applicationTrustPrompt,
});
```

| Platform / agent | `agent` value |
| --- | --- |
| POSIX OpenSSH agent | The selected Unix socket path, often supplied by your application from `SSH_AUTH_SOCK` |
| Windows OpenSSH agent | The selected named pipe, commonly `\\.\pipe\openssh-ssh-agent` |
| Windows Pageant | `'pageant'` |
| Windows Cygwin agent | The actual Cygwin socket file path |

These mappings follow the installed SSH dependency. A controlled OpenSSH agent fixture exercises real signing and authentication using a Windows named pipe on the development machine; the same fixture uses a Unix socket when tests run on POSIX. Pageant and Cygwin dispatch are supported by the dependency but were not exercised against live desktop agents in this review.

Agent forwarding is unsupported. The TypeScript option accepts only `false`; passing `true` from JavaScript throws `NotSupportedError`. The remote server receives signatures and public keys for authentication, never access to the agent. Unavailable or rejected agents surface `AuthError`. Agent key order is controlled by the agent; explicit per-key selection is not provided.

## Keyboard-interactive: a string or a callback

For a server that asks one known question, a regular string is enough:

```ts
const connector = SftpConnectorFactory.fromServer(site, {
    keyboardInteractive: 'the-current-one-time-code',
    requireTrustPolicy: true,
    hasTrustPolicy: applicationTrustLookup,
    acceptTrustPolicy: applicationTrustPrompt,
});
```

The string answers each single-prompt round. A zero-prompt round receives an empty answer array. If a round contains multiple prompts, a string is rejected; the library cannot safely guess which field should receive a password or one-time code. For changing codes, multiple prompts or several rounds, use a callback:

```ts
const connector = SftpConnectorFactory.fromServer(site, {
    keyboardInteractive: async ({name, instructions, prompts, abortSignal}) => {
        return applicationUi.answerSshPrompts({
            title: name,
            instructions,
            prompts,
            abortSignal,
        });
    },
    ...trustOptions,
});
```

Return exactly one string per prompt, in the original order. Each prompt includes `prompt` text and its `echo` flag; `false` means the application should mask the answer. The challenge also includes the language, and can be delivered more than once during a connection. Prompt text is supplied by the server and should be presented as plain text by your UI.

When `keyboardInteractive` is configured, it explicitly selects interactive authentication. Authentication prompts follow host verification. Answers and callback error messages are excluded from surfaced authentication errors. The deadline and abort signal cover pending UI input, late answers are discarded, and an attempt that already displayed a challenge is never silently retried. An explicit later `connect()` can ask again.

The factory accepts `LogonType.interactive` only with this string or callback. `LogonType.ask` accepts an explicit password, credential provider, agent or keyboard-interactive handler. Neither mode opens a built-in terminal prompt.

## Managed known-hosts storage

`KnownHostsStore` is an optional, explicitly selected JSON store. It does not discover or edit `~/.ssh/known_hosts`, FileZilla files or the Windows registry. Opening a missing store does not create it until an approval is recorded.

```ts
import {KnownHostsStore, SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';

const store = await KnownHostsStore.open({file: selectedTrustFile});
const connector = SftpConnectorFactory.fromServer(site, {
    ...store.trustPolicy(async (challenge) => {
        return applicationUi.confirmHostKey({
            host: challenge.host,
            port: challenge.port,
            keyType: challenge.keyType,
            fingerprint: challenge.fingerprint,
            previousFingerprint: challenge.previousFingerprint,
            changed: challenge.changed,
            abortSignal: challenge.abortSignal,
        });
    }),
});
```

`trustPolicy()` supplies `requireTrustPolicy: true`, a bound exact-match lookup, and an acceptance callback. Only your callback returning `true` records approval. New keys and changed keys are reviewed explicitly. A changed-key challenge includes the previously persisted fingerprint even after restarting your application. The store keeps one approved key per normalized host and port; replacing that key requires fresh approval.

Applications that need their own workflow can use the lower-level methods:

```ts
const inspection = await store.inspect(challenge);
// inspection.status: 'unknown' | 'match' | 'changed'

if (await applicationUi.approve(challenge, inspection)) {
    await store.recordAccepted(challenge, {
        approved: true,
        previousFingerprint: inspection.previousFingerprint,
    });
}
```

`previousFingerprint` is mandatory and is `null` for an unknown host. The store compares it again after acquiring its write lock. A competing approval of a different key produces `KnownHostsConflictError`; inspect and ask again instead of overwriting the new trust state. Concurrent approvals of separate hosts merge, and accepting the same key twice is harmless.

The version 1 document contains only host, port, key type, public key and SHA-256 fingerprint. `await store.entries()` returns public-key records for review or explicit export. To import a reviewed exported record, reconstruct its public-key buffer, inspect the destination store, and use the same approval workflow. The existing `FileZillaHostKeyStore.fromFile(path)` remains the read-only modern FileZilla importer; its exact-match callback can be combined with an application approval policy without silently copying trust into the managed store.

Store reads are bounded to 1 MiB and reject malformed, duplicate or incompatible entries. Writes use an exclusive lock and a flushed temporary file followed by atomic replacement. New files request mode `0600`, and new parent directories request `0700`; Windows access is governed by inherited ACLs, so select an application-owned directory. `lockTimeoutMs` defaults to 5000. Abandoned locks are never stolen automatically: verify that no writer is active before removing a stale `.lock` file. All cooperating writers must use this store API. The versioned JSON is the interchange format; OpenSSH hashed-host and certificate formats are not parsed.

`requireTrustPolicy` remains opt-in for compatibility and still requires both lookup and acceptance hooks. Configure it, or an explicit `hostVerifier`, whenever your application requires verification. The connector never decides whether an unfamiliar key should be trusted.

## Keepalives and lifecycle observation

```ts
const connector = SftpConnectorFactory.fromServer(site, {
    ...trustOptions,
    keepalive: {intervalMs: 30000, maxMissed: 3},
    autoReconnect: true,
    maxTransientRetries: 3,
    onConnectionState: ({state, attempt, error}) => {
        applicationUi.showConnectionState(state, {attempt, error});
    },
});
```

SFTP uses SSH-level keepalive packets. They are disabled by default (`intervalMs: 0`), and the default missed-response threshold is 3 when enabled. The transport owns the timer and stops it when the session closes. State events report `connecting`, `reconnecting`, `ready`, `disconnected` and `failed`; observer exceptions do not change a network outcome.

Keepalive failure uses the existing connection-loss and operation-retry rules. It does not start a background reconnect loop, replay partially consumed downloads or retry an uncertain mutation. Upload retry still requires a factory that produces a fresh stream, enabled reconnection, a transient failure and a remaining retry budget.

## Filenames, transfer progress and server capabilities

SFTP supports only UTF-8 filenames. `filenameEncoding: {charset: 'utf-8', onUnrepresentable: 'reject'}` is accepted; non-UTF-8 options, imported custom non-UTF-8 charset settings and names containing unpaired Unicode surrogates are rejected. File contents are always raw bytes.

Read and write calls accept shared progress and bandwidth options. Upload completion follows the destination stream's protocol completion; download completion waits for both the remote stream to close successfully and the consumer to drain the monitored stream. Unknown totals remain unknown. Use `totalBytes` when your application already knows the length. A deliberate bandwidth limit counts against the operation's total timeout.

The connector also exposes `publishFile`, `checksumDetails`, `copyFile`, `copyFileWithStrategy`, `walk` and `capabilities`. `copyFileWithStrategy` returns the selected strategy, byte count and publication result; the compatible `copyFile` method resolves without a result. Checksums default to server-only and therefore require an explicit `strategy: 'stream'` or `'server-or-stream'` for this SFTP adapter. Copying defaults to the bounded client-streamed strategy using a private temporary file; it does not create an extra SSH connection. Standard rename provides no-replace semantics, while replacement requires the server's `posix-rename@openssh.com` extension. Atomic no-replace publication is rejected before staging. Empty-directory cleanup never recursively deletes unexpected contents.

Capability reports expose an `inventory` state: `not-requested`, `advertised` or `unavailable`. `negotiated` means an inventory request was made; it does not guarantee that the dependency exposed a usable inventory. The dependency has no documented negotiated-extension inventory API. `serverFeatures()` therefore returns an empty list, and capabilities keep unverified server support and path permissions unknown. It does not infer permissions from a successful login or promise atomic replacement before the server confirms the extension operation.

## Sources

- [SSH client authentication, agents, keepalives and keyboard-interactive callbacks](https://github.com/mscdex/ssh2#client-methods)
- [SSH agent protocol](https://github.com/mscdex/ssh2#agentprotocol)
- [ssh2-sftp-client connection options and operations](https://github.com/theophilusx/ssh2-sftp-client)
