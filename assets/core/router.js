/* Core UDRouter · tab/page navigation wrapper */
(function () {
  'use strict';

  if (window.UDRouter && window.UDRouter.__core) return;

  const subscribers = new Set();

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function storeTab(tab) {
    try {
      if (window.UDStore) window.UDStore.set('tab', tab);
      else localStorage.setItem('dashv2_tab', JSON.stringify(tab));
    } catch (_) {}
  }

  function fallbackGo(tab) {
    $$('.tab[data-tab]').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    $$('section.page').forEach(page => {
      const name = page.dataset.page || page.id.replace(/^p-/, '');
      page.classList.toggle('active', name === tab);
    });
    storeTab(tab);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (_) { window.scrollTo(0, 0); }
  }

  function notify(tab) {
    subscribers.forEach(fn => {
      try { fn(tab); }
      catch (error) { console.error('UDRouter subscriber error', error); }
    });
    try {
      window.dispatchEvent(new CustomEvent('udrouter:change', { detail: { tab } }));
    } catch (_) {}
  }

  function go(tab) {
    const name = String(tab || 'home');
    try {
      if (typeof window.go === 'function') window.go(name);
      else fallbackGo(name);
    } catch (_) {
      fallbackGo(name);
    }
    notify(name);
  }

  function current() {
    const activeTab = $('.tab[data-tab].active');
    if (activeTab) return activeTab.dataset.tab;
    const activePage = $('section.page.active');
    if (activePage) return activePage.dataset.page || activePage.id.replace(/^p-/, '');
    try {
      if (window.UDStore) return window.UDStore.get('tab', 'home');
    } catch (_) {}
    return 'home';
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return () => {};
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  window.UDRouter = { __core: true, go, current, subscribe };
})();
