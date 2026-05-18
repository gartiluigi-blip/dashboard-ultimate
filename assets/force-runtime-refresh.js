/* Force runtime refresh — kills old service worker/cache layers */
(function(){
  if (window.__UD_FORCE_RUNTIME_REFRESH__) return;
  window.__UD_FORCE_RUNTIME_REFRESH__ = true;
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(function(regs){
        regs.forEach(function(reg){ try { reg.unregister(); } catch(e){} });
      }).catch(function(){});
    }
  } catch(e){}
  try {
    if (window.caches && caches.keys) {
      caches.keys().then(function(keys){
        keys.forEach(function(k){ try { caches.delete(k); } catch(e){} });
      }).catch(function(){});
    }
  } catch(e){}
  try { localStorage.setItem('dashv2_runtime_refresh_v17', String(Date.now())); } catch(e){}
})();
