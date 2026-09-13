import {mkdtemp, readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staging = await mkdtemp(path.join(tmpdir(), 'filezilla consumer evidence '));
const npmCli = process.env.npm_execpath;

if (!npmCli) {
    throw new Error('Run this check using npm run check:consumer');
}

const directory = await mkdtemp(path.join(tmpdir(), 'filezilla packed consumer '));
const artifacts = path.join(directory, 'artifacts');

await mkdir(artifacts);

const results = [];

async function command(label, executable, args, cwd) {
    let output = '';
    const child = spawn(executable, args, {cwd, windowsHide: true});

    child.stdout.on('data', (chunk) => {
        output += chunk;
    });
    child.stderr.on('data', (chunk) => {
        output += chunk;
    });

    const code = await new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', resolve);
    });

    await writeFile(path.join(staging, `consumer-${label}.log`), output);
    results.push({label, exitCode: code});
    await writeFile(path.join(staging, 'packed-consumer-verification.json'), JSON.stringify({
        directory,
        node: process.version,
        npm: '12.0.2',
        results,
    }, null, 2));

    if (code !== 0) {
        throw new Error(`${label} failed: ${output.slice(-7000)}`);
    }

    console.log(`${label}: PASS`);

    return output;
}

const packedOutput = await command('pack', process.execPath, [
    npmCli,
    'pack',
    '--workspaces',
    '--ignore-scripts',
    '--pack-destination',
    artifacts,
    '--json',
], repository);
const packResult = JSON.parse(packedOutput);
const packed = Array.isArray(packResult) ? packResult : Object.values(packResult);

await writeFile(path.join(staging, 'pack-after.json'), JSON.stringify(packed, null, 2));

const dependencies = {
    ...Object.fromEntries(packed.map((item) => [item.name, `file:${path.join(artifacts, item.filename).split(path.sep).join('/')}`])),
    '@jalsoedesign/dockline-core': '^1.0.0',
};

await writeFile(path.join(directory, 'package.json'), JSON.stringify({
    name: 'filezilla-packed-consumer',
    private: true,
    type: 'module',
    dependencies,
    devDependencies: {typescript: '6.0.3', '@types/node': '22.20.2'},
    allowScripts: {'ssh2': false, 'cpu-features': false},
}, null, 2));
await writeFile(path.join(directory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        types: ['node'],
    },
    include: ['consumer.ts', 'transfer-recipes.ts', 'features.ts', 'quick-start-*.ts'],
}, null, 2));
await writeFile(path.join(directory, 'consumer.ts'), `import {Readable} from 'node:stream';
import {Server, SiteManager} from '@jalsoedesign/filezilla-core';
import {ConnectorFactory, AuthError, type ConnectorOperationOptions} from '@jalsoedesign/filezilla-connector-abstract';
import {FtpConnector, FtpConnectorFactory} from '@jalsoedesign/filezilla-connector-ftp';
import {SftpConnector, SftpConnectorFactory, FileZillaHostKeyStore, type SftpHostKeyChallenge} from '@jalsoedesign/filezilla-connector-sftp';
import {FileStorage} from '@flystorage/file-storage';
import {Dockline, type TransferConfig} from '@jalsoedesign/dockline-core';
const settings: ConnectorOperationOptions = {autoReconnect: true, maxTransientRetries: 3};
const sftp = new SftpConnector({host: 'localhost', port: 22, username: 'fixture', initialPath: '', ...settings, requireTrustPolicy: true, hasTrustPolicy: async (key: SftpHostKeyChallenge) => key.fingerprint === 'fixture', acceptTrustPolicy: async () => false});
const ftp = new FtpConnector({host: 'localhost', port: 21, user: 'fixture', password: '', secure: false, passive: true, initialPath: '', ...settings});
const ftpFactory: ConnectorFactory<FtpConnector> = new FtpConnectorFactory();
const sftpFactory: ConnectorFactory<SftpConnector> = new SftpConnectorFactory();
const storage = new FileStorage(sftp);
const upload = () => sftp.write('fixture.txt', () => Readable.from('fixture'), settings);
const savedConfig = (server: Server): TransferConfig => SftpConnectorFactory.toConfig(server, {requireTrustPolicy: true, hasTrustPolicy: () => false, acceptTrustPolicy: () => false});
const transfer = (config: TransferConfig) => Dockline.withConnection(config, async remote => {
    await remote.uploadFile('./fixture.txt', 'fixture.txt');
    await remote.downloadFile('fixture.txt', './download.txt');
});
void [Server, SiteManager, AuthError, ftp, ftpFactory, sftpFactory, storage, upload, savedConfig, transfer, FileZillaHostKeyStore.fromFile];
`);
await writeFile(path.join(directory, 'runtime.mjs'), `import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
import {AuthError, ConnectorFactory} from '@jalsoedesign/filezilla-connector-abstract';
import {AuthError as FtpAuthError, FtpConnectorFactory} from '@jalsoedesign/filezilla-connector-ftp';
import {AuthError as SftpAuthError, SftpConnectorFactory, SftpConnector as FileZillaSftp} from '@jalsoedesign/filezilla-connector-sftp';
import {FtpConnector as FileZillaFtp} from '@jalsoedesign/filezilla-connector-ftp';
import {AuthError as DocklineAuthError} from '@jalsoedesign/dockline-abstract';
import {FtpConnector} from '@jalsoedesign/dockline-ftp-client';
import {SftpConnector} from '@jalsoedesign/dockline-sftp-client';
assert.equal(typeof require('@jalsoedesign/filezilla-core').SiteManager, 'function');
assert.equal(AuthError, DocklineAuthError);
assert.equal(FtpConnector, FileZillaFtp);
assert.equal(SftpConnector, FileZillaSftp);
assert.equal(FtpAuthError, AuthError);
assert.equal(SftpAuthError, AuthError);
assert.ok(new FtpConnectorFactory() instanceof ConnectorFactory);
assert.ok(new SftpConnectorFactory() instanceof ConnectorFactory);
assert.equal(typeof FtpConnectorFactory.fromServer, 'function');
assert.equal(typeof SftpConnectorFactory.fromServer, 'function');
console.log('Packed CJS/ESM entry points and shared runtime identity passed');
`);
await command('install', process.execPath, [
    npmCli,
    'install',
    '--offline=false',
    '--no-audit',
    '--no-fund',
], directory);
await copyFile(path.join(directory, 'node_modules/@jalsoedesign/filezilla-cli/examples/transfer-recipes.ts'),
    path.join(directory, 'transfer-recipes.ts'));
