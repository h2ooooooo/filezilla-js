**[Read the documentation](https://h2ooooooo.github.io/filezilla-js/)**

# FileZilla TS

Read saved FileZilla sites from Node.js or a CLI, select the configuration you need, and connect through [Dockline](https://h2ooooooo.github.io/dockline/).

## Packages

| Package | Purpose |
| --- | --- |
| `@jalsoedesign/filezilla-core` | Site Manager parsing, saved-site selection, import diagnostics and metadata snapshots |
| `@jalsoedesign/filezilla-cli` | Profile queries, guarded preview/sync/apply/status and a read-only connection check |

Portline supplies shared profile contracts, queries, native storage safeguards and CLI infrastructure. FileZilla retains its application APIs and executable; Dockline supplies transfer and SSH operations. Install built npm dependencies before building this repository. [Development](https://github.com/h2ooooooo/portline/blob/main/docs/development.md).

## Install

Read saved configuration:

```sh
npm install @jalsoedesign/filezilla-core@rc
```

Connect a saved SFTP site and transfer files:

```sh
npm install @jalsoedesign/filezilla-core@rc @jalsoedesign/portline-dockline@rc @jalsoedesign/dockline-sftp-client@rc
```

The [quick start](https://h2ooooooo.github.io/filezilla-js/guide/quick-start.html) covers loading sites, connecting through saved configuration, and uploading or downloading one file.

For [SSH commands through a saved SFTP endpoint](docs/guide/ssh.md), install `@jalsoedesign/dockline-ssh-client` instead of the file-transfer client and use the same bridge's `withSsh` method. The server must permit command execution.

Install the terminal utility:

```sh
npm install -g @jalsoedesign/filezilla-cli@rc
filezilla-js --search example.com --show-password
filezilla-js --help
```

Use Node `^22.22.2 || ^24.15.0 || >=26.0.0` and npm `>=12.0.2` for repository development. Core and the shared connection integration support CommonJS and ESM imports; the CLI package is ESM. Prefer package-root imports.

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

FileZilla core supplies complete Portline profiles and native host-key import without installing transports. The optional shared `@jalsoedesign/portline-dockline` bridge opens scoped file or SSH sessions using independently installed Dockline protocol clients. See the [architecture and migration guide](docs/guide/dockline.md).

See [First release candidate](RELEASE_RC.md) for RC versions and installation commands.
