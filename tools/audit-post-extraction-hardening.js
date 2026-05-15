#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'docs', 'post-extraction-hardening-report.md');

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function has(rel, needle) {
  return exists(rel) && read(rel).includes(needle);
}

const checks = [
  ['CSS extraction', 'assets/styles/index-performance-mobile.css', exists('assets/styles/index-performance-mobile.css')],
  ['Font fallback CSS', 'assets/styles/font-fallbacks.css', exists('assets/styles/font-fallbacks.css')],
  ['Early stub JS', 'assets/early-stub.js', exists('assets/early-stub.js')],
  ['CSS phase1 patcher', 'tools/patch-index-css-phase1.js', exists('tools/patch-index-css-phase1.js')],
  ['Font fallback patcher', 'tools/patch-font-fallback-css.js', exists('tools/patch-font-fallback-css.js')],
  ['Early stub patcher', 'tools/patch-early-stub-script.js', exists('tools/patch-early-stub-script.js')],
  ['Dead code phase2 patcher', 'tools/patch-dead-code-phase2.js', exists('tools/patch-dead-code-phase2.js')],
  ['Main store patcher', 'tools/patch-main-store-phase1.js', exists('tools/patch-main-store-phase1.js')],
  ['Manual main store runner', 'tools/patch-main-store.js', exists('tools/patch-main-store.js')],
  ['Manual main store npm script', 'package.json', has('package.json', 'patch:main-store')],
  ['Main store syntax checked', 'tools/check-syntax.js', has('tools/check-syntax.js', 'tools/patch-main-store-phase1.js')],
  ['Manual runner syntax checked', 'tools/check-syntax.js', has('tools/check-syntax.js', 'tools/patch-main-store.js')]
];

const failures = checks.filter(([, , ok]) => !ok);
const rows = checks.map(([name, target, ok]) => {
  return `| ${name} | ${target} | ${ok ? 'OK' : 'MISSING'} |`;
});

const report = [
  '# Post extraction hardening report',
  '',
  'Scope: CSS/JS extractions, cleanup patchers, and main-store tooling.',
  '',
  '## Summary',
  '',
  `- Checks: ${checks.length}`,
  `- Passing: ${checks.length - failures.length}`,
  `- Failing: ${failures.length}`,
  '',
  '## Checks',
  '',
  '| Area | Target | Status |',
  '|---|---|---|',
  ...rows,
  '',
  '## Operational status',
  '',
  '- `npm run patch` remains the standard safe patch chain.',
  '- `npm run patch:main-store` is intentionally manual.',
  '- Main-store patching is prepared but not forced into the global patch chain.',
  '- `index.html` and `assets/main.cfc54acb.js` remain legacy-sensitive zones.',
  '',
  '## Next hardening moves',
  '',
  '1. Decide whether to run `npm run patch:main-store` in a dedicated PR.',
  '2. If successful, remove main bundle storage exceptions from storage audit.',
  '3. Update documentation with final state.',
  '4. Defer CSP tightening until inline CSS/JS debt is substantially lower.',
  ''
].join('\n');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, report);
console.log(report);

if (failures.length) process.exit(1);
