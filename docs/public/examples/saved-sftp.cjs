const {getSiteManager} = require('@jalsoedesign/filezilla-core');
const {SftpConnectorFactory} = require('@jalsoedesign/filezilla-connector-sftp');
const {Dockline} = require('@jalsoedesign/dockline-core');

async function main() {
    const [filename = './sitemanager.xml', selectedPath = 'Production/Web'] = process.argv.slice(2);
    const manager = getSiteManager(filename, {credentialPath: selectedPath});
    const site = manager.getServerByPath(selectedPath);

    if (!site) {
        throw new Error('The selected saved site is unavailable.');
    }

    const fingerprint = process.env.SFTP_HOST_FINGERPRINT;

    if (!fingerprint) {
        throw new Error('Set SFTP_HOST_FINGERPRINT to an independently verified SHA256 fingerprint.');
    }

    const config = SftpConnectorFactory.toConfig(site, {
        passphrase: process.env.SFTP_KEY_PASSPHRASE,
        requireTrustPolicy: true,
        hasTrustPolicy: challenge => (
            challenge.host === site.properties.host &&
            challenge.port === site.properties.port &&
            challenge.fingerprint === fingerprint
        ),
        acceptTrustPolicy: () => false,
    });

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
