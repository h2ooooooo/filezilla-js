**[Read the documentation](https://h2ooooooo.github.io/filezilla-js/)**

# FileZilla TS

Read saved FileZilla sites from Node.js or a CLI, select the configuration you need, and connect through [Dockline](https://h2ooooooo.github.io/dockline/).

## Packages

| Package | Purpose |
| --- | --- |
| `@jalsoedesign/filezilla-core` | Site Manager parsing, saved-site selection, import diagnostics and metadata snapshots |
| `@jalsoedesign/filezilla-connector-abstract` | FileZilla-specific factories and numeric-protocol provider registry |
| `@jalsoedesign/filezilla-connector-ftp` | Saved FTP/FTPS configuration mapped to Dockline |
| `@jalsoedesign/filezilla-connector-sftp` | Saved SFTP configuration and FileZilla host-key import |
| `@jalsoedesign/filezilla-cli` | Profile queries, guarded preview/sync/apply/status and a read-only connection check |

Portline supplies shared profile contracts, queries, native storage safeguards and CLI infrastructure. FileZilla retains its application APIs and executable; Dockline supplies transfer and SSH operations. Install built npm dependencies before building this repository. [Development](https://github.com/h2ooooooo/portline/blob/main/docs/development.md).

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
filezilla-js --search example.com --show-password
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


FileZilla TS is an independent project and is not affiliated with or endorsed by the FileZilla project. Licensed under MIT.


Related libraries: [Portline ecosystem directory](https://h2ooooooo.github.io/portline/ecosystem).

## Runnable examples

[Run a local demo](docs/guide/local-demo.md) for one-command examples and captured output. Transfer demos start temporary loopback-only protocol servers.

Generic FtpConnector/SftpConnector classes, KnownHostsStore, errors and transfer utilities are imported directly from Dockline. FileZilla connector packages expose only saved-site factories, FileZilla registry contracts and FileZilla host-key import. See the [architecture and migration guide](docs/guide/dockline.md).
