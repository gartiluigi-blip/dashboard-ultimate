#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'index.html');
const outFile = path.join(root, 'docs', 'inline-css-report.md');
const html = fs.readFileSync(file, 'utf8');

function lineOf(index) {
  return html.slice(0, index).split('\n').length;
}

function human(bytes) {
  if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return String(bytes) + ' B';
}

function firstSelectors(css) {
  return css
    .split('{')
    .slice(0, 6)
    .map(part => part.split('}').pop().trim())
    .filter(Boolean)
    .map(text => text.replace(/\s+/g, ' ').slice(0, 80));
}

const blocks = [];
const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
let match;
let index = 0;
while ((match = re.exec(html))) {
  index += 1;
  const css = match[1] || '';
  const bytes = Buffer.byteLength(css, 'utf8');
  blocks.push({
    index,
    line: lineOf(match.index),
    bytes,
    important: (css.match(/!important/g) || []).length,
    media: (css.match(/@media/g) || []).length,
    keyframes: (css.match(/@keyframes/g) || []).length,
    selectors: firstSelectors(css)
  });
}

const totalBytes = blocks.reduce((sum, block) => sum + block.bytes, 0);
const sorted = blocks.slice().sort((a, b) => b.bytes - a.bytes);

const rows = sorted.map(block => {
  const selectors = block.selectors.join('<br>');
  return `| ${block.index} | ${block.line} | ${block.bytes} | ${human(block.bytes)} | ${block.important} | ${block.media} | ${block.keyframes} | ${selectors} |`;
});

const report = [
  '# Inline CSS report',
  '',
  'Scope: `index.html`.',
  '',
  'Purpose: identify inline CSS blocks to extract progressively.',
  '',
  '## Summary',
  '',
  `- Style blocks: ${blocks.length}`,
  `- Total CSS bytes: ${totalBytes}`,
  `- Human size: ${human(totalBytes)}`,
  '',
  '## Blocks by size',
  '',
  '| Block | Start line | Bytes | Size | !important | @media | @keyframes | First selectors |',
  '|---:|---:|---:|---:|---:|---:|---:|---|',
  ...rows,
  '',
  '## Extraction order',
  '',
  '1. Extract the largest style block first only if selectors are clearly scoped.',
  '2. Extract small isolated feature CSS before global CSS.',
  '3. Do not extract CSS containing broad resets without visual review.',
  '4. Keep each extraction behind `npm run check`.',
  ''
].join('\n');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, report);
console.log(report);
