import {checkConnection} from '@jalsoedesign/filezilla-cli';
import {getSiteManager} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml', selectedPath = 'Production/Web'] = process.argv.slice(2);
const fingerprint = process.env.SFTP_HOST_FINGERPRINT;
const manager = getSiteManager(filename, {credentialPath: selectedPath});
const site = manager.getServerByPath(selectedPath);

if (!site || !fingerprint) {
    throw new Error('Supply a saved SFTP site and verified SFTP_HOST_FINGERPRINT.');
}

const result = await checkConnection(site, {hostKeySha256: fingerprint, timeoutMs: 10000});

console.log('Connected:', result.connected);
console.log('Cleanup:', result.cleanup);
process.exitCode = result.exitCode;
