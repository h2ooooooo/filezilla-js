import {randomUUID} from 'node:crypto';
import {Server} from './Server';
import {SiteManager} from './SiteManager';

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

function endpointFor(server: Server): SiteIdentityEndpoint {
    const properties = server.propertiesRaw;

    return Object.freeze({
        host: properties.host.trim().toLowerCase(),
        port: properties.port,
        protocol: properties.protocol,
        user: properties.user ?? '',
    });
}

function endpointKey(endpoint: SiteIdentityEndpoint): string {
    return JSON.stringify([endpoint.host, endpoint.port, endpoint.protocol, endpoint.user]);
}

function validString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && value.length <= 16384;
}

function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError('Invalid site identity data.');
    }

    return value as Record<string, unknown>;
}

function allowKeys(value: Record<string, unknown>, keys: string[]): void {
    if (Object.keys(value).some(key => !keys.includes(key))) {
        throw new TypeError('Unexpected field in site identity data.');
    }
}

function readRecord(value: unknown): SiteIdentityRecord {
    const record = object(value);
    const endpoint = object(record.endpoint);

    allowKeys(record, ['id', 'path', 'endpoint', 'sourceSiteId']);
    allowKeys(endpoint, ['host', 'port', 'protocol', 'user']);

    if (
        !validString(record.id) ||
        !validString(record.path) ||
        (record.sourceSiteId !== undefined &&
            !validString(record.sourceSiteId)) ||
            !validString(endpoint.host) ||
            !endpoint.host.trim() ||
            typeof endpoint.user !== 'string' ||
            !Number.isInteger(endpoint.port) ||
            Number(endpoint.port) < 1 ||
            Number(endpoint.port) > 65535 ||
            !Number.isInteger(endpoint.protocol) ||
            Number(endpoint.protocol) < -1 ||
            Number(endpoint.protocol) > 65535
    ) {
        throw new TypeError('Invalid site identity record.');
    }

    return Object.freeze({
        id: record.id,
        path: record.path,
        endpoint: Object.freeze({
            host: endpoint.host.trim().toLowerCase(),
            port: endpoint.port as number,
            protocol: endpoint.protocol as number,
            user: endpoint.user,
        }),
        ...(record.sourceSiteId === undefined ? {} : {sourceSiteId: record.sourceSiteId as string}),
    });
}

/** Versioned metadata only. The application owns atomic persistence and synchronization. */
export class SiteIdentityStore {
    readonly #sources = new Map<string, readonly SiteIdentityRecord[]>();

    public static fromJSON(value: unknown): SiteIdentityStore {
        const data = object(value);

        if (data.schemaVersion !== 1) {
            throw new TypeError('Unsupported site identity schema version; expected 1.');
        }

        allowKeys(data, ['schemaVersion', 'sources']);

        if (!Array.isArray(data.sources)) {
            throw new TypeError('Invalid site identity sources.');
        }

        const store = new SiteIdentityStore();
        const allIds = new Set<string>();

        for (const value of data.sources) {
            const source = object(value);

            allowKeys(source, ['sourceId', 'sites']);

            if (!validString(source.sourceId) || !Array.isArray(source.sites) || store.#sources.has(source.sourceId)) {
                throw new TypeError('Invalid or duplicate site identity source.');
            }

            const sites = source.sites.map(readRecord);
            const paths = new Set<string>();
            const sourceIds = new Set<string>();

            for (const site of sites) {
                if (
                    allIds.has(site.id) ||
                    paths.has(site.path) ||
                    (site.sourceSiteId !== undefined &&
                        sourceIds.has(site.sourceSiteId))
                ) {
                    throw new TypeError('Duplicate identity, source site ID or canonical path in identity data.');
                }

                allIds.add(site.id);
                paths.add(site.path);

                if (site.sourceSiteId !== undefined) {
                    sourceIds.add(site.sourceSiteId);
                }
            }

            store.#sources.set(source.sourceId, Object.freeze(sites));
        }

        return store;
    }

