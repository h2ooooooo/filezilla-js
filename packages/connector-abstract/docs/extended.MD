# Shared connector API

Generic transfer classes, errors and tools are implemented by `@jalsoedesign/dockline-abstract` and re-exported here for compatibility. FileZilla-specific factories/registry and read-only FileZilla host-key import remain in this repository. Concrete factories support `toConfig(server, options?)` for the shared Dockline SDK as well as existing `fromServer` adapters. See the repository VitePress guide for complete configuration and single-file examples.

The current [public API index](../../../docs/reference/public-api.md) documents every shared export. [Errors](../../../docs/reference/errors.md), [operation options](../../../docs/reference/configuration.md), [transfer tools](../../../docs/guide/advanced-transfers.md) and [pools/registry](../../../docs/guide/connection-pools.md) describe their full defaults and ownership contracts.

## Factory contract

`ConnectorFactory<TConnector extends StorageAdapter, TOptions = unknown>` declares the instance method `fromServer(server: Server, options?: TOptions): TConnector`. Concrete factories also offer static convenience methods. Factory construction is disconnected; connection use validates authentication, trust and protocol settings.

## Custom connector requirements

Implement the actual Flystorage StorageAdapter methods, including async-generator `list` and stream-returning `read`; there are no shared `get`/`put` method names. Import shared errors to preserve runtime identity. [Storage adapter reference](../../../docs/reference/storage-adapter.md) lists supported and unsupported operations.

Standalone publication/copy helpers require the stronger `TransferConnector` shape: a synchronous policy-preflight hook, exclusive staging-directory creation, nonrecursive empty-directory cleanup and a rename that enforces its declared overwrite/atomic guarantee. Do not infer those guarantees from a generic adapter interface.

Register a custom factory explicitly with `ConnectorRegistry`; no dependency discovery or automatic plugin loading occurs. `ConnectorPool` requires independent owned sessions from its creation callback and retains leases through streams and iterators. Progress helpers report completion only when the connector confirms complete protocol success.

These runtime helpers have dedicated regression tests in `packages/connector-abstract/tests`; run `npm run test:shared` from the repository root.
