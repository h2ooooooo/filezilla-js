import {afterEach, describe, expect, it, vi} from 'vitest';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Server, ServerProtocol, LogonType} from '@jalsoedesign/filezilla-core';
import {SftpConnectorFactory, type SftpConnector, type SftpConnectorFactoryOptions} from '@jalsoedesign/filezilla-connector-sftp';
import {AuthError, HostTrustError, NameResolutionError, PermissionError} from '@jalsoedesign/filezilla-connector-abstract';
import {checkConnection} from '../src/commands/check.js';
import {createLocalSftp} from '../../connector-sftp/tests/local-sftp.js';

const fingerprint = 'SHA256:' + 'A'.repeat(43);
const cleanup: (() => void | Promise<void>)[] = [];

afterEach(async () => {
    vi.restoreAllMocks();

    for (const close of cleanup.splice(0).reverse()) {
        await close();
    }
});

function site(options: Partial<Server['propertiesRaw']> = {}): Server {
    return new Server({
        host: '127.0.0.1',
        port: 22,
        protocol: ServerProtocol.SFTP,
        type: 0,
        name: 'Fixture',
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
        ...options,
    }, 'Fixture');
}

function mockedConnector() {
    const calls: string[] = [];
    const connector = {
        connect: vi.fn(async () => {
            calls.push('connect');
        }),
        disconnect: vi.fn(async () => {
            calls.push('disconnect');
        }),
        stat: vi.fn(async () => {
            calls.push('stat');

            return {
                path: '/',
                type: 'directory',
                isDirectory: true,
                isFile: false,
            };
        }),
        list: vi.fn(async function* () {
            calls.push('list');

            yield {
                path: '/a',
                type: 'file',
                size: 1,
                password: 'never-serialize',
            };
            yield {path: '/b', type: 'directory'};
        }),
    };
    const factory = vi.spyOn(SftpConnectorFactory, 'fromServer').mockReturnValue(connector as unknown as SftpConnector);

    return {connector, calls, factory};
}

