#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

// No baseline: patch-index-storage runs before this audit and removes the legacy block.
const allowed = new Set([]);

const ignoredDirs = new Set(['.git', 'node_modules', '.netlify', 'dist', 'build', '.cache']);
const exts = new Set(['.js', '.html']);

function protoRule(owner, methods) {
  return {
    name: owner + '.prototype mutation',
    re: new RegExp(owner + '\\.prototype\\.(' + methods.join('|') + ')\\s*=', 'g')
  };
}

const forbidden = [
  protoRule('Storage', ['getItem', 'setItem', 'removeItem', 'clear', 'key']),
  protoRule('Array', ['[A-Za-z_$][\\w$]*']),
  protoRule('Object', ['[A-Za-z_$][\\w$]*']),
  protoRule('String', ['[A-Za-z_$][\\w$]*'])
];

const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (exts.has(path.extname(entry.name).toLowerCase())) scan(full);
  }
}

function lineOf(text, idx) {
  return text.slice(0, idx).split('\n').length;
}

function scan(file) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    rule.re.lastIndex = 0;
    let match;
    while ((match = rule.re.exec(text))) {
      const line = lineOf(text, match.index);
      const id = `${rel}:${line}:${rule.name}`;
      if (!allowed.has(id)) findings.push({ file: rel, line, type: rule.name, sample: match[0] });
    }
  }
}

walk(root);

if (findings.length) {
  console.error('Forbidden prototype mutations found:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} · ${finding.type} · ${finding.sample}`);
  }
  process.exit(1);
}

console.log('prototype audit OK');
