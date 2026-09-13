import {PasvMode} from './enum/PasvMode';
import {LogonType} from './enum/LogonType';
import {CharsetEncoding} from './enum/CharsetEncoding';
import {ServerProtocol} from './enum/ServerProtocol';
import {ServerType} from './enum/ServerType';

const protocolNames = new Map<number, string>();

for (const [name, value] of Object.entries(ServerProtocol)) {
    if (typeof value === 'number' && name !== 'MAX_VALUE') {
        protocolNames.set(value, name);
    }
}

export interface ServerProperties {
    /** The server host */
    host: string;

    /** The server port */
    port: number;

    /** The server protocol (ServerProtocol) */
    protocol: ServerProtocol;

    /** The server type (ServerType) */
    type: ServerType;

    /** The server username */
    user: string;

    /** The server password */
    password?: string;
    /** Source representation, retained even when passwords are not requested. */
    passwordEncoding?: string;

    /** The path to the server key file */
    keyFile?: string;

    /** The server logon type (LogonType) */
    logonType: LogonType;

    /** The timezone offset */
    timezoneOffset: number;

    /** The passive mode for this server (PassiveMode - only relevant for FTP servers) */
    passiveMode: PasvMode;

    /** The maximum concurrent connections to the server - 0 means no limit */
    maximumMultipleConnections: number;

    /** The server encoding type (CharsetEncoding) */
    encodingType: CharsetEncoding;

    /** The custom encoding to use */
    customEncoding?: string;

    /** Whether or not to bypass the proxy */
    bypassProxy: boolean;

    /** The server name in FileZilla */
    name: string;

    /** The server comments */
    comments?: string;

    /** The initial local directory */
    localDirectory?: string;

    /** The initial remote directory (raw) */
    remoteDirectory?: string;

    /** Whether or not to use synchronized browsing */
    synchronizedBrowsing: boolean;

    /** Whether or not to use directory comparison */
    directoryComparison: boolean;
}

export interface ServerPropertiesExtended extends ServerProperties {
    /** The path of the Server */
    path: string;
}

export class Server {
    /** The full path in its folder */
    public readonly path: string;

    readonly #properties: ServerProperties;

    constructor(properties: ServerProperties, path: string) {
        this.path = path;
        this.#properties = properties;
    }

    public get propertiesRaw(): ServerProperties {
        return this.#properties;
    }

    public get properties(): ServerPropertiesExtended {
        const decodeRemoteDirectory = () => this.getRemoteDirectory();

        return {
            path: this.path,
            ...this.#properties,
            get remoteDirectory() {
                return decodeRemoteDirectory();
            },
        };
    }

    /** JSON serialization is metadata-only; request credentials through the explicit property APIs. */
    public toJSON(): Omit<ServerPropertiesExtended, 'password'> {
        const metadata = {...this.#properties};

        delete metadata.password;

        return {path: this.path, ...metadata};
    }

    public get siteProtocolName(): string {
        return protocolNames.get(this.#properties.protocol) ?? 'UNKNOWN';
    }

    public getRemoteDirectory(defaultRemoteDirectory: string = ''): string {
        if (!this.#properties.remoteDirectory) {
            return defaultRemoteDirectory;
        }

        const rootMatch = this.#properties.remoteDirectory.match(/^(\d+)\s+(\d+)(?:\s+(.*))?$/s);

        if (!rootMatch) {
            throw new Error('Invalid encoded FileZilla remote directory');
        }

        const pathType: ServerType = parseInt(rootMatch[1], 10);
        const prefixLength: number = parseInt(rootMatch[2], 10);

        if (
            ![ServerType.DEFAULT, ServerType.UNIX, ServerType.DOS_VIRTUAL, ServerType.CYGWIN].includes(pathType) ||
            prefixLength !== 0
        ) {
            throw new Error(`Unsupported FileZilla remote directory type ${pathType} or prefix`);
        }

        let path: string = rootMatch[3] || '';

        const pathParts: string[] = [];

        while (path !== '') {
            const pathMatch = path.match(/^(\d+)\s/);

            if (!pathMatch) {
                throw new Error('Invalid encoded FileZilla remote directory segment');
            }

            const offset = parseInt(pathMatch[1], 10);
            const offsetLength = pathMatch[0].length;

            const pathPart = path.substring(offsetLength, offsetLength + offset);

            if (
                offset <= 0 ||
                pathPart.length !== offset ||
                /[/\\\0\r\n]/.test(pathPart) ||
                pathPart === '.' ||
                pathPart === '..'
            ) {
                throw new Error('Invalid encoded FileZilla remote directory segment');
            }

            const remainder = path.substring(offsetLength + offset);

            if (remainder.length > 0 && !/^\s/.test(remainder)) {
                throw new Error('Invalid encoded FileZilla remote directory separator');
            }

            path = remainder.trimStart();

            pathParts.push(pathPart);
        }

        return '/' + pathParts.join('/');
    }
}
