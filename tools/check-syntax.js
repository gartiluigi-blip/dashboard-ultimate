#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const files = [
  'assets/core/safe-storage.js',
  'assets/core/store.js',
  'assets/core/router.js',
  'assets/ud-v72-godmode-pack.js',
  'assets/ud-v73-command.js',
  'assets/ud-v74-ops-features.js',
  'netlify/functions/coach.js',
  'tools/check-all.js',
  'tools/check-syntax.js',
  'tools/patch-all.js',
  'tools/patch-index-storage.js',
  'tools/patch-v73-core.js',
  'tools/patch-v72-storage.js',
  'tools/patch-dead-code-v75-focus.js',
  'tools/patch-epfc-dead-panels.js',
  'tools/patch-index-css-phase1.js',
  'tools/patch-font-fallback-css.js',
  'tools/patch-early-stub-script.js',
  'tools/patch-dead-code-phase2.js',
  'tools/patch-main-store-phase1.js',
  'tools/patch-main-store.js',
  'tools/audit-main-storage-report.js',
  'tools/audit-dead-code-report.js',
  'tools/audit-index-section-size-report.js',
  'tools/audit-inline-css-report.js',
  'tools/audit-inline-script-report.js',
  'tools/audit-post-extraction-hardening.js',
  'tools/smoke-coach.js',
  'tools/audit-static.js',
  'tools/audit-v74.js',
  'tools/audit-index-debt.js',
  'tools/audit-secrets.js',
  'tools/audit-prototypes.js',
  'tools/audit-storage-direct.js',
  'tools/audit-line-length.js',
  'tools/audit-size.js'
];

for (const file of files) {
  console.log(`$ node --check ${file}`);
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('syntax check OK');
