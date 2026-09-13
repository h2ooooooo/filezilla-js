import {describe, it, expect} from 'vitest';
import {Server, ServerProtocol, LogonType} from '@jalsoedesign/filezilla-core';
import {SftpConnectorFactory} from '../src/SftpConnectorFactory.js';
import {SftpConnector} from '../src/SftpConnector.js';
import {
    AuthError,
    NotFoundError,
    PermissionError,
    UnsupportedProtocolError,
    NotSupportedError,
} from '../src/errors.js';

function createMockServer(props: Partial<any> = {}): Server {
    const defaultProps = {
        host: 'localhost',
        port: 22,
        protocol: ServerProtocol.SFTP,
        logonType: LogonType.normal,
        user: 'test',
        password: 'password',
        remoteDirectory: '',
        name: 'Test Server',
    };

    return new Server({...defaultProps, ...props} as any, 'Test Server');
}

describe('SftpConnectorFactory.fromServer - protocol mapping', () => {
    it('maps SFTP correctly', () => {
        const server = createMockServer({protocol: ServerProtocol.SFTP});
        const connector = SftpConnectorFactory.fromServer(server);

        expect(connector).toBeInstanceOf(SftpConnector);
    });

    it('throws for FTP', () => {
        const server = createMockServer({protocol: ServerProtocol.FTP});

        expect(() => SftpConnectorFactory.fromServer(server)).toThrow(UnsupportedProtocolError);
    });
});

describe('SftpConnectorFactory.fromServer - logon type guards', () => {
    it('throws for LogonType.anonymous', () => {
        const server = createMockServer({logonType: LogonType.anonymous});

        expect(() => SftpConnectorFactory.fromServer(server)).toThrow(NotSupportedError);
    });

    it('throws for LogonType.ask', () => {
        const server = createMockServer({logonType: LogonType.ask});

        expect(() => SftpConnectorFactory.fromServer(server)).toThrow(NotSupportedError);
    });

    it('handles LogonType.key with non-empty keyFile', () => {
        const server = createMockServer({logonType: LogonType.key, keyFile: 'path/to/key'});
        const connector = SftpConnectorFactory.fromServer(server);

        expect((connector as any).config.privateKeyPath).toBe('path/to/key');
    });

    it('throws for LogonType.key with empty keyFile', () => {
        const server = createMockServer({logonType: LogonType.key, keyFile: ''});

        expect(() => SftpConnectorFactory.fromServer(server)).toThrow(NotSupportedError);
    });
});

describe('error mapping', () => {
    it('maps "Authentication failed" to AuthError', () => {
        const err = new Error('Authentication failed');
        const wrapped = (SftpConnector as any)._wrapErrorForTest(err) as any;

        expect(wrapped).toBeInstanceOf(AuthError);
    });

    it('maps "No such file" to NotFoundError', () => {
        const err = new Error('No such file');
        const wrapped = (SftpConnector as any)._wrapErrorForTest(err) as any;

        expect(wrapped).toBeInstanceOf(NotFoundError);
    });

    it('maps "Permission denied" to PermissionError', () => {
        const err = new Error('Permission denied');
        const wrapped = (SftpConnector as any)._wrapErrorForTest(err) as any;

        expect(wrapped).toBeInstanceOf(PermissionError);
    });
});

describe('password not in error messages', () => {
    it('redacts password from error message', () => {
        const password = 'SECRET_PASSWORD';
        const err = new Error(`Error with ${password}`);
        const wrapped = (SftpConnector as any)._wrapErrorForTest(err, {password}) as any;

        expect(wrapped.message).not.toContain(password);
        expect(wrapped.message).toContain('[REDACTED]');
    });
});
