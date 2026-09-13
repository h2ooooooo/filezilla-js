import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {getSiteManager, LogonType, ServerProtocol, type Server} from '@jalsoedesign/filezilla-core';
import {FtpConnectorFactory} from '@jalsoedesign/filezilla-connector-ftp';
import {SftpConnectorFactory} from '@jalsoedesign/filezilla-connector-sftp';
import {
    AuthError,
    ConnectorError,
    CredentialProviderError,
    DirectoryAccessError,
    HostTrustError,
    NotFoundError,
    NotSupportedError,
    OperationAbortedError,
    OperationTimeoutError,
    PermissionError,
    ResourceLimitError,
    UnsupportedProtocolError,
    type ConnectionStage,
    type ConnectorOperationOptions,
    type TransferConnector,
} from '@jalsoedesign/filezilla-connector-abstract';

export type ConnectionCheckStage = ConnectionStage | 'input' | 'list' | 'cleanup';
export type ConnectionCheckStatus = 'ok' | 'invalid-options' | 'trust-rejected' | 'authentication-failed' |
    'unsupported-protocol' | 'connection-failed' | 'directory-failed' | 'credentials-required' |
    'invalid-site' | 'cleanup-failed' | 'listing-limit' | 'cancelled' | 'timeout';

export interface ConnectionCheckResult {
    readonly schemaVersion: 1;
    readonly ok: boolean;
    readonly status: ConnectionCheckStatus;
    readonly exitCode: number;
    readonly stage: ConnectionCheckStage;
    readonly message: string;
    readonly connected: boolean;
    readonly directoryChecked: boolean;
    readonly cleanup: 'not-required' | 'closed' | 'failed';
    readonly listing?: readonly {readonly path: string; readonly type: string; readonly size?: number}[];
}

export interface ConnectionCheckOptions {
    readonly hostKeySha256?: string;
    readonly password?: string;
    readonly directory?: string;
    readonly includeListing?: boolean;
    readonly timeoutMs?: number;
    readonly maxEntries?: number;
    readonly abortSignal?: AbortSignal;
}

type CheckConnector = Pick<TransferConnector, 'stat' | 'list'> & {
    connect(options?: ConnectorOperationOptions): Promise<void>;
    disconnect(): Promise<void>;
};

const outcomes: Record<ConnectionCheckStatus, {exitCode: number; message: string}> = {
    ok: {exitCode: 0, message: 'Connection check completed.'},
    'invalid-options': {exitCode: 2, message: 'Invalid check options. Run filezilla-js check --help.'},
    'trust-rejected': {exitCode: 3, message: 'Server identity was not accepted. Verify the configured trust information.'},
    'authentication-failed': {exitCode: 4, message: 'The server rejected authentication.'},
    'unsupported-protocol': {exitCode: 5, message: 'The saved protocol or authentication mode is not supported by this check.'},
    'connection-failed': {exitCode: 6, message: 'The connection could not be established or was interrupted.'},
    'directory-failed': {exitCode: 7, message: 'The requested directory could not be accessed.'},
    'credentials-required': {exitCode: 8, message: 'Credentials are unavailable. Supply a saved credential or --password-stdin.'},
    'invalid-site': {exitCode: 9, message: 'The Site Manager file or exact site selection is invalid or unavailable.'},
    'cleanup-failed': {exitCode: 10, message: 'The check completed but connection cleanup did not finish successfully.'},
    'listing-limit': {exitCode: 11, message: 'The optional listing exceeded its configured entry limit.'},
    cancelled: {exitCode: 130, message: 'Connection check cancelled.'},
    timeout: {exitCode: 124, message: 'Connection check exceeded its deadline.'},
};

function result(
    status: ConnectionCheckStatus,
    stage: ConnectionCheckStage,
    connected = false,
    directoryChecked = false,
    listing?: ConnectionCheckResult['listing'],
): ConnectionCheckResult {
    return Object.freeze({
        schemaVersion: 1,
        ok: status === 'ok',
        status,
        ...outcomes[status],
        stage,
        connected,
        directoryChecked,
        cleanup: 'not-required',
        ...(listing === undefined ? {} : {listing: Object.freeze(listing)}),
    });
}

function interruption(signal: AbortSignal): Error {
    return signal.reason instanceof OperationTimeoutError || signal.reason?.name === 'TimeoutError' ?
        new OperationTimeoutError() :
        new OperationAbortedError();
}

function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const abort = () => reject(interruption(signal));

        signal.addEventListener('abort', abort, {once: true});

        operation.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));

        if (signal.aborted) {
            abort();
        }
    });
}

