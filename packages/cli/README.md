**[Read the documentation](https://h2ooooooo.github.io/filezilla-js/)**

# @jalsoedesign/filezilla-cli

The network check and connector recipes now use Dockline through the FileZilla settings bridges. FileZilla owns reading/selection and host-key import; the separate Dockline FTP/SFTP packages own transport. The CLI remains `list`, `get`, and read-only `check`.

[![npm version](https://img.shields.io/npm/v/@jalsoedesign/filezilla-cli.svg)](https://www.npmjs.com/package/@jalsoedesign/filezilla-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/h2ooooooo/filezilla-js/actions/workflows/ci.yml/badge.svg)](https://github.com/h2ooooooo/filezilla-js/actions/workflows/ci.yml)

Command-line interface for querying FileZilla `sitemanager.xml` files and optionally checking a connection without remote mutations. Metadata queries use [`@jalsoedesign/filezilla-core`](../core/README.md); the opt-in check uses the public FTP/SFTP connectors.

## Why

Connection details already live in FileZilla. This CLI lets you query them directly from the terminal, making it easy to pipe host names, users, or passwords into scripts and automation without copying values by hand.

## Install

Use Node `^22.22.2 || ^24.15.0 || >=26.0.0`. Install from the public npm registry.

```bash
npm install -g @jalsoedesign/filezilla-cli
```

## Quick start

Get FileZilla sites as JSON with a single command.

### List all sites
```bash
filezilla-js list --json
```
```json
[
  {
    "path": "SFTP (root location)",
    "host": "test.rebex.net",
    "protocol": "SFTP"
  },
  {
    "path": "Rebex/SFTP",
    "host": "test.rebex.net",
    "protocol": "SFTP"
  }
]
```

### Get specific site details
```bash
filezilla-js get "Rebex/FTP" --json
```
```json
{
  "path": "Rebex/FTP",
  "host": "test.rebex.net",
  "port": 21,
  "protocol": 6,
  "protocolName": "INSECURE_FTP",
  "user": "demo",
  "password": "(hidden)",
  "remoteDirectory": "/pub/example"
}
```

## Documentation

For detailed information on all flags, output formats (Table, Generic), and error handling, see the [Extended Documentation](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/cli/docs/extended.MD).

## Testing

To run the CLI tests:

```bash
npm test
```

## Commands

### `list`

Lists all servers in the FileZilla configuration.

```bash
filezilla-js list [--file <path>] [--json] [--table] [--search <term>] [--recurse] [--full] [--show-password]
```

**Example: Recursive JSON output**

```bash
filezilla-js list --json --recurse
```

```json
{
  "name": "Root",
  "folders": [
    {
      "name": "Rebex",
      "folders": [],
      "servers": [
        {
          "path": "Rebex/SFTP",
          "host": "test.rebex.net",
          "port": 22,
          "protocol": 1,
          "protocolName": "SFTP",
          "user": "demo",
          "password": "(hidden)"
        }
      ]
    }
  ],
  "servers": []
}
```

### `get`

Retrieves details for a specific server, or a single property value.

```bash
filezilla-js get <path> [property] [--file <path>] [--json] [--table] [--search <term>] [--show-password]
```

**Example: Get as JSON**

```bash
filezilla-js get "Rebex/FTP" --json
```

```json
{
  "path": "Rebex/FTP",
  "host": "test.rebex.net",
  "port": 21,
  "protocol": 6,
  "protocolName": "INSECURE_FTP",
  "user": "demo",
  "password": "(hidden)",
  "remoteDirectory": "/pub/example"
}
```

## More Examples (JSON)

### List as JSON (Summary)

```bash
filezilla-js list --file packages/core/fixtures/general/sitemanager.multi.xml --json
```

```json
[
  {
    "path": "SFTP (root location)",
    "host": "test.rebex.net",
    "protocol": "SFTP"
  },
  {
    "path": "Rebex/SFTP",
    "host": "test.rebex.net",
    "protocol": "SFTP"
  }
]
```

### Get as JSON (Full)

```bash
filezilla-js get "SFTP (root location)" --file packages/core/fixtures/general/sitemanager.multi.xml --json
```

```json
{
  "path": "SFTP (root location)",
  "host": "test.rebex.net",
  "port": 22,
  "protocol": 1,
  "type": 0,
  "user": "demo",
  "password": "(hidden)",
  "logonType": 1,
  "timezoneOffset": 0,
  "passiveMode": 0,
  "maximumMultipleConnections": 0,
  "encodingType": 2,
  "bypassProxy": false,
  "name": "SFTP (root location)",
  "comments": "",
  "localDirectory": "",
  "remoteDirectory": "",
  "synchronizedBrowsing": false,
  "directoryComparison": false,
  "protocolName": "SFTP"
}
```

## Read-only connection check and recipes

`filezilla-js check "Production" --file ./sites.xml --host-key-sha256 <verified-pin> --json` uses an exact site selection and independently verified SFTP trust. Passwords come from the selected site or redirected `--password-stdin`; there is no password argument or automatic trust approval. `--directory` and `--include-listing` enable optional metadata work.

See [connection checks](https://h2ooooooo.github.io/filezilla-js/guide/connection-check.html) for strict flags, deadlines, cleanup results and stable exit codes. Existing list/get parsing and output are unchanged. The package also includes [typed transfer recipes](https://h2ooooooo.github.io/filezilla-js/guide/transfer-recipes.html) in `examples/transfer-recipes.ts`; these are application source examples, not CLI transfer commands.

## License

MIT © [JalsoeDesign](https://www.jalsoedesign.net)
