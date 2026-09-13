// @see https://svn.filezilla-project.org/svn/FileZilla3/trunk/src/include/server.h

export enum LogonType {
    anonymous,
    normal,
    ask, // ask should not be sent to the engine, it's intended to be used by the interface
    interactive,
    account,
    key,
    profile,		// S3 profile
    adc,			// Google Cloud Application Default Credenttials

    count,
}
