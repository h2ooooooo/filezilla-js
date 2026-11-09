# Connection profiles

For executable source/list examples start with [normalized profiles](/api/profiles).

The shared contracts, queries, native storage safeguards and CLI infrastructure are supplied by Portline. FileZilla retains its own models, native adapters, writer factory and executable. The optional shared `@jalsoedesign/portline-dockline` integration supplies connection conversion and scoped execution for every supported reader.

[Portline architecture](https://github.com/h2ooooooo/portline/blob/main/docs/connection-profiles.md) · [Ecosystem directory](https://h2ooooooo.github.io/portline/) · [Development](https://github.com/h2ooooooo/portline/blob/main/docs/development.md)

Install built npm dependencies before building this repository. FileZilla does not locate or build other checkouts.

Existing FileZilla APIs, command output, runtime requirements and credential handling remain supported. Profile metadata contains credential references; stored values are resolved only through explicit credential requests.
