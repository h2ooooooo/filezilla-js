# Public API index

Generic transfer exports now resolve to Dockline. FileZilla retains its reader, metadata models, saved-site factories, registry and FileZilla host-key importer. Both factories add static and instance `toConfig(server, options?)`; see [Dockline integration](/guide/dockline).

## Core

| Exports | Reference |
| --- | --- |
| `SiteManager`, `getSiteManager`, `getDefaultSiteManager`, `readSiteManagerReport`; `SiteManagerReadOptions`, `SiteImportDiagnostic`, `SiteManagerImportReport` | [Reading and report defaults](/reference/site-manager) |
| `Server`, `ServerProperties`, `ServerPropertiesExtended` | [Server properties](/reference/server) |
| `SiteIdentityStore`; `SiteIdentityEndpoint`, `SiteIdentityRecord`, `SiteIdentityData`, `SiteIdentityConflict`, `SiteIdentityReconcileOptions`, `SiteIdentityReconcileResult` | [Stable IDs and explicit persistence](/guide/import-workflows#keep-a-stable-site-selection) |
| `createMetadataSnapshot`, `parseMetadataSnapshot`, `diffMetadata`, `MetadataSnapshotError`; `MetadataProfile`, `MetadataSite`, `MetadataSnapshot`, `MetadataSnapshotOptions`, `MetadataFieldChange`, `MetadataDiff` | [Immutable metadata](/guide/import-workflows#create-immutable-metadata-snapshots) |
| `CharsetEncoding`, `LogonType`, `PasvMode`, `ServerFormat`, `ServerProtocol`, `ServerType`; XML and server-tree types | [Enums and XML contracts](/reference/enums) |

Core readers are synchronous and do not connect. Identity/schema data contain no credentials, but can expose connection metadata. Saved XML write-back and identity-store file persistence are application responsibilities.

## Shared connector package

| Exports | Reference |
| --- | --- |
| `ConnectorFactory<TConnector, TOptions>` | [Factories](/reference/factories) |
| Shared error classes and `ConnectionStage` | [Complete error reference](/reference/errors) |
| `ConnectorOperationOptions`, `ResolvedConnectorOperationOptions`, `TransferContents`, `TransferSourceFactory`, `resolveOperationOptions`, `isTransientError` | [Configuration and precedence](/reference/configuration) |
| `ConnectorProtocol`, `CredentialContext`, `ConnectorCredentials`, `CredentialProvider`, `KeepaliveOptions`, `ConnectionStateEvent`, `ConnectorConnectionOptions` | [Connection options](/reference/configuration#new-optional-controls), [credential variants](/guide/ssh-options#pick-an-authentication-method) |
| `ConnectorPool`, `PoolConnection`, `PoolOptions`, `ConnectionLease` | [Pool quota and resource lifetime](/guide/connection-pools) |
| `ConnectorRegistry`, `RegisteredProvider`, `Registration` | [Explicit typed registration](/guide/connection-pools#explicit-connector-registry) |
| `BandwidthBudget`, `TransferDirection`, `TransferProgressEvent`, `TransferMonitor`, `createTransferMonitor` | [Progress and rate budgets](/guide/advanced-transfers#progress-and-bandwidth), implementation helpers below |
| `TransferConnector`, `RenameOptions`, `ChecksumDetailsOptions`, `ChecksumResult`, `PublishFileOptions`, `PublicationResult`, `CopyStrategyOptions`, `CopyResult`, `WalkOptions`, `WalkResult` | [Transfer contracts](/guide/advanced-transfers) |
| `checksumDetails`, `publishFile`, `copyFileWithStrategy`, `walk` | [Transfer tools](/guide/advanced-transfers); standalone helpers take a connector as their first argument |
| `SupportState`, `Capability`, `ConnectorCapabilities`, `describeCapabilities` | [Capability discovery](/guide/advanced-transfers#capability-discovery) |

### Helpers for connector implementers

Most applications use the concrete methods and let their connector manage lifecycle. These exported lower-level helpers do not add session management on their own:

| Helper | Contract |
| --- | --- |
| `checkAbort(signal?)` | Throw shared `OperationAbortedError` if already cancelled; does not subscribe to future aborts. |
| `toReadable(contents)` | Convert the Node/Flystorage read-content forms accepted by the helper into a Node Readable; it does not consume or close the result. |
| `createTransferMonitor(options, direction, attempt, path?)` | Return `{stream, complete, fail, dispose}`. Pipe bytes through `stream`; call `complete()` only after full protocol success and caller consumption, `fail(error)` on failure, and release listeners with `dispose()`. EOF alone is insufficient confirmation. |
| `BandwidthBudget.consume(bytes, signal?, direction?)` | Wait for FIFO rate accounting; direction defaults to upload. Share the same instance for an aggregate upload budget and a separate aggregate download budget. |
| `emitConnectionState(callback, event)` | Send a frozen observation; synchronous callback throws and rejected promises are ignored. |
| `classifyConnectionError(error, stage)` | Classify an already sanitized transport failure; retain specific existing shared error identities. It is not a raw-error sanitizer. |
| `describeCapabilities(protocol, features?)` | Produce a frozen versioned report without connecting. Pass advertisements only from the current verified session; omission means inventory was not requested. |

An adapter supplied to standalone publication/copy helpers must implement `TransferConnector`, including synchronous `validatePublicationOptions(options)` before mutation, truly exclusive directory creation, nonrecursive empty-directory removal and explicit rename policy. A generic Flystorage adapter without these guarantees is insufficient.

## FTP and SFTP

Both export their connector/config, factory/options, `ConnectorOperationOptions` and shared error constructors. Their direct [storage methods](/reference/storage-adapter) include detailed checksum, copy, publication, traversal and capabilities APIs in addition to the base Flystorage adapter methods.

FTP additionally exports `FtpUploadSource`, `FtpFilenameEncodingOptions`, `FtpFilenameEncoding`, `ConnectorConnectionOptions`, `CredentialProvider` and `ConnectionStateEvent`. `serverFeatures(options?)` reads FEAT; `serverChecksum(path, algorithm, options)` requires advertised supported hashing. [FTP options](/guide/ftp-options) defines supported encodings, keepalive serialization and protocol guarantees.

SFTP additionally exports `SftpHostKeyChallenge`, `SftpTrustPolicy`, `SftpHostVerifier`, `SftpKeyboardInteractive`, `SftpKeyboardInteractiveChallenge`, `FileZillaHostKeyStore`, `KnownHostsStore`, `KnownHostsConflictError`, `KnownHostsStoreOptions`, `KnownHostEntry`, `KnownHostInspection` and `KnownHostApproval`. [Host trust](/guide/sftp) and [SSH options](/guide/ssh-options) describe authentication and both store APIs. `KeyAuthError` remains a deprecated alias.

## CLI

The executable provides `list`, `get` and `check`. The package root exports `run`, `checkConnection`, `ConnectionCheckOptions`, `ConnectionCheckResult`, `ConnectionCheckStage` and `ConnectionCheckStatus`. [CLI reference](/reference/cli) separates permissive legacy query parsing from strict read-only check flags and its stable JSON/exit contract.

`examples/transfer-recipes.ts` is intentionally packaged source, not an export-map entry or CLI subcommand. Copy it into an application and adapt the typed functions as described in [transfer recipes](/guide/transfer-recipes).
