**[Read the documentation](https://h2ooooooo.github.io/filezilla-js/)**

# @jalsoedesign/filezilla-core

Read saved FileZilla sites in JavaScript or TypeScript. Find profiles by name, host, username or other connection details, access saved credentials, and decode remote directory paths.

[![npm version](https://img.shields.io/npm/v/@jalsoedesign/filezilla-core.svg)](https://www.npmjs.com/package/@jalsoedesign/filezilla-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/h2ooooooo/filezilla-js/actions/workflows/ci.yml/badge.svg)](https://github.com/h2ooooooo/filezilla-js/actions/workflows/ci.yml)

Read and query FileZilla `sitemanager.xml` files from TypeScript or JavaScript projects.

## Install

Use Node `^22.22.2 || ^24.15.0 || >=26.0.0`. Install from the public npm registry.

```bash
npm install @jalsoedesign/filezilla-core
```

## Quick Start

```ts
import {getDefaultSiteManager} from '@jalsoedesign/filezilla-core';

// Automatically finds sitemanager.xml on Windows, macOS, or Linux
const siteManager = getDefaultSiteManager();

const site = siteManager.getServerByPath('Production/Web Server');

if (site) {
    console.log(site.properties.host);       // e.g. web.example.com
    console.log(site.getRemoteDirectory());  // e.g. /var/www/html
}
```

## Search profiles

```ts
const matches = siteManager.searchServers('example.com', {fields: 'all'});
```

All-fields search checks every loaded property, including passwords, plus the site path, protocol name and decoded remote directory. Omit the options to search only site names and folder paths. Search does not load additional credentials.

For terminal searches, install [the CLI](../cli/README.md) and run `filezilla-js --search example.com --show-password`.

## Features

- **TypeScript First:** Full type safety included.
- **Auto-discovery:** Automatically finds the FileZilla configuration on all major OSs.
- **Path Resolution:** Converts FileZilla's internal directory format into standard paths.
- **Passwords:** Decodes supported plain/base64 credentials when requested; JSON projections redact passwords.
- **Import reports:** Optional tolerant mode returns independent valid sites and redacted diagnostics.
- **Identity and metadata:** Explicit stable-ID reconciliation plus versioned immutable snapshots and precise diffs.

## Shared connections

`FileZillaProfileSource` exposes complete Portline connection definitions and resolves selected credentials on request. Install `@jalsoedesign/portline-dockline` plus the Dockline FTP, SFTP or SSH client needed for execution. Core does not install transport code.

`FileZillaHostKeyStore` reads an explicit modern FileZilla trusted-key snapshot for shared host verification. See the [saved-site walkthrough](https://h2ooooooo.github.io/filezilla-js/guide/quick-start).

The same source works with `bridge.withSsh` after installing `@jalsoedesign/dockline-ssh-client`; see the [complete SSH command program](https://h2ooooooo.github.io/filezilla-js/guide/ssh). A saved SFTP endpoint must permit command execution. `toConfig` and `toSshConfig` resolve explicit selections without opening sockets; resulting configuration can contain secrets and must not be logged.

Writing and execution use the same normalized definitions but support different fields. Native write planning refuses explicit passive settings, filename encoding, saved trust pins and unsupported native requirements rather than discarding them. Construct supported write intent deliberately; see [writing limits](https://h2ooooooo.github.io/filezilla-js/development/profile-writing#execution-settings-and-write-intent).

## Documentation

Detailed API documentation and references:

- [Import workflows](https://h2ooooooo.github.io/filezilla-js/guide/import-workflows.html) - Report defaults, identity conflicts, persistence ownership and metadata profiles.

- [Extended API Documentation](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/core/docs/extended.MD) - Detailed classes and methods.
- [Enums Reference](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/core/docs/enums.MD) - `ServerProtocol`, `LogonType`, etc.
- [Types Reference](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/core/docs/types.MD) - Raw interfaces and types with descriptions.

## Testing

To run the core library tests:

```bash
npm test
```

## License

MIT © [JalsoeDesign](https://www.jalsoedesign.net)

Normalized profiles use FileZillaProfileSource. Explicit native settings changes use createFileZillaWriter with Portline preview/apply, lock checks and backups; legacy SiteManager/Server edits remain in memory.
