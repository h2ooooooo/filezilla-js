import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import {Readable} from 'node:stream';
import {once} from 'node:events';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {FileZillaHostKeyStore} from '@jalsoedesign/filezilla-core';
import {AuthError, HostTrustError, NotFoundError, PermissionError, NotSupportedError, OperationAbortedError} from '@jalsoedesign/dockline-abstract';
import {SftpConnector, type SftpConnectorConfig} from '@jalsoedesign/dockline-sftp-client';
import {createLocalSftp} from './local-sftp.js';

let endpoint: Awaited<ReturnType<typeof createLocalSftp>>;
const adapters: SftpConnector[] = [];

const consume = async (stream: unknown) => {
    const buffers: Buffer[] = [];

    for await (const buffer of stream as Readable) {
        buffers.push(Buffer.from(buffer));
    }

    return Buffer.concat(buffers);
};

const adapter = (options: Partial<SftpConnectorConfig> = {}) => {
    const result = new SftpConnector({
        host: '127.0.0.1',
        port: endpoint.port,
        username: 'fixture',
        password: 'fixture-password',
        initialPath: '',
        timeoutMs: 5000,
        readyTimeout: 3000,
        requireTrustPolicy: true,
        hasTrustPolicy: (challenge) => challenge.fingerprint === endpoint.fingerprint,
        acceptTrustPolicy: () => false,
        ...options,
    });

    adapters.push(result);

    return result;
};

beforeAll(async () => {
    endpoint = await createLocalSftp();
});
afterEach(async () => {
    await Promise.all(adapters.splice(0).map((item) => item.disconnect()));
});
afterAll(async () => {
    await endpoint.close();
});

