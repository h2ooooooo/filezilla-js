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
