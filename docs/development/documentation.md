# Documentation

The VitePress site has its own manifest and lockfile, local search and a single dark Sunset theme. Public documentation is hosted at [h2ooooooo.github.io/filezilla-js](https://h2ooooooo.github.io/filezilla-js/).

## Commands

```sh
npm run docs:install
npm run docs:dev
npm run docs:build
npm run docs:preview
```

Root scripts delegate to the docs project. Static output is `docs/.vitepress/dist`. Build output and installed dependencies are excluded from Git.

## Editing

Keep examples aligned with exported package APIs. Put user-facing behavior in guides and reference pages, and contributor workflows in development pages. Register pages in `.vitepress/config.mts` and run the documentation build to validate links. The isolated consumer check compiles the quick-start examples.

## GitHub Pages

The Pages workflow runs on pushes to main and supports manual dispatch. It builds the docs using `DOCS_BASE=/filezilla-js/` (derived from GitHub Pages configuration) and `FILEZILLA_GITHUB_PAGES=true`. Pages builds emit explicit .html links; local development uses clean URLs. Uploading and deployment use the GitHub Pages artifact and environment.

## Keep API examples current

After building, run `npm run docs:api` to regenerate the public declaration reference, `npm run docs:api:check` to detect drift, and `npm run docs:imports:check` to validate documented named imports against installed declarations. Optional integration examples can be checked completely with `npm run docs:imports:check -- --consumer /path/to/isolated-consumer` after installing their adapter packages there. These checks do not fetch another checkout. Runnable local demos and isolated consumers exercise behavior beyond import names.


Run `npm run docs:examples:check` after changing a program or run tab. It checks language order, filenames, downloadable source, syntax, strict TypeScript types and local-fixture results. Keep complete programs separate from contextual recipes; label prerequisites, output and both ends of transfers.

The saved FTP, SFTP and SSH programs run against disposable loopback fixtures. The SSH fixture accepts only the example's quoted `uname -s` request and returns synthetic output; it never executes a host command. `dockline-ssh-client` is a development dependency for checking those programs, while the published core reader remains free of transport dependencies.


## Keep onboarding focused

Getting-started sections explain the immediate task, required inputs, code, run command and result. Put XML field constraints under validation, model/identity rules under their named contracts, and compiler/build instructions in contributor documentation. Keep requirements that affect the operation, such as verified host identity, credential loading, overwrite behavior and reviewing a write preview, beside the operation. Link to advanced detail instead of inserting it between setup and output.

## Verify unpublished dependencies

Normal checkouts use `npm ci --ignore-scripts` and public npm dependency ranges. Before dependency versions are published, collect their verified packages with `npm run pack:local -- --output /path/to/artifacts`. Keep the package inventories beside the tarballs. No sibling checkout layout is required.

```sh
npm run release:lock -- --artifacts /path/to/artifacts
npm run check:locks
npm run test:locks
npm run check:bootstrap -- --artifacts /path/to/artifacts
```

In Windows PowerShell, use `npm.cmd` for commands that forward arguments after `--` if the installed `npm.ps1` wrapper consumes that separator. The script must receive both `--artifacts` and its directory; use `npm.cmd run release:lock -- --artifacts C:/path/to/artifacts` in that case.

The lock command uses real package metadata and SHA-512 hashes from those artifacts, retaining canonical public npm URLs. The bootstrap check creates a disposable checkout, installs locked versions through a temporary read-only registry, and runs builds, lint, tests and available API/example checks. It does not change npm user configuration or relax remote-package restrictions. Node.js, the repository's declared npm version and the system `tar` command must be available.

This verifies candidate payloads, not their availability on npm. Publish the exact verified tarballs in dependency order; if a package changes, repack it, regenerate downstream locks and repeat the checks. Once dependencies are available publicly, verify a fresh `npm ci --ignore-scripts` without bootstrap and compare registry integrity with the reviewed artifacts.
