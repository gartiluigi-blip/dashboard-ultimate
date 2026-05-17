#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const before = html.length;

const rules = [
  '.v75-fixed-focus',
  '.v75-focus-overlay',
  '.v75-focus-overlay.open',
  '.v75-focus-box',
  '.v75-focus-time',
  '.v75-focus-task',
  '.v75-focus-actions',
  '.v75-focus-actions button'
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const rule of rules) {
  const re = new RegExp('\\n' + escapeRegExp(rule) + '\\{[^\\n]*\\}', 'g');
  html = html.replace(re, '');
}

fs.writeFileSync(file, html);
console.log('dead code phase2 removed bytes:', before - html.length);
