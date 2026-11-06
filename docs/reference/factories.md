# Factories and transport errors

FileZilla's `ConnectorFactory` and concrete FTP/SFTP factories translate a native `Server` into a Dockline configuration or disconnected adapter. `ConnectorRegistry` dispatches numeric FileZilla protocols to explicitly registered providers.

| API | Result |
| --- | --- |
| `Factory.toConfig(server, options)` | Plain Dockline connection configuration; does not connect |
| `Factory.fromServer(server, options)` | Dockline adapter with saved settings applied; caller owns connect/disconnect |
| `registry.register(provider)` | Typed FileZilla registration handle |
| `registry.fromServer(server, options)` | Runtime dispatch to a registered FileZilla factory |

Both concrete factories expose static and instance methods. Saved logon modes, key paths, directories, passive/TLS choices and charset settings are interpreted by the FileZilla integration; transports and generic connection policy are implemented by Dockline. The shared Portline factory/registry contracts are application-independent, while the FileZilla wrapper uses native `Server` and numeric protocol values.

Transport errors come from `@jalsoedesign/dockline-abstract`. Import them directly; FileZilla does not re-export their constructors. A factory can refuse an unsupported saved protocol or logon mode before connecting. An adapter returned by `fromServer` throws Dockline errors during transport operations. See [Dockline errors](https://h2ooooooo.github.io/dockline/guide/errors), [FileZilla mapping](/guide/dockline) and the [exact signatures](/reference/types).
