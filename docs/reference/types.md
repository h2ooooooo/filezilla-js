<!-- Generated from public package declarations by scripts/generate-api-docs.mjs. -->
# TypeScript reference

These signatures come from the public package entry points and their re-exports. Build the libraries and run `npm run docs:api` to update them. Use the API guide for behavior and examples.

## @jalsoedesign/filezilla-cli

### index.d.ts

```ts
export { checkConnection } from './commands/check.js';
export type { ConnectionCheckOptions, ConnectionCheckResult, ConnectionCheckStage, ConnectionCheckStatus } from './commands/check.js';
export { createFileZillaCliSource } from './source.js';
export declare function run(): Promise<void>;
```

### check.d.ts

```ts
import { type Server } from '@jalsoedesign/filezilla-core';
import { type ConnectionStage } from '@jalsoedesign/dockline-abstract';
export type ConnectionCheckStage = ConnectionStage | 'input' | 'list' | 'cleanup';
export type ConnectionCheckStatus = 'ok' | 'invalid-options' | 'trust-rejected' | 'authentication-failed' | 'unsupported-protocol' | 'connection-failed' | 'directory-failed' | 'credentials-required' | 'invalid-site' | 'cleanup-failed' | 'listing-limit' | 'cancelled' | 'timeout';
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
    readonly listing?: readonly {
        readonly path: string;
        readonly type: string;
        readonly size?: number;
    }[];
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
/** Ordinary read-only connector operations with fixed, credential-free result messages. */
export declare function checkConnection(server: Server, options?: ConnectionCheckOptions): Promise<ConnectionCheckResult>;
export declare function runCheckCommand(args: string[]): Promise<void>;
```

### source.d.ts

```ts
import type { Server, SiteManager } from '@jalsoedesign/filezilla-core';
import type { SourceReference } from '@jalsoedesign/portline-abstract';
import type { ProfileCliSource, ProfileCommandContext } from '@jalsoedesign/portline-cli';
import type { CommandContext } from './types.js';
export declare function remoteDirectoryFor(server: Server): string;
/** Preserves FileZilla's native properties, folder names and legacy JSON shapes. */
export declare function createFileZillaCliSource(manager: SiteManager, source?: SourceReference): ProfileCliSource<Server>;
export declare function fileZillaCommandContext(ctx: CommandContext): ProfileCommandContext<Server>;
```

## @jalsoedesign/filezilla-connector-abstract

### index.d.ts

```ts
export { ConnectorFactory } from './ConnectorFactory.js';
export { ConnectorRegistry } from './ConnectorRegistry.js';
export type { RegisteredProvider, Registration } from './ConnectorRegistry.js';
```

### ConnectorFactory.d.ts

```ts
import type { Server } from '@jalsoedesign/filezilla-core';
import type { StorageAdapter } from '@flystorage/file-storage';
import { ProfileConnectorFactory } from '@jalsoedesign/portline-abstract';
/** Factories support instances for dependency injection and static convenience methods. */
export declare abstract class ConnectorFactory<TConnector extends StorageAdapter, TOptions = unknown> extends ProfileConnectorFactory<Server, TConnector, TOptions> {
    abstract fromServer(server: Server, options?: TOptions): TConnector;
    fromProfile(server: Server, options?: TOptions): TConnector;
}
```

### ConnectorRegistry.d.ts

```ts
import type { Server, ServerProtocol } from '@jalsoedesign/filezilla-core';
import type { StorageAdapter } from '@flystorage/file-storage';
export interface RegisteredProvider<TConnector extends StorageAdapter, TOptions> {
    readonly protocols: readonly ServerProtocol[];
    readonly factory: {
        fromServer(server: Server, options?: TOptions): TConnector;
    };
    readonly validateOptions?: (options: unknown) => void;
}
export interface Registration<TConnector extends StorageAdapter, TOptions> {
    readonly fromServer: (server: Server, options?: TOptions) => TConnector;
}
/** Explicit providers only. Registration handles preserve provider-specific option and result types. */
export declare class ConnectorRegistry {
    private readonly registry;
    register<TConnector extends StorageAdapter, TOptions>(provider: RegisteredProvider<TConnector, TOptions>, options?: {
        replace?: boolean;
    }): Registration<TConnector, TOptions>;
    /** Runtime dispatch cannot infer transport-specific options; use the typed registration handle where possible. */
    fromServer(server: Server, options?: unknown): StorageAdapter;
    protocols(): readonly ServerProtocol[];
}
```

