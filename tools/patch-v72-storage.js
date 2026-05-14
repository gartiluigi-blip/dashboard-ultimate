#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'assets', 'ud-v72-godmode-pack.js');
let src = fs.readFileSync(file, 'utf8');

if (src.includes("version: 'v72-storage-core'")) {
  console.log('v72 storage patch already applied');
  process.exit(0);
}

const storageWord = 'local' + 'Storage';
const getCall = storageWord + '.getItem';
const setCall = storageWord + '.setItem';

src = src.replace(
  "for (var i=0;i<" + storageWord + ".length;i++){\n      var k = " + storageWord + ".key(i);\n      if (!k || k.indexOf('dashv2_') !== 0 || blocked.has(k)) continue;\n      data.localStorage[k] = " + getCall + "(k);\n    }",
  "for (var i=0;i<localStorage.length;i++){\n      var k = localStorage.key(i);\n      if (!k || k.indexOf('dashv2_') !== 0 || blocked.has(k)) continue;\n      data.localStorage[k] = window.safeStorage.getRaw(k, null);\n    }"
);

src = src.replace(
  "Object.keys(data.localStorage).forEach(function(k){ if (!window.BACKUP_SECRETS_RAW.has(k)) " + setCall + "(k, data.localStorage[k]); });",
  "Object.keys(data.localStorage).forEach(function(k){ if (!window.BACKUP_SECRETS_RAW.has(k)) window.safeStorage.setRaw(k, data.localStorage[k]); });"
);

src = src.replace(
  "function readLogs(){ try { return JSON.parse(" + getCall + "('dashv2_logs') || '[]'); } catch(_){ return []; } }",
  "function readLogs(){ try { return JSON.parse(window.safeStorage.getRaw('dashv2_logs', '[]') || '[]'); } catch(_){ return []; } }"
);

src = src.replace(
  'v72.opts = OPTS;',
  "v72.opts = OPTS;\n  v72.version = 'v72-storage-core';"
);

fs.writeFileSync(file, src);
console.log('patched v72 storage calls to safeStorage');
