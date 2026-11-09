# Connect a saved FileZilla site

FileZilla JS supplies saved-site configuration; Dockline connects and transfers. Start with [the metadata-only quick start](/api/quick-start) if only reading settings. These complete programs deliberately connect and write one remote file.

## Load saved sites

Use an explicit XML path and a canonical selection returned by `manager.getServers()`. The [reader program](/api/quick-start) shows all four language variants. Exact selection is case-sensitive; search may return multiple records. The normalized source reads metadata first and resolves supported saved credentials only for the selected connection.

## Load one SFTP site, connect and upload one file

```sh
npm install @jalsoedesign/filezilla-core@rc @jalsoedesign/portline-dockline@rc @jalsoedesign/dockline-sftp-client@rc
```

Use an existing SFTP site named `Production/Web` with saved normal/password or key-file authentication. Create `hello.txt` on the host. The server's saved starting directory must exist and allow writes. The metadata-only `Demo` fixture does not supply a server or credentials. Ask/interactive modes require [explicit credential handlers](/guide/ssh-options).

Interactive terminal runs can omit the fingerprint and confirm the displayed server key. For unattended runs, supply an independently verified host fingerprint in the environment:

::: code-group

```powershell [PowerShell]
$env:SFTP_HOST_FINGERPRINT = "SHA256:your-verified-server-fingerprint"
```

```sh [macOS / Linux]
export SFTP_HOST_FINGERPRINT="SHA256:your-verified-server-fingerprint"
```

:::

For an encrypted saved private key, also supply `SFTP_KEY_PASSPHRASE` through the environment or replace that input with a secret-provider integration. Dockline reads supported OpenSSH, PPK v2/v3 and PEM key contents in memory.

Save `saved-sftp.ts` by default, or the filename in the selected language tab. Download: <a href="/examples/saved-sftp.ts" download="saved-sftp.ts">TypeScript</a> · <a href="/examples/saved-sftp.js" download="saved-sftp.js">JavaScript</a> · <a href="/examples/saved-sftp.mjs" download="saved-sftp.mjs">MJS</a> · <a href="/examples/saved-sftp.cjs" download="saved-sftp.cjs">CommonJS</a>

::: code-group

```ts [TypeScript]
// saved-sftp.ts
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const [filename = './sitemanager.xml', selectedPath = 'Production/Web'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const bridge = createDocklineBridge({source});
const fingerprint = process.env.SFTP_HOST_FINGERPRINT;

if (!fingerprint && !(process.stdin.isTTY && process.stderr.isTTY)) {
    throw new Error('Set SFTP_HOST_FINGERPRINT to an independently verified SHA256 fingerprint.');
}

await bridge.withFiles(selectedPath, async remote => {
    // Upload host source './hello.txt' to server destination 'dockline-hello.txt'.
    await remote.uploadFile('./hello.txt', 'dockline-hello.txt');
    console.log('Uploaded dockline-hello.txt.');

    // Download server source 'dockline-hello.txt'
    // to host destination './downloaded-hello.txt'.
    await remote.downloadFile('dockline-hello.txt', './downloaded-hello.txt');
    console.log('Downloaded downloaded-hello.txt.');
}, {
    hostFingerprint: fingerprint,
    passphrase: process.env.SFTP_KEY_PASSPHRASE,
});

console.log('Connection closed.');
```

```js [JavaScript]
// saved-sftp.js
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const [filename = './sitemanager.xml', selectedPath = 'Production/Web'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const bridge = createDocklineBridge({source});
const fingerprint = process.env.SFTP_HOST_FINGERPRINT;

if (!fingerprint && !(process.stdin.isTTY && process.stderr.isTTY)) {
    throw new Error('Set SFTP_HOST_FINGERPRINT to an independently verified SHA256 fingerprint.');
}

await bridge.withFiles(selectedPath, async remote => {
    // Upload host source './hello.txt' to server destination 'dockline-hello.txt'.
    await remote.uploadFile('./hello.txt', 'dockline-hello.txt');
    console.log('Uploaded dockline-hello.txt.');

    // Download server source 'dockline-hello.txt'
    // to host destination './downloaded-hello.txt'.
    await remote.downloadFile('dockline-hello.txt', './downloaded-hello.txt');
    console.log('Downloaded downloaded-hello.txt.');
}, {
    hostFingerprint: fingerprint,
    passphrase: process.env.SFTP_KEY_PASSPHRASE,
});

console.log('Connection closed.');
```

