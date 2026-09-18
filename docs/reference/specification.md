# Behavior specification

## Repository and configuration boundary

FileZilla core owns reading and metadata. FileZilla factories own conversion to plain Dockline configuration and retain the old disconnected-adapter API. Dockline owns the actual protocol implementation and generic transfer tools; compatibility exports share its class/error identity. XML write-back remains outside the API.

## Reading and selecting

- The synchronous reader validates well-formed XML and supported fields, rejects DTD/entity declarations and normalizes singleton/array collections.
- Required host/name/port/protocol fields and supported numeric/boolean values are checked. Unknown accepted protocol IDs remain metadata, not connector support.
- Plain/base64 credentials preserve decoded text. Protected encodings are omitted; selected loading uses the same canonical identity as lookup.
- Canonical components escape percent/slash, and duplicate identities fail before credential decoding.
- Original XML is not retained; manager/server JSON omit passwords and retain raw remote-directory metadata.
- Exact lookup is case-sensitive; search is case-insensitive. Default name/path search does not decode remote paths; `{fields: 'all'}` tries decoding and falls back to raw values. Explicit decoded-directory access remains strict.

## Connecting and trust

- Factories support static/instance methods with options and return disconnected adapters.
- FTP 0/4 require explicit TLS, 3 implicit TLS and 6 plaintext. Active FTP remains unsupported.
- SFTP accepts password, key, explicit agent and string/callback keyboard-interactive authentication, plus credential providers, raw-key verification and optional required has/accept trust callbacks.
- Site settings alone are not host trust. The modern FileZilla importer remains read-only. Optional KnownHostsStore persistence requires explicit first-use/changed-key approval; the library never silently accepts a newly observed key.
- Unconfigured SFTP compatibility behavior still accepts keys because requireTrustPolicy is opt-in.
- FTP queues full operations; SFTP coalesces connection setup and tracks active lifetimes. A separate ConnectorPool bounds all leased sessions, including metadata and directory work.

## Transfer and recovery

- Upload completion is its returned promise. Failures may leave partial remote files.
- Reads return early and must be consumed. FTP also waits for final control confirmation; SFTP closes its source on cancellation and preserves mapped errors.
- Per-attempt deadlines and abort signals are honored. autoReconnect defaults false; maxTransientRetries defaults to three extra eligible attempts.
- Fresh upload factories permit full overwriting replay under explicit reconnection policy. One-shot uploads, returned reads and started mutations are not universally replayed.
- FTP mkdir restores CWD or invalidates the session. Directory create/delete recurse; rename/copy semantics remain server-dependent.
- Copy strategies are explicit, defaulting to bounded same-session client streaming with local disk staging. Checksums default to server-only, with explicit streamed fallback. Visibility/URL/MIME operations remain unsupported.
- SFTP timestamps use modifyTime in milliseconds; timestamp zero is valid. Some FTP metadata can be absent.

## Remaining boundaries

Shared errors have one runtime identity and limited configured-secret redaction. **SFTP status conversion remains upstream:** SFTP dependency status conversion can falsely report absence. **Windows path normalization remains upstream:** the default Flystorage wrapper has Windows path-normalization/traversal defects. No external dependency source was modified.
