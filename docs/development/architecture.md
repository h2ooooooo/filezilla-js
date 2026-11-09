# Architecture

`sitemanager.xml → FileZillaProfileSource → Portline connection definition → portline-dockline → optional Dockline client`

FileZilla core interprets native settings once. Its normalized profiles preserve supported execution settings as well as searchable metadata. FileZilla's credential provider loads secrets only when explicitly asked to resolve the selected reference.

The shared Portline–Dockline integration handles protocol selection and runtime providers for every reader. It has no FileZilla dependency. Dockline owns protocol state, streams, cancellation and transfer behavior. A scoped connection owns its resources until its callback finishes.

## Layout and ownership

| Directory | Responsibility |
| --- | --- |
| `packages/core` | Native reading, profiles, credentials, trusted-key snapshots, identities and writer factory |
| `packages/cli` | Profile queries, guarded writes and explicit connection checks through the shared integration |
| Private test workspaces | Dockline protocol regression fixtures and tests; not published connector packages |
| `scripts` | Build, package and consumer validation |
| `docs` | Independently built VitePress documentation |

`FileZillaHostKeyStore` reads modern FileZilla host keys without changing trust approvals. Identity JSON persistence is application-owned. [Connection architecture](/guide/dockline) describes execution and trust boundaries.
