#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'assets', 'main.cfc54acb.js');
let src = fs.readFileSync(file, 'utf8');

if (src.includes("version: 'main-storage-core'")) {
  console.log('main storage patch already applied');
  process.exit(0);
}

const storeBefore = `const S = {
  get(k, d){ try { const v = localStorage.getItem(K+k); return v===null?d:JSON.parse(v); } catch(e){ return d; } },
  set(k, v){
    try {
      localStorage.setItem(K+k, JSON.stringify(v));
      if (_storeReady){
        try { _notifyStore(k, v); } catch(_){}
        try { if (idbMirror) idbMirror.set(k, v); } catch(_){}
      }
    }
    catch(e){
      if (!_quotaWarned && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)){
        _quotaWarned = true;
        try { (typeof showToast === 'function' ? showToast : alert)('⚠️ Stockage plein — exporte tes données (onglet Plan → Exporter).'); } catch(_){}
      }
    }
  },
  del(k){
    try {
      localStorage.removeItem(K+k);
      if (_storeReady){
        try { _notifyStore(k, undefined); } catch(_){}
        try { if (idbMirror) idbMirror.del(k); } catch(_){}
      }
    } catch(e){}
  },
  all(){
    const out = {};
    for (let i = 0; i < localStorage.length; i++){
      const key = localStorage.key(i);
      if (key && key.startsWith(K)) { try { out[key.slice(K.length)] = JSON.parse(localStorage.getItem(key)); } catch(e){} }
    }
    return out;
  }
};`;

const storeAfter = `const S = {
  version: 'main-storage-core',
  get(k, d){
    if (window.UDStore) return window.UDStore.get(k, d);
    return window.safeStorage.getJson(K+k, d);
  },
  set(k, v){
    try {
      const ok = window.UDStore ? window.UDStore.set(k, v) : window.safeStorage.setJson(K+k, v);
      if (ok && _storeReady){
        try { _notifyStore(k, v); } catch(_){}
        try { if (idbMirror) idbMirror.set(k, v); } catch(_){}
      }
    }
    catch(e){
      if (!_quotaWarned && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)){
        _quotaWarned = true;
        try { (typeof showToast === 'function' ? showToast : alert)('⚠️ Stockage plein — exporte tes données (onglet Plan → Exporter).'); } catch(_){}
      }
    }
  },
  del(k){
    try {
      const ok = window.UDStore ? window.UDStore.del(k) : window.safeStorage.removeRaw(K+k);
      if (ok && _storeReady){
        try { _notifyStore(k, undefined); } catch(_){}
        try { if (idbMirror) idbMirror.del(k); } catch(_){}
      }
    } catch(e){}
  },
  all(){
    const out = {};
    if (window.UDStore) return window.UDStore.all();
    window.safeStorage.keys(K).forEach(function(key){
      try { out[key.slice(K.length)] = window.safeStorage.getJson(key, null); } catch(e){}
    });
    return out;
  }
};`;

if (!src.includes(storeBefore)) throw new Error('Unable to find main S store block');
src = src.replace(storeBefore, storeAfter);

src = src.replace(
  `for (let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);
        if (key && key.startsWith(K)){
          try { ls[key.slice(K.length)] = JSON.parse(localStorage.getItem(key)); } catch(_){}
        }
      }`,
  `window.safeStorage.keys(K).forEach(function(key){
        try { ls[key.slice(K.length)] = window.safeStorage.getJson(key, null); } catch(_){}
      });`
);

fs.writeFileSync(file, src);
console.log('patched main store to use core storage');
