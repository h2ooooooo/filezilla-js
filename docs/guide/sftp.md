# SFTP and host trust

The functions below are contextual trust integrations. Supply a selected native `Server`, explicit trust callbacks and the selected FileZilla host-key file where used. They return disconnected Dockline connectors, not a separately implemented FileZilla SSH client. Put imports at file scope and connect/disconnect as shown in the [complete program](/guide/quick-start).

The generic transport APIs below belong to Dockline and are imported from its packages directly. FileZilla adds saved-site mapping and FileZilla host-key import; see [architecture and import migration](/guide/dockline).

The adapter uses `ssh2-sftp-client` 12.1.1. It supports password authentication, private-key contents and a private-key path. Both direct construction and saved-site factories accept trust configuration.

## Pin a separately trusted host key

Use the [complete saved SFTP program](/guide/quick-start#load-one-sftp-site-connect-and-upload-one-file). It loads credentials only for the exact selected site, maps its settings with `SftpConnectorFactory.toConfig`, verifies host, port and the independently supplied fingerprint, then transfers using Dockline. For generic direct connections use [Dockline SFTP](https://h2ooooooo.github.io/dockline/sftp/quick-start).

## Application trust callbacks

`requireTrustPolicy: true` requires **both** `hasTrustPolicy` and `acceptTrustPolicy` before connecting. Both receive an `SftpHostKeyChallenge` and may return a boolean or `Promise<boolean>`.

::: code-group

```ts [TypeScript]
import {SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';
import {type SftpHostKeyChallenge} from '@jalsoedesign/dockline-sftp-client';

function createTrustedConnector(
    site: Parameters<typeof SftpConnectorFactory.fromServer>[0],
    hasTrust: (challenge: SftpHostKeyChallenge) => Promise<boolean>,
    requestAcceptance: (challenge: SftpHostKeyChallenge) => Promise<boolean>,
) {
    return SftpConnectorFactory.fromServer(site, {
        requireTrustPolicy: true,
        hasTrustPolicy: hasTrust,
        acceptTrustPolicy: requestAcceptance,
        timeoutMs: 30_000,
    });
}
```

```js [JavaScript]
import {SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';
import {} from '@jalsoedesign/dockline-sftp-client';

function createTrustedConnector(
    site,
    hasTrust,
    requestAcceptance,
) {
    return SftpConnectorFactory.fromServer(site, {
        requireTrustPolicy: true,
        hasTrustPolicy: hasTrust,
        acceptTrustPolicy: requestAcceptance,
        timeoutMs: 30_000,
    });
}
```

```js [MJS]
import {SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';
import {} from '@jalsoedesign/dockline-sftp-client';

function createTrustedConnector(
    site,
    hasTrust,
    requestAcceptance,
) {
    return SftpConnectorFactory.fromServer(site, {
        requireTrustPolicy: true,
        hasTrustPolicy: hasTrust,
        acceptTrustPolicy: requestAcceptance,
        timeoutMs: 30_000,
    });
}
```

```js [CommonJS]
const {SftpConnectorFactory} = require('@jalsoedesign/filezilla-connector-sftp');

function createTrustedConnector(
    site,
    hasTrust,
    requestAcceptance,
) {
    return SftpConnectorFactory.fromServer(site, {
        requireTrustPolicy: true,
        hasTrustPolicy: hasTrust,
        acceptTrustPolicy: requestAcceptance,
        timeoutMs: 30_000,
    });
}
```

:::

The challenge contains host, port, key type, OpenSSH-style SHA-256 fingerprint, public key bytes, `previousFingerprint`, `changed` and `abortSignal`. `hasTrustPolicy` checks the exact identity. An unknown key or a key change observed by this connector requires `acceptTrustPolicy` to return true. `previousFingerprint` is in-memory history for that connector, not a persistent known-hosts database. Respect `abortSignal` when showing a prompt.

If a `hostVerifier` is also supplied, it must accept before policy callbacks run. `requireTrustPolicy` is **optional** and defaults to false; when no verifier or policy callbacks are configured, compatibility behavior accepts the key. Choose an explicit verifier or required policy for trusted connections.

The application owns storage, first-use review and changed-key approval. Reading a FileZilla Site Manager file imports site settings, **not FileZilla's trusted-host database**. A saved host name or fingerprint observed for the first time is not independent evidence of trust. Optional `KnownHostsStore` now persists explicitly approved keys in an application-selected file; see [managed known hosts](/guide/ssh-options#managed-known-hosts-storage).

## Reuse modern FileZilla trusted keys

The separate `FileZillaHostKeyStore` reads an explicitly selected modern FileZilla `hostkeys.xml` and supplies exact known-key lookup. FileZilla 3.71's store is separate from `sitemanager.xml` in its settings directory; the helper does not discover that path for you.

::: code-group

```ts [TypeScript]
import type {Server} from '@jalsoedesign/filezilla-core';
import {FileZillaHostKeyStore, SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';
import {type SftpHostKeyChallenge} from '@jalsoedesign/dockline-sftp-client';

async function useFileZillaTrust(
    site: Server,
    filename: string,
    accept: (challenge: SftpHostKeyChallenge) => Promise<boolean>,
) {
    const store = await FileZillaHostKeyStore.fromFile(filename);
    return SftpConnectorFactory.fromServer(site, {
        requireTrustPolicy: true,
        hasTrustPolicy: store.hasTrustPolicy,
        acceptTrustPolicy: accept,
    });
}
```

```js [JavaScript]
import {FileZillaHostKeyStore, SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';
import {} from '@jalsoedesign/dockline-sftp-client';

async function useFileZillaTrust(
    site,
    filename,
    accept,
) {
    const store = await FileZillaHostKeyStore.fromFile(filename);
    return SftpConnectorFactory.fromServer(site, {
        requireTrustPolicy: true,
        hasTrustPolicy: store.hasTrustPolicy,
        acceptTrustPolicy: accept,
    });
}
```

```js [MJS]
import {FileZillaHostKeyStore, SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';
import {} from '@jalsoedesign/dockline-sftp-client';

async function useFileZillaTrust(
    site,
    filename,
    accept,
) {
    const store = await FileZillaHostKeyStore.fromFile(filename);
    return SftpConnectorFactory.fromServer(site, {
        requireTrustPolicy: true,
        hasTrustPolicy: store.hasTrustPolicy,
        acceptTrustPolicy: accept,
    });
}
```

```js [CommonJS]
const {FileZillaHostKeyStore, SftpConnectorFactory} = require('@jalsoedesign/filezilla-connector-sftp');

async function useFileZillaTrust(
    site,
    filename,
    accept,
) {
    const store = await FileZillaHostKeyStore.fromFile(filename);
    return SftpConnectorFactory.fromServer(site, {
        requireTrustPolicy: true,
        hasTrustPolicy: store.hasTrustPolicy,
        acceptTrustPolicy: accept,
    });
}
```

:::

This is a **read-only snapshot**, limited to a regular UTF-8 file of at most 1 MiB. It validates the modern XML shape, canonical base64 and SSH key envelope, and rejects malformed/duplicate entries and DTD/entity declarations. Matching case-folds the host but requires exact port and raw public-key bytes; it does not merge DNS aliases or trailing-dot host names. `getKnownFingerprints(host, port)` returns stored SHA-256 fingerprints for application review.

The importer does not write approvals, watch the file, import legacy PuTTY trust data or adopt FileZilla's `AllowedInsecureAlgorithms` policy. Reload explicitly after changing the source. An unknown/changed key still needs the caller's acceptance callback, and durable storage remains caller-owned. The implementation was checked against FileZilla's modern host-key store format;

## Private keys

`privateKey` contains key text/bytes; `privateKeyPath` is a local file read at connect time and takes precedence if both are present. `passphrase` unlocks an encrypted key supported by the SSH dependency. The FileZilla factory maps saved `keyFile` and passphrase metadata unless overridden. Dockline delegates key loading to dockline-keys, which accepts modern OpenSSH, PPK v2/v3, PKCS#8 and supported traditional PEM, including encrypted inputs. Normalization occurs in memory without rewriting the original file. Use [dockline-keys](https://h2ooooooo.github.io/dockline/keys/) for explicit conversion and encrypted exports.

## Paths, errors and recovery

Relative paths are prefixed with `initialPath`; absolute paths bypass it. This is not path confinement. Final-component `lstat` checks do not prevent access through intermediate symlinks.

Connection attempts are coalesced, and each waiting caller can cancel or time out. Automatic reconnection defaults to false. Shared retry controls, fresh upload factories and non-replayed reads are described under [transfers](/guide/transfers).

Authentication, host-trust, timeout, cancellation and closed-connection errors now use shared typed classes. SFTP reads own their source lifecycle and preserve mapped errors; stat timestamps use the dependency's millisecond `modifyTime`, including zero.

**Unresolved upstream SFTP status conversion:** the dependency can still rewrite generic SFTP status 4 into a missing-file result. Do not use an SFTP `fileExists() === false` result alone to justify a destructive or recovery decision. See the [protocol limitations](/reference/specification).
