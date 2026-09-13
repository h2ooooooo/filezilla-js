// @see https://svn.filezilla-project.org/svn/FileZilla3/trunk/src/include/server.h

export enum ServerType {
    DEFAULT,
    UNIX,
    VMS,
    DOS, // Backslashes as preferred separator
    MVS,
    VXWORKS,
    ZVM,
    HPNONSTOP,
    DOS_VIRTUAL,
    CYGWIN,
    DOS_FWD_SLASHES, // Forwardslashes as preferred separator

    SERVERTYPE_MAX,
}