## @jalsoedesign/filezilla-connector-ftp

### index.d.ts

```ts
export { FtpConnectorFactory } from './FtpConnectorFactory.js';
export type { FtpConnectorFactoryOptions } from './FtpConnectorFactory.js';
```

### FtpConnectorFactory.d.ts

```ts
import type { FtpTransferConfig } from '@jalsoedesign/dockline-ftp-client';
import { Server } from '@jalsoedesign/filezilla-core';
import { FtpConnector } from '@jalsoedesign/dockline-ftp-client';
import { ConnectorFactory } from '@jalsoedesign/filezilla-connector-abstract';
import { type ConnectorOperationOptions, type ConnectorConnectionOptions } from '@jalsoedesign/dockline-abstract';
import type { ConnectionOptions } from 'node:tls';
import type { FtpFilenameEncodingOptions } from '@jalsoedesign/dockline-ftp-client';
export interface FtpConnectorFactoryOptions extends ConnectorOperationOptions, ConnectorConnectionOptions {
    secureOptions?: ConnectionOptions;
    filenameEncoding?: FtpFilenameEncodingOptions;
}
export declare class FtpConnectorFactory extends ConnectorFactory<FtpConnector, FtpConnectorFactoryOptions> {
    fromServer(server: Server, options?: FtpConnectorFactoryOptions): FtpConnector;
    toConfig(server: Server, options?: FtpConnectorFactoryOptions): FtpTransferConfig;
    static fromServer(server: Server, options?: FtpConnectorFactoryOptions): FtpConnector;
    static toConfig(server: Server, options?: FtpConnectorFactoryOptions): FtpTransferConfig;
    private static toConnectorConfig;
}
```

## @jalsoedesign/filezilla-connector-sftp

### index.d.ts

```ts
export { SftpConnectorFactory } from './SftpConnectorFactory.js';
export type { SftpConnectorFactoryOptions } from './SftpConnectorFactory.js';
export { FileZillaHostKeyStore } from './FileZillaHostKeyStore.js';
```

### SftpConnectorFactory.d.ts

```ts
import type { SftpTransferConfig } from '@jalsoedesign/dockline-sftp-client';
import { Server } from '@jalsoedesign/filezilla-core';
import { ConnectorFactory } from '@jalsoedesign/filezilla-connector-abstract';
import { SftpConnector, type SftpConnectorConfig } from '@jalsoedesign/dockline-sftp-client';
export type SftpConnectorFactoryOptions = Omit<SftpConnectorConfig, 'host' | 'port' | 'username' | 'initialPath'>;
export declare class SftpConnectorFactory extends ConnectorFactory<SftpConnector, SftpConnectorFactoryOptions> {
    fromServer(server: Server, options?: SftpConnectorFactoryOptions): SftpConnector;
    toConfig(server: Server, options?: SftpConnectorFactoryOptions): SftpTransferConfig;
    static fromServer(server: Server, options?: SftpConnectorFactoryOptions): SftpConnector;
    static toConfig(server: Server, options?: SftpConnectorFactoryOptions): SftpTransferConfig;
    private static toConnectorConfig;
}
```

### FileZillaHostKeyStore.d.ts

