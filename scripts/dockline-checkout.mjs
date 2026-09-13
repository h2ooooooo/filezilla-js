import {existsSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';

export function docklinePackages(require) {
    return ['abstract', 'core', 'ftp-client', 'sftp-client'].map(name => ({
        name: `@jalsoedesign/dockline-${name}`,
        directory: path.dirname(require.resolve(`@jalsoedesign/dockline-${name}/package.json`)),
    }));
}

export function docklineCheckout(packages) {
    const root = path.resolve(packages[0].directory, '../..');
    const manifestPath = path.join(root, 'package.json');

    if (!existsSync(manifestPath) || !existsSync(path.join(root, 'scripts/build.mjs'))) {
        return undefined;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    if (manifest.private !== true || !manifest.workspaces?.includes('packages/*')) {
        return undefined;
    }

    for (const item of packages) {
        const expected = path.join(root, 'packages', item.name.slice('@jalsoedesign/dockline-'.length));

        if (
            !existsSync(expected) ||
            realpathSync(expected) !== realpathSync(item.directory) ||
            !existsSync(path.join(expected, 'src/index.ts')) ||
            !existsSync(path.join(expected, 'tsconfig.json'))
        ) {
            return undefined;
        }

        const packageManifest = JSON.parse(readFileSync(path.join(expected, 'package.json'), 'utf8'));

        if (packageManifest.name !== item.name) {
            return undefined;
        }
    }

    return root;
}
