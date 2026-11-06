import {getCommand as runCommand} from '@jalsoedesign/portline-cli';
import type {CommandHandler} from '../types.js';
import {fileZillaCommandContext} from '../source.js';

export const getCommand: CommandHandler = ctx => runCommand(fileZillaCommandContext(ctx));
