window.UDHtml = window.UDHtml || {
  text: function(value){ return value == null ? '' : String(value); },
  escape: function(value){ return value == null ? '' : String(value); },
  attrs: function(){ return ''; },
  nl2br: function(value){ return value == null ? '' : String(value).split('\n').join('<br>'); }
};
window.UDRuntimeDiag = Object.assign({}, window.UDRuntimeDiag || {}, {
  htmlHelperOnly: true,
  htmlHelperVersion: '20260518-final-passive'
});
