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
