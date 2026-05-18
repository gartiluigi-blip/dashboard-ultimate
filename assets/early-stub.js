/* early-stub.js · minimal boot guard */
window.__earlyStub = true;

if (typeof window.Notification === 'undefined') {
  window.Notification = function(){};
  window.Notification.permission = 'default';
  window.Notification.requestPermission = function(){ return Promise.resolve('denied'); };
}

/* Disable late legacy inline patchers that previously rewrote visible UI. */
window.__V75ForceFixInstalled = true;
window.__V76VisibleFixInstalled = true;
window.__V77OpsFixInstalled = true;
window.__V78GradeSystemInstalled = true;
window.__V79FreezeGuardInstalled = true;
window.__V80EpfcDisplayFixInstalled = true;
window.__V79FreezeGuardBypassedByFinal = true;

(function(){
  'use strict';
  if (window.__EarlyStubMinimal) return;
  window.__EarlyStubMinimal = true;

  var VERSION = '20260518-minimal-boot';
  var debugMode = /[?&]uddebug=1\b/.test(location.search);
  var loadStatus = {};

  function page(id){ return document.getElementById('p-' + id); }

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
      version: VERSION,
      disabledLegacy: true,
      loadStatus: loadStatus,
      pages: {
        home: !!page('home'),
        routine: !!page('routine'),
        stats: !!page('stats'),
        epfc: !!page('epfc'),
        code: !!page('code'),
        repair: !!page('repair'),
        iot: !!page('trading'),
        nl: !!page('nl'),
        sport: !!page('sport'),
        chess: !!page('chess'),
        finance: !!page('finance'),
        plan: !!page('plan'),
        vinted: !!page('vinted'),
        ia: !!page('ia')
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

  function boot(){
    loadScript('ud-core-html-runtime', '/assets/core/html.js?v=' + VERSION, 'html', renderDebug);
    setTimeout(renderDebug, 500);
    setTimeout(renderDebug, 1500);
    setTimeout(renderDebug, 3000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