    public toJSON(): SiteIdentityData {
        const sources = [...this.#sources.entries()]
            .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
            .map(([sourceId, records]) => Object.freeze({
                sourceId,
                sites: Object.freeze([...records].sort((left, right) => left.path < right.path ? -1 : 1)),
            }));

        return Object.freeze({schemaVersion: 1, sources: Object.freeze(sources)});
    }

    public reconcile(manager: SiteManager, options: SiteIdentityReconcileOptions): SiteIdentityReconcileResult {
        if (!validString(options.sourceId)) {
            throw new TypeError('An explicit, non-empty sourceId is required.');
        }

        if (manager.importDiagnostics.some(diagnostic => diagnostic.severity === 'error')) {
            throw new Error('Cannot reconcile an incomplete import; resolve import diagnostics first.');
        }

        const servers = manager.getServers();
        const paths = new Set(servers.map(server => server.path));
        const previous = this.#sources.get(options.sourceId) ?? [];
        const previousById = new Map(previous.map(site => [site.id, site]));
        const previousByPath = new Map(previous.map(site => [site.path, site]));
        const previousBySourceId = new Map(previous.filter(site => site.sourceSiteId !== undefined)
            .map(site => [site.sourceSiteId!, site]));
        const previousByEndpoint = new Map<string, SiteIdentityRecord[]>();

        for (const site of previous) {
            const key = endpointKey(site.endpoint);
            const group = previousByEndpoint.get(key) ?? [];

            group.push(site);
            previousByEndpoint.set(key, group);
        }

        if (paths.size !== servers.length) {
            throw new Error('Cannot reconcile duplicate canonical paths.');
        }

        this.validateOptions(paths, previousById, options);

        const currentKeys = servers.map(server => endpointKey(endpointFor(server)));
        const currentEndpointCounts = new Map<string, number>();
        const proposed: SiteIdentityRecord[] = [];
        const conflicts: SiteIdentityConflict[] = [];

        for (const key of currentKeys) {
            currentEndpointCounts.set(key, (currentEndpointCounts.get(key) ?? 0) + 1);
        }

        for (const [index, server] of servers.entries()) {
            const path = server.path;
            const endpoint = endpointFor(server);
            const key = currentKeys[index];
            const sourceSiteId = Object.prototype.hasOwnProperty.call(options.sourceSiteIds ?? {}, path) ?
                options.sourceSiteIds![path] :
                undefined;
            const atPath = previousByPath.get(path);
            const candidates = previousByEndpoint.get(key) ?? [];
            let match: SiteIdentityRecord | undefined;
            let conflict: SiteIdentityConflict['code'] | undefined;

            if (Object.prototype.hasOwnProperty.call(options.resolutions ?? {}, path)) {
                const resolvedId = options.resolutions![path];

                match = resolvedId === null ? undefined : previousById.get(resolvedId);
            } else if (sourceSiteId !== undefined) {
                match = previousBySourceId.get(sourceSiteId);

                if (!match && atPath) {
                    conflict = 'SOURCE_ID_CHANGED';
                }
            } else if (atPath) {
                if (atPath.sourceSiteId !== undefined) {
                    conflict = 'SOURCE_ID_CHANGED';
                } else if (endpointKey(atPath.endpoint) !== key) {
                    conflict = 'ENDPOINT_CHANGED';
                } else {
                    match = atPath;
                }
            } else if (candidates.length === 1 && currentEndpointCounts.get(key) === 1) {
                if (candidates[0].sourceSiteId !== undefined) {
                    conflict = 'SOURCE_ID_CHANGED';
                } else {
                    match = candidates[0];
                }
            } else if (candidates.length > 0 || currentEndpointCounts.get(key)! > 1) {
                conflict = 'AMBIGUOUS_IDENTITY';
            }

            if (conflict) {
                const candidateIds = [...new Set([...candidates, ...(atPath ? [atPath] : [])].map(site => site.id))];

                conflicts.push(Object.freeze({code: conflict, path, candidateIds: Object.freeze(candidateIds)}));

                continue;
            }

            proposed.push(Object.freeze({
                id: match?.id ?? randomUUID(),
                path,
                endpoint,
                ...(sourceSiteId === undefined ? {} : {sourceSiteId}),
            }));
        }

        const proposedIdCounts = new Map<string, number>();

        for (const site of proposed) {
            proposedIdCounts.set(site.id, (proposedIdCounts.get(site.id) ?? 0) + 1);
        }

        const reusedIds = new Set(proposed.filter(site => proposedIdCounts.get(site.id)! > 1).map(site => site.id));

        for (const site of proposed.filter(site => reusedIds.has(site.id))) {
            conflicts.push(Object.freeze({
                code: 'AMBIGUOUS_IDENTITY',
                path: site.path,
                candidateIds: Object.freeze([site.id]),
            }));
        }

        const sites = Object.freeze(proposed.filter(site => !reusedIds.has(site.id)));
        const committed = conflicts.length === 0;

        if (committed) {
            this.#sources.set(options.sourceId, sites);
        }

        return Object.freeze({committed, sites, conflicts: Object.freeze(conflicts)});
    }

    /** Resolve only after reconciliation; changed endpoints and ambiguous current paths never match. */
    public resolve(manager: SiteManager, selection: {sourceId: string; id: string}): Server | null {
        if (manager.importDiagnostics.some(diagnostic => diagnostic.severity === 'error')) {
            return null;
        }

        const record = this.#sources.get(selection.sourceId)?.find(site => site.id === selection.id);

        if (!record) {
            return null;
        }

        const matches = manager.getServers().filter(server => server.path === record.path);

        return matches.length === 1 && endpointKey(endpointFor(matches[0])) === endpointKey(record.endpoint) ?
            matches[0] :
            null;
    }

    /** Migrate an existing saved canonical path only when it resolves uniquely in this import. */
    public migratePath(manager: SiteManager, selection: {sourceId: string; path: string}): string | null {
        const record = this.#sources.get(selection.sourceId)?.find(site => site.path === selection.path);

        if (!record || !this.resolve(manager, {sourceId: selection.sourceId, id: record.id})) {
            return null;
        }

        return record.id;
    }

    private validateOptions(
        paths: Set<string>,
        previousById: Map<string, SiteIdentityRecord>,
        options: SiteIdentityReconcileOptions,
    ): void {
        const sourceIds = new Set<string>();

        for (const [path, value] of Object.entries(options.sourceSiteIds ?? {})) {
            if (!paths.has(path) || !validString(value) || sourceIds.has(value)) {
                throw new TypeError('Source site IDs must be unique, non-empty and reference current canonical paths.');
            }

            sourceIds.add(value);
        }

        for (const [path, value] of Object.entries(options.resolutions ?? {})) {
            if (!paths.has(path) || (value !== null && !previousById.has(value))) {
                throw new TypeError('Identity resolutions must reference a current path and an existing source ID, or null.');
            }
        }
    }
}
