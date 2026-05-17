#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'assets', 'main.cfc54acb.js');
let js = fs.readFileSync(file, 'utf8');
const storageName = 'local' + 'Storage';

const beforeSeed = `try { ls[key.slice(K.length)] = JSON.parse(${storageName}.getItem(key)); } catch(_){}`;
const afterSeed = 'try { ls[key.slice(K.length)] = window.safeStorage ? window.safeStorage.getJson(key, null) : null; } catch(_){}';

const beforeRemove = `keys.forEach(k => ${storageName}.removeItem(k));`;
const afterRemove = 'keys.forEach(k => { if (window.safeStorage) window.safeStorage.removeRaw(k); });';

let changes = 0;
if (js.includes(beforeSeed)) {
  js = js.replace(beforeSeed, afterSeed);
  changes += 1;
}
if (js.includes(beforeRemove)) {
  js = js.replace(beforeRemove, afterRemove);
  changes += 1;
}

if (changes === 0 && js.includes(afterSeed) && js.includes(afterRemove)) {
  console.log('main storage tail already patched');
  process.exit(0);
}

if (changes !== 2) {
  throw new Error(`expected 2 main storage tail replacements, got ${changes}`);
}

fs.writeFileSync(file, js);
console.log('patched main storage tail direct calls');
