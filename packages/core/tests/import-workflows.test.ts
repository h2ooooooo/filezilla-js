import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {
    createMetadataSnapshot,
    diffMetadata,
    getSiteManager,
    MetadataSnapshotError,
    parseMetadataSnapshot,
    readSiteManagerReport,
    SiteIdentityStore,
    SiteManager,
} from '../src';

let directory: string;

beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'filezilla-import-workflows-'));
});

afterEach(() => {
    rmSync(directory, {recursive: true, force: true});
});

function site(name = 'Work', host = 'example.invalid', extra = ''): string {
    return `<Server><Name>${name}</Name><Host>${host}</Host><Port>22</Port><Protocol>1</Protocol>${extra}</Server>`;
}

function file(body: string): string {
    const path = join(directory, `${randomUUID()}.xml`);

    writeFileSync(path, `<FileZilla3><Servers>${body}</Servers></FileZilla3>`);

    return path;
}

function manager(body: string): SiteManager {
    return getSiteManager(file(body));
}

describe('tolerant import reports', () => {
    it('returns independent valid sites and redacted structural diagnostics for invalid records', () => {
        const privateValue = 'synthetic-private-credential';
        const valid = site('Valid', 'example.invalid', `<Pass>${privateValue}</Pass>`);
        const invalid = site('Invalid').replace('<Port>22</Port>', `<Port>${privateValue}</Port>`);
        const source = file(valid + invalid);
        const result = readSiteManagerReport(source, {mode: 'tolerant'});

        expect(result.complete).toBe(false);
        expect(result.acceptedCount).toBe(1);
        expect(result.rejectedCount).toBe(1);
        expect(result.manager.getServers()[0].propertiesRaw.password).toBeUndefined();
        expect(result.diagnostics).toEqual([
            expect.objectContaining({
                code: 'INVALID_SITE',
                field: 'Port',
                severity: 'error',
                sourcePath: '/FileZilla3/Servers/Server[2]',
            }),
        ]);
        expect(JSON.stringify(result)).not.toContain(privateValue);
        expect(() => readSiteManagerReport(source)).toThrow('field Port');
        expect(() => readSiteManagerReport(source, {mode: 'strict'})).toThrow('field Port');
    });

    it('excludes every duplicate canonical path before accessing a credential', () => {
        const duplicated = site('Duplicate', 'example.invalid', '<Pass encoding="base64">broken!credential!</Pass>');
        const result = readSiteManagerReport(file(duplicated + site('Duplicate') + site('Other')), {
            mode: 'tolerant',
            includePasswords: true,
            credentialPath: 'Duplicate',
        });

        expect(result.manager.getServers().map(server => server.path)).toEqual(['Other']);
        expect(result.manager.getServerByPath('Duplicate')).toBeNull();
        expect(result.rejectedCount).toBe(2);
        expect(result.diagnostics.map(diagnostic => diagnostic.code)).toEqual(['DUPLICATE_SITE_PATH', 'DUPLICATE_SITE_PATH']);
    });

    it('validates duplicate paths even when the first record has invalid metadata', () => {
        const bad = site('Duplicate').replace('<Host>example.invalid</Host>', '');
        const result = readSiteManagerReport(file(bad + site('Duplicate')), {mode: 'tolerant'});

        expect(result.acceptedCount).toBe(0);
        expect(result.rejectedCount).toBe(2);
        expect(result.diagnostics.every(diagnostic => diagnostic.code === 'DUPLICATE_SITE_PATH')).toBe(true);
    });

    it('isolates malformed site shapes and invalid folder subtrees', () => {
        const body = '<Server>invalid</Server><Folder>' + site('Hidden') + '</Folder>' +
            '<Folder>Valid' + site('Nested') + '</Folder>';
        const result = readSiteManagerReport(file(body), {mode: 'tolerant'});

        expect(result.manager.getServers().map(server => server.path)).toEqual(['Valid/Nested']);
        expect(result.rejectedCount).toBe(2);
        expect(result.diagnostics.map(diagnostic => diagnostic.code)).toEqual(['INVALID_SITE', 'INVALID_FOLDER']);
        expect(result.diagnostics[1].sourcePath).toBe('/FileZilla3/Servers/Folder[1]');
    });

    it('keeps unsupported remote paths as metadata-only warnings', () => {
        const result = readSiteManagerReport(file(site('Legacy', 'example.invalid', '<RemoteDir>3 0 3 abc</RemoteDir>')));

        expect(result.complete).toBe(true);
        expect(result.rejectedCount).toBe(0);
        expect(result.diagnostics[0]).toMatchObject({code: 'REMOTE_DIRECTORY_UNAVAILABLE', severity: 'warning'});
        expect(() => result.manager.getServers()[0].getRemoteDirectory()).toThrow('Unsupported');
        expect(Object.isFrozen(result.diagnostics[0])).toBe(true);
    });

    it('loads only explicitly requested credentials', () => {
        const source = file(site('First', 'example.invalid', '<Pass>first-secret</Pass>') +
            site('Second', 'example.invalid', '<Pass>second-secret</Pass>'));
        const result = readSiteManagerReport(source, {mode: 'tolerant', includePasswords: true, credentialPath: 'Second'});

        expect(result.manager.getServerByPath('First')!.propertiesRaw.password).toBeUndefined();
        expect(result.manager.getServerByPath('Second')!.propertiesRaw.password).toBe('second-secret');
        expect(JSON.stringify(result)).not.toMatch(/first-secret|second-secret/);
    });

    it.each([
        '<FileZilla3><Servers><Server>',
        '<!DOCTYPE FileZilla3><FileZilla3><Servers /></FileZilla3>',
        '<!DOCTYPE FileZilla3 [<!ENTITY x "secret">]><FileZilla3><Servers /></FileZilla3>',
        '<Other><Servers /></Other>',
        '<FileZilla3><Servers /><Servers /></FileZilla3>',
    ])('keeps document-level failures fatal in tolerant mode', xml => {
        const path = join(directory, 'invalid.xml');

        writeFileSync(path, xml);

        expect(() => readSiteManagerReport(path, {mode: 'tolerant'})).toThrow();
    });
});

