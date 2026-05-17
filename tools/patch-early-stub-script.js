#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const src = '/assets/early-stub.js';
const tag = `<script src="${src}" id="early-stub" data-extracted="early-stub"></script>`;

if (html.includes(tag)) {
  console.log('early stub script already extracted');
  process.exit(0);
}

const startMarker = '<script id="early-stub">';
const start = html.indexOf(startMarker);
if (start < 0) throw new Error('early stub script start not found');

const end = html.indexOf('</script>', start);
if (end < 0) throw new Error('early stub script end not found');

html = html.slice(0, start) + tag + html.slice(end + '</script>'.length);
fs.writeFileSync(file, html);
console.log('extracted early stub script');
