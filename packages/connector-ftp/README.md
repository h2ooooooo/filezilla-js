# @jalsoedesign/filezilla-connector-ftp

Maps saved FileZilla FTP/FTPS sites to Dockline. Public exports are FtpConnectorFactory and FtpConnectorFactoryOptions. The factory maps protocol/TLS, host/account, authentication mode, starting directory, passive mode and filename encoding; unsupported saved modes are refused.

Use FtpConnectorFactory.toConfig(site, options) with Dockline.withConnection for scoped SDK transfers. FtpConnectorFactory.fromServer(site, options) returns a disconnected Dockline adapter when explicit adapter lifecycle is needed. Both static and instance methods are available.

For a generic connection, import FtpConnector from @jalsoedesign/dockline-ftp-client directly. This FileZilla package does not export generic connector classes, types or errors.

See the [complete saved-site example](https://h2ooooooo.github.io/filezilla-js/guide/quick-start), [import migration](https://h2ooooooo.github.io/filezilla-js/guide/dockline), [exact signatures](https://h2ooooooo.github.io/filezilla-js/reference/types) and [local runnable examples](https://h2ooooooo.github.io/filezilla-js/guide/local-demo).

## License

MIT.