function safeStage(error: unknown, fallback: ConnectionCheckStage): ConnectionCheckStage {
    const stages: ConnectionCheckStage[] = [
        'resolve',
        'connect',
        'trust',
        'authenticate',
        'directory',
        'credentials',
        'ready',
    ];

    return error instanceof ConnectorError && error.stage && stages.includes(error.stage) ? error.stage : fallback;
}

function failure(error: unknown, stage: ConnectionCheckStage, connected: boolean): ConnectionCheckResult {
    const actualStage = safeStage(error, stage);

    if (error instanceof OperationTimeoutError) {
        return result('timeout', actualStage, connected);
    }

    if (error instanceof OperationAbortedError) {
        return result('cancelled', actualStage, connected);
    }

    if (error instanceof HostTrustError) {
        return result('trust-rejected', 'trust', connected);
    }

    if (error instanceof CredentialProviderError) {
        return result('credentials-required', 'credentials', connected);
    }

    if (error instanceof AuthError) {
        return result('authentication-failed', 'authenticate', connected);
    }

    if (error instanceof UnsupportedProtocolError || error instanceof NotSupportedError) {
        return result('unsupported-protocol', actualStage, connected);
    }

    if (error instanceof ResourceLimitError) {
        return result('listing-limit', 'list', connected);
    }

    if (
        stage === 'directory' ||
        stage === 'list' ||
        error instanceof DirectoryAccessError ||
        error instanceof PermissionError ||
        error instanceof NotFoundError
    ) {
        return result('directory-failed', actualStage, connected);
    }

    return result('connection-failed', actualStage, connected);
}

function validateOptions(options: ConnectionCheckOptions): void {
    const timeoutMs = options.timeoutMs ?? 30000;
    const maxEntries = options.maxEntries ?? 1000;

    if (
        !Number.isSafeInteger(timeoutMs) ||
        timeoutMs < 1 ||
        timeoutMs > 2147483647 ||
        !Number.isSafeInteger(maxEntries) ||
        maxEntries < 1 ||
        maxEntries > 100000 ||
        (options.directory !== undefined &&
            (!options.directory ||
                /[\0\r\n]/.test(options.directory)))
    ) {
        throw new TypeError('Invalid connection check options.');
    }
}

function validateSiteSelection(server: Server, options: ConnectionCheckOptions): void {
    const protocol = server.propertiesRaw.protocol;
    const logonType = server.propertiesRaw.logonType;

    if (![
        ServerProtocol.SFTP,
        ServerProtocol.FTP,
        ServerProtocol.FTPS,
        ServerProtocol.FTPES,
        ServerProtocol.INSECURE_FTP,
    ].includes(protocol)) {
        throw new UnsupportedProtocolError('Unsupported saved protocol.');
    }

    if (![LogonType.anonymous, LogonType.normal, LogonType.ask, LogonType.key].includes(logonType)) {
        throw new NotSupportedError('Unsupported saved authentication mode.');
    }

    if (protocol === ServerProtocol.SFTP && !/^SHA256:[A-Za-z0-9+/]{43}=?$/.test(options.hostKeySha256 ?? '')) {
        throw new HostTrustError();
    }

    if (protocol !== ServerProtocol.SFTP && options.hostKeySha256 !== undefined) {
        throw new TypeError('SSH host-key pinning is only applicable to SFTP.');
    }
}

function createConnector(server: Server, options: ConnectionCheckOptions): CheckConnector {
    validateSiteSelection(server, options);

    const protocol = server.propertiesRaw.protocol;
    const logonType = server.propertiesRaw.logonType;
    const password = options.password ?? server.propertiesRaw.password;
    const operationOptions = {autoReconnect: false, maxTransientRetries: 0, timeoutMs: options.timeoutMs ?? 30000};

    if (logonType !== LogonType.anonymous && logonType !== LogonType.key && password === undefined) {
        throw new CredentialProviderError();
    }

    if (protocol === ServerProtocol.SFTP) {
        const expected = options.hostKeySha256!.replace(/=$/, '');

        return SftpConnectorFactory.fromServer(server, {
            ...operationOptions,
            password,
            passphrase: password,
            requireTrustPolicy: true,
            hasTrustPolicy: challenge => challenge.fingerprint === expected,
            acceptTrustPolicy: () => false,
        });
    }

    return FtpConnectorFactory.fromServer(server, {
        ...operationOptions,
        ...(password === undefined ? {} : {credentialProvider: () => ({type: 'password' as const, password})}),
    });
}

