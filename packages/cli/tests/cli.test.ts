import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'path';

const cliPath = path.join(__dirname, '../src/cli.ts');
const fixture = (relative: string) => path.join(__dirname, '../../core/fixtures', relative);
const requireFromCli = createRequire(path.join(__dirname, '../package.json'));
const runCli = (args: string[], expectedStatus = 0) => {
    const result = spawnSync(process.execPath, [requireFromCli.resolve('tsx/cli'), cliPath, ...args], {
        encoding: 'utf8',
        env: {...process.env, FORCE_COLOR: '0', npm_config_offline: 'true'},
        timeout: 15000,
        shell: false,
    });

    if (result.error) {
        throw result.error;
    }

    expect(result.signal).toBeNull();
    expect(result.status, result.stderr).toBe(expectedStatus);

    if (expectedStatus === 0) {
        expect(result.stderr).toBe('');

        return result.stdout;
    }

    return result.stderr;
};

describe('CLI - filezilla-js', () => {
    const multiFixture = fixture('general/sitemanager.multi.xml');

    describe('list command', () => {
        it('should list all servers as plain text by default', () => {
            const output = runCli(['list', '--file', multiFixture]);

            expect(output).toContain('SFTP (root location)');
            expect(output).toContain('Rebex/SFTP');
            expect(output).toContain('Level 1/Level 2/Level 3/Level 4/FTP (deeply nested)');

            const lines = output.trim().split(/\r?\n/);

            expect(lines.length).toBe(6);
        });

        it('should list servers as JSON', () => {
            const output = runCli(['list', '--file', multiFixture, '--json']);
            const json = JSON.parse(output);

            expect(Array.isArray(json)).toBe(true);
            expect(json.length).toBe(6);
            expect(json[0]).toHaveProperty('path');
            expect(json[0]).toHaveProperty('host');
            expect(json[0]).toHaveProperty('protocol');
        });

        it('should list servers as a recursive JSON tree', () => {
            const output = runCli([
                'list',
                '--file',
                multiFixture,
                '--json',
                '--recurse',
            ]);
            const json = JSON.parse(output);

            expect(json).toHaveProperty('name', 'Root');
            expect(json).toHaveProperty('folders');
            expect(json).toHaveProperty('servers');
            expect(json.folders.length).toBe(2); // Rebex and Level 1
        });

        it('should filter results using --search', () => {
            const output = runCli([
                'list',
                '--file',
                multiFixture,
                '--search',
                'Rebex',
                '--json',
            ]);
            const json = JSON.parse(output);

            expect(json.length).toBe(4);
            json.forEach((s: any) => expect(s.path).toContain('Rebex'));
        });

        it('should output full properties with --full', () => {
            const output = runCli([
                'list',
                '--file',
                multiFixture,
                '--json',
                '--full',
            ]);
            const json = JSON.parse(output);

            expect(json[0]).toHaveProperty('user');
            expect(json[0]).toHaveProperty('port');
            expect(json[0]).toHaveProperty('logonType');
        });

        it('should error when --recurse is used without --json', () => {
            const output = runCli(['list', '--file', multiFixture, '--recurse'], 1);

            expect(output).toContain('Error: --recurse option requires --json');
        });
    });

    describe('get command', () => {
        it('should get a server by path', () => {
            const output = runCli([
                'get',
                'SFTP (root location)',
                '--file',
                multiFixture,
                '--json',
            ]);
            const json = JSON.parse(output);

            expect(json.path).toBe('SFTP (root location)');
            expect(json.host).toBe('test.rebex.net');
        });

        it('should get a specific property', () => {
            const output = runCli([
                'get',
                'SFTP (root location)',
                'host',
                '--file',
                multiFixture,
            ]);

            expect(output.trim()).toBe('test.rebex.net');
        });

        it('should get the human-readable protocol name', () => {
            const output = runCli([
                'get',
                'SFTP (root location)',
                'protocolName',
                '--file',
                multiFixture,
            ]);

            expect(output.trim()).toBe('SFTP');
        });

        it('should get the parsed remote directory', () => {
            const output = runCli([
                'get',
                'Rebex/FTP',
                'remoteDirectory',
                '--file',
                multiFixture,
            ]);

            expect(output.trim()).toBe('/pub/example');
        });

        it('should hide password by default', () => {
            const output = runCli([
                'get',
                'SFTP (root location)',
                'password',
                '--file',
                multiFixture,
            ]);

            expect(output.trim()).toBe('(hidden)');
        });

        it('should show password with --show-password', () => {
            const output = runCli([
                'get',
                'SFTP (root location)',
                'password',
                '--file',
                multiFixture,
                '--show-password',
            ]);

            expect(output.trim()).toBe('password');
        });

        it('should find a server using --search', () => {
            const output = runCli([
                'get',
                '--search',
                'root location',
                'host',
                '--file',
                multiFixture,
            ]);

            expect(output.trim()).toBe('test.rebex.net');
        });

        it('should error when multiple servers match a search', () => {
            const output = runCli([
                'get',
                '--search',
                'Rebex',
                '--file',
                multiFixture,
            ], 1);

            expect(output).toContain('Error: Multiple servers found matching "Rebex"');
        });

        it('should error when no server matches a search', () => {
            const output = runCli([
                'get',
                '--search',
                'NonExistent',
                '--file',
                multiFixture,
            ], 1);

            expect(output).toContain('Error: Could not find server matching "NonExistent"');
        });
    });

    describe('general options and error handling', () => {
        it('should show help when no command is provided', () => {
            const output = runCli([]);

            expect(output).toContain('Usage: filezilla-js <command> [options] [args]');
        });

        it('should show help with --help', () => {
            const output = runCli(['--help']);

            expect(output).toContain('Usage: filezilla-js <command> [options] [args]');
        });

        it('should error on unknown command', () => {
            const output = runCli(['unknown-cmd'], 1);

            expect(output).toContain('Error: Unknown command "unknown-cmd"');
        });

        it('should error when file is not found', () => {
            const output = runCli(['list', '--file', 'non-existent.xml'], 1);

            expect(output).toContain('Error: Could not find sitemanager.xml at non-existent.xml');
        });

        it('should output error as JSON when --json is used', () => {
            const output = runCli([
                'get',
                'NonExistent',
                '--file',
                multiFixture,
                '--json',
            ], 1);
            const json = JSON.parse(output);

            expect(json).toHaveProperty('error');
            expect(json.error).toContain('Could not find server by path "NonExistent"');
        });
    });

    describe('table output', () => {
        it('should output list as a table without crashing', () => {
            const output = runCli(['list', '--file', multiFixture, '--table']);

            expect(output).toContain('┌');
            expect(output).toContain('Path');
            expect(output).toContain('Host');
            expect(output).toContain('Protocol');
            expect(output).toContain('SFTP (root location)');
        });

        it('should output single server as a table without crashing', () => {
            const output = runCli([
                'get',
                'SFTP (root location)',
                '--file',
                multiFixture,
                '--table',
            ]);

            expect(output).toContain('┌');
            expect(output).toContain('Property');
            expect(output).toContain('Value');
            expect(output).toContain('host');
            expect(output).toContain('test.rebex.net');
        });

        it.each([[[]], [['--table']], [['--json']]])('honors --full and redacts credentials in mode %j', mode => {
            const output = runCli([
                'list',
                '--file',
                multiFixture,
                '--full',
                ...mode,
            ]);

            expect(output).toContain('user');
            expect(output).toContain('logonType');
            expect(output).toContain('demo');
            expect(output).toContain('(hidden)');
            expect(output).not.toMatch(/(?:"password"\s*:\s*"password"|:\s*password\s*$|│\s*password\s*│\s*$)/m);
        });

        it.each([[[]], [['--table']], [['--json']]])('shows explicitly requested credentials in full mode %j', mode => {
            const output = runCli([
                'list',
                '--file',
                multiFixture,
                '--full',
                '--show-password',
                ...mode,
            ]);

            expect(output).not.toContain('(hidden)');
            expect(output).toContain('password');
        });
    });

    describe('audit regression: exact arguments and metadata isolation', () => {
        it('handles fixture paths containing spaces and shell metacharacters without a shell', () => {
            const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'filezilla cli audit '));
            const localFixture = path.join(directory, 'sites & spaces.xml');

            try {
                fs.copyFileSync(multiFixture, localFixture);

                const output = runCli([
                    'get',
                    'SFTP (root location)',
                    'host',
                    '--file',
                    localFixture,
                ]);

                expect(output.trim()).toBe('test.rebex.net');
            } finally {
                fs.rmSync(directory, {recursive: true, force: true});
            }
        });

        it('gets host, searches and lists compact metadata despite an unsupported saved path', () => {
            const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'filezilla-cli-path-'));
            const localFixture = path.join(directory, 'unsupported.xml');
            const site = (name: string, remote = '') => `<Server><Host>example.invalid</Host><Port>22</Port><Protocol>1</Protocol><Type>0</Type><Logontype>1</Logontype><Name>${name}</Name><RemoteDir>${remote}</RemoteDir></Server>`;

            try {
                fs.writeFileSync(localFixture, `<FileZilla3><Servers>${site('Unsupported', '3 0 3 abc')}${site('Target')}</Servers></FileZilla3>`);
                expect(runCli([
                    'get',
                    'Unsupported',
                    'host',
                    '--file',
                    localFixture,
                ]).trim()).toBe('example.invalid');
                expect(runCli([
                    'get',
                    '--search',
                    'Target',
                    'host',
                    '--file',
                    localFixture,
                ]).trim()).toBe('example.invalid');
                expect(JSON.parse(runCli(['list', '--json', '--file', localFixture]))).toHaveLength(2);
                expect(runCli(['list', '--table', '--file', localFixture])).toContain('Unsupported');
                expect(runCli([
                    'get',
                    'Unsupported',
                    'remoteDirectory',
                    '--file',
                    localFixture,
                ], 1)).toContain('Unsupported FileZilla remote directory');
            } finally {
                fs.rmSync(directory, {recursive: true, force: true});
            }
        });

        it('displays the actual Cloudflare R2 protocol name', () => {
            const output = runCli([
                'get',
                'Cloudflare R2 Test',
                'protocolName',
                '--file',
                fixture('r2/sitemanager.r2.xml'),
            ]);

            expect(output.trim()).toBe('CLOUDFLARE_R2');
        });
    });
});
