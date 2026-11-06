# Import diagnostics, stable IDs and metadata diffs

These optional workflows are exported from `@jalsoedesign/filezilla-core`. They do not connect to a server, write FileZilla settings or establish host trust.

## Inspect an import

`readSiteManagerReport()` reads a file and reports how many sites were accepted or rejected. The example below prints that result and any diagnostics without connecting or loading saved passwords.

Use the [quick-start XML fixture](/api/quick-start#save-sitemanager-xml), install `@jalsoedesign/filezilla-core`, and run this complete program. With that valid fixture, no diagnostic lines are printed. Other input can produce diagnostics and different counts.

Save `inspect-import.ts` by default, or the filename in the selected language tab. Download: <a href="/examples/inspect-import.ts" download="inspect-import.ts">TypeScript</a> · <a href="/examples/inspect-import.js" download="inspect-import.js">JavaScript</a> · <a href="/examples/inspect-import.mjs" download="inspect-import.mjs">MJS</a> · <a href="/examples/inspect-import.cjs" download="inspect-import.cjs">CommonJS</a>

::: code-group

```ts [TypeScript]
// inspect-import.ts
import {readSiteManagerReport} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const report = readSiteManagerReport(filename, {mode: 'tolerant'});

for (const diagnostic of report.diagnostics) {
    console.log(diagnostic.code, diagnostic.sourcePath, diagnostic.field);
}

console.log('Complete:', report.complete);
console.log('Accepted:', report.acceptedCount);
console.log('Rejected:', report.rejectedCount);
```

```js [JavaScript]
// inspect-import.js
import {readSiteManagerReport} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const report = readSiteManagerReport(filename, {mode: 'tolerant'});

for (const diagnostic of report.diagnostics) {
    console.log(diagnostic.code, diagnostic.sourcePath, diagnostic.field);
}

console.log('Complete:', report.complete);
console.log('Accepted:', report.acceptedCount);
console.log('Rejected:', report.rejectedCount);
```

```js [MJS]
// inspect-import.mjs
import {readSiteManagerReport} from '@jalsoedesign/filezilla-core';

const [filename = './sitemanager.xml'] = process.argv.slice(2);
const report = readSiteManagerReport(filename, {mode: 'tolerant'});

for (const diagnostic of report.diagnostics) {
    console.log(diagnostic.code, diagnostic.sourcePath, diagnostic.field);
}

console.log('Complete:', report.complete);
console.log('Accepted:', report.acceptedCount);
console.log('Rejected:', report.rejectedCount);
```

```js [CommonJS]
// inspect-import.cjs
const {readSiteManagerReport} = require('@jalsoedesign/filezilla-core');

async function main() {
    const [filename = './sitemanager.xml'] = process.argv.slice(2);
    const report = readSiteManagerReport(filename, {mode: 'tolerant'});

    for (const diagnostic of report.diagnostics) {
        console.log(diagnostic.code, diagnostic.sourcePath, diagnostic.field);
    }

    console.log('Complete:', report.complete);
    console.log('Accepted:', report.acceptedCount);
    console.log('Rejected:', report.rejectedCount);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
```

:::

### Run

::: code-group

```sh [TypeScript]
npm install --save-dev typescript tsx @types/node
npm pkg set type=module
npx tsx inspect-import.ts ./sitemanager.xml
```

```sh [JavaScript]
npm pkg set type=module
node inspect-import.js ./sitemanager.xml
```

```sh [MJS]
node inspect-import.mjs ./sitemanager.xml
```

```sh [CommonJS]
node inspect-import.cjs ./sitemanager.xml
```

:::

### Output

```text
Complete: true
Accepted: 1
Rejected: 0
```

## Import validation and diagnostics

These settings control how records inside the XML are checked. The example above selects tolerant mode so an invalid record can be reported while valid records remain available. The default is strict validation. Saved passwords remain excluded unless explicitly requested.

| Option | Default | Behavior |
| --- | --- | --- |
| `mode` | `'strict'` | Strict mode throws on invalid records. Tolerant mode excludes individual invalid sites and invalid folder subtrees. |
| `includePasswords` | `false` in `readSiteManagerReport` | Set explicitly to `true` only when credentials are needed. |
| `credentialPath` | Unset | With passwords enabled, load a password only for this exact canonical path. |
| `inspectRemoteDirectories` | `true` in `readSiteManagerReport` | Add a warning when a remote path cannot be decoded; keep the site's metadata. |

`getSiteManager()` and `new SiteManager()` retain their existing defaults: strict mode, passwords included and remote-path decoding deferred. They also accept the new `mode` and `inspectRemoteDirectories` options. Their `importDiagnostics` and `rejectedCount` accessors expose the same import information.

### Diagnostic contract

| Code | Severity | Outcome |
| --- | --- | --- |
| `INVALID_SITE` | Error | A site has an invalid field or record shape and is excluded. |
| `INVALID_FOLDER` | Error | A folder is invalid; its entire subtree is excluded because the canonical location cannot be trusted. |
| `DUPLICATE_SITE_PATH` | Error | **Every** record at the duplicate canonical path is excluded before any of their passwords are decoded. |
| `REMOTE_DIRECTORY_UNAVAILABLE` | Warning | The site is accepted for metadata use, but its remote directory cannot be decoded. |

Each diagnostic has a structural XML `sourcePath`, such as `/FileZilla3/Servers/Folder[2]/Server[1]`, plus a field where applicable. These are one-based positions within each element collection, not byte offsets or line numbers. Messages contain no source field values, site names, hosts or credentials.

`complete` is false if there is any error diagnostic. Warnings alone leave it true. `rejectedCount` counts excluded site records, including descendants of an invalid folder; an invalid empty folder can make an import incomplete while rejecting zero sites. Diagnostics and report metadata are frozen. The manager keeps the existing `SiteManager` API.

Malformed XML, unsafe DTD/entity declarations, an invalid document root and invalid root containers still fail the entire import in either mode. Tolerant mode does not repair XML or catch unexpected programming/I/O errors. It never selects one duplicate as the credential owner.

Metadata-only imports intentionally do not decode or validate an unrequested password's contents. An explicitly requested malformed password can reject its site. Unsupported password encryption retains the existing behavior: metadata remains usable and the password is unavailable.

## Keep a stable site selection

The following are contextual recipes, not separate programs. Keep the reader setup above, define `const manager = report.manager`, and supply a persisted identity store, `savedSiteId`, `savedCanonicalPath` and snapshot text where used. Import declarations belong at file scope. IDs and diagnostics depend on the input; the snippets do not promise fixed output.

`SiteIdentityStore` assigns random application-facing IDs. Its matching data contains a canonical path, normalized host, port, protocol and username; it contains no passwords, key files, private key contents or credential-derived hashes. An explicit `sourceId` separates independently owned imports.

::: code-group

```ts [TypeScript]
import {readSiteManagerReport, SiteIdentityStore} from '@jalsoedesign/filezilla-core';

const {manager} = readSiteManagerReport('/settings/sitemanager.xml');
const identities = new SiteIdentityStore();
const result = identities.reconcile(manager, {sourceId: 'work-sites'});

if (!result.committed) {
    console.log(result.conflicts);
} else {
    const selectedId = result.sites[0]?.id;
    const dataToPersist = identities.toJSON();

    console.log(selectedId, dataToPersist.schemaVersion);
}
```

```js [JavaScript]
import {readSiteManagerReport, SiteIdentityStore} from '@jalsoedesign/filezilla-core';

const {manager} = readSiteManagerReport('/settings/sitemanager.xml');
const identities = new SiteIdentityStore();
const result = identities.reconcile(manager, {sourceId: 'work-sites'});

if (!result.committed) {
    console.log(result.conflicts);
} else {
    const selectedId = result.sites[0]?.id;
    const dataToPersist = identities.toJSON();

    console.log(selectedId, dataToPersist.schemaVersion);
}
```

```js [MJS]
import {readSiteManagerReport, SiteIdentityStore} from '@jalsoedesign/filezilla-core';

const {manager} = readSiteManagerReport('/settings/sitemanager.xml');
const identities = new SiteIdentityStore();
const result = identities.reconcile(manager, {sourceId: 'work-sites'});

if (!result.committed) {
    console.log(result.conflicts);
} else {
    const selectedId = result.sites[0]?.id;
    const dataToPersist = identities.toJSON();

    console.log(selectedId, dataToPersist.schemaVersion);
}
```

```js [CommonJS]
const {readSiteManagerReport, SiteIdentityStore} = require('@jalsoedesign/filezilla-core');

const {manager} = readSiteManagerReport('/settings/sitemanager.xml');
const identities = new SiteIdentityStore();
const result = identities.reconcile(manager, {sourceId: 'work-sites'});

if (!result.committed) {
    console.log(result.conflicts);
} else {
    const selectedId = result.sites[0]?.id;
    const dataToPersist = identities.toJSON();

    console.log(selectedId, dataToPersist.schemaVersion);
}
```

:::

### Reconciliation rules

1. An explicit reviewed resolution takes precedence. Set a path to an existing ID from the same source, or to `null` to create a new ID.
2. If the application supplies a durable `sourceSiteIds` mapping, that identifier is authoritative, including across path or endpoint changes. Only use IDs whose source ownership you trust; FileZilla XML fields are not automatically treated as stable identifiers.
3. Without source site IDs, an unchanged canonical path retains its ID only if the host, port, protocol and username still match. A changed endpoint at that path produces `ENDPOINT_CHANGED`.
4. A move or rename retains an ID when its endpoint has exactly one match in both the previous mapping and current import. Renamed clones and duplicate endpoints requiring a guess produce `AMBIGUOUS_IDENTITY`.
5. Dropping or replacing a previously supplied source site ID produces `SOURCE_ID_CHANGED` when that continuity can be identified. Newly encountered records with no matching endpoint receive new IDs.

Host matching is case insensitive and trims surrounding whitespace. Usernames are exact and case sensitive. Password and key changes do not change identity. Endpoint changes combined with a rename cannot be inferred; supply authoritative source IDs or make an explicit resolution. A successful reconciliation represents the full source inventory: removed records leave the mapping, and reintroducing one later creates a new ID.

Conflicts leave the entire stored mapping unchanged. `sites` contains the conflict-free **proposal**, including provisional IDs for newly encountered sites; do not persist selections from that proposal until `committed` is true. Supply decisions for every conflict and rerun reconciliation:

::: code-group

```ts [TypeScript]
const resolved = identities.reconcile(manager, {
    sourceId: 'work-sites',
    resolutions: {
        'Moved/Production': savedSiteId,
        'Moved/Production clone': null,
    },
});

if (!resolved.committed) {
    throw new Error('Some identity decisions are still unresolved.');
}
```

```js [JavaScript]
const resolved = identities.reconcile(manager, {
    sourceId: 'work-sites',
    resolutions: {
        'Moved/Production': savedSiteId,
        'Moved/Production clone': null,
    },
});

if (!resolved.committed) {
    throw new Error('Some identity decisions are still unresolved.');
}
```

```js [MJS]
const resolved = identities.reconcile(manager, {
    sourceId: 'work-sites',
    resolutions: {
        'Moved/Production': savedSiteId,
        'Moved/Production clone': null,
    },
});

if (!resolved.committed) {
    throw new Error('Some identity decisions are still unresolved.');
}
```

```js [CommonJS]
const resolved = identities.reconcile(manager, {
    sourceId: 'work-sites',
    resolutions: {
        'Moved/Production': savedSiteId,
        'Moved/Production clone': null,
    },
});

if (!resolved.committed) {
    throw new Error('Some identity decisions are still unresolved.');
}
```

:::

`sourceSiteIds` and `resolutions` are maps keyed by current canonical paths. Unknown paths, unknown resolution IDs and duplicate source site IDs are configuration errors. Assigning one stored ID to multiple current paths returns conflicts. Incomplete tolerant imports cannot be reconciled, so a rejected record cannot accidentally be treated as a removed site.

### Resolve and migrate saved selections

::: code-group

```ts [TypeScript]
const selected = identities.resolve(manager, {
    sourceId: 'work-sites',
    id: savedSiteId,
});

const migratedId = identities.migratePath(manager, {
    sourceId: 'work-sites',
    path: savedCanonicalPath,
});
```

```js [JavaScript]
const selected = identities.resolve(manager, {
    sourceId: 'work-sites',
    id: savedSiteId,
});

const migratedId = identities.migratePath(manager, {
    sourceId: 'work-sites',
    path: savedCanonicalPath,
});
```

```js [MJS]
const selected = identities.resolve(manager, {
    sourceId: 'work-sites',
    id: savedSiteId,
});

const migratedId = identities.migratePath(manager, {
    sourceId: 'work-sites',
    path: savedCanonicalPath,
});
```

```js [CommonJS]
const selected = identities.resolve(manager, {
    sourceId: 'work-sites',
    id: savedSiteId,
});

const migratedId = identities.migratePath(manager, {
    sourceId: 'work-sites',
    path: savedCanonicalPath,
});
```

:::

Both methods return `null` when the selection does not uniquely identify the current site with the stored endpoint. Neither falls back to a similar name or hostname. Reconcile first when a site has moved. `migratePath()` supports upgrading an application's saved canonical-path selections after a successful reconciliation; it cannot infer which old path belonged to a renamed record if the application has no prior identity mapping.

To load the selected password, re-read the source with `includePasswords: true` and `credentialPath: selected.path`, then call `resolve()` again against the freshly imported manager. Handle `null` if its path or endpoint changed between reads. Stable IDs do not replace current import uniqueness checks or server trust checks.

### Persistence and ownership

Use `identities.toJSON()` and `SiteIdentityStore.fromJSON(parsedJson)` with the caller's storage. Schema version 1 is validated; unknown versions, duplicate IDs/paths/source IDs and unexpected fields are rejected without echoing their contents. Returned records are deeply frozen. This package does not provide `SiteIdentityStore.open()` or silently write a shared file.

Serialize read/reconcile/write in an application transaction or under a lock. For a shared database or multiple processes, use a revision check and retry against the current record. Atomic file replacement alone prevents torn files but does not prevent a stale writer from losing another process's changes. Keep the source mapping and its saved selections under the same ownership. The library does not merge competing mappings or migrate unknown future schema versions automatically.

Identity mappings still expose hosts, paths and usernames. Supply non-secret source identifiers and protect persisted metadata according to the application's needs.

## Create immutable metadata snapshots

::: code-group

```ts [TypeScript]
import {createMetadataSnapshot, diffMetadata, parseMetadataSnapshot} from '@jalsoedesign/filezilla-core';

const current = createMetadataSnapshot(manager, {schemaVersion: 1});
const previous = parseMetadataSnapshot(JSON.parse(savedSnapshotJson));
const changes = diffMetadata(previous, current);

console.log(changes.added, changes.removed, changes.changed);
```

```js [JavaScript]
import {createMetadataSnapshot, diffMetadata, parseMetadataSnapshot} from '@jalsoedesign/filezilla-core';

const current = createMetadataSnapshot(manager, {schemaVersion: 1});
const previous = parseMetadataSnapshot(JSON.parse(savedSnapshotJson));
const changes = diffMetadata(previous, current);

console.log(changes.added, changes.removed, changes.changed);
```

```js [MJS]
import {createMetadataSnapshot, diffMetadata, parseMetadataSnapshot} from '@jalsoedesign/filezilla-core';

const current = createMetadataSnapshot(manager, {schemaVersion: 1});
const previous = parseMetadataSnapshot(JSON.parse(savedSnapshotJson));
const changes = diffMetadata(previous, current);

console.log(changes.added, changes.removed, changes.changed);
```

```js [CommonJS]
const {createMetadataSnapshot, diffMetadata, parseMetadataSnapshot} = require('@jalsoedesign/filezilla-core');

const current = createMetadataSnapshot(manager, {schemaVersion: 1});
const previous = parseMetadataSnapshot(JSON.parse(savedSnapshotJson));
const changes = diffMetadata(previous, current);

console.log(changes.added, changes.removed, changes.changed);
```

:::

Snapshots include allowlisted connection settings, canonical paths, names and remote-directory metadata. They omit passwords and password encoding entirely and compute no credential-derived comparison material. Three sensitive metadata categories are opt-in: `includeUsernames`, `includeLocalPaths` (key-file and local-directory paths) and `includeComments`. All default to false.

Settings defaults are normalized by the importer. Host case and unrelated XML whitespace/order do not create differences. Inactive custom encodings are normalized to an empty string. Supported remote-directory encodings are compared as decoded paths; unsupported ones retain their exact raw representation with status `unsupported`. An unset remote directory has status `unset`; it is not treated as an explicitly configured root directory.

Snapshots sort sites deterministically and are deeply frozen. `parseMetadataSnapshot()` validates persisted input and rejects unexpected fields, duplicate identities/paths, inconsistent metadata profiles and unsupported versions. Do not diff raw XML or ad-hoc objects containing credentials.

### Compare paths or stable identities

The default identity mode is `canonical-path`. A move appears as one removal and one addition because the snapshot does not guess identity. For precise rename diffs, reconcile the identity store and supply it when creating **both** snapshots:

::: code-group

```ts [TypeScript]
const current = createMetadataSnapshot(manager, {
    identityStore: identities,
    sourceId: 'work-sites',
});
```

```js [JavaScript]
const current = createMetadataSnapshot(manager, {
    identityStore: identities,
    sourceId: 'work-sites',
});
```

```js [MJS]
const current = createMetadataSnapshot(manager, {
    identityStore: identities,
    sourceId: 'work-sites',
});
```

```js [CommonJS]
const current = createMetadataSnapshot(manager, {
    identityStore: identities,
    sourceId: 'work-sites',
});
```

:::

Every site must resolve to its current stored identity. A rename then produces changes to `path` and `name` under the same `key`. The snapshot contains the ID and the chosen metadata profile, not the identity store's endpoint/account matching data.

`diffMetadata()` returns sorted `added`, `removed` and `changed` arrays. Each changed entry contains its `key` and precise `{field, before, after}` changes. It validates both snapshots and requires the same schema, identity mode, source and metadata profile. `MetadataSnapshotError.code` distinguishes `UNSUPPORTED_SCHEMA`, `INVALID_SNAPSHOT` and `PROFILE_MISMATCH`.

Incomplete imports are rejected by default. `allowPartial: true` permits a canonical-path inventory snapshot with `complete: false`; any diff involving it has `uncertain: true`, because an apparent removal may be an import failure. Stable-ID snapshots still require complete, reconciled imports. Do not treat an uncertain diff as instructions to delete settings.
