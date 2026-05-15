#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const href = '/assets/styles/index-performance-mobile.css';
const link = `<link rel="stylesheet" href="${href}" data-extracted="ud-performance-step1-style">`;

if (html.includes(link)) {
  console.log('index css phase1 already applied');
  process.exit(0);
}

const startMarker = '<style id="ud-performance-step1-style">';
const start = html.indexOf(startMarker);
if (start < 0) throw new Error('performance style block not found');

const end = html.indexOf('</style>', start);
if (end < 0) throw new Error('performance style closing tag not found');

html = html.slice(0, start) + link + html.slice(end + '</style>'.length);
fs.writeFileSync(file, html);
console.log('extracted ud-performance-step1-style to external stylesheet');
