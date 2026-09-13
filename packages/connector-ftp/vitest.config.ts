import {createRequire} from 'node:module';
import {defineConfig} from 'vitest/config';

const require = createRequire(import.meta.url);
const docklineRequire = createRequire(require.resolve('@jalsoedesign/dockline-ftp-client/package.json'));

export default defineConfig({
    resolve: {
        alias: {
            'basic-ftp': docklineRequire.resolve('basic-ftp'),
        },
    },
    test: {
        globals: true,
        testTimeout: 15000,
        server: {
            deps: {inline: ['@jalsoedesign/dockline-ftp-client']},
        },
    },
});
