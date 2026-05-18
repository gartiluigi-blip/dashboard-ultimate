
(function(){
'use strict';

// ============================================================
// EARLY ERROR CATCHER — surfaces JS errors visibly at the top of the page
// ============================================================
// Without this, a single typo could silently break ALL listeners on the page.
// With it, you see the error immediately in red instead of "everything's broken".
window.addEventListener('error', e => {
  try {
    let bar = document.getElementById('__err_bar');
    if (!bar){
      bar = document.createElement('div');
      bar.id = '__err_bar';
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#7a1f1f;color:#fff;padding:8px 12px;font:600 11px/1.4 -apple-system,system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.5);';
      bar.innerHTML = '<span style="opacity:.7">⚠️ ERREUR JS · ouvre cette page sur un ordi pour voir le détail dans la console F12</span><br><span id="__err_msg"></span><button onclick="this.parentNode.remove()" style="position:absolute;top:6px;right:8px;background:transparent;border:0;color:#fff;font-size:14px;cursor:pointer">✕</button>';
      document.body && document.body.appendChild(bar);
    }
    const msg = document.getElementById('__err_msg');
    if (msg) msg.textContent = (e.message || 'unknown error') + ' @ ' + (e.filename||'inline').split('/').pop() + ':' + (e.lineno||'?');
  } catch(_){}
});
window.addEventListener('unhandledrejection', e => {
  try {
    console.error('Unhandled promise rejection:', e.reason);
  } catch(_){}
});

// ============================================================
// STORAGE
// ============================================================
const K = 'dashv2_';
let _quotaWarned = false;
let _storeReady = false;  // flips true once forward-ref helpers are wired up
/* COACH_SYSTEM_PROMPT — extrait pour dédup (audit Apr 2026).
   Modifie ICI uniquement, les sites client/server le réutilisent tous deux. */
const COACH_SYSTEM_PROMPT = "Tu es le coach personnel de l'utilisateur. Il a un dashboard qui track : EPFC (études), code, néerlandais, sport, souplesse, lecture, échecs, Vinted, humeur, pomodoros. Il est à Bruxelles, travaille en shifts rotatifs, prépare un bachelor dev pour sept. 2026, a une contrainte C7 (cervicales). Réponds en français, ton direct mais chaleureux, concret. Maximum 150 mots. Utilise les chiffres réels de son contexte. Si tu détectes un problème, dis-le clairement sans édulcorer.";

const S = {
  get(k, d){ try { const v = localStorage.getItem(K+k); return v===null?d:JSON.parse(v); } catch(e){ return d; } },
  set(k, v){
    try {
      localStorage.setItem(K+k, JSON.stringify(v));
      if (_storeReady){
        try { _notifyStore(k, v); } catch(_){}
        try { if (idbMirror) idbMirror.set(k, v); } catch(_){}
      }
    }
    catch(e){
      if (!_quotaWarned && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)){
        _quotaWarned = true;
        try { (typeof showToast === 'function' ? showToast : alert)('⚠️ Stockage plein — exporte tes données (onglet Plan → Exporter).'); } catch(_){}
      }
    }
  },
  del(k){
    try {
      localStorage.removeItem(K+k);
      if (_storeReady){
        try { _notifyStore(k, undefined); } catch(_){}
        try { if (idbMirror) idbMirror.del(k); } catch(_){}
      }
    } catch(e){}
  },
  all(){
    const out = {};
    for (let i = 0; i < localStorage.length; i++){
      const key = localStorage.key(i);
      if (key && key.startsWith(K)) { try { out[key.slice(K.length)] = JSON.parse(localStorage.getItem(key)); } catch(e){} }
    }
    return out;
  }
};

// Keys that must NEVER appear in any backup or export.
// Stored without the dashv2_ prefix (matching S.get/set keys).
const BACKUP_SECRETS = new Set(['claude_api_key', 'gh_token']);
// Same keys with the storage prefix (for raw localStorage loops).
const BACKUP_SECRETS_RAW = new Set(['dashv2_claude_api_key', 'dashv2_gh_token']);
// ─────────────────────────────────────────────────────────────
// Keeps an async mirror of all writes. Doesn't gate reads (kept sync on localStorage).
// Purpose: safety net against localStorage wipe + ready migration path when we flip over.
// NOTE: declared with `let` so the typeof guard in S.set works even before this block runs.
let idbMirror = null;
idbMirror = (function(){
  let dbPromise = null;
  function openDb(){
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) { resolve(null); return; }
      const req = indexedDB.open('dashv2', 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    });
    return dbPromise;
  }
  async function _tx(mode, fn){
    const db = await openDb(); if (!db) return null;
    return new Promise((resolve, reject) => {
      try {
        const t = db.transaction('kv', mode);
        const store = t.objectStore('kv');
        const result = fn(store);
        t.oncomplete = () => resolve(result);
        t.onerror = () => resolve(null);
        t.onabort = () => resolve(null);
      } catch(e){ resolve(null); }
    });
  }
  // Queue writes to avoid overwhelming the event loop; fire-and-forget style
  const queue = []; let draining = false;
  async function drain(){
    if (draining) return; draining = true;
    while (queue.length){
      const op = queue.shift();
      try { await op(); } catch(_){}
    }
    draining = false;
  }
  return {
    async set(k, v){
      queue.push(() => _tx('readwrite', s => s.put(v, k)));
      drain();
    },
    async del(k){
      queue.push(() => _tx('readwrite', s => s.delete(k)));
      drain();
    },
    async get(k){
      const db = await openDb(); if (!db) return null;
      return new Promise(resolve => {
        const req = db.transaction('kv').objectStore('kv').get(k);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    },
    async all(){
      const db = await openDb(); if (!db) return {};
      return new Promise(resolve => {
        const out = {};
        const cursorReq = db.transaction('kv').objectStore('kv').openCursor();
        cursorReq.onsuccess = e => {
          const cursor = e.target.result;
          if (!cursor){ resolve(out); return; }
          out[cursor.key] = cursor.value;
          cursor.continue();
        };
        cursorReq.onerror = () => resolve(out);
      });
    },
    // Seed IDB from localStorage at first load so mirror converges
    async seed(){
      const ls = {};
      for (let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);
        if (key && key.startsWith(K)){
          try { ls[key.slice(K.length)] = JSON.parse(localStorage.getItem(key)); } catch(_){}
        }
      }
      for (const [k, v] of Object.entries(ls)){
        queue.push(() => _tx('readwrite', s => s.put(v, k)));
      }
      drain();
    }
  };
})();
// Seed on startup — runs once, fire-and-forget
setTimeout(() => { idbMirror.seed(); }, 500);

// ─────────────────────────────────────────────────────────────
// REACTIVE STORE — pub/sub layer on top of S
// ─────────────────────────────────────────────────────────────
// Subscribers get notified on every S.set/S.del. Use this to keep UI in sync
// automatically instead of calling refresh functions manually after each mutation.
const _storeSubs = new Set();
function _notifyStore(key, value){
  // Batch notifications in a microtask — multiple S.set() in the same synchronous block
  // only trigger ONE subscriber call each (coalesced by key).
  if (!_notifyStore._pending){
    _notifyStore._pending = new Map();
    queueMicrotask(() => {
      const batch = _notifyStore._pending;
      _notifyStore._pending = null;
      _storeSubs.forEach(fn => {
        try { fn(batch); } catch(e){ console.error('store sub error', e); }
      });
    });
  }
  _notifyStore._pending.set(key, value);
}
function storeSubscribe(fn){ _storeSubs.add(fn); return () => _storeSubs.delete(fn); }
// Prefix-based subscription helper
function storeSubscribePrefix(prefix, fn){
  return storeSubscribe(batch => {
    for (const [k, v] of batch){
      if (k.startsWith(prefix)){ fn(k, v, batch); return; }
    }
  });
}
// Now that _notifyStore and idbMirror are both defined, S can use them safely.
_storeReady = true;

// ============================================================
// CONSTANTS
// ============================================================
const pad = n => n<10?'0'+n:''+n;
const DAYS_FR    = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const DAYS_SHORT = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const DAYS_MIN   = ['D','L','M','M','J','V','S'];
const MONTHS_FR  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const dateKey    = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const monthKey   = d => d.getFullYear()+'-'+pad(d.getMonth()+1);
const today      = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const setText    = (sel, v) => { const el = document.querySelector(sel); if (el) el.textContent = v; };
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// DST-safe day difference: floors both to local midnight then divides. Returns (a - b) in whole days.
const dateDiffDays = (a, b) => {
  const A = new Date(a); A.setHours(0,0,0,0);
  const B = new Date(b); B.setHours(0,0,0,0);
  return Math.round((A - B) / 86400000);
};
// DST-safe "d + n days" — uses setDate so clock stays at local midnight across DST shifts.
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

// Global config — magic numbers extracted to one place.
const CFG = {
  START_DATE: (() => { const d = new Date(2026, 3, 20); d.setHours(0,0,0,0); return d; })(), // tracking begins 2026-04-20
  POMO: { WORK_MIN: 25, SHORT_BREAK: 5, LONG_BREAK: 15, TOTAL_CYCLE: 4 },
  TARGETS:  { epfc: 14*60, nl: 3*60, flex: 5, sport: 3 }, // weekly
  RING_C:   97.4,   // SVG ring circumference (2π·r for r≈15.5)
  AUTOSAVE_MS: 800,
  TOAST_MS: 5000,
  SCROLL_TOP_THRESH: 400
};
// Schema version — bump when stored JSON shape changes; migrations run once at load.
(function runMigrations(){
  const cur = S.get('__schema_version', 0);
  const target = 1;
  if (cur >= target) return;
  // v0 → v1: no destructive changes yet. Just stamp the version so future migrations have a baseline.
  S.set('__schema_version', target);
})();

// ─────────────────────────────────────────────────────────────
// METRIC HELPERS — single source of truth for "how we count things"
// ─────────────────────────────────────────────────────────────
// Total study minutes for a day log. NL is counted as study
// (consistent with Stats 30j and XP logic).
function studyMinutes(log){
  if (!log) return 0;
  return (log.epfc||0) + (log.code||0) + (log.nl||0);
}
// Count active domains for a day log. Anki is excluded — it's a cadence
// helper, not a standalone domain.
function countActiveDomains(log){
  if (!log) return 0;
  let n = 0;
  ['epfc','code','nl','read','chess','vinted'].forEach(k => { if (log[k]) n++; });
  if (log.sport) n++;
  if (log.flex) n++;
  return n;
}
// Threshold for a day to be "active" (used across weekly, monthly, stats).
const ACTIVE_DAY_MIN_DOMAINS = 4;

// Default wake times per shift (minutes since midnight) — aligned with first tl-time in each view
const SHIFT_WAKE = { sm: 480, s1: 330, s2: 375, s3: 375, s4: 390, sw: 420 };
// Shift display labels
const SHIFT_NAMES = { sm:'🏥 Maladie', s1:'Shift 5h30', s2:'Shift 7h', s3:'Shift 11h', s4:'Shift 13h30', sw:'Weekend' };
const SHIFT_NAMES_SHORT = { sm:'Maladie', s1:'5h30', s2:'7h', s3:'11h', s4:'13h30', sw:'Weekend' };

// ─────────────────────────────────────────────────────────────
// HAPTIC FEEDBACK — tiny, optional, no-op on desktop
// ─────────────────────────────────────────────────────────────
// Use on every action that matters: check, save, shift change, level-up
function hapticTap(){    try { navigator.vibrate && navigator.vibrate(10); } catch(_){} }
function hapticDouble(){ try { navigator.vibrate && navigator.vibrate([8, 40, 8]); } catch(_){} }
function hapticSuccess(){try { navigator.vibrate && navigator.vibrate([10, 30, 20, 30, 40]); } catch(_){} }
function hapticWarn(){   try { navigator.vibrate && navigator.vibrate([30, 60, 30]); } catch(_){} }

// ─────────────────────────────────────────────────────────────
// UNDO STACK — global Ctrl/⌘+Z for any mutation that pushes an undo
// ─────────────────────────────────────────────────────────────
const undoStack = [];
const MAX_UNDO = 25;
function pushUndo(label, undoFn){
  undoStack.push({ label, undoFn, at: Date.now() });
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}
function doUndo(){
  const op = undoStack.pop();
  if (!op){ try { showToast('Rien à annuler'); } catch(_){} return false; }
  try { op.undoFn(); } catch(e){ console.error('undo failed', e); return false; }
  try { showToast('↶ Annulé : ' + op.label); } catch(_){}
  try { hapticTap(); } catch(_){}
  return true;
}
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey){
    const target = e.target;
    const inInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (inInput) return; // let the browser do native text undo
    e.preventDefault();
    doUndo();
  }
});

// ─────────────────────────────────────────────────────────────
// CONFETTI — minimal, no deps, ~1KB, DOM-based (30 particles)
// ─────────────────────────────────────────────────────────────
// Burst at origin point; particles animate via CSS keyframes then self-remove.
function burstConfetti(originEl){
  try {
    const rect = originEl ? originEl.getBoundingClientRect() : { left: window.innerWidth/2, top: 100, width:0, height:0 };
    const x0 = rect.left + rect.width/2;
    const y0 = rect.top + rect.height/2;
    const colors = ['#ff6b35','#ffa87a','#c8a84e','#34d399','#a78bfa','#6aa5fa','#f472b6','#22d3ee'];
    const host = document.createElement('div');
    host.className = 'confetti-host';
    host.style.left = x0+'px'; host.style.top = y0+'px';
    document.body.appendChild(host);
    const N = 28;
    for (let i = 0; i < N; i++){
      const p = document.createElement('span');
      p.className = 'confetti-p';
      const angle = (Math.PI * 2 * i) / N + (Math.random()-0.5)*0.5;
      const dist = 80 + Math.random()*120;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 30;
      p.style.setProperty('--dx', dx+'px');
      p.style.setProperty('--dy', dy+'px');
      p.style.setProperty('--rot', (Math.random()*720-360)+'deg');
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random()*60)+'ms';
      host.appendChild(p);
    }
    setTimeout(() => host.remove(), 1500);
  } catch(e){}
}

// Training cycle: 2 train + 1 rest rotating
// Default anchor: April 20, 2026 = rest (index 5 in TRAINING_SEQ)
// User can reset the cycle anytime from the Sport tab; stored offset in 'training_anchor_offset'
const TRAINING_SEQ = [
  { type:'push1', label:'Push · séance 1', target:'d1', desc:'Pecs, épaules, triceps. Focus poussées. Développé couché → développé incliné → élévations latérales → triceps.' },
  { type:'pull1', label:'Pull · séance 1', target:'d2', desc:'Dos, biceps, arrière-épaule. Focus tirages. Tirage horizontal → tirage vertical → rowing → curls.' },
  { type:'rest',  label:'Repos', target:'d7', desc:'Récupération active. Marche 30-45 min, hydratation, souplesse légère. Le repos EST l\'entraînement.' },
  { type:'legs1', label:'Legs · séance 1', target:'d3', desc:'Jambes complètes. Leg press → hip thrust → leg curl → mollets. Zéro compression cervicale.' },
  { type:'push2', label:'Push · séance 2', target:'d4', desc:'Volume épaules prioritaire. Développé assis → écartés → élévations → développé incliné haltères.' },
  { type:'rest',  label:'Repos', target:'d7', desc:'Jour off. Recharge glycogène, sommeil 8h, protéines 180g.' },
  { type:'pull2', label:'Pull · séance 2', target:'d5', desc:'Volume biceps & arrière-épaule. Tirage poulie haute → rowing assis → face pull → curls alternés.' },
  { type:'legs2', label:'Legs · séance 2', target:'d6', desc:'Focus ischio-fessiers. Hip thrust lourd → romanian deadlift (machine) → leg curl → adducteurs.' },
  { type:'rest',  label:'Repos', target:'d7', desc:'Fin de cycle. Mobilité cervicale douce, bain chaud si possible.' }
];
// Anchor = date that corresponds to index 0 (push1). Stored as timestamp, can be reset.
// Default: pick an anchor such that 2026-04-20 is idx 5 (rest). So anchor = 2026-04-15 = push1.
const TRAINING_ANCHOR_DEFAULT = new Date(2026, 3, 15); TRAINING_ANCHOR_DEFAULT.setHours(0,0,0,0);
function getTrainingAnchor(){
  const saved = S.get('training_anchor', null);
  if (saved){
    const d = new Date(saved);
    if (!isNaN(d.getTime())){ d.setHours(0,0,0,0); return d; }
  }
  return TRAINING_ANCHOR_DEFAULT;
}
function setTrainingAnchor(d){
  const dd = new Date(d); dd.setHours(0,0,0,0);
  S.set('training_anchor', dd.toISOString());
}
function trainingForDate(d){
  const anchor = getTrainingAnchor();
  const day = dateDiffDays(d, anchor);
  const idx = ((day % 9) + 9) % 9;
  return TRAINING_SEQ[idx];
}
// Shortcut: "reset cycle so that TODAY is type X" (user-friendly)
function resetCycleTo(type){
  // Find earliest matching index
  const targetIdx = TRAINING_SEQ.findIndex(x => x.type === type);
  if (targetIdx < 0) return;
  // We want today = targetIdx. anchor = today - targetIdx days
  const today0 = today();
  const newAnchor = addDays(today0, -targetIdx);
  setTrainingAnchor(newAnchor);
}

// ============================================================
// TAB NAVIGATION
// ============================================================
const tabEls  = document.querySelectorAll('[data-tab]');
const pageEls = document.querySelectorAll('section.page');
// A11y: make tabs proper buttons-as-tabs with keyboard support
tabEls.forEach(t => {
  t.setAttribute('role', 'tab');
  t.setAttribute('tabindex', '0');
  t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
});
const tabsNav = document.getElementById('tabs');
if (tabsNav) tabsNav.setAttribute('role', 'tablist');
function pageName(sec){
  if (sec.dataset.page) return sec.dataset.page;
  return (sec.id || '').replace(/^p-/, '');
}
function activateTab(name){
  tabEls.forEach(t => {
    const active = t.dataset.tab === name;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  pageEls.forEach(p => p.classList.toggle('active', pageName(p)===name));
  S.set('tab', name);
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e){ window.scrollTo(0,0); }
  const at = document.querySelector('.tab.active');
  if (at && at.scrollIntoView) {
    try { at.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' }); } catch(e){}
  }
  setTimeout(highlightNow, 40);
  if (name === 'stats') setTimeout(renderStats, 60);
  if (name === 'sport') setTimeout(renderTrainingSport, 40);
  if (name === 'routine') setTimeout(applyWakeOffset, 40);
}
tabEls.forEach((t, idx) => {
  t.addEventListener('click', () => activateTab(t.dataset.tab));
  t.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); activateTab(t.dataset.tab); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const list = Array.from(tabEls);
      const next = list[(idx + dir + list.length) % list.length];
      next.focus();
      activateTab(next.dataset.tab);
    }
    if (e.key === 'Home'){ e.preventDefault(); tabEls[0].focus(); activateTab(tabEls[0].dataset.tab); }
    if (e.key === 'End'){ e.preventDefault(); tabEls[tabEls.length-1].focus(); activateTab(tabEls[tabEls.length-1].dataset.tab); }
  });
});
activateTab(S.get('tab', 'home'));
window.go = activateTab;

// ─────────────────────────────────────────────────────────────
// SERVICE WORKER — inline, caches the current document for offline use
// ─────────────────────────────────────────────────────────────
// Works only on https or localhost. File-served opens don't register one.
const APP_VERSION = '2.8.0';
if ('serviceWorker' in navigator && location.protocol !== 'file:'){
  const swCode = `
    const VERSION = '${APP_VERSION}';
    const CACHE = 'dash-' + VERSION;
    const STATIC = [self.location.pathname, self.location.origin + '/'];
    self.addEventListener('install', e => {
      e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {})));
      self.skipWaiting();
    });
    self.addEventListener('activate', e => {
      e.waitUntil(
        caches.keys().then(keys => Promise.all(
          keys.filter(k => k !== CACHE && k.startsWith('dash-')).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
      );
    });
    self.addEventListener('fetch', e => {
      const url = new URL(e.request.url);
      if (e.request.method !== 'GET') return;
      if (url.origin !== self.location.origin) return;
      // Network-first with cache fallback — keeps dashboard fresh while staying offline-capable
      e.respondWith(
        fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          return res;
        }).catch(() => caches.match(e.request))
      );
    });
    // Listen for "skipWaiting" message from the page to force update
    self.addEventListener('message', e => {
      if (e.data === 'SKIP_WAITING') self.skipWaiting();
    });
  `;
  try {
    const blob = new Blob([swCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    navigator.serviceWorker.register(url, { scope: './' }).then(reg => {
      // Detect new version → notify user to reload
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller){
            try { showToast('🔄 Nouvelle version disponible · recharge pour l\'appliquer'); } catch(_){}
          }
        });
      });
    }).catch(() => {});
  } catch(_){}
}
// PWA install prompt — capture beforeinstallprompt, expose button when available
let _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredPrompt = e;
  // Optionally surface an "Install" hint — we keep it subtle, in the data section
  const exp = document.querySelector('[id="data-export"]')?.parentElement;
  if (exp && !document.getElementById('pwa-install')){
    const btn = document.createElement('button');
    btn.id = 'pwa-install';
    btn.className = 'data-btn';
    btn.textContent = '📲 Installer sur l\'écran d\'accueil';
    btn.addEventListener('click', async () => {
      if (!_deferredPrompt) return;
      _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      if (outcome === 'accepted') btn.remove();
      _deferredPrompt = null;
    });
    exp.appendChild(btn);
  }
});

// ─────────────────────────────────────────────────────────────
// LOCAL NOTIFICATIONS — reminders for upcoming routine blocks
// ─────────────────────────────────────────────────────────────
// Strategy: pure client-side. Check every minute if a block starts in the next 5 min,
// fire a Notification if permission granted + not already fired today for that block.
const notif = {
  enabled(){ return 'Notification' in window && Notification.permission === 'granted'; },
  async request(){
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    try { return await Notification.requestPermission(); }
    catch(_){ return 'denied'; }
  },
  fire(title, body, tag){
    if (!this.enabled()) return;
    try {
      new Notification(title, {
        body,
        tag: tag || ('routine-'+Date.now()),
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="%23ff6b35"/><text x="48" y="66" font-size="56" text-anchor="middle" fill="%230a0a10" font-family="sans-serif" font-weight="900">%E2%9A%A1</text></svg>',
        silent: false
      });
    } catch(e){}
  }
};
function scheduleRoutineNotifs(){
  if (!notif.enabled()) return;
  const now = new Date();
  const curMin = now.getHours()*60 + now.getMinutes();
  const blocks = (typeof collectTimelineBlocks === 'function') ? collectTimelineBlocks() : [];
  const todayK = dateKey(now);
  const fired = S.get('notif_fired_'+todayK, {});
  const LEAD_MIN = 5; // notify N minutes before block start
  blocks.forEach(b => {
    const id = b.start + '|' + b.name.slice(0,30);
    const delta = b.start - curMin;
    if (delta >= 0 && delta <= LEAD_MIN && !fired[id]){
      const name = b.name.replace(/^[🌅🔥✨💪🎓💻🇳🇱🤖📚🥩🛍️♟️😴🌿🔧]\s*/, '').trim();
      notif.fire(
        (delta === 0 ? '🔥 Maintenant · ' : '⏱ Dans '+delta+' min · ') + name,
        b.desc ? b.desc.slice(0, 120) : ('Bloc planifié à '+minToStr(b.start)),
        id
      );
      fired[id] = Date.now();
      S.set('notif_fired_'+todayK, fired);
    }
  });
}
// Check every minute alongside clock tick (handled by master tick now)
// Also check immediately when tab regains focus
document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRoutineNotifs(); });
// First run after a short delay
setTimeout(scheduleRoutineNotifs, 2000);

// ─────────────────────────────────────────────────────────────
// SWIPE NAVIGATION — left/right on mobile switches tabs
// ─────────────────────────────────────────────────────────────
(function(){
  let x0 = null, y0 = null, t0 = 0, locked = false;
  const SWIPE_MIN_DX = 90;      // minimum horizontal travel (raised to avoid false triggers)
  const SWIPE_MAX_DY = 40;      // if vertical travel exceeds this, it's a scroll, abort (tightened)
  const SWIPE_MAX_DT = 400;     // must be faster than this
  const EDGE_IGNORE_ZONE = 24;  // iOS back-swipe area — ignore edge starts
  function getTabList(){
    return Array.from(document.querySelectorAll('.tab[data-tab]')).map(t => t.dataset.tab);
  }
  document.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    if (e.target.closest('.tabs, .tab-tabs, input, textarea, button, select, .shortcuts-help, .search-modal, .pomo-modal, .focus-mode, svg')) return;
    // Also exclude content areas where horizontal interaction is expected
    if (e.target.closest('.card, .tl-item, .prio-item, .timeline, .callout, .phase, [contenteditable], #trading-journal-host, .tj-form')) return;
    const t = e.touches[0];
    if (t.clientX < EDGE_IGNORE_ZONE) return;
    // Require touch to start in the upper portion of the screen (tab-level gesture area)
    // OR require that the element has no horizontally scrollable parent
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el) {
      let p = el;
      while (p && p !== document.body) {
        const st = window.getComputedStyle(p);
        if ((st.overflowX === 'auto' || st.overflowX === 'scroll') && p.scrollWidth > p.clientWidth + 2) { return; }
        p = p.parentElement;
      }
    }
    x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); locked = false;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (x0 === null || locked) return;
    const t = e.touches[0];
    const dy = Math.abs(t.clientY - y0);
    if (dy > SWIPE_MAX_DY){ x0 = null; locked = true; }
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (x0 === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - x0;
    const dy = Math.abs(t.clientY - y0);
    const dt = Date.now() - t0;
    x0 = null;
    if (dt > SWIPE_MAX_DT) return;
    if (dy > SWIPE_MAX_DY) return;
    if (Math.abs(dx) < SWIPE_MIN_DX) return;
    const tabs = getTabList();
    const active = document.querySelector('.tab.active')?.dataset.tab;
    const idx = tabs.indexOf(active);
    if (idx < 0) return;
    const nextIdx = dx > 0 ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= tabs.length) return;
    activateTab(tabs[nextIdx]);
    if (typeof hapticTap === 'function') hapticTap();
  }, { passive: true });
})();

