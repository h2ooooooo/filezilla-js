import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';

/** npm pack includes private workspaces unless public packages are selected explicitly. */
export async function publicWorkspaceArguments(repository) {
    const arguments_ = [];

    for (const directory of await readdir(path.join(repository, 'packages'))) {
        const manifest = JSON.parse(await readFile(path.join(repository, 'packages', directory, 'package.json'), 'utf8'));

        if (!manifest.private) {
            arguments_.push('--workspace=packages/' + directory);
        }
    }

    if (!arguments_.length) {
        throw new Error('No public workspaces were selected for packaging');
    }

    return arguments_;
}
