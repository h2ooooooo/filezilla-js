import {Server, ServerFolderNode} from '@jalsoedesign/filezilla-core';
import {CommandContext, CommandHandler, formatOutput} from '../types.js';

export const listCommand: CommandHandler = async (ctx: CommandContext) => {
    let servers = ctx.siteManager.getServers();

    if (ctx.options.search) {
        servers = ctx.siteManager.searchServers(ctx.options.search);
    }

    if (ctx.options.recurse && !ctx.options.json) {
        throw new Error('--recurse option requires --json');
    }

    if (ctx.options.json || ctx.options.table) {
        if (ctx.options.recurse && ctx.options.json) {
            const tree = ctx.siteManager.getServersTree(servers);
            const data = transformTree(tree, ctx.options);

            formatOutput(data, ctx.options);

            return;
        }

        const data = servers.map((server: Server) => {
            if (ctx.options.full) {
                return fullProperties(server, ctx.options);
            }

            return {
                path: server.path,
                host: server.propertiesRaw.host,
                protocol: server.siteProtocolName,
            };
        });

        const tableData = ctx.options.full ? {
            columns: ['Path', 'Property', 'Value'],
            rows: data.flatMap(properties => Object.entries(properties)
                .filter(([key]) => key !== 'path')
                .map(([key, value]) => [properties.path, key, value])),
        } : {
            columns: ['Path', 'Host', 'Protocol'],
            rows: servers.map(server => [server.path, server.propertiesRaw.host, server.siteProtocolName]),
        };

        formatOutput(data, ctx.options, tableData);
    } else if (ctx.options.full) {
        for (const server of servers) {
            formatOutput(fullProperties(server, ctx.options), ctx.options);
            console.log('');
        }
    } else {
        formatOutput(servers.map((s: Server) => s.path), ctx.options);
    }
};

function fullProperties(server: Server, options: CommandContext['options']) {
    const properties = {...server.properties, protocolName: server.siteProtocolName};

    if (!options.showPassword) {
        properties.password = '(hidden)';
    }

    return properties;
}

function transformTree(folder: ServerFolderNode, options: CommandContext['options']): any {
    return {
        name: folder.name,
        folders: folder.folders.map(f => transformTree(f, options)),
        servers: folder.servers.map(server => fullProperties(server, options)),
    };
}
