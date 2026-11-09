import {mkdtemp, readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {publicWorkspaceArguments} from './public-workspaces.mjs';
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
    ...await publicWorkspaceArguments(repository),
    '--ignore-scripts',
    '--pack-destination',
    artifacts,
    '--json',
], repository);
const packResult = JSON.parse(packedOutput);
const packed = (Array.isArray(packResult) ? packResult : Object.values(packResult))
    .filter(item => !item.name.startsWith('@jalsoedesign/filezilla-test-'));

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
    '@jalsoedesign/dockline-core': '^1.1.0-rc.1',
    '@jalsoedesign/dockline-ftp-client': '^1.1.0-rc.1',
    '@jalsoedesign/dockline-sftp-client': '^1.1.0-rc.1',
    '@jalsoedesign/portline-dockline': '^1.0.0-rc.1',
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
    include: ['consumer.ts', 'transfer-recipes.ts', 'documented-*.ts'],
}, null, 2));
await writeFile(path.join(directory, 'consumer.ts'), `import {Readable} from 'node:stream';
import {Server, SiteManager, FileZillaProfileSource, FileZillaHostKeyStore} from '@jalsoedesign/filezilla-core';
import {CredentialResolver, ProfileCatalog} from '@jalsoedesign/portline-core';
import {createProfileCli} from '@jalsoedesign/portline-cli';
import {createFileZillaCliSource} from '@jalsoedesign/filezilla-cli';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';
import {AuthError, type ConnectorOperationOptions} from '@jalsoedesign/dockline-abstract';
import {SftpConnector} from '@jalsoedesign/dockline-sftp-client';
import {Dockline, type TransferConfig} from '@jalsoedesign/dockline-core';
const settings: ConnectorOperationOptions = {autoReconnect: true, maxTransientRetries: 3};
const manager = new SiteManager({FileZilla3: {Servers: {}}});
const source = new FileZillaProfileSource(manager);
const bridge = createDocklineBridge({source});
const sharedCli = createProfileCli({name: 'consumer-js', loadSource: () => createFileZillaCliSource(manager)});
const savedConfig = (path: string) => bridge.toConfig(path, {hostFingerprint: 'SHA256:verified'});
const files = (path: string) => bridge.withFiles(path, async remote => {
    await remote.uploadFile('./fixture.txt', 'fixture.txt');
    await remote.downloadFile('fixture.txt', './download.txt');
}, {hostFingerprint: 'SHA256:verified'});
const ssh = (path: string) => bridge.withSsh(path, session => session.exec('uname', ['-a']), {
    hostFingerprint: 'SHA256:verified',
});
const sftp = new SftpConnector({host: 'localhost', port: 22, username: 'fixture', initialPath: '',
    ...settings, requireTrustPolicy: true, hasTrustPolicy: () => false, acceptTrustPolicy: () => false});
const upload = () => sftp.write('fixture.txt', () => Readable.from('fixture'), settings);
const transfer = (config: TransferConfig) => Dockline.withConnection(config, async remote => {
    await remote.uploadFile('./fixture.txt', 'fixture.txt');
});
void [Server, SiteManager, AuthError, savedConfig, files, ssh, upload, transfer, FileZillaHostKeyStore.fromFile,
    sharedCli, CredentialResolver, ProfileCatalog];
`);
await writeFile(path.join(directory, 'runtime.mjs'), `import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {FileZillaProfileSource, FileZillaHostKeyStore} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge, DocklineBridge} from '@jalsoedesign/portline-dockline';
const require = createRequire(import.meta.url);
assert.equal(typeof require('@jalsoedesign/filezilla-core').SiteManager, 'function');
assert.equal(typeof FileZillaProfileSource.fromFile, 'function');
assert.equal(typeof FileZillaHostKeyStore.fromFile, 'function');
assert.equal(typeof require('@jalsoedesign/portline-core').ProfileCatalog, 'function');
const bridge = createDocklineBridge();
assert.ok(bridge instanceof DocklineBridge);
for (const method of ['toConfig', 'createFileAdapter', 'withFiles', 'withSsh']) {
    assert.equal(typeof bridge[method], 'function');
}
const profile = {
    id: 'fixture', path: 'fixture', name: 'Fixture',
    source: {id: 'fixture', application: 'FileZilla'},
    diagnostics: [],
    connections: [{id: 'primary', kind: 'ftp', protocol: 'ftp', tls: 'none',
        endpoint: {host: '127.0.0.1', port: 21}, authentication: [{type: 'anonymous'}]}],
};
const config = await bridge.toConfig(profile);
assert.equal(config.protocol, 'ftp');
assert.equal(config.host, '127.0.0.1');
assert.equal(config.username, 'anonymous');
console.log('Packed public readers and shared bridge configuration passed');
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
