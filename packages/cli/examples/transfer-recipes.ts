import {createReadStream} from 'node:fs';
import {open, stat, unlink} from 'node:fs/promises';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import type {Server} from '@jalsoedesign/filezilla-core';
import {SftpConnectorFactory, type SftpConnector} from '@jalsoedesign/filezilla-connector-sftp';
import {
    checkAbort,
    IntegrityError,
    NotSupportedError,
    publishFile,
    ResourceLimitError,
    toReadable,
    type ConnectorOperationOptions,
    type PublicationResult,
    type TransferConnector,
} from '@jalsoedesign/filezilla-connector-abstract';

export interface RecipeConnector extends TransferConnector {
    connect(options?: ConnectorOperationOptions): Promise<void>;
    disconnect(): Promise<void>;
}

/** The caller supplies an independently verified public fingerprint and owns saved credentials. */
export function createPinnedSftp(server: Server, fingerprint: string): SftpConnector {
    if (!/^SHA256:[A-Za-z0-9+/]{43}$/.test(fingerprint)) {
        throw new TypeError('Provide a canonical, independently verified SHA256 host-key fingerprint.');
    }

    return SftpConnectorFactory.fromServer(server, {
        requireTrustPolicy: true,
        hasTrustPolicy: challenge => challenge.fingerprint === fingerprint,
        acceptTrustPolicy: () => false,
        autoReconnect: false,
        maxTransientRetries: 0,
    });
}

/** The callback must await complete stream consumption before returning. */
export async function withConnectedSite<T>(
    createConnector: () => RecipeConnector,
    options: ConnectorOperationOptions,
    operation: (connector: RecipeConnector) => Promise<T>,
): Promise<T> {
    checkAbort(options.abortSignal);

    const connector = createConnector();
    let operationFailed = false;
    let operationError: unknown;
    let value: T | undefined;

    try {
        await connector.connect(options);

        value = await operation(connector);
    } catch (error) {
        operationFailed = true;
        operationError = error;
    }

    try {
        await connector.disconnect();
    } catch (cleanupError) {
        if (operationFailed) {
            throw new AggregateError([operationError, cleanupError],
                'The operation and connection cleanup both failed.', {cause: cleanupError});
        }

        throw cleanupError;
    }

    if (operationFailed) {
        throw operationError;
    }

    return value as T;
}

export interface DownloadRecipeOptions extends ConnectorOperationOptions {
    maxBytes?: number;
}

/** Creates a new local file exclusively. Failure removes only the file this invocation created. */
export async function downloadToNewFile(
    createConnector: () => RecipeConnector,
    remotePath: string,
    localPath: string,
    options: DownloadRecipeOptions = {},
): Promise<{bytesWritten: number}> {
    const maxBytes = options.maxBytes ?? 1073741824;

    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
        throw new RangeError('maxBytes must be a non-negative safe integer.');
    }

    let owned = false;

    try {
        return await withConnectedSite(createConnector, options, async connector => {
            const metadata = await connector.stat(remotePath, options);

            if (metadata.type !== 'file') {
                throw new NotSupportedError('This recipe downloads regular files only.');
            }

            if (metadata.size !== undefined && metadata.size > maxBytes) {
                throw new ResourceLimitError('The download exceeds maxBytes.');
            }

            const file = await open(localPath, 'wx', 0o600);
            let bytesWritten = 0;

            owned = true;

            try {
                const source = toReadable(await connector.read(remotePath, options));
                const counter = new Transform({
                    transform(chunk: Buffer, _encoding, callback) {
                        bytesWritten += chunk.length;
                        callback(bytesWritten > maxBytes ? new ResourceLimitError('The download exceeds maxBytes.') :
                            null, chunk);
                    },
                });

                await pipeline(source, counter, file.createWriteStream({autoClose: true}), {
                    signal: options.abortSignal,
                });
                checkAbort(options.abortSignal);

                if (metadata.size !== undefined && metadata.size !== bytesWritten) {
                    throw new IntegrityError('The remote file changed length or the download ended early.');
                }
            } finally {
                await file.close();
            }

            return {bytesWritten};
        });
    } catch (error) {
        if (owned) {
            try {
                await unlink(localPath);
            } catch (cleanupError) {
                throw new AggregateError([error, cleanupError],
                    'The download and local-file cleanup both failed.', {cause: cleanupError});
            }
        }

        throw error;
    }
}

export interface PublishRecipeOptions extends ConnectorOperationOptions {
    /** Explicit integrity value supplied by the application, never guessed by the recipe. */
    expectedSha256?: string;
    /** Fail unless the selected connector/server can honor this rename guarantee. */
    requireAtomicRename?: boolean;
}

/** Publishes to a new remote name with overwrite:'fail'; deployment replacement policy stays with the application. */
export async function publishNewFile(
    createConnector: () => RecipeConnector,
    localPath: string,
    remotePath: string,
    options: PublishRecipeOptions = {},
): Promise<PublicationResult> {
    checkAbort(options.abortSignal);

    const metadata = await stat(localPath);

    if (!metadata.isFile()) {
        throw new NotSupportedError('This recipe publishes regular files only.');
    }

    return withConnectedSite(createConnector, options, connector => publishFile(connector, remotePath,
        () => createReadStream(localPath), {
            ...options,
            overwrite: 'fail',
            totalBytes: metadata.size,
            ...(options.expectedSha256 === undefined ? {} : {
                verify: {algorithm: 'sha256', expectedDigest: options.expectedSha256, maxBytes: metadata.size},
            }),
        }));
}
