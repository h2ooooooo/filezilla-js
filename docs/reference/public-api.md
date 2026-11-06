# Public API index

FileZilla exports native settings APIs and settings-to-Dockline integration. Generic transport classes, errors, pools and transfer utilities are imported directly from Dockline. See [the architecture and import migration](/guide/dockline) and the generated [exact TypeScript signatures](/reference/types).

## Core: filezilla-core

| API | Purpose |
| --- | --- |
| `SiteManager`, `getSiteManager`, `getDefaultSiteManager`, `getDefaultSiteManagerPath`, `readSiteManagerReport` | Read Site Manager files; select credential loading and tolerant import diagnostics |
| `Server`, server properties, XML/tree types and enums | FileZilla-native site models and protocol/path interpretation |
| `SiteIdentityStore` and its record/reconcile types | Stable application-owned selection identity |
| `createMetadataSnapshot`, `parseMetadataSnapshot`, `diffMetadata`, `MetadataSnapshotError` and metadata types | Redacted immutable snapshots and metadata differences |
| `FileZillaProfileSource` | Adapt FileZilla sites to Portline profiles and explicit credential resolution |
| `createFileZillaWriter` | Construct a Portline native writer for explicit FileZilla preview/apply |

Readers are synchronous except where the normalized source contract explicitly permits async operations. Reading does not connect. Legacy models have no save method. Native XML changes use the separate guarded writer; identity JSON persistence remains application-owned.

## FileZilla connector integrations

| Package | Exports |
| --- | --- |
| `filezilla-connector-abstract` | `ConnectorFactory<TConnector, TOptions>`, `ConnectorRegistry`, `RegisteredProvider`, `Registration` |
| `filezilla-connector-ftp` | `FtpConnectorFactory`, `FtpConnectorFactoryOptions` |
| `filezilla-connector-sftp` | `SftpConnectorFactory`, `SftpConnectorFactoryOptions`, `FileZillaHostKeyStore` |

Factories provide static and instance `toConfig(server, options)` and `fromServer(server, options)`. `toConfig` produces a Dockline configuration; `fromServer` creates a disconnected Dockline adapter. The registry dispatches FileZilla's numeric saved protocols to explicitly registered factories. The SFTP host-key importer reads modern FileZilla `hostkeys.xml`; it does not persist approvals.

These entry points do not re-export `FtpConnector`, `SftpConnector`, `KnownHostsStore`, generic transport types or errors. Use [Dockline's API reference](https://h2ooooooo.github.io/dockline/reference/api) for those APIs.

## CLI: filezilla-cli

The package exports `run`, `createFileZillaCliSource`, `checkConnection` and the connection-check option/result/stage/status types. The executable provides search, list, get, source, write-status, write, sync, apply and check. See [complete command inputs](/reference/cli-help), [actual output and exit codes](/reference/cli-output), and the [connection-check contract](/guide/connection-check).

Query commands preserve FileZilla-native output shapes and credential-redaction behavior. The shared Portline engine supplies query and guarded writing infrastructure; FileZilla supplies source selection and its network-check extension. The check uses Dockline and performs no remote writes. Write/sync create previews; apply is explicit and repeats the safeguards.

## Generic connection APIs

Use `@jalsoedesign/dockline-core` for scoped transfers and local file helpers, `dockline-ftp-client` or `dockline-sftp-client` for direct adapters, `dockline-ssh-client` for scoped SSH commands/sudo, and `dockline-keys` for key inspection and conversion. FileZilla is needed when the input is FileZilla settings or trusted-key metadata.
