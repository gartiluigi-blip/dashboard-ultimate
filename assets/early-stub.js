/* CRITICAL: stub Notification AVANT tout autre script.
   Sans ça, Brave/Firefox privé crash à la ligne 6301
   et l'app entière ne se charge pas. */
window.__earlyStub = true;
if (typeof window.Notification === 'undefined') {
  window.Notification = function(){};
  window.Notification.permission = 'default';
  window.Notification.requestPermission = function(){ return Promise.resolve('denied'); };
}

(function(){
  'use strict';
  if (window.__UDRuntimePatchLoader) return;
  window.__UDRuntimePatchLoader = true;

  var VERSION = '20260518-8';
  var debugMode = /[?&]uddebug=1\b/.test(location.search);
  var loadStatus = {};

  function loadScript(id, src, key, onload){
    var existing = document.getElementById(id);
    if (existing) {
      loadStatus[key] = 'existing';
      return;
    }
    var script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    script.onload = function(){ loadStatus[key] = 'loaded'; if (onload) onload(); renderDebug(); };
    script.onerror = function(){ loadStatus[key] = 'error'; console.warn('[UDRuntimePatchLoader] failed:', src); renderDebug(); };
    loadStatus[key] = 'loading';
    (document.head || document.documentElement).appendChild(script);
  }

  function runtimeSnapshot(){
    return {
      version: 'early-loader-' + VERSION,
      htmlJsLoaded: !!window.UDHtml,
      etudes: !!window.UDEtudesTracker,
      etudesVersion: window.UDEtudesTracker && window.UDEtudesTracker.version,
      cleanup: !!window.UDFinalCleanup,
      cleanupV2: !!window.UDFinalCleanupV2,
      forceV3: !!window.UDForceUIV3,
      forceV3Status: window.UDForceUIV3Status || null,
      study: !!window.__studyTracker,
      pages: {
        home: !!document.getElementById('p-home'),
        routine: !!document.getElementById('p-routine'),
        epfc: !!document.getElementById('p-epfc'),
        code: !!document.getElementById('p-code'),
        nl: !!document.getElementById('p-nl'),
        sport: !!document.getElementById('p-sport'),
        chess: !!document.getElementById('p-chess'),
        repair: !!(document.getElementById('p-trading') || document.querySelector('[data-page="trading"]'))
      },
      loadStatus: loadStatus,
      runAt: new Date().toISOString()
    };
  }

  function renderDebug(){
    if (!debugMode || !document.body) return;
    var panel = document.getElementById('ud-runtime-debug-panel');
    if (!panel) {
      panel = document.createElement('pre');
      panel.id = 'ud-runtime-debug-panel';
      panel.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:999999;max-height:45vh;overflow:auto;background:#020617;color:#bbf7d0;border:1px solid #22c55e;border-radius:12px;padding:10px;font:11px ui-monospace,monospace;white-space:pre-wrap;box-shadow:0 10px 30px rgba(0,0,0,.45)';
      document.body.appendChild(panel);
    }
    try { panel.textContent = JSON.stringify(runtimeSnapshot(), null, 2); }
    catch (_) { panel.textContent = 'debug snapshot failed'; }
  }

  function runAll(){
    try {
      if (window.__studyTracker && window.__studyTracker.render) window.__studyTracker.render();
      if (window.UDEtudesTracker && window.UDEtudesTracker.render) window.UDEtudesTracker.render();
      if (window.UDFinalCleanup && window.UDFinalCleanup.run) window.UDFinalCleanup.run();
      if (window.UDFinalCleanupV2 && window.UDFinalCleanupV2.run) window.UDFinalCleanupV2.run();
      if (window.UDForceUIV3 && window.UDForceUIV3.run) window.UDForceUIV3.run();
      window.UDRuntimeLoaded = runtimeSnapshot();
      renderDebug();
    } catch (error) {
      console.warn('[UDRuntimePatchLoader] runAll failed', error);
      loadStatus.runAll = 'error: ' + (error && error.message ? error.message : error);
      renderDebug();
    }
  }

  function boot(){
    loadScript('ud-core-html-runtime', '/assets/core/html.js?v=' + VERSION, 'html', runAll);
    loadScript('ud-etudes-v2-direct', '/assets/core/etudes-tracker-v2.js?v=' + VERSION, 'etudesV2', runAll);
    loadScript('ud-final-cleanup-direct', '/assets/core/final-cleanup.js?v=' + VERSION, 'cleanupV1', runAll);
    loadScript('ud-final-cleanup-v2-direct', '/assets/core/final-cleanup-v2.js?v=' + VERSION, 'cleanupV2', runAll);
    loadScript('ud-force-ui-v3-direct', '/assets/core/force-ui-v3.js?v=' + VERSION, 'forceV3', runAll);
    setTimeout(runAll, 500);
    setTimeout(runAll, 1500);
    setTimeout(runAll, 3000);
    setTimeout(renderDebug, 3500);
    document.addEventListener('click', function(event){
      if (event.target && event.target.closest && event.target.closest('.tab,[data-tab],[data-go],button,a')) {
        setTimeout(runAll, 180);
      }
    }, true);
    document.addEventListener('change', function(){ setTimeout(runAll, 180); }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
