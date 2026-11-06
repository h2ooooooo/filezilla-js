import type {Server, SiteManager} from '@jalsoedesign/filezilla-core';
import type {SourceReference} from '@jalsoedesign/portline-abstract';
import type {ProfileCliSource, ProfileCommandContext} from '@jalsoedesign/portline-cli';
import type {CommandContext} from './types.js';

export function remoteDirectoryFor(server: Server): string {
    try {
        return server.getRemoteDirectory();
    } catch {
        return `${server.propertiesRaw.remoteDirectory ?? ''} (encoded; unsupported path)`;
    }
}

/** Preserves FileZilla's native properties, folder names and legacy JSON shapes. */
export function createFileZillaCliSource(
    manager: SiteManager,
    source: SourceReference = {id: 'filezilla', application: 'FileZilla'},
): ProfileCliSource<Server> {
    return {
        source,
        list: () => manager.getServers(),
        get: path => manager.getServerByPath(path) ?? undefined,
        search: (term, options) => manager.searchServers(term, options),
        path: server => server.path,
        folderNames: server => server.path.split('/').slice(0, -1).map(part =>
            part.replace(/%(?:25|2f)/gi, value => value.toLowerCase() === '%2f' ? '/' : '%'),
        ),
        treeProfilesKey: 'servers',
        plainGetOmitFields: ['protocolName'],
        summary: server => ({
            path: server.path,
            name: server.propertiesRaw.name,
            protocol: server.siteProtocolName,
            host: server.propertiesRaw.host,
            port: server.propertiesRaw.port,
            user: server.propertiesRaw.user,
            password: server.propertiesRaw.password ?? '',
            keyFile: server.propertiesRaw.keyFile ?? '',
            remoteDirectory: remoteDirectoryFor(server),
        }),
        properties: server => ({...server.properties, protocolName: server.siteProtocolName}),
        property: (server, name) => {
            if (name === 'remoteDirectory') {
                return server.getRemoteDirectory();
            }

            if (name === 'protocolName') {
                return server.siteProtocolName;
            }

            return (server.properties as any)[name];
        },
    };
}

export function fileZillaCommandContext(ctx: CommandContext): ProfileCommandContext<Server> {
    return {
        source: createFileZillaCliSource(ctx.siteManager),
        args: ctx.args,
        options: ctx.options,
        executableName: 'filezilla-js',
        singular: 'server',
        plural: 'servers',
    };
}
