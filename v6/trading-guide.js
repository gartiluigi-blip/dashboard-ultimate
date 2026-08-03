import * as Store from './store.js';
import { activeTradingModule, tradingReadiness } from './rules.js';

const VIEW_KEY = 'ud_trading_view';
const PHASES = [
  { title: 'Comprendre les bases', detail: 'Un module à la fois. Pas de challenge, pas de statistiques.', tool: 'CME Institute + notes simples' },
  { title: 'Écrire un seul setup', detail: 'Un marché, une session, un déclencheur et une invalidation.', tool: 'TradingView avec un graphique propre' },
  { title: 'Backtester 100 cas', detail: 'Tu mesures le setup sans argent réel et sans changer les règles.', tool: 'Replay + tableur ou journal' },
  { title: 'T’entraîner en simulation', detail: 'Replay, checklist et 30 trades propres avant tout mock.', tool: 'Compte démo uniquement' },
  { title: 'Passer deux mocks', detail: 'Les règles prop firm deviennent utiles seulement maintenant.', tool: 'Simulateur + règlement officiel' }
];

const panelRules = [
  ['Gate challenge', 4],
  ['Risk engine', 4],
  ['Checklist pré-trade', 3],
  ['Journaliser un trade', 3],
  ['Plan prop firm', 4],
  ['Module ', 0],
  ['Session de travail', 2],
  ['Mock challenge', 4],
  ['Outils à maîtriser', 99],
  ['Trades récents', 3]
];

const app = document.querySelector('#app');
let scheduled = false;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function notify(message, tone = '') {
  const node = document.querySelector('#toast');
  if (!node) return;
  node.textContent = message;
  node.dataset.tone = tone;
  node.classList.add('show');
  clearTimeout(window.__udTradingGuideToast);
  window.__udTradingGuideToast = setTimeout(() => node.classList.remove('show'), 2600);
}

function getView() {
  try { return localStorage.getItem(VIEW_KEY) === 'expert' ? 'expert' : 'guided'; }
  catch { return 'guided'; }
}

function setView(view) {
  try { localStorage.setItem(VIEW_KEY, view); } catch {}
}

function phaseIndex(state, active) {
  const setupReady = Boolean(
    String(state.trading.setup?.name || '').trim()
    && String(state.trading.setup?.rules || '').trim().length >= 40
  );
  if (active.index < 4) return 0;
  if (active.index === 4 || !setupReady) return 1;
  if (active.index === 5) return 2;
  if (active.index < 10) return 3;
  return 4;
}

function phaseProgress(state) {
  const backtests = (state.trading.sessions || [])
    .filter(item => item.kind === 'backtest')
    .reduce((sum, item) => sum + Number(item.samples || 0), 0);
  const executions = (state.trading.sessions || [])
    .filter(item => item.kind === 'execution' && !item.breach).length;
  const passedMocks = (state.trading.mockChallenges || [])
    .filter(item => item.status === 'completed' && item.passed).length;
  return { backtests, executions, trades: state.trading.trades?.length || 0, passedMocks };
}

function roadmap(current) {
  return PHASES.map((phase, index) => {
    const status = index < current ? 'done' : index === current ? 'current' : 'later';
    const marker = index < current ? '✓' : index + 1;
    return `<article class="trading-stage ${status}"><span>${marker}</span><div><b>${escapeHtml(phase.title)}</b><small>${escapeHtml(index === current ? 'Étape actuelle' : index < current ? 'Acquise' : 'Plus tard')}</small></div></article>`;
  }).join('');
}

function currentInstruction(phase, active, progress, state) {
  const setupReady = String(state.trading.setup?.rules || '').trim().length >= 40;
  const instructions = [
    `Fais seulement le module « ${active.title} ». Lis les ressources indiquées, produis la preuve demandée, puis valide-le.`,
    setupReady
      ? `Ton setup est écrit. Termine maintenant le module « ${active.title} » sans ajouter un deuxième setup.`
      : 'Remplis le formulaire « Mon seul setup » ci-dessous. Ne cherche pas encore à gagner de l’argent.',
    `Accumule 100 cas sans modifier les règles après une perte. Tu en as actuellement ${progress.backtests}.`,
    `Travaille uniquement en simulation. Objectif : 10 séances propres et 30 trades journalisés. Actuellement ${progress.executions} séance(s) et ${progress.trades} trade(s).`,
    `Lance un mock complet, respecte les limites, puis recommence une seconde fois. Réussis : ${progress.passedMocks}/2.`
  ];
  return instructions[phase];
}

