# Query and select sites

The recipes below use `manager` from the [complete reader program](/api/quick-start). Replace or add operations before that program ends and rerun its selected-language command. These are contextual fragments; query values and counts depend on the selected XML.

## Select an exact site

Use a path returned by the reader. Replace `Production/Web` with the selected site's path; the result is `undefined` when no exact match exists.

::: code-group

```ts [TypeScript]
const web = manager.getServerByPath('Production/Web');
const matches = manager.searchServers('production');
```

```js [JavaScript]
const web = manager.getServerByPath('Production/Web');
const matches = manager.searchServers('production');
```

```js [MJS]
const web = manager.getServerByPath('Production/Web');
const matches = manager.searchServers('production');
```

```js [CommonJS]
const web = manager.getServerByPath('Production/Web');
const matches = manager.searchServers('production');
```

:::

Exact selection compares canonical paths case-sensitively. Search matches a case-insensitive substring of the canonical path or decoded site name; an empty search matches every site.

## Search loaded fields

Search does not open a connection. To search all fields already loaded from the file, pass `{fields: 'all'}`:

::: code-group

```ts [TypeScript]
const profiles = manager.searchServers('example.com', {fields: 'all'});
```

```js [JavaScript]
const profiles = manager.searchServers('example.com', {fields: 'all'});
```

```js [MJS]
const profiles = manager.searchServers('example.com', {fields: 'all'});
```

```js [CommonJS]
const profiles = manager.searchServers('example.com', {fields: 'all'});
```

:::

The result is an array of matching sites. See [search scope and credential loading](#search-scope-and-credential-loading) for the fields included.

## Folder tree

::: code-group

```ts [TypeScript]
const tree = manager.getServersTree(manager.searchServers('web'));
console.log(tree.name); // Root
```

```js [JavaScript]
const tree = manager.getServersTree(manager.searchServers('web'));
console.log(tree.name); // Root
```

```js [MJS]
const tree = manager.getServersTree(manager.searchServers('web'));
console.log(tree.name); // Root
```

```js [CommonJS]
const tree = manager.getServersTree(manager.searchServers('web'));
console.log(tree.name); // Root
```

:::

The returned root node contains folders and matching sites. This example prints `Root`; see [tree and inventory behavior](#tree-and-inventory-behavior) for the structure.

## UI inventory

::: code-group

```ts [TypeScript]
const inventory = manager.getServers().map(server => ({
    path: server.path,
    name: server.properties.name,
    host: server.properties.host,
    protocol: server.siteProtocolName,
}));
```

```js [JavaScript]
const inventory = manager.getServers().map(server => ({
    path: server.path,
    name: server.properties.name,
    host: server.properties.host,
    protocol: server.siteProtocolName,
}));
```

```js [MJS]
const inventory = manager.getServers().map(server => ({
    path: server.path,
    name: server.properties.name,
    host: server.properties.host,
    protocol: server.siteProtocolName,
}));
```

```js [CommonJS]
const inventory = manager.getServers().map(server => ({
    path: server.path,
    name: server.properties.name,
    host: server.properties.host,
    protocol: server.siteProtocolName,
}));
```

:::

The result is an array containing only the selected metadata fields; this snippet does not print it.

## Canonical identities

| Saved hierarchy/name | Selection path |
| --- | --- |
| Folder `Production`, site `Web` | `Production/Web` |
| Root site named `Production/Web` | `Production%2FWeb` |
| Root site named `Production%2FWeb` | `Production%252FWeb` |

Percent escaping is applied once per component before joining with `/`. Use the returned `server.path` for later `credentialPath` or exact selection. Do not URL-decode the entire path or manually concatenate labels. Duplicate canonical identities are rejected at import, and encoded names use the same normalized identity for lookup and credential loading.

These paths identify a record in an import; moving or renaming the record changes its path. Use the optional [`SiteIdentityStore`](/guide/import-workflows#keep-a-stable-site-selection) to preserve application-owned IDs across reviewed imports. Canonical paths themselves still change after a move or rename.

## Search scope and credential loading

All-fields search includes every raw property value, the canonical path, protocol name and decoded remote directory. Numeric and boolean values are matched as text. Passwords are searchable only when loaded; searching does not load additional credentials. Unsupported remote directories remain searchable in their encoded form. The default name/path search does not decode remote directories.

## Tree and inventory behavior

Every node has `{name, folders, servers}`. Labels decode component escaping without splitting a literal slash into a second folder. Empty folders are not retained because the tree is rebuilt from selected servers. Filtered trees include only necessary ancestors.

An explicit projection keeps API responses small. Built-in manager/server JSON is also password-redacted, but metadata can still reveal hosts, user names and local paths. Treat `getServers()` and `propertiesRaw` as read-only unless intentionally editing in-memory state: their returned collections/objects remain mutable and edits are not saved to XML.
