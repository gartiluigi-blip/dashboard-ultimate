#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const script = 'tools/patch-main-store-phase1.js';
console.log(`$ node ${script}`);

const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);

console.log('main-store manual patch OK');
