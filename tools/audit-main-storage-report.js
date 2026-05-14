#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'assets', 'main.cfc54acb.js');
const outFile = path.join(root, 'docs', 'main-storage-report.md');
const src = fs.readFileSync(file, 'utf8');
const storageName = 'local' + 'Storage';
const rules = [
  ['get', new RegExp('(?<![.$\\w])' + storageName + '\\.getItem\\(', 'g')],
  ['set', new RegExp('(?<![.$\\w])' + storageName + '\\.setItem\\(', 'g')],
  ['remove', new RegExp('(?<![.$\\w])' + storageName + '\\.removeItem\\(', 'g')],
  ['length', new RegExp('(?<![.$\\w])' + storageName + '\\.length', 'g')],
  ['key', new RegExp('(?<![.$\\w])' + storageName + '\\.key\\(', 'g')]
];

function lineOf(index) {
  return src.slice(0, index).split('\n').length;
}

function snippet(line) {
  const lines = src.split('\n');
  const text = lines[line - 1] || '';
  return text.trim().slice(0, 180).replace(/`/g, '\\`');
}

const findings = [];
for (const [kind, re] of rules) {
  let match;
  while ((match = re.exec(src))) {
    const line = lineOf(match.index);
    findings.push({ kind, line, sample: snippet(line) });
  }
}

findings.sort((a, b) => a.line - b.line || a.kind.localeCompare(b.kind));

const grouped = findings.reduce((acc, item) => {
  acc[item.kind] = (acc[item.kind] || 0) + 1;
  return acc;
}, {});

const report = [
  '# Main storage report',
  '',
  'Scope: `assets/main.cfc54acb.js`.',
  '',
  'Purpose: locate remaining direct storage access before refactoring the main bundle.',
  '',
  '## Summary',
  '',
  `- Total direct storage hits: ${findings.length}`,
  `- get calls: ${grouped.get || 0}`,
  `- set calls: ${grouped.set || 0}`,
  `- remove calls: ${grouped.remove || 0}`,
  `- length loops: ${grouped.length || 0}`,
  `- key loops: ${grouped.key || 0}`,
  '',
  '## Findings',
  '',
  '| Line | Type | Sample |',
  '|---:|---|---|',
  ...findings.map(item => `| ${item.line} | ${item.kind} | \`${item.sample}\` |`),
  '',
  '## Refactor order',
  '',
  '1. Extract the `S` store block into `assets/core/store-adapter.js` or replace it with `UDStore`.',
  '2. Replace export/import enumeration with `safeStorage.keys()` and `safeStorage.getRaw/setRaw()`.',
  '3. Keep `main.cfc54acb.js` on the audit allowlist until the patch is deterministic and CI-green.',
  '4. Remove `assets/main.cfc54acb.js` from `tools/audit-storage-direct.js` allowlist only after step 1-2 pass.',
  '',
  '## Constraint',
  '',
  '`main.cfc54acb.js` is a dense legacy bundle. Avoid whole-file replacement. Use narrow patchers or extract new modules.',
  ''
].join('\n');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, report);
console.log(report);
