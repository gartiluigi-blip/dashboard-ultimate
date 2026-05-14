#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ignoredDirs = new Set(['.git', 'node_modules', '.netlify', 'dist', 'build', '.cache']);
const max = Number(process.env.MAX_JS_LINE_LENGTH || 220);
const findings = [];
const allowLong = new Set([
  'index.html',
  'assets/main.cfc54acb.js',
  'assets/main.b19fca0a.css'
]);

function walk(dir){
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })){
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|mjs|cjs)$/.test(entry.name)) scan(full);
  }
}
function scan(file){
  const rel = path.relative(root, file).replace(/\\/g, '/');
  if (allowLong.has(rel)) return;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (line.length > max) findings.push({ file:rel, line:idx+1, len:line.length });
  });
}
walk(root);
if (findings.length){
  console.error(`Lines over ${max} chars found:`);
  for (const f of findings.slice(0,80)) console.error(`- ${f.file}:${f.line} · ${f.len} chars`);
  if (findings.length > 80) console.error(`... ${findings.length - 80} more`);
  process.exit(1);
}
console.log('line length audit OK');
