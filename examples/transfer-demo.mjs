import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';
import {invokeCli, localServer, repository, temporaryDemo} from './demo-support.mjs';

export async function runTransferDemo(protocol) {
    await temporaryDemo(async directory => {
        const server = await localServer(protocol, directory);

        try {
            console.log(protocol.toUpperCase() + ' server started on 127.0.0.1 (temporary port).');

            const file = path.join(directory, 'sitemanager.xml');
            const xml = '<FileZilla3><Servers><Server><Host>127.0.0.1</Host><Port>' + server.port + '</Port><Protocol>' + (protocol === 'sftp' ? 1 : 6) + '</Protocol><Type>0</Type><User>fixture</User><Logontype>1</Logontype><Pass encoding="base64">Zml4dHVyZS1wYXNzd29yZA==</Pass><Name>Demo</Name></Server></Servers></FileZilla3>';

            await writeFile(file, xml);

            const executable = path.join(repository, 'packages/cli/dist/cli.js');
            const trust = protocol === 'sftp' ? ['--host-key-sha256', server.fingerprint] : [];
            const result = await invokeCli(executable, [
                'check',
                'Demo',
                '--file',
                file,
                ...trust,
                '--json',
            ], directory);

            assert.equal(result.status, 'ok');
            assert.equal(result.cleanup, 'closed');
            console.log('$ filezilla-js check Demo --file <temporary-site-manager>' + (protocol === 'sftp' ? ' --host-key-sha256 <generated-pin>' : '') + ' --json');
            console.log(JSON.stringify(result));

            if (protocol === 'sftp') {
                const rejected = await invokeCli(executable, [
                    'check',
                    'Demo',
                    '--file',
                    file,
                    '--host-key-sha256',
                    'SHA256:' + Buffer.alloc(32).toString('base64').replace(/=+$/, ''),
                    '--json',
                ], directory, 3);

                assert.equal(rejected.status, 'trust-rejected');
                console.log('Wrong host-key pin rejected (exit 3).');
            }

            const source = FileZillaProfileSource.fromFile(file);
            const bridge = createDocklineBridge({source});
            const options = protocol === 'sftp' ? {hostFingerprint: server.fingerprint} : {};
            const bytes = Buffer.from('Hello from FileZilla!\n');

            await writeFile(path.join(directory, 'input.txt'), bytes);
            await bridge.withFiles('Demo', async remote => {
                await remote.uploadFile(path.join(directory, 'input.txt'), 'hello.txt');
                console.log('SDK upload: hello.txt (21 bytes).');
                await remote.downloadFile('hello.txt', path.join(directory, 'output.txt'));
                assert.deepEqual(await readFile(path.join(directory, 'output.txt')), bytes);
                console.log('SDK download: exact bytes verified.');
            }, options);
            console.log('PASS: FileZilla configuration -> local ' + protocol.toUpperCase() + ' connection and transfers.');
        } finally {
            await server.close();
            console.log('Local server stopped.');
        }
    });
}
