/* ════════════════════════════════════════════════════════════════════════════
   UD · v72 · GOD MODE PACK · cleaned audit edition
   - Timer monkey patch disabled by default.
   - Backup export never includes local secrets.
   - Additive features only; no override of dashboard core routing/storage.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__udV72CleanLoaded) return;
  window.__udV72CleanLoaded = true;

  var OPTS = Object.assign({
    idleInit: true,
    contentVis: true,
    timerAudit: false,
    pwaPrompt: true,
    cryptoBackup: true,
    batteryMode: true,
    weddingDate: null,
    heatmapMulti: true,
    wakeLock: true,
    connectionAware: true,
    debug: false
  }, window.UD_V72_OPTS || {});

  var v72 = window.__v72 = window.__v72 || {
    opts: OPTS,
    errors: [],
    enabled: {},
    timers: { intervals: new Map(), timeouts: new Map() },
    log: function(){ if (OPTS.debug) console.log.apply(console, ['[v72]'].concat([].slice.call(arguments))); }
  };
  v72.opts = OPTS;

  window.BACKUP_SECRETS_RAW = window.BACKUP_SECRETS_RAW || new Set([
    'dashv2_claude_api_key',
    'dashv2_gh_token',
    'dashv2_anthropic_api_key',
    'dashv2_openai_api_key',
    'dashv2_coach_shared_secret'
  ]);

  function safe(name, fn){
    try { fn(); v72.enabled[name] = true; v72.log(name, 'ok'); }
    catch(e){
      v72.enabled[name] = false;
      v72.errors.push({ feat: name, err: String(e), stack: e && e.stack });
      v72.log(name, 'FAIL', e);
    }
  }
  var $ = function(id){ return document.getElementById(id); };
  var $$ = function(sel, root){ return (root||document).querySelector(sel); };
  var $$$ = function(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); };
  var esc = window.escapeHTML || function(s){ return s == null ? '' : String(s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); };
  var idle = window.requestIdleCallback || function(cb){ return setTimeout(function(){ cb({ didTimeout:false, timeRemaining:function(){ return 50; } }); }, 1); };
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  function feat_contentVis(){
    if (!OPTS.contentVis) return;
    if (!window.CSS || !CSS.supports || !CSS.supports('content-visibility', 'auto')) return;
    if ($('ud-v72-cv')) return;
    var s = document.createElement('style');
    s.id = 'ud-v72-cv';
    s.textContent = [
      '.heatmap-wrap,.stats-grid,#domain-streaks,.routine-list,.timeline,.achievements-grid,.history-list,.month-revue{',
      'content-visibility:auto;contain-intrinsic-size:1px 600px;',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function feat_timerAudit(){
    if (!OPTS.timerAudit) return;
    if (!location.search.includes('debugTimers=1') && !OPTS.debug) return;
    if (window.__udV72TimerAuditInstalled) return;
    window.__udV72TimerAuditInstalled = true;
    var oSI = window.setInterval, oCI = window.clearInterval;
    var oST = window.setTimeout, oCT = window.clearTimeout;
    var trace = function(){ return ((new Error()).stack || '').split('\n').slice(3,5).join(' | ').slice(0,200); };
    window.setInterval = function(fn, ms){ var id = oSI.apply(window, arguments); v72.timers.intervals.set(id,{ms:ms,t:Date.now(),where:trace()}); return id; };
    window.clearInterval = function(id){ v72.timers.intervals.delete(id); return oCI.call(window,id); };
    window.setTimeout = function(fn, ms){
      var id;
      var wrapped = function(){ v72.timers.timeouts.delete(id); if (typeof fn === 'function') return fn.apply(this, arguments); };
      var args = Array.prototype.slice.call(arguments, 2);
      id = oST.apply(window, [wrapped, ms].concat(args));
      v72.timers.timeouts.set(id,{ms:ms,t:Date.now(),where:trace()});
      return id;
    };
    window.clearTimeout = function(id){ v72.timers.timeouts.delete(id); return oCT.call(window,id); };
    v72.timerReport = function(){ return { intervals:v72.timers.intervals.size, timeouts:v72.timers.timeouts.size }; };
  }

  function feat_pwaPrompt(){
    if (!OPTS.pwaPrompt) return;
    if (window.__udPwaPromptInstalled) return;
    window.__udPwaPromptInstalled = true;
    var deferred = null;
    window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; injectInstallButton(); });
    window.addEventListener('appinstalled', function(){ var btn = $('v72-install-btn'); if (btn) btn.remove(); deferred = null; });
    function injectInstallButton(){
      ready(function(){
        if ($('v72-install-btn')) return;
        var host = $('p-settings') || $$('.data-bar') || document.body;
        var b = document.createElement('button');
        b.id = 'v72-install-btn';
        b.className = 'data-btn';
        b.textContent = '⬇ Installer app';
        b.addEventListener('click', function(){
          if (!deferred) return;
          deferred.prompt();
          deferred.userChoice.then(function(){ deferred = null; b.remove(); });
        });
        host.appendChild(b);
      });
    }
  }

  function safeLocalStorageExport(){
    var blocked = window.BACKUP_SECRETS_RAW || new Set();
    var data = { v:'v3', exportedAt:new Date().toISOString(), localStorage:{} };
    for (var i=0;i<localStorage.length;i++){
      var k = localStorage.key(i);
      if (!k || k.indexOf('dashv2_') !== 0 || blocked.has(k)) continue;
      data.localStorage[k] = localStorage.getItem(k);
    }
    return data;
  }
  window.UDSafeLocalStorageExport = safeLocalStorageExport;

  function feat_cryptoBackup(){
    if (!OPTS.cryptoBackup) return;
    if (!window.crypto || !window.crypto.subtle || window.__udCryptoBackupInstalled) return;
    window.__udCryptoBackupInstalled = true;
    var enc = new TextEncoder(), dec = new TextDecoder();
    async function deriveKey(pass, salt){
      var keyMat = await crypto.subtle.importKey('raw', enc.encode(pass), { name:'PBKDF2' }, false, ['deriveKey']);
      return crypto.subtle.deriveKey({ name:'PBKDF2', salt:salt, iterations:200000, hash:'SHA-256' }, keyMat, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
    }
    async function encryptPayload(jsonStr, pass){
      var salt = crypto.getRandomValues(new Uint8Array(16));
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var key = await deriveKey(pass, salt);
      var ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv:iv }, key, enc.encode(jsonStr));
      return { v:1, kind:'ude-aes-gcm', salt:btoa(String.fromCharCode.apply(null,salt)), iv:btoa(String.fromCharCode.apply(null,iv)), ct:btoa(String.fromCharCode.apply(null,new Uint8Array(ct))) };
    }
    async function decryptPayload(env, pass){
      var b2u = function(b){ return Uint8Array.from(atob(b), function(c){ return c.charCodeAt(0); }); };
      var key = await deriveKey(pass, b2u(env.salt));
      var pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv:b2u(env.iv) }, key, b2u(env.ct));
      return dec.decode(pt);
    }
    function downloadFile(name, content, mime){
      var blob = new Blob([content], { type:mime || 'application/octet-stream' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
    async function exportEncrypted(){
      var pass = prompt('Passphrase pour chiffrer (min 12 caractères). Sans elle le backup est irrécupérable :');
      if (!pass || pass.length < 12){ alert('Annulé · passphrase trop courte.'); return; }
      var conf = prompt('Re-tape pour confirmer :');
      if (conf !== pass){ alert('Les passphrases ne correspondent pas.'); return; }
      var env = await encryptPayload(JSON.stringify(safeLocalStorageExport()), pass);
      downloadFile('ultimate-backup-' + new Date().toISOString().slice(0,10) + '.ude', JSON.stringify(env), 'application/json');
      try { window.showToast && window.showToast('✓ Backup chiffré téléchargé'); } catch(_){}
    }
    async function importEncrypted(file){
      var env;
      try { env = JSON.parse(await file.text()); } catch(e){ alert('Fichier invalide.'); return; }
      if (env.kind !== 'ude-aes-gcm'){ alert('Format inconnu.'); return; }
      var pass = prompt('Passphrase pour déchiffrer ' + file.name + ' :');
      if (!pass) return;
      var data;
      try { data = JSON.parse(await decryptPayload(env, pass)); } catch(e){ alert('Déchiffrement échoué.'); return; }
      if (!data.localStorage){ alert('Pas de section localStorage.'); return; }
      if (!confirm('Restaurer va REMPLACER tes données. Continuer ?')) return;
      Object.keys(data.localStorage).forEach(function(k){ if (!window.BACKUP_SECRETS_RAW.has(k)) localStorage.setItem(k, data.localStorage[k]); });
      try { window.showToast && window.showToast('✓ Restauré, rechargement…'); } catch(_){}
      setTimeout(function(){ location.reload(); }, 500);
    }
    ready(function(){
      var bar = $$('.data-bar');
      if (!bar || $('v72-export-enc')) return;
      var btnExp = document.createElement('button');
      btnExp.id = 'v72-export-enc'; btnExp.className = 'data-btn'; btnExp.textContent = '🔐 Export chiffré'; btnExp.addEventListener('click', exportEncrypted); bar.appendChild(btnExp);
      var btnImp = document.createElement('button');
      btnImp.id = 'v72-import-enc'; btnImp.className = 'data-btn'; btnImp.textContent = '🔓 Import .ude';
      btnImp.addEventListener('click', function(){ var inp = document.createElement('input'); inp.type='file'; inp.accept='.ude,.json'; inp.addEventListener('change', function(e){ var f=e.target.files&&e.target.files[0]; if (f) importEncrypted(f); }); inp.click(); });
      bar.appendChild(btnImp);
    });
    v72.crypto = { exportEncrypted:exportEncrypted, importEncrypted:importEncrypted, safeLocalStorageExport:safeLocalStorageExport };
  }

  function feat_batteryMode(){
    if (!OPTS.batteryMode || !navigator.getBattery || window.__udBatteryModeInstalled) return;
    window.__udBatteryModeInstalled = true;
    if (!$('ud-v72-battery')){
      var s = document.createElement('style'); s.id = 'ud-v72-battery';
      s.textContent = 'body.ud-low-battery *{animation-duration:.001ms!important;transition-duration:.001ms!important}body.ud-low-battery .ud-low-batt-ind{position:fixed;bottom:8px;right:8px;z-index:9999;background:#7c2d12;color:#fed7aa;padding:4px 8px;border-radius:6px;font:600 11px system-ui,sans-serif;pointer-events:none;opacity:.7}';
      document.head.appendChild(s);
    }
    navigator.getBattery().then(function(b){
      function update(){
        var low = b.level < 0.20 && !b.charging;
        document.body.classList.toggle('ud-low-battery', low);
        var ind = $('v72-batt-ind');
        if (low && !ind){ ind = document.createElement('div'); ind.id='v72-batt-ind'; ind.className='ud-low-batt-ind'; document.body.appendChild(ind); }
        if (ind) ind.textContent = '🔋 ' + Math.round(b.level*100) + '% · mode éco';
        if (!low && ind) ind.remove();
      }
      update(); b.addEventListener('levelchange', update); b.addEventListener('chargingchange', update);
    });
  }

  function feat_heatmapMulti(){
    if (!OPTS.heatmapMulti) return;
    ready(function(){
      var grid = $('heatmap-grid');
      if (!grid || $('v72-heatmap-domains')) return;
      var domains = [['all','Tout','#10b981'],['sport','Sport','#ef4444'],['flex','Souplesse','#a855f7'],['nl','NL','#3b82f6'],['epfc','EPFC','#f59e0b'],['code','Code','#06b6d4'],['vinted','Vinted','#ec4899'],['chess','Chess','#94a3b8']];
      var bar = document.createElement('div'); bar.id='v72-heatmap-domains'; bar.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px';
      domains.forEach(function(d){ var b=document.createElement('button'); b.type='button'; b.dataset.dom=d[0]; b.textContent=d[1]; b.style.cssText='padding:4px 10px;font:600 11px var(--f-sans,system-ui);border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#cbd5e1;cursor:pointer'; b.addEventListener('click', function(){ apply(d); }); bar.appendChild(b); });
      grid.parentNode.insertBefore(bar, grid);
      function readLogs(){ try { return JSON.parse(localStorage.getItem('dashv2_logs') || '[]'); } catch(_){ return []; } }
      function apply(d){
        $$$('button',bar).forEach(function(b){ b.style.background = b.dataset.dom === d[0] ? d[2] : 'rgba(255,255,255,.04)'; b.style.color = b.dataset.dom === d[0] ? '#0a0a10' : '#cbd5e1'; });
        var byDay = {};
        readLogs().forEach(function(l){
          if (!l || !l.date) return;
          var date = String(l.date).slice(0,10);
          var match = d[0] === 'all' || l.module === d[0] || (l.tags && l.tags.indexOf && l.tags.indexOf(d[0]) >= 0) || (l.text && new RegExp('\\b'+d[0]+'\\b','i').test(l.text));
          if (match) byDay[date] = (byDay[date] || 0) + 1;
        });
        $$$('[data-date]', grid).forEach(function(c){ var n=byDay[c.dataset.date]||0; var lvl=n===0?0:n===1?1:n<=3?2:n<=6?3:4; c.className='heat-'+lvl; c.dataset.v72count=n; c.title=c.dataset.date+' · '+n+' log(s) · '+d[1]; });
      }
    });
  }

  function feat_wakeLock(){
    if (!OPTS.wakeLock || !('wakeLock' in navigator) || window.__udWakeLockInstalled) return;
    window.__udWakeLockInstalled = true;
    var lock = null;
    async function acquire(){ try { if (!lock) lock = await navigator.wakeLock.request('screen'); } catch(e){} }
    function release(){ if (lock){ try { lock.release(); } catch(_){} lock = null; } }
    function active(){ return document.body.classList.contains('pomo-active') || document.body.classList.contains('sport-active') || document.body.classList.contains('voice-recording'); }
    var mo = new MutationObserver(function(){ active() ? acquire() : release(); });
    mo.observe(document.body, { attributes:true, attributeFilter:['class'] });
    document.addEventListener('visibilitychange', function(){ if (!document.hidden && active()) acquire(); });
  }

  function feat_connectionAware(){
    if (!OPTS.connectionAware) return;
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return;
    function update(){
      var slow = /^(slow-2g|2g)$/.test(c.effectiveType) || c.saveData;
      v72.slowConn = slow;
      document.body.classList.toggle('ud-slow-conn', slow);
    }
    update(); c.addEventListener && c.addEventListener('change', update);
  }

  function bootCritical(){ safe('contentVis', feat_contentVis); safe('timerAudit', feat_timerAudit); safe('connectionAware', feat_connectionAware); }
  function bootDeferred(){ safe('pwaPrompt', feat_pwaPrompt); safe('cryptoBackup', feat_cryptoBackup); safe('batteryMode', feat_batteryMode); safe('heatmapMulti', feat_heatmapMulti); safe('wakeLock', feat_wakeLock); }
  bootCritical();
  if (OPTS.idleInit) idle(bootDeferred, { timeout:2000 }); else bootDeferred();
  v72.report = function(){ return { enabled:v72.enabled, errors:v72.errors, timers:v72.timerReport ? v72.timerReport() : 'timer audit off', slowConn:!!v72.slowConn, opts:OPTS }; };
})();
