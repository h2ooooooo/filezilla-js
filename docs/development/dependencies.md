# Dependencies

## Runtime choices

Dockline owns generic transport in four `@jalsoedesign/dockline-*` library packages at `^1.0.0`, plus an optional `@jalsoedesign/dockline-cli` utility. FileZilla does not depend on that utility. FileZilla bridges depend only on the matching abstract, FTP or SFTP package. The private root installs all four Dockline library packages from npm for development and SDK consumer tests. Runtime transport rows below describe the resolved Dockline dependency tree, not a second FileZilla implementation; core XML and FileZilla host-key XML parsing remain here.

The repair pass uses pinned reviewed versions rather than broad latest ranges:

| Dependency | Version | Use |
| --- | --- | --- |
| fast-xml-parser | 5.11.1 | Core XML validation/parsing |
| basic-ftp | 6.2.1 | FTP and FTPS |
| ssh2-sftp-client | 12.1.1 | SFTP, with ssh2 underneath |
| @flystorage/file-storage | 1.2.2 | Shared adapter/options contracts and optional wrapper |
| chalk | 6.0.0 | ESM CLI presentation |
| @types/ssh2-sftp-client | 9.0.6 | Declared Dockline SFTP consumer type dependency |
| @types/ssh2 | 1.15.6 | Declared Dockline SSH configuration/agent consumer types |

Internal packages use npm-compatible semver workspace links: core `^1.0.0` and shared connector contracts `^1.0.0`. Manifests and root lockfile now agree. The shared FileZilla factory/registry package retains its Flystorage contract dependency. All generic classes and errors are re-exported from Dockline; protocol clients are no longer direct production dependencies of the FileZilla bridge packages.

The library neither bundles FileZilla nor edits its external protocol dependencies' source. Upgrading a major transport version requires wire and consumer checks; the chosen versions are not a blanket endorsement of every future latest version.

## Development toolchain

| Tool | Version |
| --- | --- |
| npm | 12.0.2 |
| TypeScript | 6.0.3 |
| Turbo | 2.10.12 |
| Vitest / Vite | 5.0.0 / 8.3.0 |
| tsx | 4.23.13 |
| ESLint / @eslint/js | 10.10.0 / 10.0.1 |
| typescript-eslint | 8.70.0 |
| @types/node | 22.20.2 |
| ftp-srv | 4.6.3, disposable FTP fixtures; scoped uuid 11.1.1 override |
| ssh2 / @types/ssh2 | 1.17.0 / 1.15.6, disposable SFTP fixtures |

TypeScript 7 is deferred because the selected lint tooling's declared range is below 6.1. The repository's Node range follows npm support: `^22.22.2 || ^24.15.0 || >=26.0.0`. The package runtime floor is 22.22.2.

The docs have a separate lockfile with VitePress 1.6.4, Vue 3.5.30, Sass 1.104.0 and a docs-only Vite 6.4.3 override. They do not enter connector publication artifacts.

## Scoped overrides

| Parent | Resolved dependency | Reason and validation boundary |
| --- | --- | --- |
| ftp-srv 4.6.3 | uuid 11.1.1 | Removes the UUID advisory using its retained CommonJS v4 API. This crosses the server's old declared UUID range; real FTP/FTPS fixture checks validate the installed combination. The separate ip advisory remains. |
| VitePress 1.6.4, docs only | Vite 6.4.3 | Keeps the stable documentation generator while resolving fixed Vite/esbuild releases. The separate docs audit and VitePress build validate that tree. |

These npm overrides select unmodified released packages. They do not patch installed source, create forks or replace the transport libraries. Recheck the override when its parent updates; remove it when the parent's supported dependency range already selects a fixed release. CI checks production and documentation dependencies separately. Run the full development audit to inspect test-server dependencies too.
## Current advisory review

The production and documentation dependency trees pass npm audit. The development tree has two high-severity affected package entries from the unresolved `ip` advisory through the `ftp-srv` test server. These packages are not shipped as runtime dependencies. There is no compatible upstream fix in the installed server release; resolving this requires an upstream update or replacing the test server. No dependency source is patched.

Root `audit:dependencies`, `audit:production` and `audit:docs` scripts run the following explicit online checks:

```sh
npm audit --offline=false --audit=true --include=dev
npm audit --offline=false --audit=true --omit=dev
npm --prefix docs audit --offline=false --audit=true --include=dev
```

An inherited offline configuration can return an empty advisory result without a current registry lookup. A failed network request is not a clean audit. Preserve the lockfile and distinguish affected package entries from exploit count; only apply compatible fixes that pass protocol and consumer checks.

Correctness issues **SFTP status conversion** (SFTP generic failure rewritten as absence) and **Windows path normalization** (Flystorage Windows normalization) are independent of npm advisory counts and remain upstream. The library does not patch dependency source, and no clean audit should be described as fixing those behaviors.

Upstream projects: [basic-ftp](https://github.com/patrickjuchli/basic-ftp), [ssh2-sftp-client](https://github.com/theophilusx/ssh2-sftp-client), [Flystorage](https://github.com/duna-oss/flystorage), [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser).
