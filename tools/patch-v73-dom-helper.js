#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'assets', 'ud-v73-command.js');
let js = fs.readFileSync(file, 'utf8');

const targetLines = [
  "  const NS = 'dashv2_';",
  '  const Dom = window.UDDom || {};',
  '  const $ = Dom.qs || ((selector, root = document) => root.querySelector(selector));',
  '  const $$ = Dom.qsa || ((selector, root = document) => Array.from(root.querySelectorAll(selector)));'
];
const target = targetLines.join('\n');

if (js.includes(target)) {
  console.log('V73 DOM helper patch already applied');
  process.exit(0);
}

const lines = js.split('\n');
const nsIndex = lines.indexOf("  const NS = 'dashv2_';");
if (nsIndex < 0) throw new Error('V73 NS line not found');

let endIndex = nsIndex + 1;
while (endIndex < lines.length) {
  const line = lines[endIndex];
  if (line.includes('const Dom = window.UDDom || {}') || line.includes('const $ =') || line.includes('const $$ =')) {
    endIndex += 1;
    continue;
  }
  break;
}

if (endIndex === nsIndex + 1) throw new Error('V73 selector helper lines not found');

lines.splice(nsIndex, endIndex - nsIndex, ...targetLines);
js = lines.join('\n');
fs.writeFileSync(file, js);
console.log('patched V73 to use UDDom selector helpers');
