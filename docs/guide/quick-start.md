# Quick start

FileZilla JS supplies saved-site configuration. [Dockline](/guide/dockline) connects and transfers through a shared API. For the npm packages used by these examples, see [installation](/guide/installation). Importing or mapping a site does not open a connection.

## Load saved sites

`getSiteManager` accepts an explicit Site Manager path. An explicit path lets you control credential loading. The legacy `getDefaultSiteManager()` convenience function takes no options and includes supported saved credentials by default.

```ts
import {getSiteManager} from '@jalsoedesign/filezilla-core';

const manager = getSiteManager('./sitemanager.xml', {
    includePasswords: false,
});

for (const site of manager.getServers()) {
    console.log(site.path, site.properties.host, site.siteProtocolName);
}

const selected = manager.getServerByPath('Production/Web');

if (!selected) {
    throw new Error('The selected site does not exist.');
}
```

Exact paths are case-sensitive. Search is case-insensitive and may return multiple sites. Copy the returned `site.path` when retaining a selection; literal slashes and percent signs in names are encoded as `%2F` and `%25`. Metadata reads leave passwords unloaded and do not decode unrelated remote-directory values.

## Load one SFTP site, connect and upload one file

Install `@jalsoedesign/filezilla-core`, `@jalsoedesign/filezilla-connector-sftp` and `@jalsoedesign/dockline-core` from npm. The SFTP bridge brings `@jalsoedesign/dockline-sftp-client`; FTP dependencies are unnecessary for this example.

This complete example loads supported credentials for only `Production/Web`, converts the saved SFTP configuration, verifies the host key against an independently obtained fingerprint, and uploads one local file. The remote filename is relative to the saved starting directory.

```ts
import {getSiteManager} from '@jalsoedesign/filezilla-core';
import {SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';
import {Dockline} from '@jalsoedesign/dockline-core';

const selectedPath = 'Production/Web';
const manager = getSiteManager('./sitemanager.xml', {
    credentialPath: selectedPath,
});
const site = manager.getServerByPath(selectedPath);
const fingerprint = process.env.SFTP_HOST_FINGERPRINT;

if (!site) {
    throw new Error('The selected site does not exist.');
}

if (!fingerprint) {
    throw new Error('Set SFTP_HOST_FINGERPRINT to an independently verified SHA256 fingerprint.');
}

const config = SftpConnectorFactory.toConfig(site, {
    requireTrustPolicy: true,
    hasTrustPolicy: challenge => challenge.fingerprint === fingerprint,
    acceptTrustPolicy: () => false,
});

await Dockline.withConnection(config, async remote => {
    await remote.uploadFile('./dist/index.html', 'index.html');
});
```

`withConnection` connects and closes the session when the callback settles, including on failure. `uploadFile` opens and consumes the local file; no stream plumbing is needed. Ordinary uploads replace an existing remote file by default. Pass `overwrite: 'fail'` to request supported no-replace publication; FTP cannot offer that portable guarantee. Downloads fail if the local destination exists unless replacement is explicitly selected. Unsupported server guarantees still produce typed errors; a shared API does not create capabilities a server lacks.

For saved ask/interactive modes, provide an explicit credential provider or the supported interactive option instead of assuming the reader can retrieve an unsaved password. [SFTP authentication and trust](/guide/sftp) covers key files, agents, prompts and the read-only FileZilla trust importer. Configuration returned by `toConfig` may contain credentials; avoid logging it.

## Download one file

Use the same connection configuration. Remote paths come first for downloads; local paths come first for uploads.

```ts
await Dockline.withConnection(config, async remote => {
    await remote.downloadFile('logs/latest.log', './latest.log');
});
```

Both local file methods await full completion. Use the lower-level connector APIs for streams, pools or server-aware publication policies. [Transfer guarantees](/guide/advanced-transfers) explains explicit overwrite, integrity checks and uncertain final rename outcomes.

## Connect through a saved FTP or FTPS configuration

Use `@jalsoedesign/filezilla-connector-ftp` with `@jalsoedesign/filezilla-core` and `@jalsoedesign/dockline-core`. The FTP bridge brings `@jalsoedesign/dockline-ftp-client`; SFTP dependencies are unnecessary.

`toConfig` preserves FileZilla's TLS meaning: saved FTP/FTPES require explicit TLS, FTPS uses implicit TLS, and INSECURE_FTP selects plaintext. No protocol choice is inferred from the port alone.

```ts
import {getSiteManager} from '@jalsoedesign/filezilla-core';
import {FtpConnectorFactory} from '@jalsoedesign/filezilla-connector-ftp';
import {Dockline} from '@jalsoedesign/dockline-core';

const selectedPath = 'Production/FTP';
const manager = getSiteManager('./sitemanager.xml', {
    credentialPath: selectedPath,
});
const site = manager.getServerByPath(selectedPath);

if (!site) {
    throw new Error('The selected site does not exist.');
}

const config = FtpConnectorFactory.toConfig(site);

await Dockline.withConnection(config, async remote => {
    await remote.uploadFile('./dist/index.html', 'index.html', {
        overwrite: 'replace',
    });
});
```

FTP servers cannot provide every portable no-clobber or atomic publication guarantee. This example explicitly permits replacement. Keep TLS certificate validation enabled; [FTP options](/guide/ftp-options) covers custom CAs, passive mode, encoding and keepalives.

## Compatibility APIs

Existing `Factory.fromServer(site, options)` code still works. It returns the same Dockline connector class through a compatibility export; call `connect()`, consume returned resources and `disconnect()` in a `finally` block. Start new application code with `toConfig` and the Dockline SDK when local file convenience methods suit the task.

The reader parses the complete file but does not retain original XML. Only the selected normalized record receives supported credentials. Manager and Server JSON projections omit passwords; explicit property access can expose intentionally loaded credentials. Persistent site identity and revalidation workflows are described in [import workflows](/guide/import-workflows).
