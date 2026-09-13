# Typed transfer recipes

The generic transfer APIs on this page are implemented by the independent **Dockline packages**: `@jalsoedesign/dockline-abstract`, `@jalsoedesign/dockline-ftp-client` and `@jalsoedesign/dockline-sftp-client`. Existing FileZilla connector imports remain supported compatibility exports; saved-site factories and FileZilla host-key import stay in FileZilla JS. See [the project boundary and migration](/guide/dockline).

The executable examples in `packages/cli/examples/transfer-recipes.ts` demonstrate narrow workflows using public package imports. They are application recipes, not a deployment engine or a new connector abstraction. Copy the source into your application and adapt ownership decisions deliberately.

The current built CLI package includes the `examples` source directory; this local implementation has not been published. Tests exercise the recipes against disposable fixtures, including complete stream consumption, cancellation, incomplete reads, cleanup and no-overwrite behavior. The repository's packed-consumer check compiles the same source against the public package tarballs.

## Verified SFTP setup

```ts
import {getSiteManager} from '@jalsoedesign/filezilla-core';
import {createPinnedSftp, downloadToNewFile} from './transfer-recipes.js';

const manager = getSiteManager('./sites.xml', {
    credentialPath: 'Production',
});
const server = manager.getServerByPath('Production');

if (!server) {
    throw new Error('The selected site is unavailable.');
}

const createConnector = () => createPinnedSftp(server, independentlyVerifiedFingerprint);

await downloadToNewFile(createConnector, '/reports/latest.csv', './latest.csv', {
    abortSignal,
    timeoutMs: 15000,
    maxBytes: 64 * 1024 * 1024,
});
```

`createPinnedSftp()` requires a complete canonical SHA256 fingerprint. Its trust policy accepts only that exact fingerprint and never prompts or automatically trusts a new key. Credentials come from the selected server; the recipe contains no real credentials. It creates a fresh connector for each invocation and disables automatic reconnect by default.

## Download to a new local file

`downloadToNewFile(factory, remotePath, localPath, options)` checks that the remote source is a regular file and creates the local path with exclusive `wx` semantics and mode `0600` where the operating system honors it. An existing local file is never replaced or deleted.

The pipeline consumes the remote stream completely, counts bytes and rejects an oversized or incomplete result. This optional `downloadToNewFile` application recipe retains its own 1 GiB default byte limit. That policy belongs to the copied recipe; Dockline downloads and connector transfers are unlimited unless `maxBytes` is explicitly configured. The advertised file size is checked before and after transfer; this detects a changed length or truncated stream but cannot prove the remote contents remained unchanged at the same length. Use an independently supplied digest when stronger integrity is needed.

On failure, the recipe closes its local file and connector, then removes only the local file it created. An unrelated existing file remains untouched. A failed connection cleanup also makes the recipe fail and removes its newly created output. The local destination is visible while it is being written; consumers must wait for the returned promise before reading it. The caller owns the destination directory and must avoid other processes replacing or renaming that path during the operation.

Cancellation uses the supplied `AbortSignal`. The partial owned file is removed. The caller decides whether and when to retry; do not reuse an already aborted signal.

## Publish a new remote file

```ts
import {publishNewFile} from './transfer-recipes.js';

const publication = await publishNewFile(createConnector, './release.zip', '/releases/release.zip', {
    abortSignal,
    timeoutMs: 30000,
    expectedSha256: independentlyComputedSha256,
});

console.log(publication.verified, publication.atomic, publication.cleanup);
```

`publishNewFile()` uses the public staged-publication helper with `overwrite: 'fail'`. The source is a regular local file and each supported retry gets a fresh read stream. The application must keep that file unchanged for the duration of the operation. `expectedSha256` enables explicit verification of the staged remote contents before publication.

`requireAtomicRename: true` requests a guarantee that may be unsupported by the selected protocol/server. The recipe propagates that failure instead of choosing a weaker policy. Adapter support does not imply server support or permissions at a path. FTP currently cannot guarantee a no-overwrite rename against competing writers and can reject this recipe; use a connector/server that can honor the requested behavior.

The underlying publication result describes `atomic`, `verified` and cleanup state. If publication fails with `PublicationError`, inspect its recorded phase and outcome before deciding what to do. A lost rename reply can leave an uncertain outcome and retained staging content. The recipe does not blindly retry a rename, delete an existing destination, restore a backup or schedule another deployment.

## Own the connection lifetime

`withConnectedSite(factory, options, callback)` connects a freshly created, caller-owned connector and disconnects it after the callback settles, including a failed connection attempt. A callback must await its full stream pipeline before returning; returning a live stream transfers it out of its intended lifetime and is not supported by this recipe.

When both the operation and disconnect fail, an `AggregateError` preserves both failures. The recipes do not log exception messages or credentials. These functions should receive exclusively owned connectors, not a connector currently shared with another task or a pool lease managed elsewhere.

The factory return type is `RecipeConnector`, built from the public `TransferConnector` plus `connect` and `disconnect`. You can supply another supported connector with an application-owned trust policy; the recipe does not infer trust or build transport-specific fallback behavior.
