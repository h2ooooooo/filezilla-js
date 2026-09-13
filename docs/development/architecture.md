# Architecture

```text
sitemanager.xml -> SiteManager -> selected Server
                                      |
                               factory.toConfig()
                                      |
                         Dockline SDK / FTP / SFTP
```

FileZilla core reads configuration and has no transport dependency. FileZilla bridge packages map saved settings to the published Dockline clients. Applications own credentials, host approval, allowed paths and recovery policy.

## Layout and ownership

| Directory | Responsibility |
| --- | --- |
| packages/core | XML reading, Server model, selection, metadata identities/snapshots and enums |
| packages/cli | Saved-site queries, read-only connection checks and transfer recipes |
| packages/connector-abstract | FileZilla factory/registry contracts and shared Dockline exports |
| packages/connector-ftp | FileZilla FTP/FTPS configuration mapping |
| packages/connector-sftp | FileZilla SFTP configuration mapping and host-key import |
| scripts | Build, package and consumer validation |
| docs | Independently built VitePress documentation |

## State and resources

SiteManager retains normalized Server objects rather than original XML. JSON projections redact passwords; explicitly selected credential properties remain accessible. Remote-directory decoding stays lazy until requested or mapped for connection use.

Dockline owns protocol state, streams, cancellation and retry behavior. A returned read belongs to its caller until consumed or cancelled. SDK local-file methods own their local handles and await completion. `withConnection` owns the session for its callback lifetime.

FileZillaHostKeyStore reads FileZilla's modern hostkeys.xml; it does not write approvals or copy insecure algorithm policy. SiteIdentityStore offers explicit JSON import/export with application-owned persistence. See [security](/guide/security) and [Dockline integration](/guide/dockline).
