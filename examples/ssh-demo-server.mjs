import {createHash, generateKeyPairSync} from 'node:crypto';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const sshRequire = createRequire(require.resolve('@jalsoedesign/dockline-ssh-client/package.json'));
const {Server, utils} = sshRequire('ssh2');

/** Loopback-only documentation fixture; no command is executed on the host. */
export async function createSshDemoServer() {
    const keys = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: {type: 'pkcs1', format: 'pem'},
        publicKeyEncoding: {type: 'spki', format: 'pem'},
    });
    const key = utils.parseKey(keys.privateKey);

    if (key instanceof Error || Array.isArray(key)) {
        throw new Error('Could not generate documentation SSH key');
    }

    const fingerprint = 'SHA256:' + createHash('sha256').update(key.getPublicSSH())
        .digest('base64').replace(/=+$/, '');
    const connections = new Set();
    const server = new Server({hostKeys: [keys.privateKey]}, client => {
        connections.add(client);
        client.on('error', () => {});
        client.on('close', () => connections.delete(client));
        client.on('authentication', context => {
            if (
                context.method === 'password' &&
                context.username === 'fixture' &&
                context.password === 'fixture-password'
            ) {
                context.accept();
            } else {
                context.reject();
            }
        });
        client.on('ready', () => client.on('session', accept => {
            accept().on('exec', (acceptCommand, rejectCommand, info) => {
                if (info.command !== "'uname' '-s'") {
                    rejectCommand();

                    return;
                }

                const channel = acceptCommand();

                channel.write('Linux\n');
                channel.exit(0);
                channel.end();
            });
        }));
    });

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });

    return {
        port: server.address().port,
        fingerprint,
        async close() {
            for (const client of connections) {
                client.end();
            }

            await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        },
    };
}
