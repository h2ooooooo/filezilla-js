import {describe, expect, it} from 'vitest';
import {getSiteManager, LogonType, PasvMode, CharsetEncoding, ServerProtocol, toConnectionProfile} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';
import path from 'node:path';

const fixture = path.join(__dirname, '../../core/fixtures/general/sitemanager.multi.xml');

describe('normalized FileZilla FTP execution', () => {
    it.each([
        [ServerProtocol.INSECURE_FTP, 'ftp'],
        [ServerProtocol.FTP, 'ftps'],
        [ServerProtocol.FTPES, 'ftps'],
        [ServerProtocol.FTPS, 'ftps-implicit'],
    ] as const)('preserves saved protocol %s without weakening TLS', async (protocol, expected) => {
        const site = getSiteManager(fixture).getServers()[0];

        Object.assign(site.propertiesRaw, {
            protocol,
            logonType: LogonType.normal,
            passiveMode: PasvMode.MODE_PASSIVE,
            encodingType: CharsetEncoding.ENCODING_CUSTOM,
            customEncoding: 'ISO-8859-1',
        });

        const config = await createDocklineBridge().toConfig(toConnectionProfile(site), {
            password: 'fixture-password',
            maxTransientRetries: 7,
        });

        expect(config).toMatchObject({
            protocol: expected,
            password: 'fixture-password',
            passive: true,
            filenameEncoding: {charset: 'ISO-8859-1'},
            maxTransientRetries: 7,
        });
    });

    it('refuses an unsupported native path instead of executing at the server root', async () => {
        const site = getSiteManager(fixture).getServers()[0];

        site.propertiesRaw.remoteDirectory = '3 0 3 abc';

        await expect(createDocklineBridge().toConfig(toConnectionProfile(site), {password: 'fixture'}))
            .rejects.toThrow();
    });
});