```js [MJS]
// saved-sftp.mjs
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const [filename = './sitemanager.xml', selectedPath = 'Production/Web'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const bridge = createDocklineBridge({source});
const fingerprint = process.env.SFTP_HOST_FINGERPRINT;

if (!fingerprint && !(process.stdin.isTTY && process.stderr.isTTY)) {
    throw new Error('Set SFTP_HOST_FINGERPRINT to an independently verified SHA256 fingerprint.');
}

await bridge.withFiles(selectedPath, async remote => {
    // Upload host source './hello.txt' to server destination 'dockline-hello.txt'.
    await remote.uploadFile('./hello.txt', 'dockline-hello.txt');
    console.log('Uploaded dockline-hello.txt.');

    // Download server source 'dockline-hello.txt'
    // to host destination './downloaded-hello.txt'.
    await remote.downloadFile('dockline-hello.txt', './downloaded-hello.txt');
    console.log('Downloaded downloaded-hello.txt.');
}, {
    hostFingerprint: fingerprint,
    passphrase: process.env.SFTP_KEY_PASSPHRASE,
});

console.log('Connection closed.');
```

```js [CommonJS]
// saved-sftp.cjs
const {FileZillaProfileSource} = require('@jalsoedesign/filezilla-core');
const {createDocklineBridge} = require('@jalsoedesign/portline-dockline');

async function main() {
    const [filename = './sitemanager.xml', selectedPath = 'Production/Web'] = process.argv.slice(2);
    const source = FileZillaProfileSource.fromFile(filename);
    const bridge = createDocklineBridge({source});
    const fingerprint = process.env.SFTP_HOST_FINGERPRINT;

    if (!fingerprint && !(process.stdin.isTTY && process.stderr.isTTY)) {
        throw new Error('Set SFTP_HOST_FINGERPRINT to an independently verified SHA256 fingerprint.');
    }

    await bridge.withFiles(selectedPath, async remote => {
        // Upload host source './hello.txt' to server destination 'dockline-hello.txt'.
        await remote.uploadFile('./hello.txt', 'dockline-hello.txt');
        console.log('Uploaded dockline-hello.txt.');

        // Download server source 'dockline-hello.txt'
        // to host destination './downloaded-hello.txt'.
        await remote.downloadFile('dockline-hello.txt', './downloaded-hello.txt');
        console.log('Downloaded downloaded-hello.txt.');
    }, {
        hostFingerprint: fingerprint,
        passphrase: process.env.SFTP_KEY_PASSPHRASE,
    });

    console.log('Connection closed.');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
```

:::

### Run

::: code-group

```sh [TypeScript]
npm install --save-dev typescript tsx @types/node
npm pkg set type=module
npx tsx saved-sftp.ts ./sitemanager.xml Production/Web
```

```sh [JavaScript]
npm pkg set type=module
node saved-sftp.js ./sitemanager.xml Production/Web
```

```sh [MJS]
node saved-sftp.mjs ./sitemanager.xml Production/Web
```

```sh [CommonJS]
node saved-sftp.cjs ./sitemanager.xml Production/Web
```

:::

### Output

```text
Uploaded dockline-hello.txt.
Downloaded downloaded-hello.txt.
Connection closed.
```

## Download one file

The program uploads host source `./hello.txt` to server destination `dockline-hello.txt`, relative to the saved remote root. It then downloads that server file to host destination `./downloaded-hello.txt`. Both methods await completion; `withFiles` closes the session even if work fails.