describe('read-only check operation', () => {
    it('connects and closes without directory probes or listing by default', async () => {
        const fixture = mockedConnector();
        const result = await checkConnection(site(), {hostKeySha256: fingerprint});

        expect(result).toMatchObject({
            ok: true,
            exitCode: 0,
            connected: true,
            directoryChecked: false,
            cleanup: 'closed',
        });
        expect(result).not.toHaveProperty('listing');
        expect(fixture.calls).toEqual(['connect', 'disconnect']);
        expect(fixture.connector.connect.mock.calls[0]).toEqual([
            expect.objectContaining({
                autoReconnect: false,
                maxTransientRetries: 0,
            }),
        ]);
    });

    it('uses explicit required pinning and never accepts an unknown key interactively', async () => {
        const fixture = mockedConnector();

        await checkConnection(site(), {hostKeySha256: fingerprint});

        const options = fixture.factory.mock.calls[0][1] as SftpConnectorFactoryOptions;
        const challenge = {
            host: '127.0.0.1',
            port: 22,
            keyType: 'ssh-rsa',
            fingerprint,
            publicKey: Buffer.alloc(0),
            changed: false,
            abortSignal: new AbortController().signal,
        };

        expect(options.requireTrustPolicy).toBe(true);
        expect(await options.hasTrustPolicy!(challenge)).toBe(true);
        expect(await options.hasTrustPolicy!({...challenge, fingerprint: 'different'})).toBe(false);
        expect(await options.acceptTrustPolicy!(challenge)).toBe(false);
    });

    it('only performs explicitly requested metadata operations and allowlists listing output', async () => {
        const fixture = mockedConnector();
        const result = await checkConnection(site(), {
            hostKeySha256: fingerprint,
            directory: '/',
            includeListing: true,
        });

        expect(fixture.calls).toEqual(['connect', 'stat', 'list', 'disconnect']);
        expect(result.directoryChecked).toBe(true);
        expect(result.listing).toEqual([{path: '/a', type: 'file', size: 1}, {path: '/b', type: 'directory'}]);
        expect(JSON.stringify(result)).not.toContain('never-serialize');
        expect(Object.isFrozen(result.listing)).toBe(true);
    });

    it('rejects missing trust, credentials, unsupported protocols and invalid options before connecting', async () => {
        const fixture = mockedConnector();

        expect((await checkConnection(site())).exitCode).toBe(3);
        expect((await checkConnection(site({password: undefined}), {hostKeySha256: fingerprint})).exitCode).toBe(8);
        expect((await checkConnection(site({protocol: 255}))).exitCode).toBe(5);
        expect((await checkConnection(site(), {hostKeySha256: fingerprint, timeoutMs: 0})).exitCode).toBe(2);
        expect(fixture.factory).not.toHaveBeenCalled();
    });

    it.each([
        [new AuthError('secret-one'), 'authentication-failed', 4, 'authenticate'],
        [new HostTrustError('secret-two'), 'trust-rejected', 3, 'trust'],
        [new NameResolutionError('secret-three'), 'connection-failed', 6, 'resolve'],
        [new PermissionError('secret-four'), 'directory-failed', 7, 'connect'],
        [new Error('secret-five'), 'connection-failed', 6, 'connect'],
    ])('classifies %s without echoing raw messages or retaining causes', async (error, status, exitCode, stage) => {
        const fixture = mockedConnector();

        fixture.connector.connect.mockRejectedValue(error);

        const result = await checkConnection(site(), {hostKeySha256: fingerprint});

        expect(result).toMatchObject({
            status,
            exitCode,
            stage,
            cleanup: 'closed',
        });
        expect(JSON.stringify(result)).not.toMatch(/secret|stack|cause/);
        expect(fixture.connector.disconnect).toHaveBeenCalledOnce();
    });

    it('bounds a blocked connect and releases it on timeout or cancellation', async () => {
        const fixture = mockedConnector();

        fixture.connector.connect.mockImplementation(() => new Promise(() => {}));

        expect((await checkConnection(site(), {hostKeySha256: fingerprint, timeoutMs: 10})).status).toBe('timeout');

        const controller = new AbortController();
        const pending = checkConnection(site(), {hostKeySha256: fingerprint, abortSignal: controller.signal});

        controller.abort();

        expect((await pending).exitCode).toBe(130);
        expect(fixture.connector.disconnect).toHaveBeenCalledTimes(2);
    });

    it('reports listing limits and cleanup failure explicitly', async () => {
        const fixture = mockedConnector();
        const limited = await checkConnection(site(), {
            hostKeySha256: fingerprint,
            includeListing: true,
            maxEntries: 1,
        });

        expect(limited).toMatchObject({status: 'listing-limit', exitCode: 11, cleanup: 'closed'});
        expect(limited).not.toHaveProperty('listing');

        fixture.connector.disconnect.mockRejectedValue(new Error('private-cleanup-message'));

        expect(await checkConnection(site(), {hostKeySha256: fingerprint})).toMatchObject({
            status: 'cleanup-failed',
            exitCode: 10,
            cleanup: 'failed',
        });
    });
});

const requireFromCli = createRequire(join(__dirname, '../package.json'));

async function runCli(args: string[], input?: string, keepInputOpen = false) {
    const child = spawn(process.execPath, [requireFromCli.resolve('tsx/cli'), join(__dirname, '../src/cli.ts'), ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {...process.env, FORCE_COLOR: '0'},
        shell: false,
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
        stdout += chunk;
    });
    child.stderr.on('data', chunk => {
        stderr += chunk;
    });

    if (!keepInputOpen) {
        child.stdin.end(input);
    }

    const timer = setTimeout(() => child.kill(), 10000);

    try {
        const exitCode = await new Promise<number | null>((resolve, reject) => {
            child.once('error', reject);
            child.once('exit', resolve);
        });

        return {exitCode, stdout, stderr};
    } finally {
        clearTimeout(timer);
        child.kill();
    }
}

