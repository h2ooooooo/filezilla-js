import {Server} from '@jalsoedesign/filezilla-core';
import {CommandContext, CommandHandler, formatOutput} from '../types.js';

function profileDetails(server: Server, options: CommandContext['options']) {
    const properties = server.propertiesRaw;
    let remoteDirectory = properties.remoteDirectory ?? '';

    try {
        remoteDirectory = server.getRemoteDirectory();
    } catch {
        remoteDirectory = `${remoteDirectory} (encoded; unsupported path)`;
    }

    return {
        path: server.path,
        name: properties.name,
        protocol: server.siteProtocolName,
        host: properties.host,
        port: properties.port,
        user: properties.user,
        password: options.showPassword ? properties.password ?? '' : '(hidden)',
        remoteDirectory,
    };
}

export const searchCommand: CommandHandler = async (ctx: CommandContext) => {
    const term = ctx.options.search ?? ctx.args[0];

    if (term === undefined || ctx.args.length > (ctx.options.search === undefined ? 1 : 0)) {
        throw new Error('Specify one search term: filezilla-js search <term>');
    }

    if (ctx.options.recurse || ctx.options.full) {
        throw new Error('--recurse and --full are list options; search displays profile details');
    }

    const profiles = ctx.siteManager.searchServers(term, {fields: 'all'})
        .map(server => profileDetails(server, ctx.options));

    if (ctx.options.json) {
        formatOutput(profiles, ctx.options);

        return;
    }

    console.log(`Found ${profiles.length} ${profiles.length === 1 ? 'server' : 'servers'}`);

    for (const profile of profiles) {
        console.log('');
        formatOutput(profile, {...ctx.options, table: true}, {
            columns: ['Label', 'Value'],
            rows: [
                ['Name', profile.name],
                ['Path', profile.path],
                ['Protocol', profile.protocol],
                ['Host', profile.host],
                ['Port', profile.port],
                ['Username', profile.user],
                ['Password', profile.password],
                ['Remote', profile.remoteDirectory],
            ],
        });
    }
};