```ts
import type { SftpHostKeyChallenge } from '@jalsoedesign/dockline-sftp-client';
/**
 * Read-only snapshot of modern FileZilla hostkeys.xml, loaded from an explicit path.
 * This imports exact host-key pins only; it never adopts weaker algorithm policy.
 */
export declare class FileZillaHostKeyStore {
    private readonly entries;
    private constructor();
    static fromFile(filename: string): Promise<FileZillaHostKeyStore>;
    /** Bound callback: safe to pass directly as connector hasTrustPolicy. */
    readonly hasTrustPolicy: (challenge: SftpHostKeyChallenge) => boolean;
    getKnownFingerprints(host: string, port: number): string[];
}
```

## @jalsoedesign/filezilla-core

### index.d.ts

```ts
export * from './SiteManager';
export * from './FileZillaProfileSource';
export * from './Server';
export * from './SiteIdentityStore';
export * from './MetadataSnapshot';
export * from './enum/CharsetEncoding';
export * from './enum/LogonType';
export * from './enum/PasvMode';
export * from './enum/ServerFormat';
export * from './enum/ServerProtocol';
export * from './enum/ServerType';
export * from './types/XmlConfigTypes';
export * from './types/ServerTreeTypes';
export * from './writing';
```

### SiteManager.d.ts

```ts
import { Server } from './Server';
import { XmlConfig } from './types/XmlConfigTypes';
import { ServerTree } from './types/ServerTreeTypes';
export declare function getDefaultSiteManager(): SiteManager;
export declare function getDefaultSiteManagerPath(): string;
export interface SiteManagerReadOptions {
    includePasswords?: boolean;
    /** Canonical site path; literal percent and slash characters in names use %25 and %2F. */
    credentialPath?: string;
    /** Strict is the compatibility default. Tolerant imports reject individual invalid records. */
    mode?: 'strict' | 'tolerant';
    /** Report undecodable remote paths as metadata-only warnings without rejecting the site. */
    inspectRemoteDirectories?: boolean;
}
export interface SiteImportDiagnostic {
    readonly code: 'INVALID_SITE' | 'INVALID_FOLDER' | 'DUPLICATE_SITE_PATH' | 'REMOTE_DIRECTORY_UNAVAILABLE';
    readonly severity: 'error' | 'warning';
    /** Structural XML location; no values or credentials are interpolated. */
    readonly sourcePath: string;
    readonly field?: string;
    readonly message: string;
}
export interface SiteManagerImportReport {
    readonly manager: SiteManager;
    readonly diagnostics: readonly SiteImportDiagnostic[];
    readonly complete: boolean;
    readonly acceptedCount: number;
    readonly rejectedCount: number;
}
/** Passwords are excluded by default from the report workflow, including its manager. */
export declare function readSiteManagerReport(xmlPath: string, options?: SiteManagerReadOptions): SiteManagerImportReport;
export declare function getSiteManager(xmlPath: string, options?: SiteManagerReadOptions): SiteManager;
export declare class SiteManager {
    #private;
    constructor(xml: XmlConfig, options?: SiteManagerReadOptions);
    get importDiagnostics(): readonly SiteImportDiagnostic[];
    get rejectedCount(): number;
    getServers(): Server[];
    toJSON(): {
        servers: ReturnType<Server['toJSON']>[];
    };
    getServerByPath(path: string): Server | null;
    searchServers(term: string, options?: {
        fields?: 'name' | 'all';
    }): Server[];
    getServersTree(servers?: Server[]): ServerTree;
    private collectServers;
    private rejectRecord;
    private addDiagnostic;
    private inspectRemoteDirectory;
    private createServer;
}
```

### FileZillaProfileSource.d.ts

