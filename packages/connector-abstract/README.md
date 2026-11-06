# @jalsoedesign/filezilla-connector-abstract

FileZilla-specific factory and numeric-protocol registration contracts. Generic transport classes, errors, pools, progress, bandwidth and transfer utilities are imported directly from @jalsoedesign/dockline-abstract.

## Public API

- ConnectorFactory maps a FileZilla Server through fromServer/fromProfile.
- ConnectorRegistry dispatches FileZilla numeric protocols to explicitly registered factories.
- RegisteredProvider and Registration retain provider-specific option/result types.

No FTP/SFTP implementation is included or re-exported. The shared Portline contracts are application-independent; this package supplies the FileZilla-native binding.

See the [architecture and migration guide](https://h2ooooooo.github.io/filezilla-js/guide/dockline), [exact public signatures](https://h2ooooooo.github.io/filezilla-js/reference/types) and [Dockline API](https://h2ooooooo.github.io/dockline/reference/api).

## License

MIT.
