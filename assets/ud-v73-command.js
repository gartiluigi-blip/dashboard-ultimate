/* UD v73 · Command cockpit
   Mobile bottom nav, mission card, UDStore/UDRouter bridge, v74 loader. */
(function () {
  'use strict';

  if (window.__udV73Command) return;
  window.__udV73Command = true;

  const NS = 'dashv2_';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const STUDY_ITEMS = [
    ['epfc', '🎓 EPFC', 'niveau 1 actif, N2/N3 en parking'],
    ['code', '🧪 Exercices', 'preuves liées aux matières EPFC'],
    ['nl', '🇳🇱 Néerlandais', 'optionnel hors EPFC'],
    ['ia', '🤖 IA Lab', 'bonus data/ML, 1 bloc/semaine'],
    ['trading', '🔌 IoT Lab', 'bonus hardware/réseau, 1 bloc/semaine'],
    ['plan', '📋 Plan', 'roadmap et ressources']
  ];

  const PLUS_ITEMS = [
    ['sport', '💪 Sport', 'séance et cycle'],
    ['flex', '🧘 Souplesse', 'mobilité et C7'],
    ['nutrition', '🥩 Nutrition', 'repas, eau, protéines'],
    ['vinted', '🛍️ Vinted', 'business et ventes'],
    ['finance', '💰 Finance', 'ETF, budget, rappels'],
    ['chess', '♟️ Échecs', 'Elo et tactiques'],
    ['settings', '⚙️ Paramètres', 'sauvegarde et config']
  ];

  const DOMAIN = {
    epfc: {
      tab: 'epfc',
      icon: '🎓',
      title: 'EPFC N1',
      minutes: 60,
      score: 100,
      proof: '1 preuve sur une matière N1 : PRM3, BDO1/BDG4, WEB1, BNE2, STO4/SYS4, MAP4/STA1, PAN2 ou ICO1'
    },
    code: {
      tab: 'code',
      icon: '🧪',
      title: 'Exercice/preuve EPFC',
      minutes: 35,
      score: 78,
      proof: '1 exercice lié à une UE N1 : Python, SQL, Web, OS, réseau ou structure ordinateur. Pas de gros projet'
    }
  };

  function escapeHtml(value) {
    if (window.escapeHTML) return window.escapeHTML(value);
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function todayKey() {
    const date = new Date();
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function nowMinutes() {
    const date = new Date();
    return date.getHours() * 60 + date.getMinutes();
  }

  function ensureUDStore() {
    if (window.UDStore && typeof window.UDStore.get === 'function') return window.UDStore;

    const subscribers = new Set();
    const api = {
      get(key, fallback = null) {
        try {
          const raw = localStorage.getItem(NS + key);
          return raw == null ? fallback : JSON.parse(raw);
        } catch (_) {
          return fallback;
        }
      },
      set(key, value) {
        try {
          localStorage.setItem(NS + key, JSON.stringify(value));
          notify(key, value);
          return true;
        } catch (_) {
          return false;
        }
      },
      del(key) {
        try {
          localStorage.removeItem(NS + key);
          notify(key, undefined);
          return true;
        } catch (_) {
          return false;
        }
      },
      all() {
        const out = {};
        try {
          for (let index = 0; index < localStorage.length; index++) {
            const rawKey = localStorage.key(index);
            if (!rawKey || !rawKey.startsWith(NS)) continue;
            try {
              out[rawKey.slice(NS.length)] = JSON.parse(localStorage.getItem(rawKey));
            } catch (_) {}
          }
        } catch (_) {}
        return out;
      },
      subscribe(fn) {
        if (typeof fn !== 'function') return () => {};
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      },
      subscribePrefix(prefix, fn) {
        return api.subscribe(batch => {
          for (const [key, value] of batch) {
            if (key.startsWith(prefix)) {
              fn(key, value, batch);
              return;
            }
          }
        });
      }
    };

    function notify(key, value) {
      const batch = new Map([[key, value]]);
      subscribers.forEach(fn => {
        try {
          fn(batch);
        } catch (error) {
          console.error('UDStore subscriber error', error);
        }
      });
      try {
        window.dispatchEvent(new CustomEvent('udstore:change', { detail: { key, value } }));
      } catch (_) {}
    }

    window.UDStore = api;
    return api;
  }

  function ensureUDRouter() {
    if (window.UDRouter && typeof window.UDRouter.go === 'function') return window.UDRouter;

    const subscribers = new Set();
    const api = {
      go(tab) {
        const name = String(tab || 'home');
        try {
          if (typeof window.go === 'function') window.go(name);
          else fallbackGo(name);
        } catch (_) {
          fallbackGo(name);
        }
        notify(name);
      },
      current() {
        const activeTab = $('.tab[data-tab].active');
        if (activeTab) return activeTab.dataset.tab;
        const activePage = $('section.page.active');
        if (activePage) return activePage.dataset.page || activePage.id.replace(/^p-/, '');
        return ensureUDStore().get('tab', 'home');
      },
      subscribe(fn) {
        if (typeof fn !== 'function') return () => {};
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      }
    };

    function notify(tab) {
      subscribers.forEach(fn => {
        try {
          fn(tab);
        } catch (error) {
          console.error('UDRouter subscriber error', error);
        }
      });
      try {
        window.dispatchEvent(new CustomEvent('udrouter:change', { detail: { tab } }));
      } catch (_) {}
    }

    window.UDRouter = api;
    return api;
  }

  const Store = ensureUDStore();
  const Router = ensureUDRouter();
  const read = (key, fallback = null) => Store.get(key, fallback);
  const write = (key, value) => Store.set(key, value);

  function go(tab) {
    Router.go(tab);
    syncNav(tab);
    closeDrawer();
    setTimeout(updateMission, 120);
  }

  function fallbackGo(tab) {
    $$('.tab[data-tab]').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    $$('section.page').forEach(page => {
      const name = page.dataset.page || page.id.replace(/^p-/, '');
      page.classList.toggle('active', name === tab);
    });
    write('tab', tab);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (_) {
      window.scrollTo(0, 0);
    }
  }

  function currentTab() {
    return Router.current();
  }

  function syncNav(tab = currentTab()) {
    $$('#ud-v73-bottomnav [data-go-tab]').forEach(button => {
      button.classList.toggle('active', button.dataset.goTab === tab);
    });

    const studyTabs = new Set(STUDY_ITEMS.map(item => item[0]));
    const plusTabs = new Set(PLUS_ITEMS.map(item => item[0]));
    const studyButton = $('#ud-v73-bottomnav [data-v73-menu="study"]');
    const plusButton = $('#ud-v73-bottomnav [data-v73-menu="plus"]');

    if (studyButton) studyButton.classList.toggle('active', studyTabs.has(tab));
    if (plusButton) plusButton.classList.toggle('active', plusTabs.has(tab));
  }

  function buildBottomNav() {
    if ($('#ud-v73-bottomnav')) return;

    const nav = document.createElement('nav');
    nav.id = 'ud-v73-bottomnav';
    nav.setAttribute('aria-label', 'Navigation rapide mobile');
    nav.innerHTML = [
      navButton('home', '🏠', 'Now'),
      navButton('routine', '📅', 'Routine'),
      menuButton('study', '🎓', 'Études'),
      navButton('stats', '📊', 'Stats'),
      menuButton('plus', '☰', 'Plus')
    ].join('');
    document.body.appendChild(nav);

    const drawer = document.createElement('div');
    drawer.id = 'ud-v73-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = [
      '<div class="ud-v73-drawer-card" role="dialog" aria-modal="true" aria-label="Modules">',
      '<div class="ud-v73-drawer-head">',
      '<div class="ud-v73-drawer-title" id="ud-v73-drawer-title">Modules</div>',
      '<button class="ud-v73-drawer-close" type="button" aria-label="Fermer">×</button>',
      '</div><div class="ud-v73-drawer-grid" id="ud-v73-drawer-grid"></div></div>'
    ].join('');
    document.body.appendChild(drawer);

    nav.addEventListener('click', handleNavClick, true);
    drawer.addEventListener('click', handleDrawerClick, true);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeDrawer();
    }, true);
    syncNav();
  }

  function navButton(tab, icon, label) {
    return `<button type="button" data-go-tab="${tab}"><span class="ico">${icon}</span><span>${label}</span></button>`;
  }

  function menuButton(menu, icon, label) {
    return `<button type="button" data-v73-menu="${menu}"><span class="ico">${icon}</span><span>${label}</span></button>`;
  }

  function handleNavClick(event) {
    const goButton = event.target.closest('[data-go-tab]');
    if (goButton) {
      go(goButton.dataset.goTab);
      return;
    }
    const menu = event.target.closest('[data-v73-menu]');
    if (menu) openDrawer(menu.dataset.v73Menu);
  }

  function handleDrawerClick(event) {
    if (event.target.id === 'ud-v73-drawer' || event.target.closest('.ud-v73-drawer-close')) {
      closeDrawer();
      return;
    }
    const button = event.target.closest('[data-drawer-tab]');
    if (button) go(button.dataset.drawerTab);
  }

  function openDrawer(kind) {
    const drawer = $('#ud-v73-drawer');
    const grid = $('#ud-v73-drawer-grid');
    const title = $('#ud-v73-drawer-title');
    if (!drawer || !grid) return;

    const items = kind === 'study' ? STUDY_ITEMS : PLUS_ITEMS;
    if (title) title.textContent = kind === 'study' ? 'Modules étude' : 'Tous les autres modules';
    grid.innerHTML = items.map(([tab, label, sub]) => {
      return `<button type="button" data-drawer-tab="${escapeHtml(tab)}">${escapeHtml(label)}<small>${escapeHtml(sub)}</small></button>`;
    }).join('');

    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    const drawer = $('#ud-v73-drawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function getLog() {
    const day = todayKey();
    const direct = read('log_' + day, null);
    const state = read('state', null);
    const nested = state && state.logs && state.logs[day] ? state.logs[day] : null;
    const legacy = read('logs_' + day, null);
    return Object.assign({}, legacy || {}, nested || {}, direct || {});
  }

  function minutesFrom(log, key) {
    const value = log[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value) || 0;
    if (value && typeof value === 'object') {
      return Number(value.minutes || value.min || value.duration || 0) || 0;
    }
    return 0;
  }

  function skipped(domain) {
    return Boolean(read(`v73_skip_${todayKey()}_${domain}`, false));
  }

  function snoozed() {
    const until = Number(read('v73_snooze_until', 0));
    return until && Date.now() < until;
  }

  function pickMission() {
    const log = getLog();
    const minute = nowMinutes();
    const afterWork = minute >= 17 * 60;
    const morning = minute < 11 * 60;
    const weekend = [0, 6].includes(new Date().getDay());

    const items = Object.entries(DOMAIN).map(([key, domain]) => {
      const done = minutesFrom(log, key);
      let score = domain.score + Math.max(0, domain.minutes - done) * 1.2;
      if (key === 'epfc' && (morning || afterWork)) score += 18;
      if (key === 'code' && weekend) score += 12;
      if (done >= domain.minutes) score -= 50;
      if (skipped(key)) score -= 100;
      return { key, ...domain, done, remaining: Math.max(0, domain.minutes - done), score };
    }).sort((a, b) => b.score - a.score);

    let mission = items[0];
    if (!mission || snoozed()) {
      mission = {
        key: 'routine',
        tab: 'routine',
        icon: '📅',
        title: 'Routine',
        minutes: 15,
        done: 0,
        remaining: 15,
        score: 0,
        proof: 'Valide le prochain bloc ou note pourquoi il saute'
      };
    }

    const duration = mission.key === 'routine'
      ? 15
      : Math.max(20, Math.min(75, Math.round((mission.remaining || mission.minutes) / 5) * 5));
    const why = mission.key === 'routine'
      ? 'Mission temporaire : action reportée. Reprends la routine et ferme une boucle.'
      : `${mission.done} min fait aujourd’hui / objectif ${mission.minutes} min. Tu fermes ce déficit maintenant.`;

    return { ...mission, duration, why };
  }

  function updateMission() {
    const box = $('#next-action');
    if (!box) return;

    const mission = pickMission();
    box.classList.add('ud-v73-mission');
    setMissionText(box, mission);
    ensureMissionProof(box, mission);
  }

  function setMissionText(box, mission) {
    const label = $('#na-label', box);
    const countdown = $('#na-countdown', box);
    const title = $('#na-title', box);
    const sub = $('#na-sub', box);
    const start = $('#na-start', box);
    const snooze = $('#na-snooze', box);
    const skip = $('#na-skip', box);

    if (label) label.textContent = 'MISSION MAINTENANT';
    if (countdown) countdown.textContent = `${mission.duration} min · ordre prioritaire`;
    if (title) title.textContent = `${mission.icon} ${mission.title} · ${mission.duration} min`;
    if (sub) sub.textContent = mission.why;
    if (start) {
      start.textContent = `Ouvrir ${mission.title}`;
      start.dataset.v73Target = mission.tab;
    }
    if (snooze) {
      snooze.textContent = '+15 min';
      snooze.dataset.v73Mission = mission.key;
    }
    if (skip) {
      skip.textContent = 'Skipper aujourd’hui';
      skip.dataset.v73Mission = mission.key;
    }
  }

  function ensureMissionProof(box, mission) {
    let proof = $('#ud-v73-proof', box);
    if (!proof) {
      proof = document.createElement('div');
      proof.id = 'ud-v73-proof';
      proof.className = 'ud-v73-proof';
      box.appendChild(proof);
    }
    proof.innerHTML = [
      `<div class="ud-v73-proof-item"><b>Preuve</b>${escapeHtml(mission.proof)}</div>`,
      '<div class="ud-v73-proof-item"><b>Règle</b>Une mission. Pas de zapping.</div>',
      '<div class="ud-v73-proof-item"><b>Après</b>Log rapide + prochaine reprise.</div>'
    ].join('');
  }

  function bindMissionButtons() {
    document.addEventListener('click', event => {
      const start = event.target.closest('#na-start[data-v73-target]');
      if (start) {
        event.preventDefault();
        event.stopPropagation();
        go(start.dataset.v73Target || 'home');
        return;
      }

      const snooze = event.target.closest('#na-snooze[data-v73-mission]');
      if (snooze) {
        event.preventDefault();
        event.stopPropagation();
        write('v73_snooze_until', Date.now() + 15 * 60 * 1000);
        updateMission();
        toast('Mission reportée de 15 min. Pas plus.');
        return;
      }

      const skip = event.target.closest('#na-skip[data-v73-mission]');
      if (skip) {
        event.preventDefault();
        event.stopPropagation();
        write(`v73_skip_${todayKey()}_${skip.dataset.v73Mission}`, true);
        updateMission();
        toast('Mission skippée pour aujourd’hui. Le déficit reste visible.');
      }
    }, true);
  }

  function toast(message) {
    try {
      if (typeof window.showToast === 'function') return window.showToast(message);
    } catch (_) {}
    const toastBox = $('#toast');
    const text = $('#toast-text');
    if (toastBox && text) {
      text.textContent = message;
      toastBox.classList.add('show');
      setTimeout(() => toastBox.classList.remove('show'), 2200);
    }
  }

  function hardenExternalLinks() {
    $$('a[href^="http"]').forEach(anchor => {
      try {
        if (new URL(anchor.href).origin !== location.origin) {
          anchor.target = anchor.target || '_blank';
          anchor.rel = 'noopener noreferrer';
        }
      } catch (_) {}
    });
  }

  function loadV74() {
    if (window.__UDV74Ops || $('#ud-v74-loader')) return;
    const script = document.createElement('script');
    script.id = 'ud-v74-loader';
    script.src = '/assets/ud-v74-ops-features.js';
    script.defer = true;
    document.body.appendChild(script);
  }

  function boot() {
    document.body.classList.add('ud-v73-ready');
    buildBottomNav();
    bindMissionButtons();
    hardenExternalLinks();
    updateMission();
    setInterval(updateMission, 60 * 1000);
    Router.subscribe(tab => setTimeout(() => syncNav(tab), 20));
    document.addEventListener('click', event => {
      if (event.target.closest && event.target.closest('.tab[data-tab]')) {
        setTimeout(() => syncNav(), 80);
      }
    }, true);
    loadV74();
    window.UD_V73 = { updateMission, pickMission, go, openDrawer, syncNav, Store, Router, loadV74 };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
