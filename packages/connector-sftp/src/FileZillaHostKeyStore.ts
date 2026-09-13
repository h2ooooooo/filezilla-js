import {open} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {XMLParser, XMLValidator} from 'fast-xml-parser';
import {ConnectorError} from '@jalsoedesign/filezilla-connector-abstract';
import type {SftpHostKeyChallenge} from './SftpConnector.js';

const MAX_FILE_BYTES = 1024 * 1024;

function invalidStore(): ConnectorError {
    return new ConnectorError('Invalid FileZilla host-key store: expected a valid modern hostkeys.xml file');
}

function record(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function allowedFields(value: Record<string, unknown>, fields: string[]): boolean {
    return Object.entries(value).every(([key, entry]) =>
        fields.includes(key) || (key === '#text' && typeof entry === 'string' && entry.trim() === ''),
    );
}

function normalizedHost(host: string): string {
    if (
        typeof host !== 'string' ||
        host.length === 0 ||
        host.length > 1024 ||
        /[\s<>"'&]/u.test(host) ||
        [...host].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    ) {
        throw invalidStore();
    }

    return host.toLowerCase();
}

function entryId(host: string, port: number): string {
    return JSON.stringify([normalizedHost(host), port]);
}

function fingerprint(key: Buffer): string {
    return `SHA256:${createHash('sha256').update(key).digest('base64').replace(/=+$/, '')}`;
}

/**
 * Read-only snapshot of modern FileZilla hostkeys.xml, loaded from an explicit path.
 * This imports exact host-key pins only; it never adopts weaker algorithm policy.
 */
export class FileZillaHostKeyStore {
    private constructor(private readonly entries: Map<string, Buffer[]>) {}

    static async fromFile(filename: string): Promise<FileZillaHostKeyStore> {
        const file = await open(filename, 'r');
        let xml: string;

        try {
            const info = await file.stat();

            if (!info.isFile() || info.size > MAX_FILE_BYTES) {
                throw new ConnectorError('FileZilla host-key store must be a regular file no larger than 1 MiB');
            }

            // Read at most the limit plus one byte, including if a file grows after stat.
            const bytes = Buffer.alloc(MAX_FILE_BYTES + 1);
            let length = 0;

            while (length <= MAX_FILE_BYTES) {
                const read = await file.read(bytes, length, bytes.length - length, null);

                if (read.bytesRead === 0) {
                    break;
                }

                length += read.bytesRead;
            }

            if (length > MAX_FILE_BYTES) {
                throw new ConnectorError('FileZilla host-key store must be no larger than 1 MiB');
            }

            try {
                xml = new TextDecoder('utf-8', {fatal: true}).decode(bytes.subarray(0, length));
            } catch {
                throw invalidStore();
            }
        } finally {
            await file.close();
        }

        if (/<!\s*(?:DOCTYPE|ENTITY)\b/iu.test(xml) || XMLValidator.validate(xml) !== true) {
            throw invalidStore();
        }

        let document: unknown;

        try {
            document = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '@_',
                ignoreDeclaration: true,
                trimValues: false,
                parseTagValue: false,
                parseAttributeValue: false,
                processEntities: false,
                isArray: (_name, xmlPath) => xmlPath === 'FileZilla3.Server' || xmlPath === 'FileZilla3.Server.Hostkey',
            }).parse(xml);
        } catch {
            throw invalidStore();
        }

        if (
            !record(document) ||
            Object.keys(document).length !== 1 ||
            !Object.prototype.hasOwnProperty.call(document, 'FileZilla3')
        ) {
            throw invalidStore();
        }

        const root = document.FileZilla3;
        const entries = new Map<string, Buffer[]>();

        if (root === '' || (typeof root === 'string' && root.trim() === '')) {
            return new FileZillaHostKeyStore(entries);
        }

        if (!record(root) || !allowedFields(root, ['Server', '@_version', '@_platform'])) {
            throw invalidStore();
        }

        if (root.Server === undefined) {
            return new FileZillaHostKeyStore(entries);
        }

        if (!Array.isArray(root.Server)) {
            throw invalidStore();
        }

        for (const server of root.Server) {
            if (
                !record(server) ||
                !allowedFields(server, ['@_Host', '@_Port', 'Hostkey', 'AllowedInsecureAlgorithms']) ||
                typeof server['@_Host'] !== 'string' ||
                typeof server['@_Port'] !== 'string' ||
                !/^[0-9]{1,5}$/.test(server['@_Port']) ||
                !Array.isArray(server.Hostkey) ||
                server.Hostkey.length === 0 ||
                (server.AllowedInsecureAlgorithms !== undefined &&
                    typeof server.AllowedInsecureAlgorithms !== 'string')
            ) {
                throw invalidStore();
            }

            const port = Number(server['@_Port']);

            if (port < 1 || port > 65535) {
                throw invalidStore();
            }

            const id = entryId(server['@_Host'], port);

            if (entries.has(id)) {
                throw invalidStore();
            }

            const keys: Buffer[] = [];

            for (const value of server.Hostkey) {
                if (typeof value !== 'string') {
                    throw invalidStore();
                }

                const encoded = value.trim();

                if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
                    throw invalidStore();
                }

                const key = Buffer.from(encoded, 'base64');

                if (key.length < 5 || key.toString('base64') !== encoded) {
                    throw invalidStore();
                }

                const algorithmLength = key.readUInt32BE(0);

                if (
                    algorithmLength < 1 ||
                    algorithmLength > 255 ||
                    algorithmLength >= key.length - 4 ||
                    !key.subarray(4, 4 + algorithmLength).every((byte) => byte < 128) ||
                    !/^[A-Za-z0-9@._+-]+$/.test(key.subarray(4, 4 + algorithmLength).toString('ascii'))
                ) {
                    throw invalidStore();
                }

                keys.push(key);
            }

            entries.set(id, keys);
        }

        return new FileZillaHostKeyStore(entries);
    }

    /** Bound callback: safe to pass directly as connector hasTrustPolicy. */
    readonly hasTrustPolicy = (challenge: SftpHostKeyChallenge): boolean => {
        if (!Buffer.isBuffer(challenge.publicKey)) {
            return false;
        }

        const keys = this.entries.get(entryId(challenge.host, challenge.port));

        return keys?.some((key) => key.equals(challenge.publicKey)) ?? false;
    };

    getKnownFingerprints(host: string, port: number): string[] {
        return (this.entries.get(entryId(host, port)) ?? []).map(fingerprint);
    }
}
