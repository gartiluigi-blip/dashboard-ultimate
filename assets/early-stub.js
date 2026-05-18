/* CRITICAL: stub Notification AVANT tout autre script. */
window.__earlyStub = true;
if (typeof window.Notification === 'undefined') {
  window.Notification = function(){};
  window.Notification.permission = 'default';
  window.Notification.requestPermission = function(){ return Promise.resolve('denied'); };
}

/* Final runtime takeover.
   Ces flags sont lus par les vieux scripts inline dans index.html.
   Comme early-stub est chargé avant eux, on les bloque avant leur installation. */
window.__V75ForceFixInstalled = true;
window.__V76VisibleFixInstalled = true;
window.__V77OpsFixInstalled = true;
window.__V79FreezeGuardInstalled = true;
window.__V80EpfcDisplayFixInstalled = true;
window.__V78GradeSystemInstalled = true;
window.__V79FreezeGuardBypassedByFinal = true;

/* KILL CHAIN: dashboard-final.js loads dashboard-clean.js which overwrites
   the trading tab to combined "Réparation / IoT", rewrites #p-trading
   innerHTML, and hides #p-nutrition. Stub both with disabled flags so they
   no-op even if loaded by any other script. */
window.DashboardFinal = { version: 'disabled-by-early-stub', run: function(){} };
window.DashboardClean = { version: 'clean-3', run: function(){} };
window.DashboardCleanStatus = { version: 'clean-3', status: { disabled: true }, runAt: new Date().toISOString() };
window.DashboardFinalStatus = { version: 'disabled-by-early-stub', clean: false, runAt: new Date().toISOString() };

(function(){
  'use strict';
  if (window.__DashboardFinalLoader) return;
  window.__DashboardFinalLoader = true;

  var VERSION = '20260518-final-3';
  var debugMode = /[?&]uddebug=1\b/.test(location.search);
  var loadStatus = {};

  function loadScript(id, src, key, onload){
    if (document.getElementById(id)) { loadStatus[key] = 'existing'; return; }
    var script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    script.onload = function(){ loadStatus[key] = 'loaded'; if (onload) onload(); renderDebug(); };
    script.onerror = function(){ loadStatus[key] = 'error'; renderDebug(); };
    loadStatus[key] = 'loading';
    (document.head || document.documentElement).appendChild(script);
  }

  function legacyState(){
    return {
      v75: !!window.__V75ForceFixInstalled,
      v76: !!window.__V76VisibleFixInstalled,
      v77: !!window.__V77OpsFixInstalled,
      v79: !!window.__V79FreezeGuardInstalled,
      v80: !!window.__V80EpfcDisplayFixInstalled
    };
  }

  function snapshot(){
    return {
      version: 'final-loader-' + VERSION,
      htmlHelper: !!window.UDHtml,
      dashboardFinal: !!window.DashboardFinal,
      dashboardFinalStatus: window.DashboardFinalStatus || null,
      disabledLegacy: true,
      inlineLegacyFlags: legacyState(),
      loadStatus: loadStatus,
      pages: {
        home: !!document.getElementById('p-home'),
        routine: !!document.getElementById('p-routine'),
        epfc: !!document.getElementById('p-epfc'),
        plan: !!document.getElementById('p-plan'),
        code: !!document.getElementById('p-code'),
        repair: !!document.getElementById('p-trading'),
        nl: !!document.getElementById('p-nl'),
        sport: !!document.getElementById('p-sport'),
        chess: !!document.getElementById('p-chess')
      },
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
    panel.textContent = JSON.stringify(snapshot(), null, 2);
  }

  function runAll(){
    if (window.DashboardFinal && window.DashboardFinal.run) window.DashboardFinal.run();
    window.UDRuntimeLoaded = snapshot();
    renderDebug();
  }

  function boot(){
    /* Stubs use the EXACT version strings each legacy file checks in its
       IIFE guard, so the guard triggers and the body never runs even if
       the file is loaded from a stale PWA / SW cache. */
    window.UDFinalCleanup = { version:'v1', run:function(){} };
    window.UDFinalCleanupV2 = { version:'disabled', run:function(){} };
    window.UDForceUIV3 = { version:'disabled', run:function(){} };
    window.UDForceUIV4 = { version:'disabled', run:function(){} };
    window.UDEtudesTracker = { version:'epfc-study-v1', render:function(){} };
    loadScript('ud-core-html-runtime', '/assets/core/html.js?v=' + VERSION, 'html', runAll);
    /* DISABLED: dashboard-final.js loads dashboard-clean.js which overrides UI.
       loadScript('dashboard-final-runtime', '/assets/core/dashboard-final.js?v=' + VERSION, 'dashboardFinal', runAll); */
    setTimeout(runAll, 500);
    setTimeout(runAll, 1500);
    setTimeout(runAll, 3000);
    document.addEventListener('click', function(e){
      if (e.target && e.target.closest && e.target.closest('.tab,[data-tab],[data-go],button,a')) setTimeout(runAll, 180);
    }, true);
    document.addEventListener('change', function(){ setTimeout(runAll, 180); }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
