(function(){
  'use strict';

  const onceKeys = new Set();

  function qs(selector, root){
    if (!selector) return null;
    const scope = root || document;
    return scope.querySelector ? scope.querySelector(selector) : null;
  }

  function qsa(selector, root){
    if (!selector) return [];
    const scope = root || document;
    if (!scope.querySelectorAll) return [];
    return Array.from(scope.querySelectorAll(selector));
  }

  function on(target, event, handler, options){
    if (!target || !event || typeof handler !== 'function') return function noop(){};
    target.addEventListener(event, handler, options || false);
    return function off(){
      target.removeEventListener(event, handler, options || false);
    };
  }

  function onSelector(selector, event, handler, options){
    const target = qs(selector);
    return on(target, event, handler, options);
  }

  function delegate(root, selector, event, handler, options){
    const scope = typeof root === 'string' ? qs(root) : (root || document);
    if (!scope || !selector || !event || typeof handler !== 'function') {
      return function noop(){};
    }

    return on(scope, event, function delegated(evt){
      const target = evt.target && evt.target.closest ? evt.target.closest(selector) : null;
      if (!target || !scope.contains(target)) return;
      handler.call(target, evt, target);
    }, options);
  }

  function once(key, fn){
    if (!key || typeof fn !== 'function') return undefined;
    if (onceKeys.has(key)) return undefined;
    onceKeys.add(key);
    return fn();
  }

  function ready(fn){
    if (typeof fn !== 'function') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
      return;
    }
    fn();
  }

  window.UDDom = Object.freeze({
    qs,
    qsa,
    on,
    onSelector,
    delegate,
    once,
    ready
  });
})();
