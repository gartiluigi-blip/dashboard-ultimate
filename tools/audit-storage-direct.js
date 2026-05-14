#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ignoredDirs = new Set(['.git', 'node_modules', '.netlify', 'dist', 'build', '.cache']);
const allowedFiles = new Set([
  'index.html',
  'assets/core/safe-storage.js',
  'assets/core/store.js',
  'assets/core/router.js',
  'assets/main.cfc54acb.js'
]);

const storageName = 'local' + 'Storage';
const patterns = [
  new RegExp(storageName + '\\.setItem\\(', 'g'),
  new RegExp(storageName + '\\.getItem\\(', 'g'),
  new RegExp(storageName + '\\.removeItem\\(', 'g'),
  new RegExp(storageName + '\\s*\\[', 'g'),
  new RegExp('window\\.' + storageName + '\\s*\\[', 'g')
];

const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|html)$/.test(entry.name)) scan(full);
  }
}

function lineOf(text, idx) {
  return text.slice(0, idx).split('\n').length;
}

function scan(file) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  for (const re of patterns) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text))) {
      if (!allowedFiles.has(rel)) {
        findings.push({ file: rel, line: lineOf(text, match.index), sample: match[0] });
      }
    }
  }
}

walk(root);

if (findings.length) {
  console.error('Direct storage usage outside allowed legacy/core files:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} · ${finding.sample}`);
  }
  process.exit(1);
}

console.log('direct storage audit OK');
