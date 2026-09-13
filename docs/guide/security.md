# Security

Applications decide which sites, keys, local files and remote paths users may access. The connectors provide transport operations, not an application authorization layer.

## Credentials and XML

Use `includePasswords: false` for inventory and the exact returned canonical `credentialPath` for selected credentials. The complete file is read during synchronous parsing, but original XML is no longer retained. Manager/server `toJSON()` projections omit passwords. Explicit `properties`/`propertiesRaw` APIs still contain intentionally loaded credentials; metadata may reveal hosts, users and local paths even after password redaction.

Plaintext password and username whitespace is preserved. Base64 is recoverable encoding, and protected FileZilla passwords are not decrypted. No OS vault, credential store or secure memory erasure is supplied. Optional `credentialProvider` hooks delegate retrieval and caching policy to the application.

The reader rejects DTD/entity declarations and malformed documents globally. Strict mode rejects invalid supported fields and duplicate canonical identities; tolerant reports exclude affected records and mark the inventory incomplete. It has no configurable input-size, nesting or server-count budget. Apply resource limits before accepting untrusted uploaded Site Manager files. The public `Server` constructor still assumes the typed values supplied by its caller; reader validation does not validate arbitrary direct connector objects.

## Verify transport identity

For FTPS, keep certificate validation enabled and provide only trusted private CAs through `secureOptions`. Saved protocol `FTP` requires explicit TLS rather than silently falling back to plaintext.

For SFTP, supply `hostVerifier`, or set `requireTrustPolicy: true` with both `hasTrustPolicy` and `acceptTrustPolicy`. The requirement is opt-in; an unconfigured compatibility connection still accepts host keys. If both verifier and callbacks are supplied, both layers must accept.

Trust decisions belong to the application. A Site Manager XML import is not a trusted-host import. Review first-use fingerprints and changed keys independently; persist only explicit acceptance. The [SFTP guide](/guide/sftp) describes the separate read-only FileZilla importer; [SSH options](/guide/ssh-options) covers optional managed persistence with explicit approvals and concurrency checks.

## Filesystem boundaries

`initialPath` is a starting location, not containment. Absolute paths, parent traversal and intermediate symlinks remain application/server concerns. Final-component `stat` checks do not protect every transfer/delete operation. Use narrowly scoped remote accounts and application path rules.

`privateKeyPath` reads a local file: a service must restrict it to approved keys rather than accepting arbitrary paths from untrusted requests.

**Unresolved upstream boundaries:** SFTP status conversion can turn a generic SFTP status into false absence; Windows path normalization changes wrapper paths on Windows and can miss traversal. Typed errors and cancellation do not resolve these upstream behaviors. See [specification](/reference/specification).

## Logs, dependencies and retry decisions

CLI list/get output masks passwords; `--show-password` intentionally reveals them. Avoid sending credential output to shared terminals, logs or screenshots. List/get masking occurs after credentials have been loaded. The read-only check loads only its selected credential, and its fixed JSON messages never serialize raw transport errors or credentials.

The [current dependency review](/reference/specification) records live production, full development and separate documentation audit results, plus outstanding upgrade constraints. Test-fixture advisories must remain visible even when published runtime dependencies are clear. Run audit with explicit online access; an inherited offline setting can otherwise produce a misleading empty result.

Automatic retry does not prove a mutation is safe to repeat. Replayable upload factories explicitly permit restarting an overwriting upload; callers still own source identity, conflicts, partial-file recovery and final publication decisions.
