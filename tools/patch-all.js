#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const patchers = [
  'tools/patch-index-storage.js',
  'tools/patch-dom-core.js',
  'tools/patch-html-core.js',
  'tools/patch-v73-dom-helper.js',
  'tools/patch-v73-html-helper.js',
  'tools/patch-v73-core.js',
  'tools/patch-v72-storage.js',
  'tools/patch-dead-code-v75-focus.js',
  'tools/patch-epfc-dead-panels.js',
  'tools/patch-index-css-phase1.js',
  'tools/patch-font-fallback-css.js',
  'tools/patch-early-stub-script.js',
  'tools/patch-dead-code-phase2.js',
  'tools/patch-main-store-phase1.js'
];

for (const patcher of patchers) {
  console.log(`\n$ node ${patcher}`);
  const result = spawnSync(process.execPath, [patcher], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('\npatch-all OK');
