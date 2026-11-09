# Run SSH commands from a saved site

Use the shared bridge to request SSH commands explicitly from a saved FileZilla SFTP endpoint. The server must permit command execution; an SFTP-only account may refuse it. No SSH endpoint is inferred from an FTP definition.

## Install and select a site

```sh
npm install @jalsoedesign/filezilla-core @jalsoedesign/portline-dockline @jalsoedesign/dockline-ssh-client
```

Select an existing SFTP site named `Production/Web` with saved normal/password or key-file authentication and a POSIX server providing `uname`. Use the exact canonical profile path returned by the source. Reading the source does not open sockets or resolve credentials.

Interactive terminal runs can omit `SSH_HOST_FINGERPRINT` and confirm the displayed server key. For unattended runs, supply it as a canonical, independently verified SHA256 fingerprint in the same environment. For encrypted keys, `SSH_KEY_PASSPHRASE` may supply an explicit passphrase override. The [SFTP setup](/guide/quick-start#load-one-sftp-site-connect-and-upload-one-file) shows environment syntax; use these SSH variable names instead. An explicitly supplied pin is strict and never falls back to prompting on mismatch.

## Save the program

Save `saved-ssh.ts` or the filename in the selected tab. Download: <a href="/examples/saved-ssh.ts" download="saved-ssh.ts">TypeScript</a> · <a href="/examples/saved-ssh.js" download="saved-ssh.js">JavaScript</a> · <a href="/examples/saved-ssh.mjs" download="saved-ssh.mjs">MJS</a> · <a href="/examples/saved-ssh.cjs" download="saved-ssh.cjs">CommonJS</a>

::: code-group

```ts [TypeScript]
// saved-ssh.ts
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const [filename = './sitemanager.xml', selectedPath = 'Production/Web'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const bridge = createDocklineBridge({source});
const fingerprint = process.env.SSH_HOST_FINGERPRINT;

if (!fingerprint && !(process.stdin.isTTY && process.stderr.isTTY)) {
    throw new Error('Set SSH_HOST_FINGERPRINT to an independently verified SHA256 fingerprint.');
}

await bridge.withSsh(selectedPath, async session => {
    const result = await session.exec('uname', ['-s']);

    process.stdout.write(result.stdout);
}, {
    hostFingerprint: fingerprint,
    passphrase: process.env.SSH_KEY_PASSPHRASE,
    timeoutMs: 10_000,
});

console.log('Connection closed.');
```

```js [JavaScript]
// saved-ssh.js
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const [filename = './sitemanager.xml', selectedPath = 'Production/Web'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const bridge = createDocklineBridge({source});
const fingerprint = process.env.SSH_HOST_FINGERPRINT;

if (!fingerprint && !(process.stdin.isTTY && process.stderr.isTTY)) {
    throw new Error('Set SSH_HOST_FINGERPRINT to an independently verified SHA256 fingerprint.');
}

await bridge.withSsh(selectedPath, async session => {
    const result = await session.exec('uname', ['-s']);

    process.stdout.write(result.stdout);
}, {
    hostFingerprint: fingerprint,
    passphrase: process.env.SSH_KEY_PASSPHRASE,
    timeoutMs: 10_000,
});

console.log('Connection closed.');
```

```js [MJS]
// saved-ssh.mjs
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const [filename = './sitemanager.xml', selectedPath = 'Production/Web'] = process.argv.slice(2);
const source = FileZillaProfileSource.fromFile(filename);
const bridge = createDocklineBridge({source});
const fingerprint = process.env.SSH_HOST_FINGERPRINT;

if (!fingerprint && !(process.stdin.isTTY && process.stderr.isTTY)) {
    throw new Error('Set SSH_HOST_FINGERPRINT to an independently verified SHA256 fingerprint.');
}

await bridge.withSsh(selectedPath, async session => {
    const result = await session.exec('uname', ['-s']);

    process.stdout.write(result.stdout);
}, {
    hostFingerprint: fingerprint,
    passphrase: process.env.SSH_KEY_PASSPHRASE,
    timeoutMs: 10_000,
});

console.log('Connection closed.');
```

```js [CommonJS]
// saved-ssh.cjs
const {FileZillaProfileSource} = require('@jalsoedesign/filezilla-core');
const {createDocklineBridge} = require('@jalsoedesign/portline-dockline');

async function main() {
    const [filename = './sitemanager.xml', selectedPath = 'Production/Web'] = process.argv.slice(2);
    const source = FileZillaProfileSource.fromFile(filename);
    const bridge = createDocklineBridge({source});
    const fingerprint = process.env.SSH_HOST_FINGERPRINT;

    if (!fingerprint && !(process.stdin.isTTY && process.stderr.isTTY)) {
        throw new Error('Set SSH_HOST_FINGERPRINT to an independently verified SHA256 fingerprint.');
    }

    await bridge.withSsh(selectedPath, async session => {
        const result = await session.exec('uname', ['-s']);

        process.stdout.write(result.stdout);
    }, {
        hostFingerprint: fingerprint,
        passphrase: process.env.SSH_KEY_PASSPHRASE,
        timeoutMs: 10_000,
    });

    console.log('Connection closed.');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
```

:::

## Run

::: code-group

```sh [TypeScript]
npm install --save-dev typescript tsx @types/node
npm pkg set type=module
npx tsx saved-ssh.ts ./sitemanager.xml Production/Web
```

```sh [JavaScript]
npm pkg set type=module
node saved-ssh.js ./sitemanager.xml Production/Web
```

```sh [MJS]
node saved-ssh.mjs ./sitemanager.xml Production/Web
```

```sh [CommonJS]
node saved-ssh.cjs ./sitemanager.xml Production/Web
```

:::

## Output and lifetime

Example output for a Linux server:

```text
Linux
Connection closed.
```

`withSsh` closes the session on success or failure. `timeoutMs` supplies a cancellation deadline for SSH setup and protocol work; individual `exec` calls also accept command timeouts. Await every command inside the callback. Commands run in the server's normal login context; the saved SFTP transfer root does not change their working directory.

Use `session.exec(program, args)` for separately quoted POSIX arguments; `session.shell(command)` executes an intentional shell command string. The returned `code`, `stdout` and `stderr` belong to Dockline's command API. See [Dockline SSH](https://h2ooooooo.github.io/dockline/ssh/quick-start) for command failure and sudo behavior.

## Other authentication and sources

Unsaved passwords can use an explicit `password` or `promptPassword`; keyboard-interactive modes require `keyboardInteractive`. Host trust can instead use the native read-only verifier described in [SSH authentication and trusted keys](/guide/ssh-options). Runtime callbacks and secrets are never serialized into profiles.

The same bridge accepts WinSCP, PuTTY/KiTTY, OpenSSH, JetBrains and HeidiSQL sources. Select `connectionId` explicitly when several SSH-compatible definitions exist. SSH hops and unsupported native policies are refused. See [shared connection methods](/reference/factories) and [bridge errors](/reference/errors#shared-bridge-failures).
