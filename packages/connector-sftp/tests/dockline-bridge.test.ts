import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';
import {createLocalSftp} from './local-sftp.js';

let server: Awaited<ReturnType<typeof createLocalSftp>>;
const temporaryDirectories: string[] = [];

beforeAll(async () => {
    server = await createLocalSftp();
});

afterAll(async () => {
    await server.close();
    await Promise.all(temporaryDirectories.map(directory => rm(directory, {recursive: true, force: true})));
});

describe('FileZilla source through the shared bridge', () => {
    it('resolves only the selected credential and transfers using an exact server pin', async () => {
        const directory = await mkdtemp(path.join(tmpdir(), 'filezilla-normalized-'));
        const settingsFile = path.join(directory, 'sitemanager.xml');
        const localSource = path.join(directory, 'source.txt');
        const localTarget = path.join(directory, 'download.txt');

        temporaryDirectories.push(directory);
        await writeFile(settingsFile, '<FileZilla3><Servers><Server><Host>127.0.0.1</Host><Port>' +
        server.port + '</Port><Protocol>1</Protocol><Type>0</Type><User>fixture</User>' +
        '<Pass>fixture-password</Pass><Logontype>1</Logontype><Name>Example</Name>' +
        '</Server></Servers></FileZilla3>');
        await writeFile(localSource, 'selected site transfer');

        const source = FileZillaProfileSource.fromFile(settingsFile);
        const bridge = createDocklineBridge({source});

        expect(source.manager.getServers()[0].propertiesRaw.password).toBeUndefined();
        expect(JSON.stringify(source.list())).not.toContain('fixture-password');

        await bridge.withFiles('Example', async remote => {
            await remote.uploadFile(localSource, 'bridge.txt');
            await remote.downloadFile('bridge.txt', localTarget);
        }, {hostFingerprint: server.fingerprint, timeoutMs: 3000});

        expect(server.files.get('bridge.txt')?.toString()).toBe('selected site transfer');
        expect(await readFile(localTarget, 'utf8')).toBe('selected site transfer');
        expect(source.manager.getServers()[0].propertiesRaw.password).toBeUndefined();
        await expect(bridge.withFiles('Example', async () => {}, {
            hostFingerprint: 'SHA256:' + 'A'.repeat(43),
            timeoutMs: 3000,
        })).rejects.toThrow();
    });
});
