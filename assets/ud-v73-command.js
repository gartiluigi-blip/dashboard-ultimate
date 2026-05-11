/* ═══════════════════════════════════════════════════════════
   UD v73 · Command cockpit
   - Mobile bottom nav: 5 boutons, tous les modules conservés.
   - Mission maintenant: priorité calculée sur le noyau actif.
   - Correctif audit: pas de monkey patch window.go, pas de storage isolé si un store global existe.
   - Bridge architecture: expose UDStore + UDRouter si le core ne les expose pas encore.
   ═══════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__udV73Command) return;
  window.__udV73Command = true;

  const NS = 'dashv2_';
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc = window.escapeHTML || (s => s == null ? '' : String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  const pad = n => String(n).padStart(2,'0');
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
  const nowMin = () => { const d = new Date(); return d.getHours()*60 + d.getMinutes(); };

  function ensureUDStore(){
    if (window.UDStore && typeof window.UDStore.get === 'function' && typeof window.UDStore.set === 'function') return window.UDStore;
    const subs = new Set();
    const api = {
      get(k,d=null){
        try { const v = localStorage.getItem(NS+k); return v == null ? d : JSON.parse(v); }
        catch(_) { return d; }
      },
      set(k,v){
        try {
          localStorage.setItem(NS+k, JSON.stringify(v));
          notify(k, v);
          return true;
        } catch(_) { return false; }
      },
      del(k){
        try {
          localStorage.removeItem(NS+k);
          notify(k, undefined);
          return true;
        } catch(_) { return false; }
      },
      all(){
        const out = {};
        try {
          for (let i = 0; i < localStorage.length; i++){
            const key = localStorage.key(i);
            if (key && key.startsWith(NS)){
              try { out[key.slice(NS.length)] = JSON.parse(localStorage.getItem(key)); } catch(_){}
            }
          }
        } catch(_){}
        return out;
      },
      subscribe(fn){
        if (typeof fn !== 'function') return () => {};
        subs.add(fn);
        return () => subs.delete(fn);
      },
      subscribePrefix(prefix, fn){
        return api.subscribe(batch => {
          for (const [k,v] of batch){
            if (k.startsWith(prefix)){ fn(k, v, batch); return; }
          }
        });
      }
    };
    function notify(k,v){
      const batch = new Map([[k,v]]);
      subs.forEach(fn => { try { fn(batch); } catch(e){ console.error('UDStore subscriber error', e); } });
      try { window.dispatchEvent(new CustomEvent('udstore:change', { detail:{ key:k, value:v } })); } catch(_){}
    }
    window.UDStore = api;
    return api;
  }

  function ensureUDRouter(){
    if (window.UDRouter && typeof window.UDRouter.go === 'function') return window.UDRouter;
    const subs = new Set();
    const api = {
      go(tab){
        const name = String(tab || 'home');
        try {
          if (typeof window.go === 'function') window.go(name);
          else fallbackGo(name);
        } catch(_) { fallbackGo(name); }
        notify(name);
      },
      current(){
        const a = $('.tab[data-tab].active');
        if (a) return a.dataset.tab;
        const p = $('section.page.active');
        if (p) return p.dataset.page || p.id.replace(/^p-/,'');
        return ensureUDStore().get('tab','home');
      },
      subscribe(fn){
        if (typeof fn !== 'function') return () => {};
        subs.add(fn);
        return () => subs.delete(fn);
      }
    };
    function notify(tab){
      subs.forEach(fn => { try { fn(tab); } catch(e){ console.error('UDRouter subscriber error', e); } });
      try { window.dispatchEvent(new CustomEvent('udrouter:change', { detail:{ tab } })); } catch(_){}
    }
    window.UDRouter = api;
    return api;
  }

  const Store = ensureUDStore();
  const Router = ensureUDRouter();
  const read = (k,d=null) => Store.get(k,d);
  const write = (k,v) => Store.set(k,v);

  const STUDY_ITEMS = [
    ['epfc','🎓 EPFC','niveau 1 actif, N2/N3 en parking'],
    ['code','🧪 Exercices','preuves liées aux matières EPFC'],
    ['nl','🇳🇱 Néerlandais','optionnel hors EPFC'],
    ['ia','🤖 IA Lab','bonus data/ML, 1 bloc/semaine'],
    ['trading','🔌 IoT Lab','bonus hardware/réseau, 1 bloc/semaine'],
    ['plan','📋 Plan','roadmap et ressources']
  ];
  const PLUS_ITEMS = [
    ['sport','💪 Sport','séance et cycle'],
    ['flex','🧘 Souplesse','mobilité et C7'],
    ['nutrition','🥩 Nutrition','repas, eau, protéines'],
    ['vinted','🛍️ Vinted','business et ventes'],
    ['finance','💰 Finance','ETF, budget, rappels'],
    ['chess','♟️ Échecs','Elo et tactiques'],
    ['settings','⚙️ Paramètres','sauvegarde et config']
  ];
  const DOMAIN = {
    epfc:{tab:'epfc', icon:'🎓', title:'EPFC N1', minutes:60, score:100, proof:'1 preuve sur une matière N1 : PRM3, BDO1/BDG4, WEB1, BNE2, STO4/SYS4, MAP4/STA1, PAN2 ou ICO1'},
    code:{tab:'code', icon:'🧪', title:'Exercice/preuve EPFC', minutes:35, score:78, proof:'1 exercice lié à une UE N1 : Python, SQL, Web, OS, réseau ou structure ordinateur. Pas de gros projet'}
  };

  function go(tab){
    Router.go(tab);
    syncNav(tab);
    closeDrawer();
    setTimeout(updateMission,120);
  }
  function fallbackGo(tab){
    $$('.tab[data-tab]').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
    $$('section.page').forEach(p=>p.classList.toggle('active', (p.dataset.page || p.id.replace(/^p-/,''))===tab));
    write('tab',tab);
    try { window.scrollTo({top:0,behavior:'smooth'}); } catch(_) { window.scrollTo(0,0); }
  }

  function currentTab(){ return Router.current(); }
  function syncNav(tab=currentTab()){
    $$('#ud-v73-bottomnav [data-go-tab]').forEach(b=>b.classList.toggle('active', b.dataset.goTab===tab));
    const studyTabs = new Set(STUDY_ITEMS.map(x=>x[0]));
    const studyBtn = $('#ud-v73-bottomnav [data-v73-menu="study"]');
    if (studyBtn) studyBtn.classList.toggle('active', studyTabs.has(tab));
    const plusTabs = new Set(PLUS_ITEMS.map(x=>x[0]));
    const plusBtn = $('#ud-v73-bottomnav [data-v73-menu="plus"]');
    if (plusBtn) plusBtn.classList.toggle('active', plusTabs.has(tab));
  }

  function buildBottomNav(){
    if ($('#ud-v73-bottomnav')) return;
    const nav = document.createElement('nav');
    nav.id = 'ud-v73-bottomnav';
    nav.setAttribute('aria-label','Navigation rapide mobile');
    nav.innerHTML = [
      ['home','🏠','Now'],
      ['routine','📅','Routine'],
      ['study','🎓','Études','menu'],
      ['stats','📊','Stats'],
      ['plus','☰','Plus','menu']
    ].map(x => x[3] === 'menu'
      ? `<button type="button" data-v73-menu="${x[0]}"><span class="ico">${x[1]}</span><span>${x[2]}</span></button>`
      : `<button type="button" data-go-tab="${x[0]}"><span class="ico">${x[1]}</span><span>${x[2]}</span></button>`
    ).join('');
    document.body.appendChild(nav);

    const drawer = document.createElement('div');
    drawer.id = 'ud-v73-drawer';
    drawer.setAttribute('aria-hidden','true');
    drawer.innerHTML = '<div class="ud-v73-drawer-card" role="dialog" aria-modal="true" aria-label="Modules"><div class="ud-v73-drawer-head"><div class="ud-v73-drawer-title" id="ud-v73-drawer-title">Modules</div><button class="ud-v73-drawer-close" type="button" aria-label="Fermer">×</button></div><div class="ud-v73-drawer-grid" id="ud-v73-drawer-grid"></div></div>';
    document.body.appendChild(drawer);

    nav.addEventListener('click', e => {
      const goBtn = e.target.closest('[data-go-tab]');
      if (goBtn) return go(goBtn.dataset.goTab);
      const menu = e.target.closest('[data-v73-menu]');
      if (menu) return openDrawer(menu.dataset.v73Menu);
    }, true);
    drawer.addEventListener('click', e => {
      if (e.target.id === 'ud-v73-drawer' || e.target.closest('.ud-v73-drawer-close')) return closeDrawer();
      const b = e.target.closest('[data-drawer-tab]');
      if (b) return go(b.dataset.drawerTab);
    }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); }, true);
    syncNav();
  }
  function openDrawer(kind){
    const drawer = $('#ud-v73-drawer');
    const grid = $('#ud-v73-drawer-grid');
    const title = $('#ud-v73-drawer-title');
    if (!drawer || !grid) return;
    const items = kind === 'study' ? STUDY_ITEMS : PLUS_ITEMS;
    if (title) title.textContent = kind === 'study' ? 'Modules étude' : 'Tous les autres modules';
    grid.innerHTML = items.map(([tab,label,sub]) => `<button type="button" data-drawer-tab="${esc(tab)}">${esc(label)}<small>${esc(sub)}</small></button>`).join('');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden','false');
  }
  function closeDrawer(){
    const drawer = $('#ud-v73-drawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
  }

  function getLog(){
    const d = todayKey();
    const direct = read('log_'+d, null);
    const st = read('state', null);
    const nested = st && st.logs && st.logs[d] ? st.logs[d] : null;
    const legacy = read('logs_'+d, null);
    return Object.assign({}, legacy || {}, nested || {}, direct || {});
  }
  function minutesFrom(log, key){
    const v = log[key];
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return Number(v) || 0;
    if (v && typeof v === 'object') return Number(v.minutes || v.min || v.duration || 0) || 0;
    return 0;
  }
  function skipped(domain){ return !!read(`v73_skip_${todayKey()}_${domain}`, false); }
  function snoozed(){
    const until = Number(read('v73_snooze_until',0));
    return until && Date.now() < until;
  }
  function pickMission(){
    const log = getLog();
    const t = nowMin();
    const afterWork = t >= 17*60;
    const morning = t < 11*60;
    const weekend = [0,6].includes(new Date().getDay());
    const items = Object.entries(DOMAIN).map(([key,d]) => {
      const done = minutesFrom(log, key);
      let score = d.score + Math.max(0, d.minutes - done) * 1.2;
      if (key === 'epfc' && (morning || afterWork)) score += 18;
      if (key === 'code' && weekend) score += 12;
      if (done >= d.minutes) score -= 50;
      if (skipped(key)) score -= 100;
      return {key, ...d, done, remaining:Math.max(0,d.minutes-done), score};
    }).sort((a,b)=>b.score-a.score);
    let m = items[0];
    if (!m || snoozed()){
      m = {key:'routine', tab:'routine', icon:'📅', title:'Routine', minutes:15, done:0, remaining:15, score:0, proof:'Valide le prochain bloc ou note pourquoi il saute'};
    }
    const duration = m.key === 'routine' ? 15 : Math.max(20, Math.min(75, Math.round((m.remaining || m.minutes) / 5) * 5));
    const why = m.key === 'routine'
      ? 'Mission temporaire : action reportée. Reprends la routine et ferme une boucle.'
      : `${m.done} min fait aujourd’hui / objectif ${m.minutes} min. Tu fermes ce déficit maintenant.`;
    return {...m, duration, why};
  }

  function updateMission(){
    const box = $('#next-action');
    if (!box) return;
    const m = pickMission();
    box.classList.add('ud-v73-mission');
    const label = $('#na-label',box), cd = $('#na-countdown',box), title = $('#na-title',box), sub = $('#na-sub',box);
    if (label) label.textContent = 'MISSION MAINTENANT';
    if (cd) cd.textContent = `${m.duration} min · ordre prioritaire`;
    if (title) title.textContent = `${m.icon} ${m.title} · ${m.duration} min`;
    if (sub) sub.textContent = m.why;
    const start = $('#na-start',box), snooze = $('#na-snooze',box), skip = $('#na-skip',box);
    if (start){ start.textContent = `Ouvrir ${m.title}`; start.dataset.v73Target = m.tab; }
    if (snooze){ snooze.textContent = '+15 min'; snooze.dataset.v73Mission = m.key; }
    if (skip){ skip.textContent = 'Skipper aujourd’hui'; skip.dataset.v73Mission = m.key; }
    let proof = $('#ud-v73-proof', box);
    if (!proof){
      proof = document.createElement('div');
      proof.id = 'ud-v73-proof';
      proof.className = 'ud-v73-proof';
      box.appendChild(proof);
    }
    proof.innerHTML = `<div class="ud-v73-proof-item"><b>Preuve</b>${esc(m.proof)}</div><div class="ud-v73-proof-item"><b>Règle</b>Une mission. Pas de zapping.</div><div class="ud-v73-proof-item"><b>Après</b>Log rapide + prochaine reprise.</div>`;
  }

  function bindMissionButtons(){
    document.addEventListener('click', e => {
      const start = e.target.closest('#na-start[data-v73-target]');
      if (start){ e.preventDefault(); e.stopPropagation(); return go(start.dataset.v73Target || 'home'); }
      const snooze = e.target.closest('#na-snooze[data-v73-mission]');
      if (snooze){
        e.preventDefault(); e.stopPropagation();
        write('v73_snooze_until', Date.now() + 15*60*1000);
        updateMission();
        toast('Mission reportée de 15 min. Pas plus.');
        return;
      }
      const skip = e.target.closest('#na-skip[data-v73-mission]');
      if (skip){
        e.preventDefault(); e.stopPropagation();
        write(`v73_skip_${todayKey()}_${skip.dataset.v73Mission}`, true);
        updateMission();
        toast('Mission skippée pour aujourd’hui. Le déficit reste visible.');
      }
    }, true);
  }
  function toast(msg){
    try { if (typeof window.showToast === 'function') return window.showToast(msg); } catch(_){}
    const t = $('#toast'), txt = $('#toast-text');
    if (t && txt){ txt.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
  }

  function hardenExternalLinks(){
    $$('a[href^="http"]').forEach(a => {
      try {
        if (new URL(a.href).origin !== location.origin){
          a.target = a.target || '_blank';
          a.rel = 'noopener noreferrer';
        }
      } catch(_){}
    });
  }

  function boot(){
    document.body.classList.add('ud-v73-ready');
    buildBottomNav();
    bindMissionButtons();
    hardenExternalLinks();
    updateMission();
    setInterval(updateMission, 60*1000);
    Router.subscribe(tab => setTimeout(() => syncNav(tab), 20));
    document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.tab[data-tab]')) setTimeout(()=>syncNav(),80); }, true);
    window.UD_V73 = { updateMission, pickMission, go, openDrawer, syncNav, Store, Router };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
