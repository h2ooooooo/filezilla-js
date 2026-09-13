# CLI extended reference

Transfer connections are implemented in the separate Dockline FTP/SFTP dependencies. Existing FileZilla factories remain the configuration bridge; command behavior and read-only check boundaries below are unchanged.

The current [CLI reference](../../../docs/reference/cli.md) documents all query flags and output forms. The [connection-check guide](../../../docs/guide/connection-check.md) documents strict check flags, versioned JSON, selected credentials, deadlines, cleanup and status-specific exit codes.

## Query saved sites

```sh
filezilla-js list --file ./sitemanager.xml --json
filezilla-js list --file ./sitemanager.xml --table --full
filezilla-js get "Production/Web" host --file ./sitemanager.xml
filezilla-js get --search "unique site" --file ./sitemanager.xml --json
```

List/get are local metadata queries and do not connect. Exact paths are canonical and case-sensitive; searches require a unique result for get. Passwords are masked unless `--show-password` is selected. Full property output explicitly decodes the selected remote directory and can fail if its saved format is unsupported. JSON is preferred over table if both are requested.

Legacy query parsing is permissive: unknown flags are ignored, missing values are not comprehensively rejected, and no `--` terminator is supported. Handled query failures use exit 1; unknown-command output can remain plain text even with `--json`. The stricter check parser has a different documented contract.

## Read-only network check

```sh
filezilla-js check "Production/Web" --file ./sitemanager.xml --host-key-sha256 SHA256:VERIFIED_PIN --json
```

Replace the placeholder with an independently verified fingerprint. SFTP requires pinning; FTPS keeps certificate verification. Optional `--password-stdin` reads redirected selected credentials without putting them in argv. There is no automatic trust approval or built-in masked terminal prompt. No upload/deployment subcommand is supplied.

## Run from this checkout

From the repository root:

```sh
npm ci
npm run build
node packages/cli/dist/cli.js --help
node packages/cli/dist/cli.js list --file ./sitemanager.xml
node --import tsx packages/cli/src/cli.ts --help
npm run test:cli
```

The source runner uses the declared local tsx. There is no `npm run cli` script and no ts-node dependency. `npm run check:consumer` tests the actual packed binary and compiles [packaged transfer recipes](../../../docs/guide/transfer-recipes.md) through public package imports.

## Embedded APIs

`run(): Promise<void>` reads process arguments and may exit; embed core APIs for metadata queries. `checkConnection(server, options)` is the explicit programmatic check API with typed results. See [public exports](../../../docs/reference/public-api.md#cli).
