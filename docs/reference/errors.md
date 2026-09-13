# Error reference

The generic transfer APIs on this page are implemented by the independent **Dockline packages**: `@jalsoedesign/dockline-abstract`, `@jalsoedesign/dockline-ftp-client` and `@jalsoedesign/dockline-sftp-client`. Existing FileZilla connector imports remain supported compatibility exports; saved-site factories and FileZilla host-key import stay in FileZilla JS. See [the project boundary and migration](/guide/dockline).

Import shared connector errors from `@jalsoedesign/filezilla-connector-abstract`. Both concrete connectors re-export the same constructors. Compatible installed copies preserve `instanceof` identity. Core metadata errors and the SFTP known-hosts conflict subclass are described separately below.

## Shared hierarchy

| Class | Parent | Meaning and stable fields |
| --- | --- | --- |
| `ConnectorError` | Error | Base with optional `cause`, `code` and `stage`. |
| `AuthError` | ConnectorError | Authentication rejected; stage `authenticate`. |
| `CredentialProviderError` | AuthError | Provider failed; stage `credentials`, code `CREDENTIAL_PROVIDER_FAILED`. |
| `HostTrustError` | ConnectorError | Host identity rejected; stage `trust`, code `HOST_TRUST_REJECTED`. |
| `TlsTrustError` | HostTrustError | TLS certificate trust failed; inherits the host-trust stage and code. |
| `NameResolutionError` | ConnectorError | DNS failure; stage `resolve`, default code `ENOTFOUND`; the classifier preserves `EAI_AGAIN`. |
| `ConnectionRefusedError` | ConnectorError | Connection refused; stage `connect`, code `ECONNREFUSED`. |
| `DirectoryAccessError` | ConnectorError | Initial-directory setup failed; stage `directory`, optional underlying status code. |
| `NotFoundError` | ConnectorError | Confirmed missing resource where the dependency preserves that distinction; see SFTP status conversion below. |
| `PermissionError` | ConnectorError | Requested access was denied. |
| `UnsupportedProtocolError` | ConnectorError | No connector supports the selected protocol. |
| `NotSupportedError` | ConnectorError | Unsupported operation, strategy, option or protocol guarantee. |
| `OperationAbortedError` | ConnectorError | Cancellation; code `ABORT_ERR`. |
| `OperationTimeoutError` | ConnectorError | Deadline expired; code `ETIMEDOUT`. |
| `ConnectionClosedError` | ConnectorError | Session closed; code `ECONNRESET`. |
| `ResourceLimitError` | ConnectorError | A checksum/copy byte budget was exceeded. |
| `IntegrityError` | ConnectorError | Digest, full-file hash response or observed file-size verification failed. |
| `PoolClosedError` | ConnectorError | Acquisition/use is incompatible with a closed pool or revoked lease. |
| `PublicationError` | ConnectorError | Composed publication failed; inspect the explicit remote `state` before recovery. |

`ConnectionStage` is `'resolve' | 'connect' | 'trust' | 'authenticate' | 'directory' | 'credentials' | 'ready'`. It is optional when the transport cannot identify a stage. Catch specific subclasses before their parents. SFTP's deprecated `KeyAuthError` is an alias of `AuthError`.

## Constructors and causes

The base signature is:

`new ConnectorError(message, cause?, code?, stage?)`

`AuthError`, `NotFoundError`, `PermissionError`, `UnsupportedProtocolError`, `NotSupportedError`, `ResourceLimitError`, `IntegrityError` and `PoolClosedError` inherit that signature. `AuthError` fixes its effective stage to `authenticate`.

Lifecycle, trust, refusal and provider classes instead accept an optional message and choose their own codes/stages. `NameResolutionError(message?, code?)` and `DirectoryAccessError(message?, code?)` accept a second status-code argument. `TlsTrustError` inherits the host-trust constructor. Do not pass a cause as a second argument to those constructors.

The base permits an application-owned cause, but connector wrappers intentionally omit raw transport/provider causes that could contain credentials. A classifier is not a general log sanitizer. `classifyConnectionError(error, stage)` preserves specific shared error instances and maps known connection failures; callers using that helper directly must sanitize transport messages first. Applications should avoid serializing arbitrary error objects or relying on English message matching.

## Publication recovery state

`new PublicationError(message, state)` requires:

| State field | Values |
| --- | --- |
| `destination` | Requested remote destination |
| `temporaryPath` | Optional owned staging directory |
| `phase` | prepare, upload, verify, rename, cleanup |
| `outcome` | not-published, published, uncertain |
| `cleanup` | done, retained, failed |

An uncertain rename acknowledgement is not permission to replay a publication. Read the destination and retained state before deciding recovery. A successful rename with failed housekeeping returns a successful `PublicationResult` with `cleanup: 'failed'`; it does not throw a new transfer failure. See [transfer guarantees](/guide/advanced-transfers#publication-and-overwrite-behavior).

## Core import and metadata failures

`MetadataSnapshotError`, exported by `@jalsoedesign/filezilla-core`, extends ordinary `Error`, not `ConnectorError`. Its constructor is `(code, message)`; codes are `UNSUPPORTED_SCHEMA`, `INVALID_SNAPSHOT` and `PROFILE_MISMATCH`.

Identity-store schema/configuration validation uses `TypeError`. Reconciliation conflicts are returned as data (`AMBIGUOUS_IDENTITY`, `ENDPOINT_CHANGED`, `SOURCE_ID_CHANGED`) with `committed: false`, not thrown as a connector exception. Strict imports, invalid documents and file I/O can throw ordinary errors. Tolerant record diagnostics are structured redacted data; see [import workflows](/guide/import-workflows).

## Managed host-store failures

`KnownHostsConflictError` is exported by `@jalsoedesign/filezilla-connector-sftp` and extends `HostTrustError`. Its zero-argument constructor indicates that the trusted record changed while approval was pending. Inspect and ask for approval against the new state; do not repeat an old approval. Store validation/locking can throw `ConnectorError`, cancellation uses `OperationAbortedError`, and filesystem failures may retain their ordinary Node error identity. See [managed known hosts](/guide/ssh-options#managed-known-hosts-storage).

## Recovery boundaries

Configuration validation can also throw `TypeError` or `RangeError`; do not assume every rejection is a network error. Callers should preserve unknown errors instead of automatically retrying them.

Automatic reconnect is opt-in and `maxTransientRetries` defaults to three extra eligible attempts. Authentication, trust, permission, cancellation and unsupported operations are not transient-retry candidates. A returned read or started mutation cannot be made replay-safe by its error class alone. [Errors and reconnecting](/guide/errors) describes operation ownership and optional Flystorage wrapping.

**SFTP status conversion remains upstream:** the SFTP dependency can convert generic status 4 into missing. An existence check can therefore report false without confirmed absence. **Windows path normalization remains upstream:** the optional Flystorage wrapper's default Windows normalizer has traversal/separator limitations. Neither is an npm advisory count or fixed by these error classes.