```ts
import type { Awaitable, ConnectionProfile, CredentialProvider, CredentialReference, CredentialResult, CredentialState, ProfileSearchOptions, ProfileSource, SourceReference } from '@jalsoedesign/portline-abstract';
import { SiteManager } from './SiteManager';
import { Server } from './Server';
/** Metadata projection; native configuration remains available through Server and SiteManager. */
export declare function toConnectionProfile(server: Server, source?: SourceReference, credentialState?: CredentialState): ConnectionProfile;
export interface FileZillaProfileSourceOptions {
    readonly source?: SourceReference;
    readonly loadCredential?: (server: Server) => Awaitable<CredentialResult>;
}
export declare class FileZillaProfileSource implements ProfileSource, CredentialProvider {
    readonly manager: SiteManager;
    private readonly options;
    readonly source: SourceReference;
    constructor(manager: SiteManager, options?: FileZillaProfileSourceOptions);
    /** Discovery is application-specific. This file source loads only metadata until resolve() is called. */
    static fromFile(filename: string): FileZillaProfileSource;
    list(): readonly ConnectionProfile[];
    get(path: string): ConnectionProfile | undefined;
    search(term: string, options?: ProfileSearchOptions): readonly ConnectionProfile[];
    resolve(reference: CredentialReference): Promise<CredentialResult>;
    private project;
}
```

### Server.d.ts

```ts
import { PasvMode } from './enum/PasvMode';
import { LogonType } from './enum/LogonType';
import { CharsetEncoding } from './enum/CharsetEncoding';
import { ServerProtocol } from './enum/ServerProtocol';
import { ServerType } from './enum/ServerType';
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
export declare class Server {
    #private;
    /** The full path in its folder */
    readonly path: string;
    constructor(properties: ServerProperties, path: string);
    get propertiesRaw(): ServerProperties;
    get properties(): ServerPropertiesExtended;
    /** JSON serialization is metadata-only; request credentials through the explicit property APIs. */
    toJSON(): Omit<ServerPropertiesExtended, 'password'>;
    get siteProtocolName(): string;
    getRemoteDirectory(defaultRemoteDirectory?: string): string;
}
```

### SiteIdentityStore.d.ts

```ts
import { Server } from './Server';
import { SiteManager } from './SiteManager';
export interface SiteIdentityEndpoint {
    readonly host: string;
    readonly port: number;
    readonly protocol: number;
    readonly user: string;
}
export interface SiteIdentityRecord {
    readonly id: string;
    readonly path: string;
    readonly endpoint: SiteIdentityEndpoint;
    readonly sourceSiteId?: string;
}
export interface SiteIdentityData {
    readonly schemaVersion: 1;
    readonly sources: readonly {
        readonly sourceId: string;
        readonly sites: readonly SiteIdentityRecord[];
    }[];
}
export interface SiteIdentityConflict {
    readonly code: 'AMBIGUOUS_IDENTITY' | 'ENDPOINT_CHANGED' | 'SOURCE_ID_CHANGED';
    readonly path: string;
    readonly candidateIds: readonly string[];
}
export interface SiteIdentityReconcileOptions {
    /** Application-owned identifier for one independently managed import source. */
    readonly sourceId: string;
    /** Optional durable IDs supplied by the application/source, never inferred from XML fields. */
    readonly sourceSiteIds?: Readonly<Record<string, string>>;
    /** Explicit reviewed decision: an existing ID, or null to allocate a new identity. */
    readonly resolutions?: Readonly<Record<string, string | null>>;
}
export interface SiteIdentityReconcileResult {
    /** False means no store changes were committed. Resolve all conflicts and retry. */
    readonly committed: boolean;
    readonly sites: readonly SiteIdentityRecord[];
    readonly conflicts: readonly SiteIdentityConflict[];
}
/** Versioned metadata only. The application owns atomic persistence and synchronization. */
export declare class SiteIdentityStore {
    #private;
    static fromJSON(value: unknown): SiteIdentityStore;
    toJSON(): SiteIdentityData;
    reconcile(manager: SiteManager, options: SiteIdentityReconcileOptions): SiteIdentityReconcileResult;
    /** Resolve only after reconciliation; changed endpoints and ambiguous current paths never match. */
    resolve(manager: SiteManager, selection: {
        sourceId: string;
        id: string;
    }): Server | null;
    /** Migrate an existing saved canonical path only when it resolves uniquely in this import. */
    migratePath(manager: SiteManager, selection: {
        sourceId: string;
        path: string;
    }): string | null;
    private validateOptions;
}
```

