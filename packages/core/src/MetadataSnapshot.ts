import {Server} from './Server';
import {SiteManager} from './SiteManager';
import {SiteIdentityStore} from './SiteIdentityStore';

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

export class MetadataSnapshotError extends Error {
    constructor(public readonly code: 'UNSUPPORTED_SCHEMA' | 'INVALID_SNAPSHOT' | 'PROFILE_MISMATCH', message: string) {
        super(message);
        this.name = 'MetadataSnapshotError';
    }
}

const stringFields = [
    'key',
    'path',
    'name',
    'host',
    'customEncoding',
    'remoteDirectoryStatus',
    'remoteDirectory',
] as const;
const numberFields = [
    'port',
    'protocol',
    'type',
    'logonType',
    'timezoneOffset',
    'passiveMode',
    'maximumMultipleConnections',
    'encodingType',
] as const;
const booleanFields = ['bypassProxy', 'synchronizedBrowsing', 'directoryComparison'] as const;
const optionalFields = ['user', 'keyFile', 'localDirectory', 'comments'] as const;
const profileFields = ['includeUsernames', 'includeLocalPaths', 'includeComments'] as const;

function compare(left: string, right: string): number {
    return left < right ? -1 : left > right ? 1 : 0;
}

function remoteDirectoryFor(server: Server): Pick<MetadataSite, 'remoteDirectoryStatus' | 'remoteDirectory'> {
    if (!server.propertiesRaw.remoteDirectory) {
        return {remoteDirectoryStatus: 'unset', remoteDirectory: ''};
    }

    try {
        return {remoteDirectoryStatus: 'decoded', remoteDirectory: server.getRemoteDirectory()};
    } catch {
        return {remoteDirectoryStatus: 'unsupported', remoteDirectory: server.propertiesRaw.remoteDirectory};
    }
}

function metadataFor(server: Server, key: string, profile: MetadataProfile): MetadataSite {
    const properties = server.propertiesRaw;

    return Object.freeze({
        key,
        path: server.path,
        name: properties.name,
        host: properties.host.trim().toLowerCase(),
        port: properties.port,
        protocol: properties.protocol,
        type: properties.type,
        logonType: properties.logonType,
        timezoneOffset: properties.timezoneOffset,
        passiveMode: properties.passiveMode,
        maximumMultipleConnections: properties.maximumMultipleConnections,
        encodingType: properties.encodingType,
        customEncoding: properties.encodingType === 1 ? properties.customEncoding ?? '' : '',
        bypassProxy: properties.bypassProxy,
        synchronizedBrowsing: properties.synchronizedBrowsing,
        directoryComparison: properties.directoryComparison,
        ...remoteDirectoryFor(server),
        ...(profile.includeUsernames ? {user: properties.user ?? ''} : {}),
        ...(profile.includeLocalPaths ? {
            keyFile: properties.keyFile ?? '',
            localDirectory: properties.localDirectory ?? '',
        } : {}),
        ...(profile.includeComments ? {comments: properties.comments ?? ''} : {}),
    });
}

export function createMetadataSnapshot(
    manager: SiteManager,
    options: MetadataSnapshotOptions = {},
): MetadataSnapshot {
    if (options.schemaVersion !== undefined && options.schemaVersion !== 1) {
        throw new MetadataSnapshotError('UNSUPPORTED_SCHEMA', 'Unsupported metadata snapshot version; expected 1.');
    }

    if ((options.identityStore === undefined) !== (options.sourceId === undefined)) {
        throw new TypeError('Stable snapshots require both identityStore and sourceId.');
    }

    const complete = !manager.importDiagnostics.some(diagnostic => diagnostic.severity === 'error');

    if (!complete && !options.allowPartial) {
        throw new Error('Cannot snapshot an incomplete import without allowPartial: true.');
    }

    const profile = Object.freeze({
        includeUsernames: options.includeUsernames ?? false,
        includeLocalPaths: options.includeLocalPaths ?? false,
        includeComments: options.includeComments ?? false,
    });
    const sites = manager.getServers().map(server => {
        const stableId = options.identityStore?.migratePath(manager, {sourceId: options.sourceId!, path: server.path});

        if (options.identityStore && !stableId) {
            throw new Error('Stable snapshot requires every site to have a reconciled, unambiguous identity.');
        }

        return metadataFor(server, stableId ?? server.path, profile);
    }).sort((left, right) => compare(left.key, right.key));

    return parseMetadataSnapshot({
        schemaVersion: 1,
        identity: options.identityStore ? 'stable-id' : 'canonical-path',
        ...(options.sourceId === undefined ? {} : {sourceId: options.sourceId}),
        profile,
        complete,
        sites,
    });
}

function invalidSnapshot(): never {
    throw new MetadataSnapshotError('INVALID_SNAPSHOT', 'Invalid or unexpected field in metadata snapshot.');
}

function asObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return invalidSnapshot();
    }

    return value as Record<string, unknown>;
}

function checkKeys(value: Record<string, unknown>, allowed: readonly string[]): void {
    if (Object.keys(value).some(key => !allowed.includes(key))) {
        invalidSnapshot();
    }
}

