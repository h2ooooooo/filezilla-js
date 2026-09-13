# Compiler and packaging

The root build checks installed Dockline artifacts, then Turbo builds the five FileZilla packages. Dockline dependencies come from the public npm registry. The isolated consumer check installs FileZilla tarballs with those published dependencies, compiles strict TypeScript examples, and verifies runtime imports and the CLI.

## Compiler choice

The repository pins **TypeScript 6.0.3**. TypeScript 7 is intentionally deferred because the selected typescript-eslint tooling declares a supported compiler range below 6.1. Updating the compiler separately would weaken the declared lint/AST-tool compatibility contract; reassess them together.

| Shared compiler option | Value |
| --- | --- |
| target | ES2020 |
| module / moduleResolution | node16 / node16 |
| strict | true |
| declaration / declarationMap / sourceMap | true |
| esModuleInterop | true |
| skipLibCheck | true |
| types | node |

Package configs compile `src` into `dist` and exclude tests. Package builds are not substitutes for test execution or strict consumer checks with `skipLibCheck: false`.

## Consumer type checking

TypeScript 6 no longer includes every installed `@types` package in the global scope by default. Node applications consuming these packages need `@types/node` installed and `"types": ["node"]` in `compilerOptions`; retain any additional entries required by the application. The [installation example](/guide/installation#typescript-6-consumers) shows the minimal addition. This follows the [TypeScript 6 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).

The isolated consumer check compiles published declarations with strict mode, `skipLibCheck: false` and explicit Node types.

## Clean builds and module formats

`scripts/build-package.mjs` verifies that it runs in a known package, validates the owned output path, rejects a linked output directory, removes generated dist and invokes the locally declared compiler. Each package's build/prepack uses that path. Turbo coordinates upstream builds and caches dist output.

Core remains CommonJS; CLI/shared/concrete connectors remain ESM. Export maps declare runtime and type entry points plus package.json and compatibility `./dist/*` paths. Prefer root imports; no universal dual-format guarantee is implied.

Dockline declares the SFTP consumer type dependency required by its public output; FileZilla bridge manifests declare Dockline, and the shared factory/registry package still declares its Flystorage types. Hoisted development dependencies must not be used as evidence that a published declaration works independently.

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

`check:packages` inspects all five npm dry-run inventories after a build: runtime/types entry points, MIT/license metadata, required files, intentional allowlists and generated JavaScript with matching current source. It does not publish. A separate isolated tarball-consumer check must verify actual installation/imports and strict declarations.

## Linked checkout versus installed artifact

The Dockline build helper identifies a buildable checkout only when `src/index.ts`, `scripts/build.mjs` and `tsconfig.json` are present. Published artifacts may include source for source/declaration maps while intentionally omitting build tooling; those use their existing `dist/index.js` without running a build. An artifact without that entry point fails explicitly. `npm run test:build` exercises these three installation shapes in isolated fixtures and runs as part of `npm test`.
