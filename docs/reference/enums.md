# Enums and XML types

All enums and types below are exported by `@jalsoedesign/filezilla-core`. Protocol IDs represent saved FileZilla values. Changing existing numeric IDs would reinterpret saved sites.

## ServerProtocol

| ID | Name | Connector |
| --- | --- | --- |
| -1 | UNKNOWN | None |
| 0 | FTP | Explicit FTPS |
| 1 | SFTP | SFTP |
| 2 | HTTP | None |
| 3 | FTPS | Implicit FTPS |
| 4 | FTPES | Explicit FTPS |
| 5 | HTTPS | None |
| 6 | INSECURE_FTP | Plain FTP |
| 7 | S3 | None |
| 8 | STORJ | None |
| 9 | WEBDAV | None |
| 10 | AZURE_FILE | None |
| 11 | AZURE_BLOB | None |
| 12 | SWIFT | None |
| 13 | GOOGLE_CLOUD | None |
| 14 | GOOGLE_DRIVE | None |
| 15 | DROPBOX | None |
| 16 | ONEDRIVE | None |
| 17 | B2 | None |
| 18 | BOX | None |
| 19 | INSECURE_WEBDAV | None |
| 20 | RACKSPACE | None |
| 21 | STORJ_GRANT | None |
| 22 | S3_SSO | None |
| 23 | GOOGLE_CLOUD_SVC_ACC | None |
| 24 | CLOUDFLARE_R2 | None |

`MAX_VALUE` remains an alias of `CLOUDFLARE_R2` to preserve existing numeric values. Use `server.siteProtocolName` for display: it deliberately excludes the sentinel and returns `CLOUDFLARE_R2` for ID 24. Raw numeric-enum reverse lookup still reflects TypeScript's alias behavior.

## ServerType

`ServerType` identifies the saved path dialect. It is separate from [`ServerProtocol`](#serverprotocol), which identifies FTP, SFTP and other protocols. These are the compatibility IDs exported by this reader:

| ID | Member | Remote-directory decoder |
| --- | --- | --- |
| 0 | `DEFAULT` | Supported with no prefix |
| 1 | `UNIX` | Supported with no prefix |
| 2 | `VMS` | Unsupported |
| 3 | `DOS` | Unsupported; native dialect prefers backslashes |
| 4 | `MVS` | Unsupported |
| 5 | `VXWORKS` | Unsupported |
| 6 | `ZVM` | Unsupported |
| 7 | `HPNONSTOP` | Unsupported |
| 8 | `DOS_VIRTUAL` | Supported with no prefix |
| 9 | `CYGWIN` | Supported with no prefix |
| 10 | `DOS_FWD_SLASHES` | Unsupported; native dialect prefers forward slashes |
| 11 | `SERVERTYPE_MAX` | Sentinel, not a saved path type |

See [the exported enum source](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/core/src/enum/ServerType.ts), the [annotated native path example](/guide/how-it-works#decode-filezilla-remote-directories) and [the decoder's grammar](/reference/server#remote-directory-grammar). FileZilla defines its native path types in `src/include/server.h`; the [official upstream source](https://filezilla-project.org/sourcecode.php) is the starting point for those definitions. The table above specifies this library's compatibility values and decoding support.

## LogonType

`LogonType` describes the saved authentication mode. It does not guarantee that credentials are available to the reader.

| ID | Member | Meaning |
| --- | --- | --- |
| 0 | `anonymous` | Anonymous login |
| 1 | `normal` | Username/password login |
| 2 | `ask` | Prompt for credentials in the native UI |
| 3 | `interactive` | Interactive authentication |
| 4 | `account` | Account-based login |
| 5 | `key` | Private-key login; `Keyfile` supplies the saved host-side key path |
| 6 | `profile` | S3 profile |
| 7 | `adc` | Google Cloud Application Default Credentials |
| 8 | `count` | Sentinel |

See [the exported enum source](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/core/src/enum/LogonType.ts) and [credential loading](/guide/site-manager#credentials-and-serialization) for the distinction between saved authentication metadata and supported secret access.

## Other enums

| Enum | Members in numeric order, starting at zero |
| --- | --- |
| `PasvMode` | `MODE_DEFAULT`, `MODE_ACTIVE`, `MODE_PASSIVE` |
| `CharsetEncoding` | `ENCODING_UTF8`, `ENCODING_CUSTOM`, `ENCODING_AUTO` |
| `ServerFormat` | `HOST_ONLY`, `WITH_OPTIONAL_PORT`, `WITH_USER_AND_OPTIONAL_PORT`, `URL`, `URL_WITH_PASSWORD` |

`count` and `SERVERTYPE_MAX` are sentinels. `ServerFormat` is exported metadata; the library currently has no corresponding formatter implementation.

## XML object types

`XmlConfig` contains `FileZilla3: XmlRootFolderConfig`; that root contains `Servers: XmlFolderConfig`. Folder types contain `Server`, `Folder`, and optional `'#text'` for their name. The public constructor supports singleton or array child fields, including mixed nested forms.

`XmlServerConfig` describes FileZilla's field names: `Host`, `Port`, `Protocol`, `Type`, `User`, `Pass`, `Logontype`, `TimezoneOffset`, `PasvMode`, `MaximumMultipleConnections`, `EncodingType`, `CustomEncoding`, `BypassProxy`, `Name`, `Comments`, `LocalDir`, `RemoteDir`, `SyncBrowsing`, `DirectoryComparison`, `Keyfile`.

`Pass` and `Name` may be text or an object with `'#text'` and `'@_encoding'`. XML parsing disables primitive value coercion and global trimming; the reader validates and normalizes supported fields deliberately. Type declarations alone are not validation for arbitrary direct `Server` or connector configuration objects.
