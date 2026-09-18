# Core API Extended Documentation

Detailed reference for the `@jalsoedesign/filezilla-core` API.

## Functions

### `getDefaultSiteManager()`
Attempts to locate the default `sitemanager.xml` file based on the operating system's standard paths and returns a `SiteManager` instance.

- **Returns**: `SiteManager`
- **Throws**: `Error` if the default configuration file cannot be found.

### `getSiteManager(xmlPath: string, options?: SiteManagerReadOptions)`
Loads a specific FileZilla XML configuration file.

- **Parameters**: `xmlPath`: The absolute or relative path to the XML file. Options control selected credentials, strict/tolerant mode and remote-directory warnings. Legacy defaults remain strict with passwords included.
- **Returns**: `SiteManager`
- **Throws**: `Error` if the file does not exist or if the XML format is invalid.

---

## Import reports and metadata workflows

`readSiteManagerReport(path, options?)` returns a manager, redacted diagnostics and explicit completeness/counts. It defaults to strict mode with passwords excluded; select `mode: 'tolerant'` for independent valid records. `SiteIdentityStore` supplies reviewed identity reconciliation and JSON import/export. `createMetadataSnapshot`, `parseMetadataSnapshot` and `diffMetadata` supply versioned immutable metadata workflows. See the [complete import guide](../../../docs/guide/import-workflows.md).

## Classes

### `SiteManager`
The primary interface for interacting with a collection of FileZilla servers.

#### Methods
- `getServers(): Server[]`\
  Returns a flat list of all servers found in the configuration.

- `getServerByPath(path: string): Server | null`\
  Retrieves a specific server by its full folder path (e.g., `Work/Production/Web Server`). Returns `null` if not found.

- `searchServers(term: string, options?: {fields?: 'name' | 'all'}): Server[]`\
  Matches a case-insensitive substring of the path or name by default. Pass `{fields: 'all'}` to include every loaded property value, the protocol name and decoded remote directory. Unsupported remote directories are searched in their encoded form. Passwords are searchable only when loaded; search does not load additional credentials.

- `getServersTree(servers?: Server[]): ServerTree`\
  Rebuilds the hierarchical folder structure from the given list of servers. If no servers are provided, it uses all servers in the manager.

---

### `Server`
Represents a single site entry in FileZilla.

#### Properties
- `path: string` (readonly)\
  The full path in the folder hierarchy (e.g., `Folder/Site Name`).

- `properties: ServerPropertiesExtended`\
  A normalized set of properties, including the decoded `path` and the parsed `remoteDirectory`. See [Types](types.MD#serverpropertiesextended).

- `propertiesRaw: ServerProperties`\
  The validated, normalized properties with the original encoded remote-directory representation; these are not the original XML tree. See [Types](types.MD#serverproperties).

- `siteProtocolName: string`\
  The human-readable name of the server's protocol (e.g., `SFTP`, `CLOUDFLARE_R2`). See [Enums](enums.MD#serverprotocol).

#### Methods
- `getRemoteDirectory(defaultRemoteDirectory: string = ''): string`\
  Parses FileZilla's internal `RemoteDir` string into a standard, readable path.
  - **Parameters**: `defaultRemoteDirectory`: A fallback path to return if no remote directory is set.
  - **Returns**: A Unix-style path string (e.g., `/home/user/pub`).

---

## License

MIT © [JalsoeDesign](https://www.jalsoedesign.net)
