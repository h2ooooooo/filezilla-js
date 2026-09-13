**[Read the documentation](https://h2ooooooo.github.io/filezilla-js/)**

# @jalsoedesign/filezilla-core

Core remains independent of Dockline and all transport dependencies. Use a FileZilla concrete factory `toConfig` to convert a selected Server for the separate Dockline SDK; saved Site Manager XML remains read-only.

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

## Features

- **TypeScript First:** Full type safety included.
- **Auto-discovery:** Automatically finds the FileZilla configuration on all major OSs.
- **Path Resolution:** Converts FileZilla's internal directory format into standard paths.
- **Passwords:** Decodes supported plain/base64 credentials when requested; JSON projections redact passwords.
- **Import reports:** Optional tolerant mode returns independent valid sites and redacted diagnostics.
- **Identity and metadata:** Explicit stable-ID reconciliation plus versioned immutable snapshots and precise diffs.

## Connectors

While `@jalsoedesign/filezilla-core` handles the configuration parsing, you can use the dedicated connectors to interact with the files:

- [`@jalsoedesign/filezilla-connector-ftp`](https://www.npmjs.com/package/@jalsoedesign/filezilla-connector-ftp) - High-level API for FTP, FTPS, and FTPES.
- [`@jalsoedesign/filezilla-connector-sftp`](https://www.npmjs.com/package/@jalsoedesign/filezilla-connector-sftp) - High-level API for SFTP.

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
