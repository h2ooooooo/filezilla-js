import {getSiteManager} from '../src/SiteManager';
import * as path from 'node:path';

const fixture = path.join(__dirname, '../fixtures/general/sitemanager.multi.xml');

describe('all-fields profile search', () => {
    it.each([
        'TEST.REBEX.NET',
        'demo',
        'password',
        '22',
        'INSECURE_FTP',
        '/pub/example',
        'Rebex/FTP',
        '',
    ])('matches loaded values and display values: %s', term => {
        expect(getSiteManager(fixture).searchServers(term, {fields: 'all'}).length).toBeGreaterThan(0);
    });

    it('keeps name/path matching as the default and returns no unrelated results', () => {
        const manager = getSiteManager(fixture);

        expect(manager.searchServers('test.rebex.net')).toHaveLength(0);
        expect(manager.searchServers('Rebex')).toHaveLength(4);
        expect(manager.searchServers('absent.invalid', {fields: 'all'})).toHaveLength(0);
    });

    it('does not load excluded credentials', () => {
        const manager = getSiteManager(fixture, {includePasswords: false});

        expect(manager.searchServers('password', {fields: 'all'})).toHaveLength(0);
    });

    it('searches remaining fields and raw paths when remote decoding is unsupported', () => {
        const manager = getSiteManager(fixture);
        const server = manager.getServers()[0];

        Object.assign(server.propertiesRaw, {
            comments: 'OrdLab support',
            localDirectory: 'C:\\Projects\\OrdLab',
            keyFile: 'keys/ordlab.pem',
            remoteDirectory: '3 0 6 legacy',
        });

        for (const term of ['support', 'projects', 'ordlab.pem', 'legacy']) {
            expect(manager.searchServers(term, {fields: 'all'})).toEqual([server]);
        }
    });
});
