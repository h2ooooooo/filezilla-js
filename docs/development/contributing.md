# Contributing

## Reproduce the behavior

Use synthetic XML, disposable local servers and public test fixtures. Keep patches focused on the affected package and preserve unrelated changes.

## Coding conventions

Follow CODING_STYLE.md: four-space indentation, single quotes, semicolons, same-line braces, compact named imports and one blank line between logical steps. Keep formatting separate from behavior changes. Prefer explicit types, early validation and small functions.

Keep XML interpretation in core and FileZilla configuration mapping in bridge packages. Generic transfer behavior belongs to Dockline. Define option precedence, resource ownership, cancellation and error semantics before adding behavior. An unknown server failure must not be treated as confirmed absence.

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

Update the relevant guides and reference pages with observable behavior and limitations. See [release setup](/development/releasing) for publication instructions.