await writeFile(path.join(directory, 'features.ts'), `import {Readable} from 'node:stream';
import {ConnectorPool, ConnectorRegistry, BandwidthBudget, NameResolutionError, PublicationError} from '@jalsoedesign/filezilla-connector-abstract';
import {SftpConnector, SftpConnectorFactory, KnownHostsStore} from '@jalsoedesign/filezilla-connector-sftp';
import {ServerProtocol, readSiteManagerReport, SiteIdentityStore, createMetadataSnapshot, diffMetadata} from '@jalsoedesign/filezilla-core';
const make = () => new SftpConnector({host: 'localhost', port: 22, username: 'fixture', initialPath: '',
    requireTrustPolicy: true, hasTrustPolicy: () => false, acceptTrustPolicy: () => false,
    keyboardInteractive: 'fixture', agentForward: false, keepalive: {intervalMs: 30000, maxMissed: 3},
    credentialProvider: async context => ({type: 'password', password: context.siteId ?? 'fixture'}),
});
const pool = new ConnectorPool({create: make, maxConnections: 3, serverMaxConnections: 2});
const registry = new ConnectorRegistry();
const registration = registry.register({protocols: [ServerProtocol.SFTP], factory: new SftpConnectorFactory()});
const connector = make();
const upload = () => connector.publishFile('fixture', () => Readable.from(['fixture']), {overwrite: 'replace',
    requireAtomicRename: true, bandwidth: new BandwidthBudget({bytesPerSecond: 100000}), onProgress: event => void event.stage});
const copy = () => connector.copyFileWithStrategy('fixture', 'fixture-copy', {overwrite: 'fail'});
const digest = () => connector.checksumDetails('fixture', {strategy: 'stream', maxBytes: 1024});
const inventory = () => connector.walk('.', {maxDepth: 3, maxEntries: 100});
void [pool, registration, upload, copy, digest, inventory, KnownHostsStore.open, NameResolutionError, PublicationError,
    readSiteManagerReport, SiteIdentityStore, createMetadataSnapshot, diffMetadata];
`);

const quickStart = await readFile(path.join(repository, 'docs/guide/quick-start.md'), 'utf8');
const examples = [...quickStart.matchAll(/```ts\r?\n([\s\S]*?)```/g)].map(match => match[1]);

if (examples.length !== 4) {
    throw new Error('Review the quick-start compilation cases when its code blocks change');
}

for (const [index, example] of [examples[0], examples[1] + examples[2], examples[3]].entries()) {
    await writeFile(path.join(directory, `quick-start-${index}.ts`), example);
}

await command('types', process.execPath, [path.join(directory, 'node_modules/typescript/bin/tsc'), '--project', path.join(directory, 'tsconfig.json')], directory);
await command('runtime', process.execPath, [path.join(directory, 'runtime.mjs')], directory);
await command('cli', process.execPath, [path.join(directory, 'node_modules/@jalsoedesign/filezilla-cli/dist/cli.js'), '--help'], directory);
console.log(`Packed consumers verified at ${directory}`);

console.log('Verification evidence: ' + staging);
