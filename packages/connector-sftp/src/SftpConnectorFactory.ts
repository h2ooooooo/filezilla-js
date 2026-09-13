import type {SftpTransferConfig} from '@jalsoedesign/dockline-sftp-client';
import {Server, ServerProtocol, LogonType, CharsetEncoding} from '@jalsoedesign/filezilla-core';
import {ConnectorFactory} from '@jalsoedesign/filezilla-connector-abstract';
import {SftpConnector, type SftpConnectorConfig} from './SftpConnector.js';
import {UnsupportedProtocolError, NotSupportedError} from './errors.js';

export type SftpConnectorFactoryOptions = Omit<SftpConnectorConfig, 'host' | 'port' | 'username' | 'initialPath'>;

export class SftpConnectorFactory extends ConnectorFactory<SftpConnector, SftpConnectorFactoryOptions> {
    public fromServer(server: Server, options: SftpConnectorFactoryOptions = {}): SftpConnector {
        return SftpConnectorFactory.fromServer(server, options);
    }

    public toConfig(server: Server, options: SftpConnectorFactoryOptions = {}): SftpTransferConfig {
        return SftpConnectorFactory.toConfig(server, options);
    }

    public static fromServer(server: Server, options: SftpConnectorFactoryOptions = {}): SftpConnector {
        return new SftpConnector(SftpConnectorFactory.toConnectorConfig(server, options));
    }

    public static toConfig(server: Server, options: SftpConnectorFactoryOptions = {}): SftpTransferConfig {
        const {initialPath, ...config} = SftpConnectorFactory.toConnectorConfig(server, options);

        return {...config, protocol: 'sftp', root: initialPath};
    }

    private static toConnectorConfig(
        server: Server,
        options: SftpConnectorFactoryOptions,
    ): SftpConnectorConfig {
        const protocol = server.properties.protocol;

        if (protocol !== ServerProtocol.SFTP) {
            throw new UnsupportedProtocolError(`Protocol ${protocol} is not supported by SftpConnector`);
        }

        const config: SftpConnectorConfig = {
            ...options,
            host: server.properties.host || '',
            port: server.properties.port || 22,
            username: server.properties.user || '',
            initialPath: server.getRemoteDirectory(''),
        };

        if (!config.filenameEncoding && server.properties.encodingType === CharsetEncoding.ENCODING_CUSTOM) {
            config.filenameEncoding = {charset: server.properties.customEncoding ?? ''};
        }

        switch (server.properties.logonType) {
            case LogonType.anonymous:
                throw new NotSupportedError('SFTP does not support anonymous logon');
            case LogonType.normal:
            case LogonType.account:
                config.password = options.password ?? server.properties.password;
                break;
            case LogonType.ask:
                if (
                    !options.credentialProvider &&
                    options.password === undefined &&
                    options.keyboardInteractive === undefined &&
                    !options.agent
                ) {
                    throw new NotSupportedError("LogonType 'ask' requires a credentialProvider, explicit password, agent or keyboardInteractive handler");
                }

                config.password = options.password;
                break;
            case LogonType.interactive:
                if (options.keyboardInteractive === undefined) {
                    throw new NotSupportedError("LogonType 'interactive' requires a keyboardInteractive string or callback");
                }

                break;
            case LogonType.key:
                if (
                    !options.privateKey &&
                    !options.privateKeyPath &&
                    !server.properties.keyFile &&
                    !options.agent &&
                    !options.credentialProvider
                ) {
                    throw new NotSupportedError('keyFile is required for key-based auth');
                }

                config.privateKeyPath = options.privateKeyPath ??
                    (options.privateKey ? undefined : server.properties.keyFile);
                config.passphrase = options.passphrase ?? server.properties.password;
                break;
            case LogonType.profile:
                throw new NotSupportedError("LogonType 'profile' is not supported in automated connectors");
            case LogonType.adc:
                throw new NotSupportedError("LogonType 'adc' is not supported in automated connectors");
            default:
                throw new NotSupportedError(`LogonType ${server.properties.logonType} is not supported`);
        }

        return config;
    }
}
