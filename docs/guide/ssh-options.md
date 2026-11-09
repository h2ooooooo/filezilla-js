# SSH authentication and trusted keys

The shared Portline–Dockline integration accepts runtime credential and host-trust providers. Those providers apply consistently to FileZilla, WinSCP, PuTTY/KiTTY, OpenSSH, JetBrains and HeidiSQL profiles. Application readers only interpret their own saved settings and trust formats.

## Native FileZilla trust

Import `FileZillaHostKeyStore` from `@jalsoedesign/filezilla-core` and load an explicitly selected modern `hostkeys.xml` snapshot. Its shared fingerprint verifier can be supplied to the bridge's trust option. Native trust import is read-only; approvals and durable trust storage remain caller-owned.

This contextual setup replaces the fingerprint option in an existing saved-site program. Supply the two native filenames and the exact selected profile path:

::: code-group

```ts [TypeScript]
import {FileZillaHostKeyStore, FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const source = FileZillaProfileSource.fromFile('./sitemanager.xml');
const trusted = await FileZillaHostKeyStore.fromFile('./hostkeys.xml');
const bridge = createDocklineBridge({source, trust: trusted.verify});
```

```js [JavaScript]
import {FileZillaHostKeyStore, FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const source = FileZillaProfileSource.fromFile('./sitemanager.xml');
const trusted = await FileZillaHostKeyStore.fromFile('./hostkeys.xml');
const bridge = createDocklineBridge({source, trust: trusted.verify});
```

```js [MJS]
import {FileZillaHostKeyStore, FileZillaProfileSource} from '@jalsoedesign/filezilla-core';
import {createDocklineBridge} from '@jalsoedesign/portline-dockline';

const source = FileZillaProfileSource.fromFile('./sitemanager.xml');
const trusted = await FileZillaHostKeyStore.fromFile('./hostkeys.xml');
const bridge = createDocklineBridge({source, trust: trusted.verify});
```

```js [CommonJS]
const {FileZillaHostKeyStore, FileZillaProfileSource} = require('@jalsoedesign/filezilla-core');
const {createDocklineBridge} = require('@jalsoedesign/portline-dockline');

const source = FileZillaProfileSource.fromFile('./sitemanager.xml');
const trusted = await FileZillaHostKeyStore.fromFile('./hostkeys.xml');
const bridge = createDocklineBridge({source, trust: trusted.verify});
```

:::

In CommonJS, keep the `require` declarations at file scope and put the awaited setup inside the existing async `main` function. `trusted.verify` is bound and checks host, port and exact SHA256 fingerprint. It works with both `withFiles` and `withSsh`; `hasTrustPolicy` is the raw-key callback for direct SFTP adapters. An explicit runtime fingerprint takes precedence over the provider. Malformed or padded fingerprints are rejected before connecting.

Unknown keys and changed keys require a deliberate decision. No credentials or trust approvals are inferred from another application. Host approval callbacks and prompt handlers are runtime services, not serialized profile fields.

## SSH command sessions

Install `@jalsoedesign/dockline-ssh-client` for scoped command sessions. Select an SSH or SFTP definition explicitly; the server may allow SFTP while refusing command execution. Profiles describing SSH hops retain those references, but unsupported forwarding must fail explicitly rather than connecting directly to a different destination.

Follow [Dockline SSH](https://h2ooooooo.github.io/dockline/ssh/quick-start) for command, sudo and session behavior, and [Dockline keys](https://h2ooooooo.github.io/dockline/keys/) for key inspection and conversion.

For complete source loading, package installation, commands and output, use the [saved-site SSH walkthrough](/guide/ssh).

## Default interactive host approval

When neither a fingerprint nor a trust callback is configured, the shared bridge asks for SSH/SFTP host approval if both standard input and standard error are interactive terminals. It displays the endpoint and server fingerprint; only an explicit `yes` accepts a new host. Matching approvals are reused for that bridge instance. A changed approved key requires the distinct response `replace`. Approval is session-only and is never written to disk. Explicit pins and configured providers retain priority, and a pin mismatch never falls back to a prompt.

Redirected input, pipelines and unattended jobs do not prompt: configure a fingerprint or trust provider. Browser/server applications supply their own approval callback. The downloadable programs use explicit pins to remain reproducible in unattended checks; interactive callers may omit them.
