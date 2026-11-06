# Dependencies and boundaries

FileZilla core interprets native XML and supplies profile/metadata APIs. Its Portline dependencies provide normalized contracts and guarded native writing. FileZilla connector packages depend on Dockline for transports and expose only FileZilla factories, registry and trusted-key import. Generic examples import Dockline directly.

## Runtime layers

| Package | Dependency role |
| --- | --- |
| `filezilla-core` | `fast-xml-parser` for native XML; Portline abstract/platform contracts for profiles and guarded writes |
| `filezilla-connector-abstract` | Portline factory/registry contracts, Flystorage adapter typing and Dockline errors used by FileZilla dispatch |
| `filezilla-connector-ftp` | FileZilla factory contract plus Dockline abstract and FTP client; FileZilla core is a peer |
| `filezilla-connector-sftp` | FileZilla factory contract, Dockline abstract/SFTP client and XML parsing for FileZilla host keys; FileZilla core is a peer |
| `filezilla-cli` | FileZilla readers/factories, shared Portline CLI and Dockline errors; supports both protocol integrations |

`dockline-core` is an application choice for SDK convenience methods, not a required dependency of the FileZilla factories. The protocol clients do not require Dockline core or the other protocol. SSH/SFTP key handling delegates to dockline-keys. No second protocol implementation lives in FileZilla.

Dependency versions, peers and runtime requirements are declared in package manifests. Each repository builds only its own workspaces. Install dependencies normally or explicitly select packed artifacts for unpublished local development; builds do not discover sibling checkouts. Application registry lockfiles can be regenerated once their declared dependency releases are available.

## Development and documentation

The root development tree includes local FTP/SFTP fixtures, TypeScript, Vitest, tsx, lint/style tooling and the Dockline clients used in integration checks. They are not all runtime dependencies of every published package. Tests and runnable demos use disposable local servers and synthetic settings.

The documentation is a private, separately installed VitePress project with its own lockfile. Its build uses checked-in Markdown and does not need application settings or runtime credentials. Public API signatures are generated from built declarations and checked for drift.

## Dependency checks

Use `npm run check:packages`, `npm run check:publication` and `npm run check:consumer` to validate inventories, declared boundaries, imports and isolated TypeScript consumers. Run production, full development and documentation audits separately when reviewing dependencies; their results describe that run, not a permanent security guarantee.

The `ftp-srv` test fixture uses a scoped released UUID override. Documentation overrides VitePress's Vite version. Both select published packages rather than patching installed dependency source; keep their protocol and documentation checks passing when updating them. Review any remaining test-only advisories separately from published runtime dependencies.
