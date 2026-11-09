# Connection configuration

Portline profiles hold supported saved execution settings and credential references, never secret values. The shared `@jalsoedesign/portline-dockline` integration turns the selected definition into Dockline configuration with explicit runtime providers.

Native saved settings include endpoints, authentication requirements, remote roots, FTP TLS/passive policy and filename encoding. Runtime options include credentials, host verification, prompts, cancellation and operation deadlines. Configuration containing resolved credentials must not be logged as metadata.

`FileZillaHostKeyStore` is a core native-format reader and a read-only trust snapshot. Durable approvals are owned by the selected runtime trust provider.

See [connection architecture](/guide/dockline), [saved-site examples](/guide/quick-start), [Dockline configuration](https://h2ooooooo.github.io/dockline/guide/configuration) and [exact core signatures](/reference/types).

The [shared bridge reference](https://h2ooooooo.github.io/portline/integration/execution) defines method signatures, source and connection selection, runtime overrides, canonical trust pins, cancellation and errors for every reader. `toSshConfig` validates trust availability but its plain result does not contain the bridge's trust callback or saved pin set; use `withSsh` to retain those services.
