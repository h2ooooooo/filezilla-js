# SFTP Connector Extended Documentation

Generic transfer classes, errors and tools are implemented by `@jalsoedesign/dockline-sftp-client` and re-exported here for compatibility. FileZilla-specific factories/registry and read-only FileZilla host-key import remain in this repository. Concrete factories support `toConfig(server, options?)` for the shared Dockline SDK as well as existing `fromServer` adapters. See the repository VitePress guide for complete configuration and single-file examples.

Detailed reference for `@jalsoedesign/filezilla-connector-sftp`.

## Protocols

This connector supports the SFTP (SSH File Transfer Protocol).

## Connector Factory

### `SftpConnectorFactory`

The factory class responsible for creating SFTP connector instances.

#### Methods

- `fromServer(server: Server, options?: SftpConnectorFactoryOptions): SftpConnector`\
  Creates a disconnected connector. Key authentication is selected by the saved logon mode and supports a saved key file or explicit key override. Options include trust hooks, credentials/providers, agents, interactive handlers and shared operation controls. See [SSH options](../../../docs/guide/ssh-options.md) and [factory contracts](../../../docs/reference/factories.md).

## Connector operations

The [storage adapter reference](../../../docs/reference/storage-adapter.md) lists read/write, metadata, directory, rename, copy, checksum, publication, traversal and capability methods. [Configuration](../../../docs/reference/configuration.md) documents constructor and per-call controls. [Public API index](../../../docs/reference/public-api.md) lists package-specific exports and the stronger contract needed by custom adapters.

## Error Handling

All SFTP-specific errors are derived from the shared [`@jalsoedesign/filezilla-connector-abstract`](../../connector-abstract/docs/errors.MD) hierarchy.

---

## License

MIT © [JalsoeDesign](https://www.jalsoedesign.net)
