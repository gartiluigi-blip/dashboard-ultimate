#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');

const before = html;
const selectors = [
  '.v75-fixed-focus',
  '.v75-focus-overlay',
  '.v75-focus-box',
  '.v75-focus-time',
  '.v75-focus-task',
  '.v75-focus-actions'
];

for (const selector of selectors) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  html = html.replace(new RegExp('\\n' + escaped + '[^\\n]*', 'g'), '');
}

fs.writeFileSync(file, html);
console.log('removed V75 focus dead CSS rules:', before.length - html.length);
