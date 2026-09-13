# Server API

Exported from `@jalsoedesign/filezilla-core`.

```ts
new Server(properties: ServerProperties, path: string)
```

The constructor stores its input without runtime schema validation.

| Member | Type | Behavior |
| --- | --- | --- |
| `path` | `readonly string` | Canonical selection path; escapes literal percent/slash within names |
| `propertiesRaw` | `ServerProperties` | Backing object after XML field conversion; remote directory remains encoded |
| `properties` | `ServerPropertiesExtended` | New shallow object; its remoteDirectory getter decodes only when read |
| `toJSON()` | `Omit<ServerPropertiesExtended, 'password'>` | Password-redacted metadata including path and raw encoded remote directory |
| `siteProtocolName` | `string` | Deliberate protocol-name mapping: CLOUDFLARE_R2 for 24, UNKNOWN for unrecognized values |
| `getRemoteDirectory(defaultRemoteDirectory = '')` | `string` | Decode supported FileZilla path, or return default for an absent value |

`propertiesRaw` is not the original XML and is not immutable. It can contain decoded credentials. `properties` is not a redacted view.

## ServerProperties

| Property | Type | Notes |
| --- | --- | --- |
| `host` | `string` | Server address |
| `port` | `number` | XML reader requires an integer from 1 to 65535 |
| `protocol` | `ServerProtocol` | Saved protocol ID |
| `type` | `ServerType` | Saved server/path dialect |
| `user` | `string` | Declared required; missing XML values can still produce undefined |
| `password?` | `string` | Supported decoded password if included |
| `passwordEncoding?` | `string` | Original password representation |
| `keyFile?` | `string` | Saved local private key path |
| `logonType` | `LogonType` | Saved authentication mode |
| `timezoneOffset` | `number` | Metadata; connectors do not apply it |
| `passiveMode` | `PasvMode` | FTP factory maps active/default/passive |
| `maximumMultipleConnections` | `number` | Saved limit; pass it explicitly as ConnectorPool serverMaxConnections to enforce it |
| `encodingType` | `CharsetEncoding` | Metadata; connectors do not map this to transport encoding |
| `customEncoding?` | `string` | Saved custom encoding |
| `bypassProxy` | `boolean` | Metadata; no proxy configuration is implemented |
| `name` | `string` | FileZilla site name |
| `comments?` | `string` | User notes |
| `localDirectory?` | `string` | Saved local start path |
| `remoteDirectory?` | `string` | Encoded in raw view, decoded in extended view |
| `synchronizedBrowsing` | `boolean` | Saved UI preference only |
| `directoryComparison` | `boolean` | Saved UI preference only |

`ServerPropertiesExtended` extends the interface with `path: string`. The XML reader validates its supported fields and defaults. Direct `new Server(...)` callers still own validation of the typed object they supply. Some logon modes legitimately have no XML username, so `user` can be undefined at runtime despite the existing interface declaration.

## Remote directory grammar

The decoder expects a numeric path type, a zero prefix length and length-prefixed segments. `1 0 3 srv 3 app` decodes to `/srv/app`; `1 0` decodes to `/`. Supported type IDs are `0`, `1`, `8` and `9`. Unsupported/malformed inputs throw when the decoded directory is requested, including by spreading the full `properties` view. Host/name reads and built-in redacted JSON do not decode it. See [paths](/guide/paths).
