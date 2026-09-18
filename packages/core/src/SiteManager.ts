import * as fs from 'fs';
import {XMLParser, XMLValidator} from 'fast-xml-parser';
import {Server, ServerProperties} from './Server';
import {XmlConfig} from './types/XmlConfigTypes';
import {ServerFolderNode, ServerTree} from './types/ServerTreeTypes';

export function getDefaultSiteManager(): SiteManager {
    const lookupPaths = [
        process.env.APPDATA && `${process.env.APPDATA}/FileZilla/sitemanager.xml`,
        `${process.env.XDG_CONFIG_HOME || `${process.env.HOME}/.config`}/filezilla/sitemanager.xml`,
        `${process.env.HOME}/.filezilla/sitemanager.xml`,
    ].filter(Boolean) as string[];

    for (const lookupPath of lookupPaths) {
        if (fs.existsSync(lookupPath)) {
            return getSiteManager(lookupPath);
        }
    }

    throw new Error('Could not find default sitemanager.xml');
}

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
export function readSiteManagerReport(
    xmlPath: string,
    options: SiteManagerReadOptions = {},
): SiteManagerImportReport {
    const manager = getSiteManager(xmlPath, {
        ...options,
        includePasswords: options.includePasswords === true,
        inspectRemoteDirectories: options.inspectRemoteDirectories ?? true,
    });

    return Object.freeze({
        manager,
        diagnostics: manager.importDiagnostics,
        complete: !manager.importDiagnostics.some(diagnostic => diagnostic.severity === 'error'),
        acceptedCount: manager.getServers().length,
        rejectedCount: manager.rejectedCount,
    });
}

export function getSiteManager(xmlPath: string, options: SiteManagerReadOptions = {}): SiteManager {
    if (!fs.existsSync(xmlPath)) {
        throw new Error(`Could not find sitemanager.xml at ${xmlPath}`);
    }

    const xmlContents = fs.readFileSync(xmlPath, 'utf8');

    if (/<!DOCTYPE|<!ENTITY/i.test(xmlContents)) {
        throw new Error('DTD and entity declarations are not supported in Site Manager settings.');
    }

    const validation = XMLValidator.validate(xmlContents);

    if (validation !== true) {
        // Parser diagnostics can contain input text, so expose location only.
        throw new Error(`Invalid sitemanager.xml: malformed XML at line ${validation.err.line}, column ${validation.err.col}`);
    }

    const xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseTagValue: false,
        parseAttributeValue: false,
        trimValues: false,
        isArray: (name) => ['Server', 'Folder'].includes(name),
    });

    return new SiteManager(xmlParser.parse(xmlContents), options);
}

type XmlRecord = Record<string, unknown>;
type PendingServer = {
    config: XmlRecord;
    name: string;
    path: string;
    sourcePath: string;
};

class InvalidSiteFieldError extends Error {
    constructor(context: string, public readonly field: string) {
        super(`Invalid sitemanager.xml: ${context} field ${field}`);
    }
}

function invalid(context: string, field: string): never {
    throw new InvalidSiteFieldError(context, field);
}

function record(value: unknown, context: string, field: string): XmlRecord {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return invalid(context, field);
    }

    return value as XmlRecord;
}

function collection(value: unknown): unknown[] {
    if (value === undefined) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
}

function scalar(value: unknown, context: string, field: string): string | number | boolean | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === 'object') {
        const encoded = record(value, context, field);
        const text = encoded['#text'] ?? (Object.keys(encoded).every(key => key.startsWith('@_')) ? '' : undefined);
        const encoding = encoded['@_encoding'] ?? 'plain';

        if (typeof text !== 'string' || typeof encoding !== 'string') {
            return invalid(context, field);
        }

        if (encoding === 'base64') {
            const base64 = text.trim();

            if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
                return invalid(context, field);
            }

            return Buffer.from(base64, 'base64').toString('utf8');
        }

        if (encoding !== 'plain' && encoding !== '') {
            return invalid(context, field);
        }

        return text;
    }

    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        return invalid(context, field);
    }

    return value;
}

function text(config: XmlRecord, field: string, context: string, required = false, trim = false): string | undefined {
    const value = scalar(config[field], context, field);

    if (value === undefined && !required) {
        return undefined;
    }

    if (typeof value !== 'string') {
        return invalid(context, field);
    }

    const result = trim ? value.trim() : value;

    if (required && !result) {
        return invalid(context, field);
    }

    return result;
}

function integer(
    config: XmlRecord,
    field: string,
    context: string,
    min: number,
    max: number,
    fallback?: number,
    aliases: Record<string, number> = {},
): number {
    const value = scalar(config[field], context, field);

    if (value === undefined && fallback !== undefined) {
        return fallback;
    }

    const normalized = typeof value === 'string' ? value.trim() : value;

    if (typeof normalized === 'string' && Object.prototype.hasOwnProperty.call(aliases, normalized)) {
        return aliases[normalized];
    }

    if (
        (typeof normalized !== 'number' &&
            typeof normalized !== 'string') ||
            (typeof normalized === 'string' &&
                !/^-?\d+$/.test(normalized))
    ) {
        return invalid(context, field);
    }

    const result = Number(normalized);

    if (!Number.isSafeInteger(result) || result < min || result > max) {
        return invalid(context, field);
    }

    return result;
}

