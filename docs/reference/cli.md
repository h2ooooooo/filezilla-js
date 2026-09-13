# CLI

`@jalsoedesign/filezilla-cli` supplies local Site Manager queries through `list` and `get`, plus an opt-in read-only `check` command. The query commands do not connect. No CLI upload or deployment command is provided.

```sh
filezilla-js list --file ./sitemanager.xml
filezilla-js list --file ./sitemanager.xml --full
filezilla-js list --file ./sitemanager.xml --table --full
filezilla-js list --file ./sitemanager.xml --json --recurse
filezilla-js get "Production/Web" host --file ./sitemanager.xml
filezilla-js get --search "unique site" protocolName --file ./sitemanager.xml
```

Quote paths/search terms containing spaces. Exact selection uses case-sensitive canonical paths; literal percent/slash within names are escaped as described in [querying](/guide/querying). `get --search` requires exactly one match.

## Query options

| Option | Meaning |
| --- | --- |
| --file path | Explicit XML file; otherwise automatic discovery |
| --search term | Case-insensitive canonical path/site-name substring |
| --json | JSON; takes precedence over table |
| --table | Terminal table |
| --full | Full properties for plain, table and JSON flat lists |
| --recurse | Nested list tree; requires JSON |
| --show-password | Explicitly reveal supported loaded passwords |
| --help, -h | Help without reading XML |
| --color, --no-color | The executable sets FORCE_COLOR before command execution; ordinary Chalk environment behavior also applies |

## Query output

| Invocation | Shape |
| --- | --- |
| list | Bulleted canonical paths |
| list --json | `{path, host, protocol}` array; protocol is display name |
| list --full | Full key/value records, including protocolName |
| list --table | Path, Host, Protocol |
| list --table --full | Path, Property, Value rows |
| list --json --full | Full properties with numeric protocol and protocolName |
| list --json --recurse | Root/folders/servers tree; full records |
| get path | Full key/value properties |
| get path --json | Full properties plus protocolName |
| get path host --json | JSON scalar |

Full output decodes remoteDirectory, so an unsupported saved path can still reject full/path output. Compact lists, host/name queries and searches do not decode it. R2 displays as CLOUDFLARE_R2. For list/get, passwords are `(hidden)` unless explicitly requested; these query commands load credentials before masking them. The check command requests only its selected credential.

## Query errors and automation

Ordinary failures use stderr and exit 1; JSON mode emits `{error: message}` for handled command failures. Unknown-command handling still prints plain error/help even with JSON. No command prints help and exits successfully.

Unknown flags are ignored; missing flag values are not comprehensively rejected, and there is no `--` terminator. Validate arguments in automation rather than relying on permissive parsing. Tests now invoke declared local tsx through Node with argument arrays and no shell; this fixes test reproducibility/path quoting, not these remaining parser limitations.

The exported `run(): Promise<void>` reads process arguments, writes the console and may exit. Use core for embedded metadata queries.

## Read-only connection checks

`filezilla-js check <canonical-path> --file <xml> --host-key-sha256 <pin> --json` runs ordinary connector operations and closes the connection. SFTP requires independently verified pinning; FTP retains normal TLS certificate verification. `--password-stdin` accepts redirected credentials without putting secrets in argv.

`--directory` requests a metadata check; `--include-listing` requests a shallow listing bounded by `--max-entries`. `--timeout-ms` covers credentials and network work. Unlike legacy query parsing, check rejects unknown/invalid flags and writes versioned JSON outcomes to stdout with documented status-specific exit codes. It does not accept query-only flags such as `--show-password`, `--table`, `--search` or color flags.

The package also exports `checkConnection(server, options): Promise<ConnectionCheckResult>` and its option/result types. See [connection checks](/guide/connection-check) for the complete flags, security boundary, cleanup state and exit-code table. Packaged [transfer recipes](/guide/transfer-recipes) are executable source examples; they are not CLI transfer commands.
