#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');

const matches = (re) => Array.from(html.matchAll(re));
const count = (re) => matches(re).length;
const unique = arr => Array.from(new Set(arr));

const styleIds = matches(/<style\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi).map(m => m[1]);
const scriptIds = matches(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi).map(m => m[1]);
const linkedCss = matches(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi).map(m => m[1]);
const externalScripts = matches(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi).map(m => m[1]);

const patchTags = unique([...styleIds, ...scriptIds].filter(id => /v\d+|force|fix|cleanup|audit|patch/i.test(id)));
const duplicateIds = unique([...styleIds, ...scriptIds].filter((id, idx, arr) => arr.indexOf(id) !== idx));
const importantCount = count(/!important\b/g);
const inlineStyleBlocks = count(/<style\b/gi);
const inlineScriptBlocks = count(/<script\b(?![^>]*\bsrc=)/gi);
const localStorageRawWrites = count(/localStorage\.setItem\(/g);
const localStorageRawReads = count(/localStorage\.getItem\(/g);
const setIntervalCount = count(/setInterval\(/g);
const setTimeoutCount = count(/setTimeout\(/g);
const addEventListenerCount = count(/addEventListener\(/g);

const report = {
  file: 'index.html',
  bytes: Buffer.byteLength(html, 'utf8'),
  linkedCss,
  externalScripts,
  inlineStyleBlocks,
  inlineScriptBlocks,
  styleIdCount: styleIds.length,
  scriptIdCount: scriptIds.length,
  patchTagCount: patchTags.length,
  patchTags,
  duplicateIds,
  importantCount,
  localStorageRawReads,
  localStorageRawWrites,
  setIntervalCount,
  setTimeoutCount,
  addEventListenerCount
};

console.log(JSON.stringify(report, null, 2));

// Hard fail only on objective defects. Debt metrics are reported but not blocking yet.
if (duplicateIds.length) {
  console.error('Duplicate inline ids found:', duplicateIds.join(', '));
  process.exit(1);
}

if (!linkedCss.some(h => h.includes('/assets/main.'))) {
  console.error('Main CSS bundle not linked from index.html');
  process.exit(1);
}

if (!externalScripts.some(s => s.includes('/assets/main.') || s.includes('assets/main.'))) {
  console.error('Main JS bundle not linked from index.html');
  process.exit(1);
}