describe('isolated SFTP protocol integration', () => {
    it('reuses a modern FileZilla hostkeys.xml pin without an approval prompt', async () => {
        const directory = await mkdtemp(path.join(tmpdir(), 'filezilla-trust-integration-'));

        try {
            const filename = path.join(directory, 'hostkeys.xml');

            await writeFile(filename, `<FileZilla3><Server Host="127.0.0.1" Port="${endpoint.port}"><Hostkey>${endpoint.publicKey.toString('base64')}</Hostkey></Server></FileZilla3>`);

            const store = await FileZillaHostKeyStore.fromFile(filename);
            const prompt = vi.fn(async () => false);

            expect(await adapter({hasTrustPolicy: store.hasTrustPolicy, acceptTrustPolicy: prompt}).fileExists('/large.bin')).toBe(true);
            expect(prompt).not.toHaveBeenCalled();
        } finally {
            await rm(directory, {recursive: true, force: true});
        }
    });

    it('rejects unknown or explicitly rejected keys before password authentication', async () => {
        const before = endpoint.observations.passwords;
        const prompt = vi.fn(async () => false);

        await expect(
            adapter({hasTrustPolicy: () => false, acceptTrustPolicy: prompt}).connect(),
        ).rejects.toBeInstanceOf(HostTrustError);
        await expect(adapter({hostVerifier: async () => false}).connect()).rejects.toBeInstanceOf(HostTrustError);
        await expect(adapter({
            hasTrustPolicy: async () => {
                throw new Error('Trust store unavailable');
            },
        }).connect()).rejects.toBeInstanceOf(HostTrustError);
        expect(endpoint.observations.passwords).toBe(before);
        expect(prompt).toHaveBeenCalledTimes(1);
    });

    it('awaits CLI/UI acceptance for a new key and then transfers over the accepted session', async () => {
        const order: string[] = [];
        const connector = adapter({
            hasTrustPolicy: async () => {
                order.push('lookup');

                return false;
            },
            acceptTrustPolicy: async (challenge) => {
                order.push('accept');

                return challenge.fingerprint === endpoint.fingerprint;
            },
        });

        expect(await connector.fileExists('/large.bin')).toBe(true);
        expect(order).toEqual(['lookup', 'accept']);
    });

    it('classifies real password rejection using the shared AuthError constructor', async () => {
        const before = endpoint.observations.connections;

        await expect(adapter({password: 'incorrect', autoReconnect: true}).connect()).rejects.toBeInstanceOf(AuthError);
        expect(endpoint.observations.connections - before).toBe(1);
    });

    it('reads and overwrites multi-megabyte streams, with correct metadata and directory listings', async () => {
        const connector = adapter({timeoutMs: 15000});
        const bytes = await consume(await connector.read('/large.bin'));

        expect(bytes).toEqual(endpoint.files.get('/large.bin'));
        await connector.createDirectory('/nested');
        await connector.write('/nested/upload.bin', () => Readable.from([bytes]), {autoReconnect: true});
        expect(endpoint.files.get('/nested/upload.bin')).toEqual(bytes);
        expect(await connector.lastModified('/large.bin')).toBe(1700000000000);
        expect(await connector.lastModified('/epoch.txt')).toBe(0);

        const listed = [];

        for await (const entry of connector.list('/nested', {deep: true})) {
            listed.push(entry);
        }

        expect(listed).toContainEqual(expect.objectContaining({path: '/nested/upload.bin', type: 'file', size: bytes.length}));
        await connector.moveFile('/nested/upload.bin', '/nested/moved.bin');
        await connector.deleteFile('/nested/moved.bin');
        expect(await connector.fileExists('/nested/moved.bin')).toBe(false);
    }, 60000);

    it('distinguishes missing reads, permissions and unsupported links', async () => {
        const connector = adapter();

        await expect(consume(await connector.read('/missing'))).rejects.toBeInstanceOf(NotFoundError);
        await expect(consume(await connector.read('/denied'))).rejects.toBeInstanceOf(PermissionError);
        await expect(connector.fileExists('/denied')).rejects.toBeInstanceOf(PermissionError);
        await expect(connector.stat('/link')).rejects.toBeInstanceOf(NotSupportedError);
        expect(await connector.fileExists('/missing')).toBe(false);
    });

    it('coalesces real first connections and reconnects explicitly with a new transport', async () => {
        const before = endpoint.observations.connections;
        const connector = adapter();

        await Promise.all([connector.connect(), connector.connect(), connector.connect()]);
        expect(endpoint.observations.connections - before).toBe(1);
        await connector.disconnect();
        expect(await connector.fileExists('/large.bin')).toBe(true);
        expect(endpoint.observations.connections - before).toBe(2);
    });

    it('releases a remote handle when the consumer closes its read', async () => {
        const connector = adapter();
        const stream = await connector.read('/large.bin') as Readable;

        await once(stream, 'readable');
        stream.destroy();
        await once(stream, 'close');
        await vi.waitFor(() => expect(endpoint.observations.openHandles).toBe(0));
    });

    it('aborts a stalled real download with a typed error', async () => {
        const connector = adapter();
        const controller = new AbortController();
        const reading = consume(await connector.read('/hang.bin', {abortSignal: controller.signal}));
        const rejected = expect(reading).rejects.toBeInstanceOf(OperationAbortedError);

        await vi.waitFor(() => expect(endpoint.observations.openHandles).toBeGreaterThan(0));
        controller.abort();
        await rejected;
        await vi.waitFor(() => expect(endpoint.observations.openHandles).toBe(0));
    });

    it('authenticates with an encrypted key file and reports wrong passphrases as AuthError', async () => {
        const directory = await mkdtemp(path.join(tmpdir(), 'filezilla-sftp-key-'));

        try {
            const filename = path.join(directory, 'fixture-key');

            await writeFile(filename, endpoint.userKey.private);

            const connector = adapter({password: undefined, privateKeyPath: filename, passphrase: 'fixture-passphrase'});

            expect(await connector.fileExists('/large.bin')).toBe(true);
            await expect(adapter({password: undefined, privateKeyPath: filename, passphrase: 'incorrect'}).connect()).rejects.toBeInstanceOf(AuthError);
        } finally {
            await rm(directory, {recursive: true, force: true});
        }
    });

    it('records upstream T2: v12 still rewrites generic status 4 as file absence', async () => {
    // This is a known upstream limitation, not a desired adapter guarantee.
    // Update this evidence when upstream preserves the original status code.
        expect(await adapter().fileExists('/generic-failure')).toBe(false);
    });
});
