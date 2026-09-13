import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {randomUUID} from 'node:crypto';
import {inspect} from 'node:util';
import {getSiteManager, SiteManager, SiteManagerReadOptions} from '../src/SiteManager';
import {Server} from '../src/Server';
import {ServerProtocol} from '../src/enum/ServerProtocol';
import {XmlConfig, XmlServerConfig} from '../src/types/XmlConfigTypes';

let directory: string;

beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'filezilla-core-audit-'));
});
afterEach(() => {
    fs.rmSync(directory, {recursive: true, force: true});
});

function serverXml(name = 'Site', extra = ''): string {
    return `<Server><Host>example.invalid</Host><Port>22</Port><Protocol>1</Protocol><Type>0</Type><Logontype>1</Logontype><Name>${name}</Name>${extra}</Server>`;
}

function read(body: string, options: SiteManagerReadOptions = {}): SiteManager {
    const file = path.join(directory, `${randomUUID()}.xml`);

    fs.writeFileSync(file, `<FileZilla3><Servers>${body}</Servers></FileZilla3>`);

    return getSiteManager(file, options);
}

function config(name = 'Site'): XmlServerConfig {
    return {
        Host: 'example.invalid',
        Port: 22,
        Protocol: ServerProtocol.SFTP,
        Type: 0,
        Name: name,
        User: '00012',
        Pass: 'private-test-password',
        Logontype: 1,
        TimezoneOffset: 0,
        PasvMode: 0,
        MaximumMultipleConnections: 0,
        EncodingType: 2,
        BypassProxy: false,
        SyncBrowsing: false,
        DirectoryComparison: false,
    };
}

describe('audit: credential boundaries', () => {
    it('does not retain or serialize original credentials in a metadata-only manager', () => {
        const secret = 'credential-synthetic-42';
        const encoded = Buffer.from(secret).toString('base64');
        const manager = read(serverXml('Plain', `<Pass>${secret}</Pass>`) + serverXml('Encoded', `<Pass encoding="base64">${encoded}</Pass>`), {includePasswords: false});

        expect(manager.getServers().every(server => server.propertiesRaw.password === undefined)).toBe(true);

        for (const representation of [
            JSON.stringify(manager),
            inspect(manager),
            inspect(manager.getServers()),
            JSON.stringify(Object.assign({}, manager)),
        ]) {
            expect(representation).not.toContain(secret);
            expect(representation).not.toContain(encoded);
        }

        expect(Object.keys(manager)).not.toContain('xml');
        expect(JSON.parse(JSON.stringify(manager)).servers).toHaveLength(2);
    });

    it('redacts JSON even when credentials were intentionally loaded', () => {
        const manager = new SiteManager({FileZilla3: {Servers: {Server: config()}}});
        const server = manager.getServerByPath('Site')!;

        expect(server.propertiesRaw.password).toBe('private-test-password');
        expect(JSON.stringify(manager)).not.toContain('private-test-password');
        expect(JSON.stringify(server)).not.toContain('private-test-password');
        expect(JSON.parse(JSON.stringify(server))).toMatchObject({path: 'Site', user: '00012'});
        expect(JSON.parse(JSON.stringify(server))).not.toHaveProperty('password');
    });

    it('loads only the selected credential and retains no other credential representation', () => {
        const manager = read(serverXml('First', '<Pass>first-secret</Pass>') + serverXml('Second', '<Pass>second-secret</Pass>'), {credentialPath: 'Second'});

        expect(manager.getServerByPath('First')!.propertiesRaw.password).toBeUndefined();
        expect(manager.getServerByPath('Second')!.propertiesRaw.password).toBe('second-secret');
        expect(JSON.stringify(manager)).not.toMatch(/first-secret|second-secret/);
    });

    it.each([' leading', 'trailing ', ' both ', '   '])('preserves plaintext credential whitespace: %j', secret => {
        expect(read(serverXml('Site', `<User> 00012 </User><Pass>${secret}</Pass>`)).getServers()[0].propertiesRaw).toMatchObject({user: ' 00012 ', password: secret});
    });

    it('preserves decoded whitespace and never loads an unsupported encrypted password', () => {
        const secret = ' base64 secret ';
        const manager = read(serverXml('Encoded', `<Pass encoding="base64">${Buffer.from(secret).toString('base64')}</Pass>`) + serverXml('Encrypted', '<Pass encoding="crypt">ciphertext</Pass>'));

        expect(manager.getServerByPath('Encoded')!.propertiesRaw.password).toBe(secret);
        expect(manager.getServerByPath('Encrypted')!.propertiesRaw.password).toBeUndefined();
    });

    it.each(['plain', 'base64'])('preserves an explicitly empty %s password', encoding => {
        expect(read(serverXml('Site', `<Pass encoding="${encoding}" />`)).getServers()[0].propertiesRaw.password).toBe('');
    });
});

