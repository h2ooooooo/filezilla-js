import {afterEach, describe, expect, it, vi} from 'vitest';
import {mkdtemp, readFile, rm, writeFile, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {createHash} from 'node:crypto';
import {Server, LogonType, ServerProtocol} from '@jalsoedesign/filezilla-core';
import {IntegrityError} from '@jalsoedesign/filezilla-connector-abstract';
import {
    createPinnedSftp,
    downloadToNewFile,
    publishNewFile,
    withConnectedSite,
    type RecipeConnector,
} from '../examples/transfer-recipes.js';
import {createLocalSftp} from '../../connector-sftp/tests/local-sftp.js';

const cleanup: (() => Promise<void>)[] = [];

afterEach(async () => {
    for (const close of cleanup.splice(0).reverse()) {
        await close();
    }
});

async function directory() {
    const path = await mkdtemp(join(tmpdir(), 'filezilla-transfer-recipes-'));

    cleanup.push(() => rm(path, {recursive: true, force: true}));

    return path;
}

function connectorFixture(contents = Buffer.from('complete fixture'), advertisedSize = contents.length) {
    const events: string[] = [];
    const connector = {
        connect: vi.fn(async () => {
            events.push('connected');
        }),
        disconnect: vi.fn(async () => {
            events.push('closed');
        }),
        stat: vi.fn(async () => ({type: 'file', path: '/fixture', size: advertisedSize})),
        read: vi.fn(async () => Readable.from((async function* () {
            yield contents;
            events.push('consumed');
        })())),
    };

    return {connector: connector as unknown as RecipeConnector, events, spies: connector};
}

describe('typed transfer recipe ownership', () => {
    it('consumes the whole download before closing and never overwrites an existing local file', async () => {
        const local = join(await directory(), 'download.txt');
        const fixture = connectorFixture();

        expect(await downloadToNewFile(() => fixture.connector, '/fixture', local)).toEqual({bytesWritten: 16});
        expect(await readFile(local, 'utf8')).toBe('complete fixture');
        expect(fixture.events).toEqual(['connected', 'consumed', 'closed']);

        await expect(downloadToNewFile(() => fixture.connector, '/fixture', local)).rejects.toThrow();

        expect(await readFile(local, 'utf8')).toBe('complete fixture');
        expect(fixture.spies.disconnect).toHaveBeenCalledTimes(2);
    });

    it('detects incomplete reads and removes only its newly created local file', async () => {
        const path = await directory();
        const local = join(path, 'partial.txt');
        const unrelated = join(path, 'unrelated.txt');
        const fixture = connectorFixture(Buffer.from('short'), 100);

        await writeFile(unrelated, 'keep this');

        await expect(downloadToNewFile(() => fixture.connector, '/fixture', local)).rejects.toBeInstanceOf(IntegrityError);
        await expect(access(local)).rejects.toThrow();

        expect(await readFile(unrelated, 'utf8')).toBe('keep this');
        expect(fixture.spies.disconnect).toHaveBeenCalledOnce();
    });

    it('closes a failed connection and preserves both operation and cleanup failures', async () => {
        const fixture = connectorFixture();

        fixture.spies.connect.mockRejectedValue(new Error('connect failed'));
        fixture.spies.disconnect.mockRejectedValue(new Error('close failed'));

        await expect(withConnectedSite(() => fixture.connector, {}, async () => 'unreachable'))
            .rejects.toBeInstanceOf(AggregateError);
        expect(fixture.spies.disconnect).toHaveBeenCalledOnce();
    });

    it('does not create a session when already cancelled', async () => {
        const factory = vi.fn(() => connectorFixture().connector);
        const controller = new AbortController();

        controller.abort();

        await expect(downloadToNewFile(factory, '/fixture', join(await directory(), 'never.txt'), {
            abortSignal: controller.signal,
        })).rejects.toThrow();

        expect(factory).not.toHaveBeenCalled();
    });
});

async function verifiedFixture() {
    const endpoint = await createLocalSftp();

    cleanup.push(endpoint.close);

    const site = new Server({
        host: '127.0.0.1',
        port: endpoint.port,
        protocol: ServerProtocol.SFTP,
        type: 0,
        name: 'Disposable fixture',
        user: 'fixture',
        password: 'fixture-password',
        logonType: LogonType.normal,
        timezoneOffset: 0,
        passiveMode: 0,
        maximumMultipleConnections: 0,
        encodingType: 2,
        bypassProxy: false,
        synchronizedBrowsing: false,
        directoryComparison: false,
    }, 'Disposable fixture');

    return {...endpoint, factory: () => createPinnedSftp(site, endpoint.fingerprint)};
}

describe('typed recipes against disposable SFTP', () => {
    it('downloads verified content and publishes a new file with explicit integrity verification', async () => {
        const endpoint = await verifiedFixture();
        const local = join(await directory(), 'epoch.txt');

        expect(await downloadToNewFile(endpoint.factory, '/epoch.txt', local, {timeoutMs: 3000}))
            .toEqual({bytesWritten: 5});
        expect(await readFile(local, 'utf8')).toBe('epoch');

        const published = await publishNewFile(endpoint.factory, local, '/published.txt', {
            timeoutMs: 3000,
            expectedSha256: createHash('sha256').update('epoch').digest('hex'),
        });

        expect(published).toMatchObject({destination: '/published.txt', verified: true, cleanup: 'done'});
        expect(endpoint.files.get('/published.txt')?.toString()).toBe('epoch');
        expect(endpoint.observations.openHandles).toBe(0);
    });

    it('cancels a stalled remote read, removes the partial local file and releases handles', async () => {
        const endpoint = await verifiedFixture();
        const local = join(await directory(), 'cancelled.txt');
        const controller = new AbortController();
        const pending = downloadToNewFile(endpoint.factory, '/hang.bin', local, {
            timeoutMs: 3000,
            abortSignal: controller.signal,
        });
        const timer = setTimeout(() => controller.abort(), 500);

        try {
            await expect(pending).rejects.toThrow();
            await expect(access(local)).rejects.toThrow();

            expect(endpoint.observations.openHandles).toBe(0);
        } finally {
            clearTimeout(timer);
        }
    });

    it('never replaces an existing destination when publication fails', async () => {
        const endpoint = await verifiedFixture();
        const local = join(await directory(), 'source.txt');

        await writeFile(local, 'new data');

        await expect(publishNewFile(endpoint.factory, local, '/epoch.txt', {timeoutMs: 3000})).rejects.toThrow();

        expect(endpoint.files.get('/epoch.txt')?.toString()).toBe('epoch');
        expect(endpoint.observations.openHandles).toBe(0);
    });
});
