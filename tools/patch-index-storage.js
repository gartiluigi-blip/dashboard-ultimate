#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');

const blockRe = /<script id="audit-localstorage-safe">[\s\S]*?<\/script>\n?/;
if (!blockRe.test(html)) {
  console.log('storage prototype block already absent');
  process.exit(0);
}

const replacement = '<script src="/assets/core/safe-storage.js"></script>\n';
html = html.replace(blockRe, replacement);
fs.writeFileSync(file, html);
console.log('removed storage prototype block from index.html');
