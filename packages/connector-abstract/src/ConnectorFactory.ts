import type {Server} from '@jalsoedesign/filezilla-core';
import type {StorageAdapter} from '@flystorage/file-storage';
import {ProfileConnectorFactory} from '@jalsoedesign/portline-abstract';

/** Factories support instances for dependency injection and static convenience methods. */
export abstract class ConnectorFactory<TConnector extends StorageAdapter, TOptions = unknown>
    extends ProfileConnectorFactory<Server, TConnector, TOptions> {
    public abstract fromServer(server: Server, options?: TOptions): TConnector;

    public fromProfile(server: Server, options?: TOptions): TConnector {
        return this.fromServer(server, options);
    }
}
