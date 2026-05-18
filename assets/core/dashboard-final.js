(function(){
  'use strict';
  if (window.DashboardFinal) return;
  function loadClean(){
    if (window.DashboardClean && window.DashboardClean.run) { window.DashboardClean.run(); return; }
    if (document.getElementById('dashboard-clean-runtime')) return;
    var s = document.createElement('script');
    s.id = 'dashboard-clean-runtime';
    s.src = '/assets/core/dashboard-clean.js?v=20260518-clean-3';
    s.defer = true;
    s.onload = function(){ if (window.DashboardClean && window.DashboardClean.run) window.DashboardClean.run(); };
    (document.head || document.documentElement).appendChild(s);
  }
  function run(){
    loadClean();
    window.DashboardFinalStatus = {
      version: 'delegates-to-dashboard-clean',
      clean: !!window.DashboardClean,
      cleanStatus: window.DashboardCleanStatus || null,
      runAt: new Date().toISOString()
    };
  }
  window.DashboardFinal = { version: 'delegates-to-dashboard-clean', run: run };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once:true });
  else run();
})();
