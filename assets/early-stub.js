/* early-stub.js · minimal boot guard + legacy purge */
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

/* Kill all competing routine/study engine patches (v49–v73).
   These scripts check their own guard flag on load and exit immediately if set.
   Setting them here (before DOMContentLoaded) neutralises every inline engine
   that was overwriting Routine, EPFC, and study pages. */
window.__ULTIMATE_ROUTINE_V49_PATCH__    = true;
window.__ULTIMATE_ROUTINE_V50_MOBILE_OVERLAP__ = true;
window.__ULTIMATE_ROUTINE_V52_CHESS_TRACKER__  = true;
window.__UD_V54_CLEANUP_CONSOLIDATOR__   = true;
window.__UD_V55_MOBILE_LOG_CHESS_ELO__   = true;
window.__UD_V57_RESCUE__                 = true;
window.__udV59CleanRoutine               = true;
window.__udV62RoutineOneEngine           = true;
window.__udV63SmartRoutine               = true;
window.__udV64StudyCheckin               = true;
window.__udV67FullCleanCore              = true;
window.__udV69EpfcLab                    = true;
window.__enhV38                          = true;

(function(){
  'use strict';
  if (window.__EarlyStubMinimal) return;
  window.__EarlyStubMinimal = true;

  var VERSION = '20260518-legacy-purge';
  var debugMode = /[?&]uddebug=1\b/.test(location.search);
  var loadStatus = {};

  function $(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function byId(id){ return document.getElementById(id); }
  function page(id){ return byId('p-' + id); }

  function removeNode(node){ if (node && node.parentNode) node.parentNode.removeChild(node); }

  function purgeLegacyInlinePatches(){
    var ids = [
      'v75-forcefix-style','v76-visible-fix-style','v77-ops-fix-style','v78-grade-system-style',
      'v75-home-modules','v75-focus-fab','v75-focus-overlay','v77-overdue-card','v77-chess-card',
      'v77-prio-command','v77-chess-panel','v78-grade-panel','v79-freeze-panel','v80-epfc-display-fix'
    ];
    ids.forEach(function(id){ removeNode(byId(id)); });

    $('[id^="v75-"], [id^="v76-"], [id^="v77-"], [id^="v78-"], [id^="v79-"], [id^="v80-"]').forEach(function(node){
      if (node.id === 'v75-score-value' || node.id === 'v75-score-detail' || node.id === 'v75-morning-body') return;
      removeNode(node);
    });

    $('script[id*="v75"],script[id*="v76"],script[id*="v77"],script[id*="v78"],script[id*="v79"],script[id*="v80"],style[id*="v75"],style[id*="v76"],style[id*="v77"],style[id*="v78"],style[id*="v79"],style[id*="v80"]').forEach(removeNode);

    ['nutrition','souplesse','trading-old','legacy','cleanup','final'].forEach(function(tab){
      $('[data-tab="' + tab + '"]').forEach(removeNode);
      removeNode(page(tab));
    });

    // Nutrition/Flex legacy pages sometimes returned with old IDs/classes rather than tabs.
    $('[id="p-nutrition"],[id="p-souplesse"],.nutrition-tab,.nutrition-page,.souplesse-tab,.souplesse-page').forEach(removeNode);
  }

  function disableServiceWorkers(){
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then(function(regs){
          regs.forEach(function(reg){ try { reg.unregister(); } catch(_){} });
        }).catch(function(){});
      }
      if (window.caches && caches.keys) {
        caches.keys().then(function(keys){
          keys.forEach(function(k){ if (/dash|ultimate|dashboard|v\d+/i.test(k)) caches.delete(k); });
        }).catch(function(){});
      }
    } catch(_){}
  }

  function loadScript(id, src, key, onload){
    if (byId(id)) { loadStatus[key] = 'existing'; return; }
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
      legacyLeft: $('[id^="v75-"], [id^="v76-"], [id^="v77-"], [id^="v78-"], [id^="v79-"], [id^="v80-"]').map(function(n){ return n.id; }).filter(Boolean),
      runAt: new Date().toISOString()
    };
  }

  function renderDebug(){
    if (!debugMode || !document.body) return;
    var panel = byId('ud-runtime-debug-panel');
    if (!panel) {
      panel = document.createElement('pre');
      panel.id = 'ud-runtime-debug-panel';
      panel.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:999999;max-height:45vh;overflow:auto;background:#020617;color:#bbf7d0;border:1px solid #22c55e;border-radius:12px;padding:10px;font:11px ui-monospace,monospace;white-space:pre-wrap;box-shadow:0 10px 30px rgba(0,0,0,.45)';
      document.body.appendChild(panel);
    }
    panel.textContent = JSON.stringify(snapshot(), null, 2);
  }

  function boot(){
    purgeLegacyInlinePatches();
    disableServiceWorkers();
    loadScript('ud-core-html-runtime', '/assets/core/html.js?v=' + VERSION, 'html', function(){
      purgeLegacyInlinePatches();
      renderDebug();
    });
    setTimeout(purgeLegacyInlinePatches, 100);
    setTimeout(purgeLegacyInlinePatches, 500);
    setTimeout(purgeLegacyInlinePatches, 1500);
    setTimeout(renderDebug, 500);
    setTimeout(renderDebug, 1500);
    setTimeout(renderDebug, 3000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
