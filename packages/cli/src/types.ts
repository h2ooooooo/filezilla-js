import type {SiteManager} from '@jalsoedesign/filezilla-core';
import type {ProfileCliOptions} from '@jalsoedesign/portline-cli';

export {formatOutput} from '@jalsoedesign/portline-cli';
export {remoteDirectoryFor} from './source.js';

export interface CommandContext {
    siteManager: SiteManager;
    args: string[];
    options: ProfileCliOptions;
}

export type CommandHandler = (ctx: CommandContext) => Promise<void> | void;