async function localFixture() {
    const fixture = await createLocalSftp();
    const directory = mkdtempSync(join(tmpdir(), 'filezilla-cli-check-'));
    const path = join(directory, 'sites.xml');

    cleanup.push(() => rmSync(directory, {recursive: true, force: true}));
    cleanup.push(fixture.close);
    writeFileSync(path, `<FileZilla3><Servers><Server><Name>Fixture</Name><Host>127.0.0.1</Host><Port>${fixture.port}</Port><Protocol>1</Protocol><Logontype>1</Logontype><User>fixture</User><Pass>fixture-password</Pass></Server></Servers></FileZilla3>`);

    return {...fixture, path};
}

describe('CLI check loopback acceptance', () => {
    it('rejects unknown host keys before password authentication', async () => {
        const fixture = await localFixture();
        const response = await runCli([
            'check',
            'Fixture',
            '--file',
            fixture.path,
            '--json',
            '--host-key-sha256',
            fingerprint,
        ]);

        expect(response.exitCode).toBe(3);
        expect(JSON.parse(response.stdout)).toMatchObject({status: 'trust-rejected', stage: 'trust', cleanup: 'closed'});
        expect(response.stderr).toBe('');
        expect(fixture.observations.passwords).toBe(0);
        expect(response.stdout).not.toContain('fixture-password');
    });

    it('authenticates with the verified key and leaves the fixture files unchanged', async () => {
        const fixture = await localFixture();
        const before = [...fixture.files].map(([path, bytes]) => [path, bytes.toString('base64')]);
        const response = await runCli([
            'check',
            'Fixture',
            '--file',
            fixture.path,
            '--json',
            '--host-key-sha256',
            fixture.fingerprint,
            '--directory',
            '/',
            '--include-listing',
        ]);

        expect(response.exitCode, response.stdout + response.stderr).toBe(0);
        expect(JSON.parse(response.stdout)).toMatchObject({ok: true, directoryChecked: true, cleanup: 'closed'});
        expect(response.stderr).toBe('');
        expect([...fixture.files].map(([path, bytes]) => [path, bytes.toString('base64')])).toEqual(before);
        expect(fixture.observations.openHandles).toBe(0);
    });

    it('reads credentials from stdin without putting them in argv or output', async () => {
        const fixture = await localFixture();
        const response = await runCli([
            'check',
            'Fixture',
            '--file',
            fixture.path,
            '--json',
            '--password-stdin',
            '--host-key-sha256',
            fixture.fingerprint,
        ], 'synthetic-wrong-secret\n');

        expect(response.exitCode).toBe(4);
        expect(JSON.parse(response.stdout).status).toBe('authentication-failed');
        expect(response.stdout + response.stderr).not.toContain('synthetic-wrong-secret');
    });

    it('times out unfinished stdin and reports invalid selections/options as stable JSON', async () => {
        const fixture = await localFixture();
        const stalled = await runCli([
            'check',
            'Fixture',
            '--file',
            fixture.path,
            '--json',
            '--password-stdin',
            '--timeout-ms',
            '30',
            '--host-key-sha256',
            fixture.fingerprint,
        ], undefined, true);

        expect(stalled.exitCode).toBe(124);
        expect(JSON.parse(stalled.stdout)).toMatchObject({status: 'timeout', stage: 'credentials'});

        const untrusted = await runCli([
            'check',
            'Fixture',
            '--file',
            fixture.path,
            '--json',
            '--password-stdin',
        ], undefined, true);

        expect(untrusted.exitCode).toBe(3);
        expect(JSON.parse(untrusted.stdout)).toMatchObject({status: 'trust-rejected', stage: 'trust'});

        const invalid = await runCli([
            'check',
            'Missing',
            '--file',
            fixture.path,
            '--json',
        ]);
        const unknownFlag = await runCli([
            'check',
            'Fixture',
            '--password',
            'private-value',
            '--json',
        ]);

        expect(invalid.exitCode).toBe(9);
        expect(JSON.parse(invalid.stdout).status).toBe('invalid-site');
        expect(unknownFlag.exitCode).toBe(2);
        expect(unknownFlag.stdout + unknownFlag.stderr).not.toContain('private-value');
        expect(JSON.parse(unknownFlag.stdout).status).toBe('invalid-options');
    });
});