function flag(config: XmlRecord, field: string, context: string): boolean {
    const value = scalar(config[field], context, field);

    if (value === undefined) {
        return false;
    }

    const normalized = typeof value === 'string' ? value.trim() : value;

    if (normalized === true || normalized === 1 || normalized === '1') {
        return true;
    }

    if (normalized === false || normalized === 0 || normalized === '0') {
        return false;
    }

    return invalid(context, field);
}

function encodePathComponent(component: string): string {
    return component.replace(/%/g, '%25').replace(/\//g, '%2F');
}

function decodePathComponent(component: string): string {
    return component.replace(/%(?:25|2f)/gi, value => value.toLowerCase() === '%2f' ? '/' : '%');
}

export class SiteManager {
    readonly #servers: Server[];

    readonly #diagnostics: SiteImportDiagnostic[] = [];

    #rejectedCount = 0;

    constructor(xml: XmlConfig, options: SiteManagerReadOptions = {}) {
        if (!xml || !xml.FileZilla3) {
            throw new Error('Invalid sitemanager.xml format: missing FileZilla3 root element');
        }

        const root = record(xml.FileZilla3, 'root', 'FileZilla3');
        const pending: PendingServer[] = [];

        if (options.mode !== undefined && options.mode !== 'strict' && options.mode !== 'tolerant') {
            throw new TypeError('Site Manager import mode must be strict or tolerant.');
        }

        if (root.Servers !== '') {
            this.collectServers(record(root.Servers, 'root', 'Servers'), [], pending, options, '/FileZilla3/Servers');
        }

        // Validate every identity before decoding any selected credential.
        const counts = new Map<string, number>();

        for (const item of pending) {
            counts.set(item.path, (counts.get(item.path) ?? 0) + 1);
        }

        const duplicate = pending.find(item => counts.get(item.path)! > 1);

        if (duplicate && options.mode !== 'tolerant') {
            throw new Error(`Invalid sitemanager.xml: duplicate site path ${duplicate.path}`);
        }

        this.#servers = [];

        for (const item of pending) {
            if (counts.get(item.path)! > 1) {
                this.#rejectedCount++;
                this.addDiagnostic('DUPLICATE_SITE_PATH', item.sourcePath, 'Ambiguous site path; every duplicate was excluded.');

                continue;
            }

            try {
                const server = this.createServer(item, options);

                this.#servers.push(server);

                if (options.inspectRemoteDirectories) {
                    this.inspectRemoteDirectory(server, item.sourcePath);
                }
            } catch (error) {
                this.rejectRecord(error, options, item.sourcePath, 'INVALID_SITE');
                this.#rejectedCount++;
            }
        }
    }

    public get importDiagnostics(): readonly SiteImportDiagnostic[] {
        return Object.freeze([...this.#diagnostics]);
    }

    public get rejectedCount(): number {
        return this.#rejectedCount;
    }

    public getServers(): Server[] {
        return this.#servers;
    }

    public toJSON(): {servers: ReturnType<Server['toJSON']>[]} {
        return {servers: this.#servers.map(server => server.toJSON())};
    }

    public getServerByPath(path: string): Server | null {
        return this.#servers.find(server => server.path === path) ?? null;
    }

    public searchServers(term: string, options: {fields?: 'name' | 'all'} = {}): Server[] {
        const lowerTerm = term.toLowerCase();

        return this.#servers.filter(server => {
            const values: unknown[] = [server.path, server.propertiesRaw.name];

            if (options.fields === 'all') {
                values.push(server.siteProtocolName, ...Object.values(server.propertiesRaw));

                try {
                    values.push(server.getRemoteDirectory());
                } catch {
                    // Unsupported paths remain searchable in their original encoded form.
                }
            }

            return values.some(value => value !== undefined && String(value).toLowerCase().includes(lowerTerm));
        });
    }

    public getServersTree(servers: Server[] = this.#servers): ServerTree {
        const root: ServerTree = {name: 'Root', folders: [], servers: []};

        for (const server of servers) {
            const parts = server.path.split('/').slice(0, -1).map(decodePathComponent);
            let currentFolder: ServerFolderNode = root;

            for (const part of parts) {
                let folder = currentFolder.folders.find(item => item.name === part);

                if (!folder) {
                    folder = {name: part, folders: [], servers: []};
                    currentFolder.folders.push(folder);
                }

                currentFolder = folder;
            }

            currentFolder.servers.push(server);
        }

        return root;
    }

    private collectServers(
        folder: XmlRecord,
        parent: string[],
        pending: PendingServer[],
        options: SiteManagerReadOptions,
        sourcePath: string,
    ): void {
        for (const [index, value] of collection(folder.Server).entries()) {
            const siteLocation = `${sourcePath}/Server[${index + 1}]`;

            try {
                const config = record(value, 'folder', 'Server');
                const context = `site ${pending.length + 1}`;
                const name = text(config, 'Name', context, true, true)!;
                const path = [...parent, name].map(encodePathComponent).join('/');

                pending.push({
                    config,
                    name,
                    path,
                    sourcePath: siteLocation,
                });
            } catch (error) {
                this.rejectRecord(error, options, siteLocation, 'INVALID_SITE');
                this.#rejectedCount++;
            }
        }

        for (const [index, value] of collection(folder.Folder).entries()) {
            const folderLocation = `${sourcePath}/Folder[${index + 1}]`;
            let child: XmlRecord;
            let name: string;

            try {
                child = record(value, 'folder', 'Folder');
                name = text(child, '#text', 'folder', true, true)!;
            } catch (error) {
                this.rejectRecord(error, options, folderLocation, 'INVALID_FOLDER');
                this.#rejectedCount += countRejectedSites(value);

                continue;
            }

            this.collectServers(child, [...parent, name], pending, options, folderLocation);
        }
    }

    private rejectRecord(
        error: unknown,
        options: SiteManagerReadOptions,
        sourcePath: string,
        code: 'INVALID_SITE' | 'INVALID_FOLDER',
    ): void {
        if (options.mode !== 'tolerant' || !(error instanceof InvalidSiteFieldError)) {
            throw error;
        }

        this.addDiagnostic(code, sourcePath, 'Invalid record field; the record was excluded.', error.field);
    }

    private addDiagnostic(
        code: SiteImportDiagnostic['code'],
        sourcePath: string,
        message: string,
        field?: string,
    ): void {
        this.#diagnostics.push(Object.freeze({
            code,
            severity: 'error',
            sourcePath,
            message,
            field,
        }));
    }

    private inspectRemoteDirectory(server: Server, sourcePath: string): void {
        try {
            server.getRemoteDirectory();
        } catch {
            this.#diagnostics.push(Object.freeze({
                code: 'REMOTE_DIRECTORY_UNAVAILABLE',
                severity: 'warning',
                sourcePath,
                field: 'RemoteDir',
                message: 'Remote directory cannot be decoded; site metadata remains available.',
            }));
        }
    }

    private createServer(item: PendingServer, options: SiteManagerReadOptions): Server {
        const {config, name, path} = item;
        const context = `site ${path}`;
        const passwordValue = config.Pass;
        let passwordEncoding = 'plain';

        if (passwordValue !== undefined && typeof passwordValue === 'object') {
            const encoded = record(passwordValue, context, 'Pass');

            if (encoded['@_encoding'] !== undefined && typeof encoded['@_encoding'] !== 'string') {
                return invalid(context, 'Pass');
            }

            passwordEncoding = (encoded['@_encoding'] as string | undefined) ?? 'plain';
        }

        let password: string | undefined;

        if (
            options.includePasswords !== false &&
            (options.credentialPath === undefined ||
                options.credentialPath === path) &&
                ['plain', 'base64'].includes(passwordEncoding)
        ) {
            password = text(config, 'Pass', context);
        }

        const properties: ServerProperties = {
            host: text(config, 'Host', context, true, true)!,
            port: integer(config, 'Port', context, 1, 65535),
            protocol: integer(config, 'Protocol', context, -1, 65535),
            type: integer(config, 'Type', context, 0, 10, 0),
            user: text(config, 'User', context) as string,
            password,
            passwordEncoding,
            keyFile: text(config, 'Keyfile', context),
            logonType: integer(config, 'Logontype', context, 0, 7, 0),
            timezoneOffset: integer(config, 'TimezoneOffset', context, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 0),
            passiveMode: integer(config, 'PasvMode', context, 0, 2, 0, {MODE_DEFAULT: 0, MODE_ACTIVE: 1, MODE_PASSIVE: 2}),
            maximumMultipleConnections: integer(config, 'MaximumMultipleConnections', context, 0, Number.MAX_SAFE_INTEGER, 0),
            encodingType: integer(config, 'EncodingType', context, 0, 2, 2, {Auto: 2, 'UTF-8': 0, Custom: 1}),
            customEncoding: text(config, 'CustomEncoding', context),
            bypassProxy: flag(config, 'BypassProxy', context),
            name,
            comments: text(config, 'Comments', context),
            localDirectory: text(config, 'LocalDir', context),
            remoteDirectory: text(config, 'RemoteDir', context),
            synchronizedBrowsing: flag(config, 'SyncBrowsing', context),
            directoryComparison: flag(config, 'DirectoryComparison', context),
        };

        return new Server(properties, path);
    }
}

function countRejectedSites(value: unknown): number {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return 0;
    }

    const folder = value as XmlRecord;

    return collection(folder.Server).length + collection(folder.Folder).reduce<number>(
        (total, child) => total + countRejectedSites(child),
        0,
    );
}
