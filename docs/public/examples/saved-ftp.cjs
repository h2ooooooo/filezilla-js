const {getSiteManager} = require('@jalsoedesign/filezilla-core');
const {FtpConnectorFactory} = require('@jalsoedesign/filezilla-connector-ftp');
const {Dockline} = require('@jalsoedesign/dockline-core');

async function main() {
    const [filename = './sitemanager.xml', selectedPath = 'Production/FTP'] = process.argv.slice(2);
    const manager = getSiteManager(filename, {credentialPath: selectedPath});
    const site = manager.getServerByPath(selectedPath);

    if (!site) {
        throw new Error('The selected saved site is unavailable.');
    }

    const config = FtpConnectorFactory.toConfig(site);

    await Dockline.withConnection(config, async remote => {
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
