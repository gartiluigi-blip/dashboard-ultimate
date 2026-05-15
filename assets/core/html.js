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
