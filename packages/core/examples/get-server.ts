import {getSiteManager} from '../src/SiteManager';
import * as path from 'path';

const siteManager = getSiteManager(path.join(__dirname, '../fixtures/general/sitemanager.multi.xml'));

const serverPaths = [
    'SFTP (root location)',
    'Rebex/SFTP',
    'Rebex/FTP',
    'Rebex/FTP SSL (explicit)',
    'Inexistent server',
];

for (const serverPath of serverPaths) {
    const server = siteManager.getServerByPath(serverPath);

    if (!server) {
        console.error(`Error: Could not find server by path "${serverPath}"`);

        continue;
    }

    console.log(`${serverPath} (host: ${server.properties.host}:${server.properties.port})`);

    const remoteDirectory = server.getRemoteDirectory();

    if (remoteDirectory) {
        console.log(`  Server remote directory: ${remoteDirectory}`);
    }
}
