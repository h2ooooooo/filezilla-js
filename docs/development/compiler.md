# Compiler and packaging

Turbo builds the public FileZilla core and CLI packages. Private protocol workspaces retain regression fixtures and tests. The isolated consumer check installs public FileZilla tarballs with shared Portline/Dockline dependencies, compiles strict TypeScript examples, and verifies runtime imports and the CLI.

## Compiler choice

The repository pins **TypeScript 6.0.3**. TypeScript 7 is intentionally deferred because the selected typescript-eslint tooling declares a supported compiler range below 6.1. Updating the compiler separately would weaken the declared lint/AST-tool compatibility contract; reassess them together.

| Shared compiler option | Value |
| --- | --- |
| `target` | `ES2020` |
| `module` / `moduleResolution` | `node16` / `node16` |
| `strict` | `true` |
| `declaration` / `declarationMap` / `sourceMap` | `true` |
| `esModuleInterop` | `true` |
| `skipLibCheck` | `true` |
| `types` | `node` |

Package configs compile `src` into `dist` and exclude tests. Package builds are not substitutes for test execution or strict consumer checks with `skipLibCheck: false`.

## Consumer type checking

TypeScript 6 no longer includes every installed `@types` package in the global scope by default. Node applications consuming these packages need `@types/node` installed and `"types": ["node"]` in `compilerOptions`; retain any additional entries required by the application. The [installation example](/guide/installation#typescript-consumers) shows the minimal addition. This follows the [TypeScript 6 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).

The isolated consumer check compiles published declarations with strict mode, `skipLibCheck: false` and explicit Node types.

## Clean builds and module formats

`scripts/build-package.mjs` verifies that it runs in a known package, validates the owned output path, rejects a linked output directory, removes generated dist and invokes the locally declared compiler. Each package's build/prepack uses that path. Turbo coordinates upstream builds and caches dist output.

Core and the shared Portline–Dockline integration emit CommonJS; their named ESM imports also work on the supported Node runtimes. The CLI package emits ESM. Prefer package-root imports; no universal dual-format guarantee is implied.

The shared integration declares the Dockline types used by its public output while protocol clients remain optional. FileZilla core does not depend on transport code. Hoisted development dependencies must not be used as evidence that a published declaration works independently.

## Verification commands

```sh
npm ci
npm run lint
npm run build
npm test
npm run check:packages
npm run check:consumer
```

Lint is implemented in every package using ESLint/typescript-eslint and fails on warnings. CLI tests invoke a pinned local tsx through the current Node executable with argument arrays. Test and dev tasks are declared in the workspace toolchain.

`check:packages` inspects the public npm dry-run inventories after a build: runtime/types entry points, MIT/license metadata, required files, intentional allowlists and generated JavaScript with matching current source. Private test workspaces are excluded from packaging. It does not publish. A separate isolated tarball-consumer check verifies installation/imports and strict declarations.

## Linked checkout versus installed artifact

Development fixtures may identify a Dockline checkout only when its package source, TypeScript configuration and repository build helper are present. Published artifacts use their existing `dist/index.js`; an artifact without that entry point fails explicitly. Normal FileZilla builds compile only the owned core and CLI packages. Use verified tarballs and the [isolated bootstrap workflow](/development/documentation#verify-unpublished-dependencies) for unpublished family dependencies; no sibling checkout layout is required.
