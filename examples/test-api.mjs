import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {getSiteManager} from '@jalsoedesign/filezilla-core';

const directory = await mkdtemp(path.join(tmpdir(), 'filezilla-api-demo-'));
const xml = '<FileZilla3>\n    <Servers>\n        <Server>\n            <Host>127.0.0.1</Host>\n            <Port>22</Port>\n            <Protocol>1</Protocol>\n            <Type>0</Type>\n            <User>deploy</User>\n            <Logontype>2</Logontype>\n            <Name>Demo</Name>\n        </Server>\n    </Servers>\n</FileZilla3>\n';

try {
    const filename = path.join(directory, 'sitemanager.xml');

    await writeFile(filename, xml);

    const manager = getSiteManager(filename, {includePasswords: false});

    for (const site of manager.getServers()) {
        console.log(JSON.stringify({
            path: site.path,
            host: site.properties.host,
            protocol: site.siteProtocolName,
        }));
    }

    const selected = manager.getServerByPath('Demo');
    const matches = manager.searchServers('127.0.0.1', {fields: 'all'});

    assert.equal(selected.properties.host, '127.0.0.1');
    assert.equal(matches.length, 1);
    console.log('Exact selection:', selected.path);
    console.log('Host matches:', matches.length);
    console.log('Metadata only; no remote connection.');
} finally {
    await rm(directory, {recursive: true, force: true});
    console.log('Temporary files removed.');
}
