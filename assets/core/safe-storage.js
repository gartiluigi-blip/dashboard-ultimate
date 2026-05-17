/* Core safe storage helper. */
(function () {
  'use strict';

  if (window.safeStorage) return;

  const stats = window.__storageStats || { ok: 0, errors: 0, lastError: null };

  function ok() { stats.ok += 1; }
  function fail(error) {
    stats.errors += 1;
    stats.lastError = String(error && error.message ? error.message : error);
  }

  function call(method, args, fallback) {
    try {
      const result = window.localStorage[method].apply(window.localStorage, args);
      ok();
      return result === undefined ? true : result;
    } catch (error) {
      fail(error);
      return fallback;
    }
  }

  function isAvailable() {
    const key = '__safe_storage_test_' + Date.now();
    const written = setRaw(key, '1');
    removeRaw(key);
    return Boolean(written);
  }

  function getRaw(key, fallback = null) {
    const value = call('getItem', [key], null);
    return value == null ? fallback : value;
  }

  function setRaw(key, value) {
    return call('setItem', [key, value], false) === true;
  }

  function removeRaw(key) {
    return call('removeItem', [key], false) === true;
  }

  function keys(prefix = '') {
    const out = [];
    try {
      for (let index = 0; index < window.localStorage.length; index++) {
        const key = window.localStorage.key(index);
        if (key && (!prefix || key.startsWith(prefix))) out.push(key);
      }
      ok();
    } catch (error) {
      fail(error);
    }
    return out;
  }

  function getJson(key, fallback = null) {
    const raw = getRaw(key, null);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); }
    catch (error) { fail(error); return fallback; }
  }

  function setJson(key, value) {
    try { return setRaw(key, JSON.stringify(value)); }
    catch (error) { fail(error); return false; }
  }

  window.__storageStats = stats;
  window.safeStorage = { stats, isAvailable, getRaw, setRaw, removeRaw, keys, getJson, setJson };
})();
