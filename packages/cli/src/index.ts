import {getDefaultSiteManager, getSiteManager} from '@jalsoedesign/filezilla-core';
import {CommandContext, CommandHandler} from './types.js';
import {listCommand} from './commands/list.js';
import {getCommand} from './commands/get.js';
import {searchCommand} from './commands/search.js';
import {runCheckCommand} from './commands/check.js';

export {checkConnection} from './commands/check.js';
export type {ConnectionCheckOptions, ConnectionCheckResult, ConnectionCheckStage, ConnectionCheckStatus} from './commands/check.js';
import * as process from 'process';

function showHelp() {
    console.log(`
Usage: filezilla-js <command> [options] [args]

Commands:
  list                      List all servers
  search <term>             Search all saved fields and show profile details
  get <path> [property]    Get a server or a specific property value
  check <path>              Check a connection without remote mutations (check --help)

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
  filezilla-js --search ordlab --show-password
  filezilla-js search 206.189.28.138
  filezilla-js list
  filezilla-js list --json
  filezilla-js list --table
  filezilla-js get "My Server"
  filezilla-js get "My Server" host
  filezilla-js get "My Server" --json
`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const options: CommandContext['options'] = {};
    const positional: string[] = [];

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--json') {
            options.json = true;
        } else if (arg === '--table') {
            options.table = true;
        } else if (arg === '--full') {
            options.full = true;
        } else if (arg === '--recurse') {
            options.recurse = true;
        } else if (arg === '--show-password') {
            options.showPassword = true;
        } else if (arg === '--file' && i + 1 < args.length) {
            options.file = args[++i];
        } else if (arg === '--search') {
            if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
                throw new Error('--search requires a term');
            }

            options.search = args[++i];
        } else if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg.startsWith('--')) {
            // ignore unknown flags
        } else {
            positional.push(arg);
        }
    }

    return {options, positional};
}

export async function run() {
    if (process.argv[2] === 'check') {
        await runCheckCommand(process.argv.slice(3));

        return;
    }

    let parsed: ReturnType<typeof parseArgs>;

    try {
        parsed = parseArgs();
    } catch (error: any) {
        console.error(process.argv.includes('--json') ?
            JSON.stringify({error: error.message}) :
            `Error: ${error.message}`);
        process.exit(1);
    }

    const {options, positional} = parsed;

    if (options.help || (positional.length === 0 && options.search === undefined)) {
        showHelp();

        return;
    }

    const command = positional[0] ?? 'search';
    const commandArgs = positional.slice(1);

    const commands: Record<string, CommandHandler> = {
        list: listCommand,
        get: getCommand,
        search: searchCommand,
    };

    const handler = commands[command];

    if (!handler) {
        console.error(`Error: Unknown command "${command}"`);
        showHelp();
        process.exit(1);
    }

    try {
        const siteManager = options.file ?
            getSiteManager(options.file) :
            getDefaultSiteManager();

        const context: CommandContext = {
            siteManager,
            args: commandArgs,
            options,
        };

        await handler(context);
    } catch (e: any) {
        if (options.json) {
            console.error(JSON.stringify({error: e.message}));
        } else {
            console.error(`Error: ${e.message}`);
        }

        process.exit(1);
    }
}
