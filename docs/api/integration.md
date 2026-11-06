# FileZilla settings and Dockline

FileZilla JS imports native saved-site configuration. Dockline executes generic transfers. A factory converts FileZilla's protocol identifiers, authentication choices, starting directory, charset and supported TLS/SSH options into a Dockline configuration object.

## Map a saved SFTP site

The [saved-site quick start](/guide/quick-start#load-one-sftp-site-connect-and-upload-one-file) shows the complete imports, selected credential loading, independently verified host pin and upload. `SftpConnectorFactory.toConfig(site, options)` returns configuration without connecting. Pass that configuration to `Dockline.withConnection` or `Dockline.connect`.

Configuration can contain credentials; do not log it. FileZilla `Factory.fromServer` compatibility methods return a disconnected Dockline adapter and still require explicit lifecycle management.

## Run a verified local transfer

From an installed checkout after `npm run build`:

```sh
node examples/test-ftp.mjs
node examples/test-sftp.mjs
```

These create synthetic Site Manager entries, run the actual connection-check command, map the same entries through FileZilla factories and transfer bytes through Dockline. They use temporary loopback servers and verify the downloaded content. Read [the captured input/output transcripts](/guide/local-demo).

## Generic operations

For upload/download, streams, listing, rename/remove, pools, progress, checksums and publication policies, follow [Dockline's API documentation](https://h2ooooooo.github.io/dockline/api/). Use [Dockline SSH](https://h2ooooooo.github.io/dockline/ssh/quick-start) and [key utilities](https://h2ooooooo.github.io/dockline/keys/) directly for those tasks. FileZilla wrappers do not add another generic connector class.

FileZilla-specific differences remain here: [FTP/TLS mapping](/guide/ftp), [saved SFTP authentication and trust](/guide/sftp), [encoding/options](/guide/ftp-options), and [native host-key import](/guide/ssh-options). A normalized Portline source retains metadata; FileZilla's concrete factories provide the application-specific Dockline mapping.
