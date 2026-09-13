# Paths and metadata

The generic transfer APIs on this page are implemented by the independent **Dockline packages**: `@jalsoedesign/dockline-abstract`, `@jalsoedesign/dockline-ftp-client` and `@jalsoedesign/dockline-sftp-client`. Existing FileZilla connector imports remain supported compatibility exports; saved-site factories and FileZilla host-key import stay in FileZilla JS. See [the project boundary and migration](/guide/dockline).

| Path concept | Meaning | Example |
| --- | --- | --- |
| `Server.path` | Canonical FileZilla selection identity | `Production/Web` |
| Raw `remoteDirectory` | FileZilla encoded starting directory | `1 0 3 srv 3 app` |
| Adapter argument | Remote filesystem path | `assets/logo.svg` or `/srv/app/assets/logo.svg` |

Selection paths escape literal `%` and `/` within names as `%25` and `%2F`. Do not apply that selection encoding to remote filesystem paths. See [querying](/guide/querying).

## Decode the starting directory

`getRemoteDirectory(defaultValue)` returns the default only for an absent/empty raw value. Otherwise it validates a supported encoded path: `1 0 3 srv 3 app` becomes `/srv/app`.

Accepted path types are `DEFAULT`, `UNIX`, `DOS_VIRTUAL` and `CYGWIN` with a zero-length prefix. Invalid segment lengths/separators, unsupported dialects, empty/dot segments and slashes, backslashes, NUL or line breaks inside segments are rejected. A plain `/srv/app` is not valid encoded XML input; direct connector `initialPath` uses an ordinary path instead.

`properties.remoteDirectory` decodes lazily. Reading `properties.host` or searching a site does not decode it. Spreading or serializing the explicit `properties` object reads all enumerable properties and can therefore throw on its decoded directory. Manager/server `toJSON()` instead emits redacted raw metadata without decoding.

## Remote path state

FTP applies `initialPath` with `CWD`; SFTP prefixes relative paths. Both allow absolute paths and neither guarantees confinement. FTP directory creation restores its working directory on success/failure and invalidates an unrestorable session. Root, dot and trailing-slash directory stat cases are supported.

Use forward slashes for direct adapter paths. **Windows path normalization remains upstream:** the optional default FileStorage normalizer changes these into backslashes on Windows and has an incomplete traversal check. Use direct validated paths or a reviewed portable normalizer for nested wrapper operations.

## Links and special files

Listings add runtime `isSymbolicLink` and `isUnsupported` flags to non-directory entries. These are not declared by Flystorage's base `StatEntry`; narrow the result before reading extra fields.

SFTP `stat` uses `lstat` and rejects final symlinks/special files. FTP `stat` rejects a final symlink. Intermediate links and operations that do not first call `stat` remain outside this limited check. Recursive listing does not provide a general containment guarantee.

## Time, size and absence

`lastModifiedMs`/`lastModified()` use milliseconds since Unix epoch and accept zero. SFTP reads the dependency's `modifyTime`. FTP timestamps depend on available listing/MDTM metadata and can be absent; synthetic root/current-directory entries need not have a timestamp. `fileSize` uses bytes and rejects directories.

**SFTP status conversion remains upstream:** a generic SFTP lstat status 4 can be rewritten as “missing” by the dependency, so false from SFTP existence checks is not independently reliable evidence of absence. Permission/error handling and timestamp fixes do not remove this dependency limitation.
