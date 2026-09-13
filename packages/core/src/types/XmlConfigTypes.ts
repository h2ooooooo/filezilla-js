import {ServerProtocol} from '../enum/ServerProtocol';
import {ServerType} from '../enum/ServerType';
import {LogonType} from '../enum/LogonType';
import {PasvMode} from '../enum/PasvMode';
import {CharsetEncoding} from '../enum/CharsetEncoding';

export type XmlConfig = {
    FileZilla3: XmlRootFolderConfig;
};

export type XmlRootFolderConfig = {
    Servers: XmlFolderConfig;
};

export type XmlServerConfig = {
    Host: string;
    Port: number;
    Protocol: ServerProtocol;
    Type: ServerType;
    User?: string;
    Pass?: string | {'#text': string; '@_encoding': string};
    Logontype: LogonType;
    TimezoneOffset: number;
    PasvMode: PasvMode;
    MaximumMultipleConnections: number;
    EncodingType: CharsetEncoding;
    CustomEncoding?: string;
    BypassProxy: boolean;
    Name: string | {'#text': string; '@_encoding': string};
    Comments?: string;
    LocalDir?: string;
    RemoteDir?: string;
    SyncBrowsing: boolean;
    DirectoryComparison: boolean;
    Keyfile?: string;
};

export type XmlFolderConfig = {
    Server?: XmlServerConfig[] | XmlServerConfig;

    Folder?: XmlFolderConfig[] | XmlFolderConfig;

    '#text'?: string;
};
