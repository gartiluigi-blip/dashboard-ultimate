#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const tag = '<script src="/assets/user-content-fixes.js"></script>';

if (html.includes(tag)) {
  console.log('user content fixes already injected');
  process.exit(0);
}

const anchor = '</body>';
const pos = html.lastIndexOf(anchor);
if (pos < 0) throw new Error('body closing tag not found');

html = html.slice(0, pos) + tag + '\n' + html.slice(pos);
fs.writeFileSync(file, html);
console.log('injected user content fixes');