// ─────────────────────────────────────────────────────────────
// GLOBAL KEYBOARD SHORTCUTS — "power user" navigation
// ─────────────────────────────────────────────────────────────
// Two-char Vim-style : 'g h' = go home, 'g s' = go stats, etc.
// Single-char: 'j/k' log day nav, 'p' pomo, 'n' new task, 'l' focus log, '?' cheatsheet.
// Ignored when user is typing in an input / textarea / contenteditable.
const KBD_TABS = { h:'home', s:'stats', r:'routine', w:'sport', f:'flex', x:'flex', n:'nutrition', e:'epfc', c:'code', i:'ia', v:'vinted', d:'nl', a:'chess', z:'finance', o:'social', p:'plan' };
let _kbdPending = null, _kbdPendingTimer = null;
function _isTyping(target){
  if (!target) return false;
  const tag = (target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return; // let browser handle Ctrl+K etc.
  if (_isTyping(e.target)) return;
  const key = e.key.toLowerCase();
  // Two-char sequence (g + letter)
  if (_kbdPending === 'g'){
    clearTimeout(_kbdPendingTimer); _kbdPending = null;
    if (KBD_TABS[key]){ e.preventDefault(); activateTab(KBD_TABS[key]); hapticTap(); }
    return;
  }
  if (key === 'g'){
    _kbdPending = 'g';
    _kbdPendingTimer = setTimeout(() => { _kbdPending = null; }, 1000);
    return;
  }
  // Single-char shortcuts
  if (key === '?'){ e.preventDefault(); toggleShortcutsHelp(); return; }
  if (key === 'p'){ e.preventDefault(); try { window.pomoOpen(); hapticTap(); } catch(_){}; return; }
  if (key === 'n'){
    e.preventDefault();
    const fab = document.getElementById('qa-fab');
    if (fab){ fab.click(); hapticTap(); }
    return;
  }
  if (key === 'l'){
    e.preventDefault();
    document.querySelector('.log-widget')?.scrollIntoView({behavior:'smooth', block:'start'});
    const firstInput = document.querySelector('[data-log-input="epfc"]');
    if (firstInput) setTimeout(() => firstInput.focus(), 400);
    return;
  }
  // j/k: log nav (when home tab active)
  if ((key === 'j' || key === 'k') && document.getElementById('p-home')?.classList.contains('active')){
    const dir = key === 'j' ? 'prev' : 'next';
    const btn = document.querySelector('[data-log-nav="'+dir+'"]');
    if (btn && !btn.disabled){ e.preventDefault(); btn.click(); hapticTap(); }
    return;
  }
  // Numeric 1-9: toggle priority N (when home active)
  if (/^[1-9]$/.test(key) && document.getElementById('p-home')?.classList.contains('active')){
    const idx = parseInt(key) - 1;
    const items = document.querySelectorAll('.prio-item');
    if (items[idx]){
      e.preventDefault();
      items[idx].click();
    }
    return;
  }
  if (key === 'escape'){
    // Close any open modal
    document.querySelectorAll('.search-modal.open, .pomo-modal.open, .focus-mode.open, .shortcuts-help.open').forEach(m => m.classList.remove('open'));
  }
});
// Shortcuts help overlay
function toggleShortcutsHelp(){
  let help = document.getElementById('shortcuts-help');
  if (!help){
    help = document.createElement('div');
    help.id = 'shortcuts-help';
    help.className = 'shortcuts-help';
    help.innerHTML = '<div class="sh-box">'+
      '<div class="sh-head"><span>Raccourcis clavier</span><button class="sh-close" aria-label="Fermer">✕</button></div>'+
      '<div class="sh-grid">'+
        '<div class="sh-sec">Navigation</div>'+
        '<div class="sh-row"><kbd>g</kbd> <kbd>h</kbd><span>Aujourd\'hui</span></div>'+
        '<div class="sh-row"><kbd>g</kbd> <kbd>s</kbd><span>Stats</span></div>'+
        '<div class="sh-row"><kbd>g</kbd> <kbd>r</kbd><span>Routine</span></div>'+
        '<div class="sh-row"><kbd>g</kbd> <kbd>w</kbd><span>Sport (work-out)</span></div>'+
        '<div class="sh-row"><kbd>g</kbd> <kbd>e</kbd><span>EPFC</span></div>'+
        '<div class="sh-row"><kbd>g</kbd> <kbd>c</kbd><span>Code</span></div>'+
        '<div class="sh-row"><kbd>g</kbd> <kbd>d</kbd><span>Néerlandais (Dutch)</span></div>'+
        '<div class="sh-row"><kbd>g</kbd> <kbd>v</kbd><span>Vinted</span></div>'+
        '<div class="sh-row"><kbd>g</kbd> <kbd>p</kbd><span>Plan</span></div>'+
        '<div class="sh-sec">Actions</div>'+
        '<div class="sh-row"><kbd>⌘</kbd><kbd>K</kbd><span>Recherche globale</span></div>'+
        '<div class="sh-row"><kbd>p</kbd><span>Ouvrir Pomodoro</span></div>'+
        '<div class="sh-row"><kbd>n</kbd><span>Nouvelle tâche rapide</span></div>'+
        '<div class="sh-row"><kbd>l</kbd><span>Focus sur le log du jour</span></div>'+
        '<div class="sh-row"><kbd>j</kbd> / <kbd>k</kbd><span>Jour précédent/suivant (log)</span></div>'+
        '<div class="sh-row"><kbd>1</kbd>…<kbd>9</kbd><span>Toggle priorité N</span></div>'+
        '<div class="sh-row"><kbd>?</kbd><span>Afficher/fermer cette aide</span></div>'+
        '<div class="sh-row"><kbd>Esc</kbd><span>Fermer n\'importe quelle modale</span></div>'+
      '</div></div>';
    document.body.appendChild(help);
    help.addEventListener('click', e => {
      if (e.target === help || e.target.closest('.sh-close')) help.classList.remove('open');
    });
  }
  help.classList.toggle('open');
}

// Global click delegation — replaces inline onclick handlers (CSP-friendly)
document.addEventListener('click', e => {
  const goEl = e.target.closest('[data-go]');
  if (goEl){ activateTab(goEl.dataset.go); return; }
  const actEl = e.target.closest('[data-action]');
  if (actEl){
    const act = actEl.dataset.action;
    if (act === 'pomo-open' && typeof window.pomoOpen === 'function') window.pomoOpen();
  }
});

// ============================================================
// NAV FADE
// ============================================================
const tabsEl = document.getElementById('tabs');
const tabsWrap = document.querySelector('.tabs-wrap');
function updateNavFade(){
  if (!tabsEl || !tabsWrap) return;
  const sl = tabsEl.scrollLeft, sw = tabsEl.scrollWidth, cw = tabsEl.clientWidth;
  if (sl <= 4) tabsWrap.dataset.scrolled = 'start';
  else if (sl + cw >= sw - 4) tabsWrap.dataset.scrolled = 'end';
  else tabsWrap.dataset.scrolled = 'mid';
}
if (tabsEl){ tabsEl.addEventListener('scroll', updateNavFade); setTimeout(updateNavFade, 50); }

// ============================================================
// SHIFT / DAY SWITCHERS
// ============================================================
const shiftChips = document.querySelectorAll('.shift-chip[data-shift]');
const shiftViews = document.querySelectorAll('.shift-view');
function activateShift(s, skipSave){
  shiftChips.forEach(c => c.classList.toggle('active', c.dataset.shift===s));
  shiftViews.forEach(v => {
    const match = v.id === ('view-'+s);
    v.classList.toggle('hidden', !match); v.hidden = !match;
  });
  if (!skipSave) {
    S.set('shift', s);
    // Only sync today's planner entry on user action, never on boot.
    updatePlannerForToday(s);
  }
  setTimeout(highlightNow, 30);
  setTimeout(applyWakeOffset, 30);
  setTimeout(() => { if (window.__naReady && typeof renderNextAction === 'function') renderNextAction(); }, 40);
}
shiftChips.forEach(c => c.addEventListener('click', () => {
  activateShift(c.dataset.shift);
  renderShiftPlanner();
}));
// On boot: prefer the planner entry for today over the stored generic shift
const _bootShift = (S.get('shift_plan', {}))[dateKey(new Date())] || S.get('shift', 'sm');
activateShift(_bootShift, true);

const dayBtns  = document.querySelectorAll('.wday[data-d]');
const dayViews = document.querySelectorAll('.day-view');
function activateDay(d){
  dayBtns.forEach(b => b.classList.toggle('active', b.dataset.d===d));
  dayViews.forEach(v => {
    const match = v.id === ('day-'+d);
    v.classList.toggle('hidden', !match); v.hidden = !match;
  });
  S.set('day', d);
}
dayBtns.forEach(b => b.addEventListener('click', () => activateDay(b.dataset.d)));
activateDay(S.get('day', 'd1'));

// ============================================================
// CLOCK
// ============================================================
function greeting(h){
  if (h<5) return 'Nuit calme';
  if (h<12) return 'Bonjour';
  if (h<18) return 'Bon après-midi';
  if (h<22) return 'Bonsoir';
  return 'Tard ce soir';
}
function fmtFullDate(d){ return DAYS_FR[d.getDay()]+' '+d.getDate()+' '+MONTHS_FR[d.getMonth()]+' '+d.getFullYear(); }
function tickClock(){
  const d = new Date();
  const hh = pad(d.getHours()), mm = pad(d.getMinutes()), ss = pad(d.getSeconds());
  setText('[data-clock]', hh+':'+mm);
  setText('[data-date]', fmtFullDate(d));
  setText('#now-clock', hh+':'+mm+':'+ss);
  setText('#hero-day', DAYS_FR[d.getDay()]);
  setText('#hero-dnum', d.getDate());
  setText('#hero-month', MONTHS_FR[d.getMonth()]);
  const sh = effectiveShiftForDate(new Date());
  // Greeting (no longer hardcodes "Mode Maladie" forever — only when sm is active)
  const g = document.getElementById('greeting');
  if (g){
    const isMaladie = sh === 'sm';
    g.textContent = greeting(d.getHours()) + (isMaladie ? ' · Mode Maladie' : '');
  }
  // Hero shift line — distinct phrasing for sm (mode) vs s1-s4 (shift) vs sw (weekend)
  const hs = document.getElementById('hero-shift-v');
  const hsLine = document.getElementById('hero-shift');
  if (hs){
    hs.textContent = SHIFT_NAMES_SHORT[sh] || sh;
  }
  if (hsLine){
    let prefix = 'Shift actif';
    if (sh === 'sm') prefix = 'Mode actuel';
    else if (sh === 'sw') prefix = 'Période';
    hsLine.firstChild && (hsLine.firstChild.textContent = prefix + ' : ');
  }
  // Brand-sub : real status (date + shift)
  const bsub = document.getElementById('brand-sub');
  if (bsub){
    bsub.classList.add('ready');
    const train = (typeof trainingForDate === 'function') ? trainingForDate(new Date()) : null;
    const trainTag = train ? (train.type === 'rest' ? '· Repos' : '· '+train.label.split(' ')[0]) : '';
    bsub.textContent = (SHIFT_NAMES_SHORT[sh] || sh) + ' ' + trainTag;
  }
  // highlightNow re-reads the timeline DOM — only run it when the minute changed, not every second
  const curMin = d.getHours()*60 + d.getMinutes();
  if (curMin !== _lastClockMin){
    _lastClockMin = curMin;
    highlightNow(d);
    // Next Action depends on const declarations (NA_SNOOZE_KEY etc.) that are
    // initialized lower in the file. Skip until they're ready to avoid TDZ errors.
    if (window.__naReady && typeof renderNextAction === 'function') renderNextAction();
  }
}
let _lastClockMin = -1;

// ============================================================
// TIMELINE AUTO-HIGHLIGHT (with wake offset support)
// ============================================================
function parseTimeMin(s){
  if (!s) return null;
  // Take only the first time-looking chunk (handles ranges like "5:45 – 7:10" and "6h00 - 7h30")
  const first = s.split(/[–\-—]/)[0];
  const a = first.match(/(\d{1,2})[:hH](\d{2})/);
  if (a) return parseInt(a[1])*60 + parseInt(a[2]);
  const b = first.match(/(\d{1,2})\s*h(?!\d)/);
  if (b) return parseInt(b[1])*60;
  return null;
}
function minToStr(m){
  // normalize to 0-1439
  let mm = ((m % 1440) + 1440) % 1440;
  return pad(Math.floor(mm/60))+'h'+pad(mm%60);
}
function highlightNow(dArg){
  const d = dArg || new Date();
  const curMin = d.getHours()*60 + d.getMinutes();
  const visible = document.querySelector('.shift-view:not(.hidden)');
  if (!visible){
    document.querySelectorAll('.tl-item.now').forEach(e => e.classList.remove('now'));
    setNowCard(null, null, null); return;
  }
  const items = Array.from(visible.querySelectorAll('.tl-item'));
  const times = items.map(it => parseTimeMin(it.querySelector('.tl-time')?.textContent || ''));
  let active = -1;
  for (let i = 0; i < times.length; i++){
    if (times[i] === null) continue;
    const next = times.slice(i+1).find(x => x !== null);
    if (times[i] <= curMin && (next === undefined || curMin < next)) active = i;
  }
  items.forEach((it, i) => it.classList.toggle('now', i === active));
  if (active >= 0){
    const t = items[active].querySelector('.tl-time')?.textContent || '';
    const title = items[active].querySelector('.tl-title')?.textContent
              || items[active].querySelector('.tl-content')?.firstChild?.textContent
              || items[active].querySelector('.tl-name')?.textContent
              || 'En cours';
    // Detect domain from .tl-dot class (study/code/nl/ai/read/sport/...)
    const dot = items[active].querySelector('.tl-dot');
    const dotClasses = dot ? Array.from(dot.classList).filter(c => c !== 'tl-dot') : [];
    setNowCard(t, title.trim().slice(0, 80), dotClasses[0] || null);
  } else setNowCard(null, null, null);
}
// Map .tl-dot class → bookmark key (BOOKMARK_DOMAINS keys)
const DOT_TO_BM = {
  study: 'epfc', code: 'code', nl: 'nl', ai: 'ia',
  read: 'read'
};
function setNowCard(time, title, domain){
  const nt = document.getElementById('now-title'), ns = document.getElementById('now-sub');
  if (!nt) return;
  if (title){ nt.textContent = title; if (ns) ns.textContent = time ? (time+' · bloc en cours') : 'bloc en cours'; }
  else { nt.textContent = 'Temps libre'; if (ns) ns.textContent = 'hors routine programmée'; }
  // Resume hint based on bookmark for current domain
  const resume = document.getElementById('now-resume');
  if (!resume) return;
  const bmKey = domain ? DOT_TO_BM[domain] : null;
  if (!bmKey){ resume.classList.add('hidden'); return; }
  const bm = (typeof loadBookmarks === 'function') ? loadBookmarks() : {};
  const entry = bm[bmKey];
  if (!entry || !entry.text){ resume.classList.add('hidden'); return; }
  const dom = (typeof BOOKMARK_DOMAINS !== 'undefined') ? BOOKMARK_DOMAINS.find(x => x.key === bmKey) : null;
  const label = dom ? dom.label : bmKey.toUpperCase();
  setText('#now-resume-domain', 'Reprendre · '+label);
  setText('#now-resume-text', entry.text);
  resume.classList.remove('hidden');
}
// ─────────────────────────────────────────────────────────────
// MASTER TICK — single interval driving all periodic refreshes
// Saves battery vs running 3 separate intervals.
// ─────────────────────────────────────────────────────────────
tickClock();
let _masterTickCount = 0;
/* Audit Apr 2026 : pausable en background. À la reprise, tickClock() est rappelé
   immédiatement (cf. visibility handler) donc l'horloge ne reste jamais désynchro. */
const _masterTickFn = () => {
  tickClock();                               // every second
  _masterTickCount++;
  if (_masterTickCount % 60 === 0){          // every 60s
    if (typeof scheduleRoutineNotifs === 'function') scheduleRoutineNotifs();
    if (typeof checkDayChange === 'function') checkDayChange();
  }
};
if (typeof window.__pausableInterval === 'function'){
  window.__pausableInterval(_masterTickFn, 1000, { onResume: tickClock });
} else {
  setInterval(_masterTickFn, 1000);
}

// ============================================================
// WAKE TIME OFFSET (dynamic routine)
// ============================================================
// On load, stamp every .tl-time with its original value in data-orig
function stampTimelineOriginals(){
  document.querySelectorAll('.shift-view .tl-item .tl-time').forEach(el => {
    if (!el.dataset.orig){
      el.dataset.orig = el.textContent.trim();
      const m = parseTimeMin(el.dataset.orig);
      if (m !== null) el.dataset.origMin = m;
    }
  });
}
stampTimelineOriginals();

function wakeKey(d){ return 'wake_'+dateKey(d); }
function loadWakeOffset(d){
  return S.get(wakeKey(d), null); // null or { time, offset, shift }
}
function currentOffsetForShift(shift){
  const w = loadWakeOffset(new Date());
  if (!w) return 0;
  if (w.shift && w.shift !== shift) return 0; // Offset was for different shift
  return w.offset || 0;
}
function applyWakeOffset(){
  const visible = document.querySelector('.shift-view:not(.hidden)');
  if (!visible) return;
  const shift = visible.id.replace('view-', '');
  const offset = currentOffsetForShift(shift);
  const info = document.getElementById('wake-info');
  const wakeBar = document.querySelector('.wake-bar');
  let wraps = false;
  let wrapItems = 0;
  document.querySelectorAll('.shift-view .tl-item .tl-time').forEach(el => {
    const orig = el.dataset.orig;
    if (!orig) return;
    const origMin = parseInt(el.dataset.origMin);
    if (isNaN(origMin)) { el.textContent = orig; return; }
    if (offset === 0){
      el.textContent = orig;
      el.dataset.shifted = 'false';
      el.dataset.wraps = 'false';
    } else {
      const shifted = origMin + offset;
      const itemWraps = (shifted >= 1440 || shifted < 0);
      if (itemWraps && el.closest('.tl-item') && el.closest('.shift-view').id === ('view-'+shift)){
        wraps = true; wrapItems++;
      }
      // Display: show "01h00 (J+1)" if next-day, "(J-1)" if prev-day, else normal.
      let displayBase = minToStr(shifted);
      let suffix = '';
      if (shifted >= 1440) suffix = ' (J+1)';
      else if (shifted < 0) suffix = ' (J-1)';
      el.textContent = displayBase + suffix;
      el.dataset.shifted = 'true';
      el.dataset.wraps = itemWraps ? 'true' : 'false';
    }
  });
  if (wakeBar) wakeBar.classList.toggle('wraps', wraps);
  if (info){
    info.classList.toggle('wraps', wraps);
    if (offset === 0){
      info.textContent = 'Entre ton heure de réveil et toute la routine se décale.';
      info.classList.remove('offset', 'wraps');
    } else if (wraps){
      const sign = offset > 0 ? '+' : '';
      info.textContent = '⚠️ Décalage '+sign+offset+' min · '+wrapItems+' bloc'+(wrapItems>1?'s':'')+' déborde'+(wrapItems>1?'nt':'')+' sur le jour suivant. Vérifie la cohérence (sommeil, repas).';
      info.classList.add('offset');
    } else {
      const sign = offset > 0 ? '+' : '';
      info.textContent = 'Décalage actif : '+sign+offset+' min · tous les horaires de ce shift sont ajustés.';
      info.classList.add('offset');
    }
  }
  // Pre-fill input with current wake value
  const input = document.getElementById('wake-input');
  if (input && !input.value){
    const w = loadWakeOffset(new Date());
    if (w && w.time) input.value = w.time;
    else {
      const def = SHIFT_WAKE[shift];
      if (def !== undefined) input.value = pad(Math.floor(def/60))+':'+pad(def%60);
    }
  }
  setTimeout(highlightNow, 30);
}
const wakeInput = document.getElementById('wake-input');
const wakeApply = document.getElementById('wake-apply');
const wakeReset = document.getElementById('wake-reset');
if (wakeApply) wakeApply.addEventListener('click', () => {
  const val = wakeInput.value; if (!val) return;
  const [hh, mm] = val.split(':').map(Number);
  const actualMin = hh*60 + mm;
  const visible = document.querySelector('.shift-view:not(.hidden)');
  if (!visible) return;
  const shift = visible.id.replace('view-', '');
  const defMin = SHIFT_WAKE[shift] || 510;
  const offset = actualMin - defMin;
  S.set(wakeKey(new Date()), { time: val, offset, shift });
  applyWakeOffset();
});
if (wakeReset) wakeReset.addEventListener('click', () => {
  S.del(wakeKey(new Date()));
  if (wakeInput) wakeInput.value = '';
  applyWakeOffset();
});
applyWakeOffset();

// ============================================================
// SHIFT PLANNER (week)
// ============================================================
function getPlannerShift(dk){
  const plan = S.get('shift_plan', {});
  return plan[dk] || null;
}
function setPlannerShift(dk, shift){
  const plan = S.get('shift_plan', {});
  if (shift) plan[dk] = shift; else delete plan[dk];
  S.set('shift_plan', plan);
}
function effectiveShiftForDate(d){
  const dk = dateKey(d);
  return getPlannerShift(dk) || S.get('shift', 'sm');
}
function updatePlannerForToday(shift){
  // When user changes shift directly via chips, also sync today's planner entry
  setPlannerShift(dateKey(new Date()), shift);
}
function renderShiftPlanner(){
  const wrap = document.getElementById('shift-planner');
  if (!wrap) return;
  wrap.innerHTML = '';
  const t = today();
  const dow = t.getDay();
  const start = addDays(t, dow === 0 ? -6 : 1 - dow);
  for (let i = 0; i < 7; i++){
    const d = addDays(start, i);
    const dk = dateKey(d);
    const isToday = dk === dateKey(new Date());
    const current = getPlannerShift(dk) || (isToday ? S.get('shift','sm') : '');
    const cell = document.createElement('div');
    cell.className = 'sp-day' + (isToday ? ' today' : '');
    cell.innerHTML =
      '<div class="sp-dow">'+DAYS_MIN[d.getDay()]+'</div>'+
      '<div class="sp-dnum">'+d.getDate()+'</div>'+
      '<select data-day="'+dk+'">'+
      '<option value="">—</option>'+
      '<option value="sm"'+(current==='sm'?' selected':'')+'>🏥 Mal.</option>'+
      '<option value="s1"'+(current==='s1'?' selected':'')+'>S1 5h30</option>'+
      '<option value="s2"'+(current==='s2'?' selected':'')+'>S2 7h</option>'+
      '<option value="s3"'+(current==='s3'?' selected':'')+'>S3 11h</option>'+
      '<option value="s4"'+(current==='s4'?' selected':'')+'>S4 13h30</option>'+
      '<option value="sw"'+(current==='sw'?' selected':'')+'>WE</option>'+
      '</select>';
    wrap.appendChild(cell);
  }
  wrap.querySelectorAll('select[data-day]').forEach(sel => {
    sel.addEventListener('change', () => {
      setPlannerShift(sel.dataset.day, sel.value);
      // If user changed today, switch shift tab
      if (sel.dataset.day === dateKey(new Date()) && sel.value){
        activateShift(sel.value);
      }
    });
  });
}
renderShiftPlanner();

// ============================================================
// TRAINING CYCLE DISPLAY
// ============================================================
function renderTrainingHome(){
  const t = trainingForDate(new Date());
  const box = document.getElementById('training-status');
  if (box) box.classList.toggle('rest', t.type === 'rest');
  const lbl = document.getElementById('training-label');
  const title = document.getElementById('training-title');
  const desc = document.getElementById('training-desc');
  const cta = document.getElementById('training-cta');
  if (lbl) lbl.textContent = t.type === 'rest' ? '💜 Jour de repos' : '🔥 Jour d\'entraînement';
  if (title) title.innerHTML = t.type === 'rest' ? 'Aujourd\'hui · <em>repos</em>' : 'Aujourd\'hui · <em>'+t.label.toLowerCase()+'</em>';
  if (desc) desc.textContent = t.desc;
  if (cta) cta.textContent = t.type === 'rest' ? 'Voir routine repos →' : 'Voir la séance →';
  renderTrainingWeek('training-week');
}
function renderTrainingSport(){
  const t = trainingForDate(new Date());
  const box = document.getElementById('training-status-sport');
  if (box) box.classList.toggle('rest', t.type === 'rest');
  const lbl = document.getElementById('training-label-sport');
  const title = document.getElementById('training-title-sport');
  const desc = document.getElementById('training-desc-sport');
  if (lbl) lbl.textContent = t.type === 'rest' ? '💜 Repos' : '🔥 Séance du jour';
  if (title) title.innerHTML = t.type === 'rest' ? '<em>Repos</em> actif' : t.label;
  if (desc) desc.textContent = t.desc;
  activateDay(t.target);
  renderTrainingWeek('training-week-sport');
  renderFullCycleStrip();
}
function renderFullCycleStrip(){
  const host = document.getElementById('training-cycle-full');
  if (!host) return;
  host.innerHTML = '';
  const label = document.createElement('div');
  label.style.cssText = 'font:700 9.5px var(--f-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--text-faint);margin-bottom:6px';
  label.textContent = 'Cycle complet · 9 jours';
  host.appendChild(label);
  const strip = document.createElement('div');
  strip.className = 'cycle-strip';
  const t0 = today();
  const anchor = getTrainingAnchor();
  const todayIdx = ((dateDiffDays(t0, anchor) % 9) + 9) % 9;
  TRAINING_SEQ.forEach((item, idx) => {
    const it = document.createElement('div');
    it.className = 'cycle-strip-item ' + (item.type === 'rest' ? 'rest' : 'train') + (idx === todayIdx ? ' today' : '');
    // Relative day: how many days ahead/behind from today
    // If idx >= todayIdx: days = idx - todayIdx
    // else: days = idx - todayIdx + 9 (future cycle iteration)
    const offset = idx >= todayIdx ? idx - todayIdx : idx - todayIdx + 9;
    let when = '';
    if (offset === 0) when = 'AUJ';
    else if (offset === 1) when = 'DEM';
    else when = 'J+'+offset;
    const shortLabel = item.type === 'rest' ? 'Repos' :
                       item.type.startsWith('push') ? 'Push '+item.type.slice(-1) :
                       item.type.startsWith('pull') ? 'Pull '+item.type.slice(-1) :
                       item.type.startsWith('legs') ? 'Legs '+item.type.slice(-1) : item.type;
    it.innerHTML = shortLabel + '<span class="cs-when">'+when+'</span>';
    strip.appendChild(it);
  });
  host.appendChild(strip);
}
// Wire the reset-cycle buttons
document.querySelectorAll('[data-reset-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.resetType;
    resetCycleTo(type);
    renderTrainingHome();
    renderTrainingSport();
    const label = TRAINING_SEQ.find(x => x.type === type)?.label || type;
    showToast('Cycle réinitialisé · aujourd\'hui = '+label);
  });
});
function renderTrainingWeek(containerId){
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';
  const t = today();
  const dow = t.getDay();
  const start = addDays(t, dow === 0 ? -6 : 1 - dow);
  for (let i = 0; i < 7; i++){
    const d = addDays(start, i);
    const info = trainingForDate(d);
    const isToday = dateKey(d) === dateKey(new Date());
    const div = document.createElement('div');
    div.className = 'tw-day '+(info.type === 'rest' ? 'rest' : 'train') + (isToday ? ' today' : '');
    const shortLabel = info.type === 'rest' ? 'Repos' :
                       info.type.startsWith('push') ? 'Push '+info.type.slice(-1) :
                       info.type.startsWith('pull') ? 'Pull '+info.type.slice(-1) :
                       info.type.startsWith('legs') ? 'Legs '+info.type.slice(-1) : info.type;
    div.innerHTML =
      '<div class="tw-dow">'+DAYS_MIN[d.getDay()]+'</div>'+
      '<span class="tw-icon">'+(info.type === 'rest' ? '😴' : '💪')+'</span>'+
      '<div class="tw-label">'+shortLabel+'</div>';
    wrap.appendChild(div);
  }
}
renderTrainingHome();

