# How FileZilla JS works

FileZilla JS reads the Site Manager settings stored on the host. A profile read does not ask the FileZilla window for its current selection and does not connect to the saved FTP or SSH server.

## Find the settings source

Choose an explicit `sitemanager.xml` file for a reproducible read. The default lookup checks these locations in order:

| Candidate on the host | Meaning |
| --- | --- |
| `%APPDATA%\FileZilla\sitemanager.xml` | Windows roaming settings, when `APPDATA` is set |
| `$XDG_CONFIG_HOME/filezilla/sitemanager.xml` | XDG settings; falls back to `$HOME/.config/filezilla/sitemanager.xml` |
| `$HOME/.filezilla/sitemanager.xml` | Legacy home-directory settings |

The first existing file is selected; that is not proof that every running FileZilla instance uses it. The lookup is implemented in [the Site Manager reader source](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/core/src/SiteManager.ts). An explicitly selected file also supports exported or separately stored Site Manager settings.

The XML file is on the host. A Site Manager profile path identifies a folder/site inside that file. A remote directory identifies a path on the saved server. These are three different locations.

## Read and interpret the XML

1. Read the selected XML file from the host.
2. Validate and parse its supported folder and server records.
3. Build the Site Manager tree and canonical site paths used by selection and search.
4. Interpret protocol, authentication, local/remote directory and other supported native fields.
5. Return saved-site objects or normalized profile metadata. Reopen the source after the native file changes.

Malformed XML and unsupported structural records produce errors or import diagnostics, depending on the selected workflow. The [Site Manager reference](/reference/site-manager) explains validation and tolerant imports.

### From a saved record to a site

This synthetic XML describes one SFTP site named `Web` inside the `Production` folder:

```xml
<FileZilla3>
    <Servers>
        <Folder>Production
            <Server>
                <Host>sftp.example.test</Host>
                <Port>22</Port>
                <Protocol>1</Protocol>
                <Type>0</Type>
                <User>deploy</User>
                <Logontype>5</Logontype>
                <Keyfile>C:\Keys\deploy.ppk</Keyfile>
                <Name>Web</Name>
                <RemoteDir>0 0 3 srv 7 example</RemoteDir>
            </Server>
        </Folder>
    </Servers>
</FileZilla3>
```

| Stored field | Interpretation |
| --- | --- |
| Folder text and `Name` | The selection path is `Production/Web`; it identifies this saved site |
| `Protocol` = `1` | [`ServerProtocol.SFTP`](/reference/enums#serverprotocol), the saved transfer protocol |
| `Type` = `0` | [`ServerType.DEFAULT`](/reference/enums#servertype), the saved path dialect; this is separate from `Protocol` |
| `Logontype` = `5` | [`LogonType.key`](/reference/enums#logontype), key-based authentication |
| `Keyfile` | [`ServerProperties.keyFile`](/reference/server#serverproperties), a private-key path on the host; reading the record does not open the key |
| `RemoteDir` | The encoded starting directory on the server, decoded below |

The [XML types](/reference/enums#xml-object-types) describe native field names. The [Server API](/reference/server) describes the returned properties; the [reader implementation](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/core/src/SiteManager.ts) performs the conversion.

## Decode FileZilla remote directories

FileZilla stores `RemoteDir` as an encoded value rather than an ordinary path string. Supported values begin with a path type and prefix length, followed by length-prefixed path segments.

For the record above, each piece has a specific meaning:

```text
0 0 3 srv 7 example
^ ^ ^ ^   ^ ^
| | | |   | \-- Directory name: "example"
| | | |   \---- Length of "example": 7 characters
| | | \-------- Directory name: "srv"
| | \---------- Length of "srv": 3 characters
| \------------ Prefix length: 0 (no prefix)
\-------------- ServerType.DEFAULT (0)
```

[`Server.getRemoteDirectory()`](/reference/server#remote-directory-grammar) joins the decoded directory names with `/`, returning:

```text
/srv/example
```

The first number uses the [`ServerType` definition](/reference/enums#servertype), not the transfer-protocol ID. For example, `1 0 3 srv 7 example` uses `ServerType.UNIX` and produces the same path. The [TypeScript enum source](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/core/src/enum/ServerType.ts) lists the IDs, and [the decoder source](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/core/src/Server.ts) shows how lengths are consumed. FileZilla's native format is implemented by `CServerPath::GetSafePath` and `CServerPath::SetSafePath` in `src/engine/serverpath.cpp`; its [official source-code page](https://filezilla-project.org/sourcecode.php) provides access to the upstream tree.

The reader supports path IDs `0`, `1`, `8` and `9` with a zero-length prefix. It validates segment lengths and separators rather than splitting the value on spaces: `0 0 3 srv 9 my folder` becomes `/srv/my folder`. Unsupported path types/prefixes and malformed segments are not guessed. A direct decode can fail; the report workflow can retain the rest of the site's metadata and report an unavailable remote directory. See [the decoder's supported grammar](/reference/server#remote-directory-grammar) for limits.

Private-key paths point to files on the host. They are independent of `RemoteDir`, which points to a directory on the server.

## Keep credential access explicit

Supported saved passwords can use plaintext or base64 representations. Base64 decoding reads the stored representation; it does not unlock an unsupported encrypted credential format.

The legacy `getSiteManager` reader can include supported passwords unless `includePasswords: false` is selected. `readSiteManagerReport` excludes password values by default. CLI output hides supported secret values unless explicitly requested. Follow the selected API's [credential documentation](/guide/site-manager#credentials-and-serialization) rather than assuming every read has the same defaults.

## Reading, connecting and writing

Listing and searching sites reads saved settings only. FileZilla factories can map a selected site's supported settings into a Dockline connection; Dockline performs the requested remote operation.

Native profile writing is a separate preview/apply workflow. It does not happen as a side effect of reading. See [profile writing](/api/writing) for lock checks, backups and supported fields.

[API quick start](/api/quick-start) · [CLI quick start](/cli/quick-start)
