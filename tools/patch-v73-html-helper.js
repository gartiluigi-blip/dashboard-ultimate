#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'assets', 'ud-v73-command.js');
let js = fs.readFileSync(file, 'utf8');

const marker = 'if (window.UDHtml && typeof window.UDHtml.escape === \'function\')';
if (js.includes(marker)) {
  console.log('V73 HTML helper patch already applied');
  process.exit(0);
}

const before = [
  '  function escapeHtml(value) {',
  '    if (window.escapeHTML) return window.escapeHTML(value);',
  "    return String(value ?? '').replace(/[&<>\"']/g, char => ({",
  "      '&': '&amp;',",
  "      '<': '&lt;',",
  "      '>': '&gt;',",
  "      '\"': '&quot;',",
  "      \"'\": '&#39;'",
  '    }[char]));',
  '  }'
].join('\n');

const after = [
  '  function escapeHtml(value) {',
  "    if (window.UDHtml && typeof window.UDHtml.escape === 'function') {",
  '      return window.UDHtml.escape(value);',
  '    }',
  '    if (window.escapeHTML) return window.escapeHTML(value);',
  "    return String(value ?? '').replace(/[&<>\"']/g, char => ({",
  "      '&': '&amp;',",
  "      '<': '&lt;',",
  "      '>': '&gt;',",
  "      '\"': '&quot;',",
  "      \"'\": '&#39;'",
  '    }[char]));',
  '  }'
].join('\n');

if (!js.includes(before)) {
  throw new Error('V73 escapeHtml block not found');
}

js = js.replace(before, after);
fs.writeFileSync(file, js);
console.log('patched V73 escapeHtml to prefer UDHtml.escape');
