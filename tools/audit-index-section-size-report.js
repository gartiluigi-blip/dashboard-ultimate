#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'index.html');
const outFile = path.join(root, 'docs', 'index-section-size-report.md');
const html = fs.readFileSync(file, 'utf8');

const markers = [];
const rules = [
  ['doctype', /<!doctype html/i],
  ['head', /<head\b/i],
  ['body', /<body\b/i],
  ['styles', /<style\b/gi],
  ['scripts-inline', /<script(?![^>]+src=)/gi],
  ['scripts-external', /<script[^>]+src=/gi],
  ['pages', /<section\b[^>]*(?:class="[^"]*page|id="p-)/gi],
  ['v72', /v72|UDV72|ud-v72/gi],
  ['v73', /v73|UD_V73|ud-v73/gi],
  ['v74', /v74|UDV74|ud-v74/gi],
  ['v75', /v75|ud-v75/gi],
  ['v76', /v76|ud-v76/gi],
  ['v78', /v78|ud-v78/gi],
  ['v79', /v79|ud-v79/gi],
  ['v80', /v80|ud-v80/gi]
];

for (const [label, re] of rules) {
  let match;
  re.lastIndex = 0;
  while ((match = re.exec(html))) {
    markers.push({ label, index: match.index });
  }
}

markers.sort((a, b) => a.index - b.index || a.label.localeCompare(b.label));

function lineOf(index) {
  return html.slice(0, index).split('\n').length;
}

function human(bytes) {
  if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  if (bytes > 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return String(bytes) + ' B';
}

const sections = [];
for (let i = 0; i < markers.length; i++) {
  const current = markers[i];
  const next = markers[i + 1];
  const end = next ? next.index : html.length;
  const bytes = Math.max(0, end - current.index);
  if (bytes === 0) continue;
  sections.push({
    label: current.label,
    line: lineOf(current.index),
    bytes,
    next: next ? next.label : 'EOF'
  });
}

const grouped = sections.reduce((acc, section) => {
  if (!acc[section.label]) acc[section.label] = { count: 0, bytes: 0 };
  acc[section.label].count += 1;
  acc[section.label].bytes += section.bytes;
  return acc;
}, {});

const top = sections.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 40);
const summaryRows = Object.entries(grouped)
  .sort((a, b) => b[1].bytes - a[1].bytes)
  .map(([label, data]) => `| ${label} | ${data.count} | ${data.bytes} | ${human(data.bytes)} |`);

const detailRows = top.map(section => {
  return `| ${section.line} | ${section.label} | ${section.next} | ${section.bytes} | ${human(section.bytes)} |`;
});

const report = [
  '# Index section size report',
  '',
  'Scope: `index.html`.',
  '',
  'Purpose: identify the largest extraction targets before touching the giant HTML file.',
  '',
  '## File size',
  '',
  `- Total bytes: ${html.length}`,
  `- Human size: ${human(html.length)}`,
  '',
  '## Summary by marker',
  '',
  '| Marker | Count | Bytes | Size |',
  '|---|---:|---:|---:|',
  ...summaryRows,
  '',
  '## Top sections by size',
  '',
  '| Start line | Marker | Next marker | Bytes | Size |',
  '|---:|---|---|---:|---:|',
  ...detailRows,
  '',
  '## Extraction order',
  '',
  '1. Extract the largest inline style blocks first.',
  '2. Extract large inline scripts only after a dedicated inline-script report.',
  '3. Keep V72/V73/V74 external modules untouched unless their own audits require changes.',
  '4. Avoid whole-file rewrites of `index.html`.',
  ''
].join('\n');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, report);
console.log(report);
