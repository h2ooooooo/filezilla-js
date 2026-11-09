# CLI quick start

Install the CLI, save a synthetic site, then run a metadata query and compare the output. This needs no FileZilla installation or server account.

## Install

```sh
npm install --global @jalsoedesign/filezilla-cli@rc
filezilla-js --help
```

For a project-local dependency, prefix commands with `npm exec --`. See [runtime requirements](/guide/installation).

## Save a fixture

Create `sitemanager.xml` in a new host working directory, or <a href="/examples/sitemanager.xml" download="sitemanager.xml">download the same fixture</a>:

```xml
<FileZilla3>
    <Servers>
        <Server>
            <Host>127.0.0.1</Host>
            <Port>22</Port>
            <Protocol>1</Protocol>
            <Type>0</Type>
            <User>deploy</User>
            <Logontype>2</Logontype>
            <Name>Demo</Name>
        </Server>
    </Servers>
</FileZilla3>
```

## Run this command

```sh
filezilla-js get Demo host --file ./sitemanager.xml --json
```

Exit code: `0`, stdout:

```json
"127.0.0.1"
```

No connection is opened. The fixture has no saved password. Try listing or searching it:

```sh
filezilla-js list --file ./sitemanager.xml --json
```

Expected stdout (exit `0`):

```json
[
    {"path": "Demo", "host": "127.0.0.1", "protocol": "SFTP"}
]
```

For a search command and its coloured output, use the separate downloadable fixture in [query transcripts](/cli/queries). See [full query transcripts](/cli/queries) for colours, private-key/remote paths, password hiding and JSON shapes. Those reference captures use a separate synthetic fixture with example.invalid hosts.

## Test an actual local server

In an installed checkout, run `npm run build` followed by `node examples/test-sftp.mjs` or `node examples/test-ftp.mjs`. These start temporary loopback servers, test the saved synthetic site and verify SDK transfers. The [captured output](/guide/local-demo) includes success and SFTP wrong-pin refusal. To test your own server explicitly, use the [check command](/guide/connection-check).
