#!/usr/bin/env node

// Force color on Windows by default if we are in a TTY to avoid messing up pipes
const args = process.argv.slice(2);

if (args.includes('--color')) {
    process.env.FORCE_COLOR = '1';
} else if (args.includes('--no-color')) {
    process.env.FORCE_COLOR = '0';
} else if (process.platform === 'win32' && process.env.FORCE_COLOR === undefined && process.stdout.isTTY) {
    process.env.FORCE_COLOR = '1';
}

import {run} from './index.js';

run().catch(err => {
    console.error(err);
    process.exit(1);
});
