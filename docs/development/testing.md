# Testing

Dockline owns the protocol implementation and its independent suite. FileZilla retains transport regression coverage against compatibility exports and adds plain-config mapping, cross-package class/error identity, and a real selected-credential → Dockline upload/download test. Install dependencies from npm and run `npm run build` before running individual workspace tests.

## Current commands

```sh
npm run lint
npm run build
npm test
npm run test:core
npm run test:cli
npm run test:ftp
npm run test:sftp
npm run test:shared
npm run test:build
npm run check:packages
npm run check:consumer
```

Turbo builds upstream packages before package tests. The current suite includes core import/credential/identity regressions, CLI child-process tests, shared option/error checks, transport unit/lifecycle cases and disposable loopback protocol integration tests.

Core/CLI tests verify canonical selection, exact credential whitespace, redacted serialization, malformed input, metadata isolation and full output. CLI children use declared local tsx through `process.execPath` with argument arrays, no shell and no undeclared npx resolution.

Transport cases exercise connection state, CWD restoration, shared errors, timestamps, stream ownership, abort/deadline behavior, replay policy and trust rejection. Test credentials and keys belong to fixtures; no user endpoints or real Site Manager credentials are needed.

## Dependency fixtures

Dockline loads its installed transport dependencies. FTP fixture error objects and the SFTP mock must resolve to the same dependency instance that Dockline loads. The connector Vitest configurations resolve those test imports from Dockline's manifest and inline Dockline for mocking. Production builds contain no aliases or dependency patches; the isolated tarball consumer separately verifies runtime exports without the test runner.

The disposable SSH fixture uses encrypted RSA keys to avoid an upstream random Ed25519 key-generation defect. Agent signing, key authentication and host verification remain exercised against a real local SSH server.

## Check the artifact consumers receive

Run package inventory after a clean build. Install packed artifacts into an isolated JavaScript/TypeScript consumer without workspace hoisting, resolve public entry points and compile declarations with `skipLibCheck: false`. Test the built CLI separately from its source runner. See [compiler and packaging](/development/compiler).

SFTP status conversion and Windows path normalization remain explicit upstream limitations. A green local suite does not establish that generic SFTP absence or the default Windows wrapper normalizer is resolved. Document those limitations when exposing affected operations.


## Feature acceptance coverage

Tests cover pool quotas and full resource lifetime, callback failures, rate budgets, source integrity, publication ownership and uncertain outcomes, async traversal cancellation, real FTP/FTPS and SFTP transfers, legacy filename round trips, agent signing, interactive challenges, managed-host-store conflicts, tolerant import diagnostics, stable identities and metadata snapshots. CLI check and recipe fixtures assert read-only probes or explicit owned transfer behavior. `npm run check:consumer` additionally compiles the packaged recipes and new public APIs with `skipLibCheck: false`.