describe('audit: metadata and input validation', () => {
    it('keeps metadata/search/serialization usable when path decoding is unsupported', () => {
        const manager = read(serverXml('Unsupported', '<RemoteDir>3 0 3 abc</RemoteDir>') + serverXml('Target'));
        const server = manager.getServerByPath('Unsupported')!;

        expect(server.properties.host).toBe('example.invalid');
        expect(server.properties.name).toBe('Unsupported');
        expect(manager.searchServers('Target').map(item => item.path)).toEqual(['Target']);
        expect(() => JSON.stringify(manager)).not.toThrow();
        expect(() => server.properties.remoteDirectory).toThrow('Unsupported FileZilla remote directory');
        expect(() => server.getRemoteDirectory()).toThrow('Unsupported FileZilla remote directory');
    });

    it('rejects malformed XML without echoing credential content', () => {
        const file = path.join(directory, 'truncated.xml');

        fs.writeFileSync(file, `<FileZilla3><Servers>${serverXml('Site', '<Pass>synthetic-private-value</Pass>')}`);
        expect(() => getSiteManager(file)).toThrow('malformed XML');

        try {
            getSiteManager(file);
        } catch (error) {
            expect(String(error)).not.toContain('synthetic-private-value');
        }
    });

    it.each([
        'banana',
        'NaN',
        'Infinity',
        '0',
        '-1',
        '65536',
        '22.5',
        '',
    ])('rejects invalid port %j with site and field context', port => {
        expect(() => read(serverXml().replace('<Port>22</Port>', `<Port>${port}</Port>`))).toThrow('site Site field Port');
    });

    it.each(['Host', 'Port', 'Protocol', 'Name'])('rejects missing required %s', field => {
        const xml = serverXml().replace(new RegExp(`<${field}>.*?</${field}>`), '');

        expect(() => read(xml)).toThrow(`field ${field}`);
    });

    it('rejects duplicate singleton fields and invalid container shapes', () => {
        expect(() => read(serverXml('Site', '<Host>other.invalid</Host>'))).toThrow('field Host');
        expect(() => read(serverXml('Site', '<Port>23</Port>'))).toThrow('field Port');
        expect(() => read(serverXml('Site', '<Pass>one</Pass><Pass>two</Pass>'), {includePasswords: false})).toThrow('field Pass');
        expect(() => new SiteManager({FileZilla3: {Servers: []}} as unknown as XmlConfig)).toThrow('field Servers');
        expect(() => new SiteManager({FileZilla3: {Servers: {Server: 'invalid'}}} as unknown as XmlConfig)).toThrow('field Server');
    });

    it.each([['PasvMode', '3'], ['EncodingType', '-1'], ['MaximumMultipleConnections', '-1'], ['BypassProxy', '2']])('rejects invalid %s metadata', (field, value) => {
        expect(() => read(serverXml('Site', `<${field}>${value}</${field}>`))).toThrow(`field ${field}`);
    });

    it('preserves metadata defaults, aliases, unknown protocol metadata and an empty container', () => {
        const server = read(serverXml('Site', '<PasvMode> MODE_PASSIVE </PasvMode><EncodingType> Auto </EncodingType>').replace('<Protocol>1</Protocol>', '<Protocol>255</Protocol>')).getServers()[0];

        expect(server.propertiesRaw).toMatchObject({
            protocol: 255,
            passiveMode: 2,
            encodingType: 2,
            timezoneOffset: 0,
            maximumMultipleConnections: 0,
        });
        expect(server.siteProtocolName).toBe('UNKNOWN');
        expect(read('').getServers()).toEqual([]);
    });

    it('still rejects DTD and entity declarations', () => {
        const file = path.join(directory, 'entity.xml');

        fs.writeFileSync(file, '<!DOCTYPE FileZilla3 [<!ENTITY secret "synthetic">]><FileZilla3><Servers /></FileZilla3>');
        expect(() => getSiteManager(file)).toThrow('DTD and entity declarations');
    });
});

