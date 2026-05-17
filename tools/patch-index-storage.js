#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');

function ensureBeforeHeadEnd(markup) {
  if (html.includes(markup)) return;
  html = html.replace('</head>', markup + '\n</head>');
}

const storageBlockRe = /<script id="audit-localstorage-safe">[\s\S]*?<\/script>\n?/;
const safeStorage = '<script src="/assets/core/safe-storage.js"></script>';
const coreStore = '<script src="/assets/core/store.js"></script>';
const coreRouter = '<script src="/assets/core/router.js"></script>';

if (storageBlockRe.test(html)) {
  html = html.replace(storageBlockRe, safeStorage + '\n');
  console.log('removed storage prototype block from index.html');
} else {
  ensureBeforeHeadEnd(safeStorage);
  console.log('storage prototype block already absent');
}

ensureBeforeHeadEnd(coreStore);
ensureBeforeHeadEnd(coreRouter);

fs.writeFileSync(file, html);
console.log('ensured core store/router scripts in index.html');
