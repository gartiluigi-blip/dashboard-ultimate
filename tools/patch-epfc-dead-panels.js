#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const before = html.length;
const ids = ['v78-grade-epfc', 'v79-grade-epfc'];

function findTagStart(source, id) {
  const idPos = source.indexOf(`id="${id}"`);
  if (idPos < 0) return null;
  const open = source.lastIndexOf('<', idPos);
  const close = source.indexOf('>', idPos);
  if (open < 0 || close < 0) return null;
  const tagMatch = source.slice(open + 1, close).match(/^([a-zA-Z0-9-]+)/);
  if (!tagMatch) return null;
  return { open, close: close + 1, tag: tagMatch[1].toLowerCase() };
}

function findElementEnd(source, start) {
  const tag = start.tag;
  const re = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = start.open;
  let depth = 0;
  let match;
  while ((match = re.exec(source))) {
    const token = match[0];
    const closing = token.startsWith('</');
    const selfClosing = token.endsWith('/>');
    if (!closing && !selfClosing) depth += 1;
    if (closing) depth -= 1;
    if (depth === 0) return re.lastIndex;
  }
  return null;
}

function removeElementById(source, id) {
  const start = findTagStart(source, id);
  if (!start) return source;
  const end = findElementEnd(source, start);
  if (!end) throw new Error(`Unable to close element ${id}`);
  return source.slice(0, start.open) + source.slice(end);
}

for (const id of ids) {
  html = removeElementById(html, id);
}

fs.writeFileSync(file, html);
console.log('removed EPFC dead panel bytes:', before - html.length);
