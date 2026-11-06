# Automation and troubleshooting

Use `--json` and check the exit status before reading stdout as a success result. [CLI behavior](/reference/cli) documents legacy query shapes, permissive parsing and command-specific differences. [Connection checks](/guide/connection-check) have a separate versioned JSON contract and status-specific exit codes. Do not treat every FileZilla command as the same protocol.

```sh
filezilla-js get Demo host --file ./sitemanager.xml --json
```

With the [quick-start fixture](/cli/quick-start), this exits 0 and prints `"127.0.0.1"`. Missing paths/files and malformed native settings have [captured failure examples](/reference/cli-output).

Passwords remain masked by default. Search uses `(hidden*)` and a highlighted `--show-password` footer when a saved value is hidden. The key path and remote directory are metadata; showing them does not read the private key. Legacy queries can load credentials before masking, so choose the API with explicit options when credential-loading control is required.

| Problem | What to check |
| --- | --- |
| Wrong default settings file | Pass an explicit `--file`; default discovery does not detect every launcher override. |
| Exact lookup fails | Copy the canonical path from list output, preserving encoding and case. |
| Search differs between commands | Standalone search uses all fields; list/get search retains name/path semantics. |
| Connection check rejects trust | Obtain the SFTP fingerprint independently and pass the documented check option. |
| Write preview is stale/busy | Close FileZilla, reread state and regenerate/review the preview; do not bypass guards. |

Use [complete inputs](/reference/cli-help), [captured outputs](/reference/cli-output) and [troubleshooting](/guide/troubleshooting) for precise cases.
