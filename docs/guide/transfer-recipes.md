# Typed transfer recipes

For normal saved-site transfers, start with [the complete program](/guide/quick-start) and Dockline's [file recipes](https://h2ooooooo.github.io/dockline/api/files). The optional `packages/cli/examples/transfer-recipes.ts` source contains additional integration policy; it is not a public connector class or an automatically installed top-level export.

## Verified SFTP setup

The source's `createPinnedSftp(server, fingerprint)` translates a selected native site and requires an independently verified canonical SHA256 fingerprint. Copy and review the source when choosing that policy; do not import a nonexistent local `./transfer-recipes.js` file.

## Download to a new local file

`downloadToNewFile(factory, remotePath, localPath, options)` reads a server source and writes a new host destination using exclusive creation. It has its own 1 GiB default limit; that copied recipe policy is distinct from Dockline's unlimited default. It checks length, consumes the stream, closes resources and removes only its newly created partial file on failure. An existing destination is retained.

## Publish a new remote file

`publishNewFile(factory, localPath, remotePath, options)` reads a host source and stages a server destination with explicit no-replace policy. Verification uses a separately supplied digest. Unsupported atomic/no-replace guarantees are rejected. Review uncertain publication state before retrying; see [Dockline publication](https://h2ooooooo.github.io/dockline/guide/advanced-transfers#publication-and-overwrite-behavior).

## Own the connection lifetime

`withConnectedSite` connects a fresh caller-owned connector, awaits the full callback and disconnects. Do not return an unconsumed stream or share the owned connector with a pool. Operation and cleanup failures can be retained together. The package's recipe tests and packed-consumer checks exercise the source; [contributor testing](/development/testing) lists the commands.