describe('audit: canonical selection and constructor inputs', () => {
    it('supports singleton and array Server and nested Folder constructor inputs', () => {
        const singleton = new SiteManager({FileZilla3: {Servers: {Server: config('Root'), Folder: {'#text': 'Outer', Folder: {'#text': 'Inner', Server: config('Nested')}}}}});
        const arrays = new SiteManager({FileZilla3: {Servers: {Server: [config('Root')], Folder: [{'#text': 'Outer', Folder: [{'#text': 'Inner', Server: [config('Nested')]}]}]}}});

        expect(singleton.getServers().map(server => server.path)).toEqual(['Root', 'Outer/Inner/Nested']);
        expect(JSON.stringify(singleton)).toBe(JSON.stringify(arrays));
    });

    it('selects an encoded name using the same decoded identity returned by the API', () => {
        const encodedName = '<Name encoding="base64">U2l0ZQ==</Name>';
        const manager = read(serverXml('ignored', '<Pass>selected-secret</Pass>').replace('<Name>ignored</Name>', encodedName), {credentialPath: 'Site'});

        expect(manager.getServerByPath('Site')!.propertiesRaw.password).toBe('selected-secret');
    });

    it('distinguishes literal separators, hierarchy and percent-escaped text', () => {
        const xml = serverXml('Work/Site', '<Pass>literal-secret</Pass>') + serverXml('Work%2FSite', '<Pass>percent-secret</Pass>') + `<Folder>Work${serverXml('Site', '<Pass>nested-secret</Pass>')}</Folder>`;
        const manager = read(xml, {credentialPath: 'Work/Site'});

        expect(manager.getServers().map(server => server.path)).toEqual(['Work%2FSite', 'Work%252FSite', 'Work/Site']);
        expect(manager.getServers().filter(server => server.propertiesRaw.password !== undefined).map(server => server.path)).toEqual(['Work/Site']);
        expect(manager.getServerByPath('Work/Site')!.propertiesRaw.password).toBe('nested-secret');
        expect(manager.getServersTree().servers).toHaveLength(2);
    });

    it('preserves literal folder labels in tree output without merging hierarchies', () => {
        const manager = read(`<Folder>Work/100%${serverXml('Site')}</Folder><Folder>Work<Folder>100%${serverXml('Site')}</Folder></Folder>`);

        expect(manager.getServers().map(server => server.path)).toEqual(['Work%2F100%25/Site', 'Work/100%25/Site']);
        expect(manager.getServersTree().folders.map(folder => folder.name)).toEqual(['Work/100%', 'Work']);
    });

    it('rejects duplicate canonical identities before reading credentials', () => {
        const first = config();

        Object.defineProperty(first, 'Pass', {
            get() {
                throw new Error('credential was read');
            },
        });
        expect(() => new SiteManager({FileZilla3: {Servers: {Server: [first, config()]}}})).toThrow('duplicate site path Site');
        expect(() => read(serverXml('Site') + serverXml('Site'))).toThrow('duplicate site path Site');
    });
});

describe('audit: protocol display names', () => {
    it('uses actual protocol names while retaining numeric enum values and aliases', () => {
        const properties = read(serverXml()).getServers()[0].propertiesRaw;

        for (const [name, value] of Object.entries(ServerProtocol)) {
            if (typeof value === 'number' && name !== 'MAX_VALUE') {
                expect(new Server({...properties, protocol: value}, 'Protocol').siteProtocolName).toBe(name);
            }
        }

        expect(ServerProtocol.CLOUDFLARE_R2).toBe(24);
        expect(ServerProtocol.MAX_VALUE).toBe(24);
    });
});
