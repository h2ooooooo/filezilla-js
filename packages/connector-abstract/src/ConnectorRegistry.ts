import {ProfileConnectorRegistry} from '@jalsoedesign/portline-core';
import type {Server, ServerProtocol} from '@jalsoedesign/filezilla-core';
import type {StorageAdapter} from '@flystorage/file-storage';
import {UnsupportedProtocolError} from '@jalsoedesign/dockline-abstract';

export interface RegisteredProvider<TConnector extends StorageAdapter, TOptions> {
    readonly protocols: readonly ServerProtocol[];
    readonly factory: {fromServer(server: Server, options?: TOptions): TConnector};
    readonly validateOptions?: (options: unknown) => void;
}

export interface Registration<TConnector extends StorageAdapter, TOptions> {
    readonly fromServer: (server: Server, options?: TOptions) => TConnector;
}

/** Explicit providers only. Registration handles preserve provider-specific option and result types. */
export class ConnectorRegistry {
    private readonly registry = new ProfileConnectorRegistry<Server, ServerProtocol>({
        protocolFor: server => server.propertiesRaw.protocol,
        unsupported: (protocol, registered) => new UnsupportedProtocolError(registered ?
            'The registered provider does not support this site protocol' :
            `No provider registered for protocol ${protocol}`),
    }, 'file-transfer');

    public register<TConnector extends StorageAdapter, TOptions>(
        provider: RegisteredProvider<TConnector, TOptions>,
        options: {replace?: boolean} = {},
    ): Registration<TConnector, TOptions> {
        if (!provider.protocols.length || new Set(provider.protocols).size !== provider.protocols.length) {
            throw new TypeError('A provider must declare a non-empty unique protocol list');
        }

        for (const protocol of provider.protocols) {
            if (!Number.isSafeInteger(protocol) || protocol < 0) {
                throw new TypeError('Protocols must be non-negative integers');
            }
        }

        const registration = this.registry.register({
            protocols: provider.protocols,
            factory: {
                fromProfile: (server: Server, supplied?: TOptions) => provider.factory.fromServer(server, supplied),
            },
            validateOptions: provider.validateOptions,
        }, options);

        return Object.freeze({fromServer: registration.fromProfile});
    }

    /** Runtime dispatch cannot infer transport-specific options; use the typed registration handle where possible. */
    public fromServer(server: Server, options?: unknown): StorageAdapter {
        return this.registry.fromProfile(server, options) as StorageAdapter;
    }

    public protocols(): readonly ServerProtocol[] {
        return Object.freeze([...this.registry.protocols()].sort((left, right) => left - right));
    }
}
