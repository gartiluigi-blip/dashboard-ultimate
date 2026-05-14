#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const budgetsPath = path.join(root, 'tools', 'size-budgets.json');
const budgets = JSON.parse(fs.readFileSync(budgetsPath, 'utf8'));
const findings = [];

function sizeOf(rel){
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return 0;
  return fs.statSync(p).size;
}

for (const [file, maxBytes] of Object.entries(budgets.files || {})){
  const size = sizeOf(file);
  if (size > maxBytes) findings.push({ file, size, maxBytes });
}

if (findings.length){
  console.error('Size budget exceeded:');
  for (const f of findings) console.error(`- ${f.file}: ${f.size} bytes > ${f.maxBytes} bytes`);
  process.exit(1);
}

console.log('size audit OK');
