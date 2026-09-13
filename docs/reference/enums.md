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

## Other enums

| Enum | Members in numeric order, starting at zero |
| --- | --- |
| `LogonType` | `anonymous`, `normal`, `ask`, `interactive`, `account`, `key`, `profile`, `adc`, `count` |
| `PasvMode` | `MODE_DEFAULT`, `MODE_ACTIVE`, `MODE_PASSIVE` |
| `CharsetEncoding` | `ENCODING_UTF8`, `ENCODING_CUSTOM`, `ENCODING_AUTO` |
| `ServerType` | `DEFAULT`, `UNIX`, `VMS`, `DOS`, `MVS`, `VXWORKS`, `ZVM`, `HPNONSTOP`, `DOS_VIRTUAL`, `CYGWIN`, `DOS_FWD_SLASHES`, `SERVERTYPE_MAX` |
| `ServerFormat` | `HOST_ONLY`, `WITH_OPTIONAL_PORT`, `WITH_USER_AND_OPTIONAL_PORT`, `URL`, `URL_WITH_PASSWORD` |

`count` and `SERVERTYPE_MAX` are sentinels. `ServerFormat` is exported metadata; the library currently has no corresponding formatter implementation.

## XML object types

`XmlConfig` contains `FileZilla3: XmlRootFolderConfig`; that root contains `Servers: XmlFolderConfig`. Folder types contain `Server`, `Folder`, and optional `'#text'` for their name. The public constructor supports singleton or array child fields, including mixed nested forms.

`XmlServerConfig` describes FileZilla's field names: `Host`, `Port`, `Protocol`, `Type`, `User`, `Pass`, `Logontype`, `TimezoneOffset`, `PasvMode`, `MaximumMultipleConnections`, `EncodingType`, `CustomEncoding`, `BypassProxy`, `Name`, `Comments`, `LocalDir`, `RemoteDir`, `SyncBrowsing`, `DirectoryComparison`, `Keyfile`.

`Pass` and `Name` may be text or an object with `'#text'` and `'@_encoding'`. XML parsing disables primitive value coercion and global trimming; the reader validates and normalizes supported fields deliberately. Type declarations alone are not validation for arbitrary direct `Server` or connector configuration objects.
