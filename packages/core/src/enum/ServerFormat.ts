// @see https://svn.filezilla-project.org/svn/FileZilla3/trunk/src/include/server.h

export enum ServerFormat {
    HOST_ONLY = 0,
    WITH_OPTIONAL_PORT,
    WITH_USER_AND_OPTIONAL_PORT,
    URL,
    URL_WITH_PASSWORD,
}
