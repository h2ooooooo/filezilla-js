# Installation

Use Node `^22.22.2 || ^24.15.0 || >=26.0.0`. Repository development uses npm `>=12.0.2`.

## Install from npm

| Use | Command |
| --- | --- |
| Read saved sites | `npm install @jalsoedesign/filezilla-core` |
| Saved FTP/FTPS connections | `npm install @jalsoedesign/filezilla-core @jalsoedesign/filezilla-connector-ftp @jalsoedesign/dockline-core` |
| Saved SFTP connections | `npm install @jalsoedesign/filezilla-core @jalsoedesign/filezilla-connector-sftp @jalsoedesign/dockline-core` |
| CLI in a project | `npm install @jalsoedesign/filezilla-cli` |

Each bridge installs its matching Dockline client. Add `@jalsoedesign/dockline-core` for the shared SDK and local-file helpers. The core reader alone has no FTP or SSH dependency.

## Global CLI

```sh
npm install -g @jalsoedesign/filezilla-cli
filezilla-js --help
```

For a local installation use `npm exec -- filezilla-js --help`. The CLI lists and queries saved sites and offers an explicit read-only connection check. Use the [Dockline CLI](https://h2ooooooo.github.io/dockline/guide/cli.html) for standalone upload, download, list and remove commands.

## TypeScript consumers

```sh
npm install --save-dev typescript @types/node
```

Use Node-targeted module resolution and opt into Node types:

```json
{
    "compilerOptions": {
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "types": ["node"],
        "strict": true
    }
}
```

Keep any additional type entries required by your application. Core is CommonJS with declarations; connectors and CLI are ESM. Use `"type": "module"` in an application that imports the ESM packages.

## Build from source

```sh
git clone https://github.com/h2ooooooo/filezilla-js.git
cd filezilla-js
npm ci
npm run build
```

The private root links the five FileZilla workspaces. Dockline comes from the npm registry; no sibling checkout is required. See [compiler and packaging](/development/compiler).

## Documentation

```sh
npm run docs:install
npm run docs:dev
npm run docs:build
npm run docs:preview
```

Documentation has its own dependency lockfile. The static site is generated into `docs/.vitepress/dist`.

## Runtime boundary

Run the library in Node.js. Browser applications should use an application API that exposes only permitted metadata and operations. See [security](/guide/security).