function setupPanel(state) {
  const setup = state.trading.setup || {};
  return `<section class="panel span-12 guide-setup-panel">
    <header class="panel-head"><span class="eyebrow">ÉTAPE 2</span><h2>Mon seul setup</h2></header>
    <p class="muted">Tu ne changes pas de stratégie pendant l’apprentissage. Écris une règle assez précise pour qu’une autre personne sache quand entrer et quand ne pas entrer.</p>
    <div class="form-grid">
      <label>Nom du setup<input id="guided-setup-name" value="${escapeHtml(setup.name || '')}" placeholder="Ex. retour sur niveau après rejet"></label>
      <label>Marché<input id="guided-setup-market" value="${escapeHtml(setup.market || 'MNQ')}"></label>
      <label>Session<input id="guided-setup-session" value="${escapeHtml(setup.session || 'New York AM')}"></label>
      <label>Plateforme<input id="guided-setup-platform" value="${escapeHtml(setup.platform || 'TradingView + simulateur')}"></label>
    </div>
    <label>Règles complètes<textarea id="guided-setup-rules" rows="5" placeholder="Contexte, déclencheur, stop, objectif et conditions de non-trade…">${escapeHtml(setup.rules || '')}</textarea></label>
    <div class="actions"><button type="button" class="btn primary" data-guide-action="save-setup">Sauver mon setup unique</button></div>
  </section>`;
}

function panelTitle(panel) {
  return panel.querySelector('.panel-head h2')?.textContent?.trim() || '';
}

function applyPanelVisibility(root, phase, expert) {
  root.querySelectorAll('.dashboard-grid > .panel').forEach(panel => {
    if (panel.id === 'trading-guide' || panel.classList.contains('guide-setup-panel')) return;
    const title = panelTitle(panel);
    const rule = panelRules.find(([prefix]) => title.startsWith(prefix));
    panel.classList.add('trading-advanced-panel');
    panel.classList.toggle('trading-guided-visible', expert || (rule && phase >= rule[1] && rule[1] !== 99));
  });
}

function restoreHeading(root) {
  const head = root.querySelector('.page-head');
  if (!head) return;
  const title = head.querySelector('h1');
  const paragraph = head.querySelector('p');
  if (title?.dataset.original) title.textContent = title.dataset.original;
  if (paragraph?.dataset.original) paragraph.textContent = paragraph.dataset.original;
  head.querySelector('.score-ring')?.classList.remove('trading-score-hidden');
}

function simplifyHeading(root, active, phase) {
  const head = root.querySelector('.page-head');
  if (!head) return;
  const title = head.querySelector('h1');
  const paragraph = head.querySelector('p');
  if (title && !title.dataset.original) title.dataset.original = title.textContent;
  if (paragraph && !paragraph.dataset.original) paragraph.dataset.original = paragraph.textContent;
  if (title) title.textContent = `Commence ici : ${active.title}`;
  if (paragraph) paragraph.textContent = phase < 4
    ? 'Ignore les règles de challenge pour le moment. Le dashboard te montre une seule étape utile.'
    : 'Tu as atteint la phase où les règles prop firm deviennent réellement nécessaires.';
  head.querySelector('.score-ring')?.classList.toggle('trading-score-hidden', phase < 4);
}

