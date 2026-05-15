#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '..', 'assets', 'main.cfc54acb.js');
let js = fs.readFileSync(file, 'utf8');

if (js.includes("version: 'main-store-phase1'")) {
  console.log('main store phase1 already applied');
  process.exit(0);
}

const start = js.indexOf('\nconst S = {');
const endMarker = '\n\n// Keys that must NEVER appear in any backup or export.';
const end = js.indexOf(endMarker, start);

if (start < 0 || end < 0 || end <= start) {
  throw new Error('main store block not found');
}

const block = [
  'const S = {',
  "  version: 'main-store-phase1',",
  '  get(k, d){',
  '    try {',
  '      if (window.UDStore) return window.UDStore.get(k, d);',
  '      if (window.safeStorage) return window.safeStorage.getJson(K+k, d);',
  '      return d;',
  '    } catch(e){ return d; }',
  '  },',
  '  set(k, v){',
  '    try {',
  '      let ok = false;',
  '      if (window.UDStore) ok = window.UDStore.set(k, v);',
  '      else if (window.safeStorage) ok = window.safeStorage.setJson(K+k, v);',
  '      if (ok && _storeReady){',
  '        try { _notifyStore(k, v); } catch(_){}',
  '        try { if (idbMirror) idbMirror.set(k, v); } catch(_){}',
  '      }',
  '    } catch(e){',
  "      if (!_quotaWarned && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)){",
  '        _quotaWarned = true;',
  "        try { (typeof showToast === 'function' ? showToast : alert)('⚠️ Stockage plein — exporte tes données (onglet Plan → Exporter).'); } catch(_){}",
  '      }',
  '    }',
  '  },',
  '  del(k){',
  '    try {',
  '      let ok = false;',
  '      if (window.UDStore) ok = window.UDStore.del(k);',
  '      else if (window.safeStorage) ok = window.safeStorage.removeRaw(K+k);',
  '      if (ok && _storeReady){',
  '        try { _notifyStore(k, undefined); } catch(_){}',
  '        try { if (idbMirror) idbMirror.del(k); } catch(_){}',
  '      }',
  '    } catch(e){}',
  '  },',
  '  all(){',
  '    try {',
  '      if (window.UDStore) return window.UDStore.all();',
  '      if (window.safeStorage){',
  '        const out = {};',
  '        window.safeStorage.keys(K).forEach(function(key){',
  '          out[key.slice(K.length)] = window.safeStorage.getJson(key, null);',
  '        });',
  '        return out;',
  '      }',
  '    } catch(e){}',
  '    return {};',
  '  }',
  '};'
].join('\n');

js = js.slice(0, start + 1) + block + js.slice(end);
fs.writeFileSync(file, js);
console.log('patched main store phase1');
