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
