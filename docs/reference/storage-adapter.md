# Storage adapter API

The generic transfer APIs on this page are implemented by the independent **Dockline packages**: `@jalsoedesign/dockline-abstract`, `@jalsoedesign/dockline-ftp-client` and `@jalsoedesign/dockline-sftp-client`. Existing FileZilla connector imports remain supported compatibility exports; saved-site factories and FileZilla host-key import stay in FileZilla JS. See [the project boundary and migration](/guide/dockline).

Both connectors implement Flystorage's `StorageAdapter` and extend applicable options with `ConnectorOperationOptions`. For portable direct calls, pass `{}` and use `{deep: false}` for shallow listing. FTP signatures require their operation options; SFTP supplies defaults for many operations. `connect(options?)` takes shared controls; `disconnect()` does not.

## Operations

| Method | Return | Behavior |
| --- | --- | --- |
| `connect(options?)` | `Promise<void>` | Explicit connection; coalesced/serialized setup |
| `disconnect()` | `Promise<void>` | Close owned session and interrupt active work |
| `write(path, contents, options)` | `Promise<void>` | Readable or fresh-stream factory; overwriting upload |
| `read(path, options)` | `Promise<FileContents>` | Stream returned before transfer completion |
| `deleteFile(path, options)` | `Promise<void>` | Delete named file; no automatic started-mutation replay |
| `createDirectory(path, options)` | `Promise<void>` | Recursive parents; FTP restores CWD |
| `deleteDirectory(path, options)` | `Promise<void>` | Recursive deletion |
| `fileExists` / `directoryExists` | `Promise<boolean>` | Stat/type check; see unresolved SFTP status conversion |
| `list(path, options)` | `AsyncGenerator<StatEntry>` | Shallow/deep, caller-relative or absolute path basis |
| `moveFile(from, to, options)` | `Promise<void>` | Remote rename |
| `copyFile(from, to, options)` | `Promise<void>` | Bounded client-streamed copy and staged publication; explicit overwrite policy |
| `stat(path, options)` | `Promise<StatEntry>` | File/directory metadata; limited final-link checks |
| `lastModified(path, options)` | `Promise<number>` | Milliseconds since epoch, including zero |
| `fileSize(path, options)` | `Promise<number>` | Bytes; directory requests rejected |

Flystorage option shapes remain `WriteOptions`, `CreateDirectoryOptions`, `AdapterListOptions`, `MoveFileOptions`, `CopyFileOptions` and otherwise `MiscellaneousOptions`, intersected with shared controls. `TransferContents`/`TransferSourceFactory` are shared types; FTP also exports `FtpUploadSource`.

## Lifecycle and replay contract

FTP queues complete operations, including read consumption/final control reply. SFTP shares an in-flight connection attempt and tracks owned stream lifetimes. Cancellation destroys owned streams and deadlines reject stalled work.

Automatic reconnection defaults to false. The retry default is three extra eligible transient attempts. Initial/explicit connection attempts may retry; established-operation replay requires appropriate reconnection policy and replay safety. Returned reads, one-shot uploads and started mutations are not universally replayable. Fresh upload factories explicitly permit complete overwriting replay. See [transfers](/guide/transfers).

## Unsupported methods

Both adapters throw shared `NotSupportedError` for `changeVisibility`, `visibility`, `publicUrl`, `temporaryUrl` and `mimeType`. `checksum` supports negotiated FTP hashing or explicitly requested streamed hashing; it defaults to server-only. Resume and server-native copy remain unsupported. Use `capabilities()` to separate adapter support from unknown server capabilities.

## Metadata and unresolved dependencies

Entries include type, path, file/directory flags, optional millisecond timestamp and file size. Non-directory listings add runtime `isSymbolicLink`/`isUnsupported`; the base declaration requires narrowing for these fields. SFTP uses `modifyTime`; FTP supports root/dot/trailing-slash directory queries but cannot always supply timestamps.

**SFTP status conversion:** upstream SFTP lstat can turn generic status 4 into missing, affecting existence checks. **Windows path normalization:** default Flystorage normalization changes separators and misses some traversal inputs on Windows. These remain unresolved; direct adapter improvements do not repair external dependency behavior.

The new [transfer tools](/guide/advanced-transfers) expose `publishFile`, `checksumDetails`, `copyFileWithStrategy`, `walk`, progress and bandwidth. [ConnectorPool](/guide/connection-pools) owns bounded independent sessions; [KnownHostsStore](/guide/ssh-options) provides optional explicit trust persistence. Publication guarantees depend on the protocol: SFTP no-replace rename and optional POSIX atomic replacement are distinct; FTP replacement is explicitly non-atomic. Transactions, general remote containment and symlink prevention remain outside these APIs. Keep deployment policy in the application.


## Additional direct connector methods

| Method | Return | Purpose |
| --- | --- | --- |
| `capabilities(options?)` | `Promise<ConnectorCapabilities>` | Adapter/server support states; optional negotiation |
| `checksumDetails(path, options?)` | `Promise<ChecksumResult>` | Algorithm, actual strategy and digest |
| `publishFile(path, contents, options?)` | `Promise<PublicationResult>` | Owned staging, verification and explicit rename policy |
| `copyFileWithStrategy(from, to, options?)` | `Promise<CopyResult>` | Detailed copy strategy and publication result on both connectors |
| `walk(path, options?)` | `{entries, result}` | Bounded traversal with explicit completeness |
| `createDirectoryExclusive(path, options?)` | `Promise<void>` | Establish ownership without accepting an existing directory |
| `removeEmptyDirectory(path, options?)` | `Promise<void>` | Refuse non-empty cleanup |
| `validatePublicationOptions(options)` | `void` | Synchronous rejection of unsupported overwrite/atomic policy before mutation |
| `renameFile(from, to, options)` | `Promise<{atomic: boolean}>` | Explicit replace/no-replace and atomic requirement |

Shared option and result interfaces are exported from `@jalsoedesign/filezilla-connector-abstract`. See the guides for defaults, error state and protocol restrictions.
