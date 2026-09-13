import {getSiteManager} from '../src/SiteManager';
import {ServerProtocol} from '../src/enum/ServerProtocol';
import {LogonType} from '../src/enum/LogonType';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import {randomUUID} from 'crypto';

const fixture = (relative: string) => path.join(__dirname, '../fixtures', relative);

// ---------------------------------------------------------------------------
// general/sitemanager.multi.xml
// ---------------------------------------------------------------------------

describe('SiteManager - general/sitemanager.multi.xml', () => {
    const fixturePath = fixture('general/sitemanager.multi.xml');

    it('should parse all servers including deeply nested', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(6);
    });

    it('should parse SFTP at root level', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('SFTP (root location)');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('test.rebex.net');
            expect(server.properties.port).toBe(22);
            expect(server.properties.protocol).toBe(ServerProtocol.SFTP);
            expect(server.properties.user).toBe('demo');
            expect(server.properties.password).toBe('password');
            expect(server.properties.logonType).toBe(LogonType.normal);
        }
    });

    it('should parse FTP inside a folder including RemoteDir', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Rebex/FTP');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('test.rebex.net');
            expect(server.properties.port).toBe(21);
            expect(server.properties.protocol).toBe(ServerProtocol.INSECURE_FTP);
            expect(server.getRemoteDirectory()).toBe('/pub/example');
        }
    });

    it('should parse FTP SSL explicit inside a folder', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Rebex/FTP SSL (explicit)');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.protocol).toBe(ServerProtocol.FTPES);
        }
    });

    it('should parse FTP SSL implicit inside a folder', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Rebex/FTP SSL (implicit)');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.protocol).toBe(ServerProtocol.FTPS);
            expect(server.properties.port).toBe(990);
        }
    });

    it('should parse a server four folders deep', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Level 1/Level 2/Level 3/Level 4/FTP (deeply nested)');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('deep.example.com');
            expect(server.properties.port).toBe(21);
            expect(server.properties.protocol).toBe(ServerProtocol.INSECURE_FTP);
        }
    });
});

// ---------------------------------------------------------------------------
// general/sitemanager.folder.xml
// ---------------------------------------------------------------------------

describe('SiteManager - general/sitemanager.folder.xml', () => {
    const fixturePath = fixture('general/sitemanager.folder.xml');

    it('should parse all servers', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(3);
    });

    it('should parse root-level server', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Root Level Server');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('test.rebex.net');
            expect(server.properties.protocol).toBe(ServerProtocol.SFTP);
        }
    });

    it('should parse server inside top-level folder', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Top Folder/FTP in Folder');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.protocol).toBe(ServerProtocol.INSECURE_FTP);
        }
    });

    it('should parse server inside nested folder', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Top Folder/Nested Folder/SFTP in Nested Folder');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.protocol).toBe(ServerProtocol.SFTP);
        }
    });
});

// ---------------------------------------------------------------------------
// sftp/sitemanager.sftp.xml
// ---------------------------------------------------------------------------

describe('SiteManager - sftp/sitemanager.sftp.xml', () => {
    const fixturePath = fixture('sftp/sitemanager.sftp.xml');

    it('should parse one server', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(1);
    });

    it('should parse SFTP with password auth', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('SFTP Password Auth Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('test.rebex.net');
            expect(server.properties.port).toBe(22);
            expect(server.properties.protocol).toBe(ServerProtocol.SFTP);
            expect(server.properties.user).toBe('demo');
            expect(server.properties.password).toBe('password');
            expect(server.properties.logonType).toBe(LogonType.normal);
            expect(server.properties.keyFile).toBeUndefined();
        }
    });
});

// ---------------------------------------------------------------------------
// sftp/sitemanager.sftp.keyfile.xml
// ---------------------------------------------------------------------------

describe('SiteManager - sftp/sitemanager.sftp.keyfile.xml', () => {
    const fixturePath = fixture('sftp/sitemanager.sftp.keyfile.xml');

    it('should parse one server', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(1);
    });

    it('should parse SFTP with key file auth', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('SFTP Key Auth Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('sftp.example.com');
            expect(server.properties.port).toBe(22);
            expect(server.properties.protocol).toBe(ServerProtocol.SFTP);
            expect(server.properties.user).toBe('myuser');
            expect(server.properties.logonType).toBe(LogonType.key);
            expect(server.properties.keyFile).toBe('/home/user/.ssh/id_rsa');
            expect(server.properties.password).toBeUndefined();
        }
    });
});

// ---------------------------------------------------------------------------
// ftp/sitemanager.ftp.xml
// ---------------------------------------------------------------------------

describe('SiteManager - ftp/sitemanager.ftp.xml', () => {
    const fixturePath = fixture('ftp/sitemanager.ftp.xml');

    it('should parse one server', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(1);
    });

    it('should parse FTP with correct protocol and RemoteDir', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('FTP Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('test.rebex.net');
            expect(server.properties.port).toBe(21);
            expect(server.properties.protocol).toBe(ServerProtocol.INSECURE_FTP);
            expect(server.properties.user).toBe('demo');
            expect(server.properties.password).toBe('password');
            expect(server.properties.logonType).toBe(LogonType.normal);
            expect(server.getRemoteDirectory()).toBe('/pub/example');
        }
    });
});

