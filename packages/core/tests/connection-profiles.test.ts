import {describe, expect, it} from 'vitest';
import path from 'node:path';
import {CredentialResolver} from '@jalsoedesign/portline-core';
import {CharsetEncoding, FileZillaProfileSource, getSiteManager, LogonType, PasvMode, ServerProtocol, toConnectionProfile} from '../src/index';

const fixture = path.join(__dirname, '../fixtures/general/sitemanager.multi.xml');

describe('normalized FileZilla profiles', () => {
    it('preserves execution settings and separates prompting from keyboard-interactive authentication', () => {
        const server = getSiteManager(fixture).getServers()[0];

        Object.assign(server.propertiesRaw, {
            protocol: ServerProtocol.FTP,
            passiveMode: PasvMode.MODE_ACTIVE,
            encodingType: CharsetEncoding.ENCODING_CUSTOM,
            customEncoding: 'windows-1252',
            logonType: LogonType.ask,
        });

        expect(toConnectionProfile(server).connections[0]).toMatchObject({
            protocol: 'ftps',
            tls: 'explicit',
            passive: false,
            filenameEncoding: {charset: 'windows-1252'},
            authentication: [{type: 'prompt-password'}],
        });
        server.propertiesRaw.logonType = LogonType.interactive;
        expect(toConnectionProfile(server).connections[0].authentication).toEqual([{type: 'interactive'}]);
        server.propertiesRaw.remoteDirectory = '3 0 3 abc';
        expect(toConnectionProfile(server).connections[0].unsupportedOptions).toContain('remoteDirectory');
    });
    it('lists metadata without loading secrets and explicitly resolves only the selected credential', async () => {
        const source = FileZillaProfileSource.fromFile(fixture);
        const profiles = source.list();
        const profile = source.get('SFTP (root location)')!;
        const auth = profile.connections[0].authentication[0];
        const resolver = new CredentialResolver();

        resolver.register(source.source.id, source);
        expect(source.manager.getServers().every(server => server.propertiesRaw.password === undefined)).toBe(true);
        expect(JSON.stringify(profiles)).not.toContain('"value":"password"');
        expect(auth.type).toBe('password');

        if (auth.type !== 'password') {
            throw new Error('Expected password authentication');
        }

        expect(await resolver.resolve(auth.credential)).toEqual({state: 'available', value: 'password'});
        expect(source.manager.getServers().every(server => server.propertiesRaw.password === undefined)).toBe(true);
        expect(await source.resolve({...auth.credential, sourceId: 'another-source'})).toEqual({state: 'unavailable'});
        expect(source.search('TEST.REBEX.NET', {fields: 'all'})).toHaveLength(5);
        expect(source.get('missing')).toBeUndefined();
    });

    it('preserves native APIs and projects key authentication separately from passphrases', () => {
        const manager = getSiteManager(fixture);
        const server = manager.getServers()[0];
        const properties = server.propertiesRaw;

        properties.logonType = LogonType.key;
        properties.keyFile = 'C:\\keys\\deployment.ppk';
        properties.password = 'synthetic-passphrase';

        const profile = toConnectionProfile(server);
        const serialized = JSON.stringify(profile);

        expect(profile.connections[0]).toMatchObject({
            kind: 'ssh',
            protocol: 'sftp',
            authentication: [
                {
                    type: 'private-key',
                    path: {value: properties.keyFile},
                    format: 'ppk',
                    passphrase: {kind: 'passphrase', state: 'available'},
                },
            ],
        });
        expect(serialized).not.toContain('synthetic-passphrase');
        expect(server.properties.protocol).toBe(ServerProtocol.SFTP);
        expect(server.properties.password).toBe('synthetic-passphrase');
    });

    it('preserves unsupported metadata and distinguishes explicit from implicit FTP TLS', () => {
        const server = getSiteManager(fixture).getServers()[0];

        server.propertiesRaw.protocol = ServerProtocol.FTPES;
        expect(toConnectionProfile(server).connections[0]).toMatchObject({protocol: 'ftps', tls: 'explicit'});
        server.propertiesRaw.protocol = ServerProtocol.FTPS;
        expect(toConnectionProfile(server).connections[0]).toMatchObject({protocol: 'ftps', tls: 'implicit'});
        server.propertiesRaw.protocol = ServerProtocol.CLOUDFLARE_R2;
        server.propertiesRaw.remoteDirectory = '3 0 3 abc';
        server.propertiesRaw.passwordEncoding = 'crypt';

        const profile = toConnectionProfile(server);

        expect(profile.connections[0]).toMatchObject({kind: 'unsupported', protocol: 'cloudflare_r2'});
        expect(profile.diagnostics[0].code).toBe('REMOTE_DIRECTORY_UNAVAILABLE');
        expect(profile.connections[0].authentication[0]).toMatchObject({credential: {state: 'unsupported'}});
    });
});
