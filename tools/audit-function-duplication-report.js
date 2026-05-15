#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'docs', 'function-duplication-report.md');
const scanDirs = ['assets', 'tools', 'netlify'];
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.js$/.test(entry.name)) files.push(full);
  }
}

scanDirs.forEach(dir => walk(path.join(root, dir)));
if (fs.existsSync(path.join(root, 'index.html'))) files.push(path.join(root, 'index.html'));

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function lineOf(src, index) {
  return src.slice(0, index).split('\n').length;
}

function digest(value) {
  return crypto.createHash('sha1').update(value).digest('hex').slice(0, 12);
}

function normalizeBody(body) {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/(['"])[^'"]{1,120}\1/g, 'STR')
    .replace(/\b\d+(?:\.\d+)?\b/g, 'NUM')
    .trim();
}

function findMatchingBrace(src, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function collectFunctions(file, src) {
  const found = [];
  const patterns = [
    { kind: 'declaration', re: /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g },
    { kind: 'assignment', re: /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*function\s*\([^)]*\)\s*\{/g },
    { kind: 'arrow', re: /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/g },
    { kind: 'method', re: /\n\s*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g }
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.re.exec(src))) {
      const open = src.indexOf('{', match.index);
      const close = findMatchingBrace(src, open);
      if (open < 0 || close < 0) continue;
      const body = src.slice(open + 1, close);
      const normalized = normalizeBody(body);
      if (normalized.length < 40) continue;
      found.push({
        name: match[1],
        kind: pattern.kind,
        file: rel(file),
        line: lineOf(src, match.index),
        bytes: body.length,
        hash: digest(normalized),
        normalized
      });
    }
  }
  return found;
}

const functions = [];
const signals = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  functions.push(...collectFunctions(file, src));
  const text = rel(file);
  signals.push({
    file: text,
    escapeHTML: (src.match(/escapeHTML/g) || []).length,
    bindOnce: (src.match(/bindOnce/g) || []).length,
    delegate: (src.match(/delegate/g) || []).length,
    querySelector: (src.match(/querySelector/g) || []).length,
    addEventListener: (src.match(/addEventListener/g) || []).length,
    localStorage: (src.match(/localStorage/g) || []).length,
    innerHTML: (src.match(/innerHTML/g) || []).length
  });
}

const byName = new Map();
const byHash = new Map();
for (const fn of functions) {
  if (!byName.has(fn.name)) byName.set(fn.name, []);
  byName.get(fn.name).push(fn);
  if (!byHash.has(fn.hash)) byHash.set(fn.hash, []);
  byHash.get(fn.hash).push(fn);
}

const repeatedNames = [...byName.entries()]
  .filter(([, list]) => list.length > 1)
  .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

const repeatedBodies = [...byHash.entries()]
  .filter(([, list]) => list.length > 1)
  .sort((a, b) => b[1].length - a[1].length || b[1][0].bytes - a[1][0].bytes);

const signalRows = signals
  .filter(row => row.escapeHTML || row.bindOnce || row.delegate || row.querySelector || row.addEventListener || row.localStorage || row.innerHTML)
  .sort((a, b) => (b.querySelector + b.addEventListener + b.localStorage + b.innerHTML) - (a.querySelector + a.addEventListener + a.localStorage + a.innerHTML))
  .slice(0, 40)
  .map(row => `| ${row.file} | ${row.escapeHTML} | ${row.bindOnce} | ${row.delegate} | ${row.querySelector} | ${row.addEventListener} | ${row.localStorage} | ${row.innerHTML} |`);

function refs(list) {
  return list.slice(0, 8).map(fn => `${fn.file}:${fn.line}`).join('<br>');
}

const nameRows = repeatedNames.slice(0, 60).map(([name, list]) => {
  return `| ${name} | ${list.length} | ${refs(list)} |`;
});

const bodyRows = repeatedBodies.slice(0, 40).map(([hash, list]) => {
  const names = [...new Set(list.map(fn => fn.name))].slice(0, 8).join(', ');
  return `| ${hash} | ${list.length} | ${names} | ${refs(list)} |`;
});

const recommendations = [
  ['DOM binding', 'Créer un helper unique pour bindOnce/delegate et interdire les listeners directs répétitifs dans les nouvelles features.'],
  ['HTML escaping', 'Conserver une seule source `escapeHTML` et remplacer les duplicats éventuels par le helper global.'],
  ['Storage', 'Tout nouveau code doit passer par `UDStore` ou `safeStorage`, pas `localStorage` direct.'],
  ['Rendering', 'Isoler les gros `innerHTML` dans des renderers dédiés ou templates sécurisés.'],
  ['Index legacy', 'Ne pas supprimer une fonction répétée dans `index.html` sans preuve de non-utilisation runtime.']
];

const report = [
  '# Function duplication report',
  '',
  'Scope: `assets/**/*.js`, `tools/**/*.js`, `netlify/**/*.js`, and `index.html` inline JavaScript.',
  '',
  'Purpose: find repeated helpers, duplicated function bodies, and candidates for simplification/automation.',
  '',
  '## Summary',
  '',
  `- Files scanned: ${files.length}`,
  `- Functions detected: ${functions.length}`,
  `- Repeated function names: ${repeatedNames.length}`,
  `- Repeated normalized bodies: ${repeatedBodies.length}`,
  '',
  '## Repeated function names',
  '',
  '| Function | Count | Locations |',
  '|---|---:|---|',
  ...nameRows,
  '',
  '## Repeated normalized bodies',
  '',
  '| Body hash | Count | Names | Locations |',
  '|---|---:|---|---|',
  ...bodyRows,
  '',
  '## Repetition signals by file',
  '',
  '| File | escapeHTML | bindOnce | delegate | querySelector | addEventListener | localStorage | innerHTML |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
  ...signalRows,
  '',
  '## Recommended simplification path',
  '',
  '| Area | Action |',
  '|---|---|',
  ...recommendations.map(([area, action]) => `| ${area} | ${action} |`),
  '',
  '## Go / no-go',
  '',
  '- Go: extract helpers only when repeated logic has identical behavior and tests/checks stay green.',
  '- No-go: delete a function only because the name repeats. Legacy runtime may depend on global names.',
  '- No-go: combine unrelated features into one mega-helper.',
  ''
].join('\n');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, report);
console.log(report);