// ---------------------------------------------------------------------------
// ftps/sitemanager.ftps.implicit.xml
// ---------------------------------------------------------------------------

describe('SiteManager - ftps/sitemanager.ftps.implicit.xml', () => {
    const fixturePath = fixture('ftps/sitemanager.ftps.implicit.xml');

    it('should parse one server', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(1);
    });

    it('should parse FTPS implicit with correct protocol and port', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('FTPS Implicit TLS Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('test.rebex.net');
            expect(server.properties.port).toBe(990);
            expect(server.properties.protocol).toBe(ServerProtocol.FTPS);
            expect(server.properties.user).toBe('demo');
            expect(server.properties.password).toBe('password');
            expect(server.properties.logonType).toBe(LogonType.normal);
        }
    });
});

// ---------------------------------------------------------------------------
// ftps/sitemanager.ftps.explicit.xml
// ---------------------------------------------------------------------------

describe('SiteManager - ftps/sitemanager.ftps.explicit.xml', () => {
    const fixturePath = fixture('ftps/sitemanager.ftps.explicit.xml');

    it('should parse one server', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(1);
    });

    it('should parse FTPES explicit with correct protocol and port', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('FTPS Explicit TLS Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('test.rebex.net');
            expect(server.properties.port).toBe(21);
            expect(server.properties.protocol).toBe(ServerProtocol.FTPES);
            expect(server.properties.user).toBe('demo');
            expect(server.properties.password).toBe('password');
            expect(server.properties.logonType).toBe(LogonType.normal);
        }
    });
});

// ---------------------------------------------------------------------------
// s3/sitemanager.s3.xml
// ---------------------------------------------------------------------------

describe('SiteManager - s3/sitemanager.s3.xml', () => {
    const fixturePath = fixture('s3/sitemanager.s3.xml');

    it('should parse one server', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(1);
    });

    it('should parse S3 with correct protocol and credentials', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('S3 Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('s3.amazonaws.com');
            expect(server.properties.port).toBe(443);
            expect(server.properties.protocol).toBe(ServerProtocol.S3);
            expect(server.properties.user).toBe('EXAMPLE_ACCESS_KEY_ID');
            expect(server.properties.password).toBe('example-secret-access-key');
            expect(server.properties.logonType).toBe(LogonType.normal);
        }
    });
});

// ---------------------------------------------------------------------------
// swift/sitemanager.swift.xml
// ---------------------------------------------------------------------------

describe('SiteManager - swift/sitemanager.swift.xml', () => {
    const fixturePath = fixture('swift/sitemanager.swift.xml');

    it('should parse one server', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(1);
    });

    it('should parse Swift with correct protocol and credentials', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Swift Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('identity.example.com');
            expect(server.properties.port).toBe(443);
            expect(server.properties.protocol).toBe(ServerProtocol.SWIFT);
            expect(server.properties.user).toBe('myuser');
            expect(server.properties.password).toBe('password');
            expect(server.properties.logonType).toBe(LogonType.normal);
        }
    });
});

// ---------------------------------------------------------------------------
// storj/sitemanager.storj.xml
// ---------------------------------------------------------------------------

describe('SiteManager - storj/sitemanager.storj.xml', () => {
    const fixturePath = fixture('storj/sitemanager.storj.xml');

    it('should parse one server', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(1);
    });

    it('should parse Storj with correct protocol and credentials', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Storj Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('us-central-1.tardigrade.io');
            expect(server.properties.port).toBe(7777);
            expect(server.properties.protocol).toBe(ServerProtocol.STORJ);
            expect(server.properties.user).toBe('myapikey');
            expect(server.properties.password).toBe('my-api-key-secret');
            expect(server.properties.logonType).toBe(LogonType.normal);
        }
    });
});

// ---------------------------------------------------------------------------
// storj/sitemanager.storj.grant.xml
// ---------------------------------------------------------------------------

describe('SiteManager - storj/sitemanager.storj.grant.xml', () => {
    const fixturePath = fixture('storj/sitemanager.storj.grant.xml');

    it('should parse one server', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(1);
    });

    it('should parse Storj Grant with correct protocol and no user', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Storj Grant Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('us-central-1.tardigrade.io');
            expect(server.properties.port).toBe(7777);
            expect(server.properties.protocol).toBe(ServerProtocol.STORJ_GRANT);
            expect(server.properties.user).toBeUndefined();
            expect(server.properties.password).toBe('my-grant-access-key');
            expect(server.properties.logonType).toBe(LogonType.normal);
        }
    });
});

// ---------------------------------------------------------------------------
// r2/sitemanager.r2.xml
// ---------------------------------------------------------------------------

