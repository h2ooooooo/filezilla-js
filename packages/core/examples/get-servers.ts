import {getSiteManager} from '../src/SiteManager';
import * as path from 'path';

const siteManager = getSiteManager(path.join(__dirname, '../fixtures/general/sitemanager.multi.xml'));

const servers = siteManager.getServers();

for (const server of servers) {
    console.log(`${server.path} (host: ${server.properties.host}:${server.properties.port})`);
}
