# FileZilla settings and Dockline

FileZilla JS interprets native settings into complete Portline profiles. The optional shared `@jalsoedesign/portline-dockline` bridge resolves selected credentials and opens scoped Dockline sessions.

## Map a saved site

The [saved-site quick start](/guide/quick-start) constructs `FileZillaProfileSource`, passes it to `createDocklineBridge`, and calls `withFiles` with an exact selected path and explicit SSH host fingerprint. The same bridge accepts every supported Portline source.

`toConfig` prepares configuration without connecting. `createFileAdapter` creates a disconnected adapter when explicit lifecycle management is required. Configuration can contain secrets and must not be logged as metadata.

For command sessions on the saved SFTP endpoint, install the optional SSH client and use `withSsh`. The [complete SSH program](/guide/ssh) covers source selection, canonical host verification, execution and cleanup. The shared [Portline execution reference](https://h2ooooooo.github.io/portline/integration/execution) defines the full method and runtime-option contracts.

## Run a verified local transfer

From an installed checkout after `npm run build`:

```sh
node examples/test-ftp.mjs
node examples/test-sftp.mjs
```

These create synthetic Site Manager entries, run the actual connection-check command, map the same entries through the shared bridge and transfer bytes through Dockline. They use temporary loopback servers and verify the downloaded content. Read [the captured input/output transcripts](/guide/local-demo).

## Generic operations

For upload/download, streams, listing, rename/remove, pools, progress, checksums and publication policies, follow [Dockline's API documentation](https://h2ooooooo.github.io/dockline/api/). Use [Dockline SSH](https://h2ooooooo.github.io/dockline/ssh/quick-start) and [key utilities](https://h2ooooooo.github.io/dockline/keys/) directly for those tasks. The shared bridge does not add another transport implementation.

FileZilla-specific differences remain here: [FTP/TLS mapping](/guide/ftp), [saved SFTP authentication and trust](/guide/sftp), [encoding/options](/guide/ftp-options), and [native host-key import](/guide/ssh-options). The normalized source retains supported execution settings; the shared bridge supplies the application-independent Dockline mapping.
