#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const href = '/assets/styles/font-fallbacks.css';
const link = `<link rel="stylesheet" href="${href}" data-extracted="font-fallbacks">`;

if (html.includes(link)) {
  console.log('font fallback css already extracted');
  process.exit(0);
}

const anchor = "Fallback fonts with size-adjust";
const commentPos = html.indexOf(anchor);
if (commentPos < 0) throw new Error('font fallback comment not found');

const start = html.lastIndexOf('<style>', commentPos);
if (start < 0) throw new Error('font fallback style start not found');

const end = html.indexOf('</style>', commentPos);
if (end < 0) throw new Error('font fallback style end not found');

html = html.slice(0, start) + link + html.slice(end + '</style>'.length);
fs.writeFileSync(file, html);
console.log('extracted font fallback CSS');
