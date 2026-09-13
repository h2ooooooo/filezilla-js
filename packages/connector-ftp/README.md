**[Read the documentation](https://h2ooooooo.github.io/filezilla-js/)**

# @jalsoedesign/filezilla-connector-ftp

Generic transfer classes, errors and tools are implemented by `@jalsoedesign/dockline-ftp-client` and re-exported here for compatibility. FileZilla-specific factories/registry and read-only FileZilla host-key import remain in this repository. Concrete factories support `toConfig(server, options?)` for the shared Dockline SDK as well as existing `fromServer` adapters. See the repository VitePress guide for complete configuration and single-file examples.

[![npm version](https://img.shields.io/npm/v/@jalsoedesign/filezilla-connector-ftp.svg)](https://www.npmjs.com/package/@jalsoedesign/filezilla-connector-ftp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/h2ooooooo/filezilla-js/actions/workflows/ci.yml/badge.svg)](https://github.com/h2ooooooo/filezilla-js/actions/workflows/ci.yml)

FTP and FTPS connector for the FileZilla TS packages.

## Features

- Supports FTP, FTPS (Implicit), and FTPES (Explicit) protocols.
- Integrated with FileZilla's `sitemanager.xml` configuration via `@jalsoedesign/filezilla-core`.
- Uses the shared error hierarchy from `@jalsoedesign/filezilla-connector-abstract`.

## Install

Use Node `^22.22.2 || ^24.15.0 || >=26.0.0`. Install from the public npm registry.

```bash
npm install @jalsoedesign/filezilla-connector-ftp
```

## Usage

```ts
import {getDefaultSiteManager} from '@jalsoedesign/filezilla-core';
import {FtpConnectorFactory} from '@jalsoedesign/filezilla-connector-ftp';

const sm = getDefaultSiteManager();
const site = sm.getServerByPath('Public/My FTP Server');

if (site) {
    const connector = FtpConnectorFactory.fromServer(site);

    try {
        await connector.connect();

        for await (const entry of connector.list('.', {deep: false})) {
            console.log(entry.path, entry.type);
        }
    } finally {
        await connector.disconnect();
    }
}
```

## Documentation

Saved `FTP` and `FTPES` require explicit TLS; plaintext requires `INSECURE_FTP`. Optional credential providers, keepalives and filename controls are described in [FTP options](https://h2ooooooo.github.io/filezilla-js/guide/ftp-options.html). Publication, checksum and copy guarantees are in [advanced transfers](https://h2ooooooo.github.io/filezilla-js/guide/advanced-transfers.html).

For more detailed information, see the documentation:

- [Extended Documentation](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/connector-ftp/docs/extended.MD) - Factory details and error handling examples.
- [Connector Abstract Documentation](../connector-abstract/README.md) - Shared error hierarchy and base classes.

## Testing

To run the FTP connector tests (requires a local FTP server, which is automatically handled by the test suite):

```bash
npm test
```

## License

MIT © [JalsoeDesign](https://www.jalsoedesign.net)
