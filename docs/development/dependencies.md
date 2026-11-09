# Dependencies and boundaries

FileZilla core depends on its XML parser and Portline contracts/platform infrastructure. It does not install Dockline. The CLI uses the shared `@jalsoedesign/portline-dockline` integration for explicit connection checks.

The optional shared integration loads only the Dockline client needed by the selected operation. FTP/FTPS uses `@jalsoedesign/dockline-ftp-client`, SFTP uses `@jalsoedesign/dockline-sftp-client`, and SSH commands use `@jalsoedesign/dockline-ssh-client`. Missing clients report an installation command. Readers remain usable without transport packages.

Each repository builds only its own workspaces. Install declared dependencies or explicitly selected built package artifacts for unpublished local development. Build scripts do not search sibling checkouts. Published manifests and lockfiles must use portable registry dependencies.

Repository development also installs protocol clients, loopback fixtures, TypeScript, Vitest and lint tooling. These are not core runtime dependencies. Documentation has its own private installation and lockfile.

Run `npm run check:packages`, `npm run check:consumer`, `npm run lint`, `npm run build` and the relevant tests before release. Generated API signatures are checked against built public declarations.