describe('stable site identities', () => {
    it('preserves a unique endpoint across a move/rename, persists only allowlisted metadata and migrates paths', () => {
        const store = new SiteIdentityStore();
        const before = manager(site('Old', 'example.invalid', '<User>alice</User><Pass>private-password</Pass><Keyfile>private-key-path</Keyfile>'));
        const first = store.reconcile(before, {sourceId: 'work'});
        const id = first.sites[0].id;

        expect(first.committed).toBe(true);
        expect(store.migratePath(before, {sourceId: 'work', path: 'Old'})).toBe(id);

        const reloaded = SiteIdentityStore.fromJSON(JSON.parse(JSON.stringify(store)));
        const after = manager('<Folder>Moved' + site('Renamed', 'EXAMPLE.invalid', '<User>alice</User>') + '</Folder>');
        const next = reloaded.reconcile(after, {sourceId: 'work'});

        expect(next.sites[0].id).toBe(id);
        expect(next.sites[0].path).toBe('Moved/Renamed');
        expect(reloaded.resolve(after, {sourceId: 'work', id})).toBe(after.getServers()[0]);
        expect(reloaded.migratePath(after, {sourceId: 'work', path: 'Old'})).toBeNull();
        expect(JSON.stringify(reloaded)).not.toMatch(/private-password|private-key-path|password|keyFile/);
        expect(Object.isFrozen(reloaded.toJSON().sources[0].sites[0].endpoint)).toBe(true);
    });

    it('reports clones without guessing and commits only after every conflict is explicitly resolved', () => {
        const store = new SiteIdentityStore();
        const original = manager(site('Old'));
        const id = store.reconcile(original, {sourceId: 'work'}).sites[0].id;
        const saved = JSON.stringify(store);
        const clones = manager(site('Copy A') + site('Copy B'));
        const conflicted = store.reconcile(clones, {sourceId: 'work'});

        expect(conflicted.committed).toBe(false);
        expect(conflicted.conflicts).toHaveLength(2);
        expect(conflicted.sites).toHaveLength(0);
        expect(JSON.stringify(store)).toBe(saved);

        const resolved = store.reconcile(clones, {sourceId: 'work', resolutions: {'Copy A': id, 'Copy B': null}});

        expect(resolved.committed).toBe(true);
        expect(resolved.sites[0].id).toBe(id);
        expect(resolved.sites[1].id).not.toBe(id);
    });

    it('does not redirect a saved identity when its endpoint changes at the same path', () => {
        const store = new SiteIdentityStore();
        const initial = manager(site());
        const id = store.reconcile(initial, {sourceId: 'work'}).sites[0].id;
        const changed = manager(site('Work', 'different.invalid'));

        expect(store.resolve(changed, {sourceId: 'work', id})).toBeNull();
        expect(store.migratePath(changed, {sourceId: 'work', path: 'Work'})).toBeNull();
        expect(store.reconcile(changed, {sourceId: 'work'}).conflicts[0].code).toBe('ENDPOINT_CHANGED');
        expect(store.reconcile(changed, {sourceId: 'work', resolutions: {Work: id}}).committed).toBe(true);
        expect(store.resolve(changed, {sourceId: 'work', id})).toBe(changed.getServers()[0]);
    });

    it('supports authoritative source IDs and rejects accidental loss or replacement of that authority', () => {
        const store = new SiteIdentityStore();
        const first = store.reconcile(manager(site()), {sourceId: 'work', sourceSiteIds: {Work: 'source-42'}});
        const after = manager(site('Moved', 'new.invalid'));
        const second = store.reconcile(after, {sourceId: 'work', sourceSiteIds: {Moved: 'source-42'}});

        expect(second.sites[0].id).toBe(first.sites[0].id);
        expect(store.reconcile(after, {sourceId: 'work'}).conflicts[0].code).toBe('SOURCE_ID_CHANGED');
        expect(store.reconcile(after, {sourceId: 'work', sourceSiteIds: {Moved: 'another'}}).conflicts[0].code)
            .toBe('SOURCE_ID_CHANGED');
    });

    it('isolates source namespaces and handles inherited object-property names as ordinary paths', () => {
        const store = new SiteIdentityStore();
        const current = manager(site('constructor'));
        const first = store.reconcile(current, {sourceId: 'first', sourceSiteIds: {}});
        const second = store.reconcile(current, {sourceId: 'second', sourceSiteIds: {}});

        expect(first.sites[0].sourceSiteId).toBeUndefined();
        expect(first.sites[0].id).not.toBe(second.sites[0].id);
        expect(store.resolve(current, {sourceId: 'second', id: first.sites[0].id})).toBeNull();
    });

    it('refuses incomplete imports, duplicate resolutions and unknown persisted schema/fields', () => {
        const store = new SiteIdentityStore();
        const partial = readSiteManagerReport(file(site() + '<Server />'), {mode: 'tolerant'}).manager;

        expect(() => store.reconcile(partial, {sourceId: 'work'})).toThrow('incomplete');
        expect(() => SiteIdentityStore.fromJSON({schemaVersion: 2, sources: []})).toThrow('version');
        expect(() => SiteIdentityStore.fromJSON({schemaVersion: 1, sources: [], password: 'private'})).toThrow('Unexpected');

        const id = store.reconcile(manager(site()), {sourceId: 'work'}).sites[0].id;
        const result = store.reconcile(manager(site('A') + site('B')), {
            sourceId: 'work',
            resolutions: {A: id, B: id},
        });

        expect(result.committed).toBe(false);
        expect(result.sites).toHaveLength(0);
        expect(result.conflicts).toHaveLength(2);

        const serialized = JSON.parse(JSON.stringify(store));

        serialized.sources[0].sites[0].endpoint.password = 'private';
        expect(() => SiteIdentityStore.fromJSON(serialized)).toThrow('Unexpected');
    });

    it('does not transfer IDs between accounts with matching hosts or reuse removed identities', () => {
        const store = new SiteIdentityStore();
        const first = store.reconcile(manager(site('Work', 'example.invalid', '<User>alice</User>')), {sourceId: 'work'});
        const changed = store.reconcile(manager(site('Renamed', 'example.invalid', '<User>bob</User>')), {sourceId: 'work'});

        expect(changed.sites[0].id).not.toBe(first.sites[0].id);

        store.reconcile(manager(''), {sourceId: 'work'});

        const restored = store.reconcile(manager(site('Renamed', 'example.invalid', '<User>bob</User>')), {sourceId: 'work'});

        expect(restored.sites[0].id).not.toBe(changed.sites[0].id);
    });

    it('revalidates uniqueness and endpoints against a fresh credential import', () => {
        const store = new SiteIdentityStore();
        const inventory = readSiteManagerReport(file(site())).manager;
        const id = store.reconcile(inventory, {sourceId: 'work'}).sites[0].id;
        const credentials = readSiteManagerReport(file(site('Work', 'example.invalid', '<Pass>selected-secret</Pass>')), {
            includePasswords: true,
            credentialPath: 'Work',
        }).manager;

        expect(store.resolve(credentials, {sourceId: 'work', id})!.propertiesRaw.password).toBe('selected-secret');

        credentials.getServers()[0].propertiesRaw.host = 'changed.invalid';

        expect(store.resolve(credentials, {sourceId: 'work', id})).toBeNull();

        inventory.getServers().push(inventory.getServers()[0]);

        expect(store.resolve(inventory, {sourceId: 'work', id})).toBeNull();
        expect(store.migratePath(inventory, {sourceId: 'work', path: 'Work'})).toBeNull();
        expect(() => store.reconcile(inventory, {sourceId: 'work'})).toThrow('duplicate canonical');
        expect(() => createMetadataSnapshot(inventory)).toThrow('Invalid');
    });
});

