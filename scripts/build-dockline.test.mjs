import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';

async function prepareFixture(context, {
    artifact = true,
    buildTools = false,
    invalidWorkspace = false,
    additionalCli = false,
} = {}) {
    const directory = await mkdtemp(path.join(tmpdir(), 'filezilla-dockline-build-'));
    const checkout = path.join(directory, 'Dockline');
    const runner = path.join(directory, 'build-dockline.mjs');
    const npmFixture = path.join(directory, 'npm-fixture.cjs');
    const called = path.join(checkout, 'build-call.json');

    context.after(async () => {
        const resolved = path.resolve(directory);

        assert.equal(path.dirname(resolved), path.resolve(tmpdir()));
        assert.ok(path.basename(resolved).startsWith('filezilla-dockline-build-'));

        await rm(resolved, {recursive: true, force: true});
    });
    await mkdir(path.join(directory, 'node_modules/@jalsoedesign'), {recursive: true});

    for (const name of ['abstract', 'core', 'ftp-client', 'sftp-client']) {
        const installed = path.join(directory, 'node_modules/@jalsoedesign', 'dockline-' + name);
        const packageDirectory = buildTools ? path.join(checkout, 'packages', name) : installed;

        await mkdir(path.join(packageDirectory, 'src'), {recursive: true});
        await writeFile(path.join(packageDirectory, 'src/index.ts'), 'export {};');
        await writeFile(path.join(packageDirectory, 'package.json'), JSON.stringify({
            name: `@jalsoedesign/dockline-${name}`,
            type: 'module',
            exports: {'./package.json': './package.json'},
        }));

        if (artifact) {
            await mkdir(path.join(packageDirectory, 'dist'));
            await writeFile(path.join(packageDirectory, 'dist/index.js'), 'export {};');
        }

        if (buildTools) {
            await writeFile(path.join(packageDirectory, 'tsconfig.json'), '{}');
            await symlink(packageDirectory, installed, 'junction');
        }
    }

    if (buildTools) {
        await mkdir(path.join(checkout, 'scripts'));
        await writeFile(path.join(checkout, 'scripts/build.mjs'), '');
        await writeFile(path.join(checkout, 'package.json'), JSON.stringify({
            private: !invalidWorkspace,
            workspaces: ['packages/*'],
        }));
    }

    if (additionalCli) {
        const cli = path.join(checkout, 'packages/cli');

        await mkdir(path.join(cli, 'src'), {recursive: true});
        await writeFile(path.join(cli, 'src/index.ts'), 'export {};');
        await writeFile(path.join(cli, 'tsconfig.json'), '{}');
        await writeFile(path.join(cli, 'package.json'), JSON.stringify({name: '@jalsoedesign/dockline-cli'}));
    }

    await copyFile(new URL('./build-dockline.mjs', import.meta.url), runner);
    await copyFile(new URL('./dockline-checkout.mjs', import.meta.url), path.join(directory, 'dockline-checkout.mjs'));
    await writeFile(npmFixture,
        "require('node:fs').writeFileSync('build-call.json', JSON.stringify({cwd: process.cwd(), args: process.argv.slice(2)}));");

    const run = () => spawnSync(process.execPath, [runner], {
        cwd: directory,
        env: {...process.env, npm_execpath: npmFixture},
        encoding: 'utf8',
        windowsHide: true,
    });

    return {run, called, checkout};
}

test('uses independently installed artifacts even when they contain source', async context => {
    const fixture = await prepareFixture(context);
    const result = fixture.run();

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Using the installed Dockline artifacts/);
    assert.equal(existsSync(fixture.called), false);
});

test('builds a linked monorepo from its root using all four package markers', async context => {
    const fixture = await prepareFixture(context, {artifact: false, buildTools: true});
    const result = fixture.run();

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(await readFile(fixture.called, 'utf8')), {
        cwd: fixture.checkout,
        args: ['run', 'build'],
    });
});

test('rejects an incomplete artifact instead of attempting an unavailable build', async context => {
    const fixture = await prepareFixture(context, {artifact: false});
    const result = fixture.run();

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /neither a buildable monorepo checkout nor a built package entry point/);
    assert.equal(existsSync(fixture.called), false);
});

test('does not mistake an unrelated ancestor build script for a Dockline workspace', async context => {
    const fixture = await prepareFixture(context, {buildTools: true, invalidWorkspace: true});
    const result = fixture.run();

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Using the installed Dockline artifacts/);
    assert.equal(existsSync(fixture.called), false);
});

test('builds a monorepo with an optional CLI workspace without requiring the CLI in FileZilla', async context => {
    const fixture = await prepareFixture(context, {artifact: false, buildTools: true, additionalCli: true});
    const result = fixture.run();

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(await readFile(fixture.called, 'utf8')), {
        cwd: fixture.checkout,
        args: ['run', 'build'],
    });
    assert.equal(existsSync(path.join(fixture.checkout, '../node_modules/@jalsoedesign/dockline-cli')), false);
});
