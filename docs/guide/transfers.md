# Streams and transfers

The generic transfer APIs on this page are implemented by the independent **Dockline packages**: `@jalsoedesign/dockline-abstract`, `@jalsoedesign/dockline-ftp-client` and `@jalsoedesign/dockline-sftp-client`. Existing FileZilla connector imports remain supported compatibility exports; saved-site factories and FileZilla host-key import stay in FileZilla JS. See [the project boundary and migration](/guide/dockline).

Both connectors implement Flystorage's `StorageAdapter` shape and extend operation options with timeout, abort and retry controls. Pass `{}` for ordinary direct calls and `{deep: false}` for a shallow list; this works with both connectors.

## Upload and download

```ts
import {createReadStream, createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import type {FtpConnector} from '@jalsoedesign/filezilla-connector-ftp';
import type {SftpConnector} from '@jalsoedesign/filezilla-connector-sftp';

async function transfer(connector: FtpConnector | SftpConnector) {
    try {
        await connector.connect();
        await connector.write('report.txt', createReadStream('./report.txt'), {});
        const contents = await connector.read('report.txt', {});
        await pipeline(contents, createWriteStream('./downloaded-report.txt', {flags: 'wx'}));
    } finally {
        await connector.disconnect();
    }
}
```

Local `wx` prevents replacing an existing download. Remote writes may overwrite and can leave partial data after failure. There is no automatic atomic publication, backup or rollback policy.

## Timeouts and retries

| Shared option | Default | Meaning |
| --- | --- | --- |
| `autoReconnect` | `false` | Permit reconnection after a lost established connection and eligible operation replay |
| `maxTransientRetries` | `3` | Additional attempts after the first, for eligible transient failures |
| `timeoutMs` | `30000` | Per-attempt deadline; zero disables this deadline |
| `timeout` | Unset | Alias for `timeoutMs`, compatible with Flystorage |
| `abortSignal` | Unset | Cancel before starting or during the operation |

Constructor/factory settings are defaults; per-call values override them. At the same level `timeoutMs` wins over `timeout`. A call's timeout alias overrides a constructor deadline. Retry counts are non-negative safe integers, and deadlines must be integers from 0 through 2147483647.

Initial or explicit connection attempts can retry transient failures within their budget. After a lost established connection, call `connect()` deliberately or enable `autoReconnect`. Authentication, permissions, missing/unsupported operations, host-trust rejection and external aborts are not retryable. Safe metadata requests can be retried when automatic reconnection is enabled; deletes, mkdir, rename and copy are not automatically replayed once started.

Deadlines are not a whole-workflow duration limit: retries each receive a deadline, and FTP queue waiting has its own deadline. For a total budget, provide an externally timed `AbortSignal`. SFTP's separate `readyTimeout` still bounds its SSH handshake; `timeoutMs: 0` does not disable that handshake limit.

```ts
const cancellation = new AbortController();
const result = await connector.stat('report.txt', {
    timeoutMs: 10_000,
    autoReconnect: true,
    maxTransientRetries: 1,
    abortSignal: cancellation.signal,
});
```

Cancellation stops owned work/resources; it cannot undo a remote mutation that has already completed. Inspect uncertain remote outcomes before deciding what to do next.

## Explicitly replayable uploads

A one-shot `Readable` is never automatically replayed after an upload starts. To permit a complete overwriting upload to restart, pass a factory that returns a **fresh unread stream for each attempt** and enable reconnection:

```ts
await connector.write('report.txt', () => createReadStream('./report.txt'), {
    autoReconnect: true,
    maxTransientRetries: 2,
});
```

The source must remain the intended same content. Returning the same consumed/destroyed stream is rejected. This is full replay, not resumable transfer or atomic replacement. Factory preparation is also cancellation-aware. A returned read stream is never transparently restarted or replayed after data has been exposed to its consumer.

## Completion and concurrency

`read()` returns before completion. Await `pipeline` or fully consume its async iterator; awaiting `read()` alone does not establish success. FTP waits for the final control-channel reply before ending its output. SFTP owns the remote reader, maps failures onto the consumer stream and closes the source when consumption is cancelled.

FTP operations are queued through complete stream consumption. Do not await a second operation on the same connector before draining the first read. SFTP coalesces connection establishment and tracks active operations; neither connector is a connection pool. Use [ConnectorPool](/guide/connection-pools) for independent sessions under one shared quota, and close it after its work is finished. Creating separate connectors yourself requires your application to enforce its own connection limit.

## Optional FileStorage wrapper

```ts
import {FileStorage} from '@flystorage/file-storage';
import type {FtpConnector} from '@jalsoedesign/filezilla-connector-ftp';
import type {SftpConnector} from '@jalsoedesign/filezilla-connector-sftp';

async function useStorage(connector: FtpConnector | SftpConnector) {
    const storage = new FileStorage(connector);
    try {
        await connector.connect();
        await storage.write('example.txt', 'Hello from FileZilla JS');
        console.log(await storage.readToString('example.txt'));
        const entries = await storage.list('', {deep: false}).toArray();
        console.log(entries.length);
    } finally {
        await connector.disconnect();
    }
}
```

The wrapper accepts string uploads, supplies convenience methods and makes its own options optional. `readToString` buffers the complete file. Wrapper errors may contain a connector error as `cause` rather than being that class directly.

**Unresolved upstream Windows path normalization:** Flystorage 1.2.2 uses platform-native path joining by default. On Windows, `assets/logo.svg` becomes `assets\logo.svg` and its slash-only traversal check can miss `..\secret.txt`. The example uses flat names. Use direct adapters with validated forward-slash paths or a reviewed portable normalizer before relying on nested wrapper paths. The wrapper and `initialPath` are not confinement boundaries.

## Metadata and mutations

`list(path, {deep: true})` traverses depth-first without a depth/entry budget. `stat`, `fileSize` and `lastModified` inspect metadata; modification times use milliseconds, including valid zero. See [paths](/guide/paths) for link/type limits and the unresolved SFTP absence issue SFTP status conversion.

Directory creation/deletion recurse. `moveFile` retains ordinary remote rename. `copyFile` now uses the explicit bounded client-streamed strategy and staged publication; SFTP no longer delegates this contract to opaque `rcopy`. FTP requires explicit `overwrite: 'replace'`. See [transfer tools and guarantees](/guide/advanced-transfers) for progress, bandwidth, checksums, publication, copy and bounded traversal.