// ============================================================
// NEXT ACTION — le module le plus important de la Home
// ============================================================
// Computes: what block is current or next, countdown, domain, and exposes
// actions (start focus, snooze, skip). Re-renders every minute + on shift change.
const NA_DOMAIN_META = {
  study:    { icon:'🎓', label:'EPFC',      tab:'epfc',      color:'flame' },
  code:     { icon:'💻', label:'Code',      tab:'code',      color:'violet' },
  nl:       { icon:'🇳🇱', label:'Néerlandais', tab:'nl',    color:'sapphire' },
  ai:       { icon:'🤖', label:'IA',        tab:'ia',        color:'violet' },
  read:     { icon:'📚', label:'Lecture',   tab:'home',      color:'pink' },
  sport:    { icon:'💪', label:'Sport',     tab:'sport',     color:'flame' },
  flex:     { icon:'🧘', label:'Souplesse', tab:'flex',      color:'violet' },
  food:     { icon:'🥩', label:'Repas',     tab:'nutrition', color:'amber' },
  vinted:   { icon:'🛍️', label:'Vinted',    tab:'vinted',    color:'jade' },
  hygiene:  { icon:'✨', label:'Hygiène',   tab:'routine',   color:'cyan' },
  sleep:    { icon:'😴', label:'Sommeil',   tab:'routine',   color:'violet' },
  work:     { icon:'🔧', label:'Travail',   tab:'routine',   color:'amber' },
  rest:     { icon:'🌿', label:'Pause',     tab:'routine',   color:'teal' },
  chess:    { icon:'♟️', label:'Échecs',    tab:'chess',     color:'sapphire' }
};
const NA_SKIP_KEY   = () => 'na_skipped_'+dateKey(new Date());
const NA_SNOOZE_KEY = () => 'na_snooze_'+dateKey(new Date());
function parseBlockRange(timeText){
  if (!timeText) return null;
  const parts = timeText.split(/[–\-—]/).map(s => s.trim());
  const start = parseTimeMin(parts[0]);
  if (start === null) return null;
  let end = parts[1] ? parseTimeMin(parts[1]) : null;
  if (end === null) end = start + 30;
  if (end < start) end += 1440;
  return { start, end };
}
function collectTimelineBlocks(){
  const visible = document.querySelector('.shift-view:not(.hidden)');
  if (!visible) return [];
  const items = Array.from(visible.querySelectorAll('.tl-item'));
  const out = [];
  items.forEach(it => {
    const timeText = it.querySelector('.tl-time')?.textContent || '';
    const range = parseBlockRange(timeText);
    if (!range) return;
    const name = (it.querySelector('.tl-name')?.textContent || '').trim();
    const desc = (it.querySelector('.tl-desc')?.textContent || '').trim();
    const dot = it.querySelector('.tl-dot');
    const dotClasses = dot ? Array.from(dot.classList).filter(c => c !== 'tl-dot') : [];
    const type = dotClasses[0] || null;
    out.push({ el: it, type, name, desc, start: range.start, end: range.end });
  });
  out.sort((a, b) => a.start - b.start);
  return out;
}
function findCurrentOrNextBlock(curMin, blocks){
  const snoozeMap = S.get(NA_SNOOZE_KEY(), {});
  const skipped   = new Set(S.get(NA_SKIP_KEY(), []));
  for (const b of blocks){
    const id = b.start + '|' + b.name.slice(0,30);
    if (skipped.has(id)) continue;
    const snoozed = snoozeMap[id] || 0;
    const eff = Object.assign({}, b, { start: b.start + snoozed, end: b.end + snoozed });
    if (curMin >= eff.start && curMin < eff.end) return { block: eff, state: 'current', id };
    if (curMin < eff.start) return { block: eff, state: 'upcoming', id };
  }
  return null;
}
function fmtCountdown(min){
  if (min <= 0) return 'maintenant';
  if (min < 60) return 'dans '+min+' min';
  const h = Math.floor(min/60), m = min%60;
  return 'dans '+h+'h'+(m ? ' '+m+'min' : '');
}
function renderNextAction(){
  const host = document.getElementById('next-action');
  if (!host) return;
  const titleEl = document.getElementById('na-title');
  const subEl   = document.getElementById('na-sub');
  const cdEl    = document.getElementById('na-countdown');
  const lblEl   = document.getElementById('na-label');
  const startBtn= document.getElementById('na-start');
  const snoozeBtn=document.getElementById('na-snooze');
  const skipBtn = document.getElementById('na-skip');
  if (!titleEl || !subEl || !cdEl || !lblEl || !startBtn || !snoozeBtn || !skipBtn) return;

  const now = new Date();
  const curMin = now.getHours()*60 + now.getMinutes();
  const blocks = collectTimelineBlocks();
  const found = findCurrentOrNextBlock(curMin, blocks);

  host.classList.remove('rest', 'idle');

  if (!found){
    host.classList.add('idle');
    titleEl.innerHTML = 'Journée <em>terminée</em>';
    subEl.textContent = 'Plus de blocs programmés. Bonne nuit — pense à logger ta journée.';
    cdEl.textContent = '✓';
    cdEl.classList.remove('live');
    lblEl.textContent = 'Soir';
    startBtn.textContent = 'Loguer ma journée';
    startBtn.dataset.action = 'na-log';
    snoozeBtn.disabled = true;
    skipBtn.disabled = true;
    host.dataset.blockId = '';
    return;
  }

  const { block, state, id } = found;
  host.dataset.blockId = id;
  const meta = NA_DOMAIN_META[block.type] || { icon:'📌', label:'Bloc', tab:'routine' };
  const cleanName = block.name.replace(/^[🌅🔥✨💪🎓💻🇳🇱🤖📚🥩🛍️♟️😴🌿🔧]\s*/, '').trim();
  const isRest = block.type === 'rest';
  if (isRest) host.classList.add('rest');

  if (state === 'current'){
    lblEl.textContent = 'En cours';
    cdEl.classList.add('live');
    const minsLeft = block.end - curMin;
    cdEl.textContent = minsLeft + ' min restantes';
    titleEl.innerHTML = meta.icon + ' ' + escapeHtml(cleanName);
  } else {
    lblEl.textContent = 'Prochaine action';
    cdEl.classList.remove('live');
    const minsTo = block.start - curMin;
    cdEl.textContent = fmtCountdown(minsTo);
    titleEl.innerHTML = meta.icon + ' ' + escapeHtml(cleanName);
  }
  subEl.textContent = block.desc || ('Bloc '+meta.label.toLowerCase()+' · '+minToStr(block.start)+'–'+minToStr(block.end));

  startBtn.textContent = isRest ? 'Voir la pause' : 'Démarrer focus';
  startBtn.dataset.action = 'na-start';
  startBtn.dataset.tab = meta.tab;
  startBtn.dataset.domain = block.type || '';
  snoozeBtn.disabled = false;
  skipBtn.disabled = false;
}
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action^="na-"]');
  if (!btn) return;
  const host = document.getElementById('next-action');
  const id = host && host.dataset.blockId;
  const action = btn.dataset.action;
  if (action === 'na-start'){
    const tab = btn.dataset.tab || 'routine';
    const domain = btn.dataset.domain;
    activateTab(tab);
    if (typeof window.pomoOpen === 'function' && domain){
      const tagMap = { study:'epfc', code:'code', nl:'nl', ai:'ia', read:'read', vinted:'vinted' };
      const tag = tagMap[domain];
      if (tag && typeof pomoState !== 'undefined'){
        pomoState.tag = tag;
        S.set('pomo_last_tag', tag);
        try { renderPomoTag(); } catch(_){}
      }
    }
    if (typeof hapticTap === 'function') hapticTap();
  } else if (action === 'na-snooze' && id){
    const map = S.get(NA_SNOOZE_KEY(), {});
    map[id] = (map[id] || 0) + 15;
    S.set(NA_SNOOZE_KEY(), map);
    try { showToast('Bloc reporté de 15 min'); } catch(_){}
    renderNextAction();
  } else if (action === 'na-skip' && id){
    const arr = S.get(NA_SKIP_KEY(), []);
    if (!arr.includes(id)){ arr.push(id); S.set(NA_SKIP_KEY(), arr); }
    try { showToast('Bloc skippé pour aujourd\'hui', () => {
      const back = S.get(NA_SKIP_KEY(), []).filter(x => x !== id);
      S.set(NA_SKIP_KEY(), back);
      renderNextAction();
    }); } catch(_){}
    renderNextAction();
  } else if (action === 'na-log'){
    document.querySelector('.log-widget')?.scrollIntoView({behavior:'smooth', block:'center'});
  }
});
// Next Action's const dependencies are now defined — safe to render.
window.__naReady = true;
renderNextAction();

// ============================================================
// PRIORITIES (dynamic, editable, add/delete)
// ============================================================
const DEFAULT_PRIOS = [
  { id:'p1', text:"🔥 Shot Feu Intérieur à jeun + 500ml d'eau", tag:'Matin' },
  { id:'p2', text:"💪 Sport ou stretch (selon le jour)", tag:'Corps' },
  { id:'p3', text:"🎓 Bloc EPFC + 💻 20min coding", tag:'Cerveau' },
  { id:'p4', text:"🇳🇱 30 min néerlandais (Anki + étude)", tag:'Langue' },
  { id:'p5', text:"📚 25 min lecture + 📓 journal 3 wins", tag:'Soir' },
  { id:'p6', text:"🥩 6 repas · 3L eau · 180g protéines", tag:'Fuel' }
];
function loadPrioList(){
  const stored = S.get('prio_list', null);
  if (stored && Array.isArray(stored) && stored.length) return stored;
  return DEFAULT_PRIOS.slice();
}
function savePrioList(list){ S.set('prio_list', list); }
function loadPrioState(key){ return S.get('prio_'+key, {}); }
function savePrioState(key, st){
  // If empty object, delete to keep storage clean
  if (!st || Object.keys(st).length === 0) S.del('prio_'+key);
  else S.set('prio_'+key, st);
}
function renderPrios(){
  const wrap = document.getElementById('prio-list');
  if (!wrap) return;
  wrap.classList.add('ready'); // hydrate
  const list = loadPrioList();
  const st = loadPrioState(dateKey(new Date()));
  wrap.innerHTML = '';
  if (list.length === 0){
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:14px;color:var(--text-faint);font-style:italic;text-align:center;border:1px dashed var(--border);border-radius:10px;font-size:12px';
    empty.textContent = 'Aucune priorité — ajoute-en une ci-dessous pour commencer.';
    wrap.appendChild(empty);
    updatePrioStats();
    return;
  }
  list.forEach(p => {
    const el = document.createElement('div');
    el.className = 'prio-item' + (st[p.id] ? ' done' : '');
    el.dataset.p = p.id;
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-pressed', st[p.id] ? 'true' : 'false');
    el.innerHTML =
      '<div class="prio-check">✓</div>'+
      '<div class="prio-text" data-act="edit" title="Clic pour éditer">'+escapeHtml(p.text)+'</div>'+
      (p.tag ? '<div class="prio-tag">'+escapeHtml(p.tag)+'</div>' : '')+
      '<button class="prio-del" data-act="del" aria-label="Supprimer">✕</button>';
    wrap.appendChild(el);

    // Toggle done (click on the row, but not on the editable text or delete)
    el.addEventListener('click', e => {
      if (e.target.closest('[data-act="edit"]') || e.target.closest('[data-act="del"]')) return;
      const cur = loadPrioState(dateKey(new Date()));
      const prev = cur[p.id];
      cur[p.id] = !el.classList.contains('done');
      el.classList.toggle('done', cur[p.id]);
      el.setAttribute('aria-pressed', cur[p.id] ? 'true' : 'false');
      savePrioState(dateKey(new Date()), cur);
      updatePrioStats(); updateStreak();
      hapticTap();
      pushUndo('Priorité "' + p.text.slice(0, 30) + '"', () => {
        const back = loadPrioState(dateKey(new Date()));
        if (prev === undefined) delete back[p.id]; else back[p.id] = prev;
        savePrioState(dateKey(new Date()), back);
        renderPrios(); updateStreak();
      });
    });
    el.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.isContentEditable){
        e.preventDefault(); el.click();
      }
    });

    // Edit text
    const txt = el.querySelector('[data-act="edit"]');
    txt.addEventListener('click', e => {
      e.stopPropagation();
      if (txt.contentEditable === 'true') return;
      txt.contentEditable = 'true'; txt.focus();
      const r = document.createRange(); r.selectNodeContents(txt);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    });
    txt.addEventListener('blur', () => {
      txt.contentEditable = 'false';
      const newVal = txt.textContent.trim();
      if (!newVal){ // empty = delete
        const remaining = loadPrioList().filter(x => x.id !== p.id);
        savePrioList(remaining);
        const stCur = loadPrioState(dateKey(new Date()));
        delete stCur[p.id]; savePrioState(dateKey(new Date()), stCur);
        renderPrios();
        return;
      }
      const cur = loadPrioList();
      const target = cur.find(x => x.id === p.id);
      if (target && target.text !== newVal){
        target.text = newVal; savePrioList(cur);
      }
    });
    txt.addEventListener('keydown', e => {
      if (e.key === 'Enter'){ e.preventDefault(); txt.blur(); }
      if (e.key === 'Escape'){ e.preventDefault(); txt.textContent = p.text; txt.blur(); }
    });

    // Delete
    el.querySelector('[data-act="del"]').addEventListener('click', e => {
      e.stopPropagation();
      const remaining = loadPrioList().filter(x => x.id !== p.id);
      savePrioList(remaining);
      const stCur = loadPrioState(dateKey(new Date()));
      delete stCur[p.id]; savePrioState(dateKey(new Date()), stCur);
      renderPrios(); updateStreak();
      showToast('Priorité supprimée', () => {
        const back = loadPrioList(); back.push(p); savePrioList(back); renderPrios();
      });
    });
    // Drag handle for reordering
    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', e => {
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', p.id);
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      wrap.querySelectorAll('.prio-item.drag-over').forEach(x => x.classList.remove('drag-over'));
    });
    el.addEventListener('dragover', e => {
      e.preventDefault();
      const dragging = wrap.querySelector('.prio-item.dragging');
      if (!dragging || dragging === el) return;
      const rect = el.getBoundingClientRect();
      const above = e.clientY < rect.top + rect.height/2;
      wrap.querySelectorAll('.prio-item.drag-over').forEach(x => x.classList.remove('drag-over'));
      el.classList.add('drag-over');
      el.dataset.dragPos = above ? 'above' : 'below';
    });
    el.addEventListener('drop', e => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('text/plain');
      if (!sourceId || sourceId === p.id) return;
      const list = loadPrioList();
      const fromIdx = list.findIndex(x => x.id === sourceId);
      const toIdx = list.findIndex(x => x.id === p.id);
      if (fromIdx < 0 || toIdx < 0) return;
      const [moved] = list.splice(fromIdx, 1);
      const insertAt = el.dataset.dragPos === 'above' ? (toIdx > fromIdx ? toIdx - 1 : toIdx) : (toIdx > fromIdx ? toIdx : toIdx + 1);
      list.splice(insertAt, 0, moved);
      savePrioList(list);
      renderPrios();
      try { hapticTap(); } catch(_){}
    });
  });
  updatePrioStats();
}
function updatePrioStats(){
  const list = loadPrioList();
  const st = loadPrioState(dateKey(new Date()));
  // Filter state to only count current ids (orphan keys ignored)
  const ids = new Set(list.map(x => x.id));
  const done = Object.entries(st).filter(([k, v]) => v && ids.has(k)).length;
  setText('#st-done', done);
  setText('#st-total', list.length);
}
const prioNewInput = document.getElementById('prio-new-input');
const prioNewBtn = document.getElementById('prio-new-btn');
function addPrio(){
  if (!prioNewInput) return;
  const v = prioNewInput.value.trim();
  if (!v){ prioNewInput.focus(); return; }
  const list = loadPrioList();
  list.push({ id:'p_'+Date.now()+'_'+Math.random().toString(36).slice(2,5), text:v, tag:'' });
  savePrioList(list);
  prioNewInput.value = '';
  renderPrios();
  prioNewInput.focus();
}
if (prioNewBtn) prioNewBtn.addEventListener('click', addPrio);
if (prioNewInput) prioNewInput.addEventListener('keydown', e => {
  if (e.key === 'Enter'){ e.preventDefault(); addPrio(); }
});

// Per-domain streak predicates — extend freely
const DOMAIN_STREAKS = [
  { key:'study', label:'Étude', icon:'🎓', test: log => log && ((log.epfc||0)+(log.code||0)+(log.nl||0)) >= 30 },
  { key:'sport', label:'Sport', icon:'💪', test: log => log && !!log.sport },
  { key:'flex',  label:'Souplesse', icon:'🧘', test: log => log && !!log.flex },
  { key:'code',  label:'Code',  icon:'💻', test: log => log && (log.code||0) >= 15 },
  { key:'nl',    label:'NL',    icon:'🇳🇱', test: log => log && (log.nl||0) >= 15 }
];
function beforeStart(d){ return d < CFG.START_DATE; }
// Count consecutive days (walking back from today) that pass `test`. Today doesn't break the chain.
function computeDomainStreak(test){
  const todayMid = today();
  if (beforeStart(todayMid)) return 0;
  let streak = 0;
  for (let i = 0; i < 365; i++){
    const dt = addDays(todayMid, -i);
    if (beforeStart(dt)) break;
    const log = S.get('log_'+dateKey(dt), null);
    if (test(log)) streak++;
    else if (i === 0) continue; // today incomplete = don't break
    else break;
  }
  return streak;
}
function updateStreak(){
  const todayMid = today();
  // Before the start date, nothing counts yet — show a friendly placeholder.
  if (beforeStart(todayMid)){
    setText('#st-streak', 0);
    const el = document.getElementById('st-streak');
    if (el){
      const parent = el.parentElement;
      const lbl = parent && parent.querySelector('.stat-l');
      if (lbl && !lbl.dataset.startHinted){
        lbl.dataset.startHinted = '1';
        lbl.textContent = 'Démarre le '+CFG.START_DATE.getDate()+' '+MONTHS_FR[CFG.START_DATE.getMonth()];
      }
    }
    renderDomainStreaks();
    if (typeof renderFreezeBadge === 'function') renderFreezeBadge();
    return;
  }
  let streak = 0;
  let usedFreeze = false;
  let freezeJustConsumed = false;
  const freezeLog = S.get('freeze_log', {});
  let freezeLogDirty = false;
  // Snapshot of priorities valid today (so a deleted prio doesn't ghost-block the streak)
  const validIds = new Set(loadPrioList().map(x => x.id));
  for (let i = 0; i < 365; i++){
    const dt = addDays(todayMid, -i);
    if (beforeStart(dt)) break;
    const k = dateKey(dt);
    const prio = S.get('prio_'+k, null), log = S.get('log_'+k, null);
    let ok = false;
    if (prio){
      const doneCount = Object.entries(prio).filter(([id, v]) => v && validIds.has(id)).length;
      if (doneCount >= 4) ok = true;
    }
    if (log){
      const tot = (log.epfc||0)+(log.code||0)+(log.nl||0);
      if (tot >= 60 || log.sport || log.flex) ok = true;
    }
    if (!ok){
      if (i === 0) continue; // today not done yet — don't break
      if (freezeLog[k]){ streak++; usedFreeze = true; continue; }
      if (!usedFreeze && i === 1 && typeof ensureStreakFreezes === 'function'){
        const f = ensureStreakFreezes();
        if (f.available > 0){
          consumeFreeze();
          freezeLog[k] = true;
          freezeLogDirty = true;
          freezeJustConsumed = true;
          streak++; usedFreeze = true; continue;
        }
      }
      break;
    }
    streak++;
  }
  if (freezeLogDirty) S.set('freeze_log', freezeLog);
  setText('#st-streak', streak);
  const best = S.get('best_streak', 0);
  if (streak > best) S.set('best_streak', streak);
  renderDomainStreaks();
  if (typeof renderFreezeBadge === 'function') renderFreezeBadge();
  // Notify the user when a freeze was just auto-consumed
  if (freezeJustConsumed){
    const lastNotif = S.get('freeze_notif_last', '');
    const todayK = dateKey(todayMid);
    if (lastNotif !== todayK){
      S.set('freeze_notif_last', todayK);
      try { showToast('❄️ Jeton de streak utilisé hier — ton streak est sauvé.', null, 'freeze'); } catch(e){}
    }
  }
}
function renderDomainStreaks(){
  const host = document.getElementById('domain-streaks');
  if (!host) return;
  if (beforeStart(today())){
    host.innerHTML = '<span class="ds-placeholder">Les streaks démarrent le '+CFG.START_DATE.getDate()+' '+MONTHS_FR[CFG.START_DATE.getMonth()]+'.</span>';
    return;
  }
  host.innerHTML = '';
  DOMAIN_STREAKS.forEach(d => {
    const n = computeDomainStreak(d.test);
    const chip = document.createElement('div');
    chip.className = 'ds-chip' + (n >= 7 ? ' hot' : n > 0 ? ' on' : '');
    chip.title = d.label+' · '+n+' jour'+(n>1?'s':'')+' consécutif'+(n>1?'s':'');
    chip.innerHTML = '<span class="ds-icon">'+d.icon+'</span><span class="ds-n">'+n+'</span><span class="ds-l">'+d.label+'</span>';
    host.appendChild(chip);
  });
}
renderPrios(); updateStreak();

// ============================================================
// DAILY LOG
// ============================================================
let currentLogDate = today();
const logInputs  = document.querySelectorAll('[data-log-input]');
const logToggles = document.querySelectorAll('[data-log-toggle]');
const moodBtns   = document.querySelectorAll('.log-mood-btn');
const notesEl    = document.getElementById('log-notes');
const topicEl    = document.getElementById('log-topic');
const statusEl   = document.getElementById('log-status');
const gratEls    = [document.getElementById('grat-1'), document.getElementById('grat-2'), document.getElementById('grat-3')];

function emptyLog(){ return { epfc:0, code:0, nl:0, anki:0, read:0, chess:0, vinted:0, sport:false, flex:false, mood:0, notes:'', wins:['','',''], meals:{}, supp:{}, topic:'' }; }
function loadLog(d){ const v = S.get('log_'+dateKey(d), null); return v ? Object.assign(emptyLog(), v) : emptyLog(); }
function saveLog(d, data){
  const k = 'log_'+dateKey(d);
  const hasMeals = data.meals && Object.values(data.meals).some(Boolean);
  const hasSupp = data.supp && Object.values(data.supp).some(Boolean);
  const hasAny = data.epfc||data.code||data.nl||data.anki||data.read||data.chess||data.vinted
               ||data.sport||data.flex||data.mood||data.notes||data.topic
               ||(data.wins||[]).some(w => (w||'').trim())
               ||hasMeals||hasSupp;
  if (!hasAny) S.del(k); else S.set(k, data);
}
function renderLogNav(){
  const dow = document.getElementById('log-dow');
  const dnum = document.getElementById('log-day');
  const badge = document.getElementById('log-today-badge');
  if (!dow) return;
  dow.textContent = DAYS_FR[currentLogDate.getDay()];
  dnum.textContent = currentLogDate.getDate()+' '+MONTHS_FR[currentLogDate.getMonth()];
  const isToday = dateKey(currentLogDate) === dateKey(new Date());
  badge.style.display = 'inline-block';
  if (isToday){ badge.textContent = 'AUJOURD\'HUI'; badge.style.color = ''; badge.style.background = ''; }
  else {
    const dy = dateDiffDays(today(), currentLogDate);
    badge.textContent = dy > 0 ? 'IL Y A '+dy+' JOUR'+(dy>1?'S':'') : 'FUTUR';
    badge.style.color = 'var(--text-faint)';
    badge.style.background = 'rgba(107,107,133,.12)';
  }
  const nextBtn = document.querySelector('[data-log-nav="next"]');
  if (nextBtn) nextBtn.disabled = isToday;
  const prevBtn = document.querySelector('[data-log-nav="prev"]');
  if (prevBtn) prevBtn.disabled = dateDiffDays(today(), currentLogDate) >= 90;
}
function renderLogForm(){
  const data = loadLog(currentLogDate);
  logInputs.forEach(inp => {
    const key = inp.dataset.logInput;
    inp.value = data[key] || '';
    const row = inp.closest('.log-row');
    if (row) row.classList.toggle('filled', !!data[key]);
  });
  logToggles.forEach(row => {
    const key = row.dataset.logToggle;
    row.classList.toggle('checked', !!data[key]);
  });
  moodBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.mood) === data.mood));
  if (notesEl) notesEl.value = data.notes || '';
  if (topicEl) topicEl.value = data.topic || '';
  gratEls.forEach((el, i) => { if (el) el.value = (data.wins && data.wins[i]) || ''; });
  // Meal chips
  const meals = data.meals || {};
  const supp = data.supp || {};
  document.querySelectorAll('.meal-chip[data-meal]').forEach(chip => {
    const k = chip.dataset.meal;
    const isSupp = chip.classList.contains('supp');
    const src = isSupp ? supp : meals;
    chip.classList.toggle('on', !!src[k]);
  });
  if (statusEl){ statusEl.textContent = '—'; statusEl.classList.remove('saved'); }
}
function collectLogForm(){
  const data = emptyLog();
  logInputs.forEach(inp => { data[inp.dataset.logInput] = parseInt(inp.value) || 0; });
  logToggles.forEach(row => { data[row.dataset.logToggle] = row.classList.contains('checked'); });
  const active = document.querySelector('.log-mood-btn.active');
  data.mood = active ? parseInt(active.dataset.mood) : 0;
  if (notesEl) data.notes = notesEl.value.trim();
  if (topicEl) data.topic = topicEl.value.trim();
  data.wins = gratEls.map(el => el ? el.value.trim() : '');
  // Meal chips
  data.meals = {}; data.supp = {};
  document.querySelectorAll('.meal-chip[data-meal]').forEach(chip => {
    const k = chip.dataset.meal;
    const isSupp = chip.classList.contains('supp');
    const bucket = isSupp ? data.supp : data.meals;
    if (chip.classList.contains('on')) bucket[k] = true;
  });
  return data;
}
let saveTimer = null;
function scheduleAutoSave(){
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveLog(currentLogDate, collectLogForm());
    if (statusEl){ statusEl.textContent = '✓ Sauvegardé automatiquement'; statusEl.classList.add('saved'); }
    refreshDerived();
  }, CFG.AUTOSAVE_MS);
}
logInputs.forEach(inp => {
  inp.addEventListener('input', () => {
    const row = inp.closest('.log-row');
    if (row) row.classList.toggle('filled', !!parseInt(inp.value));
    scheduleAutoSave();
  });
});
logToggles.forEach(row => {
  row.addEventListener('click', e => {
    if (e.target.closest('.log-input')) return;
    row.classList.toggle('checked');
    scheduleAutoSave();
  });
});
moodBtns.forEach(b => {
  b.addEventListener('click', () => {
    const already = b.classList.contains('active');
    moodBtns.forEach(x => x.classList.remove('active'));
    if (!already) b.classList.add('active');
    scheduleAutoSave();
  });
});
if (notesEl) notesEl.addEventListener('input', scheduleAutoSave);
if (topicEl) topicEl.addEventListener('input', scheduleAutoSave);
gratEls.forEach(el => { if (el) el.addEventListener('input', scheduleAutoSave); });
// Meal/supp chips toggle + autosave
document.querySelectorAll('.meal-chip[data-meal]').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('on');
    scheduleAutoSave();
  });
});

document.querySelectorAll('[data-log-nav]').forEach(btn => {
  btn.addEventListener('click', () => {
    const delta = btn.dataset.logNav === 'next' ? 1 : -1;
    const next = addDays(currentLogDate, delta);
    if (next > today()) return;
    if (dateDiffDays(today(), next) > 90) return;
    currentLogDate = next;
    renderLogNav(); renderLogForm();
  });
});
// ============================================================
// VOICE INPUT — FR dictation parser for the daily log
// ============================================================
// Understands phrases like:
//   "45 minutes d'EPFC et 30 minutes de code"
//   "sport fait, 20 pages lues, humeur 4, anki 50 cartes"
//   "néerlandais une heure, flexibilité oui"
//   "100 minutes python" (maps to code)
// Returns a partial log diff that gets merged into current log state.
const VOICE_DOMAIN_ALIASES = {
  epfc:   ['epfc','etude','étude','ecole','école','cours'],
  code:   ['code','coder','codingbat','edabit','python','java','sql','exercism','leetcode','kaggle','programmation'],
  nl:     ['nl','neerlandais','néerlandais','dutch','hollandais','taalgarage','brulingua','vanzelfsprekend'],
  anki:   ['anki','flashcards','cartes','carte'],
  read:   ['lecture','lire','lu','pages','page','livre'],
  chess:  ['echecs','échecs','chess','partie','parties','puzzle','puzzles'],
  vinted: ['vinted','listing','listings','vente','ventes'],
  sport:  ['sport','muscu','musculation','push','pull','legs','seance','séance','training'],
  flex:   ['flex','flexibilité','flexibilite','souplesse','stretch','stretching','etirement','étirement']
};
const VOICE_BOOLEAN_DOMAINS = new Set(['sport','flex']);
// Convert spoken number phrases into numeric value (including "une heure" → 60)
// Kept inline within voiceParseTranscript via extractDuration; no standalone helper needed.
function voiceParseTranscript(text){
  const t = text.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[’']/g, "'");
  const diff = {};
  // Hour/minute detection helper — returns minutes from any number expression
  function extractDuration(chunk){
    // Patterns: "45 min", "1h30", "une heure", "deux heures", "1h"
    const hm = chunk.match(/(\d+)\s*h\s*(\d+)/);
    if (hm) return parseInt(hm[1])*60 + parseInt(hm[2]);
    const h = chunk.match(/(\d+(?:[.,]\d+)?)\s*heures?|une\s+heure|deux\s+heures|trois\s+heures/);
    if (h){
      if (h[0].startsWith('une')) return 60;
      if (h[0].startsWith('deux')) return 120;
      if (h[0].startsWith('trois')) return 180;
      return Math.round(parseFloat(h[1].replace(',','.')) * 60);
    }
    const m = chunk.match(/(\d+)\s*(minutes?|min)/);
    if (m) return parseInt(m[1]);
    const bare = chunk.match(/\b(\d{2,3})\b/);
    if (bare) return parseInt(bare[1]); // bare 2-3 digit number = assume minutes
    return null;
  }
  // Mood: "humeur 3", "mood 5", "je me sens bien" (3), "crevé" (1), "feu" (5)
  const moodMatch = t.match(/(?:humeur|mood|je\s+me\s+sens)\s+(\d|un|deux|trois|quatre|cinq|bien|mal|crev|ok|feu|cram)/);
  if (moodMatch){
    const v = moodMatch[1];
    const map = { '1':1,'2':2,'3':3,'4':4,'5':5,'un':1,'deux':2,'trois':3,'quatre':4,'cinq':5,
                  'mal':2,'crev':1,'cram':1,'ok':3,'bien':4,'feu':5 };
    const val = map[v];
    if (val) diff.mood = val;
  }
  // Boolean domains: sport / flex → detect "fait", "oui", or just presence
  for (const [key, aliases] of Object.entries(VOICE_DOMAIN_ALIASES)){
    if (!VOICE_BOOLEAN_DOMAINS.has(key)) continue;
    const pattern = new RegExp('\\b(?:'+aliases.join('|')+')\\b', 'i');
    if (pattern.test(t)){
      // Check if there's a "non" or "pas" within 15 chars before
      const m = t.match(new RegExp('(non|pas\\s+de|pas)\\s+(?:\\w+\\s+){0,2}(?:'+aliases.join('|')+')', 'i'));
      diff[key] = !m;
    }
  }
  // Pages and chess: special units
  const pagesMatch = t.match(/(\d+)\s*pages?\b/);
  if (pagesMatch) diff.read = parseInt(pagesMatch[1]);
  const chessMatch = t.match(/(\d+)\s*parties?\b|(\d+)\s*puzzles?\b/);
  if (chessMatch) diff.chess = parseInt(chessMatch[1] || chessMatch[2]);
  const ankiMatch  = t.match(/(\d+)\s*(?:cartes?|flash)/);
  if (ankiMatch) diff.anki = parseInt(ankiMatch[1]);
  // Numeric domains with minutes: epfc, code, nl
  for (const [key, aliases] of Object.entries(VOICE_DOMAIN_ALIASES)){
    if (VOICE_BOOLEAN_DOMAINS.has(key)) continue;
    if (['read','chess','anki','vinted'].includes(key)) continue;
    const pattern = new RegExp('\\b(?:'+aliases.join('|')+')\\b', 'i');
    const match = t.match(pattern);
    if (!match) continue;
    // Grab the chunk around the alias (30 chars before + 30 after)
    const idx = match.index;
    const chunk = t.slice(Math.max(0, idx-40), Math.min(t.length, idx+40));
    const mins = extractDuration(chunk);
    if (mins !== null && mins > 0 && mins <= 600) diff[key] = mins;
  }
  // Vinted: count of actions
  if (/\bvinted\b/i.test(t)){
    const n = t.match(/vinted[^0-9]*(\d+)|\b(\d+)[^a-z]*vinted/);
    if (n) diff.vinted = parseInt(n[1] || n[2]);
  }
  return diff;
}
// Public entry: starts/stops recognition, updates UI, applies diff on final result
let _voiceRec = null, _voiceActive = false;
function initVoiceInput(){
  const btn = document.getElementById('log-voice');
  const fb = document.getElementById('log-voice-fb');
  const statusEl = document.getElementById('lvf-status');
  const transcriptEl = document.getElementById('lvf-transcript');
  const stopBtn = document.getElementById('lvf-stop');
  if (!btn) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR){
    btn.classList.add('unsupported');
    btn.title = 'Reconnaissance vocale non supportée par ce navigateur (essaye Chrome ou Safari)';
    btn.addEventListener('click', () => {
      try { showToast('Reconnaissance vocale indisponible ici · essaye Chrome ou Safari'); } catch(_){}
    });
    return;
  }
  function stop(){
    if (_voiceRec){ try { _voiceRec.stop(); } catch(_){} }
    _voiceActive = false;
    btn.classList.remove('recording');
    if (fb) fb.classList.add('hidden');
  }
  function start(){
    if (_voiceActive) return;
    const rec = new SR();
    rec.lang = 'fr-BE';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = e => {
      let interim = '', finalT = '';
      for (let i = e.resultIndex; i < e.results.length; i++){
        const r = e.results[i];
        if (r.isFinal) finalT += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (transcriptEl) transcriptEl.textContent = finalT || interim || '…';
      if (finalT){
        // Apply the parsed diff to the current form
        const diff = voiceParseTranscript(finalT);
        applyVoiceDiff(diff);
        if (statusEl) statusEl.textContent = 'Reconnu · ' + Object.keys(diff).length + ' champ(s) mis à jour';
        if (typeof hapticSuccess === 'function') hapticSuccess();
      }
    };
    rec.onerror = e => {
      if (statusEl) statusEl.textContent = 'Erreur : ' + (e.error || 'inconnue');
      stop();
    };
    rec.onend = () => {
      _voiceActive = false;
      btn.classList.remove('recording');
      setTimeout(() => { if (fb) fb.classList.add('hidden'); }, 1800);
    };
    rec.onstart = () => {
      _voiceActive = true;
      btn.classList.add('recording');
      if (fb) fb.classList.remove('hidden');
      if (statusEl) statusEl.textContent = 'Écoute…';
      if (transcriptEl) transcriptEl.textContent = '—';
      if (typeof hapticTap === 'function') hapticTap();
    };
    _voiceRec = rec;
    try { rec.start(); } catch(e){ stop(); }
  }
  btn.addEventListener('click', () => {
    if (_voiceActive) stop(); else start();
  });
  if (stopBtn) stopBtn.addEventListener('click', stop);
}
function applyVoiceDiff(diff){
  // Merge diff into the currently displayed log inputs
  Object.entries(diff).forEach(([key, val]) => {
    if (VOICE_BOOLEAN_DOMAINS.has(key)){
      const row = document.querySelector('[data-log-toggle="'+key+'"]');
      if (row){
        if (val) row.classList.add('on'); else row.classList.remove('on');
      }
    } else if (key === 'mood'){
      document.querySelectorAll('.log-mood-btn').forEach(b => {
        b.classList.toggle('selected', parseInt(b.dataset.mood) === val);
      });
    } else {
      const input = document.querySelector('[data-log-input="'+key+'"]');
      if (input){
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles:true }));
      }
    }
  });
  // Trigger autosave
  try { scheduleAutoSave(); } catch(_){}
}
initVoiceInput();

