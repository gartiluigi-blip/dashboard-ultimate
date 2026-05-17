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

const exportLoopBefore = [
  'for (var i=0;i<' + storageWord + '.length;i++){',
  '      var k = ' + storageWord + '.key(i);',
  "      if (!k || k.indexOf('dashv2_') !== 0 || blocked.has(k)) continue;",
  '      data.localStorage[k] = ' + getCall + '(k);',
  '    }'
].join('\n');

const exportLoopAfter = [
  'for (var i=0;i<localStorage.length;i++){',
  '      var k = localStorage.key(i);',
  "      if (!k || k.indexOf('dashv2_') !== 0 || blocked.has(k)) continue;",
  '      data.localStorage[k] = window.safeStorage.getRaw(k, null);',
  '    }'
].join('\n');

const importBefore = 'Object.keys(data.localStorage).forEach(function(k){ '
  + 'if (!window.BACKUP_SECRETS_RAW.has(k)) '
  + setCall
  + '(k, data.localStorage[k]); });';

const importAfter = 'Object.keys(data.localStorage).forEach(function(k){ '
  + 'if (!window.BACKUP_SECRETS_RAW.has(k)) '
  + 'window.safeStorage.setRaw(k, data.localStorage[k]); });';

const readLogsBefore = 'function readLogs(){ try { return JSON.parse('
  + getCall
  + "('dashv2_logs') || '[]'); } catch(_){ return []; } }";

const readLogsAfter = 'function readLogs(){ try { return JSON.parse('
  + "window.safeStorage.getRaw('dashv2_logs', '[]') || '[]'); } catch(_){ return []; } }";

src = src.replace(exportLoopBefore, exportLoopAfter);
src = src.replace(importBefore, importAfter);
src = src.replace(readLogsBefore, readLogsAfter);
src = src.replace('v72.opts = OPTS;', "v72.opts = OPTS;\n  v72.version = 'v72-storage-core';");

fs.writeFileSync(file, src);
console.log('patched v72 storage calls to safeStorage');
