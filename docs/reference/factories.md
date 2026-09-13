# Factories and errors

Factories are the FileZilla-to-Dockline bridge. `FtpConnectorFactory.toConfig(server, options?)` returns `FtpTransferConfig`; `SftpConnectorFactory.toConfig(server, options?)` returns `SftpTransferConfig`. The same methods are available on factory instances. They share mapping/validation with `fromServer`, return plain configuration and do not connect. See the complete [quick start](/guide/quick-start).

## Concrete factories

```ts
FtpConnectorFactory.fromServer(server, options?)
SftpConnectorFactory.fromServer(server, options?)

new FtpConnectorFactory().fromServer(server, options?)
new SftpConnectorFactory().fromServer(server, options?)
```

Static convenience methods and instance methods map saved settings into disconnected adapters. The factory must decode the selected remote directory, so unsupported saved path dialects still fail at this connection-use boundary.

FTP options extend `ConnectorOperationOptions` and `ConnectorConnectionOptions`, adding `secureOptions` and `filenameEncoding`. SFTP options are `Omit<SftpConnectorConfig, 'host' | 'port' | 'username' | 'initialPath'>`: trust callbacks, verifier, shared controls and explicit password/key/passphrase overrides are available while destination identity comes from the selected site.

| LogonType | FTP | SFTP |
| --- | --- | --- |
| anonymous | anonymous user, empty password | Rejected |
| normal | Saved credentials or credential provider | Saved credentials, provider or supported overrides |
| ask | Requires credential provider | Requires explicit password, provider, agent or keyboard-interactive handler |
| interactive | Requires credential provider | Requires a keyboard-interactive string or callback |
| account | Warns; account field ignored | Password path; no separate account implementation |
| key | Rejected | Explicit key override or saved keyFile; passphrase override or saved password |
| profile, adc | Rejected | Rejected |

SFTP explicitly rejects unknown modes. The reader validates its logon range, but arbitrary direct `Server` construction remains the caller's responsibility. See [configuration](/reference/configuration).

## Abstract contract

```ts
abstract class ConnectorFactory<TConnector extends StorageAdapter, TOptions = unknown> {
    abstract fromServer(server: Server, options?: TOptions): TConnector;
}
```

Both factories extend this instance contract. For explicitly registered protocol dispatch, use `ConnectorRegistry`; it does not scan or automatically import packages. See [providers and pools](/guide/connection-pools).

## Shared runtime errors

Dockline owns these classes; the FileZilla compatibility packages re-export the same constructors:

```text
Error
└─ ConnectorError
   ├─ AuthError
   │  └─ CredentialProviderError
   ├─ NotFoundError
   ├─ PermissionError
   ├─ UnsupportedProtocolError
   ├─ NotSupportedError
   ├─ HostTrustError
   │  └─ TlsTrustError
   ├─ OperationAbortedError
   ├─ OperationTimeoutError
   ├─ ConnectionClosedError
   ├─ NameResolutionError
   ├─ ConnectionRefusedError
   ├─ DirectoryAccessError
   ├─ ResourceLimitError
   ├─ IntegrityError
   ├─ PoolClosedError
   └─ PublicationError
```

`ConnectorError(message, cause?, code?, stage?)` exposes optional readonly cause, status code and known connection stage. New subclasses also include `NameResolutionError`, `ConnectionRefusedError`, `TlsTrustError`, `CredentialProviderError`, `DirectoryAccessError`, `ResourceLimitError`, `IntegrityError`, `PoolClosedError` and `PublicationError`. See the [complete error reference](/reference/errors), [error handling](/guide/errors) and [transfer tools](/guide/advanced-transfers) for their contracts. Transport wrappers omit raw sensitive causes and preserve only useful status information. Derived lifecycle errors have default messages/codes. `KeyAuthError` remains a deprecated SFTP export aliasing `AuthError`.

Shared and concrete imports have matching runtime identity within a compatible dependency tree. `_wrapErrorForTest` is still a test aid, not a general-purpose sanitizer or stable application extension point. The unresolved upstream SFTP false-absence case is described in [errors](/guide/errors).
