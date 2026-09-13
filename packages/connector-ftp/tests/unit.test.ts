import {describe, it, expect} from 'vitest';
import {Server, ServerProtocol, LogonType, PasvMode} from '@jalsoedesign/filezilla-core';
import {FtpConnectorFactory} from '../src/FtpConnectorFactory.js';
import {FtpConnector} from '../src/FtpConnector.js';
import {
    AuthError,
    NotFoundError,
    PermissionError,
    UnsupportedProtocolError,
    NotSupportedError,
    ConnectorError,
} from '../src/errors.js';
import {FTPError} from 'basic-ftp';

// Helper: build a minimal Server-like object for testing.
function createMockServer(props: Partial<any> = {}): Server {
    const defaultProps = {
        host: 'localhost',
        port: 21,
        protocol: ServerProtocol.FTP,
        logonType: LogonType.normal,
        user: 'test',
        password: 'password',
        passiveMode: PasvMode.MODE_DEFAULT,
        remoteDirectory: '',
        name: 'Test Server',
    };

    return new Server({...defaultProps, ...props} as any, 'Test Server');
}

describe('FtpConnectorFactory.fromServer - protocol mapping', () => {
    it('maps FTP correctly', () => {
        const server = createMockServer({protocol: ServerProtocol.FTP});
        const connector = FtpConnectorFactory.fromServer(server);

        expect((connector as any).config.secure).toBe(true);
    });

    it('maps FTPS correctly', () => {
        const server = createMockServer({protocol: ServerProtocol.FTPS});
        const connector = FtpConnectorFactory.fromServer(server);

        expect((connector as any).config.secure).toBe('implicit');
    });

    it('maps FTPES correctly', () => {
        const server = createMockServer({protocol: ServerProtocol.FTPES});
        const connector = FtpConnectorFactory.fromServer(server);

        expect((connector as any).config.secure).toBe(true);
    });

    it('maps INSECURE_FTP correctly', () => {
        const server = createMockServer({protocol: ServerProtocol.INSECURE_FTP});
        const connector = FtpConnectorFactory.fromServer(server);

        expect((connector as any).config.secure).toBe(false);
    });
});

describe('FtpConnectorFactory.fromServer - unsupported protocols', () => {
    it('throws for SFTP', () => {
        const server = createMockServer({protocol: ServerProtocol.SFTP});

        expect(() => FtpConnectorFactory.fromServer(server)).toThrow(UnsupportedProtocolError);
    });

    it('throws for S3', () => {
        const server = createMockServer({protocol: ServerProtocol.S3});

        expect(() => FtpConnectorFactory.fromServer(server)).toThrow(UnsupportedProtocolError);
    });
});

describe('FtpConnectorFactory.fromServer - logon type guards', () => {
    it('throws for LogonType.ask', () => {
        const server = createMockServer({logonType: LogonType.ask});

        expect(() => FtpConnectorFactory.fromServer(server)).toThrow(NotSupportedError);
        expect(() => FtpConnectorFactory.fromServer(server)).toThrow(/ask/);
    });

    it('throws for LogonType.interactive', () => {
        const server = createMockServer({logonType: LogonType.interactive});

        expect(() => FtpConnectorFactory.fromServer(server)).toThrow(NotSupportedError);
    });

    it('throws for LogonType.key', () => {
        const server = createMockServer({logonType: LogonType.key});

        expect(() => FtpConnectorFactory.fromServer(server)).toThrow(NotSupportedError);
        expect(() => FtpConnectorFactory.fromServer(server)).toThrow(/sftp/i);
    });
});

describe('FtpConnectorFactory.fromServer - anonymous logon', () => {
    it('sets user to anonymous and empty password', () => {
        const server = createMockServer({logonType: LogonType.anonymous});
        const connector = FtpConnectorFactory.fromServer(server);

        expect((connector as any).config.user).toBe('anonymous');
        expect((connector as any).config.password).toBe('');
    });
});

describe('FtpConnectorFactory.fromServer - passive mode mapping', () => {
    it('maps MODE_DEFAULT to null', () => {
        const server = createMockServer({passiveMode: PasvMode.MODE_DEFAULT});
        const connector = FtpConnectorFactory.fromServer(server);

        expect((connector as any).config.passive).toBe(null);
    });

    it('maps MODE_ACTIVE to false', () => {
        const server = createMockServer({passiveMode: PasvMode.MODE_ACTIVE});
        const connector = FtpConnectorFactory.fromServer(server);

        expect((connector as any).config.passive).toBe(false);
    });

    it('maps MODE_PASSIVE to true', () => {
        const server = createMockServer({passiveMode: PasvMode.MODE_PASSIVE});
        const connector = FtpConnectorFactory.fromServer(server);

        expect((connector as any).config.passive).toBe(true);
    });
});

describe('error mapping', () => {
    it('maps 530 to AuthError', () => {
        const ftpErr = new FTPError({code: 530, message: 'Auth failed'} as any);
        const wrapped = (FtpConnector as any)._wrapErrorForTest(ftpErr) as any;

        expect(wrapped).toBeInstanceOf(AuthError);
        expect(wrapped.cause).toBeUndefined();
    });

    it('keeps ambiguous 550 responses as an error instead of confirmed absence', () => {
        const ftpErr = new FTPError({code: 550, message: 'Not found'} as any);
        const wrapped = (FtpConnector as any)._wrapErrorForTest(ftpErr) as any;

        expect(wrapped).toBeInstanceOf(ConnectorError);
        expect(wrapped).not.toBeInstanceOf(NotFoundError);
    });

    it('maps 532 to PermissionError', () => {
        const ftpErr = new FTPError({code: 532, message: 'Need account'} as any);
        const wrapped = (FtpConnector as any)._wrapErrorForTest(ftpErr) as any;

        expect(wrapped).toBeInstanceOf(PermissionError);
    });

    it('maps other to ConnectorError', () => {
        const ftpErr = new FTPError({code: 421, message: 'Timeout'} as any);
        const wrapped = (FtpConnector as any)._wrapErrorForTest(ftpErr) as any;

        expect(wrapped).toBeInstanceOf(ConnectorError);
    });
});

describe('password not in error messages', () => {
    it('redacts password from error message', () => {
        const password = 'SECRET_PASSWORD';
        const ftpErr = new FTPError({code: 500, message: `Error with ${password}`} as any);
        const wrapped = (FtpConnector as any)._wrapErrorForTest(ftpErr, password) as any;

        expect(wrapped.message).not.toContain(password);
        expect(wrapped.message).toContain('[REDACTED]');
    });
});