function enhanceTrading(force = false) {
  scheduled = false;
  if (!app) return;
  const eyebrow = app.querySelector('.page-head .eyebrow');
  if (!eyebrow?.textContent?.includes('PROP FIRM LAB')) return;
  if (app.querySelector('#trading-guide') && !force) return;

  app.querySelector('#trading-guide')?.remove();
  app.querySelector('.guide-setup-panel')?.remove();

  const state = Store.load();
  const active = activeTradingModule(state);
  const readiness = tradingReadiness(state);
  const phase = phaseIndex(state, active);
  const progress = phaseProgress(state);
  const view = getView();
  const expert = view === 'expert';
  const dashboard = app.querySelector('.dashboard-grid');
  if (!dashboard) return;

  app.classList.toggle('trading-guided', !expert);
  app.classList.toggle('trading-expert', expert);
  const metrics = app.querySelector('.metric-grid');
  metrics?.classList.add('trading-metrics');

  if (expert) restoreHeading(app);
  else simplifyHeading(app, active, phase);

  const phaseData = PHASES[phase];
  const guide = document.createElement('section');
  guide.id = 'trading-guide';
  guide.className = 'panel span-12 trading-guide';
  guide.innerHTML = `
    <div class="trading-guide-head">
      <div><span class="eyebrow">PARCOURS GUIDÉ · ÉTAPE ${phase + 1}/5</span><h2>${escapeHtml(phaseData.title)}</h2><p>${escapeHtml(phaseData.detail)}</p></div>
      <button type="button" class="btn quiet" data-guide-action="toggle-view">${expert ? 'Revenir au mode guidé' : 'Afficher le mode expert'}</button>
    </div>
    <div class="trading-roadmap">${roadmap(phase)}</div>
    <article class="trading-next-action">
      <span>TA SEULE ACTION MAINTENANT</span>
      <h3>${escapeHtml(currentInstruction(phase, active, progress, state))}</h3>
      <p><b>Outil utile :</b> ${escapeHtml(phaseData.tool)}.</p>
      <div class="actions"><button type="button" class="btn primary" data-guide-action="focus-current">Aller à l’action</button></div>
    </article>
    ${phase < 4 ? `<div class="callout">Les chiffres de drawdown, cohérence, profit factor et les règles de firme restent calculés en arrière-plan, mais tu n’as pas besoin de les gérer maintenant.</div>` : `<div class="callout">Readiness actuelle : ${readiness.score} %. Le challenge reste bloqué tant que toutes les preuves ne sont pas validées.</div>`}
  `;
  dashboard.prepend(guide);

  if (phase >= 1 && phase <= 3) guide.insertAdjacentHTML('afterend', setupPanel(state));
  applyPanelVisibility(app, phase, expert);
}

function scheduleEnhance() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => enhanceTrading());
}

function focusCurrent() {
  const state = Store.load();
  const active = activeTradingModule(state);
  const phase = phaseIndex(state, active);
  const selector = phase === 1 && !String(state.trading.setup?.rules || '').trim()
    ? '.guide-setup-panel'
    : phase === 2
      ? [...app.querySelectorAll('.panel')].find(panel => panelTitle(panel).startsWith('Session de travail'))
      : phase === 3
        ? [...app.querySelectorAll('.panel')].find(panel => panelTitle(panel).startsWith('Checklist pré-trade'))
        : phase === 4
          ? [...app.querySelectorAll('.panel')].find(panel => panelTitle(panel).startsWith('Mock challenge'))
          : [...app.querySelectorAll('.panel')].find(panel => panelTitle(panel).startsWith('Module '));
  const target = typeof selector === 'string' ? app.querySelector(selector) : selector;
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-guide-action]');
  if (!target) return;
  const action = target.dataset.guideAction;
  if (action === 'toggle-view') {
    setView(getView() === 'expert' ? 'guided' : 'expert');
    enhanceTrading(true);
    return;
  }
  if (action === 'focus-current') {
    focusCurrent();
    return;
  }
  if (action === 'save-setup') {
    const name = document.querySelector('#guided-setup-name')?.value.trim() || '';
    const rules = document.querySelector('#guided-setup-rules')?.value.trim() || '';
    if (name.length < 3) return notify('Donne un nom clair au setup.', 'danger');
    if (rules.length < 40) return notify('Écris au moins 40 caractères de règles précises.', 'danger');
    Store.update(state => {
      state.trading.setup.name = name;
      state.trading.setup.market = document.querySelector('#guided-setup-market')?.value.trim() || 'MNQ';
      state.trading.setup.session = document.querySelector('#guided-setup-session')?.value.trim() || 'New York AM';
      state.trading.setup.platform = document.querySelector('#guided-setup-platform')?.value.trim() || 'TradingView + simulateur';
      state.trading.setup.rules = rules;
    });
    notify('Setup unique sauvegardé. Ne le change pas pendant le backtest.');
    enhanceTrading(true);
  }
});

new MutationObserver(scheduleEnhance).observe(app, { childList: true, subtree: true });
scheduleEnhance();
