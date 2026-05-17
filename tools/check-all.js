#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const steps = [
  ['npm', ['run', 'patch']],
  ['npm', ['run', 'check:syntax']],
  ['npm', ['run', 'smoke:coach']],
  ['npm', ['run', 'audit:main-storage']],
  ['npm', ['run', 'audit:dead-code']],
  ['npm', ['run', 'audit:static']],
  ['npm', ['run', 'audit:prototypes']],
  ['npm', ['run', 'audit:storage']],
  ['npm', ['run', 'audit:lines']],
  ['npm', ['run', 'audit:size']],
  ['npm', ['run', 'audit:v74']],
  ['npm', ['run', 'audit:index']],
  ['npm', ['run', 'audit:secrets']]
];

for (const [cmd, args] of steps) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('\ncheck-all OK');
