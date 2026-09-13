import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {docklineCheckout, docklinePackages} from './dockline-checkout.mjs';

const require = createRequire(import.meta.url);
const packages = docklinePackages(require);
const checkout = docklineCheckout(packages);
const npmCli = process.env.npm_execpath;

if (!npmCli) {
    throw new Error('Run this build using npm run build:dockline');
}

if (!checkout) {
    for (const item of packages) {
        if (!existsSync(path.join(item.directory, 'dist/index.js'))) {
            throw new Error(`${item.name} has neither a buildable monorepo checkout nor a built package entry point`);
        }
    }

    console.log('Using the installed Dockline artifacts');
} else {
    const result = spawnSync(process.execPath, [npmCli, 'run', 'build'], {
        cwd: checkout,
        stdio: 'inherit',
        windowsHide: true,
    });

    if (result.error) {
        throw result.error;
    }

    process.exitCode = result.status ?? 1;
}
