# Saved SFTP connections

FileZilla core projects saved SFTP endpoints, remote directories, filename encoding and password/key/interactive requirements into Portline definitions. The shared integration resolves credentials for the selected connection and uses the optional Dockline SFTP client.

## Authentication and trust

Supply explicit runtime credentials for unsaved passwords or encrypted-key passphrases. Keyboard-interactive and agent authentication require explicit runtime handlers or selection. Unsupported saved modes fail before connecting.

Saved `ask` becomes `prompt-password`; use `password` or `promptPassword` when no stored secret is available. Saved `interactive` remains a keyboard-interactive requirement and needs a handler. Saved key authentication keeps a separate key path and passphrase reference. See the [complete authentication matrix](/reference/enums#normalized-authentication-and-execution).

Saved credentials do not establish host identity. Use an independently verified fingerprint or an explicit trust provider. The shared bridge rejects SSH connections without accepted host trust.

## Reuse modern FileZilla trusted keys

`FileZillaHostKeyStore`, exported by `@jalsoedesign/filezilla-core`, loads an explicit modern `hostkeys.xml` file. Its shared verifier checks the selected host, port and fingerprint against that snapshot. It does not write approvals, watch the file or adopt insecure algorithm allowances. Reload explicitly when native trust changes.

See the [complete SFTP walkthrough](/guide/quick-start), [trust integration](/guide/ssh-options) and [Dockline SFTP guide](https://h2ooooooo.github.io/dockline/guide/sftp).
