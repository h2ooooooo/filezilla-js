# Shared connection integration

FileZilla does not publish protocol factory or numeric-protocol registry packages. `FileZillaProfileSource` interprets native protocol identifiers and produces Portline connection definitions. The shared `@jalsoedesign/portline-dockline` bridge selects the appropriate installed client.

Select an exact saved profile, provide explicit runtime credentials/trust as needed, and use a scoped file or SSH operation. Missing clients and unsupported definitions fail explicitly. A saved SFTP endpoint can be selected for SSH commands; the server determines whether command execution is allowed. FTP definitions do not imply a second SSH endpoint.

| Shared bridge method | Result |
| --- | --- |
| `toConfig(profileOrPath, options)` | Promise of file-transfer configuration; does not open a socket |
| `toSshConfig(profileOrPath, options)` | Promise of resolved SSH configuration; trust services still belong to `withSsh` |
| `createFileAdapter(profileOrPath, options)` | Promise of a disconnected Dockline adapter; the caller owns connect/disconnect |
| `withFiles(profileOrPath, callback, options)` | Connected Dockline file API scoped to the awaited callback |
| `withSsh(profileOrPath, callback, options)` | Connected SSH command session scoped to the awaited callback |

`profileOrPath` is a normalized `ConnectionProfile` or an exact path from the bridge's configured source. Use `connectionId` when several compatible definitions exist. Credentials and resolved configuration must not be logged. Callback resources must be fully consumed before the callback returns.

See the [file-transfer walkthrough](/guide/quick-start), [SSH walkthrough](/guide/ssh) and [connection architecture](/guide/dockline).

The complete application-independent methods, runtime options and error codes are maintained in [Portline's shared execution guide](https://h2ooooooo.github.io/portline/integration/execution).
