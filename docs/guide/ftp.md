# FTP and FTPS

Factory snippets on this page are reusable integration recipes, not separate programs. Supply a selected native `Server` and any separately trusted CA. A factory returns configuration or a disconnected connector; it does not print or connect automatically.

The generic transport APIs below belong to Dockline and are imported from its packages directly. FileZilla adds saved-site mapping and FileZilla host-key import; see [architecture and import migration](/guide/dockline).

The adapter uses `basic-ftp` for passive FTP and explicit/implicit TLS. Active FTP is rejected.

## Direct configuration

For a connection defined directly in code, use [Dockline FTP/FTPS](https://h2ooooooo.github.io/dockline/ftp/quick-start). FileZilla is needed only when importing a saved site. The [complete saved FTP program](/guide/quick-start#connect-through-a-saved-ftp-or-ftps-configuration) includes all language/run tabs and output.

## Saved-site factory

Both static and instance factories accept `fromServer(server, options?)`. Options include `secureOptions` and shared connection/operation controls.

| Protocol | TLS behavior | Fallback port if absent on a programmatic Server |
| --- | --- | --- |
| `FTP` (0), `FTPES` (4) | Explicit TLS; no plaintext fallback | 21 |
| `FTPS` (3) | Implicit TLS | 990 |
| `INSECURE_FTP` (6) | Explicitly selected plaintext | 21 |

Validated XML imports require a valid saved port. Anonymous mode uses `anonymous` and an empty password. Normal mode uses saved credentials. Account mode warns and ignores its account field. Ask and interactive modes require an application `credentialProvider`; key, profile and ADC modes are rejected. See [credential providers](/guide/ftp-options) for supported results and cancellation.

::: code-group

```ts [TypeScript]
import type {Server} from '@jalsoedesign/filezilla-core';
import {FtpConnectorFactory} from '@jalsoedesign/filezilla-connector-ftp';

function fromSavedSite(site: Server, trustedPrivateCa: Buffer) {
    return FtpConnectorFactory.fromServer(site, {
        timeoutMs: 20_000,
        autoReconnect: true,
        maxTransientRetries: 2,
        secureOptions: {ca: trustedPrivateCa},
    });
}
```

```js [JavaScript]
import {FtpConnectorFactory} from '@jalsoedesign/filezilla-connector-ftp';

function fromSavedSite(site, trustedPrivateCa) {
    return FtpConnectorFactory.fromServer(site, {
        timeoutMs: 20_000,
        autoReconnect: true,
        maxTransientRetries: 2,
        secureOptions: {ca: trustedPrivateCa},
    });
}
```

```js [MJS]
import {FtpConnectorFactory} from '@jalsoedesign/filezilla-connector-ftp';

function fromSavedSite(site, trustedPrivateCa) {
    return FtpConnectorFactory.fromServer(site, {
        timeoutMs: 20_000,
        autoReconnect: true,
        maxTransientRetries: 2,
        secureOptions: {ca: trustedPrivateCa},
    });
}
```

```js [CommonJS]
const {FtpConnectorFactory} = require('@jalsoedesign/filezilla-connector-ftp');

function fromSavedSite(site, trustedPrivateCa) {
    return FtpConnectorFactory.fromServer(site, {
        timeoutMs: 20_000,
        autoReconnect: true,
        maxTransientRetries: 2,
        secureOptions: {ca: trustedPrivateCa},
    });
}
```

:::

Keep TLS certificate validation enabled. `secureOptions` supports a separately trusted private CA; it is no longer necessary to abandon the factory to configure it.

## Session state and concurrency

FTP applies `initialPath` using `CWD`. Relative paths use that session directory, while absolute paths refer to the server root. `initialPath` is not containment.

Operations are queued per connector. A returned read holds its operation slot until consumption and final protocol confirmation complete, so drain it before awaiting another operation on the same connector. Use a [connection pool](/guide/connection-pools) of separate connectors for actual parallel transfers, including metadata and folder operations under the same quota.

Recursive `createDirectory` restores the original directory on success and failure. If restoration fails, the session is invalidated rather than reused with uncertain state. Root, dot and trailing-slash directory stat inputs are handled explicitly; a successful directory listing is still required for root/current-directory checks.

Shared [timeouts, cancellation and retries](/guide/transfers#timeouts-and-retries) apply to factory options, constructors and per-call overrides. A queued call can time out while waiting; each started attempt has its own deadline. Automatic reconnection defaults to false, and mutating operations are not generally replayed.
