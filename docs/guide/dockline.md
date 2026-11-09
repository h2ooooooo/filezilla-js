# Dockline and FileZilla JS

FileZilla reads native settings and projects complete supported connection definitions through Portline. The optional shared `@jalsoedesign/portline-dockline` integration converts those definitions into Dockline connections. FileZilla has no application-specific transport factories.

| Layer | Owns |
| --- | --- |
| FileZilla core | Native XML, saved protocol and authentication interpretation, remote-directory decoding, credential resolution and read-only host-key import |
| Portline contracts | Transport-neutral endpoints, authentication references, FTP settings, encoding and host-trust metadata |
| Portline–Dockline integration | Shared connection selection, credential orchestration, configuration conversion and scoped file/SSH sessions |
| Dockline clients | FTP/FTPS/SFTP transport, SSH commands, host verification and transfer operations |

The reader has no Dockline dependency. Install only the protocol clients needed by the selected connections. Missing clients produce an actionable installation error; the integration never installs packages or falls back to another protocol.

## Saved protocol mapping

| Saved FileZilla protocol | Execution policy |
| --- | --- |
| FTP, FTPES | Explicit TLS, without plaintext fallback |
| FTPS | Implicit TLS |
| INSECURE_FTP | Plain FTP |
| SFTP | SFTP over SSH |

Saved passive mode, custom filename encoding, remote root and supported authentication requirements are retained in the normalized definition. Unsupported settings are refused rather than silently ignored. Runtime credential prompts, host approval callbacks, deadlines and retries remain caller options.

Profiles contain credential references, never secret values. The integration resolves only the selected connection's credentials. Connection configuration can contain resolved secrets and callbacks; do not log it as profile metadata.

## Trust and native settings

`FileZillaHostKeyStore` is exported from `@jalsoedesign/filezilla-core`. It reads an explicitly selected modern `hostkeys.xml` snapshot and exposes a shared fingerprint verifier. It does not record approvals or import weaker algorithm policy. Unknown and changed SSH keys require an explicit runtime trust decision.

Reading and connecting do not save native XML. Explicit native changes use `createFileZillaWriter` and the guarded preview/apply workflow. Runtime secrets and trust callbacks are not copied by profile sync.

See the [complete saved-site walkthrough](/guide/quick-start), [package choices](/guide/installation), [Dockline file API](https://h2ooooooo.github.io/dockline/api/) and [SSH commands](https://h2ooooooo.github.io/dockline/ssh/quick-start).
