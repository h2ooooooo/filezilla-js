# Read Site Manager

## Explicit file

```ts
import {getSiteManager} from '@jalsoedesign/filezilla-core';

const sites = getSiteManager('C:/Users/example/AppData/Roaming/FileZilla/sitemanager.xml', {
    includePasswords: false,
});
```

Reading and parsing are synchronous. The reader validates XML well-formedness, root/container shapes, required site fields, singleton fields, integer ranges and boolean settings. Missing files, malformed/truncated XML, invalid records and DTD/entity declarations are rejected. Errors identify a site/field or XML location without echoing credential text. This is a supported-field validator, not a complete implementation of every FileZilla schema version.

`Host`, `Port`, `Protocol` and `Name` are required. Ports must be integers from 1 to 65535. Unknown protocol IDs within the accepted metadata range can be inventoried, but that does not create a connector for them. Supported defaults and ranges are in the [API reference](/reference/site-manager).

## Automatic location

`getDefaultSiteManager()` returns the first existing file from:

1. `%APPDATA%/FileZilla/sitemanager.xml` when `APPDATA` is set.
2. `$XDG_CONFIG_HOME/filezilla/sitemanager.xml`, or `$HOME/.config/filezilla/sitemanager.xml`.
3. `$HOME/.filezilla/sitemanager.xml` for older installations.

It accepts no read options and loads supported passwords by default. Use an explicit path with `includePasswords: false` for inventory.

## Credentials and serialization

| Input/option | Behavior |
| --- | --- |
| Plain text or `encoding="plain"` | Exact credential text, including surrounding whitespace, is preserved |
| `encoding="base64"` | Valid base64 is decoded to UTF-8; decoded whitespace is preserved |
| Protected/other encodings | Password omitted; `passwordEncoding` retained |
| `includePasswords: false` | No passwords in normalized records |
| `credentialPath` omitted | All supported credentials may be loaded |
| `credentialPath: server.path` | Load only that exact canonical identity |
| Empty `credentialPath` | Matches no valid site; it no longer means unrestricted loading |

`includePasswords: false` takes precedence. The original XML tree is not retained. `JSON.stringify(manager)` produces `{servers: [...]}` with metadata only; `JSON.stringify(server)` omits `password` and leaves remote-directory metadata encoded. Explicit property APIs remain credential-bearing when credentials were requested.

Base64 is not encryption. Protected passwords are not decrypted. A missing password can be excluded, unsaved or unsupported; an explicitly empty password is preserved as an empty string. The reader does not save, edit or write back Site Manager files.

## Identity and construction

Names are normalized once before selection. Each component escapes `%` as `%25` and `/` as `%2F`; duplicate canonical paths fail before credentials are decoded. Folder-tree labels remain readable decoded names. Both singleton and array forms of `Server` and `Folder` are accepted by the public constructor, including mixed nesting.

Username strings preserve leading zeros and surrounding whitespace. Passive-mode and charset aliases are mapped deliberately; other metadata remains distinct from enforced connector settings. See [Server](/reference/server) and [querying](/guide/querying).
