# Complete CLI input reference

The help below is captured from the built executable. It is paired with the [output reference](/reference/cli-output). Commands and flags remain application-specific.

## filezilla-js --help

```text
Usage: filezilla-js <command> [options] [args]

Commands:
  list                      List all servers
  search <term>             Search all saved fields and show profile details
  source                    Show the selected configuration source
  get <path> [property]    Get a server or a specific property value
  check <path>              Check a connection without remote mutations (check --help)
  write-status              Show write availability and native diagnostic codes
  write                     Preview normalized profile writes (write --help)
  sync                      Preview one-way cross-app sync (sync --help)
  apply                     Apply a reviewed preview with fresh lock checks (apply --help)

Options:
  --file <path>             Specify the sitemanager.xml file path
  --json                    Output in JSON format
  --table                   Output in table format
  --search <term>           Search all fields without a command; name/path with list/get
  --recurse                 Return results in a nested structure (requires --json)
  --full                    Return full server properties when using list command
  --show-password           Show the actual password in output (otherwise hidden)
  --color                   Force color output (on by default on Windows TTY)
  --no-color                Disable color output
  --help, -h                Show this help message

Examples:
  filezilla-js --search clientName --show-password
  filezilla-js search 10.2.3.4
  filezilla-js list
  filezilla-js list --json
  filezilla-js list --table
  filezilla-js get "My Server"
  filezilla-js get "My Server" host
  filezilla-js get "My Server" --json
```

## search

Uses the global command syntax and options shown above. See the [command guide](/reference/cli) for usage.

## list

Uses the global command syntax and options shown above. See the [command guide](/reference/cli) for usage.

## get

Uses the global command syntax and options shown above. See the [command guide](/reference/cli) for usage.

## source

Uses the global command syntax and options shown above. See the [command guide](/reference/cli) for usage.

## write

```text
write-status [destination options]: inspect process, lock and registry capability diagnostics
Registry policy: --registry-mode transactional|guarded (repeat with apply; no automatic fallback)
write --input profiles.json --preview new-plan.json [destination options]
sync --from <application> --profile <path> --target-path <path> --preview new-plan.json
apply --plan new-plan.json [the same explicit destination and policy options]
Previews never apply writes. Applications must be closed; unknown state and native locks block apply.
Modes: --mode create|update|upsert. Stored secrets are never copied. No force/lock bypass is provided.
```

## sync

```text
write-status [destination options]: inspect process, lock and registry capability diagnostics
Registry policy: --registry-mode transactional|guarded (repeat with apply; no automatic fallback)
write --input profiles.json --preview new-plan.json [destination options]
sync --from <application> --profile <path> --target-path <path> --preview new-plan.json
apply --plan new-plan.json [the same explicit destination and policy options]
Previews never apply writes. Applications must be closed; unknown state and native locks block apply.
Modes: --mode create|update|upsert. Stored secrets are never copied. No force/lock bypass is provided.
```

## apply

```text
write-status [destination options]: inspect process, lock and registry capability diagnostics
Registry policy: --registry-mode transactional|guarded (repeat with apply; no automatic fallback)
write --input profiles.json --preview new-plan.json [destination options]
sync --from <application> --profile <path> --target-path <path> --preview new-plan.json
apply --plan new-plan.json [the same explicit destination and policy options]
Previews never apply writes. Applications must be closed; unknown state and native locks block apply.
Modes: --mode create|update|upsert. Stored secrets are never copied. No force/lock bypass is provided.
```

## write-status

```text
write-status [destination options]: inspect process, lock and registry capability diagnostics
Registry policy: --registry-mode transactional|guarded (repeat with apply; no automatic fallback)
write --input profiles.json --preview new-plan.json [destination options]
sync --from <application> --profile <path> --target-path <path> --preview new-plan.json
apply --plan new-plan.json [the same explicit destination and policy options]
Previews never apply writes. Applications must be closed; unknown state and native locks block apply.
Modes: --mode create|update|upsert. Stored secrets are never copied. No force/lock bypass is provided.
```

## check

```text
Usage: filezilla-js check <path> [--file <xml>] [--json] [--host-key-sha256 <pin>]
  --password-stdin       Read one password/passphrase from redirected input (never argv)
  --directory <path>     Check directory metadata after connecting
  --include-listing      Include a shallow directory listing (off by default)
  --max-entries <count>  Limit optional listing output (default 1000)
  --timeout-ms <ms>      Overall deadline including redirected input (default 30000)
```

## Declared source and write options

These rows come from the CLI source option definitions and shared write option contract. Arguments taking values are described in the command reference.

| Option | Meaning |
| --- | --- |
| `--registry-mode` | transactional (default) or explicit non-atomic guarded registry mode |
| `--input` | Normalized profile/mutations JSON |
| `--preview` | Save a new preview JSON file (never applies it) |
| `--plan` | Saved preview for explicit apply |
| `--mode` | create (default), update or upsert |
| `--allow-lossy` | Acknowledge listed directory/metadata omissions |
| `--from` | Source application for one-way sync |
| `--from-file` | Source native configuration file |
| `--from-directory` | Source portable directory |
| `--from-registry` | Source session registry key |
| `--from-config` | Source JetBrains IDE config |
| `--from-project` | Source JetBrains project |
| `--profile` | Exact source profile path |
| `--target-path` | Exact destination profile path |
| `--connection` | Selected source connection ID |
| `--scope` | JetBrains destination global or project scope |
