# Packages and components

| Package | Responsibility |
| --- | --- |
| `@jalsoedesign/filezilla-core` | Native readers/models, credential provider, complete Portline profiles, host-key import and guarded writer factory |
| `@jalsoedesign/filezilla-cli` | Queries, connection checks and preview/sync/apply/status commands |
| `@jalsoedesign/portline-dockline` | Optional shared conversion and scoped connection API for all Portline readers |
| Dockline protocol clients | Optional execution of FTP/FTPS, SFTP or SSH operations |

The public FileZilla packages are core and CLI. Native interpretation stays in FileZilla; execution integration lives in Portline. Protocol regression workspaces are private test infrastructure.

Use package-root imports. Versions and dependency ranges are declared in manifests. See [installation](/guide/installation), [architecture](/guide/dockline), [public APIs](/reference/public-api) and [TypeScript signatures](/reference/types).