### MetadataSnapshot.d.ts

```ts
import { SiteManager } from './SiteManager';
import { SiteIdentityStore } from './SiteIdentityStore';
export interface MetadataProfile {
    readonly includeUsernames: boolean;
    readonly includeLocalPaths: boolean;
    readonly includeComments: boolean;
}
export interface MetadataSite {
    readonly key: string;
    readonly path: string;
    readonly name: string;
    readonly host: string;
    readonly port: number;
    readonly protocol: number;
    readonly type: number;
    readonly logonType: number;
    readonly timezoneOffset: number;
    readonly passiveMode: number;
    readonly maximumMultipleConnections: number;
    readonly encodingType: number;
    readonly customEncoding: string;
    readonly bypassProxy: boolean;
    readonly synchronizedBrowsing: boolean;
    readonly directoryComparison: boolean;
    readonly remoteDirectoryStatus: 'unset' | 'decoded' | 'unsupported';
    readonly remoteDirectory: string;
    readonly user?: string;
    readonly keyFile?: string;
    readonly localDirectory?: string;
    readonly comments?: string;
}
export interface MetadataSnapshot {
    readonly schemaVersion: 1;
    readonly identity: 'canonical-path' | 'stable-id';
    readonly sourceId?: string;
    readonly profile: MetadataProfile;
    readonly complete: boolean;
    readonly sites: readonly MetadataSite[];
}
export interface MetadataSnapshotOptions extends Partial<MetadataProfile> {
    readonly schemaVersion?: 1;
    readonly identityStore?: SiteIdentityStore;
    readonly sourceId?: string;
    /** Partial snapshots and their diffs are explicitly marked incomplete. */
    readonly allowPartial?: boolean;
}
export interface MetadataFieldChange {
    readonly field: Exclude<keyof MetadataSite, 'key'>;
    readonly before: string | number | boolean | undefined;
    readonly after: string | number | boolean | undefined;
}
export interface MetadataDiff {
    readonly schemaVersion: 1;
    /** True means missing records could be import errors rather than actual additions/removals. */
    readonly uncertain: boolean;
    readonly added: readonly MetadataSite[];
    readonly removed: readonly MetadataSite[];
    readonly changed: readonly {
        readonly key: string;
        readonly fields: readonly MetadataFieldChange[];
    }[];
}
export declare class MetadataSnapshotError extends Error {
    readonly code: 'UNSUPPORTED_SCHEMA' | 'INVALID_SNAPSHOT' | 'PROFILE_MISMATCH';
    constructor(code: 'UNSUPPORTED_SCHEMA' | 'INVALID_SNAPSHOT' | 'PROFILE_MISMATCH', message: string);
}
export declare function createMetadataSnapshot(manager: SiteManager, options?: MetadataSnapshotOptions): MetadataSnapshot;
/** Validate persisted snapshots before use; unknown fields are rejected rather than retained. */
export declare function parseMetadataSnapshot(value: unknown): MetadataSnapshot;
export declare function diffMetadata(previousValue: unknown, currentValue: unknown): MetadataDiff;
```

### CharsetEncoding.d.ts

```ts
export declare enum CharsetEncoding {
    ENCODING_UTF8 = 0,
    ENCODING_CUSTOM = 1,
    ENCODING_AUTO = 2
}
```

### LogonType.d.ts

```ts
export declare enum LogonType {
    anonymous = 0,
    normal = 1,
    ask = 2,// ask should not be sent to the engine, it's intended to be used by the interface
    interactive = 3,
    account = 4,
    key = 5,
    profile = 6,// S3 profile
    adc = 7,// Google Cloud Application Default Credenttials
    count = 8
}
```

### PasvMode.d.ts

```ts
export declare enum PasvMode {
    MODE_DEFAULT = 0,
    MODE_ACTIVE = 1,
    MODE_PASSIVE = 2
}
```

### ServerFormat.d.ts