describe('metadata snapshots and semantic diffs', () => {
    it('ignores XML formatting, defaults, order and credential-only changes', () => {
        const first = manager(site('B', 'EXAMPLE.invalid', '<Pass>secret-one</Pass>') + site('A', 'other.invalid'));
        const second = manager('\n' + site('A', 'other.invalid') + '\n' + site('B', 'example.invalid',
            '<Pass encoding="base64">c2VjcmV0LXR3bw==</Pass><PasvMode>MODE_DEFAULT</PasvMode><EncodingType>Auto</EncodingType>'));
        const before = createMetadataSnapshot(first);
        const after = createMetadataSnapshot(second);

        expect(JSON.stringify(after)).toBe(JSON.stringify(before));
        expect(diffMetadata(before, after)).toMatchObject({
            added: [],
            removed: [],
            changed: [],
            uncertain: false,
        });
        expect(JSON.stringify(after)).not.toMatch(/secret|Pass|password|c2VjcmV0/);
        expect(Object.isFrozen(after.sites[0])).toBe(true);
        expect(Object.isFrozen(after.profile)).toBe(true);
    });

    it('reports precise additions, removals and non-secret settings changes', () => {
        const before = createMetadataSnapshot(manager(site('Changed') + site('Removed', 'removed.invalid')));
        const after = createMetadataSnapshot(manager(site('Changed', 'new.invalid', '<BypassProxy>1</BypassProxy>') +
            site('Added', 'added.invalid')));
        const diff = diffMetadata(before, after);

        expect(diff.added.map(record => record.path)).toEqual(['Added']);
        expect(diff.removed.map(record => record.path)).toEqual(['Removed']);
        expect(diff.changed).toEqual([
            {
                key: 'Changed',
                fields: [
                    {field: 'bypassProxy', before: false, after: true},
                    {field: 'host', before: 'example.invalid', after: 'new.invalid'},
                ],
            },
        ]);
        expect(Object.isFrozen(diff.changed[0].fields)).toBe(true);
    });

    it('separates sensitive metadata profiles and never includes passwords or password encoding', () => {
        const current = manager(site('Work', 'example.invalid',
            '<User>alice</User><Pass>private</Pass><Comments>internal note</Comments><Keyfile>C:/keys/private</Keyfile><LocalDir>C:/work</LocalDir>'));
        const defaultSnapshot = createMetadataSnapshot(current);
        const detailed = createMetadataSnapshot(current, {
            includeUsernames: true,
            includeLocalPaths: true,
            includeComments: true,
        });

        expect(defaultSnapshot.sites[0]).not.toHaveProperty('user');
        expect(defaultSnapshot.sites[0]).not.toHaveProperty('keyFile');
        expect(defaultSnapshot.sites[0]).not.toHaveProperty('comments');
        expect(detailed.sites[0]).toMatchObject({user: 'alice', keyFile: 'C:/keys/private', comments: 'internal note'});
        expect(detailed.sites[0]).not.toHaveProperty('password');
        expect(detailed.sites[0]).not.toHaveProperty('passwordEncoding');
        expect(() => diffMetadata(defaultSnapshot, detailed)).toThrow(MetadataSnapshotError);
    });

    it('normalizes supported paths and preserves unsupported representations without decoding failure', () => {
        const first = createMetadataSnapshot(manager(site('Work', 'example.invalid', '<RemoteDir>1 0 3 pub</RemoteDir>')));
        const second = createMetadataSnapshot(manager(site('Work', 'example.invalid', '<RemoteDir>1   0   3 pub</RemoteDir>')));
        const legacy = createMetadataSnapshot(manager(site('Work', 'example.invalid', '<RemoteDir>3 0 3 abc</RemoteDir>')));

        expect(first).toEqual(second);
        expect(first.sites[0]).toMatchObject({remoteDirectoryStatus: 'decoded', remoteDirectory: '/pub'});
        expect(legacy.sites[0]).toMatchObject({remoteDirectoryStatus: 'unsupported', remoteDirectory: '3 0 3 abc'});
    });

    it('uses verified stable IDs for rename diffs while canonical-path snapshots show add/remove', () => {
        const store = new SiteIdentityStore();
        const first = manager(site('Old'));

        store.reconcile(first, {sourceId: 'work'});

        const before = createMetadataSnapshot(first, {identityStore: store, sourceId: 'work'});
        const second = manager(site('New'));

        expect(() => createMetadataSnapshot(second, {identityStore: store, sourceId: 'work'})).toThrow('reconciled');

        store.reconcile(second, {sourceId: 'work'});

        const after = createMetadataSnapshot(second, {identityStore: store, sourceId: 'work'});
        const diff = diffMetadata(before, after);

        expect(diff.added).toEqual([]);
        expect(diff.removed).toEqual([]);
        expect(diff.changed[0].fields.map(field => field.field)).toEqual(['name', 'path']);
        expect(diffMetadata(createMetadataSnapshot(first), createMetadataSnapshot(second)).added).toHaveLength(1);
    });

    it('makes uncertainty explicit and rejects persisted schema incompatibility or hidden credentials', () => {
        const partial = readSiteManagerReport(file(site() + '<Server />'), {mode: 'tolerant'}).manager;

        expect(() => createMetadataSnapshot(partial)).toThrow('incomplete');

        const snapshot = createMetadataSnapshot(partial, {allowPartial: true});

        expect(diffMetadata(snapshot, snapshot).uncertain).toBe(true);
        expect(parseMetadataSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
        expect(() => parseMetadataSnapshot({...snapshot, schemaVersion: 2})).toThrow('version');
        expect(() => parseMetadataSnapshot({...snapshot, sites: [{...snapshot.sites[0], password: 'private'}]}))
            .toThrow('unexpected field');
        expect(() => parseMetadataSnapshot({...snapshot, sites: [snapshot.sites[0], snapshot.sites[0]]}))
            .toThrow('Invalid');
    });
});
