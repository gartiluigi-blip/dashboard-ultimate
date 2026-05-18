/* CRITICAL: stub Notification AVANT tout autre script. */
window.__earlyStub = true;
if (typeof window.Notification === 'undefined') {
  window.Notification = function(){};
  window.Notification.permission = 'default';
  window.Notification.requestPermission = function(){ return Promise.resolve('denied'); };
}

(function(){
  'use strict';
  if (window.__DashboardFinalLoader) return;
  window.__DashboardFinalLoader = true;

  var VERSION = '20260518-final-2';
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

  function snapshot(){
    return {
      version: 'final-loader-' + VERSION,
      htmlHelper: !!window.UDHtml,
      dashboardFinal: !!window.DashboardFinal,
      dashboardFinalStatus: window.DashboardFinalStatus || null,
      disabledLegacy: true,
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
    window.UDFinalCleanup = { version:'disabled', run:function(){} };
    window.UDFinalCleanupV2 = { version:'disabled', run:function(){} };
    window.UDForceUIV3 = { version:'disabled', run:function(){} };
    window.UDForceUIV4 = { version:'disabled', run:function(){} };
    window.UDEtudesTracker = { version:'disabled', render:function(){} };
    loadScript('ud-core-html-runtime', '/assets/core/html.js?v=' + VERSION, 'html', runAll);
    loadScript('dashboard-final-runtime', '/assets/core/dashboard-final.js?v=' + VERSION, 'dashboardFinal', runAll);
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
