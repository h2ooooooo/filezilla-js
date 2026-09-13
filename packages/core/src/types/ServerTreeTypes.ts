import {Server} from '../Server';

export interface ServerFolderNode {
    name: string;
    folders: ServerFolderNode[];
    servers: Server[];
}

export interface ServerTree extends ServerFolderNode {
    name: 'Root';
}
