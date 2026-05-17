#!/usr/bin/env node
'use strict';

const { runNode } = require('./lib/run');

runNode('tools/patch-main-store-phase1.js');
console.log('main-store manual patch OK');