function parseSite(value: unknown, profile: MetadataProfile, identity: MetadataSnapshot['identity']): MetadataSite {
    const site = asObject(value);

    checkKeys(site, [...stringFields, ...numberFields, ...booleanFields, ...optionalFields]);

    if (
        stringFields.some(field => typeof site[field] !== 'string') ||
        numberFields.some(field => !Number.isSafeInteger(site[field])) ||
        booleanFields.some(field => typeof site[field] !== 'boolean') ||
        optionalFields.some(field => site[field] !== undefined && typeof site[field] !== 'string') ||
        !site.key ||
        !site.path ||
        !site.name ||
        !site.host ||
        !['unset', 'decoded', 'unsupported'].includes(String(site.remoteDirectoryStatus)) ||
        Number(site.port) < 1 ||
        Number(site.port) > 65535 ||
        (identity === 'canonical-path' &&
            site.key !== site.path) ||
            (profile.includeUsernames !== (site.user !== undefined)) ||
            (profile.includeLocalPaths !== (site.keyFile !== undefined && site.localDirectory !== undefined)) ||
            (!profile.includeLocalPaths &&
                (site.keyFile !== undefined ||
                    site.localDirectory !== undefined)) ||
                    (profile.includeComments !== (site.comments !== undefined))
    ) {
        return invalidSnapshot();
    }

    const result: Record<string, unknown> = {};

    for (const field of [...stringFields, ...numberFields, ...booleanFields, ...optionalFields]) {
        if (site[field] !== undefined) {
            result[field] = site[field];
        }
    }

    return Object.freeze(result) as unknown as MetadataSite;
}

/** Validate persisted snapshots before use; unknown fields are rejected rather than retained. */
export function parseMetadataSnapshot(value: unknown): MetadataSnapshot {
    const data = asObject(value);

    if (data.schemaVersion !== 1) {
        throw new MetadataSnapshotError('UNSUPPORTED_SCHEMA', 'Unsupported metadata snapshot version; expected 1.');
    }

    checkKeys(data, [
        'schemaVersion',
        'identity',
        'sourceId',
        'profile',
        'complete',
        'sites',
    ]);

    const profile = asObject(data.profile);

    checkKeys(profile, profileFields);

    if (
        profileFields.some(field => typeof profile[field] !== 'boolean') ||
        !['canonical-path', 'stable-id'].includes(String(data.identity)) ||
        typeof data.complete !== 'boolean' ||
        !Array.isArray(data.sites) ||
        (data.identity === 'stable-id' &&
            (typeof data.sourceId !== 'string' ||
                !data.sourceId)) ||
                (data.identity === 'canonical-path' &&
                    data.sourceId !== undefined)
    ) {
        return invalidSnapshot();
    }

    const safeProfile = Object.freeze({
        includeUsernames: profile.includeUsernames as boolean,
        includeLocalPaths: profile.includeLocalPaths as boolean,
        includeComments: profile.includeComments as boolean,
    });
    const identity = data.identity as MetadataSnapshot['identity'];
    const sites = (data.sites as unknown[]).map(site => parseSite(site, safeProfile, identity))
        .sort((left, right) => compare(left.key, right.key));

    if (
        new Set(sites.map(site => site.key)).size !== sites.length ||
            new Set(sites.map(site => site.path)).size !== sites.length
    ) {
        return invalidSnapshot();
    }

    return Object.freeze({
        schemaVersion: 1,
        identity,
        ...(data.sourceId === undefined ? {} : {sourceId: data.sourceId as string}),
        profile: safeProfile,
        complete: data.complete as boolean,
        sites: Object.freeze(sites),
    });
}

export function diffMetadata(previousValue: unknown, currentValue: unknown): MetadataDiff {
    const previous = parseMetadataSnapshot(previousValue);
    const current = parseMetadataSnapshot(currentValue);

    if (
        previous.identity !== current.identity ||
        previous.sourceId !== current.sourceId ||
        profileFields.some(field => previous.profile[field] !== current.profile[field])
    ) {
        throw new MetadataSnapshotError('PROFILE_MISMATCH', 'Snapshots must use the same identity source and metadata profile.');
    }

    const oldSites = new Map(previous.sites.map(site => [site.key, site]));
    const newSites = new Map(current.sites.map(site => [site.key, site]));
    const changed: {readonly key: string; readonly fields: readonly MetadataFieldChange[]}[] = [];
    const fields = [...stringFields, ...numberFields, ...booleanFields, ...optionalFields]
        .filter((field): field is Exclude<keyof MetadataSite, 'key'> => field !== 'key')
        .sort(compare);

    for (const site of current.sites) {
        const oldSite = oldSites.get(site.key);

        if (!oldSite) {
            continue;
        }

        const changes = fields.filter(field => oldSite[field] !== site[field]).map(field => Object.freeze({
            field,
            before: oldSite[field],
            after: site[field],
        }));

        if (changes.length > 0) {
            changed.push(Object.freeze({key: site.key, fields: Object.freeze(changes)}));
        }
    }

    return Object.freeze({
        schemaVersion: 1,
        uncertain: !previous.complete || !current.complete,
        added: Object.freeze(current.sites.filter(site => !oldSites.has(site.key))),
        removed: Object.freeze(previous.sites.filter(site => !newSites.has(site.key))),
        changed: Object.freeze(changed),
    });
}
