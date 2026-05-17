#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const tag = '<script src="/assets/core/html.js"></script>';

if (html.includes(tag)) {
  console.log('HTML core already injected');
  process.exit(0);
}

const anchor = '<script src="/assets/core/dom.js"></script>';
const pos = html.indexOf(anchor);
if (pos < 0) throw new Error('core DOM script anchor not found');

const insertAt = pos + anchor.length;
html = html.slice(0, insertAt) + '\n' + tag + html.slice(insertAt);
fs.writeFileSync(file, html);
console.log('injected HTML core helper');