const saveBtn = document.getElementById('log-save');
if (saveBtn) saveBtn.addEventListener('click', () => {
  saveLog(currentLogDate, collectLogForm());
  if (statusEl){ statusEl.textContent = '✓ Enregistré'; statusEl.classList.add('saved'); }
  refreshDerived();
  hapticSuccess();
});
const resetBtn = document.getElementById('log-reset');
let _resetArmed = false, _resetTimer = null;
if (resetBtn) resetBtn.addEventListener('click', () => {
  if (!_resetArmed){
    _resetArmed = true;
    resetBtn.classList.add('armed');
    resetBtn.textContent = 'Confirmer le reset';
    if (_resetTimer) clearTimeout(_resetTimer);
    _resetTimer = setTimeout(() => {
      _resetArmed = false;
      resetBtn.classList.remove('armed');
      resetBtn.textContent = 'Reset';
    }, 4000);
    return;
  }
  // Confirmed — snapshot the day before deletion, then offer undo
  const k = 'log_'+dateKey(currentLogDate);
  const before = S.get(k, null);
  S.del(k);
  renderLogForm();
  _resetArmed = false;
  resetBtn.classList.remove('armed');
  resetBtn.textContent = 'Reset';
  if (_resetTimer){ clearTimeout(_resetTimer); _resetTimer = null; }
  if (statusEl) statusEl.textContent = 'Effacé';
  refreshDerived();
  if (before){
    showToast('Journée effacée', () => {
      S.set(k, before); renderLogForm(); refreshDerived();
    });
  }
});
renderLogNav(); renderLogForm();

// ============================================================
// AGGREGATIONS & RINGS
// ============================================================
const TARGETS = CFG.TARGETS;
function weekLogs(){
  const logs = [], t = today();
  for (let i = 0; i < 7; i++){
    const d = addDays(t, -i);
    const data = S.get('log_'+dateKey(d), null);
    if (data) logs.push({date:d, data});
  }
  return logs;
}
function refreshDerived(){
  const wl = weekLogs();
  const agg = { epfc:0, code:0, nl:0, read:0, chess:0, vinted:0, sport:0, flex:0, moodSum:0, moodCount:0 };
  wl.forEach(({data}) => {
    agg.epfc+=data.epfc||0; agg.code+=data.code||0; agg.nl+=data.nl||0;
    agg.read+=data.read||0; agg.chess+=data.chess||0; agg.vinted+=data.vinted||0;
    if (data.sport) agg.sport++; if (data.flex) agg.flex++;
    if (data.mood){ agg.moodSum+=data.mood; agg.moodCount++; }
  });
  // Ring-specific: EPFC + code only (matches HTML label "étude technique (EPFC + code)")
  const technicalMin = agg.epfc + agg.code;
  // Review-wide: total study including NL (matches Stats 30j and Monthly)
  const studyMin = technicalMin + agg.nl;
  setRing('epfc', technicalMin, TARGETS.epfc);
  setRing('nl', agg.nl, TARGETS.nl);
  setRing('flex', agg.flex, TARGETS.flex);
  setRing('sport', agg.sport, TARGETS.sport);
  setText('[data-week-val="epfc"]', fmtMin(technicalMin));
  setText('[data-week-val="nl"]', fmtMin(agg.nl));
  setText('[data-week-val="flex"]', agg.flex+' / 5');
  setText('[data-week-val="sport"]', agg.sport+' / 3');
  setText('[data-rev="study"]', fmtMin(studyMin));
  setText('[data-rev="sport"]', agg.sport+' / 3');
  setText('[data-rev="flex"]', agg.flex+' / 5');
  setText('[data-rev="pages"]', agg.read);
  setText('[data-rev="chess"]', agg.chess);
  setText('[data-rev="vinted"]', agg.vinted);
  setText('[data-rev="mood"]', agg.moodCount ? (agg.moodSum/agg.moodCount).toFixed(1)+' / 5' : '—');
  let activeDays = 0;
  wl.forEach(({data}) => {
    if (countActiveDomains(data) >= ACTIVE_DAY_MIN_DOMAINS) activeDays++;
  });
  setText('[data-rev="active"]', activeDays+' / 7');
  const revTitle = document.getElementById('review-title');
  if (revTitle){
    revTitle.textContent = new Date().getDay() === 0 ? '✨ C\'est dimanche — revue hebdo' : 'Ta semaine en chiffres';
  }
  renderHeatmap();
  updateStreak();
  refreshMonthlyReview();
  if (typeof refreshRoutineProgress === 'function') refreshRoutineProgress();
  if (typeof renderXpWidget === 'function') renderXpWidget();
  if (document.querySelector('.tab[data-tab="stats"].active') && window.__statsReady) renderStats();
}
function setRing(name, value, target){
  const ring = document.querySelector('[data-ring="'+name+'"]');
  const lbl  = document.querySelector('[data-ring-val="'+name+'"]');
  if (!ring || !lbl) return;
  const pct = Math.min(100, Math.round((value/target)*100));
  const offset = CFG.RING_C * (1 - pct/100);
  ring.style.transition = 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)';
  ring.setAttribute('stroke-dashoffset', offset);
  lbl.textContent = pct+'%';
  lbl.style.color = pct >= 100 ? 'var(--jade)' : '';
}
function fmtMin(m){
  if (!m) return '0 min';
  if (m < 60) return m+' min';
  const h = Math.floor(m/60), mn = m%60;
  return h+'h'+(mn?pad(mn):'');
}

// ============================================================
// HEATMAP
// ============================================================
function heatScore(log, prio){
  if (!log && !prio) return 0;
  let score = 0;
  if (log){
    if (log.epfc >= 30) score++; if (log.code >= 20) score++;
    if (log.nl >= 20) score++; if (log.read >= 5) score++;
    if (log.sport) score++; if (log.flex) score++;
  }
  if (prio){
    const pcount = Object.values(prio).filter(Boolean).length;
    if (pcount >= 5) score++;
  }
  return Math.min(5, score);
}
function renderHeatmap(){
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  grid.classList.add('weekday');
  grid.innerHTML = '';
  const t = today();
  const todayDow = t.getDay(); // 0=Sun..6=Sat
  // Want last ~30 days. Anchor: today is the rightmost column. Count weeks needed.
  // Walk back to 30 days ago, then to the previous Monday, to align cleanly.
  const earliest = addDays(t, -29);
  // Find the Monday on/before `earliest`
  const earlyDow = earliest.getDay(); // 0=Sun..6=Sat
  // ISO Monday = 1; offset to monday: (dow + 6) % 7
  const offsetToMonday = (earlyDow + 6) % 7;
  const gridStart = addDays(earliest, -offsetToMonday);
  // weeks from gridStart through today
  const totalDays = dateDiffDays(t, gridStart) + 1;
  const weeks = Math.ceil(totalDays / 7);
  // Build a 2D map for quick lookup
  const dayMap = {};
  for (let i = 0; i < 30; i++){
    const d = addDays(t, -i);
    const k = dateKey(d);
    dayMap[k] = { d, score: heatScore(S.get('log_'+k, null), S.get('prio_'+k, null)) };
  }
  // CSS already configures grid as: auto repeat(6,1fr). Adjust dynamically:
  grid.style.gridTemplateColumns = 'auto repeat('+weeks+', 1fr)';
  // Header row: empty + week numbers (or just dots)
  // Render row by row: 7 weekday rows (Mon..Sun) × (weeks) columns
  const dowLabels = ['L','M','M','J','V','S','D'];
  let active = 0;
  // Build rows by row to keep DOM order intuitive
  for (let r = 0; r < 7; r++){
    // Label cell at the start of the row
    const lbl = document.createElement('div');
    lbl.className = 'hm-dow-lbl';
    lbl.textContent = dowLabels[r];
    grid.appendChild(lbl);
    for (let w = 0; w < weeks; w++){
      const dayInGrid = addDays(gridStart, w*7 + r); // r counted as offset from Monday
      const k = dateKey(dayInGrid);
      const inWindow = dayMap[k];
      if (!inWindow){
        // Outside the 30-day window or in the future relative to today
        if (dayInGrid > t){
          const cell = document.createElement('div');
          cell.className = 'heat-cell future';
          grid.appendChild(cell);
        } else {
          const empty = document.createElement('div');
          empty.className = 'hm-empty';
          grid.appendChild(empty);
        }
        continue;
      }
      const score = inWindow.score;
      if (score > 0) active++;
      const cell = document.createElement('button');
      cell.className = 'heat-cell heat-'+score;
      if (k === dateKey(t)) cell.classList.add('today');
      cell.title = DAYS_SHORT[dayInGrid.getDay()]+' '+dayInGrid.getDate()+' '+MONTHS_FR[dayInGrid.getMonth()]+' · '+score+'/5';
      cell.addEventListener('click', () => {
        currentLogDate = dayInGrid;
        renderLogNav(); renderLogForm();
        if (!document.getElementById('p-home').classList.contains('active')) activateTab('home');
        setTimeout(() => document.querySelector('.log-widget')?.scrollIntoView({behavior:'smooth', block:'center'}), 200);
      });
      grid.appendChild(cell);
    }
  }
  const first = addDays(t, -29);
  const title = document.getElementById('heatmap-title');
  if (title){
    const fm = MONTHS_FR[first.getMonth()].slice(0,3);
    const tm = MONTHS_FR[t.getMonth()].slice(0,3);
    title.textContent = first.getDate()+' '+fm+' → '+t.getDate()+' '+tm+' '+t.getFullYear();
  }
  setText('#heatmap-meta', active+' jour'+(active>1?'s':'')+' actif'+(active>1?'s':'')+' / 30');
}

// ============================================================
// MINI TRACKERS
// ============================================================
document.querySelectorAll('input[data-mini]').forEach(inp => {
  const k = 'mini_'+inp.dataset.mini;
  const v = S.get(k, null);
  if (v !== null && v !== '') inp.value = v;
  inp.addEventListener('input', () => {
    S.set(k, inp.value);
    if (inp.dataset.mini === 'weight' || inp.dataset.mini === 'elo'){
      const hKey = 'hist_'+inp.dataset.mini;
      const hist = S.get(hKey, []);
      const dk = dateKey(new Date());
      const last = hist[hist.length-1];
      const numVal = parseFloat(inp.value);
      if (isNaN(numVal)) return;
      if (!last || last.d !== dk) hist.push({d: dk, v: numVal});
      else last.v = numVal;
      S.set(hKey, hist.slice(-90));
      renderTrend(inp.dataset.mini);
      if (document.querySelector('.tab[data-tab="stats"].active') && window.__statsReady) renderStats();
    }
  });
});
function renderTrend(key){
  const hist = S.get('hist_'+key, []);
  const el = document.getElementById(key+'-trend');
  if (!el) return;
  if (hist.length < 2){ el.textContent = 'première entrée — reviens demain'; return; }
  const first = hist[0].v, last = hist[hist.length-1].v;
  const delta = (last - first).toFixed(key==='weight'?1:0);
  const arrow = delta > 0 ? '↗' : delta < 0 ? '↘' : '→';
  const unit = key === 'weight' ? ' kg' : '';
  el.textContent = arrow+' '+(delta>0?'+':'')+delta+unit+' sur '+hist.length+' jours';
}
renderTrend('weight'); renderTrend('elo');

// ============================================================
// PLAN TODO CHECKBOXES
// Daily habits (prefix "d-") reset each day; caps/milestones persist forever.
// ============================================================
(function(){
  const todayStr = dateKey(new Date());
  document.querySelectorAll('input[type="checkbox"][data-todo]').forEach(c => {
    const id = c.dataset.todo;
    const isDaily = id.startsWith('d-');
    const k = isDaily ? 'todo_' + id + '_' + todayStr : 'todo_' + id;
    c.checked = !!S.get(k, false);
    c.addEventListener('change', () => S.set(k, c.checked));
    if (isDaily){
      const lbl = c.closest('label');
      if (lbl && !lbl.querySelector('.todo-date-badge')){
        const b = document.createElement('span');
        b.className = 'todo-date-badge';
        b.title = 'Réinitialise chaque jour';
        b.textContent = '↻';
        b.style.cssText = 'margin-left:6px;font-size:9px;color:var(--text-faint);vertical-align:middle';
        lbl.appendChild(b);
      }
    }
  });
})();

// ============================================================
// FLEX MEASUREMENTS
// ============================================================
document.querySelectorAll('input[data-m]').forEach(inp => {
  const k = 'flex_'+inp.dataset.m;
  const v = S.get(k, null);
  if (v !== null && v !== '') inp.value = v;
  inp.addEventListener('input', () => S.set(k, inp.value));
});

// ============================================================
// ETF CALCULATOR
// ============================================================
function eur(n){ return '€' + Math.round(n).toLocaleString('fr-BE').replace(/\u202f/g,' '); }
function runCalc(){
  const a = document.querySelector('input[data-calc="amt"]');
  const y = document.querySelector('input[data-calc="yrs"]');
  const r = document.querySelector('input[data-calc="ret"]');
  if (!a || !y || !r) return;
  const amt = parseFloat(a.value), yrs = parseInt(y.value), ret = parseFloat(r.value);
  // Guard: any empty/invalid input → bail instead of showing €NaN everywhere
  if (!isFinite(amt) || amt <= 0 || !isFinite(yrs) || yrs <= 0 || !isFinite(ret)){
    setText('[data-out="amt"]', '—');
    setText('[data-out="yrs"]', '—');
    setText('[data-out="ret"]', '—');
    setText('[data-sim="paid"]', '—');
    setText('[data-sim="final"]', '—');
    setText('[data-sim="gain"]', '—');
    setText('[data-sim="mult"]', '—');
    return;
  }
  setText('[data-out="amt"]', eur(amt)+' / mois');
  setText('[data-out="yrs"]', yrs+' ans');
  setText('[data-out="ret"]', ret.toFixed(1)+' %');
  const rm = ret/100/12, n = yrs*12;
  const fv = rm === 0 ? amt * n : amt * ((Math.pow(1+rm, n) - 1) / rm) * (1+rm);
  const paid = amt * n, gain = fv - paid;
  setText('[data-sim="paid"]', eur(paid));
  setText('[data-sim="final"]', eur(fv));
  setText('[data-sim="gain"]', eur(gain));
  setText('[data-sim="mult"]', paid > 0 ? (fv/paid).toFixed(2)+'×' : '—');
}
// Pre-fill "monthly amount" from live debt mini-tracker if unset
(function prefillCalc(){
  const amtInput = document.querySelector('input[data-calc="amt"]');
  if (!amtInput) return;
  // Only if the user hasn't touched it yet (heuristic: flag stored on first edit)
  if (S.get('calc_user_set', false)) return;
  const debt = parseFloat(S.get('mini_debt', '') || '0');
  if (debt > 0){
    // Suggest: repay over 36 months as a baseline
    const suggestedMonthly = Math.max(50, Math.round(debt / 36 / 10) * 10);
    amtInput.value = suggestedMonthly;
    const valEl = document.querySelector('[data-out="amt"]');
    if (valEl) valEl.textContent = eur(suggestedMonthly)+' / mois';
  }
  amtInput.addEventListener('input', () => S.set('calc_user_set', true), { once:true });
})();
document.querySelectorAll('input[data-calc]').forEach(i => i.addEventListener('input', runCalc));
runCalc();

// ============================================================
// TASKS MODULE
// ============================================================
let currentTaskDay = 'today'; // 'today' | 'tomorrow'
function tasksKey(d){ return 'tasks_'+dateKey(d); }
function activeTaskDate(){ return currentTaskDay === 'tomorrow' ? addDays(new Date(), 1) : new Date(); }
function loadTasks(d){ return S.get(tasksKey(d || activeTaskDate()), []); }
function saveTasks(d, arr){
  if (arr.length === 0) S.del(tasksKey(d));
  else S.set(tasksKey(d), arr);
}
const taskTitle = document.getElementById('task-title');
const taskTime = document.getElementById('task-time');
const taskEndTime = document.getElementById('task-end-time');
const taskPrio = document.getElementById('task-prio');
const taskCat = document.getElementById('task-cat');
const taskAdd = document.getElementById('task-add');
const taskList = document.getElementById('task-list');
function _updateTaskTimeExtras(){
  const hasTime = !!taskTime.value;
  if (taskEndTime) taskEndTime.classList.toggle('visible', hasTime);
  if (!hasTime && taskEndTime) taskEndTime.value = '';
}
if (taskTime) taskTime.addEventListener('change', _updateTaskTimeExtras);
const taskDayTabs = document.querySelectorAll('[data-tasks-day]');
taskDayTabs.forEach(b => {
  b.addEventListener('click', () => {
    currentTaskDay = b.dataset.tasksDay;
    taskDayTabs.forEach(x => x.classList.toggle('active', x.dataset.tasksDay === currentTaskDay));
    renderTasks();
  });
});
function updateTaskCounts(){
  const today0 = loadTasks(new Date()).filter(t => !t.done).length;
  const tom = loadTasks(addDays(new Date(), 1)).filter(t => !t.done).length;
  setText('#task-count-today', today0);
  setText('#task-count-tomorrow', tom);
}

function renderTasks(){
  if (!taskList) return;
  const arr = loadTasks(activeTaskDate());
  // Sort: incomplete first, then by time (numeric minutes, not alpha), then by prio
  const sorted = arr.slice().sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const am = a.time ? parseTimeMin(a.time) : null;
    const bm = b.time ? parseTimeMin(b.time) : null;
    if (am !== null && bm !== null) return am - bm;
    if (am !== null) return -1;
    if (bm !== null) return 1;
    const prioOrder = { hi:0, med:1, low:2 };
    return (prioOrder[a.prio]||1) - (prioOrder[b.prio]||1);
  });
  taskList.innerHTML = '';
  if (arr.length === 0){
    const empty = document.createElement('div');
    empty.className = 'task-empty';
    empty.textContent = currentTaskDay === 'tomorrow'
      ? 'Rien de prévu pour demain. Profite, ou anticipe une tâche.'
      : 'Aucune tâche aujourd\'hui. Ajoute-en une si besoin.';
    taskList.appendChild(empty);
    updateTaskCounts();
    return;
  }
  sorted.forEach(t => {
    const el = document.createElement('div');
    el.className = 'task-item' + (t.done ? ' done' : '');
    el.dataset.id = t.id;
    const check = '<button class="task-check" data-act="check" aria-label="Terminer">✓</button>';
    const prio = '<div class="task-prio '+(t.prio||'med')+'" title="Priorité"></div>';
    const prioLbl = t.prio === 'hi' ? '<span class="task-prio-label hi">Urgent</span>' : '';
    const timeRange = t.time ? escapeHtml(t.time) + (t.endTime ? '–'+escapeHtml(t.endTime) : '') : '';
    const time = timeRange ? '<span class="task-time">'+timeRange+'</span>' : '';
    const cat = t.cat ? '<span class="task-cat '+escapeHtml(t.cat)+'">'+escapeHtml(catLabel(t.cat))+'</span>' : '';
    const text = '<span class="task-text" data-act="edit" title="Clic pour éditer">'+escapeHtml(t.title)+'</span>';
    const del = '<button class="task-del" data-act="del" aria-label="Supprimer">✕</button>';
    el.innerHTML = check + prio + prioLbl + time + text + cat + del;
    taskList.appendChild(el);
  });
  // Wire actions
  taskList.querySelectorAll('.task-item').forEach(el => {
    const id = el.dataset.id;
    const activeDate = activeTaskDate();
    el.querySelector('[data-act="check"]').addEventListener('click', () => {
      const tasks = loadTasks(activeDate);
      const t = tasks.find(x => x.id === id);
      if (t){
        t.done = !t.done; saveTasks(activeDate, tasks); renderTasks();
        if (t.time && t.endTime && window.renderRoutineFixedEvents) setTimeout(window.renderRoutineFixedEvents, 50);
      }
    });
    el.querySelector('[data-act="del"]').addEventListener('click', () => {
      const tasks = loadTasks(activeDate);
      const removed = tasks.find(x => x.id === id);
      if (!removed) return;
      const filtered = tasks.filter(x => x.id !== id);
      saveTasks(activeDate, filtered); renderTasks();
      if (removed.time && removed.endTime && window.renderRoutineFixedEvents) setTimeout(window.renderRoutineFixedEvents, 50);
      pushUndo('Tâche "' + removed.title.slice(0,30) + '"', () => {
        const back = loadTasks(activeDate); back.push(removed); saveTasks(activeDate, back); renderTasks();
      });
      showToast('Tâche supprimée', () => {
        const arr = loadTasks(activeDate); arr.push(removed); saveTasks(activeDate, arr); renderTasks();
      });
    });
    const textEl = el.querySelector('[data-act="edit"]');
    textEl.addEventListener('click', () => {
      if (textEl.contentEditable === 'true') return;
      textEl.contentEditable = 'true';
      textEl.focus();
      const range = document.createRange();
      range.selectNodeContents(textEl);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
    });
    textEl.addEventListener('blur', () => {
      textEl.contentEditable = 'false';
      const newVal = textEl.textContent.trim();
      if (!newVal){
        const removed = loadTasks(activeDate).find(x => x.id === id);
        const tasks = loadTasks(activeDate).filter(x => x.id !== id);
        saveTasks(activeDate, tasks); renderTasks();
        if (removed) showToast('Tâche supprimée', () => {
          const arr = loadTasks(activeDate); arr.push(removed); saveTasks(activeDate, arr); renderTasks();
        });
        return;
      }
      const tasks = loadTasks(activeDate);
      const t = tasks.find(x => x.id === id);
      if (t && t.title !== newVal){ t.title = newVal; saveTasks(activeDate, tasks); renderTasks(); }
    });
    textEl.addEventListener('keydown', e => {
      if (e.key === 'Enter'){ e.preventDefault(); textEl.blur(); }
      if (e.key === 'Escape'){ e.preventDefault(); textEl.textContent = loadTasks(activeDate).find(x => x.id===id)?.title || ''; textEl.blur(); }
    });
  });
  updateTaskCounts();
}
function catLabel(c){
  return { work:'Boulot', study:'Études', home:'Maison', health:'Santé', admin:'Admin' }[c] || c;
}
function addTask(){
  const title = taskTitle.value.trim();
  if (!title){ taskTitle.focus(); return; }
  const activeDate = activeTaskDate();
  const arr = loadTasks(activeDate);
  const startVal = taskTime.value || '';
  const endVal = (taskEndTime && taskEndTime.value) || '';
  // A task with both start and end time is automatically a fixed routine block — no checkbox needed
  const isFixedTime = !!(startVal && endVal && endVal > startVal);
  const durationMinutes = isFixedTime
    ? (parseTimeMin(endVal) - parseTimeMin(startVal))
    : null;
  arr.push({
    id: 't_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
    title,
    time: startVal,
    endTime: endVal,
    isFixedTime,
    durationMinutes,
    prio: taskPrio.value || 'med',
    cat: taskCat.value || '',
    done: false,
    createdAt: new Date().toISOString()
  });
  saveTasks(activeDate, arr);
  taskTitle.value = ''; taskTime.value = '';
  if (taskEndTime) taskEndTime.value = '';
  taskPrio.value = 'med'; taskCat.value = '';
  _updateTaskTimeExtras();
  renderTasks();
  // Any task with a timed range updates the Routine immediately
  if (isFixedTime && window.renderRoutineFixedEvents) setTimeout(window.renderRoutineFixedEvents, 50);
  taskTitle.focus();
}
if (taskAdd) taskAdd.addEventListener('click', addTask);
if (taskTitle) taskTitle.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); addTask(); } });
renderTasks();

