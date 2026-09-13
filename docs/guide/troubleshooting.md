# Troubleshooting

| Symptom | Cause or next step |
| --- | --- |
| Toolchain rejects the Node/npm version | Use npm 12.0.2 with the supported root Node range; see installation. |
| An older checkout reports an unsupported workspace protocol | Update manifests and lock together to this repair pass, then use the declared toolchain and `npm ci`. Do not mix old manifests with a new lock. |
| A linked package cannot find `dist/index.js` | Build first; local linking does not compile the package. |
| Default Site Manager is not found | Use an explicit `--file` or `getSiteManager(path, options)` and inspect the process environment. |
| An import now rejects invalid XML or a record | Repair the named field/site. Truncated XML, invalid ports and duplicate canonical identities are deliberately rejected. |
| A saved selection with `%` or `/` in its name no longer resolves | Select again using the returned canonical `server.path`; see migration. |
| A password is absent | It may be excluded, unsaved or protected. Inspect `passwordEncoding` and obtain credentials explicitly. |
| Full property output fails on a remote directory | Full output explicitly decodes that directory. Compact listing and unrelated host/name queries remain usable. |
| FTP TLS fails | Check explicit/implicit mode, port and certificate trust. Do not disable validation or downgrade automatically. |
| Active FTP fails | Use passive mode; active FTP remains unsupported. |
| `HostTrustError` | Supply the required callbacks/verifier and independently review the key. A saved Site Manager site is not proof of host trust. |
| `ConnectionClosedError` after connection loss | Reconnect explicitly or opt into `autoReconnect` for eligible work. |
| FTP appears blocked behind a download | Fully consume/cancel the returned read; it holds the queue until its complete lifetime ends. |
| `OperationTimeoutError` despite retries | Deadlines apply to attempts, and FTP queue waiting can time out. Set an appropriate per-call deadline and external total budget. |
| Upload retry rejects its source | Return a fresh unread stream from the factory; a one-shot or reused stream is not replayable. |
| SFTP unexpectedly reports false absence | Unresolved SFTP status conversion: the upstream dependency can rewrite generic status 4. Do not proceed with destructive work based only on false. |
| Nested wrapper paths fail on Windows | Unresolved Windows path normalization: use direct forward-slash paths or a reviewed custom normalizer. |
| Dependency audit reports advisories | Check the [current dependency review](/reference/specification). Keep runtime, development and docs results separate; do not apply an incompatible downgrade blindly. |
| Audit unexpectedly reports zero while offline | Run with `--offline=false --audit=true`; an inherited offline setting can hide advisory retrieval. Confirm a successful online response. |
| Pool acquisition times out | Fully consume or close streams/iterators and release explicit leases. Every metadata/listing lease also occupies the shared quota. |
| Publication fails or has uncertain rename state | Inspect PublicationError.state and the destination before retrying; default FTP no-replace and atomic policies are unsupported. |
| KnownHostsConflictError after approval | Reload the current trusted identity and review it again; the old approval is stale. |
| A streamed checksum/copy reaches ResourceLimitError | Review the explicitly configured connector/call `maxBytes` limit. Size is unlimited by default; per-call `Infinity` removes an inherited limit. |
| Check refuses an unattended SFTP site | Supply an independently verified host-key pin and the selected saved password/key or redirected password input. Check never approves trust automatically. |
| Docs assets are missing after a rebuild | Restart the preview server; development mode reloads Markdown automatically. |

## Report a reproducible issue

Include package and toolchain versions, protocol, operation, path shape, expected result, error class/code and a minimal synthetic reproduction. Remove credentials, keys and real Site Manager exports. Note whether a fresh connector and disposable local server reproduce the issue. Use the [feature verification record](/reference/specification), not the original pre-repair totals, when reporting the checkout's status.
