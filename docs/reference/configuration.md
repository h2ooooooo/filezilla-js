# Connector configuration

The generic transfer APIs on this page are implemented by the independent **Dockline packages**: `@jalsoedesign/dockline-abstract`, `@jalsoedesign/dockline-ftp-client` and `@jalsoedesign/dockline-sftp-client`. Existing FileZilla connector imports remain supported compatibility exports; saved-site factories and FileZilla host-key import stay in FileZilla JS. See [the project boundary and migration](/guide/dockline).

Constructors and factories create disconnected adapters. Supported methods connect lazily; `connect(options?)` is also explicit. Shared options apply as defaults and may be overridden per call.

## ConnectorOperationOptions

Exported by `@jalsoedesign/filezilla-connector-abstract` and extended by both connector configs:

| Field | Default | Contract |
| --- | --- | --- |
| `autoReconnect?: boolean` | false | Allow reconnection after loss and eligible replay |
| `maxTransientRetries?: number` | 3 | Extra attempts, not total attempts; non-negative safe integer |
| `timeoutMs?: number` | 30000 | Per-attempt milliseconds; 0 disables; maximum 2147483647 |
| `timeout?: number` | unset | Alias, used if timeoutMs is absent at that level |
| `abortSignal?: AbortSignal` | unset | Pre-start and in-flight cancellation |

Per-call values override constructor defaults. A per-call `timeout` overrides a constructor `timeoutMs`; explicit `timeoutMs` wins over `timeout` at the same level. `resolveOperationOptions(defaults?, overrides?)` returns validated resolved values; `isTransientError(error)` classifies supported retry candidates. These helpers do not make every operation safe to replay.

`TransferContents` is `Readable | TransferSourceFactory`, where the factory returns a fresh `Readable` or `Promise<Readable>`. Factory uploads opt into replay of the complete overwriting write when reconnection is enabled. One-shot streams and returned reads are not transparently replayed.

## FtpConnectorConfig

| Field | Type | Meaning |
| --- | --- | --- |
| `host` | string | Required destination |
| `port` | number | Required; factory fallback 990 for implicit TLS, 21 otherwise |
| `user`, `password` | string | Required credentials; anonymous mapping is factory-owned |
| `secure` | boolean or `'implicit'` | true explicit TLS; implicit TLS; false plaintext |
| `initialPath` | string | Initial CWD, or empty for none |
| `passive` | boolean or null | false is rejected; null uses client default |
| `secureOptions?` | Node TLS ConnectionOptions | Trusted CA and other deliberate TLS settings |

FTP adds the shared options above. Its own operation contexts enforce deadlines and queue waiting rather than treating an underlying inactivity timer as an overall guarantee. Do not disable TLS verification as a timeout workaround.

## SftpConnectorConfig

| Field | Type | Meaning |
| --- | --- | --- |
| `host`, `username` | string | Required destination/user |
| `port` | number | Required; factory fallback 22 |
| `password?` | string | Password authentication |
| `privateKey?` | string or Buffer | Key contents |
| `privateKeyPath?` | string | Local key file; wins over key contents when both supplied |
| `passphrase?` | string | Unlock supported encrypted keys |
| `initialPath` | string | Prefix for relative remote paths |
| `hostVerifier?` | SftpHostVerifier | Raw-key verifier; sync, promise or callback form |
| `readyTimeout?` | number | SSH handshake bound; otherwise resolved nonzero operation deadline or 30000 |
| `requireTrustPolicy?` | boolean | Optional; true requires both callbacks before connecting |
| `hasTrustPolicy?` | SftpTrustPolicy | Look up exact presented identity |
| `acceptTrustPolicy?` | SftpTrustPolicy | Explicit application acceptance for unknown/changed identity |

SFTP also extends shared operation options. `SftpTrustPolicy` receives `SftpHostKeyChallenge` and returns boolean or `Promise<boolean>`. Challenges contain `host`, `port`, `keyType`, `fingerprint`, `publicKey`, optional `previousFingerprint`, `changed` and `abortSignal`.

If supplied, `hostVerifier` must accept before policy callbacks. With `requireTrustPolicy` false and no verifier/callbacks, compatibility behavior accepts the key. The library never equates a saved Site Manager record with trusted-host data. See [trust setup](/guide/sftp).

## FileZillaHostKeyStore

The SFTP package provides an explicit read-only importer for modern FileZilla `hostkeys.xml`:

```ts
const store = await FileZillaHostKeyStore.fromFile(selectedHostKeysFile);
const accepted = store.hasTrustPolicy(challenge);
const fingerprints = store.getKnownFingerprints(host, port);
```

It is a snapshot: exact host/port/public-key matching, no discovery or writes. The bound `hasTrustPolicy` can be supplied directly to a connector. The caller still supplies `acceptTrustPolicy` and owns prompts/persistence. See [SFTP](/guide/sftp) for supported format and import limits.

## Metadata that is not enforced

Timezone offset, proxy bypass and FileZilla UI preferences remain metadata. Filename encoding is now deliberately supported only within the [FTP policy](/guide/ftp-options); SFTP accepts UTF-8 only. Pass saved maximum connections explicitly as `serverMaxConnections` when constructing a [pool](/guide/connection-pools). SSH agents, interactive callbacks and keepalives are opt-in configuration documented under [SSH options](/guide/ssh-options). Proxy and jump routes remain unsupported.


## New optional controls

Shared transfer options also include `onProgress`, `totalBytes`, `progressIntervalMs` (100 by default; zero reports each counted chunk), and `bandwidth` (positive bytes per second or a shared BandwidthBudget). Progress and rate limiting are disabled unless selected. `totalBytes` is an optional non-negative safe-integer hint; it does not assert a verified source size. `resolveOperationOptions` returns the resolved lifecycle fields only; transfer monitoring validates and applies its separate progress/budget controls. See [transfer tools](/guide/advanced-transfers).

Connection defaults live on the connector/factory; individual calls override `ConnectorOperationOptions`, not credentials, host trust or keepalive configuration. Both connector/factory configurations extend `ConnectorConnectionOptions`: `siteId`, asynchronous `credentialProvider`, `keepalive` and observational `onConnectionState`. Providers receive the protocol, destination, site ID, connect/reconnect purpose, one-based attempt and cancellation signal. Returned credentials are an explicit password, private-key or agent variant; FTP accepts only password credentials. Keepalives are disabled by default. `keepalive` is `{intervalMs: number, maxMissed?: number}`: interval zero disables it, and the default missed-response threshold is three. State observations contain `state`, `protocol`, one-based `attempt` and an optional typed `error`; states are connecting, reconnecting, ready, disconnected and failed. Observer failures never change network outcomes.

SFTP adds `agent`, `agentForward: false`, `keyboardInteractive` (ordinary string or callback), UTF-8 filename configuration and the separate managed `KnownHostsStore`. The FileZilla host-key importer remains read-only. [SSH options](/guide/ssh-options) specifies approval, persistence and platform limits.