// ============================================================
// MONTHLY GOALS (multi-item, checkable)
// ============================================================
const goalLbl = document.getElementById('goal-month-lbl');
const goalListEl = document.getElementById('goal-list');
const goalInput = document.getElementById('goal-new-input');
const goalBtn = document.getElementById('goal-new-btn');
const goalProgressEl = document.getElementById('goal-progress');
function monthLabel(d){ return MONTHS_FR[d.getMonth()]+' '+d.getFullYear(); }
function goalsKey(){ return 'goals_'+monthKey(new Date()); }
function loadGoals(){
  const v = S.get(goalsKey(), null);
  if (Array.isArray(v)) return v;
  // Migrate legacy single-textarea goal for the same month
  const legacy = S.get('goal_'+monthKey(new Date()), '');
  if (legacy && typeof legacy === 'string'){
    const parts = legacy.split(/[.\n;]+/).map(s => s.trim()).filter(Boolean);
    const migrated = parts.map(t => ({ id:'g_'+Date.now()+Math.random().toString(36).slice(2,5), text:t, done:false }));
    if (migrated.length){
      S.set(goalsKey(), migrated);
      S.del('goal_'+monthKey(new Date()));
      return migrated;
    }
  }
  return [];
}
function saveGoals(arr){
  if (!arr || arr.length === 0) S.del(goalsKey()); else S.set(goalsKey(), arr);
}
function renderGoals(){
  if (!goalListEl) return;
  if (goalLbl) goalLbl.textContent = monthLabel(new Date()).toUpperCase();
  const list = loadGoals();
  goalListEl.innerHTML = '';
  if (list.length === 0){
    goalListEl.innerHTML = '<div style="padding:10px;color:var(--text-faint);font-style:italic;text-align:center;font-size:12px">Aucun objectif ce mois-ci. Ajoute-en ci-dessous.</div>';
  } else {
    list.forEach(g => {
      const el = document.createElement('div');
      el.className = 'goal-item' + (g.done ? ' done' : '');
      el.innerHTML =
        '<div class="goal-check" role="checkbox" aria-checked="'+(g.done?'true':'false')+'" tabindex="0">✓</div>'+
        '<div class="goal-item-text" data-act="edit" title="Clic pour éditer">'+escapeHtml(g.text)+'</div>'+
        '<button class="goal-del" aria-label="Supprimer">✕</button>';
      goalListEl.appendChild(el);
      const check = el.querySelector('.goal-check');
      check.addEventListener('click', () => {
        const cur = loadGoals(); const t = cur.find(x => x.id === g.id);
        if (t){ t.done = !t.done; saveGoals(cur); renderGoals(); }
      });
      check.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); check.click(); } });
      const txt = el.querySelector('[data-act="edit"]');
      txt.addEventListener('click', e => {
        e.stopPropagation();
        if (txt.contentEditable === 'true') return;
        txt.contentEditable = 'true'; txt.focus();
        const r = document.createRange(); r.selectNodeContents(txt);
        const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      });
      txt.addEventListener('blur', () => {
        txt.contentEditable = 'false';
        const newVal = txt.textContent.trim();
        const cur = loadGoals();
        if (!newVal){
          saveGoals(cur.filter(x => x.id !== g.id)); renderGoals(); return;
        }
        const t = cur.find(x => x.id === g.id);
        if (t && t.text !== newVal){ t.text = newVal; saveGoals(cur); }
      });
      txt.addEventListener('keydown', e => {
        if (e.key === 'Enter'){ e.preventDefault(); txt.blur(); }
        if (e.key === 'Escape'){ e.preventDefault(); txt.textContent = g.text; txt.blur(); }
      });
      el.querySelector('.goal-del').addEventListener('click', () => {
        const cur = loadGoals();
        const removed = cur.find(x => x.id === g.id);
        saveGoals(cur.filter(x => x.id !== g.id)); renderGoals();
        if (removed) showToast('Objectif supprimé', () => {
          const back = loadGoals(); back.push(removed); saveGoals(back); renderGoals();
        });
      });
    });
  }
  // Progress display
  if (goalProgressEl){
    if (list.length === 0){ goalProgressEl.textContent = '—'; }
    else {
      const done = list.filter(x => x.done).length;
      const pct = Math.round(done*100/list.length);
      goalProgressEl.innerHTML = '<b>'+done+' / '+list.length+'</b> atteint'+(done>1?'s':'')+' · '+pct+'%';
      goalProgressEl.style.color = pct === 100 ? 'var(--jade)' : pct >= 50 ? 'var(--flame-2)' : 'var(--text-faint)';
    }
  }
}
function addGoal(){
  if (!goalInput) return;
  const v = goalInput.value.trim();
  if (!v){ goalInput.focus(); return; }
  const list = loadGoals();
  list.push({ id:'g_'+Date.now()+'_'+Math.random().toString(36).slice(2,5), text:v, done:false });
  saveGoals(list);
  goalInput.value = '';
  renderGoals();
  goalInput.focus();
}
if (goalBtn) goalBtn.addEventListener('click', addGoal);
if (goalInput) goalInput.addEventListener('keydown', e => {
  if (e.key === 'Enter'){ e.preventDefault(); addGoal(); }
});
renderGoals();

// ============================================================
// WEEKLY REVIEW PROMPTS (win/fail/change, per week)
// ============================================================
function weekKey(d){
  // ISO week: Monday as start
  const date = new Date(d || new Date()); date.setHours(0,0,0,0);
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  date.setDate(date.getDate() - diff);
  return 'wr_' + date.getFullYear() + '-W' + pad(Math.floor((dateDiffDays(date, new Date(date.getFullYear(), 0, 1)))/7) + 1);
}
const wrTextareas = document.querySelectorAll('textarea[data-wr]');
const wrSavedEl = document.getElementById('wr-saved');
function loadWR(){ return S.get(weekKey(), {}) || {}; }
function saveWR(data){
  if (!data || (!data.win && !data.fail && !data.change)) S.del(weekKey());
  else S.set(weekKey(), data);
}
function hydrateWR(){
  const d = loadWR();
  wrTextareas.forEach(ta => { ta.value = d[ta.dataset.wr] || ''; });
}
let wrTimer = null;
wrTextareas.forEach(ta => {
  ta.addEventListener('input', () => {
    if (wrTimer) clearTimeout(wrTimer);
    wrTimer = setTimeout(() => {
      const d = {};
      wrTextareas.forEach(t => { const v = t.value.trim(); if (v) d[t.dataset.wr] = v; });
      saveWR(d);
      if (wrSavedEl){
        wrSavedEl.classList.add('show');
        setTimeout(() => wrSavedEl.classList.remove('show'), 2000);
      }
    }, 700);
  });
});
hydrateWR();

// ============================================================
// ADMIN BE REMINDERS
// ============================================================
function renderAdmin(){
  const wrap = document.getElementById('admin-list');
  if (!wrap) return;
  const now = new Date(); now.setHours(0,0,0,0);
  const Y = now.getFullYear();
  const items = [
    { key:'ipp', icon:'📋', title:'Déclaration IPP (impôts revenus)', meta:'Tax-on-web ouvre en mai, date limite ~30 juin.', date: new Date(Y, 5, 30) },
    { key:'dac7', icon:'🛍️', title:'DAC7 Vinted', meta:'Vinted envoie ton récap en janvier. À déclarer avec IPP si > seuil (30 ventes ou €2000/an).', date: new Date(Y, 0, 31) },
    { key:'inasti1', icon:'🧾', title:'INASTI T1 (si indép. complém.)', meta:'Cotisations trimestrielles. Obligatoire si €1 500+/an profit Vinted régulier.', date: new Date(Y, 2, 20) },
    { key:'inasti2', icon:'🧾', title:'INASTI T2 (si indép. complém.)', meta:'2e trimestre.', date: new Date(Y, 5, 20) },
    { key:'inasti3', icon:'🧾', title:'INASTI T3 (si indép. complém.)', meta:'3e trimestre.', date: new Date(Y, 8, 20) },
    { key:'inasti4', icon:'🧾', title:'INASTI T4 (si indép. complém.)', meta:'4e trimestre.', date: new Date(Y, 11, 20) },
    { key:'pension', icon:'💰', title:'Épargne-pension (plafond fiscal)', meta:'Max €1 020/an pour déduction 30%. Versement à faire AVANT le 31 déc.', date: new Date(Y, 11, 31) },
    { key:'medC7', icon:'🏥', title:'Contrôle neurologique C7', meta:'Rappel : RDV suivi nerf cervical à programmer tous les 6-12 mois.', date: null }
  ];
  // Filter: keep upcoming + past-7-days
  const enriched = items.map(it => {
    if (!it.date) return Object.assign({}, it, { state:'open', label:'à planifier', days: null });
    // Roll forward if already past (DAC7 also recurs annually — fixed)
    let d = it.date;
    if (d < now){
      d = new Date(d.getFullYear()+1, d.getMonth(), d.getDate());
    }
    const days = dateDiffDays(d, now);
    let state = 'future';
    if (days < 0) state = 'done';
    else if (days <= 30) state = 'soon';
    return Object.assign({}, it, { date: d, state, days, label: fmtDaysLeft(days) });
  });
  // Sort by days ascending, with null/open last
  enriched.sort((a, b) => {
    if (a.days === null && b.days === null) return 0;
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    return a.days - b.days;
  });
  wrap.innerHTML = '';
  enriched.forEach(it => {
    const el = document.createElement('div');
    el.className = 'admin-item';
    const whenClass = it.state === 'soon' ? 'soon' : it.state === 'done' ? 'done' : '';
    const when = '<span class="admin-item-when '+whenClass+'">'+escapeHtml(it.label)+'</span>';
    el.innerHTML =
      '<div class="admin-item-icon">'+escapeHtml(it.icon)+'</div>'+
      '<div class="admin-item-text"><div class="admin-item-title">'+escapeHtml(it.title)+'</div>'+
      '<div class="admin-item-meta">'+escapeHtml(it.meta)+'</div></div>'+
      when;
    wrap.appendChild(el);
  });
}
function fmtDaysLeft(d){
  if (d === null) return 'à planifier';
  if (d < 0) return 'passé';
  if (d === 0) return 'AUJOURD\'HUI';
  if (d === 1) return 'demain';
  if (d <= 30) return 'dans '+d+'j';
  if (d <= 60) return 'dans '+Math.round(d/7)+' sem.';
  return 'dans '+Math.round(d/30)+' mois';
}
// Defer initial admin render — not above the fold on first paint
if ('requestIdleCallback' in window){
  requestIdleCallback(() => renderAdmin(), { timeout: 1500 });
} else {
  setTimeout(renderAdmin, 60);
}

// ============================================================
// DATA EXPORT / IMPORT / WIPE
// ============================================================
const expBtn = document.getElementById('data-export');
if (expBtn) expBtn.addEventListener('click', () => downloadBackup('manual'));
const notifBtn = document.getElementById('data-notif');
if (notifBtn){
  function updateNotifBtn(){
    if (!('Notification' in window)){
      notifBtn.textContent = '🔕 Notifications non supportées';
      notifBtn.disabled = true;
      return;
    }
    if (Notification.permission === 'granted'){
      notifBtn.textContent = '✅ Rappels actifs';
      notifBtn.classList.add('ok');
    } else if (Notification.permission === 'denied'){
      notifBtn.textContent = '🔕 Rappels refusés (voir réglages navigateur)';
      notifBtn.disabled = true;
    } else {
      notifBtn.textContent = '🔔 Activer les rappels';
    }
  }
  updateNotifBtn();
  notifBtn.addEventListener('click', async () => {
    const res = await notif.request();
    updateNotifBtn();
    if (res === 'granted'){
      try { showToast('✅ Rappels activés · tu seras prévenu 5 min avant chaque bloc'); } catch(_){}
      notif.fire('Rappels activés ✓', 'Tu seras prévenu 5 min avant chaque bloc de routine.', 'first-permission');
      scheduleRoutineNotifs();
    }
  });
}
const impBtn = document.getElementById('data-import');
const impFile = document.getElementById('data-file');
if (impBtn && impFile){
  impBtn.addEventListener('click', () => impFile.click());
  impFile.addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const obj = JSON.parse(fr.result);
        if (!obj.data) throw new Error('Format invalide');
        if (!confirm('Importer va écraser tes données actuelles. Continuer ?')) return;
        Object.entries(obj.data).forEach(([k, v]) => S.set(k, v));
        showToast('Import OK · rechargement dans 1.5s');
          setTimeout(() => location.reload(), 1500);
        location.reload();
      } catch (err) { showToast('❌ Erreur : '+err.message); }
    };
    fr.readAsText(f);
    impFile.value = '';
  });
}
const wipeBtn = document.getElementById('data-wipe');
function downloadBackup(suffix){
  const raw = S.all();
  const data = {};
  for (const k in raw){ if (!BACKUP_SECRETS.has(k)) data[k] = raw[k]; }
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), version:3, data }, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const stamp = dateKey(now)+'_'+pad(now.getHours())+pad(now.getMinutes());
  a.href = url;
  a.download = 'dashboard-backup-'+(suffix||'manual')+'-'+stamp+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
if (wipeBtn) wipeBtn.addEventListener('click', () => {
  if (!confirm('⚠️ Effacer TOUTES les données ?\n\nUn backup automatique va être téléchargé d\'abord.')) return;
  downloadBackup('PRE-WIPE');
  // Tiny delay to make sure the download fires before localStorage is gone
  setTimeout(() => {
    if (!confirm('Le backup a été téléchargé. Vraiment TOUT effacer maintenant ? (irréversible sans le backup)')) return;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++){
      const key = localStorage.key(i); if (key && key.startsWith(K)) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
    showToast('Tout effacé · pour restaurer importe ton dernier backup');
    location.reload();
  }, 500);
});

// ============================================================
// POMODORO
// ============================================================
const WORK_MIN = CFG.POMO.WORK_MIN, SHORT_BREAK = CFG.POMO.SHORT_BREAK, LONG_BREAK = CFG.POMO.LONG_BREAK;
let pomoState = { running: false, mode: 'work', remaining: WORK_MIN * 60, cycle: 1, totalCycle: CFG.POMO.TOTAL_CYCLE, tag: '' };
let pomoInterval = null;
let pomoEndTime = null;
const pomoFab = document.getElementById('pomo-fab');
const pomoModal = document.getElementById('pomo-modal');
const pomoClose = document.getElementById('pomo-close');
const pomoTimer = document.getElementById('pomo-timer');
const pomoBar = document.getElementById('pomo-bar');
const pomoToggle = document.getElementById('pomo-toggle');
const pomoResetBtn = document.getElementById('pomo-reset');
const pomoSkipBtn = document.getElementById('pomo-skip');
const pomoMode = document.getElementById('pomo-mode');
const pomoCycle = document.getElementById('pomo-cycle');
const pomoSessionChips = document.querySelectorAll('.pomo-session-chip[data-pomo-tag]');
const pomoSessionLabelV = document.getElementById('pomo-session-label-v');
const pomoBreakdown = document.getElementById('pomo-breakdown');
// Restore last session tag so user doesn't have to re-pick
pomoState.tag = S.get('pomo_last_tag', '') || '';
const POMO_TAG_LABELS = { epfc:'EPFC', code:'Code', nl:'Néerlandais', ia:'IA', read:'Lecture', vinted:'Vinted', other:'Autre' };
function renderPomoTag(){
  pomoSessionChips.forEach(c => c.classList.toggle('active', c.dataset.pomoTag === pomoState.tag));
  if (pomoSessionLabelV) pomoSessionLabelV.textContent = pomoState.tag ? POMO_TAG_LABELS[pomoState.tag] : '— choisis un domaine';
}
pomoSessionChips.forEach(c => {
  c.addEventListener('click', () => {
    pomoState.tag = c.dataset.pomoTag;
    S.set('pomo_last_tag', pomoState.tag);
    renderPomoTag();
  });
});
renderPomoTag();

function pomoTotalSec(){
  if (pomoState.mode === 'work') return WORK_MIN*60;
  return (pomoState.cycle % pomoState.totalCycle === 0) ? LONG_BREAK*60 : SHORT_BREAK*60;
}
function renderPomo(){
  const m = Math.floor(pomoState.remaining/60), s = pomoState.remaining%60;
  if (pomoTimer) pomoTimer.textContent = pad(m)+':'+pad(s);
  if (pomoMode){
    pomoMode.textContent = pomoState.mode === 'work' ? 'Focus' : 'Pause';
    pomoMode.classList.toggle('break', pomoState.mode !== 'work');
  }
  if (pomoTimer) pomoTimer.classList.toggle('break', pomoState.mode !== 'work');
  if (pomoBar){
    const pct = 100 * (1 - pomoState.remaining/pomoTotalSec());
    pomoBar.style.width = pct+'%';
    pomoBar.classList.toggle('break', pomoState.mode !== 'work');
  }
  if (pomoCycle) pomoCycle.textContent = 'Cycle '+pomoState.cycle+' / '+pomoState.totalCycle;
  if (pomoToggle) pomoToggle.textContent = pomoState.running ? 'Pause' : 'Démarrer';
  if (pomoFab) pomoFab.classList.toggle('running', pomoState.running);
  renderPomoTodayStats();
}
function renderPomoTodayStats(){
  const stats = S.get('pomo_'+dateKey(new Date()), { count:0, minutes:0, byTag:{} });
  setText('#pomo-today-count', stats.count);
  setText('#pomo-today-time', stats.minutes+' min');
  if (pomoBreakdown){
    pomoBreakdown.innerHTML = '';
    const entries = Object.entries(stats.byTag || {}).filter(([k,v]) => v.count > 0);
    if (entries.length === 0){ pomoBreakdown.innerHTML = '<span style="color:var(--text-faint);font-style:italic">tag tes sessions pour voir la répartition</span>'; return; }
    entries.sort((a,b) => b[1].count - a[1].count);
    entries.forEach(([tag, v]) => {
      const chip = document.createElement('span');
      chip.className = 'pomo-bd-chip';
      const lbl = POMO_TAG_LABELS[tag] || tag;
      chip.innerHTML = lbl+' · <b>'+v.count+'×</b>';
      pomoBreakdown.appendChild(chip);
    });
  }
}
function pomoTick(){
  if (!pomoState.running || !pomoEndTime) return;
  pomoState.remaining = Math.max(0, Math.round((pomoEndTime - Date.now())/1000));
  const transitioned = pomoState.remaining <= 0;
  if (transitioned){
    if (pomoState.mode === 'work'){
      const k = dateKey(new Date());
      const stats = S.get('pomo_'+k, { count:0, minutes:0, byTag:{} });
      if (!stats.byTag) stats.byTag = {};
      stats.count++; stats.minutes += WORK_MIN;
      const tag = pomoState.tag || 'other';
      if (!stats.byTag[tag]) stats.byTag[tag] = { count:0, minutes:0 };
      stats.byTag[tag].count++;
      stats.byTag[tag].minutes += WORK_MIN;
      S.set('pomo_'+k, stats);
      try { beep(880, 200); setTimeout(()=>beep(660, 200), 220); } catch(e){}
      pomoState.mode = 'break';
      pomoState.remaining = pomoTotalSec();
    } else {
      try { beep(440, 200); } catch(e){}
      pomoState.mode = 'work';
      pomoState.cycle = (pomoState.cycle % pomoState.totalCycle) + 1;
      pomoState.remaining = pomoTotalSec();
    }
    pomoEndTime = Date.now() + pomoState.remaining*1000;
  }
  // Only update DOM when modal is visible, or at segment boundaries (fab badge needs refresh)
  const modalOpen = pomoModal && pomoModal.classList.contains('open');
  if (modalOpen || transitioned) renderPomo();
}
function pomoStart(){
  if (pomoState.running) return;
  pomoState.running = true;
  pomoEndTime = Date.now() + pomoState.remaining*1000;
  if (pomoInterval) clearInterval(pomoInterval);
  pomoInterval = setInterval(pomoTick, 250); // 250ms for sub-second visual accuracy, still drift-free
  renderPomo();
}
function pomoPause(){
  if (pomoState.running && pomoEndTime){
    pomoState.remaining = Math.max(0, Math.round((pomoEndTime - Date.now())/1000));
  }
  pomoState.running = false;
  pomoEndTime = null;
  if (pomoInterval){ clearInterval(pomoInterval); pomoInterval = null; }
  renderPomo();
}
function pomoReset(){
  pomoPause();
  pomoState.mode = 'work';
  pomoState.cycle = 1;
  pomoState.remaining = WORK_MIN*60;
  renderPomo();
}
function pomoSkip(){
  pomoEndTime = Date.now();  // force segment end
  pomoTick();
}
let _audioCtx = null;
function beep(freq, dur){
  try {
    if (!_audioCtx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      _audioCtx = new AC();
    }
    const ctx = _audioCtx;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch(_){} }
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.start();
    setTimeout(() => { try { osc.stop(); osc.disconnect(); gain.disconnect(); } catch(_){} }, dur);
  } catch(e){}
}
if (pomoFab) pomoFab.addEventListener('click', () => { pomoModal.classList.add('open'); renderPomo(); });
if (pomoClose) pomoClose.addEventListener('click', () => pomoModal.classList.remove('open'));
if (pomoModal) pomoModal.addEventListener('click', e => { if (e.target === pomoModal) pomoModal.classList.remove('open'); });
if (pomoToggle) pomoToggle.addEventListener('click', () => pomoState.running ? pomoPause() : pomoStart());
if (pomoResetBtn) pomoResetBtn.addEventListener('click', pomoReset);
if (pomoSkipBtn) pomoSkipBtn.addEventListener('click', pomoSkip);
window.pomoOpen = () => { pomoModal.classList.add('open'); renderPomo(); };
// Resync remaining time when tab regains focus (drift-free — endTime is the source of truth)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && pomoState.running && pomoEndTime){
    pomoState.remaining = Math.max(0, Math.round((pomoEndTime - Date.now())/1000));
    renderPomo();
  }
});
// Release the interval when the page unloads — avoids phantom timers on SPA-like navigations
window.addEventListener('beforeunload', () => {
  if (pomoInterval) clearInterval(pomoInterval);
});
renderPomo();

// ============================================================
// VINTED TRACKER
// ============================================================
const vtList = document.getElementById('vt-list');
const vtEmpty = document.getElementById('vt-empty');
const vtName = document.getElementById('vt-name');
const vtCost = document.getElementById('vt-cost');
const vtPrice = document.getElementById('vt-price');
const vtStatus = document.getElementById('vt-status');
const vtAdd = document.getElementById('vt-add');

function vtData(){ return S.get('vinted_items', []); }
function vtSave(arr){ S.set('vinted_items', arr); }
function statusLabel(s){ return s === 'sold' ? 'Vendu' : s === 'return' ? 'Retour' : 'Listé'; }

function renderVt(){
  if (!vtList) return;
  const items = vtData();
  vtList.innerHTML = '';
  const roiEl = document.getElementById('vt-roi');
  if (items.length === 0){
    vtList.appendChild(vtEmpty);
    setText('#vt-invested', '€0');
    setText('#vt-sales', '€0');
    setText('#vt-profit', '€0');
    if (roiEl) roiEl.style.display = 'none';
    return;
  }
  let invested = 0, sales = 0;
  let listedCost = 0, listedCount = 0, dormantCount = 0;
  const t = today();
  items.forEach((it, idx) => {
    invested += (+it.cost || 0);
    if (it.status === 'sold') sales += (+it.price || 0);
    const isDormant = it.status === 'listed' && it.date && dateDiffDays(t, new Date(it.date)) >= 60;
    if (it.status === 'listed'){ listedCost += (+it.cost || 0); listedCount++; if (isDormant) dormantCount++; }
    const margin = (+it.price || 0) - (+it.cost || 0);
    const row = document.createElement('div');
    row.className = 'vt-item' + (it.status === 'sold' ? ' sold' : '') + (it.status === 'return' ? ' return' : '') + (isDormant ? ' dormant' : '');
    row.innerHTML =
      '<span class="vt-item-name">'+escapeHtml(it.name)+'</span>'+
      '<span class="vt-item-num">€'+(+it.cost).toFixed(2)+'</span>'+
      '<span class="vt-item-num">€'+(+it.price).toFixed(2)+'</span>'+
      '<span class="vt-item-num vt-item-margin '+(margin>=0?'pos':'neg')+'">'+(margin>=0?'+':'')+'€'+margin.toFixed(2)+'</span>'+
      '<button class="vt-item-status" data-idx="'+idx+'">'+statusLabel(it.status)+'</button>'+
      '<button class="vt-item-del" data-del="'+idx+'" aria-label="Supprimer">✕</button>';
    vtList.appendChild(row);
  });
  const soldCosts = items.filter(x=>x.status==='sold').reduce((a,b)=>a+(+b.cost||0),0);
  const profit = sales - soldCosts;
  const realROI = sales - invested;
  const roiPct = invested > 0 ? (realROI / invested) * 100 : 0;
  setText('#vt-invested', '€'+invested.toFixed(2));
  setText('#vt-sales', '€'+sales.toFixed(2));
  setText('#vt-profit', (profit>=0?'€':'-€')+Math.abs(profit).toFixed(2));
  if (roiEl){
    roiEl.style.display = '';
    const netEl = document.getElementById('vt-roi-net');
    const pctEl = document.getElementById('vt-roi-pct');
    const stockEl = document.getElementById('vt-stock-info');
    if (netEl){
      netEl.textContent = (realROI>=0?'+€':'-€')+Math.abs(realROI).toFixed(2);
      netEl.className = realROI > 0 ? 'roi-pos' : realROI < 0 ? 'roi-neg' : 'roi-neutral';
    }
    if (pctEl){
      pctEl.textContent = (realROI>=0?'+':'')+roiPct.toFixed(1)+'%';
      pctEl.className = realROI > 0 ? 'roi-pos' : realROI < 0 ? 'roi-neg' : 'roi-neutral';
    }
    if (stockEl){
      if (listedCount > 0){
        let s = '📦 €'+listedCost.toFixed(2)+' en stock ('+listedCount+' pièce'+(listedCount>1?'s':'')+')';
        if (dormantCount > 0) s += ' · ⏰ '+dormantCount+' dormant'+(dormantCount>1?'s':'')+' >60j';
        stockEl.textContent = s;
      } else {
        stockEl.textContent = 'Aucun stock dormant';
      }
    }
  }
  vtList.querySelectorAll('.vt-item-status').forEach(b => {
    b.addEventListener('click', () => {
      const i = parseInt(b.dataset.idx);
      const arr = vtData();
      const order = ['listed','sold','return'];
      const cur = order.indexOf(arr[i].status);
      arr[i].status = order[(cur+1) % order.length];
      // Reset listing date when moving back to listed, stamp sold date when selling
      if (arr[i].status === 'sold' && !arr[i].soldDate) arr[i].soldDate = dateKey(new Date());
      vtSave(arr); renderVt();
    });
  });
  vtList.querySelectorAll('.vt-item-del').forEach(b => {
    b.addEventListener('click', () => {
      const i = parseInt(b.dataset.del);
      const removed = vtData()[i];
      const arr = vtData(); arr.splice(i,1); vtSave(arr); renderVt();
      showToast('Article supprimé', () => {
        const back = vtData(); back.splice(i, 0, removed); vtSave(back); renderVt();
      });
    });
  });
}
if (vtAdd) vtAdd.addEventListener('click', () => {
  const name = vtName.value.trim();
  if (!name) { vtName.focus(); return; }
  const cost = parseFloat(vtCost.value) || 0;
  const price = parseFloat(vtPrice.value) || 0;
  const status = vtStatus.value || 'listed';
  const arr = vtData();
  arr.push({ name, cost, price, status, date: dateKey(new Date()), listedAt: new Date().toISOString() });
  vtSave(arr);
  vtName.value = vtCost.value = vtPrice.value = '';
  renderVt();
});
renderVt();

