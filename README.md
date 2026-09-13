**[Read the documentation](https://h2ooooooo.github.io/filezilla-js/)**

# FileZilla TS

Read saved FileZilla sites from Node.js or a CLI, select the configuration you need, and connect through [Dockline](https://h2ooooooo.github.io/dockline/).

## Packages

| Package | Purpose |
| --- | --- |
| `@jalsoedesign/filezilla-core` | Site Manager parsing, saved-site selection, import diagnostics and metadata snapshots |
| `@jalsoedesign/filezilla-connector-abstract` | FileZilla factories, provider registry and shared Dockline exports |
| `@jalsoedesign/filezilla-connector-ftp` | Saved FTP/FTPS configuration mapped to Dockline |
| `@jalsoedesign/filezilla-connector-sftp` | Saved SFTP configuration and FileZilla host-key import |
| `@jalsoedesign/filezilla-cli` | Saved-site list/get commands and an explicit read-only connection check |

## Install

Read saved configuration:

```sh
npm install @jalsoedesign/filezilla-core
```

Connect a saved SFTP site and transfer files:

```sh
npm install @jalsoedesign/filezilla-core @jalsoedesign/filezilla-connector-sftp @jalsoedesign/dockline-core
```

The [quick start](https://h2ooooooo.github.io/filezilla-js/guide/quick-start.html) covers loading sites, connecting through saved configuration, and uploading or downloading one file.

Install the terminal utility:

```sh
npm install -g @jalsoedesign/filezilla-cli
filezilla-js --help
```

Use Node `^22.22.2 || ^24.15.0 || >=26.0.0` and npm `>=12.0.2` for repository development. Core supports CommonJS; the CLI and connector packages use ESM. Prefer package-root imports.

## Development

```sh
npm ci
npm run lint
npm run build
npm test
npm run check:packages
npm run check:consumer
npm run docs:install
npm run docs:build
```

Dockline is installed from npm. Tests use disposable local servers and public test fixtures. See [release setup](docs/development/releasing.md) for GitHub, Pages and npm publishing instructions.

FileZilla TS is an independent project and is not affiliated with or endorsed by the FileZilla project. Licensed under MIT.