describe('SiteManager - r2/sitemanager.r2.xml', () => {
    const fixturePath = fixture('r2/sitemanager.r2.xml');

    it('should parse one server', () => {
        const siteManager = getSiteManager(fixturePath);

        expect(siteManager.getServers().length).toBe(1);
    });

    it('should parse Cloudflare R2 with correct protocol and credentials', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('Cloudflare R2 Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.properties.host).toBe('r2.cloudflarestorage.com');
            expect(server.properties.port).toBe(443);
            expect(server.properties.protocol).toBe(ServerProtocol.CLOUDFLARE_R2);
            expect(server.properties.user).toBe('myaccesskeyid');
            expect(server.properties.password).toBe('mysecretaccesskey');
            expect(server.properties.logonType).toBe(LogonType.normal);
        }
    });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('SiteManager - error handling', () => {
    it('should throw when the file is not found', () => {
        // UUID in the path guarantees it cannot exist on any real machine,
        // even if the user has their own sitemanager.xml installed
        const notFoundPath = path.join(os.tmpdir(), `sitemanager-${randomUUID()}.xml`);

        expect(() => getSiteManager(notFoundPath)).toThrow(
            `Could not find sitemanager.xml at ${notFoundPath}`,
        );
    });

    it('should throw when the file contains valid XML but no FileZilla3 root element', () => {
        const tempFilePath = path.join(os.tmpdir(), `invalid-${randomUUID()}.xml`);

        fs.writeFileSync(tempFilePath, '<root><garbage>this is not a valid sitemanager file</garbage></root>');

        try {
            expect(() => getSiteManager(tempFilePath)).toThrow(
                'Invalid sitemanager.xml format: missing FileZilla3 root element',
            );
        } finally {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    });

    it('should throw when the path does not exist', () => {
        const fixturePath = fixture('ftp/sitemanager.ftp.xml');

        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('FTP Test (inexistent)');

        expect(server).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Server.getRemoteDirectory
// ---------------------------------------------------------------------------

describe('Server.getRemoteDirectory', () => {
    const fixturePath = fixture('ftp/sitemanager.ftp.xml');

    it('should parse the fixture RemoteDir into a path', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('FTP Test');

        expect(server).toBeDefined();

        if (server) {
            expect(server.getRemoteDirectory()).toBe('/pub/example');
        }
    });

    it('should handle a complex multi-segment RemoteDir', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('FTP Test');

        if (server) {
            server.propertiesRaw.remoteDirectory = '1 0 4 home 3 usr 3 www';
            expect(server.getRemoteDirectory()).toBe('/home/usr/www');
        }
    });

    it('should return the default when remoteDirectory is missing', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('FTP Test');

        if (server) {
            server.propertiesRaw.remoteDirectory = undefined;
            expect(server.getRemoteDirectory('/default')).toBe('/default');
        }
    });

    it('should reject malformed remoteDirectory instead of selecting the default root', () => {
        const siteManager = getSiteManager(fixturePath);
        const server = siteManager.getServerByPath('FTP Test');

        if (server) {
            server.propertiesRaw.remoteDirectory = 'invalid';
            expect(() => server.getRemoteDirectory('/default')).toThrow();
        }
    });
});

// ---------------------------------------------------------------------------
// SiteManager - searching
// ---------------------------------------------------------------------------

describe('SiteManager - searching', () => {
    const fixturePath = fixture('general/sitemanager.multi.xml');

    it('should find servers by name', () => {
        const siteManager = getSiteManager(fixturePath);
        const matches = siteManager.searchServers('SFTP');

        expect(matches.length).toBe(2); // SFTP (root location) and Rebex/SFTP
    });

    it('should find servers by path', () => {
        const siteManager = getSiteManager(fixturePath);
        const matches = siteManager.searchServers('Rebex/');

        expect(matches.length).toBe(4);
    });

    it('should be case-insensitive', () => {
        const siteManager = getSiteManager(fixturePath);
        const matches = siteManager.searchServers('sftp');

        expect(matches.length).toBe(2);
    });
});

// ---------------------------------------------------------------------------
// SiteManager - getServersTree
// ---------------------------------------------------------------------------

describe('SiteManager - getServersTree', () => {
    const fixturePath = fixture('general/sitemanager.multi.xml');

    it('should build a correct tree structure', () => {
        const siteManager = getSiteManager(fixturePath);
        const tree = siteManager.getServersTree();

        expect(tree.name).toBe('Root');
        expect(tree.folders.length).toBe(2); // Rebex and Level 1
        expect(tree.servers.length).toBe(1); // SFTP (root location)

        const rebexFolder = tree.folders.find((f) => f.name === 'Rebex');

        expect(rebexFolder).toBeDefined();

        if (rebexFolder) {
            expect(rebexFolder.servers.length).toBe(4);
        }
    });

    it('should work with a filtered list of servers', () => {
        const siteManager = getSiteManager(fixturePath);
        const filtered = siteManager.searchServers('Rebex');
        const tree = siteManager.getServersTree(filtered);

        expect(tree.folders.length).toBe(1);
        expect(tree.folders[0].name).toBe('Rebex');
        expect(tree.servers.length).toBe(0);
    });
});
