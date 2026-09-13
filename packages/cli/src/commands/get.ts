import {Server} from '@jalsoedesign/filezilla-core';
import {CommandContext, CommandHandler, formatOutput} from '../types.js';

export const getCommand: CommandHandler = async (ctx: CommandContext) => {
    let server: Server | null;
    let propertyName: string | undefined;

    if (ctx.options.search) {
        const matches = ctx.siteManager.searchServers(ctx.options.search);

        if (matches.length === 0) {
            throw new Error(`Could not find server matching "${ctx.options.search}"`);
        } else if (matches.length > 1) {
            throw new Error(`Multiple servers found matching "${ctx.options.search}". Please be more specific or use list --search.`);
        }

        server = matches[0];
        propertyName = ctx.args[0];
    } else {
        const serverPath = ctx.args[0];

        if (!serverPath) {
            throw new Error('No server path specified');
        }

        server = ctx.siteManager.getServerByPath(serverPath);

        if (!server) {
            throw new Error(`Could not find server by path "${serverPath}"`);
        }

        propertyName = ctx.args[1];
    }

    if (propertyName) {
        let value: string | number | boolean | undefined;

        if (propertyName === 'remoteDirectory') {
            value = server.getRemoteDirectory();
        } else if (propertyName === 'protocolName') {
            value = server.siteProtocolName;
        } else {
            value = (server.properties as any)[propertyName];
        }

        if (value === undefined) {
            throw new Error(`Property "${propertyName}" not found on server`);
        }

        if (propertyName === 'password' && !ctx.options.showPassword) {
            value = '(hidden)';
        }

        formatOutput(value, ctx.options);
    } else {
        const properties = {...server.properties};

        if (!ctx.options.showPassword) {
            properties.password = '(hidden)';
        }

        if (ctx.options.json || ctx.options.table) {
            const data = {...properties, protocolName: server.siteProtocolName};
            const tableData = {
                columns: ['Property', 'Value'],
                rows: [
                    ...Object.entries(properties),
                    ['protocolName', server.siteProtocolName],
                ],
            };

            formatOutput(data, ctx.options, tableData);
        } else {
            formatOutput(properties, ctx.options);
        }
    }
};
