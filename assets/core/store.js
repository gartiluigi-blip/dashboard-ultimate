/* Core UDStore · dashv2 namespace wrapper */
(function () {
  'use strict';

  if (window.UDStore && window.UDStore.__core) return;

  const NS = 'dashv2_';
  const subscribers = new Set();
  const storage = window.safeStorage || null;

  function rawGet(key, fallback = null) {
    if (storage) return storage.getRaw(NS + key, fallback);
    try {
      const value = localStorage.getItem(NS + key);
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function rawSet(key, value) {
    if (storage) return storage.setRaw(NS + key, value);
    try {
      localStorage.setItem(NS + key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function rawRemove(key) {
    if (storage) return storage.removeRaw(NS + key);
    try {
      localStorage.removeItem(NS + key);
      return true;
    } catch (_) {
      return false;
    }
  }

  function notify(key, value) {
    const batch = new Map([[key, value]]);
    subscribers.forEach(fn => {
      try { fn(batch); }
      catch (error) { console.error('UDStore subscriber error', error); }
    });
    try {
      window.dispatchEvent(new CustomEvent('udstore:change', { detail: { key, value } }));
    } catch (_) {}
  }

  function get(key, fallback = null) {
    const raw = rawGet(key, null);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); }
    catch (_) { return fallback; }
  }

  function set(key, value) {
    const ok = rawSet(key, JSON.stringify(value));
    if (ok) notify(key, value);
    return ok;
  }

  function del(key) {
    const ok = rawRemove(key);
    if (ok) notify(key, undefined);
    return ok;
  }

  function all() {
    const out = {};
    try {
      for (let index = 0; index < localStorage.length; index++) {
        const rawKey = localStorage.key(index);
        if (!rawKey || !rawKey.startsWith(NS)) continue;
        const key = rawKey.slice(NS.length);
        out[key] = get(key, null);
      }
    } catch (_) {}
    return out;
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return () => {};
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  function subscribePrefix(prefix, fn) {
    return subscribe(batch => {
      for (const [key, value] of batch) {
        if (key.startsWith(prefix)) {
          fn(key, value, batch);
          return;
        }
      }
    });
  }

  window.UDStore = { __core: true, ns: NS, get, set, del, all, subscribe, subscribePrefix };
})();
