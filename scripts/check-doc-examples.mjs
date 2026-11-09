import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {localServer, temporaryDemo} from '../examples/demo-support.mjs';
import {createSshDemoServer} from '../examples/ssh-demo-server.mjs';
import {javascript, commonJs, unformattedTechnicalText} from './docs-example-utils.mjs';

const repository = fileURLToPath(new URL('../', import.meta.url));
const docs = path.join(repository, 'docs');
const manifest = JSON.parse(await readFile(path.join(docs, 'example-variants.json'), 'utf8'));
const require = createRequire(import.meta.url);
const tsx = pathToFileURL(require.resolve('tsx')).href;
const labels = ['TypeScript', 'JavaScript', 'MJS', 'CommonJS'];
const extensions = ['ts', 'js', 'mjs', 'cjs'];
const noFilename = code => code
    .replaceAll('\r\n', '\n')
    .replace(/^\/\/ [\w-]+\.(?:ts|js|mjs|cjs)\n/, '')
    .trim();
const pages = [];
let groups = 0;
let programsFound = 0;

async function visit(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
        if (entry.name.startsWith('.') || ['node_modules', 'public'].includes(entry.name)) {
            continue;
        }

        const filename = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            await visit(filename);
        } else if (filename.endsWith('.md')) {
            pages.push(filename);
        }
    }
}

await visit(docs);

for (const filename of pages) {
    const relative = path.relative(docs, filename).replaceAll('\\', '/');
    const text = await readFile(filename, 'utf8');

    assert.deepEqual(unformattedTechnicalText(text), [], relative + ': unformatted technical text');

    assert.doesNotMatch(text, /your (?:own )?application|your computer/i, relative + ': terminology');
    assert.doesNotMatch(text, /--path\.|\.(?:mjs|cjs|js|ts)\.\//, relative + ': malformed command');
    assert.doesNotMatch(text, /Save this as `[^`]+\.mjs`/, relative + ': MJS-first setup');

    for (const match of text.matchAll(/::: code-group\n([\s\S]*?)\n:::/g)) {
        const blocks = [...match[1].matchAll(/```(\w+) \[([^\]]+)\]\n([\s\S]*?)```/g)];

        if (!blocks.some(block => labels.includes(block[2]))) {
            continue;
        }

        assert.deepEqual(blocks.map(block => block[2]), labels, relative + ': language order');
        groups++;

        if (blocks[0][1] === 'sh') {
            assert.ok(blocks[0][3].includes('npm pkg set type=module'), relative + ': TypeScript ESM setup');
            continue;
        }

        const source = blocks[0][3].trim();
        const program = manifest.programs.find(item => item.page === relative && source.startsWith('// ' + item.name + '.ts\n'));
        const esm = javascript(source);
        const expected = [source, esm, esm, commonJs(noFilename(esm), Boolean(program))];

        for (const [index, block] of blocks.entries()) {
            const parsed = ts.createSourceFile('snippet.' + (index ? 'js' : 'ts'), block[3], ts.ScriptTarget.Latest, true);

            assert.equal(parsed.parseDiagnostics.length, 0, relative + ': syntax ' + block[2]);
            assert.equal(noFilename(block[3]), noFilename(expected[index]), relative + ': formatting ' + block[2]);

            if (!program) {
                continue;
            }

            const asset = program.name + '.' + extensions[index];

            assert.equal(noFilename(await readFile(path.join(docs, 'public/examples', asset), 'utf8')), noFilename(block[3]), asset + ': downloadable source differs');

            const command = (index ? 'node ' : 'npx tsx ') + asset + (program.args ? ' ' + program.args : '');

            assert.ok(text.includes(command), asset + ': matching run command');
        }

        if (program) {
            programsFound++;
        }
    }

    const outside = text.replace(/::: code-group\n[\s\S]*?\n:::/g, '');

    if (!['reference/types.md', 'reference/server.md', 'reference/site-manager.md'].includes(relative)) {
        assert.doesNotMatch(outside, /```(?:ts|js|javascript)\n/, relative + ': executable snippet lacks language tabs');
    }
}

assert.equal(programsFound, manifest.programs.length);
console.log('Audited ' + pages.length + ' pages and ' + groups + ' synchronized language groups.');

const options = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    skipLibCheck: false,
    noEmit: true,
    types: ['node'],
    typeRoots: [path.join(repository, 'node_modules/@types')],
};
const typeFiles = manifest.assets.filter(asset => asset.filename.endsWith('.ts')).map(asset => path.join(docs, 'public/examples', asset.filename));
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram(typeFiles, options));

assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {getCanonicalFileName: file => file, getCurrentDirectory: () => repository, getNewLine: () => '\n'}));
console.log(typeFiles.length + ' complete TypeScript programs: strict type checking PASS.');

async function run(filename, directory, args, environment) {
    const child = spawn(process.execPath, [...(filename.endsWith('.ts') ? ['--import', tsx] : []), filename, ...args], {
        cwd: directory,
        windowsHide: true,
        env: {...process.env, ...environment},
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    let errors = '';
    const timer = setTimeout(() => child.kill(), 30000);

    child.stdout.on('data', chunk => {
        output += chunk;
    });
    child.stderr.on('data', chunk => {
        errors += chunk;
    });

    try {
        const code = await new Promise((resolve, reject) => {
            child.on('error', reject);
            child.on('close', resolve);
        });

        assert.equal(code, 0, filename + '\n' + output + errors);

        return output.replaceAll('\r\n', '\n').trim();
    } finally {
        clearTimeout(timer);
    }
}

await temporaryDemo(async directory => {
    const ftp = await localServer('ftp', directory);
    const sftp = await localServer('sftp', directory);
    const ssh = await createSshDemoServer();
    const checkRoot = path.join(docs, '.local-dev/example-checks');

    await mkdir(checkRoot, {recursive: true});

    const fixture = await readFile(path.join(docs, 'public/examples/sitemanager.xml'), 'utf8');

    try {
        for (const asset of manifest.assets) {
            const program = manifest.programs.find(item => item.name === asset.name);
            const working = path.join(directory, asset.filename.replace('.', '-'));

            await mkdir(working);

            const xmlPath = path.join(working, 'sitemanager.xml');
            const external = ['saved-sftp', 'saved-ftp', 'saved-ssh', 'check-site'].includes(asset.name);
            let xml = fixture;

            if (external) {
                const server = asset.name === 'saved-ftp' ? ftp : asset.name === 'saved-ssh' ? ssh : sftp;

                xml = '<FileZilla3><Servers><Server><Host>127.0.0.1</Host><Port>' + server.port + '</Port><Protocol>' + (asset.name === 'saved-ftp' ? 6 : 1) + '</Protocol><Type>0</Type><User>fixture</User><Logontype>1</Logontype><Pass encoding="base64">Zml4dHVyZS1wYXNzd29yZA==</Pass><Name>Demo</Name></Server></Servers></FileZilla3>';
                await writeFile(path.join(working, 'hello.txt'), 'Hello from FileZilla!\n');
            }

            await writeFile(xmlPath, xml);

            const sourceFile = path.join(checkRoot, asset.filename);

            await writeFile(sourceFile, await readFile(path.join(docs, 'public/examples', asset.filename)));

            const output = await run(sourceFile, working, [xmlPath, ...(external ? ['Demo'] : [])], {
                SFTP_HOST_FINGERPRINT: sftp.fingerprint,
                SSH_HOST_FINGERPRINT: ssh.fingerprint,
                NO_COLOR: '1',
            });

            assert.equal(output, program.output, asset.filename + ': captured output');

            if (['saved-sftp', 'saved-ftp'].includes(asset.name)) {
                assert.equal(await readFile(path.join(working, 'downloaded-hello.txt'), 'utf8'), 'Hello from FileZilla!\n');
            }

            if (asset.name === 'preview-profile') {
                assert.equal(await readFile(xmlPath, 'utf8'), xml, 'Planning must not change native XML');
            }

            console.log(asset.filename + ': PASS');
        }

        const cli = path.join(repository, 'packages/cli/dist/cli.js');
        const queryFile = path.join(directory, 'query-sitemanager.xml');

        await writeFile(queryFile, await readFile(path.join(docs, 'public/examples/query-sitemanager.xml')));

        const listing = JSON.parse(await run(cli, directory, ['list', '--file', queryFile, '--json'], {}));

        assert.equal(listing[0].keyFile, 'C:/keys/example.ppk');
        assert.equal(listing[0].remoteDirectory, '/srv/example');

        const coloured = await run(cli, directory, [
            'search',
            'example',
            '--file',
            queryFile,
            '--color',
        ], {});

        assert.ok(coloured.includes('(hidden*)'));
        assert.ok(coloured.includes('--show-password'));
        assert.ok(coloured.includes(String.fromCharCode(27) + '['));
        console.log('CLI query fixture: JSON, private-key/remote paths, hidden-password hint and ANSI colours PASS.');
    } finally {
        await ftp.close();
        await sftp.close();
        await ssh.close();
    }
});
console.log(manifest.assets.length + ' language variants passed using synthetic XML and local fixtures only.');
