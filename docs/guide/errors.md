# Errors and reconnecting

Error-handling snippets are contextual recipes around an already selected connector. Supply its setup, requested operation and reporting callbacks; they are not standalone programs. Generic error classes come directly from Dockline. Use [the saved-site walkthrough](/guide/quick-start) for complete connection setup.

The generic transport APIs below belong to Dockline and are imported from its packages directly. FileZilla adds saved-site mapping and FileZilla host-key import; see [architecture and import migration](/guide/dockline).

Dockline abstract owns the transport error hierarchy. Its protocol clients re-export the relevant constructors, so compatible installed package instances support shared `instanceof` checks.

::: code-group

```ts [TypeScript]
import {AuthError, HostTrustError, PermissionError, OperationAbortedError, OperationTimeoutError} from '@jalsoedesign/dockline-abstract';

try {
    await connector.connect({timeoutMs: 10_000});
} catch (error) {
    if (error instanceof HostTrustError) {
        throw new Error('Review the remote host identity before reconnecting.');
    } else if (error instanceof AuthError) {
        throw new Error('The server rejected authentication.');
    } else if (error instanceof PermissionError) {
        throw new Error('This account lacks the required permission.');
    } else if (error instanceof OperationAbortedError) {
        console.log('Cancelled.');
    } else if (error instanceof OperationTimeoutError) {
        console.log('The attempt timed out.');
    } else {
        throw error;
    }
}
```

```js [JavaScript]
import {AuthError, HostTrustError, PermissionError, OperationAbortedError, OperationTimeoutError} from '@jalsoedesign/dockline-abstract';

try {
    await connector.connect({timeoutMs: 10_000});
} catch (error) {
    if (error instanceof HostTrustError) {
        throw new Error('Review the remote host identity before reconnecting.');
    } else if (error instanceof AuthError) {
        throw new Error('The server rejected authentication.');
    } else if (error instanceof PermissionError) {
        throw new Error('This account lacks the required permission.');
    } else if (error instanceof OperationAbortedError) {
        console.log('Cancelled.');
    } else if (error instanceof OperationTimeoutError) {
        console.log('The attempt timed out.');
    } else {
        throw error;
    }
}
```

```js [MJS]
import {AuthError, HostTrustError, PermissionError, OperationAbortedError, OperationTimeoutError} from '@jalsoedesign/dockline-abstract';

try {
    await connector.connect({timeoutMs: 10_000});
} catch (error) {
    if (error instanceof HostTrustError) {
        throw new Error('Review the remote host identity before reconnecting.');
    } else if (error instanceof AuthError) {
        throw new Error('The server rejected authentication.');
    } else if (error instanceof PermissionError) {
        throw new Error('This account lacks the required permission.');
    } else if (error instanceof OperationAbortedError) {
        console.log('Cancelled.');
    } else if (error instanceof OperationTimeoutError) {
        console.log('The attempt timed out.');
    } else {
        throw error;
    }
}
```

```js [CommonJS]
const {AuthError, HostTrustError, PermissionError, OperationAbortedError, OperationTimeoutError} = require('@jalsoedesign/dockline-abstract');

try {
    await connector.connect({timeoutMs: 10_000});
} catch (error) {
    if (error instanceof HostTrustError) {
        throw new Error('Review the remote host identity before reconnecting.');
    } else if (error instanceof AuthError) {
        throw new Error('The server rejected authentication.');
    } else if (error instanceof PermissionError) {
        throw new Error('This account lacks the required permission.');
    } else if (error instanceof OperationAbortedError) {
        console.log('Cancelled.');
    } else if (error instanceof OperationTimeoutError) {
        console.log('The attempt timed out.');
    } else {
        throw error;
    }
}
```

:::

`ConnectorError` is the base. Other shared classes include `NotFoundError`, `NotSupportedError`, `UnsupportedProtocolError` and `ConnectionClosedError`. SFTP's legacy `KeyAuthError` export is a deprecated alias of `AuthError`, not a separate identity. Multiple incompatible installed copies of the shared package can still create ordinary JavaScript class-identity problems.

See the [complete error reference](/reference/errors) for constructors, codes, inheritance, core metadata errors and managed-host-store conflicts.

## Error mapping and remaining absence risk

FTP authentication and permission statuses are mapped deliberately. Ambiguous `550`/`553` replies are not automatically interpreted as missing; successful parent listing without a matching item yields `NotFoundError`. Root, dot and trailing-slash inputs are handled explicitly.

SFTP maps common SSH authentication failures to `AuthError`; trust failures, deadlines, aborts and closed connections have dedicated classes. Stream errors retain their mapped identity. Permissions remain distinct from known missing entries where the underlying dependency preserves that distinction.

**SFTP status conversion remains unresolved upstream:** `ssh2-sftp-client` can rewrite a generic status 4 lstat failure into “No such file.” `fileExists` and `directoryExists` can therefore return false without confirmed absence. Do not use such a result alone to authorize a destructive synchronization or recovery action. This repair pass deliberately does not edit external dependency source.

## Cancellation and recovery

Shared options now honor external abort signals and per-attempt deadlines. `maxTransientRetries` defaults to three **extra** attempts and `autoReconnect` defaults to false. Classifiers exclude authentication, trust, permission, missing/unsupported and abort failures from retry. Safe replay rules and upload factories are documented under [transfers](/guide/transfers#timeouts-and-retries).

A read already returned to a caller is not automatically replayed. One-shot upload streams and started mutations are not generally replayed. A failed write or cancelled rename may leave partial or uncertain remote state; cancellation is not rollback.

## Redaction and wrappers

Transport wrappers redact occurrences of configured passwords/passphrases from ordinary underlying messages and avoid retaining raw causes. This is limited redaction, not a general sanitizer for application logs, host names, paths or configuration objects.

## Distinguishing connection failures in the normal flow

Use the same `try/catch` around `connect`, `stat` or `list`; there is no separate `diagnose()` operation. New classes include `NameResolutionError`, `ConnectionRefusedError`, `TlsTrustError`, `CredentialProviderError` and `DirectoryAccessError`. Existing authentication, host-trust, timeout and cancellation classes retain their runtime identities. `ConnectorError.stage`, when the dependency exposes a known stage, is resolve, connect, trust, authenticate, directory, credentials or ready. Do not guess a more specific stage when the underlying transport cannot identify one.

`TlsTrustError` is also a `HostTrustError`; `CredentialProviderError` is also an `AuthError`. Catch a specific subclass first when that distinction matters. Provider and interactive-callback failures deliberately omit raw application error messages. The CLI [connection check](/guide/connection-check) uses these same exceptions and ordinary read-only operations.

`PublicationError` is a composed-operation failure with an explicit `state` describing what may already have happened remotely. Its state must be reviewed before replaying a publication; see [publication recovery](/guide/advanced-transfers#publication-and-overwrite-behavior).
