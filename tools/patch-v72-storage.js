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

src = src.replace(
  "for (var i=0;i<localStorage.length;i++){\n      var k = localStorage.key(i);\n      if (!k || k.indexOf('dashv2_') !== 0 || blocked.has(k)) continue;\n      data.localStorage[k] = localStorage.getItem(k);\n    }",
  "for (var i=0;i<localStorage.length;i++){\n      var k = localStorage.key(i);\n      if (!k || k.indexOf('dashv2_') !== 0 || blocked.has(k)) continue;\n      data.localStorage[k] = window.safeStorage ? window.safeStorage.getRaw(k, null) : localStorage.getItem(k);\n    }"
);

src = src.replace(
  "Object.keys(data.localStorage).forEach(function(k){ if (!window.BACKUP_SECRETS_RAW.has(k)) localStorage.setItem(k, data.localStorage[k]); });",
  "Object.keys(data.localStorage).forEach(function(k){ if (!window.BACKUP_SECRETS_RAW.has(k)) { if (window.safeStorage) window.safeStorage.setRaw(k, data.localStorage[k]); else localStorage.setItem(k, data.localStorage[k]); } });"
);

src = src.replace(
  "function readLogs(){ try { return JSON.parse(localStorage.getItem('dashv2_logs') || '[]'); } catch(_){ return []; } }",
  "function readLogs(){ try { var raw = window.safeStorage ? window.safeStorage.getRaw('dashv2_logs', '[]') : localStorage.getItem('dashv2_logs'); return JSON.parse(raw || '[]'); } catch(_){ return []; } }"
);

src = src.replace(
  'v72.opts = OPTS;',
  "v72.opts = OPTS;\n  v72.version = 'v72-storage-core';"
);

fs.writeFileSync(file, src);
console.log('patched v72 storage calls to safeStorage');
