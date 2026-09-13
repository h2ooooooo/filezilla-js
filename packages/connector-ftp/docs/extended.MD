# FTP Connector Extended Documentation

Generic transfer classes, errors and tools are implemented by `@jalsoedesign/dockline-ftp-client` and re-exported here for compatibility. FileZilla-specific factories/registry and read-only FileZilla host-key import remain in this repository. Concrete factories support `toConfig(server, options?)` for the shared Dockline SDK as well as existing `fromServer` adapters. See the repository VitePress guide for complete configuration and single-file examples.

Detailed reference for `@jalsoedesign/filezilla-connector-ftp`.

## Protocols

This connector supports the following protocols as defined in FileZilla:

- **FTP**: Explicit TLS, with no plaintext fallback.
- **INSECURE_FTP**: Explicitly selected plaintext FTP.
- **FTPS**: FTP over SSL (Implicit).
- **FTPES**: FTP over SSL (Explicit).

## Connector Factory

### `FtpConnectorFactory`

The factory class responsible for creating FTP connector instances.

#### Methods

- `fromServer(server: Server, options?: FtpConnectorFactoryOptions): FtpConnector`\
  Creates a disconnected connector and maps TLS mode from `ServerProtocol`. Options include TLS configuration, credential providers, filename policy and shared connection/operation controls. Ask/interactive modes require a provider. See [FTP options](../../../docs/guide/ftp-options.md) and [advanced transfers](../../../docs/guide/advanced-transfers.md).

## Connector operations

The [storage adapter reference](../../../docs/reference/storage-adapter.md) lists read/write, metadata, directory, rename, copy, checksum, publication, traversal and capability methods. [Configuration](../../../docs/reference/configuration.md) documents constructor and per-call controls. [Public API index](../../../docs/reference/public-api.md) lists package-specific exports and the stronger contract needed by custom adapters.

## Error Handling

All FTP-specific errors are derived from the shared [`@jalsoedesign/filezilla-connector-abstract`](../../connector-abstract/docs/errors.MD) hierarchy.

Example:

```ts
try {
    await connector.connect();
} catch (err) {
    if (err instanceof AuthError) {
        // Handle login failure
    }
}
```

---

## License

MIT © [JalsoeDesign](https://www.jalsoedesign.net)
