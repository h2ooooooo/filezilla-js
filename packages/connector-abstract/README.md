**[Read the documentation](https://h2ooooooo.github.io/filezilla-js/)**

# @jalsoedesign/filezilla-connector-abstract

Generic transfer classes, errors and tools are implemented by `@jalsoedesign/dockline-abstract` and re-exported here for compatibility. FileZilla-specific factories/registry and read-only FileZilla host-key import remain in this repository. Concrete factories support `toConfig(server, options?)` for the shared Dockline SDK as well as existing `fromServer` adapters. See the repository VitePress guide for complete configuration and single-file examples.

Shared connector errors, operation and credential contracts, transfer tools, bandwidth budgets, connection pools and explicit provider registration for FileZilla JS.

## Install and build

Use Node `^22.22.2 || ^24.15.0 || >=26.0.0`. The package uses the published Dockline dependency and FileZilla core types.

From the repository root:

```sh
npm ci
npm run build
npm run test:shared
```

## Main APIs

| API | Purpose |
| --- | --- |
| `ConnectorFactory<TConnector, TOptions>` | Map a selected Server and typed options into a disconnected adapter. |
| Shared `ConnectorError` hierarchy | Catch the same runtime error classes across FTP and SFTP. |
| `ConnectorPool` | Bound independent sessions across transfers, metadata, listings and resource lifetime. |
| `ConnectorRegistry` | Explicitly register factories; returned handles preserve provider-specific types. |
| `BandwidthBudget`, progress options | Share average upload/download rates and observe complete transfer outcomes. |
| `publishFile`, `checksumDetails`, `copyFileWithStrategy`, `walk` | Explicit bounded transfer and inventory strategies. |

See the [public API index](https://h2ooooooo.github.io/filezilla-js/reference/public-api.html), [error reference](https://h2ooooooo.github.io/filezilla-js/reference/errors.html), [configuration](https://h2ooooooo.github.io/filezilla-js/reference/configuration.html), [transfer guarantees](https://h2ooooooo.github.io/filezilla-js/guide/advanced-transfers.html) and [pool ownership](https://h2ooooooo.github.io/filezilla-js/guide/connection-pools.html). The [extended reference](https://github.com/h2ooooooo/filezilla-js/blob/main/packages/connector-abstract/docs/extended.MD) summarizes the contract for custom connectors.

The package has its own option, transfer, publication and pool regression suites. Root `npm run lint`, `npm test` and `npm run check:consumer` validate integration and packaged declarations.

## License

MIT © JalsoeDesign.
