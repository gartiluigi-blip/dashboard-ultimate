/* early-stub.js · safe boot · final v2 */
(function(){
  'use strict';
  if (window.__UD_EARLY_STUB_SAFE_FINAL_V2__) return;
  window.__UD_EARLY_STUB_SAFE_FINAL_V2__ = true;
  window.__earlyStub = true;

  if (typeof window.Notification === 'undefined') {
    window.Notification = function(){};
    window.Notification.permission = 'default';
    window.Notification.requestPermission = function(){ return Promise.resolve('denied'); };
  }

  var VERSION = '20260518h-final-v2';
  var KILL_FLAGS = [
    '__UD_ULTIMATE_20_FEATURES_PACK__','__ultimateV3','__hotfix31','__V75ForceFixInstalled','__V76VisibleFixInstalled','__V77OpsFixInstalled','__V78GradeSystemInstalled','__V79FreezeGuardInstalled','__V80EpfcDisplayFixInstalled','__V79FreezeGuardBypassedByFinal','__ULTIMATE_ROUTINE_V49_PATCH__','__ULTIMATE_ROUTINE_V50_MOBILE_OVERLAP__','__ULTIMATE_ROUTINE_V52_CHESS_TRACKER__','__UD_V54_CLEANUP_CONSOLIDATOR__','__UD_V55_MOBILE_LOG_CHESS_ELO__','__UD_V57_RESCUE__','__udV59CleanRoutine','__udV62RoutineOneEngine','__udV63SmartRoutine','__udV64StudyCheckin','__udV67FullCleanCore','__udV69EpfcLab','__enhV38','__udV60RoutineCardClickFix','__udV61RoutineCleanPolicy','__udV71MatiereFix','__udV73Command','__UD_ROUTINE_CHECKIN_ENGINE_V1__','__UD_INTAKE_BUTTONS_V48','__UD_USER_REQUEST_20260518__','__UD_V17_CLEAN__','__UD_V18_STRICT__','__UD_FINAL_SAFE_FIX__'
  ];
  KILL_FLAGS.forEach(function(k){ window[k] = true; });

  function $(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function byId(id){ return document.getElementById(id); }
  function removeNode(node){ if (node && node.parentNode) node.parentNode.removeChild(node); }

  function purgeLegacy(){
    [
      'v75-forcefix-style','v76-visible-fix-style','v77-ops-fix-style','v78-grade-system-style','v75-home-modules','v75-focus-fab','v75-focus-overlay','v77-overdue-card','v77-chess-card','v77-prio-command','v77-chess-panel','v78-grade-panel','v79-freeze-panel','v80-epfc-display-fix','u20-cockpit','u20-fab','ud-v16-focus','ud-v16-resume','ud-v16-routine','ud-v16-sport','ud-v16-study','ud-v16-chess','ud-v16-extra-progress','ud-v16-extra-progress-wrap','ud-v17-bookmarks','ud-v17-ppl','ud-v17-study','ud-v18-books','ud-v18-ppl','ud-v18-study','ud-final-bookmarks'
    ].forEach(function(id){ removeNode(byId(id)); });
    $('[id^="v75-"],[id^="v76-"],[id^="v77-"],[id^="v78-"],[id^="v79-"],[id^="v80-"],.ud-v16-card,.ud-v16-routine-tl,.ud-v16-extra-progress,.ud-v17-line,.ud-v17-bookmark,.ud-v18-book,[class*="u20-resume-card"],[id="p-nutrition"],[id="p-souplesse"],.nutrition-tab,.souplesse-tab').forEach(removeNode);
  }

  function clearBrowserCaches(){
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then(function(regs){ regs.forEach(function(reg){ try { reg.unregister(); } catch(e){} }); }).catch(function(){});
      }
    } catch(e){}
    try {
      if (window.caches && caches.keys) {
        caches.keys().then(function(keys){ keys.forEach(function(k){ try { caches.delete(k); } catch(e){} }); }).catch(function(){});
      }
    } catch(e){}
  }

  function loadScript(id, src, cb){
    if (byId(id)) { if (cb) cb(); return; }
    var s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.defer = true;
    s.onload = function(){ if (cb) cb(); };
    s.onerror = function(){ try { console.warn('[UD boot] failed', src); } catch(e){} };
    (document.head || document.documentElement).appendChild(s);
  }

  function boot(){
    clearBrowserCaches();
    purgeLegacy();
    loadScript('ud-force-runtime-refresh', '/assets/force-runtime-refresh.js?v=' + VERSION, function(){
      purgeLegacy();
      loadScript('ud-core-html-runtime', '/assets/core/html.js?v=' + VERSION, function(){
        purgeLegacy();
        loadScript('ud-final-v2', '/assets/ud-final-v2.js?v=' + VERSION, function(){
          purgeLegacy();
        });
      });
    });
    setTimeout(purgeLegacy, 100);
    setTimeout(purgeLegacy, 500);
    setTimeout(purgeLegacy, 1500);
    setTimeout(function(){ loadScript('ud-final-v2', '/assets/ud-final-v2.js?v=' + VERSION); }, 2200);
    setTimeout(function(){ loadScript('ud-final-v2-late', '/assets/ud-final-v2.js?v=' + VERSION + '-late'); }, 4200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
