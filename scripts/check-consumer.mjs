import {mkdtemp, readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {argument, artifactPackages} from './package-artifacts.mjs';

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
    let stdout = '';
    const child = spawn(executable, args, {cwd, windowsHide: true});

    child.stdout.on('data', (chunk) => {
        output += chunk;
        stdout += chunk;
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

    return stdout;
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

if (process.argv.includes('--artifacts')) {
    for (const item of await artifactPackages(argument('--artifacts'))) {
        if (packed.some(candidate => candidate.name === item.name)) {
            continue;
        }

        await copyFile(item.file, path.join(artifacts, item.filename));
        packed.push(item);
    }
}

await writeFile(path.join(staging, 'pack-after.json'), JSON.stringify(packed, null, 2));

const dependencies = {
    '@jalsoedesign/dockline-core': '^1.1.0',
    ...Object.fromEntries(packed.map((item) => [item.name, `file:${path.join(artifacts, item.filename).split(path.sep).join('/')}`])),
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
    include: ['consumer.ts', 'transfer-recipes.ts', 'features.ts', 'documented-*.ts'],
}, null, 2));
await writeFile(path.join(directory, 'consumer.ts'), `import {Readable} from 'node:stream';
import {Server, SiteManager} from '@jalsoedesign/filezilla-core';
import {ProfileConnectorFactory} from '@jalsoedesign/portline-abstract';
import {CredentialResolver, ProfileCatalog} from '@jalsoedesign/portline-core';
import {createProfileCli} from '@jalsoedesign/portline-cli';
import {createFileZillaCliSource} from '@jalsoedesign/filezilla-cli';
import {ConnectorFactory} from '@jalsoedesign/filezilla-connector-abstract';
import {AuthError, type ConnectorOperationOptions} from '@jalsoedesign/dockline-abstract';
import {FtpConnector} from '@jalsoedesign/dockline-ftp-client';
import {FtpConnectorFactory} from '@jalsoedesign/filezilla-connector-ftp';
import {SftpConnector, type SftpHostKeyChallenge} from '@jalsoedesign/dockline-sftp-client';
import {SftpConnectorFactory, FileZillaHostKeyStore} from '@jalsoedesign/filezilla-connector-sftp';
import {FileStorage} from '@flystorage/file-storage';
import {Dockline, type TransferConfig} from '@jalsoedesign/dockline-core';
const settings: ConnectorOperationOptions = {autoReconnect: true, maxTransientRetries: 3};
const sftp = new SftpConnector({host: 'localhost', port: 22, username: 'fixture', initialPath: '', ...settings, requireTrustPolicy: true, hasTrustPolicy: async (key: SftpHostKeyChallenge) => key.fingerprint === 'fixture', acceptTrustPolicy: async () => false});
const ftp = new FtpConnector({host: 'localhost', port: 21, user: 'fixture', password: '', secure: false, passive: true, initialPath: '', ...settings});
const ftpFactory: ConnectorFactory<FtpConnector> = new FtpConnectorFactory();
const sftpFactory: ConnectorFactory<SftpConnector> = new SftpConnectorFactory();
const sharedFactory: ProfileConnectorFactory<Server, SftpConnector> = sftpFactory;
const sharedCli = createProfileCli({name: 'consumer-js', loadSource: () => createFileZillaCliSource(new SiteManager({FileZilla3: {Servers: {}}}))});
const storage = new FileStorage(sftp);
const upload = () => sftp.write('fixture.txt', () => Readable.from('fixture'), settings);
const savedConfig = (server: Server): TransferConfig => SftpConnectorFactory.toConfig(server, {requireTrustPolicy: true, hasTrustPolicy: () => false, acceptTrustPolicy: () => false});
const transfer = (config: TransferConfig) => Dockline.withConnection(config, async remote => {
    await remote.uploadFile('./fixture.txt', 'fixture.txt');
    await remote.downloadFile('fixture.txt', './download.txt');
});
void [Server, SiteManager, AuthError, ftp, ftpFactory, sftpFactory, storage, upload, savedConfig, transfer, FileZillaHostKeyStore.fromFile,
    sharedFactory, sharedCli, CredentialResolver, ProfileCatalog];
`);
await writeFile(path.join(directory, 'runtime.mjs'), `import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
import {AuthError} from '@jalsoedesign/dockline-abstract';
import {ConnectorFactory} from '@jalsoedesign/filezilla-connector-abstract';
import {FtpConnectorFactory} from '@jalsoedesign/filezilla-connector-ftp';
import {SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';
import {AuthError as DocklineAuthError} from '@jalsoedesign/dockline-abstract';
import {FtpConnector} from '@jalsoedesign/dockline-ftp-client';
import {SftpConnector} from '@jalsoedesign/dockline-sftp-client';
import {ProfileConnectorFactory} from '@jalsoedesign/portline-abstract';
import {CredentialResolver} from '@jalsoedesign/portline-core';
assert.equal(typeof require('@jalsoedesign/filezilla-core').SiteManager, 'function');
assert.equal(AuthError, DocklineAuthError);
assert.deepEqual(Object.keys(await import('@jalsoedesign/filezilla-connector-abstract')).sort(), ['ConnectorFactory', 'ConnectorRegistry']);
assert.deepEqual(Object.keys(await import('@jalsoedesign/filezilla-connector-ftp')), ['FtpConnectorFactory']);
assert.deepEqual(Object.keys(await import('@jalsoedesign/filezilla-connector-sftp')).sort(), ['FileZillaHostKeyStore', 'SftpConnectorFactory']);
await assert.rejects(() => import('@jalsoedesign/filezilla-connector-sftp/dist/SftpConnector.js'), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
assert.ok(new FtpConnectorFactory() instanceof ConnectorFactory);
assert.ok(new SftpConnectorFactory() instanceof ConnectorFactory);
assert.ok(new SftpConnectorFactory() instanceof ProfileConnectorFactory);
assert.equal(typeof require('@jalsoedesign/portline-core').ProfileCatalog, 'function');
assert.equal(typeof CredentialResolver, 'function');
assert.equal(typeof FtpConnectorFactory.fromServer, 'function');
assert.equal(typeof SftpConnectorFactory.fromServer, 'function');
console.log('Packed entry points, FileZilla-only exports and Dockline factory results passed');
`);
await command('install', process.execPath, [
    npmCli,
    'install',
    `--offline=${process.env.npm_config_offline ?? 'false'}`,
    '--no-audit',
    '--no-fund',
], directory);
await copyFile(path.join(directory, 'node_modules/@jalsoedesign/filezilla-cli/examples/transfer-recipes.ts'),
    path.join(directory, 'transfer-recipes.ts'));
await writeFile(path.join(directory, 'removed-exports.ts'), `// @ts-expect-error Generic adapters are imported from Dockline directly.
import {SftpConnector} from '@jalsoedesign/filezilla-connector-sftp';
// @ts-expect-error Generic errors and pools are imported from Dockline directly.
import {AuthError, ConnectorPool} from '@jalsoedesign/filezilla-connector-abstract';
void [SftpConnector, AuthError, ConnectorPool];
`);
await writeFile(path.join(directory, 'features.ts'), `import {Readable} from 'node:stream';
import {ConnectorPool, BandwidthBudget, NameResolutionError, PublicationError} from '@jalsoedesign/dockline-abstract';
import {ConnectorRegistry} from '@jalsoedesign/filezilla-connector-abstract';
import {SftpConnector, KnownHostsStore} from '@jalsoedesign/dockline-sftp-client';
import {SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';
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

const documentation = JSON.parse(await readFile(path.join(repository, 'docs/example-variants.json'), 'utf8'));

if (!documentation.programs.length) {
    throw new Error('The documentation manifest must contain runnable examples');
}

for (const program of documentation.programs) {
    const asset = documentation.assets.find(asset => asset.name === program.name && asset.filename.endsWith('.ts'));

    if (!asset || path.basename(asset.filename) !== asset.filename) {
        throw new Error('A complete TypeScript asset is required for ' + program.name);
    }

    await copyFile(path.join(repository, 'docs/public/examples', asset.filename),
        path.join(directory, 'documented-' + asset.filename));
}

await command('types', process.execPath, [path.join(directory, 'node_modules/typescript/bin/tsc'), '--project', path.join(directory, 'tsconfig.json')], directory);
await command('runtime', process.execPath, [path.join(directory, 'runtime.mjs')], directory);
await command('cli', process.execPath, [path.join(directory, 'node_modules/@jalsoedesign/filezilla-cli/dist/cli.js'), '--help'], directory);
console.log(`Packed consumers verified at ${directory}`);

console.log('Verification evidence: ' + staging);
