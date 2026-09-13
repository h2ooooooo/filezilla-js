**[Read the documentation](https://h2ooooooo.github.io/filezilla-js/)**

# @jalsoedesign/filezilla-connector-sftp

Generic transfer classes, errors and tools are implemented by `@jalsoedesign/dockline-sftp-client` and re-exported here for compatibility. FileZilla-specific factories/registry and read-only FileZilla host-key import remain in this repository. Concrete factories support `toConfig(server, options?)` for the shared Dockline SDK as well as existing `fromServer` adapters. See the repository VitePress guide for complete configuration and single-file examples.

[![npm version](https://img.shields.io/npm/v/@jalsoedesign/filezilla-connector-sftp.svg)](https://www.npmjs.com/package/@jalsoedesign/filezilla-connector-sftp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/h2ooooooo/filezilla-js/actions/workflows/ci.yml/badge.svg)](https://github.com/h2ooooooo/filezilla-js/actions/workflows/ci.yml)

SFTP connector for the FileZilla TS packages.

## Features

- SFTP with typed errors, explicit trust, agent/interactive authentication and transfer controls.
- Integrated with FileZilla's `sitemanager.xml` configuration via `@jalsoedesign/filezilla-core`.
- Uses the shared error hierarchy from `@jalsoedesign/filezilla-connector-abstract`.

## Install

Use Node `^22.22.2 || ^24.15.0 || >=26.0.0`. Install from the public npm registry.

```bash
npm install @jalsoedesign/filezilla-connector-sftp
```

## Usage

```ts
import {getDefaultSiteManager} from '@jalsoedesign/filezilla-core';
import {SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';

const sm = getDefaultSiteManager();
const site = sm.getServerByPath('Production/SFTP Server');

if (site) {
    const fingerprint = process.env.SFTP_HOST_FINGERPRINT;

    if (!fingerprint) {
        throw new Error('An independently verified host-key fingerprint is required.');
    }

    const connector = SftpConnectorFactory.fromServer(site, {
        requireTrustPolicy: true,
        hasTrustPolicy: challenge => challenge.fingerprint === fingerprint,
        acceptTrustPolicy: () => false,
    });

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

Site Manager settings do not establish server trust. The example requires a separately verified SHA256 fingerprint and rejects unknown keys. Optional agent/interactive authentication, credential providers, managed known hosts and keepalives are documented in [SSH options](https://h2ooooooo.github.io/filezilla-js/guide/ssh-options.html). See [advanced transfers](https://h2ooooooo.github.io/filezilla-js/guide/advanced-transfers.html) for publication, checksums and copy guarantees.

For more detailed information, see the documentation:

- [Extended Documentation](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/connector-sftp/docs/extended.MD) - Factory details and error handling.
- [Connector Abstract Documentation](../connector-abstract/README.md) - Shared error hierarchy and base classes.

## Testing

To run the SFTP connector tests (requires a local SFTP server, which is automatically handled by the test suite):

```bash
npm test
```

## License

MIT © [JalsoeDesign](https://www.jalsoedesign.net)
