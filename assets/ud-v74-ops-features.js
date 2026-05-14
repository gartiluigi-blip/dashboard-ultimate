/* UD v74 · Ops Command Suite */
(function () {
  'use strict';

  if (window.__UDV74Ops) return;
  window.__UDV74Ops = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const Store = window.UDStore;
  const Router = window.UDRouter;

  if (!Store || !Router) {
    console.error('UD v74 requires core store/router modules before boot.');
    return;
  }

  const EPFC = [
    ['PRM3', 'Programmation', '20 exercices Python boucles/listes/fonctions'],
    ['BDO1', 'SQL base', '20 requêtes SELECT/WHERE/JOIN'],
    ['BDG4', 'SQL exploitation', 'mini base + GROUP BY/sous-requêtes'],
    ['WEB1', 'Web', 'page responsive HTML/CSS/JS + DOM'],
    ['BNE2', 'Réseaux', 'fiche OSI/TCP-IP + 10 Q/R'],
    ['STO4', 'Structure ordinateur', 'binaire/hex + CPU/RAM/bus/ALU'],
    ['SYS4', 'Systèmes', 'Windows/Linux : fichiers/process/droits'],
    ['MAP4', 'Maths info', 'logique, ensembles, fonctions'],
    ['STA1', 'Stats', 'moyenne/variance/proba'],
    ['PAN2', 'Analyse', 'diagramme + besoins'],
    ['ICO1', 'Communication', 'mail pro + synthèse']
  ];

  const financeKeys = [
    'income',
    'rent',
    'energy',
    'internet',
    'phone',
    'gym',
    'insurance',
    'contribution',
    'target',
    'goal'
  ];

  function escapeHtml(value) {
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

  function today(offset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function numberValue(value) {
    return Number(String(value ?? '').replace(',', '.')) || 0;
  }

  function uid() {
    return 'v74_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function toast(message) {
    try {
      if (window.showToast) window.showToast(message);
      else console.log('[v74]', message);
    } catch (_) {}
  }

  function loadCss() {
    if ($('#ud-v74-css')) return;
    const link = document.createElement('link');
    link.id = 'ud-v74-css';
    link.rel = 'stylesheet';
    link.href = '/assets/styles/ops.css';
    document.head.appendChild(link);
  }

  function buildShell() {
    if ($('#ud-v74-fab')) return;

    const button = document.createElement('button');
    button.id = 'ud-v74-fab';
    button.type = 'button';
    button.textContent = '⚡ Ops';

    const panel = document.createElement('section');
    panel.id = 'ud-v74-panel';
    panel.innerHTML = [
      '<div class="v74-head">',
      '<h3>⚡ Ops Command Suite</h3>',
      '<button class="v74-x" type="button" data-x>×</button>',
      '</div>',
      '<div class="v74-tabs" id="v74-tabs"></div>',
      '<div id="v74-body"></div>'
    ].join('');

    document.body.append(button, panel);
    button.addEventListener('click', () => panel.classList.toggle('open'));
    panel.addEventListener('click', handleClick);
    panel.addEventListener('input', handleInput);
  }

  function renderTabs(active) {
    const tabs = [
      ['voice', 'Voice'],
      ['brief', 'Briefing'],
      ['epfc', 'EPFC'],
      ['vinted', 'Vinted'],
      ['finance', 'Finance'],
      ['weekly', 'Weekly']
    ];

    $('#v74-tabs').innerHTML = tabs.map(([key, label]) => {
      const cls = active === key ? 'active' : '';
      return `<button type="button" data-tab="${key}" class="${cls}">${label}</button>`;
    }).join('');
  }

  function render(tab = 'voice') {
    renderTabs(tab);
    const screens = { voice, brief, epfc, vinted, finance, weekly };
    (screens[tab] || voice)();
  }

  function handleClick(event) {
    if (event.target.closest('[data-x]')) {
      $('#ud-v74-panel').classList.remove('open');
      return;
    }

    const tab = event.target.closest('[data-tab]');
    if (tab) {
      render(tab.dataset.tab);
      return;
    }

    const action = event.target.closest('[data-act]');
    if (!action) return;

    const key = action.dataset.act;
    if (key === 'voice') applyVoice();
    if (key === 'brief') generateBrief();
    if (key === 'proof') saveProof(action.dataset.code);
    if (key === 'vadd') addVinted();
    if (key === 'vsold') setVintedStatus(action.dataset.id, 'vendu');
    if (key === 'vdel') deleteVinted(action.dataset.id);
    if (key === 'fsave') saveFinance();
  }

  function handleInput() {
    if ($('#fin-income')) financeCalc();
  }

  function voice() {
    $('#v74-body').innerHTML = [
      '<div class="v74-card">',
      '<h4>🎙️ Voice Command</h4>',
      '<textarea id="voice-text" class="v74-area" ',
      'placeholder="J’ai fait 45 minutes EPFC PRM3"></textarea>',
      '<button class="v74-btn primary" type="button" data-act="voice">Appliquer</button>',
      '<div class="v74-sub">Version locale : log session ou tâche rapide.</div>',
      '</div>'
    ].join('');
  }

  function applyVoice() {
    const text = $('#voice-text').value.trim();
    if (!text) return;

    const minutesMatch = text.match(/(\d+)\s*(min|minutes)/i);
    const minutes = minutesMatch ? numberValue(minutesMatch[1]) : 0;
    const lower = text.toLowerCase();

    if (minutes) {
      const module = lower.includes('code') ? 'code'
        : lower.includes('nl') ? 'nl'
          : lower.includes('sport') ? 'sport'
            : 'epfc';
      const key = 'log_' + today();
      const log = Store.get(key, {});
      log[module] = numberValue(log[module]) + minutes;
      Store.set(key, log);
      toast(module + ' +' + minutes + ' min');
      return;
    }

    const tasks = Store.get('tasks_' + today(), []);
    tasks.push({
      id: uid(),
      title: text,
      priority: 'medium',
      done: false,
      createdAt: new Date().toISOString()
    });
    Store.set('tasks_' + today(), tasks);
    toast('Tâche ajoutée');
  }

  function brief() {
    const stored = Store.get('v74_brief_' + today(), '');
    $('#v74-body').innerHTML = [
      '<div class="v74-card">',
      '<h4>🧭 Briefing du jour</h4>',
      '<button class="v74-btn primary" type="button" data-act="brief">Générer local</button>',
      '<div id="brief-out" class="v74-sub">',
      escapeHtml(stored || 'Pas encore généré.'),
      '</div></div>'
    ].join('');
  }

  function generateBrief() {
    const log = Store.get('log_' + today(), {});
    const proofs = Store.get('epfc_proofs_v1', {});
    const next = EPFC.find(item => (proofs[item[0]] || {}).status !== 'validé');
    const text = [
      'Mission: ' + (next ? next[0] + ' ' + next[1] : 'révision générale'),
      'EPFC aujourd’hui: ' + numberValue(log.epfc) + ' min',
      'Code aujourd’hui: ' + numberValue(log.code) + ' min',
      'Règle: une preuve avant tout nouveau front',
      'Action: 35 min maintenant'
    ].join('\n');

    Store.set('v74_brief_' + today(), text);
    $('#brief-out').innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  }

  function epfc() {
    const proofs = Store.get('epfc_proofs_v1', {});
    const rows = EPFC.map(([code, name, proof]) => proofRow(code, name, proof, proofs[code] || {}));
    $('#v74-body').innerHTML = '<div class="v74-card"><h4>🎓 EPFC Proof Tracker</h4>'
      + rows.join('') + '</div>';
  }

  function proofRow(code, name, proof, state) {
    const status = state.status || 'todo';
    return [
      '<div class="v74-card">',
      '<div class="v74-row">',
      `<b>${code} · ${escapeHtml(name)}</b>`,
      `<span class="v74-pill">${escapeHtml(status)}</span>`,
      '</div>',
      `<div class="v74-sub">${escapeHtml(proof)}</div>`,
      `<select class="v74-select" id="st-${code}">`,
      `<option ${status === 'todo' ? 'selected' : ''}>todo</option>`,
      `<option ${status === 'en cours' ? 'selected' : ''}>en cours</option>`,
      `<option ${status === 'validé' ? 'selected' : ''}>validé</option>`,
      '</select>',
      `<input class="v74-input" id="cf-${code}" value="${numberValue(state.confidence)}" `,
      'placeholder="confiance %">',
      `<textarea class="v74-area" id="nx-${code}" placeholder="prochaine preuve">`,
      escapeHtml(state.next || ''),
      '</textarea>',
      `<button class="v74-btn primary" type="button" data-act="proof" data-code="${code}">`,
      'Sauver</button></div>'
    ].join('');
  }

  function saveProof(code) {
    const proofs = Store.get('epfc_proofs_v1', {});
    proofs[code] = {
      status: $('#st-' + code).value,
      confidence: numberValue($('#cf-' + code).value),
      next: $('#nx-' + code).value,
      updatedAt: new Date().toISOString()
    };
    Store.set('epfc_proofs_v1', proofs);
    toast(code + ' sauvé');
    epfc();
  }

  function vinted() {
    const items = Store.get('vinted_items_v1', []);
    $('#v74-body').innerHTML = vintedForm() + items.map(vintedItem).join('');
  }

  function vintedForm() {
    return [
      '<div class="v74-card"><h4>🛍️ Vinted Profit</h4><div class="v74-grid">',
      '<input id="vn" class="v74-input" placeholder="article">',
      '<input id="vc" class="v74-input" placeholder="catégorie">',
      '<input id="vco" class="v74-input" type="number" placeholder="coût">',
      '<input id="vs" class="v74-input" type="number" placeholder="frais">',
      '<input id="vb" class="v74-input" type="number" placeholder="boost">',
      '<input id="vp" class="v74-input" type="number" placeholder="prix">',
      '</div><button class="v74-btn primary" type="button" data-act="vadd">Ajouter</button></div>'
    ].join('');
  }

  function vintedItem(item) {
    const cost = numberValue(item.cost) + numberValue(item.ship) + numberValue(item.boost);
    const margin = numberValue(item.price) - cost;
    const roi = cost ? Math.round((margin / cost) * 100) : 0;
    const marginClass = margin >= 0 ? 'v74-ok' : 'v74-bad';

    return [
      '<div class="v74-card"><div class="v74-row">',
      `<b>${escapeHtml(item.name)}</b>`,
      `<span class="v74-pill">${escapeHtml(item.status)}</span>`,
      '</div>',
      '<div class="v74-sub">',
      `coût ${cost.toFixed(2)}€ · prix ${numberValue(item.price).toFixed(2)}€ · `,
      `marge <b class="${marginClass}">${margin.toFixed(2)}€</b> · ROI ${roi}%`,
      '</div>',
      `<button class="v74-btn" type="button" data-act="vsold" data-id="${item.id}">Vendu</button>`,
      `<button class="v74-btn danger" type="button" data-act="vdel" data-id="${item.id}">Suppr</button>`,
      '</div>'
    ].join('');
  }

  function addVinted() {
    const items = Store.get('vinted_items_v1', []);
    items.unshift({
      id: uid(),
      name: $('#vn').value,
      cat: $('#vc').value,
      cost: numberValue($('#vco').value),
      ship: numberValue($('#vs').value),
      boost: numberValue($('#vb').value),
      price: numberValue($('#vp').value),
      status: 'listé',
      createdAt: new Date().toISOString()
    });
    Store.set('vinted_items_v1', items);
    vinted();
  }

  function setVintedStatus(itemId, status) {
    const items = Store.get('vinted_items_v1', []);
    Store.set('vinted_items_v1', items.map(item => item.id === itemId ? { ...item, status } : item));
    vinted();
  }

  function deleteVinted(itemId) {
    const items = Store.get('vinted_items_v1', []);
    Store.set('vinted_items_v1', items.filter(item => item.id !== itemId));
    vinted();
  }

  function finance() {
    const defaults = {
      income: 2300,
      rent: 665,
      energy: 100,
      internet: 70,
      phone: 15,
      gym: 30,
      insurance: 115,
      contribution: 500,
      target: 20,
      goal: 30000
    };
    const values = Store.get('finance_cashflow_v1', defaults);
    const inputs = financeKeys.map(key => {
      return `<input id="fin-${key}" class="v74-input" type="number" `
        + `value="${numberValue(values[key])}" placeholder="${key}">`;
    }).join('');

    $('#v74-body').innerHTML = '<div class="v74-card"><h4>💰 Cashflow</h4>'
      + inputs
      + '<button class="v74-btn primary" type="button" data-act="fsave">Sauver</button>'
      + '<div id="fin-out" class="v74-card"></div></div>';
    financeCalc();
  }

  function financeForm() {
    const values = {};
    financeKeys.forEach(key => {
      values[key] = numberValue($('#fin-' + key)?.value);
    });
    return values;
  }

  function financeCalc() {
    const values = financeForm();
    const fixed = values.rent + values.energy + values.internet + values.phone
      + values.gym + values.insurance + values.contribution;
    const savings = values.income * values.target / 100;
    const left = values.income - fixed - savings;
    const months = savings ? Math.ceil(values.goal / savings) : 0;

    $('#fin-out').innerHTML = [
      `<div class="v74-row"><span>Charges</span><b>${fixed.toFixed(2)}€</b></div>`,
      `<div class="v74-row"><span>Épargne</span><b>${savings.toFixed(2)}€</b></div>`,
      `<div class="v74-row"><span>Reste</span><b>${left.toFixed(2)}€</b></div>`,
      `<div class="v74-row"><span>Objectif apport</span><b>${months} mois</b></div>`
    ].join('');
  }

  function saveFinance() {
    Store.set('finance_cashflow_v1', financeForm());
    toast('Finance sauvée');
  }

  function weekly() {
    let epfcMinutes = 0;
    let codeMinutes = 0;
    for (let offset = 0; offset < 7; offset++) {
      const log = Store.get('log_' + today(-offset), {});
      epfcMinutes += numberValue(log.epfc);
      codeMinutes += numberValue(log.code);
    }

    const proofs = Store.get('epfc_proofs_v1', {});
    const items = Store.get('vinted_items_v1', []);
    const validated = Object.values(proofs).filter(item => item.status === 'validé').length;
    const listed = items.filter(item => item.status === 'listé').length;
    const sold = items.filter(item => item.status === 'vendu').length;

    $('#v74-body').innerHTML = [
      '<div class="v74-card"><h4>🧾 Weekly War Review</h4>',
      `<div class="v74-row"><span>EPFC</span><b>${epfcMinutes} min</b></div>`,
      `<div class="v74-row"><span>Code</span><b>${codeMinutes} min</b></div>`,
      `<div class="v74-row"><span>Preuves validées</span><b>${validated}/11</b></div>`,
      `<div class="v74-row"><span>Vinted listés/vendus</span><b>${listed}/${sold}</b></div>`,
      '<div class="v74-sub">Décision: ferme une preuve EPFC avant d’ouvrir un nouveau front.</div>',
      '</div>'
    ].join('');
  }

  function boot() {
    loadCss();
    buildShell();
    render('voice');
    window.UDV74 = { render, Store, Router, version: 'v74-storage-core' };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
