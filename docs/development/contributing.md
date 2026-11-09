# Contributing

## Reproduce the behavior

Use synthetic XML, disposable local servers and public test fixtures. Keep patches focused on the affected package and preserve unrelated changes.

## Coding conventions

Follow `CODING_STYLE.md`: four-space indentation, single quotes, semicolons, same-line braces, compact named imports and one blank line between logical steps. Keep formatting separate from behavior changes. Prefer explicit types, early validation and small functions.

Keep XML interpretation and native-to-Portline mapping in core. Shared Portline-to-Dockline conversion belongs in `@jalsoedesign/portline-dockline`. Generic transfer behavior belongs to Dockline. Define option precedence, resource ownership, cancellation and error semantics before adding behavior. An unknown server failure must not be treated as confirmed absence.

## Verification

```sh
npm ci
npm run lint
npm run build
npm test
npm run check:packages
npm run check:consumer
npm run docs:install
npm run docs:build
```

The CI workflow runs Windows and Linux checks using the Node versions declared in its matrix. Dependencies are installed from public npm. Parser changes need malformed-input and credential-preservation coverage; protocol behavior needs realistic mocks or disposable servers; public API changes need isolated consumers.

## Stable releases and compatibility

Keep dependencies and optional peers between the published family packages on stable caret ranges, such as `^1.0.0`. Preserve existing public APIs and supported behavior throughout a major version. Release compatible fixes as patch versions and compatible additions as minor versions. Breaking changes require a new major version. Raise a dependency minimum only when the implementation needs a newer supported API or fix.

Caret ranges permit compatible updates. Consumers can use `npm update` to refresh their lockfiles within those ranges; `npm ci` continues to reproduce the versions already locked.