// ============================================================
// EPFC INTERACTIVE
// ============================================================
function epfcInject(){
  const epfcPage = document.getElementById('p-epfc');
  if (!epfcPage) return;
  const items = epfcPage.querySelectorAll('.dlist li');
  items.forEach(li => {
    if (li.querySelector('.epfc-status')) return;
    const strong = li.querySelector('.k strong');
    if (!strong) return;
    const txt = strong.textContent;
    const m = txt.match(/^([A-Z]{2,4}\d[A-Z0-9]*)\b/)
          || txt.match(/^(CompTIA|Meta|Oracle|Google|PSM|AWS|SAP|PCEP|CNaVT)\b/);
    if (!m) return;
    const code = txt.trim().split(/[—\(]/)[0].trim();
    const key = 'epfc_'+code.replace(/\s+/g,'_');
    const badge = document.createElement('span');
    badge.className = 'epfc-status';
    let state = S.get(key, 'todo');
    function apply(){
      badge.dataset.s = state;
      badge.textContent = state === 'done' ? '✓ Fait' : state === 'started' ? '⏳ En cours' : '○ À faire';
    }
    apply();
    badge.addEventListener('click', e => {
      e.stopPropagation(); e.preventDefault();
      state = state === 'todo' ? 'started' : state === 'started' ? 'done' : 'todo';
      S.set(key, state);
      apply();
      updateEpfcSummary();
    });
    strong.appendChild(badge);
  });
}
function updateEpfcSummary(){
  const sum = document.getElementById('epfc-sum');
  if (!sum) return;
  const all = document.querySelectorAll('#p-epfc .epfc-status');
  const total = all.length;
  let done = 0, started = 0;
  all.forEach(b => { if (b.dataset.s === 'done') done++; else if (b.dataset.s === 'started') started++; });
  const pct = total ? Math.round(done*100/total) : 0;
  sum.querySelector('[data-epfc-done]').textContent = done+' / '+total;
  sum.querySelector('[data-epfc-started]').textContent = started;
  sum.querySelector('[data-epfc-pct]').textContent = pct+'%';
  sum.querySelector('.epfc-bar-fill').style.width = pct+'%';
}
function epfcInsertSummary(){
  const epfcPage = document.getElementById('p-epfc');
  if (!epfcPage) return;
  if (document.getElementById('epfc-sum')) return;
  const firstH2 = epfcPage.querySelector('h2');
  if (!firstH2) return;
  const sum = document.createElement('div');
  sum.id = 'epfc-sum';
  sum.className = 'epfc-summary';
  sum.innerHTML =
    '<div>'+
      '<div style="font:600 10px var(--f-sans);letter-spacing:.12em;text-transform:uppercase;color:var(--text-faint)">Progression globale</div>'+
      '<div style="margin-top:4px"><b data-epfc-done>0 / 0</b> cours/certifs · <span style="color:var(--amber)"><b data-epfc-started>0</b> en cours</span></div>'+
      '<div class="epfc-bar"><div class="epfc-bar-fill" style="width:0%"></div></div>'+
    '</div>'+
    '<div style="font:italic 500 28px var(--f-display);color:var(--flame-2)"><b data-epfc-pct>0%</b></div>';
  firstH2.parentNode.insertBefore(sum, firstH2);
}
epfcInsertSummary();
epfcInject();
updateEpfcSummary();

// ============================================================
// GENERIC RESOURCE-STATUS BADGES (Code, IA, NL, Chess)
// Click a resource row to cycle: todo → started → done → todo
// ============================================================
function resStatusInject(pageSelector, tabKey){
  const page = document.querySelector(pageSelector);
  if (!page) return;
  const items = page.querySelectorAll('.dlist li');
  items.forEach(li => {
    if (li.querySelector('.epfc-status')) return;
    const strong = li.querySelector('.k strong');
    if (!strong) return;
    // Skip if no meaningful title (very short)
    const titleRaw = strong.textContent.trim();
    if (titleRaw.length < 2) return;
    const cleanKey = tabKey + '_' + titleRaw.replace(/[^a-zA-Z0-9_]+/g,'_').slice(0, 40);
    const badge = document.createElement('span');
    badge.className = 'epfc-status';
    let state = S.get(cleanKey, 'todo');
    function apply(){
      badge.dataset.s = state;
      badge.textContent = state === 'done' ? '✓ Fait' : state === 'started' ? '⏳ En cours' : '○ À faire';
    }
    apply();
    badge.addEventListener('click', e => {
      e.stopPropagation(); e.preventDefault();
      state = state === 'todo' ? 'started' : state === 'started' ? 'done' : 'todo';
      S.set(cleanKey, state);
      apply();
      updateResSummary(pageSelector, tabKey);
    });
    strong.appendChild(badge);
  });
  updateResSummary(pageSelector, tabKey);
}
function updateResSummary(pageSelector, tabKey){
  const page = document.querySelector(pageSelector);
  if (!page) return;
  let sum = page.querySelector('[data-res-sum="'+tabKey+'"]');
  if (!sum){
    // Insert before first h2.section-title (or first child if none)
    const firstH2 = page.querySelector('h2.section-title');
    if (!firstH2) return;
    sum = document.createElement('div');
    sum.dataset.resSum = tabKey;
    sum.className = 'epfc-summary';
    sum.innerHTML =
      '<div>'+
        '<div style="font:600 10px var(--f-sans);letter-spacing:.12em;text-transform:uppercase;color:var(--text-faint)">Progression ressources</div>'+
        '<div style="margin-top:4px"><b data-res-done>0 / 0</b> validées · <span style="color:var(--amber)"><b data-res-started>0</b> en cours</span></div>'+
        '<div class="epfc-bar"><div class="epfc-bar-fill" style="width:0%"></div></div>'+
      '</div>'+
      '<div style="font:italic 500 28px var(--f-display);color:var(--flame-2)"><b data-res-pct>0%</b></div>';
    firstH2.parentNode.insertBefore(sum, firstH2);
  }
  const all = page.querySelectorAll('.epfc-status');
  const total = all.length;
  let done = 0, started = 0;
  all.forEach(b => { if (b.dataset.s === 'done') done++; else if (b.dataset.s === 'started') started++; });
  const pct = total ? Math.round(done*100/total) : 0;
  sum.querySelector('[data-res-done]').textContent = done+' / '+total;
  sum.querySelector('[data-res-started]').textContent = started;
  sum.querySelector('[data-res-pct]').textContent = pct+'%';
  sum.querySelector('.epfc-bar-fill').style.width = pct+'%';
}
// Apply to all knowledge tabs
resStatusInject('[data-page="code"]', 'resCode');
resStatusInject('[data-page="ia"]', 'resIa');
resStatusInject('[data-page="nl"]', 'resNl');
resStatusInject('[data-page="chess"]', 'resChess');
resStatusInject('[data-page="finance"]', 'resFin');

// ============================================================
// ACCORDIONS (plan + IA)
// ============================================================
function wrapAccordionsFor(pageId){
  const page = document.getElementById(pageId);
  if (!page) return;
  if (page.querySelector('.acc')) return;
  const children = Array.from(page.children);
  let currentGroup = null;
  const groups = [];
  children.forEach(c => {
    if (c.tagName === 'DIV' && (c.classList.contains('page-header') || c.classList.contains('callout'))) return;
    if (c.tagName === 'H2' && c.classList.contains('section-title')){
      currentGroup = { head: c, body: [] };
      groups.push(currentGroup);
    } else if (currentGroup){
      currentGroup.body.push(c);
    }
  });
  groups.forEach((g, idx) => {
    if (g.body.length === 0) return;
    const acc = document.createElement('div');
    acc.className = 'acc' + (idx < 1 ? ' open' : '');
    const head = document.createElement('div');
    head.className = 'acc-head';
    head.innerHTML =
      '<div class="acc-head-text"><div class="acc-head-title">'+g.head.innerHTML+'</div></div>'+
      '<div class="acc-chevron">▾</div>';
    const body = document.createElement('div');
    body.className = 'acc-body';
    const inner = document.createElement('div');
    inner.className = 'acc-body-inner';
    g.body.forEach(el => inner.appendChild(el));
    body.appendChild(inner);
    acc.appendChild(head); acc.appendChild(body);
    g.head.parentNode.insertBefore(acc, g.head);
    g.head.remove();
    head.addEventListener('click', () => acc.classList.toggle('open'));
  });
}
wrapAccordionsFor('p-plan');

// ============================================================
// BACK TO TOP
// ============================================================
const toTopBtn = document.getElementById('to-top');
function updateToTop(){
  if (!toTopBtn) return;
  toTopBtn.classList.toggle('visible', window.scrollY > CFG.SCROLL_TOP_THRESH);
}
window.addEventListener('scroll', updateToTop, { passive: true });
if (toTopBtn) toTopBtn.addEventListener('click', () => {
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e){ window.scrollTo(0, 0); }
});
updateToTop();

// ============================================================
// STATS CHARTS
// ============================================================
let statsPeriod = 30; // days
window.__statsReady = true;
function allLogs(days){
  const arr = [], t = today();
  for (let i = days-1; i >= 0; i--){
    const d = addDays(t, -i);
    const data = S.get('log_'+dateKey(d), null) || emptyLog();
    arr.push({date:d, data});
  }
  return arr;
}
// Wire period filter
document.querySelectorAll('.period-filter [data-period]').forEach(b => {
  b.addEventListener('click', () => {
    statsPeriod = parseInt(b.dataset.period);
    document.querySelectorAll('.period-filter button').forEach(x => x.classList.toggle('active', x.dataset.period === b.dataset.period));
    renderStats();
  });
});
// Auto-insights
function computeInsights(){
  const t = today();
  const cur7 = allLogs(7), prev7 = [];
  for (let i = 13; i >= 7; i--){
    const d = addDays(t, -i);
    prev7.push({date:d, data:S.get('log_'+dateKey(d), null) || emptyLog()});
  }
  const studyOf = arr => arr.reduce((s, {data}) => s + studyMinutes(data), 0);
  const sportOf = arr => arr.reduce((s, {data}) => s + (data.sport?1:0), 0);
  const flexOf  = arr => arr.reduce((s, {data}) => s + (data.flex?1:0), 0);
  const out = [];
  // 1. Study trend
  const cs = studyOf(cur7), ps = studyOf(prev7);
  if (cs > 0 || ps > 0){
    if (ps === 0){
      out.push({ icon:'🎓', cls:'ins-pos', text:'<b>'+fmtMin(cs)+'</b> d\'étude cette semaine (première semaine trackée, continue comme ça).' });
    } else {
      const delta = Math.round((cs-ps)/Math.max(ps,1)*100);
      const cls = delta > 5 ? 'ins-pos' : delta < -5 ? 'ins-neg' : 'ins-neutral';
      const sign = delta > 0 ? '+' : '';
      out.push({ icon:'🎓', cls, text:'Étude cette semaine : <b>'+fmtMin(cs)+'</b> ('+sign+delta+'% vs semaine précédente).' });
    }
  }
  // 2. Sport cadence
  const sp = sportOf(cur7);
  if (sp >= 3) out.push({ icon:'💪', cls:'ins-pos', text:'<b>'+sp+' séances sport</b> cette semaine · cible atteinte.' });
  else if (sp > 0) out.push({ icon:'💪', cls:'ins-neutral', text:'<b>'+sp+' / 3 séances sport</b> cette semaine. '+(3-sp)+' manquante'+(sp===2?'':'s')+'.' });
  else out.push({ icon:'💪', cls:'ins-neg', text:'<b>0 séance sport</b> cette semaine. Cycle 2-on/1-off à relancer.' });
  // 3. Best day of week (last 30d)
  const logs30 = allLogs(30);
  const byDow = [0,0,0,0,0,0,0];
  const cntDow = [0,0,0,0,0,0,0];
  logs30.forEach(({date, data}) => {
    let score = studyMinutes(data);
    if (data.sport) score += 60; if (data.flex) score += 30;
    if (score > 0){ byDow[date.getDay()] += score; cntDow[date.getDay()]++; }
  });
  const avgs = byDow.map((v, i) => cntDow[i] ? v/cntDow[i] : 0);
  const topIdx = avgs.indexOf(Math.max(...avgs));
  const totalActive = cntDow.reduce((s,x) => s+x, 0);
  if (avgs[topIdx] > 0 && totalActive >= 7){
    out.push({ icon:'📆', cls:'ins-neutral', text:'Ton jour le plus productif (30j) : <b>'+DAYS_FR[topIdx]+'</b>.' });
  }
  // 4. Mood trend
  const moods = logs30.map(({data}) => data.mood).filter(x => x);
  if (moods.length >= 5){
    const avg = moods.reduce((s,x)=>s+x,0)/moods.length;
    const cls = avg >= 3.5 ? 'ins-pos' : avg >= 2.5 ? 'ins-neutral' : 'ins-neg';
    out.push({ icon:'😊', cls, text:'Humeur moyenne (30j) : <b>'+avg.toFixed(1)+' / 5</b> sur '+moods.length+' jours loggés.' });
  }
  // 5. Reading cadence
  const pages7 = cur7.reduce((s,{data}) => s+(data.read||0), 0);
  if (pages7 > 0){
    const perDay = pages7/7;
    out.push({ icon:'📚', cls: perDay >= 10 ? 'ins-pos' : 'ins-neutral', text:'<b>'+pages7+' pages</b> lues cette semaine · ≈ '+perDay.toFixed(1)+'/jour.' });
  }
  // 6. Pomo focus
  let pomos7 = 0, byTag = {};
  for (let i = 0; i < 7; i++){
    const d = addDays(t, -i);
    const p = S.get('pomo_'+dateKey(d), null);
    if (p){ pomos7 += p.count || 0; if (p.byTag) Object.entries(p.byTag).forEach(([k,v]) => { byTag[k] = (byTag[k]||0) + v.count; }); }
  }
  if (pomos7 > 0){
    const topTag = Object.entries(byTag).sort((a,b)=>b[1]-a[1])[0];
    const tagText = topTag ? ' · top domaine : <b>'+(POMO_TAG_LABELS[topTag[0]]||topTag[0])+'</b> ('+topTag[1]+'×)' : '';
    out.push({ icon:'⏱', cls:'ins-pos', text:'<b>'+pomos7+' pomodoros</b> cette semaine'+tagText+'.' });
  }
  // ─── PATTERN-BASED INSIGHTS (30 days minimum) ───
  // 7. Weakest day of week — which day do you consistently skip?
  if (totalActive >= 14){
    const skipRate = [0,0,0,0,0,0,0];
    const totalPerDow = [0,0,0,0,0,0,0];
    logs30.forEach(({date, data}) => {
      const dow = date.getDay();
      totalPerDow[dow]++;
      const domains = countActiveDomains(data);
      if (domains < 2) skipRate[dow]++;
    });
    let worstDow = -1, worstPct = 0;
    for (let i = 0; i < 7; i++){
      if (totalPerDow[i] < 2) continue;
      const pct = skipRate[i] / totalPerDow[i];
      if (pct > worstPct && pct >= 0.5){ worstPct = pct; worstDow = i; }
    }
    if (worstDow >= 0){
      out.push({ icon:'📉', cls:'ins-neg', text:'Tes <b>'+DAYS_FR[worstDow].toLowerCase()+'s</b> sont à risque — '+Math.round(worstPct*100)+'% sont des jours creux sur 30 jours.' });
    }
  }
  // 8. Mood correlation with pomodoros (simple threshold check)
  if (logs30.length >= 14){
    let moodLow = [], moodHigh = [];
    logs30.forEach(({date, data}) => {
      if (!data.mood) return;
      const dk = dateKey(date);
      const p = S.get('pomo_'+dk, null);
      const count = p ? (p.count||0) : 0;
      if (data.mood <= 2) moodLow.push(count);
      else if (data.mood >= 4) moodHigh.push(count);
    });
    if (moodLow.length >= 3 && moodHigh.length >= 3){
      const avgLow = moodLow.reduce((s,x)=>s+x,0) / moodLow.length;
      const avgHigh = moodHigh.reduce((s,x)=>s+x,0) / moodHigh.length;
      if (avgHigh > avgLow * 1.5 && avgHigh >= 2){
        out.push({ icon:'💡', cls:'ins-pos', text:'Corrélation détectée : tes <b>bonnes humeurs</b> ont '+avgHigh.toFixed(1)+' pomodoros en moyenne, contre '+avgLow.toFixed(1)+' en mauvaise. Le focus booste le mood.' });
      } else if (avgLow > avgHigh * 1.5 && avgLow >= 2){
        out.push({ icon:'⚠️', cls:'ins-neg', text:'Signal : les jours où tu pousses le focus (<b>'+avgLow.toFixed(1)+' pomos</b>) ton humeur chute. Peut-être un rythme trop intense.' });
      }
    }
  }
  // 9. Morning vs afternoon EPFC (requires session-level tracking — approximation via pomo byTag)
  // Skip if no data — we don't have timestamps per-log yet.
  // 10. Streak milestone anticipation
  const curStreak = parseInt(document.getElementById('st-streak')?.textContent || '0');
  if (curStreak > 0){
    const milestones = [7, 14, 30, 50, 100];
    const next = milestones.find(m => m > curStreak);
    if (next && next - curStreak <= 3){
      out.push({ icon:'🎯', cls:'ins-pos', text:'Tu es à <b>'+(next-curStreak)+' jour'+(next-curStreak>1?'s':'')+'</b> du palier <b>'+next+' jours</b>. Dernière ligne droite.' });
    }
  }
  // 11. Warning: 2 days in a row with zero domains
  if (logs30.length >= 3){
    const last3 = logs30.slice(-3);
    const zeros = last3.filter(({data}) => countActiveDomains(data) === 0).length;
    if (zeros >= 2){
      out.push({ icon:'🛑', cls:'ins-neg', text:'<b>2 jours creux d\'affilée</b>. Règle n°1 : jamais 3. Minimum vital aujourd\'hui (20 min Anki + shot + 3L).' });
    }
  }
  return out;
}
function renderInsights(){
  const host = document.getElementById('insights');
  if (!host) return;
  const items = computeInsights();
  if (items.length === 0){
    host.innerHTML = '<div class="insight-empty">Logue quelques jours — les insights apparaîtront ici.</div>';
    return;
  }
  host.innerHTML = '';
  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'insight-row';
    row.innerHTML = '<span class="ins-icon">'+it.icon+'</span><span class="'+it.cls+'">'+it.text+'</span>';
    host.appendChild(row);
  });
}
function renderLineChart(svg, values, opts){
  opts = opts || {};
  const W = 400, H = 180, padL = 34, padR = 10, padT = 14, padB = 22;
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 400 180');
  const nonNull = values.filter(v => v !== null && !isNaN(v));
  if (nonNull.length < 1){
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', W/2); t.setAttribute('y', H/2);
    t.setAttribute('text-anchor','middle');
    t.setAttribute('fill','#6b6b85'); t.setAttribute('font-family','Outfit,sans-serif');
    t.setAttribute('font-size','13'); t.setAttribute('font-style','italic');
    t.textContent = 'Pas encore de données — logge quelques jours';
    svg.appendChild(t); return;
  }
  const max = Math.max(...nonNull, opts.min || 1);
  const min = opts.absMin !== undefined ? opts.absMin : Math.min(...nonNull);
  const range = max - min || 1;
  const n = values.length;
  const xStep = (W - padL - padR) / Math.max(1, n-1);
  const y = v => padT + (H - padT - padB) * (1 - (v - min)/range);

  const xAxis = document.createElementNS('http://www.w3.org/2000/svg','line');
  xAxis.setAttribute('x1', padL); xAxis.setAttribute('y1', H-padB);
  xAxis.setAttribute('x2', W-padR); xAxis.setAttribute('y2', H-padB);
  xAxis.setAttribute('stroke','#242438'); xAxis.setAttribute('stroke-width','1');
  svg.appendChild(xAxis);
  for (let i = 0; i <= 3; i++){
    const gy = padT + i*(H-padT-padB)/3;
    const gl = document.createElementNS('http://www.w3.org/2000/svg','line');
    gl.setAttribute('x1', padL); gl.setAttribute('y1', gy);
    gl.setAttribute('x2', W-padR); gl.setAttribute('y2', gy);
    gl.setAttribute('stroke','#1a1a28'); gl.setAttribute('stroke-width','1');
    gl.setAttribute('stroke-dasharray','2,3');
    svg.appendChild(gl);
    const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
    lbl.setAttribute('x', padL - 4); lbl.setAttribute('y', gy+4);
    lbl.setAttribute('text-anchor','end');
    lbl.setAttribute('fill','#6b6b85'); lbl.setAttribute('font-size','9');
    lbl.setAttribute('font-family','JetBrains Mono,monospace');
    const val = max - (i*range/3);
    lbl.textContent = opts.fmt ? opts.fmt(val) : Math.round(val);
    svg.appendChild(lbl);
  }
  let d = '', started = false, firstIdx = -1, lastIdx = -1;
  for (let i = 0; i < n; i++){
    const v = values[i]; const cx = padL + i*xStep;
    if (v === null || isNaN(v)){ started = false; continue; }
    if (firstIdx < 0) firstIdx = i; lastIdx = i;
    const cy = y(v);
    d += (started ? ' L ' : 'M ') + cx.toFixed(1)+' '+cy.toFixed(1);
    started = true;
  }
  if (d){
    const area = document.createElementNS('http://www.w3.org/2000/svg','path');
    area.setAttribute('d', d + ' L '+(padL+lastIdx*xStep).toFixed(1)+' '+(H-padB)+' L '+(padL+firstIdx*xStep).toFixed(1)+' '+(H-padB)+' Z');
    area.setAttribute('fill', opts.color || 'rgba(255,107,53,.15)');
    area.setAttribute('stroke','none');
    svg.appendChild(area);
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('fill','none');
    path.setAttribute('stroke', opts.stroke || '#ff8c52');
    path.setAttribute('stroke-width','2');
    path.setAttribute('stroke-linejoin','round');
    path.setAttribute('stroke-linecap','round');
    svg.appendChild(path);
    for (let i = 0; i < n; i++){
      const v = values[i]; if (v === null || isNaN(v)) continue;
      const cx = padL + i*xStep, cy = y(v);
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx', cx.toFixed(1)); c.setAttribute('cy', cy.toFixed(1));
      c.setAttribute('r','2.5'); c.setAttribute('fill', opts.stroke || '#ff8c52');
      svg.appendChild(c);
    }
  }
  [0, Math.floor(n/2), n-1].forEach(i => {
    if (!opts.labels || !opts.labels[i]) return;
    const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
    lbl.setAttribute('x', padL + i*xStep);
    lbl.setAttribute('y', H-padB+14);
    lbl.setAttribute('text-anchor','middle');
    lbl.setAttribute('fill','#6b6b85'); lbl.setAttribute('font-size','9');
    lbl.setAttribute('font-family','JetBrains Mono,monospace');
    lbl.textContent = opts.labels[i];
    svg.appendChild(lbl);
  });
}
function renderBarChart(svg, items, opts){
  opts = opts || {};
  const W = 400, H = 180, padL = 20, padR = 10, padT = 24, padB = 22;
  svg.innerHTML = '';
  const max = Math.max(...items.map(i => i.v), 1);
  const n = items.length;
  const barW = (W - padL - padR) / n * 0.7;
  const gap = (W - padL - padR) / n * 0.3;
  for (let i = 0; i <= 3; i++){
    const gy = padT + i*(H-padT-padB)/3;
    const gl = document.createElementNS('http://www.w3.org/2000/svg','line');
    gl.setAttribute('x1', padL); gl.setAttribute('y1', gy);
    gl.setAttribute('x2', W-padR); gl.setAttribute('y2', gy);
    gl.setAttribute('stroke','#1a1a28'); gl.setAttribute('stroke-width','1');
    gl.setAttribute('stroke-dasharray','2,3');
    svg.appendChild(gl);
  }
  items.forEach((it, i) => {
    const h = (H-padT-padB) * (it.v/max);
    const x = padL + i*(barW+gap) + gap/2;
    const y = H - padB - h;
    const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', barW); rect.setAttribute('height', Math.max(1, h));
    rect.setAttribute('fill', it.color || '#ff8c52');
    rect.setAttribute('rx','4');
    svg.appendChild(rect);
    if (it.v > 0){
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x', x + barW/2); t.setAttribute('y', y - 6);
      t.setAttribute('text-anchor','middle'); t.setAttribute('fill','#a8a8c0');
      t.setAttribute('font-size','10'); t.setAttribute('font-family','JetBrains Mono,monospace');
      t.textContent = opts.fmt ? opts.fmt(it.v, it) : it.v;
      svg.appendChild(t);
    }
    const lbl = document.createElementNS('http://www.w3.org/2000/svg','text');
    lbl.setAttribute('x', x + barW/2); lbl.setAttribute('y', H-padB+14);
    lbl.setAttribute('text-anchor','middle'); lbl.setAttribute('fill','#a8a8c0');
    lbl.setAttribute('font-size','10'); lbl.setAttribute('font-family','Outfit,sans-serif');
    lbl.textContent = it.label;
    svg.appendChild(lbl);
  });
}
function renderStats(){
  renderInsights();
  const logsN = allLogs(statsPeriod);
  let studyN = 0, activeN = 0, pages = 0, chess = 0, sportN = 0, flexN = 0;
  logsN.forEach(({data}) => {
    studyN += studyMinutes(data);
    pages += data.read||0; chess += data.chess||0;
    if (data.sport) sportN++; if (data.flex) flexN++;
    if (countActiveDomains(data) >= ACTIVE_DAY_MIN_DOMAINS) activeN++;
  });
  setText('#sv-streak', document.getElementById('st-streak')?.textContent || '0');
  setText('#sv-best', S.get('best_streak', 0));
  setText('#sv-study30', fmtMin(studyN));
  setText('#sv-active30', activeN+' / '+statsPeriod);
  setText('#sv-pages', pages);
  setText('#sv-chess', chess);
  setText('#sv-sport30', sportN);
  setText('#sv-flex30', flexN);
  // Update labels to reflect period
  document.querySelectorAll('.stats-card-lbl').forEach(lbl => {
    lbl.textContent = lbl.textContent.replace(/· \d+j|· 30j/, '· '+statsPeriod+'j').replace(/·\s+\d+\s+possibles/, '· '+statsPeriod+' possibles');
  });
  const studyVals = logsN.map(({data}) => {
    const v = studyMinutes(data);
    return v === 0 ? null : v;
  });
  const labels = logsN.map(({date}, i) => {
    if (i === 0) return date.getDate()+' '+MONTHS_FR[date.getMonth()].slice(0,3);
    if (i === logsN.length-1) return 'aujourd\'hui';
    if (i === Math.floor(logsN.length/2)) return date.getDate()+' '+MONTHS_FR[date.getMonth()].slice(0,3);
    return '';
  });
  renderLineChart(document.getElementById('chart-study'), studyVals, {
    labels, absMin: 0, min: 60,
    color: 'rgba(255,107,53,.15)', stroke: '#ff8c52',
    fmt: v => v >= 60 ? (v/60).toFixed(1)+'h' : Math.round(v)+'m'
  });
  const wk = weekLogs();
  const domAgg = { epfc:0, code:0, nl:0 };
  wk.forEach(({data}) => { domAgg.epfc+=data.epfc||0; domAgg.code+=data.code||0; domAgg.nl+=data.nl||0; });
  renderBarChart(document.getElementById('chart-domains'), [
    { label:'EPFC', v:domAgg.epfc, color:'#34d399' },
    { label:'Code', v:domAgg.code, color:'#a78bfa' },
    { label:'NL', v:domAgg.nl, color:'#6aa5fa' }
  ], { fmt: v => v >= 60 ? Math.round(v/60)+'h' : v+'m' });

  const wHist = S.get('hist_weight', []);
  renderHistLineChart('chart-weight', wHist, '#c8a84e', 'rgba(200,168,78,.15)', v => v.toFixed(1)+'kg');
  const eHist = S.get('hist_elo', []);
  renderHistLineChart('chart-elo', eHist, '#22d3ee', 'rgba(34,211,238,.15)', v => Math.round(v));

  const logs14 = allLogs(14);
  const moodVals = logs14.map(({data}) => data.mood || null);
  const moodLabels = logs14.map(({date}, i) => {
    if (i === 0 || i === logs14.length-1 || i === 7) return DAYS_SHORT[date.getDay()]+' '+date.getDate();
    return '';
  });
  renderLineChart(document.getElementById('chart-mood'), moodVals, {
    labels: moodLabels, absMin: 1, min: 5,
    color: 'rgba(248,113,113,.15)', stroke: '#f472b6',
    fmt: v => Math.round(v)
  });
}
function renderHistLineChart(id, hist, stroke, fill, fmt){
  const svg = document.getElementById(id); if (!svg) return;
  if (hist.length < 1){
    svg.innerHTML = '';
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x', 200); t.setAttribute('y', 90);
    t.setAttribute('text-anchor','middle'); t.setAttribute('fill','#6b6b85');
    t.setAttribute('font-family','Outfit,sans-serif'); t.setAttribute('font-size','13');
    t.setAttribute('font-style','italic');
    t.textContent = 'Remplis la valeur dans les mini-trackers';
    svg.appendChild(t); return;
  }
  const t = today(), start = addDays(t, -29);
  const vals = new Array(30).fill(null);
  hist.forEach(h => {
    const d = new Date(h.d);
    const diff = dateDiffDays(d, start);
    if (diff >= 0 && diff < 30) vals[diff] = h.v;
  });
  let last = null;
  for (let i = 0; i < vals.length; i++){
    if (vals[i] === null && last !== null) vals[i] = last;
    else if (vals[i] !== null) last = vals[i];
  }
  const labels = vals.map((_, i) => {
    if (i === 0) return 'il y a 30j';
    if (i === 29) return 'aujourd\'hui';
    if (i === 15) return '15j';
    return '';
  });
  renderLineChart(svg, vals, { labels, color: fill, stroke, fmt });
}

// ============================================================
// BOOKMARKS · "Reprendre où t'as arrêté"
// ============================================================
var BOOKMARK_DOMAINS = [
  { key:'epfc', icon:'🎓', label:'EPFC',         placeholder:'Ex. Think Python ch.3 · exo 2.7' },
  { key:'code', icon:'💻', label:'Code',         placeholder:'Ex. CodingBat Warmup-2 · fix_teen' },
  { key:'nl',   icon:'🇳🇱', label:'Néerlandais',  placeholder:'Ex. Taalgarage A1.2 · leçon 4' },
  { key:'read', icon:'📚', label:'Lecture',      placeholder:'Ex. Atomic Habits p.147' },
  { key:'chess',icon:'♟️', label:'Échecs',       placeholder:'Ex. Chessable 1.e4 e5 · lesson 8' },
  { key:'ia',   icon:'🤖', label:'IA',            placeholder:'Ex. Fast.ai lesson 2 · 12:34' }
];
function loadBookmarks(){ return S.get('bookmarks', {}); }
function loadBookmarkHistory(key){ return S.get('bm_hist_'+key, []); }
function saveBookmark(key, val){
  const obj = loadBookmarks();
  const prev = obj[key];
  if ((val || '').trim()){
    const newText = val.trim();
    // Only record history if text changed
    if (!prev || prev.text !== newText){
      if (prev && prev.text){
        const hist = loadBookmarkHistory(key);
        hist.push({ text: prev.text, updatedAt: prev.updatedAt || null, archivedAt: new Date().toISOString() });
        S.set('bm_hist_'+key, hist.slice(-20));
      }
    }
    obj[key] = { text: newText, updatedAt: new Date().toISOString() };
  }
  else {
    if (prev && prev.text){
      const hist = loadBookmarkHistory(key);
      hist.push({ text: prev.text, updatedAt: prev.updatedAt || null, archivedAt: new Date().toISOString() });
      S.set('bm_hist_'+key, hist.slice(-20));
    }
    delete obj[key];
  }
  S.set('bookmarks', obj);
}
function relativeTime(iso){
  if (!iso) return 'jamais mis à jour';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)      return 'à l\'instant';
  if (diff < 3600)    return 'il y a '+Math.floor(diff/60)+' min';
  if (diff < 86400)   return 'il y a '+Math.floor(diff/3600)+' h';
  if (diff < 604800)  return 'il y a '+Math.floor(diff/86400)+' j';
  if (diff < 2592000) return 'il y a '+Math.floor(diff/604800)+' sem.';
  return 'il y a '+Math.floor(diff/2592000)+' mois';
}
function renderBookmarks(){
  const wrap = document.getElementById('bookmark-list');
  if (!wrap) return;
  const saved = loadBookmarks();
  wrap.innerHTML = '';
  BOOKMARK_DOMAINS.forEach(d => {
    const entry = saved[d.key] || {};
    const hist = loadBookmarkHistory(d.key);
    const histCount = hist.length;
    const row = document.createElement('div');
    row.className = 'bm-row';
    const rel = relativeTime(entry.updatedAt);
    row.innerHTML =
      '<div class="bm-icon">'+d.icon+'</div>'+
      '<div class="bm-body">'+
        '<div class="bm-domain">'+d.label+(histCount ? ' <span style="color:var(--text-ghost);font-weight:500">· '+histCount+' archivé'+(histCount>1?'s':'')+'</span>' : '')+'</div>'+
        '<div class="bm-where" contenteditable="true" data-placeholder="'+d.placeholder+'" data-bm="'+d.key+'" spellcheck="false">'+escapeHtml(entry.text || '')+'</div>'+
        '<div class="bm-meta" data-bm-meta="'+d.key+'">'+rel+(histCount ? ' · <a href="#" data-bm-hist="'+d.key+'" style="color:var(--sapphire-2);text-decoration:underline dotted">voir historique</a>' : '')+'</div>'+
      '</div>';
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('[data-bm]').forEach(el => {
    el.addEventListener('blur', () => {
      const key = el.dataset.bm;
      const newVal = el.textContent.trim();
      const cur = loadBookmarks()[key] || {};
      if (newVal !== (cur.text || '')){
        saveBookmark(key, newVal);
        renderBookmarks(); // re-render to refresh history count
      }
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); el.blur(); }
      if (e.key === 'Escape'){ e.preventDefault(); el.textContent = (loadBookmarks()[el.dataset.bm]||{}).text || ''; el.blur(); }
    });
  });
  // History popups
  wrap.querySelectorAll('[data-bm-hist]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const key = a.dataset.bmHist;
      const hist = loadBookmarkHistory(key);
      if (hist.length === 0){ showToast('Aucun historique'); return; }
      const dom = BOOKMARK_DOMAINS.find(x => x.key === key);
      // Audit Apr 2026 : modal <dialog> au lieu d'alert() (scrollable, stylé, non-bloquant)
      showBookmarkHistoryDialog(dom ? dom.label : key, hist);
    });
  });
}

