import path from 'node:path';
import type {
    AuthenticationMethod,
    Awaitable,
    ConnectionDefinition,
    ConnectionProfile,
    CredentialProvider,
    CredentialReference,
    CredentialResult,
    CredentialState,
    ProfileDiagnostic,
    ProfileSearchOptions,
    ProfileSource,
    SourceReference,
} from '@jalsoedesign/portline-abstract';
import {ProfileCatalog} from '@jalsoedesign/portline-core';
import {getSiteManager, SiteManager} from './SiteManager';
import {Server} from './Server';
import {LogonType} from './enum/LogonType';
import {ServerProtocol} from './enum/ServerProtocol';
import {PasvMode} from './enum/PasvMode';
import {CharsetEncoding} from './enum/CharsetEncoding';

function credentialFor(
    server: Server,
    source: SourceReference,
    state?: CredentialState,
): CredentialReference {
    const properties = server.propertiesRaw;
    const supported = ['plain', 'base64', ''].includes(properties.passwordEncoding ?? 'plain');

    return {
        sourceId: source.id,
        id: server.path,
        kind: properties.logonType === LogonType.key ? 'passphrase' : 'password',
        state: supported ? state ?? (properties.password === undefined ? 'unavailable' : 'available') : 'unsupported',
    };
}

/** Secret-free connection definition; native settings remain available through Server and SiteManager. */
export function toConnectionProfile(
    server: Server,
    source: SourceReference = {id: 'filezilla', application: 'FileZilla'},
    credentialState?: CredentialState,
): ConnectionProfile {
    const properties = server.propertiesRaw;
    const diagnostics: ProfileDiagnostic[] = [];
    const unsupportedOptions: string[] = [];
    let remoteDirectory: string | undefined;

    try {
        remoteDirectory = server.getRemoteDirectory();
    } catch {
        unsupportedOptions.push('remoteDirectory');
        diagnostics.push({
            code: 'REMOTE_DIRECTORY_UNAVAILABLE',
            severity: 'warning',
            field: 'remoteDirectory',
            message: 'The saved remote directory format is unsupported; inspect the native profile.',
        });
    }

    let authentication: AuthenticationMethod;

    switch (properties.logonType) {
        case LogonType.anonymous:
            authentication = {type: 'anonymous'};
            break;
        case LogonType.normal:
            authentication = {type: 'password', credential: credentialFor(server, source, credentialState)};
            break;
        case LogonType.key:
            authentication = {
                type: 'private-key',
                path: properties.keyFile ? {value: properties.keyFile} : undefined,
                format: properties.keyFile?.toLowerCase().endsWith('.ppk') ? 'ppk' : 'unknown',
                passphrase: credentialFor(server, source, credentialState),
            };
            break;
        case LogonType.ask:
            authentication = {type: 'prompt-password', credential: credentialFor(server, source, credentialState)};
            break;
        case LogonType.interactive:
            authentication = {type: 'interactive'};
            break;
        default:
            authentication = {type: 'unsupported', nativeType: String(properties.logonType)};
    }

    const base = {
        id: 'primary',
        endpoint: {host: properties.host, port: properties.port, username: properties.user},
        authentication: [authentication],
        filenameEncoding: properties.encodingType === CharsetEncoding.ENCODING_CUSTOM ?
            {charset: properties.customEncoding ?? ''} : undefined,
        unsupportedOptions,
    };
    let connection: ConnectionDefinition;

    switch (properties.protocol) {
        case ServerProtocol.SFTP:
            connection = {
                ...base,
                kind: 'ssh',
                protocol: 'sftp',
                remoteDirectory,
            };
            break;
        case ServerProtocol.FTP:
            connection = {
                ...base,
                kind: 'ftp',
                protocol: 'ftps',
                tls: 'explicit',
                passive: passiveMode(properties.passiveMode),
                remoteDirectory,
            };
            break;
        case ServerProtocol.INSECURE_FTP:
            connection = {
                ...base,
                kind: 'ftp',
                protocol: 'ftp',
                tls: 'none',
                passive: passiveMode(properties.passiveMode),
                remoteDirectory,
            };
            break;
        case ServerProtocol.FTPS:
            connection = {
                ...base,
                kind: 'ftp',
                protocol: 'ftps',
                tls: 'implicit',
                passive: passiveMode(properties.passiveMode),
                remoteDirectory,
            };
            break;
        case ServerProtocol.FTPES:
            connection = {
                ...base,
                kind: 'ftp',
                protocol: 'ftps',
                tls: 'explicit',
                passive: passiveMode(properties.passiveMode),
                remoteDirectory,
            };
            break;
        default:
            connection = {
                ...base,
                kind: 'unsupported',
                protocol: server.siteProtocolName === 'UNKNOWN' ?
                    `filezilla:${properties.protocol}` : server.siteProtocolName.toLowerCase(),
            };
    }

    return {
        id: server.path,
        path: server.path,
        name: properties.name,
        source,
        connections: [connection],
        localDirectory: properties.localDirectory ? {value: properties.localDirectory} : undefined,
        diagnostics,
    };
}