/** Ordinary read-only connector operations with fixed, credential-free result messages. */
export async function checkConnection(
    server: Server,
    options: ConnectionCheckOptions = {},
): Promise<ConnectionCheckResult> {
    try {
        validateOptions(options);
    } catch {
        return result('invalid-options', 'input');
    }

    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(new OperationTimeoutError()), options.timeoutMs ?? 30000);
    const signal = options.abortSignal ? AbortSignal.any([deadline.signal, options.abortSignal]) : deadline.signal;
    let connector: CheckConnector | undefined;
    let connected = false;
    let directoryChecked = false;
    let stage: ConnectionCheckStage = 'input';
    let outcome = result('connection-failed', 'input');

    try {
        if (signal.aborted) {
            throw interruption(signal);
        }

        connector = createConnector(server, options);
        stage = 'connect';

        const operationOptions = {
            timeoutMs: options.timeoutMs ?? 30000,
            abortSignal: signal,
            autoReconnect: false,
            maxTransientRetries: 0,
        };

        await abortable(connector.connect(operationOptions), signal);
        connected = true;

        if (options.directory !== undefined) {
            stage = 'directory';

            const entry = await abortable(connector.stat(options.directory, operationOptions), signal);

            if (entry.type !== 'directory') {
                throw new DirectoryAccessError();
            }

            directoryChecked = true;
        }

        let listing: {path: string; type: string; size?: number}[] | undefined;

        if (options.includeListing) {
            stage = 'list';
            listing = [];

            const iterator = connector.list(options.directory ?? '.', {...operationOptions, deep: false})[Symbol.asyncIterator]();

            try {
                while (true) {
                    const next = await abortable(iterator.next(), signal);

                    if (next.done) {
                        break;
                    }

                    if (listing.length >= (options.maxEntries ?? 1000)) {
                        throw new ResourceLimitError('The optional listing exceeded its entry limit.');
                    }

                    listing.push(Object.freeze({
                        path: next.value.path,
                        type: next.value.type,
                        ...(next.value.type === 'file' ? {size: next.value.size} : {}),
                    }));
                }
            } finally {
                // Do not let a blocked iterator prevent the connection's forced cleanup below.
                void iterator.return?.(undefined).catch(() => undefined);
            }
        }

        outcome = result('ok', 'ready', connected, directoryChecked, listing);
    } catch (error) {
        outcome = error instanceof TypeError && stage === 'input' ?
            result('invalid-options', 'input') :
            failure(signal.aborted ? interruption(signal) : error, stage, connected);
        outcome = Object.freeze({...outcome, directoryChecked});
    } finally {
        clearTimeout(timer);

        if (connector) {
            const cleanupDeadline = new AbortController();
            const cleanupTimer = setTimeout(() => cleanupDeadline.abort(new OperationTimeoutError()), 2000);

            try {
                await abortable(connector.disconnect(), cleanupDeadline.signal);
                outcome = Object.freeze({...outcome, cleanup: 'closed'});
            } catch {
                if (outcome.ok) {
                    outcome = result('cleanup-failed', 'cleanup', connected, directoryChecked);
                }

                outcome = Object.freeze({...outcome, cleanup: 'failed'});
            } finally {
                clearTimeout(cleanupTimer);
            }
        }
    }

    return outcome;
}

interface CheckArguments extends ConnectionCheckOptions {
    file?: string;
    sitePath?: string;
    passwordStdin?: boolean;
    json?: boolean;
    help?: boolean;
}

function parseCheckArguments(args: string[]): CheckArguments {
    const options: Record<string, unknown> = {};
    const valued: Record<string, string> = {
        '--file': 'file',
        '--host-key-sha256': 'hostKeySha256',
        '--directory': 'directory',
        '--timeout-ms': 'timeoutMs',
        '--max-entries': 'maxEntries',
    };

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];

        if (arg === '--json') {
            options.json = true;
        } else if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg === '--include-listing') {
            options.includeListing = true;
        } else if (arg === '--password-stdin') {
            options.passwordStdin = true;
        } else if (Object.prototype.hasOwnProperty.call(valued, arg)) {
            const value = args[++index];

            if (value === undefined || value.startsWith('--')) {
                throw new TypeError('Missing check argument value.');
            }

            options[valued[arg]] = arg === '--timeout-ms' || arg === '--max-entries' ? Number(value) : value;
        } else if (arg.startsWith('-') || options.sitePath !== undefined) {
            throw new TypeError('Unknown or repeated check argument.');
        } else {
            options.sitePath = arg;
        }
    }

    return options as CheckArguments;
}

