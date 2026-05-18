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

  function loadScript(id, src, onload){
    if (document.getElementById(id)) return;
    var script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    script.onload = onload || null;
    script.onerror = function(){ console.warn('[UDRuntimePatchLoader] failed:', src); };
    (document.head || document.documentElement).appendChild(script);
  }

  function runAll(){
    try {
      if (window.__studyTracker && window.__studyTracker.render) window.__studyTracker.render();
      if (window.UDEtudesTracker && window.UDEtudesTracker.render) window.UDEtudesTracker.render();
      if (window.UDFinalCleanup && window.UDFinalCleanup.run) window.UDFinalCleanup.run();
      if (window.UDFinalCleanupV2 && window.UDFinalCleanupV2.run) window.UDFinalCleanupV2.run();
      window.UDRuntimeLoaded = {
        version: 'early-loader-20260518-1',
        htmlJsLoaded: !!window.UDHtml,
        etudes: !!window.UDEtudesTracker,
        cleanup: !!window.UDFinalCleanup,
        cleanupV2: !!window.UDFinalCleanupV2,
        study: !!window.__studyTracker,
        runAt: new Date().toISOString()
      };
    } catch (error) {
      console.warn('[UDRuntimePatchLoader] runAll failed', error);
    }
  }

  function boot(){
    loadScript('ud-core-html-runtime', '/assets/core/html.js?v=20260518-6', runAll);
    loadScript('ud-etudes-v2-direct', '/assets/core/etudes-tracker-v2.js?v=20260518-6', runAll);
    loadScript('ud-final-cleanup-direct', '/assets/core/final-cleanup.js?v=20260518-6', runAll);
    loadScript('ud-final-cleanup-v2-direct', '/assets/core/final-cleanup-v2.js?v=20260518-6', runAll);
    setTimeout(runAll, 500);
    setTimeout(runAll, 1500);
    setTimeout(runAll, 3000);
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
