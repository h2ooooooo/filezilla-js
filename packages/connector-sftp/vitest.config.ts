import {createRequire} from 'node:module';
import {defineConfig} from 'vitest/config';

const require = createRequire(import.meta.url);
const docklineRequire = createRequire(require.resolve('@jalsoedesign/dockline-sftp-client/package.json'));

export default defineConfig({
    resolve: {
        alias: {
            'ssh2-sftp-client': docklineRequire.resolve('ssh2-sftp-client'),
        },
    },
    test: {
        globals: true,
        testTimeout: 15000,
        server: {
            deps: {inline: ['@jalsoedesign/dockline-sftp-client']},
        },
    },
});