function passiveMode(mode: PasvMode): boolean | null {
    if (mode === PasvMode.MODE_ACTIVE) {
        return false;
    }

    return mode === PasvMode.MODE_PASSIVE ? true : null;
}

export interface FileZillaProfileSourceOptions {
    readonly source?: SourceReference;
    readonly loadCredential?: (server: Server) => Awaitable<CredentialResult>;
}

export class FileZillaProfileSource implements ProfileSource, CredentialProvider {
    public readonly source: SourceReference;

    constructor(public readonly manager: SiteManager, private readonly options: FileZillaProfileSourceOptions = {}) {
        this.source = options.source ?? {id: 'filezilla', application: 'FileZilla'};
    }

    /** Discovery is application-specific. This file source loads only metadata until resolve() is called. */
    public static fromFile(filename: string): FileZillaProfileSource {
        const location = path.resolve(filename);
        const source: SourceReference = {
            id: `filezilla:${location}`,
            application: 'FileZilla',
            location,
            storage: [{kind: 'file', path: location, format: 'xml'}],
        };

        return new FileZillaProfileSource(getSiteManager(location, {includePasswords: false}), {
            source,
            loadCredential: server => {
                const selected = getSiteManager(location, {credentialPath: server.path}).getServerByPath(server.path);
                const value = selected?.propertiesRaw.password;

                return value === undefined ? {state: 'not-stored'} : {state: 'available', value};
            },
        });
    }

    public list(): readonly ConnectionProfile[] {
        return this.manager.getServers().map(server => this.project(server));
    }

    public get(path: string): ConnectionProfile | undefined {
        const server = this.manager.getServerByPath(path);

        return server ? this.project(server) : undefined;
    }

    public search(term: string, options: ProfileSearchOptions = {}): readonly ConnectionProfile[] {
        return new ProfileCatalog(this.source, this.list()).search(term, options);
    }

    public async resolve(reference: CredentialReference): Promise<CredentialResult> {
        const server = this.manager.getServerByPath(reference.id);

        if (!server || reference.sourceId !== this.source.id) {
            return {state: 'unavailable'};
        }

        const expected = credentialFor(server, this.source);

        if (reference.kind !== expected.kind || expected.state === 'unsupported') {
            return {state: 'unsupported'};
        }

        if (this.options.loadCredential) {
            return this.options.loadCredential(server);
        }

        const value = server.propertiesRaw.password;

        return value === undefined ? {state: 'unavailable'} : {state: 'available', value};
    }

    private project(server: Server): ConnectionProfile {
        return toConnectionProfile(server, this.source, this.options.loadCredential ? 'available' : undefined);
    }
}
