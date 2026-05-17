#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const outPath = path.join(root, 'docs', 'dead-code-report.md');
const html = fs.readFileSync(htmlPath, 'utf8');

const checks = [
  ['v75_focus_fab', /#v75-focus-fab/g],
  ['v75_focus_overlay', /#v75-focus-overlay/g],
  ['v78_grade_panel', /v78-grade-epfc/g],
  ['v79_grade_panel', /v79-grade-epfc/g],
  ['v80_display_fix', /v80|EPFC Display Fix/g],
  ['force_hidden', /display\s*:\s*none\s*!important/g],
  ['important_rules', /!important/g],
  ['inline_script_tags', /<script(?![^>]+src=)/g],
  ['inline_style_tags', /<style/g]
];

function count(re) {
  const m = html.match(re);
  return m ? m.length : 0;
}

function linesFor(re) {
  const lines = [];
  let match;
  re.lastIndex = 0;
  while ((match = re.exec(html))) {
    lines.push(html.slice(0, match.index).split('\n').length);
  }
  return lines.slice(0, 30);
}

const rows = checks.map(([name, re]) => ({ name, count: count(re), lines: linesFor(new RegExp(re.source, 'g')) }));

const report = [
  '# Dead code report',
  '',
  'Scope: `index.html`.',
  '',
  'Purpose: identify hidden legacy UI and inline debt before destructive cleanup.',
  '',
  '## Summary',
  '',
  '| Signal | Count | First lines |',
  '|---|---:|---|',
  ...rows.map(row => `| ${row.name} | ${row.count} | ${row.lines.join(', ')} |`),
  '',
  '## Cleanup order',
  '',
  '1. Remove disabled V75 focus overlay/fab if no active caller remains.',
  '2. Remove superseded V78/V79 EPFC grade panels if V80/V74 owns the screen.',
  '3. Extract remaining inline styles into dedicated CSS files.',
  '4. Extract remaining inline scripts into boot modules.',
  '5. Only then tighten CSP by removing unsafe-inline.',
  '',
  '## Rule',
  '',
  'A component hidden by forced CSS is not cleaned. It is still loaded debt.',
  ''
].join('\n');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, report);
console.log(report);
