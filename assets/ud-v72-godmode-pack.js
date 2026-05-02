/* ════════════════════════════════════════════════════════════════════════════
   UD · v72 · GOD MODE PACK · Optimisations + Features additives
   ────────────────────────────────────────────────────────────────────────────
   À COLLER : juste avant </body>, dans un bloc :
     <script id="ud-v72-godmode-pack">…</script>

   PRINCIPE : 100% additif. Aucun script existant n'est modifié.
   Tout est opt-in/opt-out via window.UD_V72_OPTS (défini avant ce script).
   Si une feature crash, elle se désactive et log dans __v72.errors.

   FEATURES :
     1. idle-init differred boot des modules lourds
     2. content-visibility:auto sur sections lourdes (paint cost ↓)
     3. timer-leak-detector (setInterval/Timeout audit)
     4. PWA install prompt custom (manquant)
     5. Backup AES-GCM chiffré (passphrase user)
     6. Battery-aware mode (animations off si < 20%)
     7. Wedding countdown 04/07/2026
     8. Heatmap multi-domaine (selector sur l'existante)
     9. Wake-lock pendant Pomodoro
    10. Connection-aware (slow-2g → coach off)

   Inspecter en runtime : window.__v72
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // 0. Boot & opts
  // ────────────────────────────────────────────────────────────────
  var OPTS = Object.assign({
    idleInit:      true,
    contentVis:    true,
    timerAudit:    true,
    pwaPrompt:     true,
    cryptoBackup:  true,
    batteryMode:   true,
    weddingDate:   null,             // ex: '2026-07-04' pour activer
    heatmapMulti:  true,
    wakeLock:      true,
    connectionAware: true,
    debug:         false
  }, window.UD_V72_OPTS || {});

  var v72 = window.__v72 = {
    opts: OPTS,
    errors: [],
    timers: { intervals: new Map(), timeouts: new Map() },
    enabled: {},
    log: function(){ if (OPTS.debug) console.log.apply(console, ['[v72]'].concat([].slice.call(arguments))); }
  };

  function safe(name, fn){
    try { fn(); v72.enabled[name] = true; v72.log(name, 'ok'); }
    catch(e){
      v72.enabled[name] = false;
      v72.errors.push({ feat: name, err: String(e), stack: e && e.stack });
      v72.log(name, 'FAIL', e);
    }
  }

  // Helpers (réutilise ceux du dashboard si présents)
  var $    = function(id){ return document.getElementById(id); };
  var $$   = function(sel, root){ return (root||document).querySelector(sel); };
  var $$$  = function(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); };
  var esc  = window.escapeHTML || function(s){
    return s == null ? '' : String(s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  };
  var bind = window.bindOnce || function(el, ev, h){ el && el.addEventListener(ev, h); };
  var idle = window.requestIdleCallback || function(cb){ return setTimeout(function(){
    cb({ didTimeout:false, timeRemaining:function(){ return 50; } });
  }, 1); };

  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // ────────────────────────────────────────────────────────────────
  // 1. content-visibility:auto sur sections lourdes
  //    Le navigateur skip layout/paint hors viewport. Gain instantané
  //    sur les longues listes (heatmap, mois revue, achievements…).
  // ────────────────────────────────────────────────────────────────
  function feat_contentVis(){
    if (!OPTS.contentVis) return;
    if (!CSS || !CSS.supports || !CSS.supports('content-visibility', 'auto')) return;
    var s = document.createElement('style');
    s.id = 'ud-v72-cv';
    s.textContent = [
      '/* v72 · content-visibility on heavy sections */',
      '.heatmap-wrap,',
      '.stats-grid,',
      '#domain-streaks,',
      '.routine-list,',
      '.timeline,',
      '.achievements-grid,',
      '.history-list,',
      '.month-revue {',
      '  content-visibility: auto;',
      '  contain-intrinsic-size: 1px 600px;',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ────────────────────────────────────────────────────────────────
  // 2. Timer leak detector
  //    Patch setInterval / setTimeout pour tracker les actifs.
  //    Expose window.__v72.timers + un panel debug si OPTS.debug.
  // ────────────────────────────────────────────────────────────────
  function feat_timerAudit(){
    if (!OPTS.timerAudit) return;
    var oSI = window.setInterval, oCI = window.clearInterval;
    var oST = window.setTimeout,  oCT = window.clearTimeout;
    var trace = function(){
      var s = (new Error()).stack || '';
      // Skip first 3 lines (Error, this fn, patched fn)
      return s.split('\n').slice(3, 5).join(' | ').slice(0, 200);
    };
    window.setInterval = function(fn, ms){
      var id = oSI.apply(window, arguments);
      v72.timers.intervals.set(id, { ms: ms, t: Date.now(), where: trace() });
      return id;
    };
    window.clearInterval = function(id){
      v72.timers.intervals.delete(id);
      return oCI.call(window, id);
    };
    window.setTimeout = function(fn, ms){
      var id = oST.apply(window, arguments);
      var meta = { ms: ms, t: Date.now(), where: trace() };
      v72.timers.timeouts.set(id, meta);
      // Auto-cleanup quand le timeout fire
      var wrapped = oST.call(window, function(){ v72.timers.timeouts.delete(id); }, ms + 5);
      return id;
    };
    window.clearTimeout = function(id){
      v72.timers.timeouts.delete(id);
      return oCT.call(window, id);
    };
    // API publique
    v72.timerReport = function(){
      var act = v72.timers.intervals.size;
      var pen = v72.timers.timeouts.size;
      console.group('[v72] Timer audit · ' + act + ' intervals · ' + pen + ' timeouts');
      v72.timers.intervals.forEach(function(meta, id){
        console.log('Interval#' + id + ' · ' + meta.ms + 'ms · ' + meta.where);
      });
      console.groupEnd();
      return { intervals: act, timeouts: pen };
    };
  }

  // ────────────────────────────────────────────────────────────────
  // 3. PWA install prompt custom
  //    Capture l'event beforeinstallprompt et expose un bouton dans Settings.
  // ────────────────────────────────────────────────────────────────
  function feat_pwaPrompt(){
    if (!OPTS.pwaPrompt) return;
    var deferred = null;
    window.addEventListener('beforeinstallprompt', function(e){
      e.preventDefault();
      deferred = e;
      v72.log('PWA prompt available');
      injectInstallButton();
    });
    window.addEventListener('appinstalled', function(){
      v72.log('PWA installed');
      var btn = $('v72-install-btn');
      if (btn) btn.remove();
    });

    function injectInstallButton(){
      ready(function(){
        // Cherche un bon endroit : Settings page ou data-bar
        var host = $('p-settings') || $$('.data-bar') || document.body;
        if ($('v72-install-btn')) return;
        var b = document.createElement('button');
        b.id = 'v72-install-btn';
        b.className = 'data-btn';
        b.style.cssText = 'background:linear-gradient(135deg,#ff6b35,#ff8c42);color:#0a0a10;font-weight:700;border:0;padding:10px 16px;border-radius:10px;margin:8px 4px;cursor:pointer';
        b.innerHTML = '⬇ Installer l\'app';
        b.addEventListener('click', function(){
          if (!deferred) return;
          deferred.prompt();
          deferred.userChoice.then(function(c){
            v72.log('install choice:', c.outcome);
            deferred = null;
            b.remove();
          });
        });
        // Insère en tête du data-bar si trouvé, sinon dans p-settings
        var bar = $$('.data-bar');
        if (bar && bar.parentNode) bar.parentNode.insertBefore(b, bar);
        else host.appendChild(b);
      });
    }
  }

  // ────────────────────────────────────────────────────────────────
  // 4. Backup AES-GCM chiffré
  //    Wrap exportData : passphrase optionnelle → fichier .ude (encrypted)
  //    Ajoute aussi un import .ude qui demande la passphrase.
  // ────────────────────────────────────────────────────────────────
  function feat_cryptoBackup(){
    if (!OPTS.cryptoBackup) return;
    if (!window.crypto || !window.crypto.subtle) return;

    var enc = new TextEncoder(), dec = new TextDecoder();

    async function deriveKey(pass, salt){
      var keyMat = await crypto.subtle.importKey(
        'raw', enc.encode(pass), { name:'PBKDF2' }, false, ['deriveKey']);
      return crypto.subtle.deriveKey(
        { name:'PBKDF2', salt: salt, iterations: 200000, hash: 'SHA-256' },
        keyMat,
        { name:'AES-GCM', length: 256 },
        false, ['encrypt','decrypt']
      );
    }

    async function encryptPayload(jsonStr, pass){
      var salt = crypto.getRandomValues(new Uint8Array(16));
      var iv   = crypto.getRandomValues(new Uint8Array(12));
      var key  = await deriveKey(pass, salt);
      var ct   = await crypto.subtle.encrypt({ name:'AES-GCM', iv: iv }, key, enc.encode(jsonStr));
      return {
        v: 1, kind: 'ude-aes-gcm',
        salt: btoa(String.fromCharCode.apply(null, salt)),
        iv:   btoa(String.fromCharCode.apply(null, iv)),
        ct:   btoa(String.fromCharCode.apply(null, new Uint8Array(ct)))
      };
    }

    async function decryptPayload(env, pass){
      var b2u = function(b){ return Uint8Array.from(atob(b), function(c){ return c.charCodeAt(0); }); };
      var key = await deriveKey(pass, b2u(env.salt));
      var pt  = await crypto.subtle.decrypt({ name:'AES-GCM', iv: b2u(env.iv) }, key, b2u(env.ct));
      return dec.decode(pt);
    }

    function gatherDashState(){
      var BS = window.BACKUP_SECRETS_RAW || new Set();
      var data = { v:'v3', exportedAt: new Date().toISOString(), localStorage: {} };
      for (var i = 0; i < localStorage.length; i++){
        var k = localStorage.key(i);
        if (k && k.indexOf('dashv2_') === 0 && !BS.has(k)){
          data.localStorage[k] = localStorage.getItem(k);
        }
      }
      return data;
    }

    function downloadFile(name, content, mime){
      var blob = new Blob([content], { type: mime || 'application/octet-stream' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }

    async function exportEncrypted(){
      var pass = prompt('Passphrase pour chiffrer (min 12 caractères) — note-la, sans elle le backup est irrécupérable :');
      if (!pass || pass.length < 12){ alert('Annulé · passphrase trop courte (min 12).'); return; }
      var conf = prompt('Re-tape pour confirmer :');
      if (conf !== pass){ alert('Les passphrases ne correspondent pas.'); return; }
      var data = gatherDashState();
      var env  = await encryptPayload(JSON.stringify(data), pass);
      var name = 'ultimate-backup-' + new Date().toISOString().slice(0,10) + '.ude';
      downloadFile(name, JSON.stringify(env), 'application/json');
      try { window.showToast && window.showToast('✓ Backup chiffré téléchargé'); } catch(_){}
    }

    async function importEncrypted(file){
      var text = await file.text();
      var env;
      try { env = JSON.parse(text); } catch(e){ alert('Fichier invalide.'); return; }
      if (env.kind !== 'ude-aes-gcm'){ alert('Format inconnu.'); return; }
      var pass = prompt('Passphrase pour déchiffrer ' + file.name + ' :');
      if (!pass) return;
      var json;
      try { json = await decryptPayload(env, pass); }
      catch(e){ alert('Déchiffrement échoué (mauvaise passphrase ?).'); return; }
      var data;
      try { data = JSON.parse(json); } catch(e){ alert('Déchiffré mais JSON corrompu.'); return; }
      if (!data.localStorage){ alert('Pas de section localStorage.'); return; }
      if (!confirm('Restaurer va REMPLACER tes données. Continuer ?')) return;
      for (var k in data.localStorage){
        try { localStorage.setItem(k, data.localStorage[k]); } catch(_){}
      }
      try { window.showToast && window.showToast('✓ Restauré, rechargement…'); } catch(_){}
      setTimeout(function(){ location.reload(); }, 500);
    }

    // Injecte les boutons à côté du data-bar existant
    ready(function(){
      var bar = $$('.data-bar');
      if (!bar) return;
      if ($('v72-export-enc')) return;

      var btnExp = document.createElement('button');
      btnExp.id = 'v72-export-enc';
      btnExp.className = 'data-btn';
      btnExp.innerHTML = '🔐 Export chiffré';
      btnExp.title = 'Backup .ude avec passphrase AES-GCM 256';
      btnExp.addEventListener('click', exportEncrypted);
      bar.appendChild(btnExp);

      var btnImp = document.createElement('button');
      btnImp.id = 'v72-import-enc';
      btnImp.className = 'data-btn';
      btnImp.innerHTML = '🔓 Import .ude';
      btnImp.addEventListener('click', function(){
        var inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.ude,.json';
        inp.addEventListener('change', function(e){
          var f = e.target.files && e.target.files[0];
          if (f) importEncrypted(f);
        });
        inp.click();
      });
      bar.appendChild(btnImp);
    });

    v72.crypto = { exportEncrypted: exportEncrypted, importEncrypted: importEncrypted };
  }

  // ────────────────────────────────────────────────────────────────
  // 5. Battery-aware mode
  //    < 20% non chargée → ajoute body.ud-low-battery (CSS désactive
  //    transitions/animations + ralentit polling).
  // ────────────────────────────────────────────────────────────────
  function feat_batteryMode(){
    if (!OPTS.batteryMode) return;
    if (!navigator.getBattery) return;

    var s = document.createElement('style');
    s.id = 'ud-v72-battery';
    s.textContent = [
      'body.ud-low-battery * {',
      '  animation-duration: 0.001ms !important;',
      '  transition-duration: 0.001ms !important;',
      '}',
      'body.ud-low-battery .ud-low-batt-ind {',
      '  position:fixed;bottom:8px;right:8px;z-index:9999;',
      '  background:#7c2d12;color:#fed7aa;padding:4px 8px;',
      '  border-radius:6px;font:600 11px system-ui,sans-serif;',
      '  pointer-events:none;opacity:.7',
      '}'
    ].join('\n');
    document.head.appendChild(s);

    function update(b){
      var low = b.level < 0.20 && !b.charging;
      document.body.classList.toggle('ud-low-battery', low);
      var ind = $('v72-batt-ind');
      if (low && !ind){
        var d = document.createElement('div');
        d.id = 'v72-batt-ind';
        d.className = 'ud-low-batt-ind';
        d.textContent = '🔋 ' + Math.round(b.level * 100) + '% · mode éco';
        document.body.appendChild(d);
      } else if (!low && ind){
        ind.remove();
      } else if (low && ind){
        ind.textContent = '🔋 ' + Math.round(b.level * 100) + '% · mode éco';
      }
    }

    navigator.getBattery().then(function(b){
      update(b);
      b.addEventListener('levelchange', function(){ update(b); });
      b.addEventListener('chargingchange', function(){ update(b); });
    });
  }

  // ────────────────────────────────────────────────────────────────
  // 6. Wedding countdown widget
  //    S'insère discrètement en haut de p-home si pas encore présent.
  // ────────────────────────────────────────────────────────────────
  function feat_wedding(){
    if (!OPTS.weddingDate) return;
    var target = new Date(OPTS.weddingDate + 'T00:00:00');
    if (isNaN(target.getTime())) return;

    var s = document.createElement('style');
    s.id = 'ud-v72-wedding';
    s.textContent = [
      '#v72-wedding {',
      '  display:flex;align-items:center;gap:12px;',
      '  background:linear-gradient(135deg, rgba(244,114,182,.08), rgba(168,85,247,.08));',
      '  border:1px solid rgba(244,114,182,.25);',
      '  border-radius:14px;padding:12px 16px;margin:0 0 14px;',
      '  font:600 13px var(--f-sans, system-ui);color:#f9a8d4;',
      '}',
      '#v72-wedding .v72-w-num { font-size:22px;font-weight:900;color:#fbcfe8 }',
      '#v72-wedding .v72-w-lbl { font-size:11px;opacity:.75;letter-spacing:.05em;text-transform:uppercase }',
      '#v72-wedding .v72-w-meta { margin-left:auto;font-size:11px;opacity:.65 }'
    ].join('\n');
    document.head.appendChild(s);

    ready(function(){
      var home = $('p-home');
      if (!home) return;
      if ($('v72-wedding')) return;
      var wrap = document.createElement('div');
      wrap.id = 'v72-wedding';

      function render(){
        var now = new Date();
        var days = Math.ceil((target - now) / 86400000);
        if (days < 0){
          wrap.innerHTML = '<span>💍 Mariage célébré · ' + esc(OPTS.weddingDate) + '</span>';
          return;
        }
        var weeks = Math.floor(days / 7);
        wrap.innerHTML =
          '<span class="v72-w-num">' + days + '</span>' +
          '<span class="v72-w-lbl">jours<br>avant le mariage</span>' +
          '<span class="v72-w-meta">' + weeks + ' semaines · 04 juillet 2026</span>';
      }
      render();
      // Re-render à minuit
      setInterval(render, 3600000);

      // Insère en TOUT premier dans p-home
      home.insertBefore(wrap, home.firstChild);
    });
  }

  // ────────────────────────────────────────────────────────────────
  // 7. Heatmap multi-domaine
  //    Ajoute un selector au-dessus de #heatmap-grid pour switcher
  //    entre domaines. Lit dashv2_logs_* pour rebâtir.
  // ────────────────────────────────────────────────────────────────
  function feat_heatmapMulti(){
    if (!OPTS.heatmapMulti) return;
    ready(function(){
      var grid = $('heatmap-grid');
      if (!grid) return;
      if ($('v72-heatmap-domains')) return;

      var DOMAINS = [
        { k:'all',    lbl:'Tout',    color:'#10b981' },
        { k:'sport',  lbl:'Sport',   color:'#ef4444' },
        { k:'flex',   lbl:'Souplesse', color:'#a855f7' },
        { k:'nl',     lbl:'NL',      color:'#3b82f6' },
        { k:'epfc',   lbl:'EPFC',    color:'#f59e0b' },
        { k:'code',   lbl:'Code',    color:'#06b6d4' },
        { k:'vinted', lbl:'Vinted',  color:'#ec4899' },
        { k:'chess',  lbl:'Chess',   color:'#94a3b8' }
      ];

      var bar = document.createElement('div');
      bar.id = 'v72-heatmap-domains';
      bar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px';
      DOMAINS.forEach(function(d){
        var b = document.createElement('button');
        b.type = 'button';
        b.dataset.dom = d.k;
        b.textContent = d.lbl;
        b.style.cssText = 'padding:4px 10px;font:600 11px var(--f-sans,system-ui);border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#cbd5e1;cursor:pointer';
        b.addEventListener('click', function(){ apply(d); });
        bar.appendChild(b);
      });
      grid.parentNode.insertBefore(bar, grid);

      function readLogs(){
        try {
          var raw = localStorage.getItem('dashv2_logs') || '[]';
          return JSON.parse(raw);
        } catch(_){ return []; }
      }

      function apply(d){
        // Marquer bouton actif
        $$$('button', bar).forEach(function(b){
          b.style.background = b.dataset.dom === d.k ? d.color : 'rgba(255,255,255,.04)';
          b.style.color = b.dataset.dom === d.k ? '#0a0a10' : '#cbd5e1';
        });
        var logs = readLogs();
        var byDay = {};
        logs.forEach(function(l){
          if (!l || !l.date) return;
          var date = (l.date || '').slice(0,10);
          if (!date) return;
          var match = d.k === 'all' ? true :
            (l.module === d.k) ||
            (l.tags && l.tags.indexOf && l.tags.indexOf(d.k) >= 0) ||
            (l.text && new RegExp('\\b' + d.k + '\\b', 'i').test(l.text));
          if (match) byDay[date] = (byDay[date] || 0) + 1;
        });
        // Repeindre les cells .heat-N existantes selon byDay
        var cells = $$$('[data-date]', grid);
        cells.forEach(function(c){
          var n = byDay[c.dataset.date] || 0;
          var lvl = n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4;
          c.className = 'heat-' + lvl;
          c.dataset.v72count = n;
          c.title = c.dataset.date + ' · ' + n + ' log(s) · ' + d.lbl;
        });
      }

      // Init avec "all" sans casser le rendu existant
      // (on n'applique que si user clique, pour ne pas écraser le moteur natif au boot)
    });
  }

  // ────────────────────────────────────────────────────────────────
  // 8. Wake-lock pendant Pomodoro / sport
  //    Empêche l'écran de s'éteindre pendant un timer actif.
  //    Détecte via #pomodoro-timer ou .pomo-active sur le body.
  // ────────────────────────────────────────────────────────────────
  function feat_wakeLock(){
    if (!OPTS.wakeLock) return;
    if (!('wakeLock' in navigator)) return;
    var lock = null;

    async function acquire(){
      try { lock = await navigator.wakeLock.request('screen'); v72.log('wake lock on'); }
      catch(e){ v72.log('wake lock fail', e); }
    }
    function release(){
      if (lock){ try { lock.release(); } catch(_){} lock = null; v72.log('wake lock off'); }
    }

    // Détection : observe les classes du body
    var mo = new MutationObserver(function(){
      var active = document.body.classList.contains('pomo-active') ||
                   document.body.classList.contains('sport-active') ||
                   document.body.classList.contains('voice-recording');
      if (active && !lock) acquire();
      else if (!active && lock) release();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Re-acquire si page redevient visible
    document.addEventListener('visibilitychange', function(){
      if (!document.hidden && (
        document.body.classList.contains('pomo-active') ||
        document.body.classList.contains('sport-active')
      )) acquire();
    });
  }

  // ────────────────────────────────────────────────────────────────
  // 9. Connection-aware
  //    Sur slow-2g/2g, expose flag pour que coach IA ne pré-fetch pas.
  // ────────────────────────────────────────────────────────────────
  function feat_connectionAware(){
    if (!OPTS.connectionAware) return;
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return;
    function update(){
      var slow = /^(slow-2g|2g)$/.test(c.effectiveType) || c.saveData;
      window.__v72.slowConn = slow;
      document.body.classList.toggle('ud-slow-conn', slow);
      v72.log('conn:', c.effectiveType, 'saveData:', c.saveData, 'slow:', slow);
    }
    update();
    c.addEventListener('change', update);
  }

  // ────────────────────────────────────────────────────────────────
  // 10. idle-init : différer features non-critiques
  // ────────────────────────────────────────────────────────────────
  function bootCritical(){
    safe('contentVis',     feat_contentVis);
    safe('timerAudit',     feat_timerAudit);
    safe('connectionAware', feat_connectionAware);
  }
  function bootDeferred(){
    safe('pwaPrompt',      feat_pwaPrompt);
    safe('cryptoBackup',   feat_cryptoBackup);
    safe('batteryMode',    feat_batteryMode);
    safe('wedding',        feat_wedding);
    safe('heatmapMulti',   feat_heatmapMulti);
    safe('wakeLock',       feat_wakeLock);
  }

  bootCritical();
  if (OPTS.idleInit){
    idle(bootDeferred, { timeout: 2000 });
  } else {
    bootDeferred();
  }

  // ────────────────────────────────────────────────────────────────
  // API publique de debug
  // ────────────────────────────────────────────────────────────────
  v72.report = function(){
    return {
      enabled: v72.enabled,
      errors: v72.errors,
      timers: v72.timerReport ? v72.timerReport() : 'audit off',
      slowConn: v72.slowConn || false,
      opts: OPTS
    };
  };

  v72.log('boot done · features:', Object.keys(v72.enabled).filter(function(k){ return v72.enabled[k]; }).length);
})();
