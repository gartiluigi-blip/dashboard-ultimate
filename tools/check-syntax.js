#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const files = [
  'assets/core/safe-storage.js',
  'assets/core/store.js',
  'assets/core/router.js',
  'assets/core/dom.js',
  'assets/core/html.js',
  'assets/user-content-fixes.js',
  'assets/ud-v72-godmode-pack.js',
  'assets/ud-v73-command.js',
  'assets/ud-v74-ops-features.js',
  'netlify/functions/coach.js',
  'tools/check-all.js',
  'tools/check-syntax.js',
  'tools/patch-all.js',
  'tools/patch-user-content-fixes.js',
  'tools/patch-index-storage.js',
  'tools/patch-dom-core.js',
  'tools/patch-html-core.js',
  'tools/patch-v73-dom-helper.js',
  'tools/patch-v73-html-helper.js',
  'tools/patch-v73-core.js',
  'tools/patch-v72-storage.js',
  'tools/patch-main-store-phase1.js',
  'tools/audit-storage-direct.js',
  'tools/audit-secrets.js',
  'tools/audit-size.js',
  'tools/smoke-coach.js'
];

for (const file of files) {
  console.log(`$ node --check ${file}`);
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('syntax check OK');
