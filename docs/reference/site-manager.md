# SiteManager API

Exported from `@jalsoedesign/filezilla-core`.

```ts
interface SiteManagerReadOptions {
    includePasswords?: boolean;
    credentialPath?: string;
    mode?: 'strict' | 'tolerant';
    inspectRemoteDirectories?: boolean;
}

function getSiteManager(xmlPath: string, options?: SiteManagerReadOptions): SiteManager;
function getDefaultSiteManager(): SiteManager;
function readSiteManagerReport(xmlPath: string, options?: SiteManagerReadOptions): SiteManagerImportReport;
```

`getSiteManager` and the constructor default to strict mode, passwords included and deferred remote-directory decoding. `readSiteManagerReport` defaults to strict mode, passwords excluded and metadata-only remote-directory warnings.

For the legacy reader and constructor, `includePasswords` defaults to true. Omitting `credentialPath` permits all supported credentials; supplying it limits loading to exactly that canonical path. Empty selects none. `includePasswords: false` overrides selection. Automatic discovery accepts no options.

## Constructor and methods

```ts
new SiteManager(xml: XmlConfig, options?: SiteManagerReadOptions)
```

| Member | Return | Behavior |
| --- | --- | --- |
| `getServers()` | Server[] | Live flat array; treat as read-only unless deliberately editing memory |
| `getServerByPath(path)` | Server or null | Exact case-sensitive canonical selection |
| `searchServers(term, options?)` | Server[] | Case-insensitive name/path substring; `{fields: 'all'}` includes all loaded values and decoded remote paths |
| `getServersTree(servers?)` | ServerTree | Rebuild nonempty hierarchy from all or selected records |
| `toJSON()` | `{servers: metadata[]}` | Password-redacted records, retaining raw encoded remote-directory metadata |
| `importDiagnostics` | readonly SiteImportDiagnostic[] | Redacted structural locations and error/warning codes |
| `rejectedCount` | number | Excluded site records, including rejected folder descendants |

Singleton/array `Server` and `Folder` collections are normalized recursively. Raw XML is not retained. Strict mode rejects duplicate canonical identities before any selected credential decoding; tolerant mode excludes every record at each duplicate path. Identity components escape `%` as `%25` and `/` as `%2F`; decoded names and credential selection use the same identity computation.

## Validation and defaults

File reading validates XML well-formedness before parsing and rejects DTD/entity declarations. Both construction paths validate supported model fields/collections and reject duplicate singleton fields.

| Field | Rule/default |
| --- | --- |
| Host, Name | Required nonempty normalized strings |
| Port | Required integer 1–65535 |
| Protocol | Required integer -1–65535; unknown IDs remain metadata-only |
| Type | Integer 0–10, default 0 |
| Logontype | Integer 0–7, default 0 |
| TimezoneOffset | Safe integer, default 0 |
| MaximumMultipleConnections | Non-negative safe integer, default 0 |
| PasvMode | 0–2 or known textual aliases, default 0 |
| EncodingType | 0–2 or known textual aliases, default 2 |
| BypassProxy, SyncBrowsing, DirectoryComparison | Boolean/0/1 values; default false |

Optional usernames preserve text, including leading zeros and surrounding spaces. Plain/base64 passwords preserve decoded text; unknown/protected encodings omit the password. This is not complete FileZilla schema or protected-password support.

## Tree types and boundaries

```ts
interface ServerFolderNode {
    name: string;
    folders: ServerFolderNode[];
    servers: Server[];
}

interface ServerTree extends ServerFolderNode {
    name: 'Root';
}
```

The reader is synchronous. Strict mode throws errors with field/site or XML-location context. Tolerant mode returns independent valid sites and redacted diagnostics; malformed documents and unsafe declarations remain fatal. Search does not decode remote directories; explicit path decoding remains strict. Configurable parsing resource budgets and XML write-back are not provided, and existing manager arrays/properties remain mutable.

## Import reports, stable IDs and snapshots

`readSiteManagerReport` returns `{manager, diagnostics, complete, acceptedCount, rejectedCount}`. Diagnostics identify `INVALID_SITE`, `INVALID_FOLDER`, `DUPLICATE_SITE_PATH` or the warning `REMOTE_DIRECTORY_UNAVAILABLE`. A warning alone does not make the import incomplete.

`SiteIdentityStore` provides atomic in-memory reconciliation, reviewed conflict resolutions, safe saved-path migration and versioned JSON import/export. Its application-owned IDs are distinct from canonical paths; the application owns persistence and synchronization.

`createMetadataSnapshot`, `parseMetadataSnapshot` and `diffMetadata` provide immutable allowlisted snapshots and semantic diffs. Passwords and credential-derived hashes are excluded, sensitive metadata categories are opt-in, and partial snapshots keep uncertainty explicit. See [import workflows](/guide/import-workflows) for exact types, defaults, identity policies and version-validation behavior.
