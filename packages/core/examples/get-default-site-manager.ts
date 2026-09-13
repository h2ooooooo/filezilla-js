import {getDefaultSiteManager} from '../src/SiteManager';

try {
    const siteManager = getDefaultSiteManager();
    const servers = siteManager.getServers();

    console.log(`Found ${servers.length} servers in your default FileZilla configuration:`);

    for (const server of servers) {
        console.log(`- ${server.path} [${server.properties.host}]`);
    }
} catch (error: any) {
    console.error(`Error: ${error.message}`);
    console.log('This example requires FileZilla to be installed with a sitemanager.xml file present.');
}
