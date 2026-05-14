#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

// Legacy debt intentionally baselined so this PR can land guardrails before the risky extraction.
// PR refactor/remove-storage-prototype-patch must delete these 3 entries.
const allowed = new Set([
  'index.html:33:Storage.prototype mutation',
  'index.html:34:Storage.prototype mutation',
  'index.html:35:Storage.prototype mutation',
  'index.html:36:Storage.prototype mutation',
  'index.html:40:Storage.prototype mutation',
  'index.html:63:Storage.prototype mutation'
]);

const ignoredDirs = new Set(['.git', 'node_modules', '.netlify', 'dist', 'build', '.cache']);
const exts = new Set(['.js', '.html']);

const forbidden = [
  { name: 'Storage.prototype mutation', re: /Storage\.prototype\.(getItem|setItem|removeItem|clear|key)\s*=/g },
  { name: 'Array.prototype mutation', re: /Array\.prototype\.[A-Za-z_$][\w$]*\s*=/g },
  { name: 'Object.prototype mutation', re: /Object\.prototype\.[A-Za-z_$][\w$]*\s*=/g },
  { name: 'String.prototype mutation', re: /String\.prototype\.[A-Za-z_$][\w$]*\s*=/g }
];

const findings = [];
function walk(dir){
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })){
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (exts.has(path.extname(entry.name).toLowerCase())) scan(full);
  }
}
function lineOf(text, idx){ return text.slice(0, idx).split('\n').length; }
function scan(file){
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of forbidden){
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(text))){
      const id = `${rel}:${lineOf(text, m.index)}:${rule.name}`;
      if (!allowed.has(id)) findings.push({ file:rel, line:lineOf(text, m.index), type:rule.name, sample:m[0] });
    }
  }
}
walk(root);
if (findings.length){
  console.error('Forbidden prototype mutations found:');
  for (const f of findings) console.error(`- ${f.file}:${f.line} · ${f.type} · ${f.sample}`);
  process.exit(1);
}
console.log('prototype audit OK');
