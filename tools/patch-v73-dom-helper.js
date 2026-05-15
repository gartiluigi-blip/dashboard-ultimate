#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'assets', 'ud-v73-command.js');
let js = fs.readFileSync(file, 'utf8');

const target = [
  "  const NS = 'dashv2_';",
  '  const Dom = window.UDDom || {};',
  '  const $ = Dom.qs || ((selector, root = document) => root.querySelector(selector));',
  '  const $$ = Dom.qsa || ((selector, root = document) => Array.from(root.querySelectorAll(selector)));'
].join('\n');

if (js.includes(target)) {
  console.log('V73 DOM helper patch already applied');
  process.exit(0);
}

const re = /  const NS = 'dashv2_';\n(?:  const Dom = window\.UDDom \|\| \{\};\n)?  const \$ = [^\n]+\n  const \$\$ = [^\n]+/;

if (!re.test(js)) {
  throw new Error('V73 local selector helpers block not found');
}

js = js.replace(re, target);
fs.writeFileSync(file, js);
console.log('patched V73 to use UDDom selector helpers');
