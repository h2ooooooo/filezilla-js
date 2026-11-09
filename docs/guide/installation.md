# Installation

Use Node `^22.22.2 || ^24.15.0 || >=26.0.0`. Repository development uses npm `>=12.0.2`.

## Install from npm

| Use | Command |
| --- | --- |
| Read saved sites | `npm install @jalsoedesign/filezilla-core@rc` |
| Connect saved FTP/FTPS sites | `npm install @jalsoedesign/filezilla-core@rc @jalsoedesign/portline-dockline@rc @jalsoedesign/dockline-ftp-client@rc` |
| Connect saved SFTP sites | `npm install @jalsoedesign/filezilla-core@rc @jalsoedesign/portline-dockline@rc @jalsoedesign/dockline-sftp-client@rc` |
| Run SSH commands through a saved SFTP endpoint | `npm install @jalsoedesign/filezilla-core@rc @jalsoedesign/portline-dockline@rc @jalsoedesign/dockline-ssh-client@rc` |
| CLI in a project | `npm install @jalsoedesign/filezilla-cli@rc` |

The core reader has no FTP or SSH transport dependency. The shared bridge loads independently installed clients and reports an installation command when a required client is absent. Install `@jalsoedesign/dockline-ssh-client` for SSH command sessions.

The CLI's `check` command also needs the matching optional FTP or SFTP client. Metadata queries work without protocol clients. A missing client reports `client-not-installed` with exit code `5` and an installation command.

The [saved-site walkthrough](/guide/quick-start) uses the bridge's scoped file API; no application-specific connector package is required.

## Run a first example

After installing `filezilla-core`, follow [the API quick start](/api/quick-start) to read a synthetic saved site and compare its output. No source checkout, FileZilla installation or server account is needed. For saved connections, continue to [the connection walkthrough](/guide/quick-start).

## Global CLI

```sh
npm install -g @jalsoedesign/filezilla-cli@rc
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

Keep any additional required type entries. Core and the shared bridge are CommonJS packages with declarations and support both `require` and named ESM imports. The CLI package is ESM. Set `"type": "module"` when running the ESM `.js` and `.ts` programs below.

Examples default to TypeScript and include matching JavaScript, MJS and CommonJS variants. Follow [language setup](/guide/code-examples); the `.ts` examples use ESM and top-level `await`, so their run tabs explicitly set `"type": "module"`.

## Node.js and module support

Run the library in Node.js. For browser-facing code, expose only permitted metadata and operations through a server API; see [security](/guide/security).

## Contributing

Cloning, compiling and serving the documentation are contributor workflows. See [compiler and packaging](/development/compiler) and [documentation development](/development/documentation). They are not required to use packages installed from npm.
