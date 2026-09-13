# Connector errors

Generic transfer classes, errors and tools are implemented by `@jalsoedesign/dockline-abstract` and re-exported here for compatibility. FileZilla-specific factories/registry and read-only FileZilla host-key import remain in this repository. Concrete factories support `toConfig(server, options?)` for the shared Dockline SDK as well as existing `fromServer` adapters. See the repository VitePress guide for complete configuration and single-file examples.

The complete [current error reference](../../../docs/reference/errors.md) lists every shared class, constructor, code, stage, publication recovery field and package-specific metadata/trust error. The [usage guide](../../../docs/guide/errors.md) covers catching failures and reconnect policy.

Both concrete connectors re-export the shared runtime constructors. `TlsTrustError` extends `HostTrustError`; `CredentialProviderError` extends `AuthError`; SFTP's `KnownHostsConflictError` is a host-trust subclass. Catch specific classes before their parent. `KeyAuthError` is a deprecated alias of `AuthError`.

The base signature is `ConnectorError(message, cause?, code?, stage?)`, but specialized constructors do not all accept those arguments. Connector wrappers deliberately omit raw sensitive causes. `PublicationError(message, state)` requires explicit remote recovery state; neither cancellation nor a missing acknowledgement proves rollback.

Core `MetadataSnapshotError` and identity/import validation errors are separate from the connector hierarchy. Known upstream T2 false-absence and T12 path-normalization limits remain documented in the current guide.
