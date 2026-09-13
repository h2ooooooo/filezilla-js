# Dockline and FileZilla JS

The transfer implementation is provided by the independent [**h2ooooooo/Dockline** monorepo](https://github.com/h2ooooooo/Dockline). FileZilla JS reads saved configuration and maps a selected site into ordinary Dockline connection settings. Dockline has no dependency on FileZilla models, XML, factories or configuration readers.

| Repository | Owns |
| --- | --- |
| FileZilla JS | Site Manager reading, selection, credential decoding, metadata identities/snapshots, FileZilla protocol mapping, read-only FileZilla host-key import and query/check CLI |
| Dockline | FTP/FTPS/SFTP connections, authentication and trust callbacks, streams, local file convenience methods, errors, retries, progress, bandwidth, pools, publication, checksums, copy, traversal and managed known hosts |

## Independently installable packages

| Package | Owns | Runtime dependency boundary |
| --- | --- | --- |
| `@jalsoedesign/dockline-abstract` | Shared configuration, errors, transfer contracts, pools and stream utilities | No FTP or SFTP client |
| `@jalsoedesign/dockline-core` | Shared SDK and protocol selection | Abstract only; detects the installed protocol package on use |
| `@jalsoedesign/dockline-ftp-client` | FTP/FTPS connector, encoding and TLS behavior | Abstract and FTP dependencies; no SSH client |
| `@jalsoedesign/dockline-sftp-client` | SFTP connector, authentication and managed known hosts | Abstract and SSH dependencies; no FTP client |

FileZilla's abstract, FTP and SFTP bridges depend on the corresponding Dockline package. Selecting one bridge does not install the other protocol. The CLI intentionally supports both protocols. Add `@jalsoedesign/dockline-core` separately when you want `Dockline.withConnection` or local-file convenience methods; a missing selected client produces an actionable installation error.

The fifth package, `@jalsoedesign/dockline-cli`, is an optional standalone command-line utility for download, upload, list and remove. It uses YAML connection configuration and independently installed protocol clients. It is not a dependency of FileZilla bridges or the FileZilla CLI; FileZilla's CLI retains its saved-site list/get/check workflow.

## Simple connection configuration

Both concrete FileZilla factories expose static and instance `toConfig(server, options?)` methods. They do not connect, prompt or change the saved configuration. They return a plain `FtpTransferConfig` or `SftpTransferConfig`, accepted by `Dockline.create`, `Dockline.connect` and `Dockline.withConnection`.

`username` and `root` are the common fields. FTP's internal `user`, `secure` and `initialPath` become the shared names and protocol discriminator; SFTP's `initialPath` becomes `root`. Existing trust, credential-provider, timeout, retry, filename and TLS options survive conversion. The returned object may intentionally contain credentials and callbacks; do not log or serialize it as metadata.

| Saved FileZilla protocol | Dockline protocol |
| --- | --- |
| FTP, FTPES | `ftps`, explicit TLS with no plaintext fallback |
| FTPS | `ftps-implicit` |
| INSECURE_FTP | `ftp` |
| SFTP | `sftp` |

The [quick start](/guide/quick-start) loads a selected site's credential, maps its configuration, connects and transfers one local file. The root is a starting directory, not a confinement boundary. Remote permissions and server capabilities still determine which guarantees are possible.

## Existing integrations remain supported

`FtpConnectorFactory.fromServer` and `SftpConnectorFactory.fromServer` still create disconnected adapters. Existing connector packages re-export the actual Dockline classes and errors, preserving class identity and `instanceof` checks within one compatible installed dependency tree. There is no second transport implementation to maintain.

The FileZilla `ConnectorFactory`, numeric-protocol `ConnectorRegistry`, concrete settings factories and `FileZillaHostKeyStore` remain here because they understand FileZilla data. Generic `KnownHostsStore` belongs to Dockline. The compatibility imports in the older transfer guides remain valid and describe the same implementation. New applications without FileZilla configuration should import Dockline directly.

The CLI retains `list`, `get` and the opt-in read-only `check` command. That command uses the FileZilla mapping layer and Dockline transport. Standalone transfers are available through the Dockline CLI.

## Scope and known limits

Saved Site Manager XML and FileZilla's host-key file remain read-only. There is no new XML writer. Identity JSON export and managed Dockline trust persistence are separate APIs with their existing ownership rules.


See the [Dockline documentation](https://h2ooooooo.github.io/dockline/) for generic transfer APIs, protocol configuration and guarantees.
