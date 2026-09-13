import {describe, expect, it} from 'vitest';
import {Server, ServerProtocol, LogonType, PasvMode, CharsetEncoding, ServerType} from '@jalsoedesign/filezilla-core';
import {Dockline} from '@jalsoedesign/dockline-core';
import {FtpConnector as TransferFtpConnector, AuthError as TransferAuthError} from '@jalsoedesign/dockline-ftp-client';
import {FtpConnector, FtpConnectorFactory, AuthError} from '../src/index.js';

function site(protocol: ServerProtocol): Server {
    return new Server({
        host: 'localhost',
        port: protocol === ServerProtocol.FTPS ? 990 : 21,
        protocol,
        type: ServerType.UNIX,
        user: 'fixture',
        password: 'fixture-password',
        logonType: LogonType.normal,
        timezoneOffset: 0,
        passiveMode: PasvMode.MODE_PASSIVE,
        maximumMultipleConnections: 2,
        encodingType: CharsetEncoding.ENCODING_AUTO,
        bypassProxy: false,
        name: 'Example',
        synchronizedBrowsing: false,
        directoryComparison: false,
    }, 'Production/Example');
}

describe('FileZilla FTP to Dockline bridge', () => {
    it.each([
        [ServerProtocol.INSECURE_FTP, 'ftp'],
        [ServerProtocol.FTP, 'ftps'],
        [ServerProtocol.FTPES, 'ftps'],
        [ServerProtocol.FTPS, 'ftps-implicit'],
    ] as const)('preserves saved protocol %s as %s without weakening TLS', (protocol, expected) => {
        const saved = site(protocol);
        const config = FtpConnectorFactory.toConfig(saved, {maxTransientRetries: 7});

        expect(config).toMatchObject({
            protocol: expected,
            host: 'localhost',
            username: 'fixture',
            password: 'fixture-password',
            root: '',
            maxTransientRetries: 7,
            passive: true,
            siteId: 'Production/Example',
        });
        expect(config).not.toHaveProperty('user');
        expect(config).not.toHaveProperty('secure');
        expect(config).not.toHaveProperty('initialPath');
        expect(new FtpConnectorFactory().toConfig(saved)).toMatchObject({protocol: expected});
        expect(Dockline.create(config)).toBeInstanceOf(Dockline);
    });

    it('keeps existing class and error imports identical to Dockline', () => {
        expect(FtpConnector).toBe(TransferFtpConnector);
        expect(AuthError).toBe(TransferAuthError);
        expect(FtpConnectorFactory.fromServer(site(ServerProtocol.FTP))).toBeInstanceOf(TransferFtpConnector);
    });
});