// Audit Apr 2026 : modal <dialog> pour afficher l'historique des bookmarks
// (remplace l'alert() qui était bloquant et illisible sur mobile).
function showBookmarkHistoryDialog(label, hist){
  // Crée le dialog s'il n'existe pas
  let dlg = document.getElementById('bmHistDialog');
  if (!dlg){
    dlg = document.createElement('dialog');
    dlg.id = 'bmHistDialog';
    dlg.setAttribute('aria-labelledby', 'bmHistTitle');
    dlg.style.cssText = [
      'border:1px solid var(--border, #2a2a3e)',
      'background:var(--surface, #14141d)',
      'color:var(--text, #e7e7ee)',
      'border-radius:14px',
      'padding:0',
      'max-width:560px',
      'width:calc(100vw - 24px)',
      'max-height:80vh',
      'box-shadow:0 20px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04)',
      'overflow:hidden'
    ].join(';');
    dlg.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border,#2a2a3e);background:linear-gradient(180deg,rgba(251,146,60,.08),transparent)">
        <span style="font-size:18px">📜</span>
        <h3 id="bmHistTitle" style="flex:1;margin:0;font:700 14px var(--f-sans,system-ui,sans-serif);text-transform:uppercase;letter-spacing:.04em;color:var(--text,#fff)">Historique</h3>
        <span id="bmHistCount" style="font:600 11px var(--f-mono,monospace);color:var(--text-faint,#8a8aa4);padding:2px 8px;background:rgba(255,255,255,.04);border-radius:10px"></span>
        <button id="bmHistClose" aria-label="Fermer" style="background:transparent;color:var(--text,#fff);border:1px solid var(--border,#2a2a3e);border-radius:8px;width:32px;height:32px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0;touch-action:manipulation">✕</button>
      </div>
      <div id="bmHistList" style="overflow-y:auto;max-height:calc(80vh - 60px);padding:8px 0;-webkit-overflow-scrolling:touch"></div>
    `;
    document.body.appendChild(dlg);
    // Close on backdrop click
    dlg.addEventListener('click', e => {
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    });
    // Close button
    dlg.querySelector('#bmHistClose').addEventListener('click', () => dlg.close());
  }
  // Populate
  const titleEl = dlg.querySelector('#bmHistTitle');
  const countEl = dlg.querySelector('#bmHistCount');
  const listEl = dlg.querySelector('#bmHistList');
  if (titleEl) titleEl.textContent = 'Historique · ' + label;
  if (countEl) countEl.textContent = hist.length + ' entrée' + (hist.length > 1 ? 's' : '');
  if (listEl){
    listEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    hist.slice().reverse().forEach(h => {
      const row = document.createElement('div');
      row.style.cssText = 'padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;gap:4px';
      const txt = document.createElement('div');
      txt.style.cssText = 'font:500 14px var(--f-sans,system-ui,sans-serif);color:var(--text,#fff);line-height:1.4';
      txt.textContent = h.text || '—';
      const when = document.createElement('div');
      when.style.cssText = 'font:400 11px var(--f-mono,monospace);color:var(--text-faint,#8a8aa4)';
      when.textContent = h.archivedAt
        ? new Date(h.archivedAt).toLocaleDateString('fr-BE') + ' · ' + new Date(h.archivedAt).toLocaleTimeString('fr-BE', {hour:'2-digit', minute:'2-digit'})
        : '—';
      row.appendChild(txt);
      row.appendChild(when);
      frag.appendChild(row);
    });
    listEl.appendChild(frag);
    // Reset scroll
    listEl.scrollTop = 0;
  }
  // Open (graceful fallback if showModal pas supporté)
  try {
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  } catch(_){ dlg.setAttribute('open', ''); }
}

// Defer bookmarks render — secondary content
if ('requestIdleCallback' in window){
  requestIdleCallback(() => renderBookmarks(), { timeout: 1500 });
} else {
  setTimeout(renderBookmarks, 60);
}

// ============================================================
// TOAST / UNDO
// ============================================================
const toastEl = document.getElementById('toast');
const toastText = document.getElementById('toast-text');
const toastUndoBtn = document.getElementById('toast-undo');
let toastTimer = null, lastUndo = null;
function showToast(msg, undoFn, kind){
  if (!toastEl) return;
  lastUndo = undoFn || null;
  if (toastText) toastText.textContent = msg;
  if (toastUndoBtn) toastUndoBtn.style.display = undoFn ? '' : 'none';
  toastEl.classList.remove('freeze');
  if (kind) toastEl.classList.add(kind);
  toastEl.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, CFG.TOAST_MS);
}
function hideToast(){
  if (toastEl){ toastEl.classList.remove('show'); toastEl.classList.remove('freeze'); }
  lastUndo = null;
}
if (toastUndoBtn) toastUndoBtn.addEventListener('click', () => {
  if (lastUndo) try { lastUndo(); } catch(e){}
  hideToast();
});

// ============================================================
// QUICK-ADD FAB
// ============================================================
const qaFab = document.getElementById('qa-fab');
const qaModal = document.getElementById('qa-modal');
const qaCloseBtn = document.getElementById('qa-close');
const qaInput = document.getElementById('qa-input');
const qaTime = document.getElementById('qa-time');
const qaPrio = document.getElementById('qa-prio');
const qaCat = document.getElementById('qa-cat');
const qaSubmit = document.getElementById('qa-submit');
const qaWhenBtns = document.querySelectorAll('[data-qa-when]');
let qaWhen = 'today';
qaWhenBtns.forEach(b => {
  b.addEventListener('click', () => {
    qaWhen = b.dataset.qaWhen;
    qaWhenBtns.forEach(x => x.classList.toggle('active', x.dataset.qaWhen === qaWhen));
  });
});
function openQuickAdd(){
  if (!qaModal) return;
  qaModal.classList.add('open');
  setTimeout(() => qaInput && qaInput.focus(), 60);
}
function closeQuickAdd(){
  if (qaModal) qaModal.classList.remove('open');
  if (qaInput) qaInput.value = '';
  if (qaTime) qaTime.value = '';
  if (qaPrio) qaPrio.value = 'med';
  if (qaCat) qaCat.value = '';
  qaWhen = 'today';
  qaWhenBtns.forEach(x => x.classList.toggle('active', x.dataset.qaWhen === 'today'));
}
function submitQuickAdd(){
  const title = qaInput ? qaInput.value.trim() : '';
  if (!title){ if (qaInput) qaInput.focus(); return; }
  const targetDate = qaWhen === 'tomorrow' ? addDays(new Date(), 1) : new Date();
  const arr = loadTasks(targetDate);
  const newId = 't_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  arr.push({
    id: newId, title,
    time: qaTime ? qaTime.value || '' : '',
    prio: qaPrio ? qaPrio.value || 'med' : 'med',
    cat: qaCat ? qaCat.value || '' : '',
    done: false,
    createdAt: new Date().toISOString()
  });
  saveTasks(targetDate, arr);
  if (qaWhen === 'today') renderTasks();
  closeQuickAdd();
  const where = qaWhen === 'tomorrow' ? 'demain' : 'aujourd\'hui';
  showToast('Tâche ajoutée pour '+where, () => {
    const a = loadTasks(targetDate).filter(x => x.id !== newId);
    saveTasks(targetDate, a); if (qaWhen === 'today' || true) renderTasks();
  });
}
if (qaFab) qaFab.addEventListener('click', openQuickAdd);
if (qaCloseBtn) qaCloseBtn.addEventListener('click', closeQuickAdd);
if (qaModal) qaModal.addEventListener('click', e => { if (e.target === qaModal) closeQuickAdd(); });
if (qaSubmit) qaSubmit.addEventListener('click', submitQuickAdd);
if (qaInput) qaInput.addEventListener('keydown', e => {
  if (e.key === 'Enter'){ e.preventDefault(); submitQuickAdd(); }
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', e => {
  // Cmd/Ctrl+K opens search from anywhere
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    if (typeof openSearch === 'function') openSearch();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const target = e.target;
  const isEditing = target && (target.matches('input,textarea,select') || target.isContentEditable);
  // Escape works anywhere
  if (e.key === 'Escape'){
    if (searchModal && searchModal.classList.contains('open')){ e.preventDefault(); closeSearch(); return; }
    if (focusModal && focusModal.classList.contains('open')){ e.preventDefault(); closeFocusMode(); return; }
    if (qaModal && qaModal.classList.contains('open')){ e.preventDefault(); closeQuickAdd(); return; }
    if (pomoModal && pomoModal.classList.contains('open')){ e.preventDefault(); pomoModal.classList.remove('open'); return; }
    if (isEditing){ target.blur(); return; }
    return;
  }
  if (isEditing) return;
  // Tab switch 1-9
  if (/^[1-9]$/.test(e.key)){
    const tabs = document.querySelectorAll('.tab[data-tab]');
    const idx = parseInt(e.key) - 1;
    if (tabs[idx]){ e.preventDefault(); activateTab(tabs[idx].dataset.tab); }
    return;
  }
  // N = new task
  if (e.key.toLowerCase() === 'n'){ e.preventDefault(); openQuickAdd(); return; }
  // P = pomodoro
  if (e.key.toLowerCase() === 'p'){ e.preventDefault(); if (pomoModal) pomoModal.classList.add('open'); return; }
  // T = scroll to top
  if (e.key.toLowerCase() === 't'){ e.preventDefault(); try { window.scrollTo({top:0,behavior:'smooth'}); } catch(err){ window.scrollTo(0,0); } return; }
  // F = focus mode
  if (e.key.toLowerCase() === 'f'){ e.preventDefault(); if (typeof openFocusMode === 'function') openFocusMode(); return; }
  // / = search (alt to Cmd-K)
  if (e.key === '/'){ e.preventDefault(); if (typeof openSearch === 'function') openSearch(); return; }
});

// ============================================================
// MONTHLY REVIEW (30-day aggregation)
// ============================================================
function refreshMonthlyReview(){
  const logs30 = allLogs(30);
  let study = 0, sport = 0, flex = 0, pages = 0, anki = 0, chess = 0, vinted = 0;
  let moodSum = 0, moodCount = 0, activeDays = 0;
  logs30.forEach(({data}) => {
    study += studyMinutes(data);
    if (data.sport) sport++; if (data.flex) flex++;
    pages += data.read||0; anki += data.anki||0;
    chess += data.chess||0; vinted += data.vinted||0;
    if (data.mood){ moodSum += data.mood; moodCount++; }
    if (countActiveDomains(data) >= ACTIVE_DAY_MIN_DOMAINS) activeDays++;
  });
  let pomos = 0;
  const t = today();
  for (let i = 0; i < 30; i++){
    const d = addDays(t, -i);
    const p = S.get('pomo_'+dateKey(d), null);
    if (p) pomos += p.count || 0;
  }
  setText('[data-mrev="study"]', fmtMin(study));
  setText('[data-mrev="sport"]', sport+' / 12');
  setText('[data-mrev="flex"]', flex+' / 20');
  setText('[data-mrev="pages"]', pages);
  setText('[data-mrev="anki"]', anki);
  setText('[data-mrev="chess"]', chess);
  setText('[data-mrev="active"]', activeDays+' / 30');
  setText('[data-mrev="mood"]', moodCount ? (moodSum/moodCount).toFixed(1)+' / 5' : '—');
  setText('[data-mrev="pomo"]', pomos);
  const title = document.getElementById('m-review-title');
  if (title){
    const d = new Date();
    title.textContent = d.getDate() === 1 ? '✨ 1er du mois — bilan' : 'Ce mois en chiffres';
  }
}

// ============================================================
// XP / RANKS / ACHIEVEMENTS — gamification layer
// ============================================================
// Rank thresholds: (level, totalXPRequired, rankName)
// XP per level grows logarithmically: L1→L2 = 100, then *1.25 per level
const XP_RANKS = [
  { lvl:1,  xp:0,     name:'Éveillé' },
  { lvl:2,  xp:100,   name:'Apprenti' },
  { lvl:3,  xp:250,   name:'Initié' },
  { lvl:4,  xp:450,   name:'Curieux' },
  { lvl:5,  xp:700,   name:'Persévérant' },
  { lvl:6,  xp:1000,  name:'Engagé' },
  { lvl:7,  xp:1400,  name:'Discipliné' },
  { lvl:8,  xp:1900,  name:'Forgeron' },
  { lvl:9,  xp:2500,  name:'Constant' },
  { lvl:10, xp:3200,  name:'Artisan' },
  { lvl:12, xp:5000,  name:'Architecte' },
  { lvl:15, xp:8500,  name:'Vétéran' },
  { lvl:18, xp:13000, name:'Tacticien' },
  { lvl:20, xp:17000, name:'Stratège' },
  { lvl:25, xp:30000, name:'Virtuose' },
  { lvl:30, xp:50000, name:'Maître' },
  { lvl:40, xp:100000,name:'Sage' },
  { lvl:50, xp:200000,name:'Légende' }
];
function rankForXp(totalXp){
  // Scan descending
  let cur = XP_RANKS[0];
  for (let i = 0; i < XP_RANKS.length; i++){
    if (totalXp >= XP_RANKS[i].xp) cur = XP_RANKS[i];
    else break;
  }
  // Compute explicit level (not just rank level)
  // Use log-ish: find largest level L such that xpForLevel(L) <= totalXp
  let lvl = 1;
  while (xpForLevel(lvl+1) <= totalXp && lvl < 99) lvl++;
  return { level: lvl, rankName: cur.name, nextXp: xpForLevel(lvl+1), curLevelXp: xpForLevel(lvl) };
}
function xpForLevel(lvl){
  // L1 = 0, L2 = 100, then geometric
  if (lvl <= 1) return 0;
  // base + sum
  let total = 0;
  let cost = 100;
  for (let i = 2; i <= lvl; i++){
    total += cost;
    cost = Math.round(cost * 1.22);
  }
  return total;
}
// Compute XP for a single day's log (deterministic — same inputs give same XP)
function xpForDay(dateObj){
  const k = dateKey(dateObj);
  const log = S.get('log_'+k, null);
  const prio = S.get('prio_'+k, null);
  const pomo = S.get('pomo_'+k, null);
  let xp = 0;
  const breakdown = {};
  function add(key, amt){ if (amt <= 0) return; xp += amt; breakdown[key] = (breakdown[key]||0) + amt; }
  // Priorities
  if (prio){
    const validIds = new Set(loadPrioList().map(x => x.id));
    const doneCount = Object.entries(prio).filter(([id, v]) => v && validIds.has(id)).length;
    if (doneCount > 0) add('Priorités', doneCount * 5);
  }
  if (log){
    // Study/code/nl proportional, capped
    if (log.epfc){
      let epfcXp = Math.floor(log.epfc / 30) * 10;
      if (log.epfc >= 60) epfcXp += 10; // bonus deep session
      add('EPFC', Math.min(epfcXp, 40));
    }
    if (log.code){
      add('Code', Math.min(Math.floor(log.code/15) * 8, 32));
    }
    if (log.nl){
      add('NL', Math.min(Math.floor(log.nl/15) * 6, 24));
    }
    if (log.anki) add('Anki', Math.min(Math.floor(log.anki/20) * 3, 12));
    if (log.sport) add('Sport', 25);
    if (log.flex) add('Souplesse', 10);
    if (log.read) add('Lecture', Math.min(Math.floor(log.read/10) * 5, 25));
    if (log.chess) add('Échecs', Math.min(log.chess * 2, 10));
    if (log.vinted) add('Vinted', Math.min(log.vinted * 2, 12));
    if (log.mood && log.mood >= 3) add('Humeur', 2);
    if (log.notes || log.topic) add('Journal', 3);
    if (log.wins && log.wins.some(w => (w||'').trim())) add('Gratitude', 4);
    // Meal/supp compliance
    const mealCount = log.meals ? Object.values(log.meals).filter(Boolean).length : 0;
    const suppCount = log.supp ? Object.values(log.supp).filter(Boolean).length : 0;
    if (mealCount >= 6) add('6 repas', 10);
    else if (mealCount >= 4) add('Repas', 5);
    if (suppCount >= 3) add('Stack', 6);
    // Bonus: active day (4+ domains)
    const domains = countActiveDomains(log);
    if (domains >= ACTIVE_DAY_MIN_DOMAINS) add('Journée active', 15);
    if (domains >= 6) add('Journée exceptionnelle', 25);
  }
  // Pomodoros
  if (pomo && pomo.count) add('Pomodoros', Math.min(pomo.count * 4, 40));
  return { xp, breakdown };
}
// Cumulative XP from CFG.START_DATE to today (inclusive)
function totalXp(){
  const t0 = today();
  let total = 0;
  let days = dateDiffDays(t0, CFG.START_DATE);
  if (days < 0) return 0;
  for (let i = 0; i <= days; i++){
    const d = addDays(CFG.START_DATE, i);
    total += xpForDay(d).xp;
  }
  return total;
}
// Streak bonus: add flat XP per full week (7 days) and per full month (30) of streak
function streakBonus(){
  const s = parseInt(document.getElementById('st-streak')?.textContent || '0');
  let bonus = 0;
  if (s >= 7) bonus += 20;
  if (s >= 14) bonus += 30;
  if (s >= 30) bonus += 75;
  if (s >= 60) bonus += 150;
  if (s >= 100) bonus += 300;
  return bonus;
}
function renderXpWidget(){
  const host = document.getElementById('xp-widget');
  if (!host) return;
  const total = totalXp() + streakBonus();
  const r = rankForXp(total);
  const xpIntoLevel = total - r.curLevelXp;
  const xpForThisLevel = r.nextXp - r.curLevelXp;
  const pct = xpForThisLevel > 0 ? Math.min(100, (xpIntoLevel/xpForThisLevel)*100) : 100;
  setText('#xp-level-badge', r.level);
  setText('#xp-rank-name', r.rankName);
  setText('#xp-level-label', '· Niv. ' + r.level);
  setText('#xp-current', total.toLocaleString('fr-BE'));
  setText('#xp-next', (r.nextXp - total).toLocaleString('fr-BE'));
  const bar = document.getElementById('xp-bar');
  if (bar) bar.style.width = pct.toFixed(1)+'%';
  const txt = document.getElementById('xp-bar-text');
  if (txt) txt.textContent = xpIntoLevel.toLocaleString('fr-BE')+' / '+xpForThisLevel.toLocaleString('fr-BE')+' XP';
  // Breakdown today
  const todayBd = xpForDay(new Date()).breakdown;
  const bd = document.getElementById('xp-breakdown');
  if (bd){
    bd.innerHTML = '';
    const entries = Object.entries(todayBd).sort((a,b) => b[1]-a[1]);
    if (entries.length === 0){
      bd.innerHTML = '<span style="color:var(--text-faint);font-style:italic;font-size:11px">Logge aujourd\'hui pour gagner de l\'XP</span>';
    } else {
      const todayXp = entries.reduce((s,[,v]) => s+v, 0);
      const head = document.createElement('span');
      head.className = 'xp-chip new';
      head.innerHTML = 'Aujourd\'hui · <b>+'+todayXp+' XP</b>';
      bd.appendChild(head);
      entries.slice(0, 6).forEach(([k, v]) => {
        const c = document.createElement('span');
        c.className = 'xp-chip';
        c.innerHTML = k+' · <b>+'+v+'</b>';
        bd.appendChild(c);
      });
    }
  }
  // Detect level-up: compare to last saved
  const lastLvl = S.get('xp_last_level', 1);
  if (r.level > lastLvl){
    S.set('xp_last_level', r.level);
    try { showToast('🎉 Niveau '+r.level+' ! Rang : '+r.rankName, null, 'levelup'); } catch(e){}
    try { beep(880, 200); setTimeout(()=>beep(1320, 300), 220); } catch(e){}
    hapticSuccess();
    try { burstConfetti(document.getElementById('xp-widget')); } catch(_){}
  } else if (r.level < lastLvl){
    // Never demote the saved level (prevents noisy state); but keep counter stable
    S.set('xp_last_level', lastLvl);
  } else {
    S.set('xp_last_level', r.level);
  }
  // Refresh achievements (deferred — not critical for first paint)
  if ('requestIdleCallback' in window){
    requestIdleCallback(() => renderAchievements(total), { timeout: 2000 });
  } else {
    setTimeout(() => renderAchievements(total), 0);
  }
}

// ============================================================
// ACHIEVEMENTS
// ============================================================
const ACHIEVEMENTS = [
  { id:'first_log',       icon:'📝', name:'Premier pas',         desc:'1er log enregistré',                test:c => c.logCount > 0 },
  { id:'first_streak_7',  icon:'🔥', name:'Semaine pleine',      desc:'Streak de 7 jours',                 test:c => c.bestStreak >= 7 },
  { id:'streak_30',       icon:'🏆', name:'Marathonien',         desc:'Streak de 30 jours',                test:c => c.bestStreak >= 30 },
  { id:'streak_100',      icon:'💎', name:'Centurion',           desc:'Streak de 100 jours',               test:c => c.bestStreak >= 100 },
  { id:'pomo_25',         icon:'⏱', name:'Focus',                desc:'25 pomodoros cumulés',              test:c => c.pomoTotal >= 25 },
  { id:'pomo_100',        icon:'🧠', name:'Concentré',           desc:'100 pomodoros cumulés',             test:c => c.pomoTotal >= 100 },
  { id:'pomo_500',        icon:'⚡', name:'Deep worker',          desc:'500 pomodoros cumulés',             test:c => c.pomoTotal >= 500 },
  { id:'study_100h',      icon:'🎓', name:'100h d\'étude',        desc:'100 h cumulées (EPFC+Code+NL)',    test:c => c.studyMinutes >= 6000 },
  { id:'study_500h',      icon:'📚', name:'500h d\'étude',        desc:'500 h cumulées',                    test:c => c.studyMinutes >= 30000 },
  { id:'sport_50',        icon:'💪', name:'50 séances',           desc:'50 séances de sport',               test:c => c.sportSessions >= 50 },
  { id:'flex_100',        icon:'🧘', name:'100 étirements',       desc:'100 séances de souplesse',          test:c => c.flexSessions >= 100 },
  { id:'read_1000',       icon:'📖', name:'Bibliophage',          desc:'1000 pages lues',                   test:c => c.pagesRead >= 1000 },
  { id:'chess_100',       icon:'♟', name:'Centurion d\'échecs',   desc:'100 parties',                       test:c => c.chessGames >= 100 },
  { id:'vinted_first',    icon:'🛍', name:'Premier euro',         desc:'1ère vente Vinted',                 test:() => (S.get('vinted_items',[])||[]).some(x => x.status==='sold') },
  { id:'vinted_10_sales', icon:'💰', name:'10 ventes',            desc:'10 articles vendus',                test:() => (S.get('vinted_items',[])||[]).filter(x => x.status==='sold').length >= 10 },
  { id:'mood_tracker',    icon:'😊', name:'Introspectif',         desc:'30 jours avec humeur loggée',       test:c => c.daysWithMood >= 30 },
  { id:'weekly_reviewer', icon:'📋', name:'Réviseur',             desc:'4 weekly reviews complétées',       test:c => c.wrCount >= 4 },
  { id:'level_10',        icon:'⭐', name:'Niveau 10',            desc:'Atteindre le niveau 10',            test:c => c.level >= 10 },
  { id:'level_25',        icon:'🌟', name:'Niveau 25',            desc:'Atteindre le niveau 25',            test:c => c.level >= 25 },
  { id:'all_domains_1d',  icon:'🎯', name:'Full stack du jour',   desc:'8+ domaines cochés en un seul jour',test:c => c.maxDomainsOneDay >= 8 },
  { id:'focus_10min_1d',  icon:'🎧', name:'Session focus',         desc:'4 pomodoros en 1 jour',             test:c => c.maxPomoOneDay >= 4 }
];
// Build achievement context in a single storage pass — cheap even with 1000s of entries
function buildAchievementContext(totalXpVal){
  const all = S.all();
  const ctx = {
    logCount: 0, studyMinutes: 0, sportSessions: 0, flexSessions: 0,
    pagesRead: 0, chessGames: 0, daysWithMood: 0,
    pomoTotal: 0, maxPomoOneDay: 0, maxDomainsOneDay: 0,
    wrCount: 0,
    bestStreak: S.get('best_streak', 0) || 0,
    level: rankForXp(totalXpVal || 0).level
  };
  Object.keys(all).forEach(k => {
    if (k.startsWith('log_')){
      const l = all[k]; if (!l) return;
      ctx.logCount++;
      ctx.studyMinutes += (l.epfc||0)+(l.code||0)+(l.nl||0);
      if (l.sport) ctx.sportSessions++;
      if (l.flex) ctx.flexSessions++;
      ctx.pagesRead += l.read||0;
      ctx.chessGames += l.chess||0;
      if (l.mood > 0) ctx.daysWithMood++;
      let c = 0;
      ['epfc','code','nl','read','chess','vinted','anki'].forEach(x => { if (l[x]) c++; });
      if (l.sport) c++; if (l.flex) c++;
      if (l.meals && Object.values(l.meals).filter(Boolean).length >= 4) c++;
      if (c > ctx.maxDomainsOneDay) ctx.maxDomainsOneDay = c;
    } else if (k.startsWith('pomo_')){
      const p = all[k]; if (!p) return;
      ctx.pomoTotal += p.count || 0;
      if ((p.count||0) > ctx.maxPomoOneDay) ctx.maxPomoOneDay = p.count;
    } else if (k.startsWith('wr_')){
      ctx.wrCount++;
    }
  });
  return ctx;
}
function renderAchievements(totalXpVal){
  const host = document.getElementById('achievements');
  if (!host) return;
  const ctx = buildAchievementContext(totalXpVal);
  const unlocked = S.get('ach_unlocked', {});
  let newlyUnlocked = [];
  ACHIEVEMENTS.forEach(a => {
    const isNow = !!a.test(ctx);
    if (isNow && !unlocked[a.id]){
      unlocked[a.id] = new Date().toISOString();
      newlyUnlocked.push(a);
    }
  });
  if (newlyUnlocked.length > 0){
    S.set('ach_unlocked', unlocked);
    newlyUnlocked.forEach(a => {
      try { showToast('🏆 Succès débloqué : '+a.name, null, 'levelup'); } catch(e){}
    });
    try { hapticSuccess(); } catch(_){}
    try { burstConfetti(document.getElementById('achievements')); } catch(_){}
  }
  host.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const isUnlocked = !!unlocked[a.id];
    const el = document.createElement('div');
    el.className = 'ach' + (isUnlocked ? ' unlocked' : '');
    el.title = isUnlocked ? 'Débloqué le '+new Date(unlocked[a.id]).toLocaleDateString('fr-BE') : 'Non débloqué — '+a.desc;
    el.innerHTML =
      '<span class="ach-icon">'+a.icon+'</span>'+
      '<div class="ach-name">'+a.name+'</div>'+
      '<div class="ach-desc">'+a.desc+'</div>';
    host.appendChild(el);
  });
}

// Initial XP widget render — deferred since not critical for first paint
if ('requestIdleCallback' in window){
  requestIdleCallback(() => renderXpWidget(), { timeout: 1500 });
} else {
  setTimeout(renderXpWidget, 80);
}
function ensureStreakFreezes(){
  const mk = monthKey(new Date());
  const obj = S.get('streak_freezes', {});
  if (!obj[mk]){
    // Clean old months (keep last 3)
    const keys = Object.keys(obj).sort().slice(-2);
    const fresh = {};
    keys.forEach(k => { fresh[k] = obj[k]; });
    fresh[mk] = { available: 2, used: 0 };
    S.set('streak_freezes', fresh);
    return fresh[mk];
  }
  return obj[mk];
}
function consumeFreeze(){
  const mk = monthKey(new Date());
  const obj = S.get('streak_freezes', {});
  if (!obj[mk] || obj[mk].available <= 0) return false;
  obj[mk].available--;
  obj[mk].used++;
  S.set('streak_freezes', obj);
  return true;
}
function renderFreezeBadge(){
  const t = ensureStreakFreezes();
  // Attach to the streak stat on home
  const streakStat = document.querySelector('#st-streak')?.parentElement;
  if (!streakStat) return;
  let badge = streakStat.querySelector('.freeze-badge');
  if (!badge){
    badge = document.createElement('span');
    badge.className = 'freeze-badge';
    const label = streakStat.querySelector('.stat-l');
    if (label) label.appendChild(badge);
  }
  badge.innerHTML = '❄️ '+t.available+' jetons';
  badge.title = t.available+' jetons de "streak freeze" ce mois-ci. Un jeton se consomme automatiquement quand tu rates une journée, pour éviter de casser ta série.';
}

// Refresh streak badge once freeze helpers are defined (updateStreak runs in refreshDerived at init)
if (typeof renderFreezeBadge === 'function') renderFreezeBadge();

// ============================================================
// AUTO TOC — per long tab, injected at top, anchored to section-titles
// ============================================================
function buildTocs(){
  // Tabs that deserve a TOC (content-heavy or with >= 4 section-title)
  const tabsWithToc = ['epfc','code','ia','nl','chess','finance','nutrition','flex','sport','routine','plan','social','home'];
  tabsWithToc.forEach(name => {
    const page = document.getElementById('p-'+name) || document.querySelector('[data-page="'+name+'"]');
    if (!page) return;
    // Skip if already has a TOC
    if (page.querySelector('.toc')) return;
    const h2s = Array.from(page.querySelectorAll(':scope > h2.section-title'));
    // Also include section-titles inside accordions? They are wrapped, so walk 2 levels
    if (h2s.length < 3) return; // don't clutter short pages
    const toc = document.createElement('nav');
    toc.className = 'toc';
    toc.setAttribute('aria-label', 'Sommaire de l\'onglet');
    toc.innerHTML = '<span class="toc-lbl">Sommaire</span>';
    h2s.forEach((h2, i) => {
      const id = 'toc-'+name+'-'+i;
      h2.id = id;
      const a = document.createElement('a');
      a.href = '#'+id;
      a.textContent = h2.textContent.trim().replace(/[·\s]+$/,'').slice(0, 32);
      a.addEventListener('click', e => {
        e.preventDefault();
        h2.scrollIntoView({ behavior:'smooth', block:'start' });
        h2.style.transition = 'color .3s'; const orig = h2.style.color;
        h2.style.color = 'var(--flame)';
        setTimeout(() => { h2.style.color = orig; }, 1200);
      });
      toc.appendChild(a);
    });
    // Insert TOC right after page-header or page-kicker/page-title block
    const header = page.querySelector('.page-header') || page.querySelector('.page-kicker')?.parentElement;
    if (header && header.nextSibling) header.parentNode.insertBefore(toc, header.nextSibling);
    else page.insertBefore(toc, page.firstChild);
  });
}
// buildTocs is disabled — TOC/sommaire creates visual clutter on every tab.
// setTimeout(buildTocs, 100); // DISABLED

// ============================================================
// ONBOARDING — shown only on fresh install (no data yet)
// ============================================================
(function onboarding(){
  const el = document.getElementById('onboarding');
  if (!el) return;
  const dismissed = S.get('onboarding_dismissed', false);
  // Show if never dismissed AND user has no data yet
  const firstInstall = !dismissed && Object.keys(S.all()).filter(k => !k.startsWith('__')).length <= 2;
  if (firstInstall){
    el.style.display = '';
    el.classList.remove('hidden');
  }
  const btn = document.getElementById('onboarding-dismiss');
  if (btn) btn.addEventListener('click', () => {
    S.set('onboarding_dismissed', true);
    el.style.display = 'none';
  });
})();

// ============================================================
// SPORT SET TRACKER — sets/reps/poids par exo, avec historique
// ============================================================
// Parse exo list from each day's dlist (one exo per <li>, even with " · " multi)
function parseExos(dayId){
  const view = document.getElementById('day-'+dayId);
  if (!view) return [];
  // Take the first set of <li> from the first card (ignore any other dlist added later)
  const lis = view.querySelectorAll('.card > ul.dlist > li');
  const exos = [];
  lis.forEach(li => {
    const k = li.querySelector('.k')?.textContent?.trim();
    if (!k) return;
    // Some <li> group multiple exos via " · "
    const parts = k.split(/\s·\s/).map(s => s.trim()).filter(Boolean);
    parts.forEach(name => {
      // Limit length
      exos.push({ name: name.slice(0, 50) });
    });
  });
  return exos;
}
function setDataKey(dayId){ return 'setdata_'+dayId; }
function loadSetData(dayId){
  // { exoId: { lastSessions: [{date, sets:[{w,r}]}], current: {sets:[{w,r}]} } }
  return S.get(setDataKey(dayId), {});
}
function saveSetData(dayId, data){
  if (!data || Object.keys(data).length === 0) S.del(setDataKey(dayId));
  else S.set(setDataKey(dayId), data);
}
function exoIdOf(name){ return 'e_'+name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0, 30); }

function renderSetTracker(dayId){
  const host = document.querySelector('.set-tracker[data-set-tracker="'+dayId+'"]');
  if (!host) return;
  const exos = parseExos(dayId);
  if (exos.length === 0){ host.innerHTML = ''; return; }
  const data = loadSetData(dayId);
  const t = dateKey(new Date());
  host.innerHTML = '';
  // Header
  const head = document.createElement('div');
  head.className = 'set-tracker-head';
  head.innerHTML = '<span>🏋️ Tracker séance · <b>'+exos.length+'</b> exos</span><button class="set-clear" type="button" data-act="finish">✓ Terminer la séance</button>';
  host.appendChild(head);
  exos.forEach(exo => {
    const id = exoIdOf(exo.name);
    const rec = data[id] || { lastSessions:[], current:{ date:t, sets:[{w:'',r:''}] } };
    // Ensure 'current' exists
    if (!rec.current) rec.current = { date:t, sets:[{w:'',r:''}] };
    // If the current session is from a past day, archive it before starting a new one
    if (rec.current.date && rec.current.date !== t){
      // Only archive if there's non-empty sets
      const hasVal = (rec.current.sets||[]).some(s => (s.w||'')!=='' || (s.r||'')!=='');
      if (hasVal){ rec.lastSessions = (rec.lastSessions||[]).concat([rec.current]).slice(-8); }
      rec.current = { date:t, sets:[{w:'',r:''}] };
      data[id] = rec;
      saveSetData(dayId, data);
    }
    const block = document.createElement('div');
    block.className = 'set-tracker-block';
    block.style.cssText = 'margin-top:10px;padding:8px 10px;border-radius:8px;background:rgba(12,12,20,.35);border:1px solid var(--border-soft)';
    // Name + last session comparison
    const last = (rec.lastSessions || []).slice(-1)[0];
    let lastText = '';
    if (last){
      const topSet = last.sets.filter(s => s.w || s.r).slice(-1)[0];
      if (topSet) lastText = 'Dernière fois : <b>'+(topSet.w||'-')+'kg × '+(topSet.r||'-')+'r</b>';
    }
    block.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px">'+
        '<div style="font:600 12px var(--f-sans);color:var(--text);line-height:1.3">'+escapeHtml(exo.name)+'</div>'+
        '<div style="font:500 10.5px var(--f-mono);color:var(--text-faint);text-align:right">'+(lastText || '<span style="font-style:italic">première session</span>')+'</div>'+
      '</div>'+
      '<div class="set-row"><span class="set-row-lbl-h">#</span><span class="set-row-lbl-h">Poids (kg)</span><span class="set-row-lbl-h">Reps</span><span class="set-row-lbl-h" style="text-align:center">vs last</span></div>'+
      '<div data-sets-container></div>'+
      '<button class="set-add" data-act="addset" type="button">+ Ajouter une série</button>';
    host.appendChild(block);
    const container = block.querySelector('[data-sets-container]');
    renderSets(container, rec, dayId, id);
    // Wire add-set
    block.querySelector('[data-act="addset"]').addEventListener('click', () => {
      const d = loadSetData(dayId);
      if (!d[id]) d[id] = { lastSessions:[], current:{ date:t, sets:[] } };
      if (!d[id].current) d[id].current = { date:t, sets:[] };
      d[id].current.sets.push({ w:'', r:'' });
      saveSetData(dayId, d);
      renderSets(container, d[id], dayId, id);
    });
  });
  // Finish session button
  host.querySelector('[data-act="finish"]').addEventListener('click', () => {
    if (!confirm('Archiver la séance du jour ? (les valeurs seront dans "Dernière fois" pour la prochaine séance)')) return;
    const d = loadSetData(dayId);
    let archived = 0;
    Object.keys(d).forEach(id => {
      if (d[id].current && (d[id].current.sets||[]).some(s => (s.w||'')!=='' || (s.r||'')!=='')){
        d[id].lastSessions = (d[id].lastSessions||[]).concat([d[id].current]).slice(-8);
        d[id].current = { date:t, sets:[{w:'',r:''}] };
        archived++;
      }
    });
    saveSetData(dayId, d);
    renderSetTracker(dayId);
    if (archived > 0) showToast('Séance archivée ('+archived+' exos)');
    else showToast('Aucune donnée à archiver');
  });
}
function renderSets(container, rec, dayId, id){
  container.innerHTML = '';
  const last = (rec.lastSessions || []).slice(-1)[0];
  (rec.current.sets || [{w:'',r:''}]).forEach((s, i) => {
    const lastSet = last && last.sets[i];
    const row = document.createElement('div');
    row.className = 'set-row';
    let diffText = '', diffClass = 'same';
    if (lastSet && s.w && s.r){
      // Calc delta load = (kg*reps) now vs last
      const nowLoad = (+s.w||0) * (+s.r||0);
      const lastLoad = (+lastSet.w||0) * (+lastSet.r||0);
      if (nowLoad > lastLoad){ diffText = '↗ +'+Math.round(nowLoad-lastLoad); diffClass = 'up'; }
      else if (nowLoad < lastLoad){ diffText = '↘ '+Math.round(nowLoad-lastLoad); diffClass = 'down'; }
      else diffText = '= same';
    } else if (lastSet && (lastSet.w || lastSet.r)){
      diffText = 'was '+(lastSet.w||'-')+'×'+(lastSet.r||'-');
    }
    row.innerHTML =
      '<div style="font:700 10px var(--f-mono);color:var(--text-faint);text-align:center">'+(i+1)+'</div>'+
      '<input type="number" inputmode="decimal" step="0.5" min="0" max="999" placeholder="kg" value="'+(s.w||'')+'" data-set-idx="'+i+'" data-set-field="w">'+
      '<input type="number" inputmode="numeric" step="1" min="0" max="99" placeholder="reps" value="'+(s.r||'')+'" data-set-idx="'+i+'" data-set-field="r">'+
      '<span class="set-last '+diffClass+'">'+(diffText||'—')+'</span>';
    // Ensure delete button if > 1 set
    if ((rec.current.sets||[]).length > 1){
      const del = document.createElement('button');
      del.className = 'set-del'; del.type = 'button'; del.setAttribute('aria-label', 'Supprimer la série');
      del.textContent = '✕';
      del.addEventListener('click', () => {
        const d = loadSetData(dayId);
        if (!d[id]) return;
        d[id].current.sets.splice(i, 1);
        saveSetData(dayId, d);
        renderSets(container, d[id], dayId, id);
      });
      row.appendChild(del);
    }
    container.appendChild(row);
  });
  // Wire input changes
  container.querySelectorAll('input[data-set-field]').forEach(inp => {
    inp.addEventListener('input', () => {
      const d = loadSetData(dayId);
      if (!d[id]) d[id] = { lastSessions:[], current:{ date:dateKey(new Date()), sets:[] } };
      if (!d[id].current) d[id].current = { date:dateKey(new Date()), sets:[] };
      const setIdx = parseInt(inp.dataset.setIdx);
      if (!d[id].current.sets[setIdx]) d[id].current.sets[setIdx] = { w:'', r:'' };
      d[id].current.sets[setIdx][inp.dataset.setField] = inp.value;
      saveSetData(dayId, d);
      // Delta recompute (light) — just re-render sets for this exo
      setTimeout(() => renderSets(container, d[id], dayId, id), 0);
    });
  });
}
function renderAllSetTrackers(){
  ['d1','d2','d3','d4','d5','d6'].forEach(renderSetTracker);
}
renderAllSetTrackers();

// ============================================================
// ACTIVE PHASE HIGHLIGHTING (chess by Elo, NL by manual progress)
// ============================================================
function markActivePhases(){
  // CHESS: phase defined by Elo ranges
  // Phase 1: 0-800 · Phase 2: 800-1200 · Phase 3: 1200+
  const elo = parseInt(S.get('mini_elo', '') || '0');
  const chessPage = document.querySelector('[data-page="chess"]');
  if (chessPage && elo){
    const phases = chessPage.querySelectorAll('.phase');
    phases.forEach(p => p.classList.remove('active-phase'));
    phases.forEach(p => p.querySelector('.phase-current-badge')?.remove());
    let target = -1;
    if (elo < 800) target = 0;
    else if (elo < 1200) target = 1;
    else target = 2;
    if (target >= 0 && phases[target]){
      phases[target].classList.add('active-phase');
      const h3 = phases[target].querySelector('.phase-head h3');
      if (h3 && !h3.querySelector('.phase-current-badge')){
        const b = document.createElement('span');
        b.className = 'phase-current-badge';
        b.textContent = 'Ici (' + elo + ')';
        h3.appendChild(b);
      }
    }
  }
  // NL: phase by stored state
  const nlPhase = S.get('nl_phase', 'A1'); // A1/A2/B1/B2
  const nlPage = document.querySelector('[data-page="nl"]');
  if (nlPage){
    const phases = nlPage.querySelectorAll('.phase');
    phases.forEach(p => p.classList.remove('active-phase'));
    phases.forEach(p => p.querySelector('.phase-current-badge')?.remove());
    const phaseIdx = { 'A1':0, 'A2':1, 'B1':2, 'B2':3 }[nlPhase] ?? 0;
    if (phases[phaseIdx]){
      phases[phaseIdx].classList.add('active-phase');
      const h3 = phases[phaseIdx].querySelector('.phase-head h3');
      if (h3 && !h3.querySelector('.phase-current-badge')){
        const b = document.createElement('span');
        b.className = 'phase-current-badge';
        b.textContent = 'En cours';
        h3.appendChild(b);
      }
    }
  }
}
markActivePhases();
// Refresh when mini-trackers update (elo is the one that matters)
document.querySelectorAll('input[data-mini="elo"]').forEach(inp => {
  inp.addEventListener('input', () => setTimeout(markActivePhases, 50));
});
const focusFab = document.getElementById('focus-fab');
const focusModal = document.getElementById('focus-mode');
const focusCloseBtn = document.getElementById('focus-close');
const focusTimeEl = document.getElementById('focus-time');
const focusTitleEl = document.getElementById('focus-title-el');
const focusDescEl = document.getElementById('focus-desc');
const focusBmEl = document.getElementById('focus-bookmark');
const focusBmLbl = document.getElementById('focus-bm-lbl');
const focusBmText = document.getElementById('focus-bm-text');
const focusPomoBtn = document.getElementById('focus-pomo');
const focusDoneBtn = document.getElementById('focus-done');
let focusCurrentDotClass = null;

function getCurrentBlock(){
  const visible = document.querySelector('.shift-view:not(.hidden)');
  if (!visible) return null;
  const items = Array.from(visible.querySelectorAll('.tl-item'));
  const d = new Date(); const cur = d.getHours()*60 + d.getMinutes();
  const times = items.map(it => parseTimeMin(it.querySelector('.tl-time')?.textContent || ''));
  let active = -1;
  for (let i = 0; i < times.length; i++){
    if (times[i] === null) continue;
    const next = times.slice(i+1).find(x => x !== null);
    if (times[i] <= cur && (next === undefined || cur < next)) active = i;
  }
  if (active < 0) return null;
  const it = items[active];
  const time = it.querySelector('.tl-time')?.textContent || '';
  const name = it.querySelector('.tl-name')?.textContent || 'Bloc en cours';
  const desc = it.querySelector('.tl-desc')?.textContent || '';
  const dot = it.querySelector('.tl-dot');
  const dotClasses = dot ? Array.from(dot.classList).filter(c => c !== 'tl-dot') : [];
  return { time, name, desc, dotClass: dotClasses[0] || null };
}
function openFocusMode(){
  const block = getCurrentBlock();
  if (!focusModal) return;
  focusModal.classList.add('open');
  if (!block){
    focusTimeEl.textContent = '';
    focusTitleEl.innerHTML = '<span class="focus-empty-title">Temps libre</span>';
    focusDescEl.innerHTML = '<span class="focus-empty-sub">Aucun bloc routine en cours. Profite, ou lance un Pomodoro libre.</span>';
    focusBmEl.classList.add('hidden');
    focusCurrentDotClass = null;
    return;
  }
  focusCurrentDotClass = block.dotClass;
  focusTimeEl.textContent = block.time;
  focusTitleEl.textContent = block.name;
  focusDescEl.textContent = block.desc;
  // Bookmark matching
  const bmKey = block.dotClass ? DOT_TO_BM[block.dotClass] : null;
  if (bmKey){
    const bm = loadBookmarks()[bmKey];
    if (bm && bm.text){
      const dom = BOOKMARK_DOMAINS.find(x => x.key === bmKey);
      focusBmLbl.textContent = 'Reprendre · ' + (dom ? dom.label : bmKey);
      focusBmText.textContent = bm.text;
      focusBmEl.classList.remove('hidden');
    } else {
      focusBmEl.classList.add('hidden');
    }
  } else {
    focusBmEl.classList.add('hidden');
  }
}
function closeFocusMode(){ if (focusModal) focusModal.classList.remove('open'); }
if (focusFab) focusFab.addEventListener('click', openFocusMode);
if (focusCloseBtn) focusCloseBtn.addEventListener('click', closeFocusMode);
if (focusModal) focusModal.addEventListener('click', e => { if (e.target === focusModal) closeFocusMode(); });
if (focusPomoBtn) focusPomoBtn.addEventListener('click', () => {
  closeFocusMode();
  // Pre-tag the pomodoro based on the current block domain
  const dotToTag = { study:'epfc', code:'code', nl:'nl', ai:'ia', read:'read', vinted:'vinted' };
  const tag = focusCurrentDotClass ? dotToTag[focusCurrentDotClass] : null;
  if (tag){ pomoState.tag = tag; S.set('pomo_last_tag', tag); renderPomoTag(); }
  if (pomoModal) pomoModal.classList.add('open');
});
if (focusDoneBtn) focusDoneBtn.addEventListener('click', () => {
  // Mark current block as completed manually (stored per day)
  const t = today(); const k = dateKey(t);
  const completed = S.get('routine_done_'+k, []);
  const block = getCurrentBlock();
  if (block){
    const id = block.time + '|' + block.name.slice(0, 40);
    if (!completed.includes(id)){
      completed.push(id);
      S.set('routine_done_'+k, completed);
      showToast('✓ Bloc marqué terminé');
      refreshRoutineProgress();
    }
  }
  closeFocusMode();
});

// ============================================================
// SEARCH PALETTE (Cmd/Ctrl+K) — indexes all content from tabs
// ============================================================
const searchTrigger = document.getElementById('search-trigger');
const searchModal = document.getElementById('search-modal');
const searchCloseBtn = document.getElementById('search-close');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchCount = document.getElementById('search-count');
const TAB_LABELS = {
  home:'Aujourd\'hui', stats:'Stats', routine:'Routine', sport:'Sport', flex:'Souplesse',
  nutrition:'Nutrition', epfc:'EPFC', code:'Code', ia:'IA', vinted:'Vinted',
  nl:'NL', chess:'Échecs', finance:'Finance', social:'Social', plan:'Plan'
};
let searchIndex = null;
function buildSearchIndex(){
  const idx = [];
  document.querySelectorAll('section.page').forEach(sec => {
    const name = sec.dataset.page || (sec.id||'').replace(/^p-/, '');
    if (!name) return;
    // Index dlist <li>, cards titles, callouts, phase h3, level-title
    sec.querySelectorAll('.dlist li').forEach(li => {
      const k = li.querySelector('.k')?.textContent?.trim();
      const note = li.querySelector('.note, .v')?.textContent?.trim() || '';
      if (k) idx.push({ tab:name, title:k, meta:note.slice(0,90), el:li, icon:'📄' });
    });
    sec.querySelectorAll('h3').forEach(h3 => {
      const txt = h3.textContent.trim();
      if (txt && txt.length > 3) idx.push({ tab:name, title:txt, meta:'', el:h3, icon:'📌' });
    });
    sec.querySelectorAll('.phase-head h3').forEach(h3 => {
      const phase = h3.closest('.phase');
      const tag = phase?.querySelector('.phase-tag')?.textContent?.trim() || '';
      idx.push({ tab:name, title:h3.textContent.trim(), meta:tag, el:phase, icon:'🎯' });
    });
    sec.querySelectorAll('.level-title').forEach(lv => {
      idx.push({ tab:name, title:lv.textContent.trim(), meta:'Souplesse', el:lv.closest('.level-card'), icon:'🧘' });
    });
    sec.querySelectorAll('.callout').forEach(c => {
      const strong = c.querySelector('strong')?.textContent?.trim();
      if (strong && strong.length > 3) idx.push({ tab:name, title:strong, meta:c.textContent.trim().slice(0,100), el:c, icon:'💡' });
    });
    sec.querySelectorAll('.recipe-name').forEach(r => {
      idx.push({ tab:name, title:r.textContent.trim(), meta:'Recette', el:r.closest('.recipe'), icon:'🥤' });
    });
  });
  return idx;
}
function openSearch(){
  if (!searchModal) return;
  if (!searchIndex) searchIndex = buildSearchIndex();
  searchModal.classList.add('open');
  setTimeout(() => { if (searchInput){ searchInput.value = ''; searchInput.focus(); renderSearchResults(''); }}, 50);
}
function closeSearch(){ if (searchModal) searchModal.classList.remove('open'); }
let searchSel = 0;
function renderSearchResults(q){
  if (!searchResults || !searchIndex) return;
  const Q = q.toLowerCase().trim();
  let hits;
  if (!Q){
    hits = searchIndex.slice(0, 12); // recent-ish (just first 12)
  } else {
    hits = searchIndex.filter(it =>
      it.title.toLowerCase().includes(Q) || (it.meta && it.meta.toLowerCase().includes(Q))
    ).slice(0, 50);
  }
  searchResults.innerHTML = '';
  if (hits.length === 0){
    searchResults.innerHTML = '<div class="search-empty">Aucun résultat pour «&nbsp;'+escapeHtml(q)+'&nbsp;»</div>';
    if (searchCount) searchCount.textContent = '0 résultat';
    return;
  }
  searchSel = 0;
  hits.forEach((h, i) => {
    const el = document.createElement('div');
    el.className = 'search-result' + (i === 0 ? ' selected' : '');
    el.innerHTML =
      '<div class="search-result-icon">'+h.icon+'</div>'+
      '<div class="search-result-body">'+
        '<div class="search-result-title">'+escapeHtml(h.title)+'</div>'+
        (h.meta ? '<div class="search-result-meta">'+escapeHtml(h.meta.slice(0,80))+'</div>' : '')+
      '</div>'+
      '<span class="search-result-tab">'+(TAB_LABELS[h.tab]||h.tab)+'</span>';
    el.addEventListener('click', () => openSearchHit(h));
    el.addEventListener('mouseenter', () => {
      searchSel = i;
      searchResults.querySelectorAll('.search-result').forEach((x,j) => x.classList.toggle('selected', j===i));
    });
    searchResults.appendChild(el);
  });
  if (searchCount) searchCount.textContent = hits.length+' résultat'+(hits.length>1?'s':'');
}
function openSearchHit(h){
  closeSearch();
  activateTab(h.tab);
  setTimeout(() => {
    if (h.el && h.el.scrollIntoView){
      h.el.scrollIntoView({ behavior:'smooth', block:'center' });
      h.el.style.outline = '2px solid var(--flame)';
      h.el.style.outlineOffset = '4px';
      h.el.style.transition = 'outline .3s';
      setTimeout(() => { h.el.style.outline = ''; h.el.style.outlineOffset = ''; }, 1400);
    }
  }, 200);
}
if (searchTrigger) searchTrigger.addEventListener('click', openSearch);
if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);
if (searchModal) searchModal.addEventListener('click', e => { if (e.target === searchModal) closeSearch(); });
if (searchInput){
  let si = null;
  searchInput.addEventListener('input', () => {
    if (si) clearTimeout(si);
    si = setTimeout(() => renderSearchResults(searchInput.value), 100);
  });
  searchInput.addEventListener('keydown', e => {
    const rows = Array.from(searchResults.querySelectorAll('.search-result'));
    if (e.key === 'ArrowDown'){ e.preventDefault(); searchSel = Math.min(rows.length-1, searchSel+1); rows.forEach((r,i)=>r.classList.toggle('selected', i===searchSel)); rows[searchSel]?.scrollIntoView({block:'nearest'}); }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); searchSel = Math.max(0, searchSel-1); rows.forEach((r,i)=>r.classList.toggle('selected', i===searchSel)); rows[searchSel]?.scrollIntoView({block:'nearest'}); }
    else if (e.key === 'Enter'){
      e.preventDefault();
      const hits = searchIndex ? searchIndex.filter(it => {
        const Q = searchInput.value.toLowerCase().trim();
        if (!Q) return true;
        return it.title.toLowerCase().includes(Q) || (it.meta && it.meta.toLowerCase().includes(Q));
      }).slice(0, 50) : [];
      if (hits[searchSel]) openSearchHit(hits[searchSel]);
    }
  });
}

// ============================================================
// ROUTINE AUTO-CHECK (auto-mark blocks done from log data)
// ============================================================
function refreshRoutineProgress(){
  const visible = document.querySelector('.shift-view:not(.hidden)');
  if (!visible){ setText('#routine-progress', '—'); return; }
  const t = today(); const k = dateKey(t);
  const manualDone = new Set(S.get('routine_done_'+k, []));
  const log = loadLog(t);
  const items = Array.from(visible.querySelectorAll('.tl-item'));
  let total = 0, done = 0;
  items.forEach(it => {
    total++;
    const dot = it.querySelector('.tl-dot');
    const dotClasses = dot ? Array.from(dot.classList).filter(c => c !== 'tl-dot') : [];
    const type = dotClasses[0];
    const time = it.querySelector('.tl-time')?.textContent || '';
    const name = it.querySelector('.tl-name')?.textContent || '';
    const id = time + '|' + name.slice(0,40);
    let auto = false;
    // Heuristic auto-check: if there's log data matching this domain, mark done
    if (type === 'study' && (log.epfc||0) >= 30) auto = true;
    else if (type === 'code' && (log.code||0) >= 15) auto = true;
    else if (type === 'nl' && (log.nl||0) >= 20) auto = true;
    else if (type === 'sport' && log.sport) auto = true;
    else if (type === 'read' && (log.read||0) >= 5) auto = true;
    // Manual override: "marked done" in focus mode
    if (manualDone.has(id)) auto = true;
    // Also check if block's start time is past & we have a sensible "done" signal — very conservative
    it.classList.toggle('completed', auto);
    if (auto) done++;
  });
  const pct = total ? Math.round(done*100/total) : 0;
  const prog = document.getElementById('routine-progress');
  if (prog){
    if (total === 0){ prog.textContent = '—'; return; }
    prog.innerHTML = 'Routine aujourd\'hui : <b>'+done+' / '+total+'</b> blocs validés ('+pct+'%)';
  }
}

// IA tab uses the same accordion wrapper
wrapAccordionsFor('p-ia');
// Also apply it to plan so the 3-section layout lives inside accordions
// (wrapAccordionsFor('p-plan') is already called earlier — idempotent check inside)

// Initial render of routine progress + hooked in refreshDerived via a small wrapper
refreshRoutineProgress();
let lastTodayKey = dateKey(new Date());
function checkDayChange(){
  const newTodayKey = dateKey(new Date());
  if (newTodayKey !== lastTodayKey){
    lastTodayKey = newTodayKey;
    currentLogDate = today();
    renderLogNav(); renderLogForm();
    renderTasks(); renderGoals(); renderShiftPlanner();
    renderTrainingHome(); renderTrainingSport();
    renderAdmin();
    renderBookmarks();
    refreshMonthlyReview();
    refreshDerived();
    applyWakeOffset();
  }
}
// checkDayChange is now triggered by the master tick (every 60s)
// Also check when the tab regains focus — timers get throttled in background
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDayChange(); });
window.addEventListener('focus', checkDayChange);

// ============================================================
// INITIAL RENDERS
// ============================================================
refreshDerived();
// renderStats is called by activateTab when stats tab is active, and by refreshDerived when stats is open.

})();

/* UD v73 note: command cockpit is injected at the end of index.html so it runs after legacy hotfixes. */
