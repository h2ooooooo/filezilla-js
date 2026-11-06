# @jalsoedesign/filezilla-connector-sftp

Maps saved FileZilla SFTP sites to Dockline and reads modern FileZilla trusted-host metadata. Public exports are SftpConnectorFactory, SftpConnectorFactoryOptions and FileZillaHostKeyStore.

The factory maps host/account, saved logon modes, key paths, passphrases and remote starting directories. Use toConfig(site, options) with Dockline.withConnection or fromServer(site, options) for a disconnected Dockline adapter. Trust must be supplied explicitly; a saved site alone does not establish host trust. FileZillaHostKeyStore is an explicit read-only hostkeys.xml snapshot.

For generic connections, import SftpConnector and KnownHostsStore from @jalsoedesign/dockline-sftp-client and shared errors/types from @jalsoedesign/dockline-abstract. This package does not re-export those APIs. SSH/SFTP key parsing delegates to dockline-keys: supported OpenSSH, PPK v2/v3, PKCS#8 and traditional PEM inputs, including encrypted keys, are normalized in memory. Explicit conversion and encrypted exports belong to dockline-keys.

See the [complete saved-site example](https://h2ooooooo.github.io/filezilla-js/guide/quick-start), [FileZilla host-key import](https://h2ooooooo.github.io/filezilla-js/guide/sftp), [import migration](https://h2ooooooo.github.io/filezilla-js/guide/dockline) and [exact signatures](https://h2ooooooo.github.io/filezilla-js/reference/types).

## License

MIT.
