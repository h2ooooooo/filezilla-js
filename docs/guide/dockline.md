# Dockline and FileZilla JS

The import example is reference code, not a runnable connection program. For complete setup, filenames, run commands and output, use [the saved-site walkthrough](/guide/quick-start).

FileZilla JS interprets FileZilla settings. Dockline opens connections and transfers data. Portline supplies application-independent profiles, discovery contracts, queries and guarded native writes.

| Layer | Owns |
| --- | --- |
| FileZilla core | Site Manager reading, native `Server` models, credential decoding, metadata identity/snapshots, `FileZillaProfileSource` and the `createFileZillaWriter` factory |
| FileZilla integration | Saved protocol/authentication/path mapping through `FtpConnectorFactory` and `SftpConnectorFactory`; FileZilla numeric-protocol registry; read-only `hostkeys.xml` import |
| Portline | Normalized profile and credential contracts, shared queries/CLIs, discovery infrastructure, preview/sync/apply policy, native lock/process checks and backups |
| Dockline | FTP/FTPS/SFTP transports, SSH command execution, trust/authentication callbacks, transfers, errors, pools and managed known hosts |
| dockline-keys | Key inspection, fingerprints, public-key extraction and encrypted OpenSSH/PPK/PEM conversion |

Dockline does not import FileZilla models or settings readers. Application readers remain in separate repositories.

## Choose an import

For a generic connection, import Dockline directly:

::: code-group

```ts [TypeScript]
import {SftpConnector} from '@jalsoedesign/dockline-sftp-client';
import {KnownHostsStore} from '@jalsoedesign/dockline-sftp-client';
import {AuthError, ConnectorPool} from '@jalsoedesign/dockline-abstract';
```

```js [JavaScript]
import {SftpConnector} from '@jalsoedesign/dockline-sftp-client';
import {KnownHostsStore} from '@jalsoedesign/dockline-sftp-client';
import {AuthError, ConnectorPool} from '@jalsoedesign/dockline-abstract';
```

```js [MJS]
import {SftpConnector} from '@jalsoedesign/dockline-sftp-client';
import {KnownHostsStore} from '@jalsoedesign/dockline-sftp-client';
import {AuthError, ConnectorPool} from '@jalsoedesign/dockline-abstract';
```

```js [CommonJS]
const {SftpConnector} = require('@jalsoedesign/dockline-sftp-client');
const {KnownHostsStore} = require('@jalsoedesign/dockline-sftp-client');
const {AuthError, ConnectorPool} = require('@jalsoedesign/dockline-abstract');
```

:::

These classes are not exported by FileZilla's connector packages. FileZilla does not add authentication, key parsing or transfer features to a directly constructed Dockline connector. `siteId` in a Dockline credential callback is an application-supplied identifier; it does not load a FileZilla site.

For a saved FileZilla site, use the [complete quick start](/guide/quick-start). It reads the selected site, calls `SftpConnectorFactory.toConfig(site, options)` or `FtpConnectorFactory.toConfig(site, options)`, and gives the result to `Dockline.withConnection`.

| FileZilla package | Public integration exports |
| --- | --- |
| `filezilla-connector-abstract` | `ConnectorFactory`, `ConnectorRegistry`, `RegisteredProvider`, `Registration` |
| `filezilla-connector-ftp` | `FtpConnectorFactory`, `FtpConnectorFactoryOptions` |
| `filezilla-connector-sftp` | `SftpConnectorFactory`, `SftpConnectorFactoryOptions`, `FileZillaHostKeyStore` |

The two `fromServer` factory methods remain useful: they translate FileZilla settings and return disconnected Dockline adapters. `toConfig` returns ordinary Dockline configuration without opening a connection. Both static and instance methods are supported.

## Saved protocol mapping

| Saved FileZilla protocol | Dockline protocol |
| --- | --- |
| FTP, FTPES | `ftps`, explicit TLS with no plaintext fallback |
| FTPS | `ftps-implicit` |
| INSECURE_FTP | `ftp` |
| SFTP | `sftp` |

Factories map saved host, port, account, authentication mode, key path and initial directory. FTP additionally maps passive mode, TLS and filename encoding. Unsupported saved logon modes are refused rather than guessed. Credential and trust overrides remain explicit. Returned connection configuration may contain credentials and callbacks; do not log it as metadata.

## Migrate transport imports

The connector packages' major release removes generic passthrough exports and their `dist/*` entry points. Import generic errors, configuration types, pools, progress/bandwidth and transfer helpers from `@jalsoedesign/dockline-abstract`. Import `FtpConnector` and FTP-specific types from `@jalsoedesign/dockline-ftp-client`; import `SftpConnector`, SFTP-specific types and `KnownHostsStore` from `@jalsoedesign/dockline-sftp-client`.

FileZilla factory/registry APIs and the FileZilla host-key importer remain available. Check the [exact public signatures](/reference/types) for the complete current FileZilla API. Keep compatible Dockline dependencies aligned so applications and factories resolve the same error constructors.

## Reads, guarded writes and execution

Legacy `SiteManager`/`Server` reads and in-memory edits do not save XML. Explicit native changes use `createFileZillaWriter` and the separate [preview/apply workflow](/development/profile-writing). It preserves unrelated settings and checks locks, process state and revision before applying. `FileZillaHostKeyStore` remains a read-only snapshot; approvals are persisted through the caller's chosen trust store.

The `filezilla-js` CLI provides search/list/get/source, connection checks and explicit write/sync/apply/status commands. The Dockline CLI provides upload/download/list/remove from connection configuration. SSH execution and key conversion are SDK APIs; they are not extra Dockline CLI subcommands. Profile sync copies supported normalized metadata, not stored secrets, private-key contents or trust approvals.

See [Dockline's package guide](https://h2ooooooo.github.io/dockline/guide/packages) and [key utilities](https://h2ooooooo.github.io/dockline/keys/) for transport and key APIs.
