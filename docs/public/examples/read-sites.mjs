import {getSiteManager} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const manager = getSiteManager(filename, {includePasswords: false});

for (const site of manager.getServers()) {
    console.log(JSON.stringify({
        path: site.path,
        host: site.properties.host,
        protocol: site.siteProtocolName,
    }));
}

const selected = manager.getServerByPath('Demo');

if (!selected) {
    throw new Error('The Demo site is unavailable.');
}

console.log('Exact selection:', selected.path);
console.log('Host matches:', manager.searchServers('127.0.0.1', {fields: 'all'}).length);
console.log('Metadata only; no remote connection.');
