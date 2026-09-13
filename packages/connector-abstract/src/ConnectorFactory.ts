import type {Server} from '@jalsoedesign/filezilla-core';
import type {StorageAdapter} from '@flystorage/file-storage';

/** Factories support instances for dependency injection and static convenience methods. */
export abstract class ConnectorFactory<TConnector extends StorageAdapter, TOptions = unknown> {
    public abstract fromServer(server: Server, options?: TOptions): TConnector;
}
