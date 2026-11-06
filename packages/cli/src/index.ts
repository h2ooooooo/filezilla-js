import path from 'node:path';
import {getDefaultSiteManagerPath, getSiteManager, createFileZillaWriter} from '@jalsoedesign/filezilla-core';
import {createProfileCli, createProfileWriteCommands} from '@jalsoedesign/portline-cli';
import {createFileZillaCliSource} from './source.js';
import {runCheckCommand} from './commands/check.js';

export {checkConnection} from './commands/check.js';
export type {ConnectionCheckOptions, ConnectionCheckResult, ConnectionCheckStage, ConnectionCheckStatus} from './commands/check.js';
export {createFileZillaCliSource} from './source.js';

const help = `
Usage: filezilla-js <command> [options] [args]

Commands:
  list                      List all servers
  search <term>             Search all saved fields and show profile details
  source                    Show the selected configuration source
  get <path> [property]    Get a server or a specific property value
  check <path>              Check a connection without remote mutations (check --help)
  write-status              Show write availability and native diagnostic codes
  write                     Preview normalized profile writes (write --help)
  sync                      Preview one-way cross-app sync (sync --help)
  apply                     Apply a reviewed preview with fresh lock checks (apply --help)

Options:
  --file <path>             Specify the sitemanager.xml file path
  --json                    Output in JSON format
  --table                   Output in table format
  --search <term>           Search all fields without a command; name/path with list/get
  --recurse                 Return results in a nested structure (requires --json)
  --full                    Return full server properties when using list command
  --show-password           Show the actual password in output (otherwise hidden)
  --color                   Force color output (on by default on Windows TTY)
  --no-color                Disable color output
  --help, -h                Show this help message

Examples:
  filezilla-js --search clientName --show-password
  filezilla-js search 10.2.3.4
  filezilla-js list
  filezilla-js list --json
  filezilla-js list --table
  filezilla-js get "My Server"
  filezilla-js get "My Server" host
  filezilla-js get "My Server" --json
`;

const cli = createProfileCli({
    name: 'filezilla-js',
    singular: 'server',
    plural: 'servers',
    help,
    ignoreUnknownOptions: true,
    commands: {
        check: runCheckCommand,
        ...createProfileWriteCommands({
            application: 'filezilla',
            importSource: name => import(name),
            writer: async options => {
                const location = path.resolve(options.file ?? getDefaultSiteManagerPath());

                return createFileZillaWriter({
                    id: 'filezilla:' + location,
                    application: 'FileZilla',
                    location,
                    storage: [{kind: 'file', path: location, format: 'xml'}],
                }, {
                    mode: options.mode as 'create' | 'update' | 'upsert' | undefined,
                    allowLossy: options.allowLossy === true,
                    registryMode: options.registryMode as 'transactional' | 'guarded' | undefined,
                });
            },
        }),
    },
    loadSource: options => {
        const filename = options.file ?? getDefaultSiteManagerPath();
        const location = path.resolve(filename);

        return createFileZillaCliSource(getSiteManager(filename), {
            id: `filezilla:${location}`,
            application: 'FileZilla',
            location,
            storage: [{kind: 'file', path: location, format: 'xml'}],
        });
    },
});

export async function run() {
    const exitCode = await cli.run();

    if (exitCode !== 0) {
        process.exit(exitCode);
    }
}
