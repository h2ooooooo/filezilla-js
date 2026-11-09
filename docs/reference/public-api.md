# Public API index

FileZilla exports native settings APIs and complete Portline connection definitions. The optional shared Portline–Dockline integration handles execution for all readers. Generic transport classes, errors, pools and transfer utilities are imported directly from Dockline. See [the architecture and import migration](/guide/dockline) and the generated [exact TypeScript signatures](/reference/types).

## Core: filezilla-core

| API | Purpose |
| --- | --- |
| `SiteManager`, `getSiteManager`, `getDefaultSiteManager`, `getDefaultSiteManagerPath`, `readSiteManagerReport` | Read Site Manager files; select credential loading and tolerant import diagnostics |
| `Server`, server properties, XML/tree types and enums | FileZilla-native site models and protocol/path interpretation |
| `SiteIdentityStore` and its record/reconcile types | Stable application-owned selection identity |
| `createMetadataSnapshot`, `parseMetadataSnapshot`, `diffMetadata`, `MetadataSnapshotError` and metadata types | Redacted immutable snapshots and metadata differences |
| `FileZillaProfileSource` | Adapt FileZilla sites to Portline profiles and explicit credential resolution |
| `FileZillaHostKeyStore`, `FileZillaHostKeyStoreError` | Read modern native trusted-key snapshots and identify native store validation errors |
| `createFileZillaWriter` | Construct a Portline native writer for explicit FileZilla preview/apply |

Readers are synchronous except where the normalized source contract explicitly permits async operations. Reading does not connect. Legacy models have no save method. Native XML changes use the separate guarded writer; identity JSON persistence remains application-owned.

## Shared connection integration

`createDocklineBridge` from `@jalsoedesign/portline-dockline` accepts a source, optional credential provider and explicit trust provider. Its asynchronous `toConfig` produces file-transfer configuration, `toSshConfig` prepares SSH configuration; `createFileAdapter` returns a disconnected adapter; `withFiles` and `withSsh` scope connected sessions. Exact profile paths or normalized profile objects are accepted.

The source supplies credential resolution by default. Connection options select a connection ID and supply runtime authentication, host fingerprints, deadlines and transport policy. Only the matching installed Dockline client is loaded. See the [complete program](/guide/quick-start).

## CLI: filezilla-cli

The package exports `run`, `createFileZillaCliSource`, `checkConnection` and the connection-check option/result/stage/status types. The executable provides search, list, get, source, write-status, write, sync, apply and check. See [complete command inputs](/reference/cli-help), [actual output and exit codes](/reference/cli-output), and the [connection-check contract](/guide/connection-check).

Query commands preserve FileZilla-native output shapes and credential-redaction behavior. The shared Portline engine supplies query and guarded writing infrastructure; FileZilla supplies source selection and its network-check extension. The check uses Dockline and performs no remote writes. Write/sync create previews; apply is explicit and repeats the safeguards.

## Generic connection APIs

Use `@jalsoedesign/dockline-core` for scoped transfers and local file helpers, `dockline-ftp-client` or `dockline-sftp-client` for direct adapters, `dockline-ssh-client` for scoped SSH commands/sudo, and `dockline-keys` for key inspection and conversion. FileZilla is needed when the input is FileZilla settings or trusted-key metadata.
