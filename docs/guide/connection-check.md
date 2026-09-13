# Read-only connection checks

`filezilla-js check` opens a connection using an exact saved site and closes it after the requested checks. It uses the same public connectors and ordinary `connect`, `stat` and `list` operations as application code. There is no separate diagnostic connection API.

```sh
filezilla-js check "Production" --file ./sites.xml --json \
    --host-key-sha256 "SHA256:independently-verified-public-fingerprint"
```

The fingerprint above is a placeholder. Supply the complete SHA256 fingerprint independently verified with the server owner; the command does not trust a key merely because the server presents it.

## What runs

By default the command connects and authenticates, then disconnects. It does not list directories or transfer files. A connector may perform protocol negotiation or enter the saved initial directory as part of connection setup. Add `--directory` for a directory metadata check, and `--include-listing` for a shallow listing:

```sh
filezilla-js check "Production" --file ./sites.xml \
    --host-key-sha256 "SHA256:independently-verified-public-fingerprint" \
    --directory /releases --include-listing --max-entries 100
```

No write, upload, rename, mkdir or delete operation is part of the command. A read-only check still authenticates and creates server-side access logs. FTP metadata inspection can require a directory listing internally because the protocol does not provide a universal single-file stat operation.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `<path>` | Required | Exact canonical saved-site path; no fuzzy search or duplicate selection. |
| `--file <xml>` | Standard FileZilla locations | Site Manager source. |
| `--host-key-sha256 <pin>` | Required for SFTP | Exact OpenSSH-style SHA256 public host-key fingerprint. Optional trailing base64 padding is accepted. |
| `--password-stdin` | Off | Read a password/passphrase from redirected standard input. |
| `--directory <path>` | Unset | Check that this remote path is an accessible directory. Paths follow the connector's saved initial-directory behavior. |
| `--include-listing` | Off | Include a shallow listing of `--directory`, or `.` if no directory is specified. |
| `--max-entries <count>` | `1000` | Maximum listing output entries, from 1 through 100000. Exceeding the limit fails explicitly instead of reporting a truncated success. |
| `--timeout-ms <ms>` | `30000` | Overall deadline, including redirected credential input. Must be a positive integer. |
| `--json` | Off | Emit one versioned JSON result to standard output, including failures. |

Retries and silent reconnect are disabled for this check. The deadline cancels pending operations; the connector is disconnected on success, failure, cancellation and timeout. Cleanup has a separate two-second ceiling so a stuck cleanup operation cannot indefinitely hang the command. `cleanup` reports whether it completed; a failed check retains its original failure status if cleanup also fails.

The listing limit bounds output and application iteration. Current connector directory operations may receive a full shallow directory response internally before yielding entries; the option is not a server-side pagination or memory guarantee.

## Credentials and trust

Only the selected site's password is requested from the importer. Other sites remain metadata-only. An explicitly supplied stdin password overrides the saved password; for key authentication it is a passphrase. When stdin is used, saved password contents are not decoded.

Redirect input from your application's secret provider or a protected descriptor. Passwords are **not** accepted through command-line arguments. Input is limited to 64 KiB, decoded as UTF-8, and one final LF or CRLF is removed; other whitespace is preserved. Embedded newlines and NUL bytes are rejected. `--password-stdin` requires redirected input and does not display an interactive terminal prompt. A missing saved credential produces a predictable failure instead of waiting for a prompt.

Supported saved authentication modes are normal password, ask with a supplied stdin password, FTP anonymous and SFTP key files. Interactive, account, profile and ADC modes are rejected by this command; applications can use the richer connector APIs when those workflows are required. SSH agent and keyboard-interactive CLI flags are not provided.

SFTP requires `requireTrustPolicy: true`, an exact pinned-fingerprint comparison and an acceptance hook that always rejects unknown keys. A missing or mismatched pin cannot send the password to the server. The command never updates a trust store or automatically approves a changed key. Standard TLS certificate verification remains enabled for FTP/FTPS configurations; SSH fingerprint flags are rejected for FTP.

## JSON and exit codes

A successful check without optional directory work looks like:

```json
{
    "schemaVersion": 1,
    "ok": true,
    "status": "ok",
    "exitCode": 0,
    "message": "Connection check completed.",
    "stage": "ready",
    "connected": true,
    "directoryChecked": false,
    "cleanup": "closed"
}
```

`listing` is included only after a successful requested listing. Its entries contain only `path`, `type` and a file's `size` where available. JSON does not contain raw transport messages, exception causes, stacks, credentials, usernames or connection configuration. Listing names are explicitly requested remote metadata and can still be sensitive. Human-readable listing paths are quoted so terminal control characters are escaped.

| Exit | Status | Meaning |
| --- | --- | --- |
| `0` | `ok` | Requested checks and cleanup succeeded. |
| `2` | `invalid-options` | Invalid, unknown or missing command options. |
| `3` | `trust-rejected` | Missing/mismatched SFTP pin or failed TLS/server trust. |
| `4` | `authentication-failed` | The server rejected authentication. |
| `5` | `unsupported-protocol` | Unsupported protocol, authentication mode or required connector capability. |
| `6` | `connection-failed` | DNS, connection refusal or another connection failure. |
| `7` | `directory-failed` | Directory lookup, listing or permission failure. |
| `8` | `credentials-required` | No usable credential, invalid redirected credential input or unavailable provider. |
| `9` | `invalid-site` | Invalid source XML, missing source file or non-unique/unavailable exact selection. |
| `10` | `cleanup-failed` | The requested checks succeeded but disconnect did not finish successfully. |
| `11` | `listing-limit` | Optional listing exceeded its entry budget. |
| `124` | `timeout` | Overall or operation deadline exceeded. |
| `130` | `cancelled` | Cancellation, including SIGINT/SIGTERM when delivered by the operating system. |

`stage` preserves a documented typed connector stage when available: `resolve`, `connect`, `trust`, `authenticate`, `credentials` or `directory`. Command-owned stages include `input`, `list`, `cleanup` and `ready`. A stage is context, not a guarantee that every preceding network substep was observed independently. The `cleanup` field is `not-required`, `closed` or `failed`.

## Use the same check from code

```ts
import {checkConnection} from '@jalsoedesign/filezilla-cli';
import {getSiteManager} from '@jalsoedesign/filezilla-core';

const manager = getSiteManager('./sites.xml', {
    credentialPath: 'Production',
});
const server = manager.getServerByPath('Production');

if (!server) {
    throw new Error('The selected site is unavailable.');
}

const result = await checkConnection(server, {
    hostKeySha256: independentlyVerifiedFingerprint,
    timeoutMs: 10000,
    abortSignal,
});
```

The result uses the same schema and classification as the command. If you need to catch the original typed exceptions in a larger workflow, call the connector's ordinary operations directly instead of using this reporting helper.
