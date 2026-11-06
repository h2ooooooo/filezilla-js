# Packages and components

| Package | Responsibility |
| --- | --- |
| `@jalsoedesign/filezilla-core` | FileZilla readers/models, selected credentials, metadata, normalized profile source and guarded writer factory |
| `@jalsoedesign/filezilla-cli` | Native profile queries, explicit connection checks and preview/sync/apply/status commands |
| `@jalsoedesign/filezilla-connector-abstract` | FileZilla-specific connector factory and numeric-protocol registry |
| `@jalsoedesign/filezilla-connector-ftp` | Map saved FTP/FTPS settings to Dockline configuration/adapters |
| `@jalsoedesign/filezilla-connector-sftp` | Map saved SFTP settings and import modern FileZilla trusted host keys |

These packages live in the FileZilla repository. Shared Portline packages live in their own repository. Dockline and dockline-keys remain separate from FileZilla and provide generic execution and key handling.

FileZilla connector entry points expose only their integration APIs. Generic adapter classes, errors, pools, encoding helpers and transfer types are imported from Dockline directly. Use package-root imports; the connector packages do not expose generated `dist/*` paths. See [architecture and migration](/guide/dockline), [public API](/reference/public-api) and [exact signatures](/reference/types).

Versions and dependency ranges are declared in each package manifest. The [ecosystem directory](https://h2ooooooo.github.io/portline/ecosystem) links the independent repositories and npm identities without maintaining a second version list.
