// @see https://svn.filezilla-project.org/svn/FileZilla3/trunk/src/include/server.h

export enum ServerProtocol {
    // Never change any existing values or user's saved sites will become
    // corrupted
    UNKNOWN = -1,
    FTP, // FTP, attempts AUTH TLS
    SFTP,
    HTTP,
    FTPS, // Implicit SSL
    FTPES, // Explicit SSL
    HTTPS,
    INSECURE_FTP, // Insecure, as the name suggests

    S3, // Amazon S3 or compatible

    STORJ,

    WEBDAV,

    AZURE_FILE,
    AZURE_BLOB,

    SWIFT,

    GOOGLE_CLOUD,
    GOOGLE_DRIVE,

    DROPBOX,

    ONEDRIVE,

    B2,

    BOX,

    INSECURE_WEBDAV,

    RACKSPACE,

    STORJ_GRANT,

    S3_SSO,

    GOOGLE_CLOUD_SVC_ACC,

    CLOUDFLARE_R2,

    MAX_VALUE = CLOUDFLARE_R2,
}
