import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {getSiteManager} from '@jalsoedesign/filezilla-core';
import {Dockline} from '@jalsoedesign/dockline-core';
import {SftpConnector as TransferSftpConnector, AuthError as TransferAuthError} from '@jalsoedesign/dockline-sftp-client';
import {SftpConnector, SftpConnectorFactory, AuthError} from '../src/index.js';
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

describe('FileZilla selected site to Dockline', () => {
    it('loads only the selected credential, maps config, uploads and downloads one file', async () => {
        const directory = await mkdtemp(path.join(tmpdir(), 'filezilla-dockline-bridge-'));
        const settingsFile = path.join(directory, 'sitemanager.xml');
        const localSource = path.join(directory, 'source.txt');
        const localTarget = path.join(directory, 'download.txt');

        temporaryDirectories.push(directory);

        await writeFile(settingsFile, '<FileZilla3><Servers><Server><Host>127.0.0.1</Host><Port>' +
        server.port + '</Port><Protocol>1</Protocol><Type>0</Type><User>fixture</User>' +
        '<Pass>fixture-password</Pass><Logontype>1</Logontype><Name>Example</Name>' +
        '</Server></Servers></FileZilla3>');
        await writeFile(localSource, 'selected site transfer');

        const inventory = getSiteManager(settingsFile, {includePasswords: false});
        const selected = inventory.getServerByPath('Example');

        expect(selected?.properties.password).toBeUndefined();

        const credentials = getSiteManager(settingsFile, {credentialPath: 'Example'});
        const authenticated = credentials.getServerByPath('Example');

        if (!authenticated) {
            throw new Error('Missing selected fixture site');
        }

        const config = SftpConnectorFactory.toConfig(authenticated, {
            requireTrustPolicy: true,
            hasTrustPolicy: challenge => challenge.fingerprint === server.fingerprint,
            acceptTrustPolicy: () => false,
            timeoutMs: 3000,
        });

        expect(config).toMatchObject({protocol: 'sftp', username: 'fixture', root: ''});
        expect(config).not.toHaveProperty('initialPath');
        expect(new SftpConnectorFactory().toConfig(authenticated).protocol).toBe('sftp');

        await Dockline.withConnection(config, async remote => {
            await remote.uploadFile(localSource, 'bridge.txt');
            await remote.downloadFile('bridge.txt', localTarget);
        });

        expect(server.files.get('bridge.txt')?.toString()).toBe('selected site transfer');
        expect(await readFile(localTarget, 'utf8')).toBe('selected site transfer');
    });

    it('keeps existing class and error imports identical to Dockline', () => {
        expect(SftpConnector).toBe(TransferSftpConnector);
        expect(AuthError).toBe(TransferAuthError);
    });
});
