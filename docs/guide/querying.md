# Query and select sites

```ts
const web = manager.getServerByPath('Production/Web');
const matches = manager.searchServers('production');
```

Exact selection compares canonical paths case-sensitively. Search matches a case-insensitive substring of the canonical path or decoded site name; an empty search matches every site. Neither filters by host or protocol. Search does not decode remote directories.

## Canonical identities

| Saved hierarchy/name | Selection path |
| --- | --- |
| Folder `Production`, site `Web` | `Production/Web` |
| Root site named `Production/Web` | `Production%2FWeb` |
| Root site named `Production%2FWeb` | `Production%252FWeb` |

Percent escaping is applied once per component before joining with `/`. Use the returned `server.path` for later `credentialPath` or exact selection. Do not URL-decode the entire path or manually concatenate labels. Duplicate canonical identities are rejected at import, and encoded names use the same normalized identity for lookup and credential loading.

These paths identify a record in an import; moving or renaming the record changes its path. Use the optional [SiteIdentityStore](/guide/import-workflows#keep-a-stable-site-selection) to preserve application-owned IDs across reviewed imports. Canonical paths themselves still change after a move or rename.

## Folder tree

```ts
const tree = manager.getServersTree(manager.searchServers('web'));
console.log(tree.name); // Root
```

Every node has `{name, folders, servers}`. Labels decode component escaping without splitting a literal slash into a second folder. Empty folders are not retained because the tree is rebuilt from selected servers. Filtered trees include only necessary ancestors.

## UI inventory

```ts
const inventory = manager.getServers().map(server => ({
    path: server.path,
    name: server.properties.name,
    host: server.properties.host,
    protocol: server.siteProtocolName,
}));
```

An explicit projection keeps API responses small. Built-in manager/server JSON is also password-redacted, but metadata can still reveal hosts, user names and local paths. Treat `getServers()` and `propertiesRaw` as read-only unless intentionally editing in-memory state: their returned collections/objects remain mutable and edits are not saved to XML.
