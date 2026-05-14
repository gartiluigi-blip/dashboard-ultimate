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
  'assets/main.cfc54acb.js',
  'assets/ud-v72-godmode-pack.js',
  'assets/ud-v73-command.js',
  'assets/ud-v74-ops-features.js'
]);

const patterns = [
  /localStorage\.setItem\(/g,
  /localStorage\.getItem\(/g,
  /localStorage\.removeItem\(/g,
  /localStorage\s*\[/g,
  /window\.localStorage\s*\[/g
];

const findings = [];

function walk(dir){
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })){
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|html)$/.test(entry.name)) scan(full);
  }
}

function lineOf(text, idx){ return text.slice(0, idx).split('\n').length; }

function scan(file){
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  for (const re of patterns){
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))){
      if (!allowedFiles.has(rel)) {
        findings.push({ file:rel, line:lineOf(text, m.index), sample:m[0] });
      }
    }
  }
}

walk(root);

if (findings.length){
  console.error('Direct localStorage usage outside allowed legacy/core files:');
  for (const f of findings) console.error(`- ${f.file}:${f.line} · ${f.sample}`);
  process.exit(1);
}

console.log('direct storage audit OK');
