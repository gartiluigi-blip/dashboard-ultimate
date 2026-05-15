/* CRITICAL: stub Notification AVANT tout autre script.
   Sans ça, Brave/Firefox privé crash à la ligne 6301
   et l'app entière ne se charge pas. */
window.__earlyStub = true;
if (typeof window.Notification === 'undefined') {
  window.Notification = function(){};
  window.Notification.permission = 'default';
  window.Notification.requestPermission = function(){ return Promise.resolve('denied'); };
}
