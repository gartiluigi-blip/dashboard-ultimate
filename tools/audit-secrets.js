#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const allowedExt = new Set(['.html', '.js', '.css', '.json', '.md', '.yml', '.yaml', '.toml', '.txt']);
const ignoredDirs = new Set(['.git', 'node_modules', '.netlify', 'dist', 'build', '.cache']);

const patterns = [
  { name: 'Anthropic API key', re: /sk-ant-[A-Za-z0-9_-]{20,}/g },
  { name: 'OpenAI API key', re: /sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,}/g },
  { name: 'GitHub classic token', re: /ghp_[A-Za-z0-9_]{20,}/g },
  { name: 'GitHub fine-grained token', re: /github_pat_[A-Za-z0-9_]{20,}/g },
  { name: 'Generic bearer token', re: /Bearer\s+[A-Za-z0-9._-]{40,}/g }
];

const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!allowedExt.has(ext)) continue;
    scanFile(full);
  }
}

function lineOf(text, idx) {
  return text.slice(0, idx).split('\n').length;
}

function mask(value) {
  if (value.length <= 12) return '***';
  return value.slice(0, 6) + '…' + value.slice(-4);
}

function scanFile(file) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');
  for (const p of patterns) {
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(text))) {
      findings.push({ file: rel, line: lineOf(text, m.index), type: p.name, sample: mask(m[0]) });
    }
  }
}

walk(root);

if (findings.length) {
  console.error('Potential secrets found:');
  for (const f of findings) console.error(`- ${f.file}:${f.line} · ${f.type} · ${f.sample}`);
  process.exit(1);
}

console.log('secret audit OK');
