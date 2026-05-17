#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'index.html');
const outFile = path.join(root, 'docs', 'inline-script-report.md');
const html = fs.readFileSync(file, 'utf8');

function lineOf(index) {
  return html.slice(0, index).split('\n').length;
}

function human(bytes) {
  if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return String(bytes) + ' B';
}

function count(re, text) {
  return (text.match(re) || []).length;
}

function signals(js) {
  return {
    functions: count(/function\s+[A-Za-z_$]/g, js),
    arrows: count(/=>/g, js),
    listeners: count(/addEventListener\s*\(/g, js),
    timers: count(/setTimeout\s*\(|setInterval\s*\(/g, js),
    storage: count(/(?:localStorage|sessionStorage|UDStore|safeStorage)/g, js),
    network: count(/fetch\s*\(|XMLHttpRequest/g, js),
    evalLike: count(/eval\s*\(|new Function\s*\(/g, js),
    domWrites: count(/innerHTML\s*=|insertAdjacentHTML\s*\(/g, js)
  };
}

function preview(js) {
  return js
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(' ')
    .replace(/`/g, '\\`')
    .slice(0, 160);
}

const blocks = [];
const re = /<script(?![^>]+src=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let index = 0;
while ((match = re.exec(html))) {
  index += 1;
  const js = match[1] || '';
  const bytes = Buffer.byteLength(js, 'utf8');
  blocks.push({
    index,
    line: lineOf(match.index),
    bytes,
    ...signals(js),
    preview: preview(js)
  });
}

const totalBytes = blocks.reduce((sum, block) => sum + block.bytes, 0);
const sorted = blocks.slice().sort((a, b) => b.bytes - a.bytes);

function tableRow(block) {
  return [
    block.index,
    block.line,
    block.bytes,
    human(block.bytes),
    block.functions,
    block.listeners,
    block.timers,
    block.storage,
    block.network,
    block.evalLike,
    block.domWrites,
    '`' + block.preview + '`'
  ].join(' | ');
}

const rows = sorted.map(block => '| ' + tableRow(block) + ' |');

const report = [
  '# Inline script report',
  '',
  'Scope: `index.html`.',
  '',
  'Purpose: identify inline JavaScript blocks to extract progressively.',
  '',
  '## Summary',
  '',
  `- Inline script blocks: ${blocks.length}`,
  `- Total JS bytes: ${totalBytes}`,
  `- Human size: ${human(totalBytes)}`,
  '',
  '## Blocks by size',
  '',
  '| Block | Start line | Bytes | Size | Functions | Listeners | Timers | Storage refs | Network refs | Eval-like | DOM writes | Preview |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
  ...rows,
  '',
  '## Extraction order',
  '',
  '1. Extract small isolated boot guards first.',
  '2. Extract feature-specific scripts only when selectors and state keys are clear.',
  '3. Treat storage-heavy scripts as migration PRs, not simple extraction PRs.',
  '4. Treat DOM-write-heavy scripts as risky and keep PRs very small.',
  '5. Keep every extraction behind `npm run check`.',
  ''
].join('\n');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, report);
console.log(report);
