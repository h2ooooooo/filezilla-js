# Packages and components

| Package | Manifest version | Responsibility |
| --- | --- | --- |
| @jalsoedesign/filezilla-core | 1.0.0 | SiteManager, Server, readers, selected credentials, metadata workflows and enums |
| @jalsoedesign/filezilla-cli | 1.0.0 | Local list/get queries and an opt-in read-only network check |
| @jalsoedesign/filezilla-connector-abstract | 1.0.0 | FileZilla factory/registry contracts and Dockline compatibility exports |
| @jalsoedesign/filezilla-connector-ftp | 1.0.0 | Saved FTP/FTPS configuration conversion and Dockline FTP compatibility exports |
| @jalsoedesign/filezilla-connector-sftp | 1.0.0 | Saved SFTP conversion, read-only FileZilla host-key import and Dockline SFTP compatibility exports |
| @jalsoedesign/dockline-abstract | 1.0.0 | Shared contracts, configuration, errors, pools and transfer tools; no protocol client |
| @jalsoedesign/dockline-core | 1.0.0 | Shared SDK that selects an installed protocol client |
| @jalsoedesign/dockline-ftp-client | 1.0.0 | FTP/FTPS connector and encoding; no SSH dependency |
| @jalsoedesign/dockline-sftp-client | 1.0.0 | SFTP connector, authentication and trust; no FTP dependency |
| @jalsoedesign/dockline-cli | 1.0.0 | Optional YAML-configured transfer commands; not a FileZilla dependency |

## Public entry points

FileZilla packages preserve root exports and existing `./dist/*` compatibility paths. Generic FileZilla exports are thin re-exports of Dockline's actual classes/types. FileZilla owns `ConnectorFactory`, numeric `ConnectorRegistry`, concrete factories and `FileZillaHostKeyStore`; all generic transfer behavior has one implementation in Dockline.

Dockline exposes four independent library package roots and an optional `@jalsoedesign/dockline-cli` package. `@jalsoedesign/dockline-core` loads the configured protocol package only when used and reports a missing package clearly. FileZilla factory `toConfig` methods return its `FtpTransferConfig` or `SftpTransferConfig`. See [factories](/reference/factories) and [quick start](/guide/quick-start).

Core is CommonJS; CLI/bridges and Dockline are ESM. These are Node packages. Browser UI, dialogs and a background daemon belong to the application; VitePress's Vue dependency belongs only to documentation.

Package allowlists retain generated runtime/declarations, MIT licenses and README/package metadata. CLI additionally includes its reviewed `examples/transfer-recipes.ts`. Root package inventory checks all five FileZilla packages; the isolated consumer check packs the five FileZilla packages and installs their Dockline dependencies from npm, then verifies strict types, class identity and the built CLI.

See the [public API index](/reference/public-api), [compiler](/development/compiler) and [Dockline split](/guide/dockline) for ownership and compatibility details.
