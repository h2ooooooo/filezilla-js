import type {Server, ServerProtocol} from '@jalsoedesign/filezilla-core';
import type {StorageAdapter} from '@flystorage/file-storage';
import {UnsupportedProtocolError} from './errors.js';

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
    private readonly providers = new Map<ServerProtocol, (server: Server, options: unknown) => StorageAdapter>();

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

            if (this.providers.has(protocol) && !options.replace) {
                throw new TypeError(`Protocol ${protocol} already has a registered provider`);
            }
        }

        const create = (server: Server, supplied: unknown): TConnector => {
            if (!provider.protocols.includes(server.propertiesRaw.protocol)) {
                throw new UnsupportedProtocolError('The registered provider does not support this site protocol');
            }

            provider.validateOptions?.(supplied);

            return provider.factory.fromServer(server, supplied as TOptions);
        };

        for (const protocol of provider.protocols) {
            this.providers.set(protocol, create);
        }

        return Object.freeze({fromServer: (server: Server, supplied?: TOptions) => create(server, supplied)});
    }

    /** Runtime dispatch cannot infer transport-specific options; use the typed registration handle where possible. */
    public fromServer(server: Server, options?: unknown): StorageAdapter {
        const provider = this.providers.get(server.propertiesRaw.protocol);

        if (!provider) {
            throw new UnsupportedProtocolError(`No provider registered for protocol ${server.propertiesRaw.protocol}`);
        }

        return provider(server, options);
    }

    public protocols(): readonly ServerProtocol[] {
        return Object.freeze([...this.providers.keys()].sort((left, right) => left - right));
    }
}
