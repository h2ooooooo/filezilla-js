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

Follow [release setup](/development/releasing) to enable Pages. Review navigation, search, deep links and mobile layouts after theme or structural changes.
