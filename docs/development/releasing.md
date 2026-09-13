# GitHub and npm release setup

The repository is [h2ooooooo/filezilla-js](https://github.com/h2ooooooo/filezilla-js). Public documentation is [h2ooooooo.github.io/filezilla-js](https://h2ooooooo.github.io/filezilla-js/). Each package README starts with that documentation link and its npm homepage uses the same URL.

## Create the GitHub repository

Create an empty public repository named `filezilla-js` under `h2ooooooo`. Do not initialize it with a README, license or .gitignore when uploading this existing repository. If it already exists, inspect its contents before pushing; do not overwrite existing history blindly.

From the repository directory, add the remote if it is not already configured:

```sh
git remote add origin https://github.com/h2ooooooo/filezilla-js.git
git push -u origin main
```

The initial commit contains the complete source, tests, public docs and workflows. A Git push does not publish npm packages.

If GitHub already has a separately initialized history, the normal push will be rejected. Fetch and inspect that history before deciding whether to preserve it or deliberately replace it. Replacing an existing branch requires an explicitly approved force-with-lease push; never use an unconditional force push.

## Enable GitHub Pages

1. Open the GitHub repository's Settings → Pages.
2. Under Build and deployment, choose GitHub Actions as the source.
3. Push main, or open Actions → Deploy VitePress docs to Pages → Run workflow.
4. Wait for the deploy job to finish, then open the documentation URL above.

The workflow uses the github-pages environment and only grants Pages write and identity-token permissions to the deployment job. No personal access token is required. You can also set the repository's About website to the documentation URL.

## npm account and scope

The packages use `@jalsoedesign`. Sign in with that npm user account, or an account authorized to publish in that scope. A personal account's matching scope works without creating a separate organization. Enable two-factor authentication and complete publishing prompts.

```sh
npm login --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
```

## Validate a release

Use the declared Node/npm versions. Run each command only after the previous one succeeds:

```sh
npm ci
npm run lint
npm run build
npm test
npm run check:repository
npm run check:packages
npm run check:consumer
npm run audit:production
npm run docs:install
npm run audit:docs
npm run docs:build
npm publish --workspaces --access public --dry-run
```

Review the package inventories. The private root and docs project are not published. See [dependencies](/development/dependencies) for development-only advisory limitations.

## Publish packages

Publish one at a time in dependency order:

```sh
npm publish --workspace=@jalsoedesign/filezilla-core --access public
npm publish --workspace=@jalsoedesign/filezilla-connector-abstract --access public
npm publish --workspace=@jalsoedesign/filezilla-connector-ftp --access public
npm publish --workspace=@jalsoedesign/filezilla-connector-sftp --access public
npm publish --workspace=@jalsoedesign/filezilla-cli --access public
```

Wait for each command to succeed before continuing. If a release stops partway through, resume with packages that have not been published. Published name/version pairs cannot be reused. Later releases, including README changes, require a new package version; update internal dependency ranges when compatibility requires it.

## Verify installation

```sh
npm view @jalsoedesign/filezilla-core version
npm view @jalsoedesign/filezilla-cli homepage
npm install -g @jalsoedesign/filezilla-cli
filezilla-js --help
```

For SDK use, follow the [quick start](/guide/quick-start). The CLI runs local saved-site queries; it contacts a server only when an explicit connection check is requested.

References: [npm scoped packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/), [npm publishing](https://docs.npmjs.com/cli/v11/commands/npm-publish/), [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
