import {searchCommand as runCommand} from '@jalsoedesign/portline-cli';
import type {CommandHandler} from '../types.js';
import {fileZillaCommandContext} from '../source.js';

export const searchCommand: CommandHandler = ctx => runCommand(fileZillaCommandContext(ctx));
