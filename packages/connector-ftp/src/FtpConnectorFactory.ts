import type {FtpTransferConfig} from '@jalsoedesign/dockline-ftp-client';
import {Server, ServerProtocol, LogonType, PasvMode, CharsetEncoding} from '@jalsoedesign/filezilla-core';
import {FtpConnector, FtpConnectorConfig} from './FtpConnector.js';
import {UnsupportedProtocolError, NotSupportedError} from './errors.js';
import {ConnectorFactory, type ConnectorOperationOptions, type ConnectorConnectionOptions} from '@jalsoedesign/filezilla-connector-abstract';
import type {ConnectionOptions} from 'node:tls';
import type {FtpFilenameEncodingOptions} from './filename-encoding.js';

export interface FtpConnectorFactoryOptions extends ConnectorOperationOptions, ConnectorConnectionOptions {
    secureOptions?: ConnectionOptions;
    filenameEncoding?: FtpFilenameEncodingOptions;
}

export class FtpConnectorFactory extends ConnectorFactory<FtpConnector, FtpConnectorFactoryOptions> {
    public fromServer(server: Server, options: FtpConnectorFactoryOptions = {}): FtpConnector {
        return FtpConnectorFactory.fromServer(server, options);
    }

    public toConfig(server: Server, options: FtpConnectorFactoryOptions = {}): FtpTransferConfig {
        return FtpConnectorFactory.toConfig(server, options);
    }

    public static fromServer(server: Server, options: FtpConnectorFactoryOptions = {}): FtpConnector {
        return new FtpConnector(FtpConnectorFactory.toConnectorConfig(server, options));
    }

    public static toConfig(server: Server, options: FtpConnectorFactoryOptions = {}): FtpTransferConfig {
        const {user, initialPath, secure, ...config} = FtpConnectorFactory.toConnectorConfig(server, options);
        let protocol: FtpTransferConfig['protocol'] = 'ftp';

        if (secure === 'implicit') {
            protocol = 'ftps-implicit';
        } else if (secure) {
            protocol = 'ftps';
        }

        return {
            ...config,
            protocol,
            username: user,
            root: initialPath,
        };
    }

    private static toConnectorConfig(
        server: Server,
        options: FtpConnectorFactoryOptions,
    ): FtpConnectorConfig {
        // 1. Check protocol
        const protocol = server.properties.protocol;

        if (
            protocol !== ServerProtocol.FTP &&
            protocol !== ServerProtocol.FTPS &&
            protocol !== ServerProtocol.FTPES &&
            protocol !== ServerProtocol.INSECURE_FTP
        ) {
            throw new UnsupportedProtocolError(`Protocol ${protocol} is not supported by FtpConnector`);
        }

        // 2. Check logonType
        const logonType = server.properties.logonType;

        switch (logonType) {
            case LogonType.ask:
                if (!options.credentialProvider) {
                    throw new NotSupportedError('LogonType \'ask\' requires a credential provider.');
                }

                break;
            case LogonType.interactive:
                if (!options.credentialProvider) {
                    throw new NotSupportedError('LogonType \'interactive\' requires a credential provider.');
                }

                break;
            case LogonType.key:
                throw new NotSupportedError('LogonType \'key\' is for SFTP only. Use @jalsoedesign/filezilla-connector-sftp.');
            case LogonType.profile:
                throw new NotSupportedError('LogonType \'profile\' is not supported in automated connectors.');
            case LogonType.adc:
                throw new NotSupportedError('LogonType \'adc\' is not supported in automated connectors.');
        }

        // 3. Map protocol to secure option:
        // FTP attempts TLS; do not silently downgrade when TLS is unavailable.
        // FTPS is implicit TLS; FTPES is explicit TLS.
        let secure: boolean | 'implicit' = false;

        if (protocol === ServerProtocol.FTPS) {
            secure = 'implicit';
        } else if (protocol === ServerProtocol.FTPES || protocol === ServerProtocol.FTP) {
            secure = true;
        }

        // 4. Map logonType for credentials:
        //    anonymous (0) -> user: "anonymous", password: ""
        //    normal (1), account (4) -> use server.properties.user and server.properties.password
        //    account (4): also console.warn that account field is ignored
        let user = server.properties.user || '';
        let password = server.properties.password || '';

        if (logonType === LogonType.anonymous) {
            user = 'anonymous';
            password = '';
        } else if (logonType === LogonType.account) {
            console.warn('LogonType "account" is used; account field is ignored');
        }

        // 5. Map passiveMode:
        //    PasvMode.MODE_DEFAULT (0) -> passive: null
        //    PasvMode.MODE_ACTIVE (1) -> passive: false
        //    PasvMode.MODE_PASSIVE (2) -> passive: true
        let passive: boolean | null = null;
        const passiveMode = server.properties.passiveMode;

        if (passiveMode === PasvMode.MODE_ACTIVE) {
            passive = false;
        } else if (passiveMode === PasvMode.MODE_PASSIVE) {
            passive = true;
        }

        // 6. Call server.getRemoteDirectory('') for initialPath
        const initialPath = server.getRemoteDirectory('');
        const filenameEncoding = options.filenameEncoding ?? (
            server.properties.encodingType === CharsetEncoding.ENCODING_CUSTOM ?
                {charset: server.properties.customEncoding ?? ''} : undefined
        );
        const config: FtpConnectorConfig = {
            host: server.properties.host || '',
            port: server.properties.port || (secure === 'implicit' ? 990 : 21),
            user,
            password,
            secure,
            initialPath,
            passive,
            siteId: server.path,
            ...options,
            filenameEncoding,
        };

        return config;
    }
}
