(function(){
  'use strict';

  const ENTITIES = Object.freeze({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  });

  function text(value){
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function escape(value){
    return text(value).replace(/[&<>"']/g, char => ENTITIES[char]);
  }

  function attrNameIsSafe(name){
    return /^[a-zA-Z_:][a-zA-Z0-9_:\-.]*$/.test(name) && !/^on/i.test(name);
  }

  function attrs(values){
    if (!values || typeof values !== 'object') return '';
    return Object.entries(values)
      .filter(([name, value]) => attrNameIsSafe(name) && value !== false && value !== null && value !== undefined)
      .map(([name, value]) => value === true ? ` ${name}` : ` ${name}="${escape(value)}"`)
      .join('');
  }

  function nl2br(value){
    return escape(value).replace(/\n/g, '<br>');
  }

  window.UDHtml = Object.freeze({
    text,
    escape,
    attrs,
    nl2br
  });
})();

(function(){
  'use strict';

  function loadScriptOnce(id, src, onload){
    if (document.getElementById(id)) return;
    var s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.defer = true;
    if (onload) s.onload = onload;
    s.onerror = function(){ console.warn('[runtime] failed to load ' + src); };
    document.head.appendChild(s);
  }

  function loadEtudesTracker(){
    if (window.UDEtudesTracker && window.UDEtudesTracker.version === 'v2-oreilly-code') return;
    var old = document.getElementById('ud-etudes-tracker-runtime');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    loadScriptOnce('ud-etudes-tracker-runtime-v2','/assets/core/etudes-tracker-v2.js?v=20260518-2',function(){
      if (window.UDEtudesTracker && window.UDEtudesTracker.render) window.UDEtudesTracker.render();
    });
  }

  function loadFinalCleanup(){
    loadScriptOnce('ud-final-cleanup-runtime','/assets/core/final-cleanup.js?v=20260518-1',function(){
      if (window.UDFinalCleanup && window.UDFinalCleanup.run) window.UDFinalCleanup.run();
    });
  }

  function boot(){
    try {
      loadEtudesTracker();
      loadFinalCleanup();
      window.UDRuntimeDiag = {
        version: 'diag-2026-05-18-4',
        host: !!document.getElementById('study-resources-host'),
        study: !!(window.__studyTracker && window.__studyTracker.render),
        etudes: !!(window.UDEtudesTracker && window.UDEtudesTracker.render),
        etudesVersion: window.UDEtudesTracker && window.UDEtudesTracker.version,
        cleanup: !!(window.UDFinalCleanup && window.UDFinalCleanup.run),
        plan: !!document.getElementById('p-plan'),
        epfc: !!document.getElementById('p-epfc'),
        code: !!document.getElementById('p-code')
      };
      if (window.__studyTracker && window.__studyTracker.render) window.__studyTracker.render();
      if (window.UDEtudesTracker && window.UDEtudesTracker.render) window.UDEtudesTracker.render();
      if (window.UDFinalCleanup && window.UDFinalCleanup.run) window.UDFinalCleanup.run();
      document.addEventListener('click', function(e){
        var target = e.target && e.target.closest && e.target.closest('.tab,[data-tab],[data-go],button,a');
        if (!target) return;
        setTimeout(function(){
          loadEtudesTracker();
          loadFinalCleanup();
          if (window.__studyTracker && window.__studyTracker.render) window.__studyTracker.render();
          if (window.UDEtudesTracker && window.UDEtudesTracker.render) window.UDEtudesTracker.render();
          if (window.UDFinalCleanup && window.UDFinalCleanup.run) window.UDFinalCleanup.run();
        }, 150);
      }, true);
    } catch (error) {
      console.warn('[UDRuntimeDiag]', error);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