function defaultFile(): string | undefined {
    const directory = process.env.HOME || homedir();
    const candidates = [
        process.env.APPDATA && join(process.env.APPDATA, 'FileZilla', 'sitemanager.xml'),
        join(process.env.XDG_CONFIG_HOME || join(directory, '.config'), 'filezilla', 'sitemanager.xml'),
        join(directory, '.filezilla', 'sitemanager.xml'),
    ];

    return candidates.find((path): path is string => typeof path === 'string' && existsSync(path));
}

async function stdinPassword(signal: AbortSignal): Promise<string> {
    if (process.stdin.isTTY) {
        throw new CredentialProviderError();
    }

    return new Promise<string>((resolve, reject) => {
        const chunks: Buffer[] = [];
        let length = 0;
        const cleanup = () => {
            process.stdin.off('data', data);
            process.stdin.off('end', end);
            process.stdin.off('error', error);
            signal.removeEventListener('abort', abort);
            process.stdin.pause();
        };
        const error = () => {
            cleanup();
            reject(new CredentialProviderError());
        };
        const abort = () => {
            cleanup();
            reject(interruption(signal));
        };
        const data = (chunk: Buffer | string) => {
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

            length += bytes.length;

            if (length > 65536) {
                error();

                return;
            }

            chunks.push(bytes);
        };
        const end = () => {
            cleanup();

            const password = Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');

            if (/[\r\n\0]/.test(password)) {
                reject(new CredentialProviderError());

                return;
            }

            resolve(password);
        };

        process.stdin.on('data', data);
        process.stdin.once('end', end);
        process.stdin.once('error', error);
        signal.addEventListener('abort', abort, {once: true});

        if (signal.aborted) {
            abort();
        }
    });
}

export async function runCheckCommand(args: string[]): Promise<void> {
    const json = args.includes('--json');
    let outcome: ConnectionCheckResult;
    let options: CheckArguments;

    try {
        options = parseCheckArguments(args);
        validateOptions(options);
    } catch {
        outputCheck(result('invalid-options', 'input'), json);

        return;
    }

    if (options.help) {
        console.log('Usage: filezilla-js check <path> [--file <xml>] [--json] [--host-key-sha256 <pin>]');
        console.log('  --password-stdin       Read one password/passphrase from redirected input (never argv)');
        console.log('  --directory <path>     Check directory metadata after connecting');
        console.log('  --include-listing      Include a shallow directory listing (off by default)');
        console.log('  --max-entries <count>  Limit optional listing output (default 1000)');
        console.log('  --timeout-ms <ms>      Overall deadline including redirected input (default 30000)');

        return;
    }

    const controller = new AbortController();
    const cancel = () => controller.abort(new OperationAbortedError());
    const timer = setTimeout(() => controller.abort(new OperationTimeoutError()), options.timeoutMs ?? 30000);

    process.once('SIGINT', cancel);
    process.once('SIGTERM', cancel);

    let stage: ConnectionCheckStage = 'input';

    try {
        const path = options.file ?? defaultFile();

        if (!path || !options.sitePath) {
            outputCheck(result(options.sitePath ? 'invalid-site' : 'invalid-options', 'input'), json);

            return;
        }

        const manager = getSiteManager(path, {
            includePasswords: !options.passwordStdin,
            credentialPath: options.sitePath,
        });
        const server = manager.getServerByPath(options.sitePath);

        if (!server) {
            outputCheck(result('invalid-site', 'input'), json);

            return;
        }

        stage = 'credentials';
        validateSiteSelection(server, options);

        const password = options.passwordStdin ? await stdinPassword(controller.signal) : undefined;

        outcome = await checkConnection(server, {...options, password, abortSignal: controller.signal});
    } catch (error) {
        if (stage === 'input') {
            outcome = result('invalid-site', 'input');
        } else if (error instanceof TypeError) {
            outcome = result('invalid-options', 'input');
        } else {
            outcome = failure(error, stage, false);
        }
    } finally {
        clearTimeout(timer);
        process.off('SIGINT', cancel);
        process.off('SIGTERM', cancel);
    }

    outputCheck(outcome!, json);
}

function outputCheck(outcome: ConnectionCheckResult, json: boolean): void {
    if (json) {
        console.log(JSON.stringify(outcome));
    } else {
        console.log(`${outcome.status}: ${outcome.message}`);

        if (outcome.listing) {
            for (const entry of outcome.listing) {
                console.log(`${entry.type}: ${JSON.stringify(entry.path)}`);
            }
        }
    }

    process.exitCode = outcome.exitCode;
}
