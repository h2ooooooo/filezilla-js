import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {mkdtemp, writeFile, readFile, rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ConnectorError} from '@jalsoedesign/filezilla-connector-abstract';
import {FileZillaHostKeyStore} from '../src/FileZillaHostKeyStore.js';
import type {SftpHostKeyChallenge} from '../src/SftpConnector.js';

let directory: string;
let filename: string;
const key = (value: number) => {
    const algorithm = Buffer.from('ssh-ed25519');
    const algorithmLength = Buffer.alloc(4);

    algorithmLength.writeUInt32BE(algorithm.length);

    const publicKeyLength = Buffer.alloc(4);

    publicKeyLength.writeUInt32BE(32);

    return Buffer.concat([algorithmLength, algorithm, publicKeyLength, Buffer.alloc(32, value)]);
};
const keyOne = key(1);
const keyTwo = key(2);
const fingerprint = (bytes: Buffer) => `SHA256:${createHash('sha256').update(bytes).digest('base64').replace(/=+$/, '')}`;
const challenge = (overrides: Partial<SftpHostKeyChallenge> = {}): SftpHostKeyChallenge => ({
    host: 'example.test',
    port: 22,
    keyType: 'ssh-ed25519',
    fingerprint: fingerprint(keyOne),
    publicKey: keyOne,
    changed: false,
    abortSignal: new AbortController().signal,
    ...overrides,
});
const server = (host = 'example.test', port = '22', keys = [keyOne]) =>
    `<Server Host="${host}" Port="${port}">${keys.map((value) => `<Hostkey>${value.toString('base64')}</Hostkey>`).join('')}</Server>`;
const document = (body: string) => `<?xml version="1.0" encoding="UTF-8"?>\n<FileZilla3 version="3.71.0" platform="windows">\n${body}\n</FileZilla3>`;
const load = async (xml: string | Buffer) => {
    await writeFile(filename, xml);

    return FileZillaHostKeyStore.fromFile(filename);
};

beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'filezilla-hostkeys-'));
    filename = path.join(directory, 'hostkeys.xml');
});
afterEach(async () => {
    await rm(directory, {recursive: true, force: true});
});

describe('explicit read-only FileZilla host-key snapshots', () => {
    it('matches an exact remembered key by case-folded host, port and raw SSH public key', async () => {
        const xml = document(server('EXAMPLE.TEST'));
        const store = await load(xml);
        const hasTrustPolicy = store.hasTrustPolicy;

        expect(hasTrustPolicy(challenge())).toBe(true);
        expect(hasTrustPolicy(challenge({host: 'different.test'}))).toBe(false);
        expect(hasTrustPolicy(challenge({host: 'example.test.'}))).toBe(false);
        expect(hasTrustPolicy(challenge({port: 2222}))).toBe(false);
        expect(hasTrustPolicy(challenge({publicKey: keyTwo, fingerprint: fingerprint(keyOne)}))).toBe(false);
        expect(await readFile(filename, 'utf8')).toBe(xml);
    });

    it('supports multiple pins and independent hosts while returning fresh fingerprint arrays', async () => {
        const store = await load(document(server('example.test', '22', [keyOne, keyTwo]) + server('other.test', '2222', [keyTwo])));

        expect(store.hasTrustPolicy(challenge({publicKey: keyTwo}))).toBe(true);
        expect(store.hasTrustPolicy(challenge({host: 'other.test', port: 2222, publicKey: keyTwo}))).toBe(true);

        const known = store.getKnownFingerprints('example.test', 22);

        expect(known).toEqual([fingerprint(keyOne), fingerprint(keyTwo)]);
        known.splice(0);
        expect(store.getKnownFingerprints('example.test', 22)).toHaveLength(2);
    });

    it('takes a snapshot and does not write or re-read the source during lookups', async () => {
        const store = await load(document(server()));

        await writeFile(filename, document(server('example.test', '22', [keyTwo])));
        expect(store.hasTrustPolicy(challenge())).toBe(true);
        expect(store.hasTrustPolicy(challenge({publicKey: keyTwo}))).toBe(false);
        expect(await readFile(filename, 'utf8')).toContain(keyTwo.toString('base64'));
    });

    it('allows an empty store and ignores insecure-algorithm exemptions', async () => {
        const empty = await load('<FileZilla3/>');

        expect(empty.hasTrustPolicy(challenge())).toBe(false);

        const withPolicy = server().replace('</Server>', '<AllowedInsecureAlgorithms>ssh-rsa,aes128-cbc</AllowedInsecureAlgorithms></Server>');
        const store = await load(document(withPolicy));

        expect(store.hasTrustPolicy(challenge())).toBe(true);
        expect(Object.keys(store)).not.toContain('allowedInsecureAlgorithms');
    });

    it.each([
        '<FileZilla3>',
        '<WrongRoot/>',
        '<FileZilla3/><FileZilla3/>',
        '<!DOCTYPE FileZilla3 [<!ENTITY key "unexpected">]><FileZilla3/>',
        '<!ENTITY bad SYSTEM "file:///not-read"><FileZilla3/>',
        document('<Server Host="example.test" Port="22"/>'),
        document(server('', '22')),
        document(server(' example.test', '22')),
        document(server('example.test', '0')),
        document(server('example.test', '65536')),
        document(server('example.test', '22bad')),
        document(server('example.test', '-22')),
        document(server().replace('<Hostkey>', '<Hostkey Extra="true">')),
        document(server().replace(keyOne.toString('base64'), '!!!!')),
        document(server().replace(keyOne.toString('base64'), 'AAAA')),
        document(server().replace(keyOne.toString('base64'), keyOne.toString('base64') + '\nAAAA')),
        document(server() + server('EXAMPLE.TEST')),
        document(server().replace('</Server>', '<Unexpected>true</Unexpected></Server>')),
    ])('rejects malformed or ambiguous trust input: %s', async (xml) => {
        await expect(load(xml)).rejects.toBeInstanceOf(ConnectorError);
    });

    it('rejects noncanonical base64 and invalid UTF-8', async () => {
        const encoded = keyOne.toString('base64');
        const noncanonical = encoded.slice(0, -2) + 'B=';

        await expect(load(document(server().replace(encoded, noncanonical)))).rejects.toBeInstanceOf(ConnectorError);
        await expect(load(Buffer.from([0xff, 0xfe, 0xfd]))).rejects.toBeInstanceOf(ConnectorError);
    });

    it('enforces the 1 MiB limit before parsing the input', async () => {
        await expect(load(Buffer.alloc(1024 * 1024 + 1, 32))).rejects.toThrow('1 MiB');
    });
});