Uploads replace an existing remote destination by default. Downloads refuse an existing local destination; choose a new filename or deliberately select `{overwrite: 'replace'}` before rerunning. Both parent directories must already exist. See [Dockline's file recipes](https://h2ooooooo.github.io/dockline/api/files) for further operations.

## Connect through a saved FTP or FTPS configuration

```sh
npm install @jalsoedesign/filezilla-core@rc @jalsoedesign/portline-dockline@rc @jalsoedesign/dockline-ftp-client@rc
```

Select an existing `Production/FTP` site and the same host input file. FileZilla FTP/FTPES require explicit TLS, FTPS uses implicit TLS, and INSECURE_FTP explicitly selects plaintext. The saved port is retained; no TLS policy is inferred from it. Certificate verification remains enabled.

Save `saved-ftp.ts` by default, or the filename in the selected language tab. Download: <a href="/examples/saved-ftp.ts" download="saved-ftp.ts">TypeScript</a> · <a href="/examples/saved-ftp.js" download="saved-ftp.js">JavaScript</a> · <a href="/examples/saved-ftp.mjs" download="saved-ftp.mjs">MJS</a> · <a href="/examples/saved-ftp.cjs" download="saved-ftp.cjs">CommonJS</a>

::: code-group

```ts [TypeScript]
// saved-ftp.ts
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const [filename = './sitemanager.xml', selectedPath = 'Production/FTP'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const bridge = createDocklineBridge({source});

await bridge.withFiles(selectedPath, async remote => {
    // Upload host source './hello.txt' to server destination 'dockline-hello.txt'.
    await remote.uploadFile('./hello.txt', 'dockline-hello.txt');
    console.log('Uploaded dockline-hello.txt.');

    // Download server source 'dockline-hello.txt'
    // to host destination './downloaded-hello.txt'.
    await remote.downloadFile('dockline-hello.txt', './downloaded-hello.txt');
    console.log('Downloaded downloaded-hello.txt.');
});

console.log('Connection closed.');
```

```js [JavaScript]
// saved-ftp.js
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const [filename = './sitemanager.xml', selectedPath = 'Production/FTP'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const bridge = createDocklineBridge({source});

await bridge.withFiles(selectedPath, async remote => {
    // Upload host source './hello.txt' to server destination 'dockline-hello.txt'.
    await remote.uploadFile('./hello.txt', 'dockline-hello.txt');
    console.log('Uploaded dockline-hello.txt.');

    // Download server source 'dockline-hello.txt'
    // to host destination './downloaded-hello.txt'.
    await remote.downloadFile('dockline-hello.txt', './downloaded-hello.txt');
    console.log('Downloaded downloaded-hello.txt.');
});

console.log('Connection closed.');
```

```js [MJS]
// saved-ftp.mjs
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const [filename = './sitemanager.xml', selectedPath = 'Production/FTP'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const bridge = createDocklineBridge({source});

await bridge.withFiles(selectedPath, async remote => {
    // Upload host source './hello.txt' to server destination 'dockline-hello.txt'.
    await remote.uploadFile('./hello.txt', 'dockline-hello.txt');
    console.log('Uploaded dockline-hello.txt.');

    // Download server source 'dockline-hello.txt'
    // to host destination './downloaded-hello.txt'.
    await remote.downloadFile('dockline-hello.txt', './downloaded-hello.txt');
    console.log('Downloaded downloaded-hello.txt.');
});

console.log('Connection closed.');
```

```js [CommonJS]
// saved-ftp.cjs
const {FileZillaProfileSource} = require('@jalsoedesign/filezilla-core');
const {createDocklineBridge} = require('@jalsoedesign/portline-dockline');

async function main() {
    const [filename = './sitemanager.xml', selectedPath = 'Production/FTP'] = process.argv.slice(2);
    const source = FileZillaProfileSource.fromFile(filename);
    const bridge = createDocklineBridge({source});

    await bridge.withFiles(selectedPath, async remote => {
        // Upload host source './hello.txt' to server destination 'dockline-hello.txt'.
        await remote.uploadFile('./hello.txt', 'dockline-hello.txt');
        console.log('Uploaded dockline-hello.txt.');

        // Download server source 'dockline-hello.txt'
        // to host destination './downloaded-hello.txt'.
        await remote.downloadFile('dockline-hello.txt', './downloaded-hello.txt');
        console.log('Downloaded downloaded-hello.txt.');
    });

    console.log('Connection closed.');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
```

:::

### Run

::: code-group

```sh [TypeScript]
npm install --save-dev typescript tsx @types/node
npm pkg set type=module
npx tsx saved-ftp.ts ./sitemanager.xml Production/FTP
```

```sh [JavaScript]
npm pkg set type=module
node saved-ftp.js ./sitemanager.xml Production/FTP
```

```sh [MJS]
node saved-ftp.mjs ./sitemanager.xml Production/FTP
```

```sh [CommonJS]
node saved-ftp.cjs ./sitemanager.xml Production/FTP
```

:::

### Output

```text
Uploaded dockline-hello.txt.
Downloaded downloaded-hello.txt.
Connection closed.
```

The source/destination and overwrite rules are the same as the SFTP program. [FTP mapping](/guide/ftp) explains saved logon modes, charset and TLS options.

## Shared integration

The bridge resolves credentials only for the exact selected profile. To obtain configuration without connecting, use its asynchronous `toConfig` method. To manage an adapter explicitly, use `createFileAdapter` and disconnect in `finally`.

Profiles contain credential references, never secret values. Resolved connection configuration can contain secrets and must not be logged as metadata. [Local fixtures](/guide/local-demo) exercise this path without external accounts.
