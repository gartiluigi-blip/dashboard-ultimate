/* router.js — tab navigation */
'use strict';

window.Router = (function () {
  var current = null;
  var listeners = [];

  function navigate(tabId) {
    if (current === tabId) return;
    current = tabId;

    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });

    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.toggle('active', p.id === 'page-' + tabId);
    });

    listeners.forEach(function (fn) { try { fn(tabId); } catch (e) {} });

    Store.set('lastTab', tabId);

    var activeTab = document.querySelector('.tab.active');
    if (activeTab) {
      activeTab.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }
  }

  function onNavigate(fn) { listeners.push(fn); }

  function init() {
    document.querySelectorAll('.tab').forEach(function (t) {
      t.addEventListener('click', function () { navigate(t.dataset.tab); });
    });

    var saved = Store.get('lastTab');
    var first = document.querySelector('.tab');
    navigate(saved || (first ? first.dataset.tab : 'aujourdhui'));
  }

  return { navigate: navigate, onNavigate: onNavigate, init: init, getCurrent: function () { return current; } };
})();