```ts
export declare enum ServerFormat {
    HOST_ONLY = 0,
    WITH_OPTIONAL_PORT = 1,
    WITH_USER_AND_OPTIONAL_PORT = 2,
    URL = 3,
    URL_WITH_PASSWORD = 4
}
```

### ServerProtocol.d.ts

```ts
export declare enum ServerProtocol {
    UNKNOWN = -1,
    FTP = 0,// FTP, attempts AUTH TLS
    SFTP = 1,
    HTTP = 2,
    FTPS = 3,// Implicit SSL
    FTPES = 4,// Explicit SSL
    HTTPS = 5,
    INSECURE_FTP = 6,// Insecure, as the name suggests
    S3 = 7,// Amazon S3 or compatible
    STORJ = 8,
    WEBDAV = 9,
    AZURE_FILE = 10,
    AZURE_BLOB = 11,
    SWIFT = 12,
    GOOGLE_CLOUD = 13,
    GOOGLE_DRIVE = 14,
    DROPBOX = 15,
    ONEDRIVE = 16,
    B2 = 17,
    BOX = 18,
    INSECURE_WEBDAV = 19,
    RACKSPACE = 20,
    STORJ_GRANT = 21,
    S3_SSO = 22,
    GOOGLE_CLOUD_SVC_ACC = 23,
    CLOUDFLARE_R2 = 24,
    MAX_VALUE = 24
}
```

### ServerType.d.ts

```ts
export declare enum ServerType {
    DEFAULT = 0,
    UNIX = 1,
    VMS = 2,
    DOS = 3,// Backslashes as preferred separator
    MVS = 4,
    VXWORKS = 5,
    ZVM = 6,
    HPNONSTOP = 7,
    DOS_VIRTUAL = 8,
    CYGWIN = 9,
    DOS_FWD_SLASHES = 10,// Forwardslashes as preferred separator
    SERVERTYPE_MAX = 11
}
```

### XmlConfigTypes.d.ts

```ts
import { ServerProtocol } from '../enum/ServerProtocol';
import { ServerType } from '../enum/ServerType';
import { LogonType } from '../enum/LogonType';
import { PasvMode } from '../enum/PasvMode';
import { CharsetEncoding } from '../enum/CharsetEncoding';
export type XmlConfig = {
    FileZilla3: XmlRootFolderConfig;
};
export type XmlRootFolderConfig = {
    Servers: XmlFolderConfig;
};
export type XmlServerConfig = {
    Host: string;
    Port: number;
    Protocol: ServerProtocol;
    Type: ServerType;
    User?: string;
    Pass?: string | {
        '#text': string;
        '@_encoding': string;
    };
    Logontype: LogonType;
    TimezoneOffset: number;
    PasvMode: PasvMode;
    MaximumMultipleConnections: number;
    EncodingType: CharsetEncoding;
    CustomEncoding?: string;
    BypassProxy: boolean;
    Name: string | {
        '#text': string;
        '@_encoding': string;
    };
    Comments?: string;
    LocalDir?: string;
    RemoteDir?: string;
    SyncBrowsing: boolean;
    DirectoryComparison: boolean;
    Keyfile?: string;
};
export type XmlFolderConfig = {
    Server?: XmlServerConfig[] | XmlServerConfig;
    Folder?: XmlFolderConfig[] | XmlFolderConfig;
    '#text'?: string;
};
```

### ServerTreeTypes.d.ts

```ts
import { Server } from '../Server';
export interface ServerFolderNode {
    name: string;
    folders: ServerFolderNode[];
    servers: Server[];
}
export interface ServerTree extends ServerFolderNode {
    name: 'Root';
}
```

### writing.d.ts

```ts
import { NativeProfileWriter } from '@jalsoedesign/portline-platform';
import type { NativeWriteOptions } from '@jalsoedesign/portline-platform';
import type { SourceReference } from '@jalsoedesign/portline-abstract';
export declare function createFileZillaWriter(source: SourceReference, options?: Omit<NativeWriteOptions, 'source' | 'application'>): NativeProfileWriter;
```
