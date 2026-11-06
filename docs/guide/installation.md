# Installation

Use Node `^22.22.2 || ^24.15.0 || >=26.0.0`. Repository development uses npm `>=12.0.2`.

## Install from npm

| Use | Command |
| --- | --- |
| Read saved sites | `npm install @jalsoedesign/filezilla-core` |
| Map saved FTP/FTPS sites into a connector | `npm install @jalsoedesign/filezilla-core @jalsoedesign/filezilla-connector-ftp` |
| Map saved SFTP sites into a connector | `npm install @jalsoedesign/filezilla-core @jalsoedesign/filezilla-connector-sftp` |
| CLI in a project | `npm install @jalsoedesign/filezilla-cli` |

Each FileZilla connector installs its matching Dockline protocol client and shared contracts. Those dependencies do not include `dockline-core`. The core reader alone has no FTP or SSH dependency.

## Use Dockline's file helpers

The [saved-site walkthrough](/guide/quick-start) imports `Dockline` to use `withConnection`, `uploadFile` and `downloadFile`. For those examples, also install:

```sh
npm install @jalsoedesign/dockline-core
```

If using `Factory.fromServer()` and managing the returned connector directly, this extra package is unnecessary.

## Run a first example

After installing `filezilla-core`, follow [the API quick start](/api/quick-start) to read a synthetic saved site and compare its output. No source checkout, FileZilla installation or server account is needed. For saved connections, continue to [the connection walkthrough](/guide/quick-start).

## Global CLI

```sh
npm install -g @jalsoedesign/filezilla-cli
filezilla-js --help
```

For a local installation use `npm exec -- filezilla-js --help`. The CLI lists and queries saved sites and offers an explicit read-only connection check. Use the [Dockline CLI](https://h2ooooooo.github.io/dockline/cli/) for standalone upload, download, list and remove commands.

## TypeScript consumers

```sh
npm install --save-dev typescript tsx @types/node
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

Keep any additional required type entries. Core is CommonJS with declarations; connectors and CLI are ESM. Use `"type": "module"` in an application that imports the ESM packages.

Examples default to TypeScript and include matching JavaScript, MJS and CommonJS variants. Follow [language setup](/guide/code-examples); the `.ts` examples use ESM and top-level `await`, so their run tabs explicitly set `"type": "module"`.

## Node.js and module support

Run the library in Node.js. For browser-facing code, expose only permitted metadata and operations through a server API; see [security](/guide/security).

## Contributing

Cloning, compiling and serving the documentation are contributor workflows. See [compiler and packaging](/development/compiler) and [documentation development](/development/documentation). They are not required to use packages installed from npm.
