import * as Store from './store.js';
import {
  ATHLETE_CYCLE,
  ATHLETE_QUALITIES,
  CULTURE_SHELVES,
  DEFAULT_RECURRING,
  FOOD_SUBSTITUTIONS,
  MEAL_PLAN,
  PROP_FIRM_PRESETS,
  ROUTES,
  STUDY_TRACKS,
  TRADING_CURRICULUM,
  TRADING_TOOLS
} from './content.js';
import {
  activeReadingBook,
  activeStudyResource,
  activeTradingModule,
  athleteCoverage,
  cashForecast,
  nextAthleteSession,
  nutritionTargets,
  propFirmStats,
  selectedPropPlan,
  sportProgression,
  todayOrders,
  tradingReadiness
} from './rules.js';

const app = document.querySelector('#app');
const tabs = document.querySelector('#tabs');
const clock = document.querySelector('#clock');
const toastNode = document.querySelector('#toast');
const uid = prefix => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
let route = Store.load().ui.route || 'today';

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}
function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function euro(value) { return `${num(value).toFixed(2)} €`; }
function pct(value) { return `${num(value).toFixed(1)} %`; }
function selected(value, current) { return value === current ? 'selected' : ''; }
function toast(message) {
  toastNode.textContent = message;
  toastNode.classList.add('show');
  clearTimeout(window.__udToast);
  window.__udToast = setTimeout(() => toastNode.classList.remove('show'), 2200);
}
function ensureDay(state) {
  const date = Store.localDate();
  if (!state.days[date]) state.days[date] = { energy: 3, pain: 0, availableMin: 60, waterMl: 0, proteinG: 0, completed: [], blocked: [], note: '', mode: 'auto' };
  return state.days[date];
}
function button(label, action, className = '', attrs = '') {
  return `<button type="button" class="btn ${className}" data-action="${action}" ${attrs}>${esc(label)}</button>`;
}
function card(title, body, className = '', eyebrow = '') {
  return `<section class="panel ${className}"><header class="panel-head">${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}<h2>${esc(title)}</h2></header>${body}</section>`;
}
function metric(label, value, detail = '', tone = '') {
  return `<article class="metric-card ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
}
function progress(value, max, label = '') {
  const percentage = max > 0 ? Math.max(0, Math.min(100, Math.round(num(value) / num(max, 1) * 100))) : 0;
  return `<div class="progress-wrap">${label ? `<div class="progress-label"><span>${esc(label)}</span><b>${percentage}%</b></div>` : ''}<div class="progress"><i style="width:${percentage}%"></i></div></div>`;
}
function routeButton(label, next, className = '') {
  return button(label, 'navigate', className, `data-route="${next}"`);
}
function setRoute(next) {
  route = ROUTES.some(([id]) => id === next) ? next : 'today';
  Store.update(state => { state.ui.route = route; });
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function renderNav() {
  tabs.innerHTML = ROUTES.map(([id, label]) => `<button class="tab ${route === id ? 'active' : ''}" data-action="navigate" data-route="${id}">${esc(label)}</button>`).join('');
}
function render() {
  const state = Store.load();
  renderNav();
  const views = {
    today: renderToday,
    athlete: renderAthlete,
    trading: renderTrading,
    study: renderStudy,
    library: renderLibrary,
    nutrition: renderNutrition,
    money: renderMoney,
    system: renderSystem
  };
  app.innerHTML = (views[route] || renderToday)(state);
  document.querySelector('#version')?.replaceChildren(document.createTextNode(Store.APP_VERSION));
}

function renderToday(state) {
  const day = ensureDay(state);
  const command = todayOrders(state);
  const readiness = tradingReadiness(state);
  const coverage = athleteCoverage(state);
  const weakQualities = coverage.filter(item => item.count < item.target).map(item => item.label);
  const orders = command.orders.map(order => {
    const blocked = (day.blocked || []).some(item => item.id === order.id);
    return `<article class="mission ${blocked ? 'warn' : ''}">
      <div class="mission-rank">${order.rank}</div>
      <div class="mission-main">
        <div class="tag-row"><span class="tag">${esc(order.domain)}</span><span class="tag">${order.minutes} min</span></div>
        <h3>${esc(order.title)}</h3><p>${esc(order.detail)}</p>
        ${blocked ? '<div class="callout warn">Blocage enregistré : fais la version minimale ou reporte sans dette mentale.</div>' : ''}
        <div class="actions">${routeButton('Ouvrir', order.route)}${button('Terminé', 'complete-order', 'primary', `data-id="${order.id}"`)}${button(blocked ? 'Débloquer' : 'Bloqué', 'block-order', 'quiet', `data-id="${order.id}"`)}</div>
      </div>
    </article>`;
  }).join('') || '<div class="empty">Les priorités du jour sont exécutées. Arrête d’empiler et récupère.</div>';

  return `
    <section class="hero">
      <div><span class="eyebrow">GODMODE · ${Store.localDate()}</span><h1>${command.orders.length ? 'Trois priorités. Zéro dispersion.' : 'Journée sécurisée.'}</h1>
      <p>Le cockpit arbitre entre santé, athlétisme, trading, études et lecture selon tes données réelles.</p></div>
      <div class="hero-orb"><strong>${command.orders.length}</strong><span>missions</span></div>
    </section>
    <div class="metric-grid">
      ${metric('Mode', command.modeLabel, 'calcul automatique')}
      ${metric('Énergie', `${day.energy || 3}/5`, `douleur ${day.pain || 0}/10`, num(day.pain) >= 5 ? 'danger' : '')}
      ${metric('Prop firm', `${readiness.score}%`, readiness.ready ? 'gate validé' : 'préparation en cours', readiness.ready ? 'good' : '')}
      ${metric('Lacunes physiques', `${weakQualities.length}`, weakQualities.slice(0, 2).join(' · ') || 'couverture complète')}
    </div>
    <div class="dashboard-grid">
      ${card('Contexte du jour', `<div class="form-grid">
        <label>Mode<select id="day-mode">${['auto','normal','execution','fatigue','recovery'].map(item => `<option value="${item}" ${selected(item, day.mode || 'auto')}>${item}</option>`).join('')}</select></label>
        <label>Énergie 1–5<input id="day-energy" type="number" min="1" max="5" value="${day.energy || 3}"></label>
        <label>Douleur 0–10<input id="day-pain" type="number" min="0" max="10" value="${day.pain || 0}"></label>
        <label>Temps disponible<input id="day-minutes" type="number" min="5" max="600" value="${day.availableMin || 60}"></label>
      </div><label>Note<textarea id="day-note" rows="2" placeholder="Contrainte, sommeil, symptôme, rendez-vous…">${esc(day.note || '')}</textarea></label>
      <div class="actions">${button('Recalculer', 'save-day', 'primary')}</div>`, 'span-12', 'INPUT')}
      ${card('Ordres actifs', `<div class="mission-list">${orders}</div>`, 'span-8', 'EXECUTION')}
      ${card('Capture rapide', `<div class="quick-stack">
        ${button('+250 ml eau', 'add-water', '', 'data-amount="250"')}
        ${button('+25 g protéines', 'add-protein', '', 'data-amount="25"')}
        ${routeButton('Journal trading', 'trading')}
        ${routeButton('Séance athlète', 'athlete')}
        ${routeButton('Lecture', 'library')}
      </div>`, 'span-4', 'LOG')}
    </div>`;
}

function renderAthlete(state) {
  const next = nextAthleteSession(state);
  const previous = (state.sport.sessions || []).filter(item => item.type === next.name).at(-1);
  const coverage = athleteCoverage(state);
  const exercises = next.exercises.map(drill => {
    const old = previous?.exercises?.[drill.id] || {};
    return `<article class="drill-card">
      <div class="drill-head"><div><h3>${esc(drill.name)}</h3><p>${esc(drill.note)}</p></div><span class="target">${esc(drill.target)}</span></div>
      <div class="progression">${esc(sportProgression(previous, drill))}</div>
      <div class="exercise-log" data-drill="${drill.id}">
        <input aria-label="Résultat réel" placeholder="Résultat réel : ex. 4×8 à 60 kg" value="${esc(old.actual || '')}">
        <input aria-label="RPE" type="number" min="1" max="10" placeholder="RPE" value="${esc(old.rpe || '')}">
        <input aria-label="Douleur" type="number" min="0" max="10" placeholder="Douleur" value="">
      </div>
    </article>`;
  }).join('');
  const recent = (state.sport.sessions || []).slice(-10).reverse().map(item => `<div class="history-line"><div><b>${esc(item.date)} · ${esc(item.type)}</b><small>${item.durationMin || 0} min · RPE ${item.rpe || 0} · douleur ${item.pain || 0}/10</small></div><span class="tag">${esc(item.status)}</span></div>`).join('') || '<div class="empty">Aucune séance V6.1 enregistrée.</div>';

  return `
    <section class="hero athlete-hero"><div><span class="eyebrow">HYBRID ATHLETE SYSTEM</span><h1>${esc(next.name)}</h1><p>${next.forcedRecovery ? 'Récupération imposée par tes données du jour.' : 'Le cycle avance uniquement après validation réelle.'}</p></div><div class="hero-orb"><strong>${next.index + 1}</strong><span>sur ${ATHLETE_CYCLE.length}</span></div></section>
    <div class="quality-grid">${coverage.map(item => `<article class="quality ${item.count >= item.target ? 'covered' : ''}"><span>${esc(item.label)}</span><strong>${item.count}</strong><small>14 jours</small></article>`).join('')}</div>
    <div class="dashboard-grid">
      ${card('Séance active', `<div class="tag-row">${next.qualities.map(id => `<span class="tag accent">${esc(ATHLETE_QUALITIES.find(row => row[0] === id)?.[1] || id)}</span>`).join('')}<span class="tag">${next.duration} min</span></div><div class="drill-grid">${exercises}</div>`, 'span-8', 'PROGRAMME')}
      ${card('Clôture réelle', `<div class="form-grid one-col">
        <label>Durée réelle<input id="sport-duration" type="number" min="5" max="240" value="${next.duration}"></label>
        <label>Énergie après 1–5<input id="sport-energy" type="number" min="1" max="5" value="3"></label>
        <label>RPE global 1–10<input id="sport-rpe" type="number" min="1" max="10" value="7"></label>
        <label>Douleur globale 0–10<input id="sport-pain" type="number" min="0" max="10" value="0"></label>
      </div><label>Notes<textarea id="sport-notes" rows="3" placeholder="Technique, symptômes, prochaine progression…"></textarea></label>
      <div class="actions">${button('Terminer la séance', 'complete-athlete', 'primary', `data-session="${next.id}"`)}</div>
      <div class="callout">Douleur cervicale ≥5/10, irradiation, faiblesse ou engourdissement progressif : pas de charge lourde et avis médical.</div>`, 'span-4', 'VALIDATION')}
      ${card('Architecture physique', `<div class="principles">
        <p><b>Force :</b> trois expositions structurées par cycle.</p>
        <p><b>Endurance :</b> base aérobie, intervalles et sortie longue.</p>
        <p><b>Poids du corps :</b> pompes, tirages, jambes unilatérales et tronc.</p>
        <p><b>Mobilité :</b> chevilles, hanches, thorax et récupération.</p>
        <p><b>Santé :</b> progression par exécution, douleur et fatigue.</p>
      </div>`, 'span-4', 'COUVERTURE')}
      ${card('Historique', `<div class="history">${recent}</div>`, 'span-8', 'TENDANCE')}
    </div>`;
}

function renderTrading(state) {
  const stats = propFirmStats(state);
  const readiness = tradingReadiness(state);
  const active = activeTradingModule(state);
  const plan = selectedPropPlan(state);
  const trades = (state.trading.trades || []).slice(-12).reverse().map(trade => `<div class="trade-row ${num(trade.pnl) >= 0 ? 'positive' : 'negative'}"><div><b>${esc(trade.date)} · ${esc(trade.setup || 'setup')}</b><small>${esc(trade.market || '')} · risque ${euro(trade.risk)}${trade.breach ? ' · BREACH' : ''}</small></div><strong>${num(trade.pnl) >= 0 ? '+' : ''}${euro(trade.pnl)}</strong></div>`).join('') || '<div class="empty">Aucun trade journalisé.</div>';

  return `
    <section class="hero trading-hero"><div><span class="eyebrow">PROP FIRM LAB</span><h1>${readiness.ready ? 'Gate validé : challenge autorisé' : 'Tu ne paies pas encore le challenge'}</h1><p>Objectif : survivre aux règles, prouver l’exécution, puis seulement chercher le profit.</p></div><div class="hero-orb"><strong>${readiness.score}%</strong><span>readiness</span></div></section>
    <div class="metric-grid">
      ${metric('P&L simulé', euro(stats.totalPnl), `reste ${euro(stats.remainingTarget)}`, stats.totalPnl >= 0 ? 'good' : 'danger')}
      ${metric('Drawdown max', euro(stats.maxDrawdown), `marge ${euro(stats.drawdownRemaining)}`, stats.maxDrawdown > plan.maxLoss * .7 ? 'danger' : '')}
      ${metric('Cohérence', pct(stats.consistency), `limite ${plan.consistencyPct}%`, stats.consistency > plan.consistencyPct ? 'danger' : 'good')}
      ${metric('Expectancy', euro(stats.expectancy), `${pct(stats.winRate)} win rate`)}
    </div>
    <div class="dashboard-grid">
      ${card('Paramètres officiels / personnalisés', `<div class="form-grid">
        <label>Plan<select id="prop-plan">${Object.entries(PROP_FIRM_PRESETS).map(([id, item]) => `<option value="${id}" ${selected(id, state.trading.planId)}>${esc(item.label)}</option>`).join('')}</select></label>
        <label>Compte<input id="prop-account" type="number" value="${plan.account}"></label>
        <label>Objectif<input id="prop-target" type="number" value="${plan.profitTarget}"></label>
        <label>Perte maximale<input id="prop-loss" type="number" value="${plan.maxLoss}"></label>
        <label>Mini max<input id="prop-mini" type="number" value="${plan.maxMini}"></label>
        <label>Cohérence %<input id="prop-consistency" type="number" value="${plan.consistencyPct}"></label>
      </div><div class="actions">${button('Sauver le plan', 'save-prop-plan', 'primary')}</div>
      <div class="callout">Référence intégrée : MyFundedFutures Flex 25K/50K, règles consultées en août 2026. Vérifie toujours le règlement officiel avant achat.</div>`, 'span-6', 'RÈGLES')}
      ${card('Risk engine personnel', `<div class="form-grid">
        <label>Risque / trade<input id="risk-trade" type="number" value="${state.trading.risk.riskPerTrade}"></label>
        <label>Stop journalier<input id="risk-day" type="number" value="${state.trading.risk.dailyStop}"></label>
        <label>Trades max / jour<input id="risk-count" type="number" value="${state.trading.risk.maxTrades}"></label>
        <label>Pertes consécutives max<input id="risk-losses" type="number" value="${state.trading.risk.maxConsecutiveLosses}"></label>
      </div><div class="actions">${button('Sauver le risque', 'save-risk', 'primary')}</div>
      <p class="muted">Le stop personnel doit rester nettement sous la limite de la firme. Aucun système ne garantit la réussite ni un rendement.</p>`, 'span-6', 'SURVIE')}
      ${card(`Semaine ${active.week} · ${active.title}`, `<p class="lead">${esc(active.objective)}</p>
        <div class="resource-list">${active.resources.map(resource => `<div class="resource">${esc(resource)}</div>`).join('')}</div>
        <div class="proof"><b>Preuve obligatoire :</b> ${esc(active.proof)}</div>
        <label>Preuve / résumé<textarea id="trading-proof" rows="4" placeholder="Ce que tu as produit, appris et vérifié…"></textarea></label>
        <div class="actions">${button('Valider le module', 'complete-trading-module', 'primary')}</div>
        ${progress(active.index + 1, TRADING_CURRICULUM.length, 'Parcours 12 semaines')}`, 'span-7', 'CURRICULUM')}
      ${card('Gate challenge', `<div class="criteria">${readiness.criteria.map(item => `<div class="criterion ${item.ok ? 'ok' : ''}"><span>${item.ok ? '✓' : '○'}</span><div><b>${esc(item.label)}</b>${item.value ? `<small>${esc(item.value)}</small>` : ''}</div></div>`).join('')}</div>
        <div class="actions">${button('Ajouter un mock réussi', 'add-mock', readiness.ready ? 'primary' : '')}</div>`, 'span-5', 'READINESS')}
      ${card('Routine quotidienne', `<div class="routine-grid">
        <article><b>Pré-marché · 15 min</b><p>Contexte, niveaux, news, invalidation et scénario no-trade.</p></article>
        <article><b>Replay / backtest · 45 min</b><p>Un setup, captures avant/après, résultat en R.</p></article>
        <article><b>Simulation · 45–90 min</b><p>Max ${state.trading.risk.maxTrades} trades, stop ${euro(state.trading.risk.dailyStop)}.</p></article>
        <article><b>Journal · 15 min</b><p>Qualité de décision, erreur, émotion, leçon et prochaine action.</p></article>
      </div>
      <div class="form-grid">
        <label>Type<select id="trading-session-kind"><option value="backtest">Backtest</option><option value="execution">Replay / simulation</option><option value="review">Revue</option></select></label>
        <label>Occurrences<input id="trading-samples" type="number" min="0" value="10"></label>
        <label>Durée min<input id="trading-duration" type="number" min="5" value="45"></label>
        <label>Violation ?<select id="trading-breach"><option value="false">Non</option><option value="true">Oui</option></select></label>
      </div><label>Note<textarea id="trading-session-note" rows="2"></textarea></label><div class="actions">${button('Enregistrer la session', 'log-trading-session', 'primary')}</div>`, 'span-7', 'PROCESS')}
      ${card('Setup unique', `<div class="form-grid one-col">
        <label>Marché<input id="setup-market" value="${esc(state.trading.setup.market)}"></label>
        <label>Session<input id="setup-session" value="${esc(state.trading.setup.session)}"></label>
        <label>Plateforme<input id="setup-platform" value="${esc(state.trading.setup.platform)}"></label>
        <label>Nom du setup<input id="setup-name" value="${esc(state.trading.setup.name)}"></label>
      </div><label>Règles complètes<textarea id="setup-rules" rows="5" placeholder="Contexte, trigger, stop, target, no-trade…">${esc(state.trading.setup.rules)}</textarea></label>
      <div class="actions">${button('Sauver le playbook', 'save-setup', 'primary')}</div>`, 'span-5', 'PLAYBOOK')}
      ${card('Journal de trades', `<div class="form-grid">
        <label>Date<input id="trade-date" type="date" value="${Store.localDate()}"></label>
        <label>Marché<input id="trade-market" value="${esc(state.trading.setup.market)}"></label>
        <label>Setup<input id="trade-setup" value="${esc(state.trading.setup.name)}"></label>
        <label>Risque €<input id="trade-risk" type="number" step="0.01" value="${state.trading.risk.riskPerTrade}"></label>
        <label>P&L €<input id="trade-pnl" type="number" step="0.01" value="0"></label>
        <label>Violation<select id="trade-breach"><option value="false">Non</option><option value="true">Oui</option></select></label>
      </div><label>Leçon<textarea id="trade-note" rows="2"></textarea></label><div class="actions">${button('Ajouter le trade', 'log-trade', 'primary')}</div><div class="history">${trades}</div>`, 'span-7', 'DATA')}
      ${card('Outils à maîtriser', `<div class="tool-list">${TRADING_TOOLS.map(([name, use, proof]) => `<article><h3>${esc(name)}</h3><p>${esc(use)}</p><small>${esc(proof)}</small></article>`).join('')}</div>`, 'span-5', 'STACK')}
    </div>`;
}

function renderStudy(state) {
  const active = activeStudyResource(state);
  const recent = (state.study.sessions || []).slice(-10).reverse().map(item => `<div class="history-line"><div><b>${esc(item.date)} · ${esc(item.trackLabel || item.trackId)}</b><small>${item.durationMin || 0} min · ${esc(item.proof || '')}</small></div></div>`).join('') || '<div class="empty">Aucune session récente.</div>';
  return `
    <section class="hero"><div><span class="eyebrow">APPRENTISSAGE STRUCTURÉ</span><h1>${esc(active.track.label)}</h1><p>Une ressource active, une preuve concrète, puis seulement la suivante.</p></div><div class="hero-orb"><strong>${active.index + 1}</strong><span>étape</span></div></section>
    <div class="dashboard-grid">
      ${card('Parcours', `<div class="segmented">${Object.entries(STUDY_TRACKS).map(([id, track]) => button(track.label, 'switch-study', id === active.trackId ? 'active' : '', `data-track="${id}"`)).join('')}</div>
        <div class="focus-card"><span class="eyebrow">${esc(active.resource[0])}</span><h2>${esc(active.resource[1])}</h2><p>Preuve : ${esc(active.resource[2])}</p></div>
        <div class="form-grid"><label>Durée<input id="study-duration" type="number" min="10" value="35"></label><label>Qualité 1–5<input id="study-quality" type="number" min="1" max="5" value="4"></label></div>
        <label>Preuve réelle<textarea id="study-proof" rows="4" placeholder="Code, exercices, mesures, phrases, lien ou résultat…"></textarea></label>
        <div class="actions">${button('Valider et avancer', 'complete-study', 'primary')}</div>`, 'span-7', 'FOCUS')}
      ${card('Routine', `<div class="routine-list"><p><b>5 min</b> rappel sans notes</p><p><b>25 min</b> travail actif</p><p><b>5 min</b> preuve produite</p><p><b>5 min</b> prochaine action écrite</p></div><div class="history">${recent}</div>`, 'span-5', 'MÉTHODE')}
    </div>`;
}

function renderLibrary(state) {
  const active = activeReadingBook(state);
  const recent = (state.reading.sessions || []).slice(-10).reverse().map(item => `<div class="history-line"><div><b>${esc(item.date)} · ${esc(item.title)}</b><small>${item.pages || 0} pages · ${esc(item.note || '')}</small></div></div>`).join('') || '<div class="empty">Aucune lecture enregistrée.</div>';
  return `
    <section class="hero library-hero"><div><span class="eyebrow">BIBLIOTHÈQUE PERSONNELLE</span><h1>${esc(active.book.title)}</h1><p>${esc(active.book.author)} · ${esc(active.book.category)}</p></div><div class="hero-orb"><strong>${active.index + 1}</strong><span>sur ${active.shelf.books.length}</span></div></section>
    <div class="dashboard-grid">
      ${card('Étagères', `<div class="segmented">${Object.entries(CULTURE_SHELVES).map(([id, shelf]) => button(shelf.label, 'switch-shelf', id === active.shelfId ? 'active' : '', `data-shelf="${id}"`)).join('')}</div>
      <div class="reading-focus"><h2>${esc(active.book.title)}</h2><p>${esc(active.book.author)}</p><span class="tag">${esc(active.book.category)}</span></div>
      <div class="form-grid"><label>Pages lues<input id="reading-pages" type="number" min="1" value="20"></label><label>Durée min<input id="reading-duration" type="number" min="5" value="30"></label></div>
      <label>Idée retenue<textarea id="reading-note" rows="3" placeholder="Une idée, une citation courte reformulée, une question…"></textarea></label>
      <div class="actions">${button('Enregistrer la lecture', 'log-reading', 'primary')}${button('Livre terminé', 'finish-book')}</div>`, 'span-7', '30 MIN / JOUR')}
      ${card('Système de culture', `<div class="principles"><p><b>Lundi–jeudi :</b> 30 minutes du livre actif.</p><p><b>Vendredi :</b> synthèse d’une page.</p><p><b>Week-end :</b> roman plaisir ou chapitre long.</p><p><b>Chaque livre :</b> 5 idées, 3 désaccords, 1 application.</p><p><b>Règle :</b> terminer ou abandonner consciemment, jamais accumuler.</p></div>`, 'span-5', 'ROUTINE')}
      ${card('Catalogue du parcours', `<div class="book-grid">${active.shelf.books.map((book, index) => `<article class="book ${index === active.index ? 'active' : ''}"><span>${index + 1}</span><div><h3>${esc(book.title)}</h3><p>${esc(book.author)} · ${esc(book.category)}</p></div></article>`).join('')}</div>`, 'span-7', active.shelf.label)}
      ${card('Historique', `<div class="history">${recent}</div>`, 'span-5', 'TRACE')}
    </div>`;
}

function renderNutrition(state) {
  const day = ensureDay(state);
  const targets = nutritionTargets(state.profile);
  const plan = MEAL_PLAN[new Date().getDay()] || MEAL_PLAN[1];
  const completed = new Set((state.nutrition.entries || []).filter(item => item.date === Store.localDate() && item.kind === 'meal').map(item => item.mealId));
  const calories = plan.meals.reduce((sum, meal) => sum + meal.calories, 0);
  const protein = plan.meals.reduce((sum, meal) => sum + meal.protein, 0);
  const fiber = plan.meals.reduce((sum, meal) => sum + meal.fiber, 0);
  return `
    <section class="hero nutrition-hero"><div><span class="eyebrow">NUTRITION · ${esc(plan.name)}</span><h1>Simple, mesurable, substituable.</h1><p>Les suppléments ne remplacent ni le sommeil, ni les aliments, ni le suivi médical.</p></div><div class="hero-orb"><strong>${targets.proteinG}g</strong><span>protéines</span></div></section>
    <div class="metric-grid">${metric('Plan', `${calories} kcal`, `${protein} g protéines`)}${metric('Fibres', `${fiber} g`, 'menu prévu')}${metric('Eau', `${day.waterMl || 0}/${targets.waterMl}`, 'ml')}${metric('Protéines', `${day.proteinG || 0}/${targets.proteinG}`, 'g')}</div>
    <div class="dashboard-grid">
      ${card('Menu du jour', `<div class="meal-grid">${plan.meals.map(meal => `<article class="meal ${completed.has(meal.id) ? 'done' : ''}"><div class="tag-row"><span class="tag">${meal.time}</span><span class="tag">${meal.calories} kcal</span><span class="tag">${meal.protein} g</span></div><h3>${esc(meal.title)}</h3><ul>${meal.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>${completed.has(meal.id) ? '<b class="done-label">Enregistré</b>' : button('Repas consommé', 'complete-meal', 'primary', `data-meal="${meal.id}"`)}</article>`).join('')}</div>`, 'span-8', 'ALIMENTATION')}
      ${card('Capture', `<div class="quick-stack">${button('+250 ml eau', 'add-water', '', 'data-amount="250"')}${button('+500 ml eau', 'add-water', '', 'data-amount="500"')}${button('+20 g protéines', 'add-protein', '', 'data-amount="20"')}${button('+30 g protéines', 'add-protein', '', 'data-amount="30"')}</div>`, 'span-4', 'RAPIDE')}
      ${card('Substitutions', `<div class="accordion">${Object.entries(FOOD_SUBSTITUTIONS).map(([name, items]) => `<details><summary>${esc(name)}</summary><div class="chip-list">${items.map(item => `<span class="chip">${esc(item)}</span>`).join('')}</div></details>`).join('')}</div>`, 'span-7', 'FLEXIBLE')}
      ${card('Profil', `<div class="form-grid one-col"><label>Poids kg<input id="profile-weight" type="number" step=".1" value="${state.profile.weightKg}"></label><label>Protéines g/kg<input id="profile-protein" type="number" min="1.2" max="2.2" step=".1" value="${state.profile.proteinPerKg}"></label><label>Eau ml<input id="profile-water" type="number" min="1800" max="5000" step="100" value="${state.profile.waterMl}"></label></div><div class="actions">${button('Sauver', 'save-profile', 'primary')}</div>`, 'span-5', 'CIBLES')}
    </div>`;
}

function renderMoney(state) {
  const forecast = cashForecast(state);
  const recurringTotal = (state.money.recurring || []).reduce((sum, item) => sum + num(item.amount), 0);
  const recent = (state.money.transactions || []).slice(-12).reverse().map(item => `<div class="history-line"><div><b>${esc(item.date)} · ${esc(item.category)}</b><small>${esc(item.note || '')}</small></div><strong>${item.type === 'income' ? '+' : '-'}${euro(item.amount)}</strong></div>`).join('') || '<div class="empty">Aucune transaction.</div>';
  return `
    <section class="hero"><div><span class="eyebrow">ARGENT PERSONNEL</span><h1>Budget, réel, prévision.</h1><p>Un registre financier propre, sans activité commerciale parasite.</p></div><div class="hero-orb"><strong>${euro(forecast)}</strong><span>prévision 30 j</span></div></section>
    <div class="metric-grid">${metric('Revenu', euro(state.money.settings.income), 'mensuel')}${metric('Fixes', euro(recurringTotal), 'mensuel')}${metric('Reste théorique', euro(state.money.settings.income - recurringTotal), 'avant variables')}${metric('Épargne cible', euro(state.money.settings.savingsTarget), 'mensuel')}</div>
    <div class="dashboard-grid">
      ${card('Transaction', `<div class="form-grid"><label>Date<input id="tx-date" type="date" value="${Store.localDate()}"></label><label>Type<select id="tx-type"><option value="expense">Dépense</option><option value="income">Revenu</option><option value="saving">Épargne</option></select></label><label>Catégorie<input id="tx-category" placeholder="Courses, voiture…"></label><label>Montant<input id="tx-amount" type="number" step=".01"></label></div><label>Note<input id="tx-note"></label><div class="actions">${button('Ajouter', 'add-transaction', 'primary')}</div>`, 'span-6', 'RÉEL')}
      ${card('Charges récurrentes', `<div class="history">${(state.money.recurring || []).map(item => `<div class="history-line"><div><b>${esc(item.label)}</b><small>jour ${item.day || 1}</small></div><strong>${euro(item.amount)}</strong></div>`).join('') || '<div class="empty">Aucune charge configurée.</div>'}</div><div class="actions">${button('Charger mes bases', 'init-recurring')}</div>`, 'span-6', 'FIXES')}
      ${card('Historique', `<div class="history">${recent}</div>`, 'span-12', 'TRANSACTIONS')}
    </div>`;
}

function renderSystem(state) {
  const report = Store.storageReport();
  return `
    <section class="hero system-hero"><div><span class="eyebrow">SYSTÈME</span><h1>V6.1 Godmode</h1><p>Architecture unifiée, données locales, export contrôlé et migrations explicites.</p></div><div class="hero-orb"><strong>6.1</strong><span>build</span></div></section>
    <div class="dashboard-grid">
      ${card('Audit qualité', `<div class="criteria">
        ${['Un seul moteur quotidien','Aucune donnée commerciale supprimée réimportée','Cycle athlète par exécution','Gate prop firm fondé sur des preuves','Lecture séparée des études','Cibles tactiles et typographie mobile','Backup non récursif','Aucune validation sans production réelle'].map(item => `<div class="criterion ok"><span>✓</span><b>${esc(item)}</b></div>`).join('')}
      </div>`, 'span-7', 'CONTRATS')}
      ${card('Stockage', `<div class="stats-list"><p><span>Version</span><b>${esc(report.version)}</b></p><p><span>Schéma</span><b>${report.schema}</b></p><p><span>État</span><b>${report.stateBytes} octets</b></p><p><span>Backups</span><b>${report.backups}</b></p><p><span>Dernière mise à jour</span><b>${esc(report.updatedAt || '')}</b></p></div>`, 'span-5', 'LOCAL')}
      ${card('Sauvegarde et restauration', `<div class="actions">${button('Créer un backup', 'backup')}${button('Exporter JSON', 'export', 'primary')}<label class="file-btn">Importer JSON<input id="import-file" type="file" accept="application/json"></label>${button('Réinitialiser V6', 'reset', 'danger')}</div><div class="callout">L’export reste local. Le reset supprime l’état V6 après confirmation.</div>`, 'span-12', 'SÉCURITÉ')}
    </div>`;
}

function collectExerciseLogs() {
  const logs = {};
  document.querySelectorAll('.exercise-log').forEach(row => {
    const [actual, rpe, pain] = row.querySelectorAll('input');
    logs[row.dataset.drill] = { actual: actual.value.trim(), rpe: num(rpe.value), pain: num(pain.value) };
  });
  return logs;
}

function downloadJson(content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ultimate-dashboard-${Store.localDate()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'navigate') return setRoute(target.dataset.route);
  if (action === 'save-day') {
    Store.update(state => {
      const day = ensureDay(state);
      day.mode = document.querySelector('#day-mode').value;
      day.energy = num(document.querySelector('#day-energy').value, 3);
      day.pain = num(document.querySelector('#day-pain').value);
      day.availableMin = num(document.querySelector('#day-minutes').value, 60);
      day.note = document.querySelector('#day-note').value.trim();
    });
    toast('Journée recalculée'); return render();
  }
  if (action === 'complete-order') {
    Store.update(state => {
      const day = ensureDay(state);
      day.completed = [...new Set([...(day.completed || []), target.dataset.id])];
    });
    toast('Priorité validée'); return render();
  }
  if (action === 'block-order') {
    Store.update(state => {
      const day = ensureDay(state);
      const rows = day.blocked || [];
      day.blocked = rows.some(item => item.id === target.dataset.id) ? rows.filter(item => item.id !== target.dataset.id) : [...rows, { id: target.dataset.id, at: new Date().toISOString() }];
    });
    return render();
  }
  if (action === 'add-water' || action === 'add-protein') {
    Store.update(state => {
      const day = ensureDay(state);
      if (action === 'add-water') day.waterMl = num(day.waterMl) + num(target.dataset.amount);
      else day.proteinG = num(day.proteinG) + num(target.dataset.amount);
    });
    toast('Capture enregistrée'); return render();
  }
  if (action === 'complete-meal') {
    Store.update(state => {
      state.nutrition.entries.push({ id: uid('meal'), date: Store.localDate(), kind: 'meal', mealId: target.dataset.meal, createdAt: new Date().toISOString() });
      const day = ensureDay(state);
      day.completed = [...new Set([...(day.completed || []), 'health'])];
    });
    toast('Repas enregistré'); return render();
  }
  if (action === 'save-profile') {
    Store.update(state => {
      state.profile.weightKg = num(document.querySelector('#profile-weight').value, 82);
      state.profile.proteinPerKg = num(document.querySelector('#profile-protein').value, 1.8);
      state.profile.waterMl = num(document.querySelector('#profile-water').value, 2500);
    });
    toast('Profil sauvegardé'); return render();
  }
  if (action === 'complete-athlete') {
    const state = Store.load();
    const next = nextAthleteSession(state);
    Store.update(draft => {
      draft.sport.sessions.push({
        id: uid('athlete'),
        date: Store.localDate(),
        type: next.name,
        sessionId: next.id,
        qualities: next.qualities,
        status: num(document.querySelector('#sport-pain').value) >= 7 ? 'stopped' : num(document.querySelector('#sport-pain').value) >= 4 ? 'deload' : 'completed',
        durationMin: num(document.querySelector('#sport-duration').value),
        energy: num(document.querySelector('#sport-energy').value, 3),
        rpe: num(document.querySelector('#sport-rpe').value, 7),
        pain: num(document.querySelector('#sport-pain').value),
        notes: document.querySelector('#sport-notes').value.trim(),
        exercises: collectExerciseLogs()
      });
      const day = ensureDay(draft);
      day.completed = [...new Set([...(day.completed || []), 'athlete'])];
    });
    toast('Séance athlète enregistrée'); return render();
  }
  if (action === 'save-prop-plan') {
    Store.update(state => {
      state.trading.planId = document.querySelector('#prop-plan').value;
      state.trading.customPlan = {
        account: num(document.querySelector('#prop-account').value),
        profitTarget: num(document.querySelector('#prop-target').value),
        maxLoss: num(document.querySelector('#prop-loss').value),
        maxMini: num(document.querySelector('#prop-mini').value),
        consistencyPct: num(document.querySelector('#prop-consistency').value)
      };
    });
    toast('Plan prop firm sauvegardé'); return render();
  }
  if (action === 'save-risk') {
    Store.update(state => {
      state.trading.risk.riskPerTrade = num(document.querySelector('#risk-trade').value);
      state.trading.risk.dailyStop = num(document.querySelector('#risk-day').value);
      state.trading.risk.maxTrades = num(document.querySelector('#risk-count').value);
      state.trading.risk.maxConsecutiveLosses = num(document.querySelector('#risk-losses').value);
    });
    toast('Risk engine sauvegardé'); return render();
  }
  if (action === 'save-setup') {
    Store.update(state => {
      state.trading.setup.market = document.querySelector('#setup-market').value.trim();
      state.trading.setup.session = document.querySelector('#setup-session').value.trim();
      state.trading.setup.platform = document.querySelector('#setup-platform').value.trim();
      state.trading.setup.name = document.querySelector('#setup-name').value.trim();
      state.trading.setup.rules = document.querySelector('#setup-rules').value.trim();
    });
    toast('Playbook sauvegardé'); return render();
  }
  if (action === 'complete-trading-module') {
    const proof = document.querySelector('#trading-proof').value.trim();
    if (proof.length < 20) return toast('Preuve trop courte : produis un résultat vérifiable.');
    Store.update(state => {
      const active = activeTradingModule(state);
      state.trading.sessions.push({ id: uid('trading'), date: Store.localDate(), kind: 'curriculum', moduleId: active.id, durationMin: 45, proof, breach: false });
      state.trading.curriculumIndex = Math.min(TRADING_CURRICULUM.length - 1, active.index + 1);
      const day = ensureDay(state);
      day.completed = [...new Set([...(day.completed || []), 'trading'])];
    });
    toast('Module validé'); return render();
  }
  if (action === 'log-trading-session') {
    Store.update(state => {
      state.trading.sessions.push({
        id: uid('session'), date: Store.localDate(),
        kind: document.querySelector('#trading-session-kind').value,
        samples: num(document.querySelector('#trading-samples').value),
        durationMin: num(document.querySelector('#trading-duration').value),
        breach: document.querySelector('#trading-breach').value === 'true',
        note: document.querySelector('#trading-session-note').value.trim()
      });
      const day = ensureDay(state);
      day.completed = [...new Set([...(day.completed || []), 'trading'])];
    });
    toast('Session trading enregistrée'); return render();
  }
  if (action === 'log-trade') {
    Store.update(state => {
      state.trading.trades.push({
        id: uid('trade'), createdAt: new Date().toISOString(),
        date: document.querySelector('#trade-date').value || Store.localDate(),
        market: document.querySelector('#trade-market').value.trim(),
        setup: document.querySelector('#trade-setup').value.trim(),
        risk: num(document.querySelector('#trade-risk').value),
        pnl: num(document.querySelector('#trade-pnl').value),
        breach: document.querySelector('#trade-breach').value === 'true',
        note: document.querySelector('#trade-note').value.trim()
      });
    });
    toast('Trade journalisé'); return render();
  }
  if (action === 'add-mock') {
    Store.update(state => { state.trading.mockChallenges = num(state.trading.mockChallenges) + 1; });
    toast('Mock challenge ajouté'); return render();
  }
  if (action === 'switch-study') {
    Store.update(state => { state.study.activeTrack = target.dataset.track; });
    return render();
  }
  if (action === 'complete-study') {
    const proof = document.querySelector('#study-proof').value.trim();
    if (proof.length < 15) return toast('Ajoute une preuve concrète.');
    Store.update(state => {
      const active = activeStudyResource(state);
      state.study.sessions.push({ id: uid('study'), date: Store.localDate(), trackId: active.trackId, trackLabel: active.track.label, resource: active.resource[0], durationMin: num(document.querySelector('#study-duration').value), quality: num(document.querySelector('#study-quality').value), proof });
      state.study.tracks[active.trackId] = { ...(state.study.tracks[active.trackId] || {}), index: Math.min(active.track.resources.length - 1, active.index + 1) };
      const day = ensureDay(state); day.completed = [...new Set([...(day.completed || []), 'study'])];
    });
    toast('Étude validée'); return render();
  }
  if (action === 'switch-shelf') {
    Store.update(state => { state.reading.activeShelf = target.dataset.shelf; });
    return render();
  }
  if (action === 'log-reading' || action === 'finish-book') {
    Store.update(state => {
      const active = activeReadingBook(state);
      state.reading.sessions.push({ id: uid('read'), date: Store.localDate(), shelfId: active.shelfId, bookId: active.book.id, title: active.book.title, pages: num(document.querySelector('#reading-pages').value), durationMin: num(document.querySelector('#reading-duration').value), note: document.querySelector('#reading-note').value.trim(), finished: action === 'finish-book' });
      if (action === 'finish-book') state.reading.shelves[active.shelfId] = { ...(state.reading.shelves[active.shelfId] || {}), index: Math.min(active.shelf.books.length - 1, active.index + 1) };
      const day = ensureDay(state); day.completed = [...new Set([...(day.completed || []), 'reading'])];
    });
    toast(action === 'finish-book' ? 'Livre terminé' : 'Lecture enregistrée'); return render();
  }
  if (action === 'add-transaction') {
    const amount = num(document.querySelector('#tx-amount').value);
    if (amount <= 0) return toast('Montant invalide.');
    Store.update(state => {
      state.money.transactions.push({ id: uid('tx'), date: document.querySelector('#tx-date').value || Store.localDate(), type: document.querySelector('#tx-type').value, category: document.querySelector('#tx-category').value.trim() || 'Autre', amount, note: document.querySelector('#tx-note').value.trim() });
    });
    toast('Transaction ajoutée'); return render();
  }
  if (action === 'init-recurring') {
    Store.update(state => {
      if (!(state.money.recurring || []).length) state.money.recurring = DEFAULT_RECURRING.map(([label, amount, day]) => ({ id: uid('rec'), label, amount, day, type: 'expense' }));
    });
    toast('Charges chargées'); return render();
  }
  if (action === 'backup') { Store.createBackup('manual'); toast('Backup créé'); return render(); }
  if (action === 'export') { downloadJson(Store.exportData()); return; }
  if (action === 'reset') {
    if (!confirm('Supprimer tout l’état V6 local ?')) return;
    Store.resetV6(); route = 'today'; toast('État V6 réinitialisé'); return render();
  }
});

document.addEventListener('change', async event => {
  if (event.target.id !== 'import-file' || !event.target.files?.[0]) return;
  try {
    Store.importData(await event.target.files[0].text());
    toast('Import terminé'); render();
  } catch (error) { toast(error.message || 'Import impossible'); }
});

setInterval(() => {
  if (clock) clock.textContent = new Intl.DateTimeFormat('fr-BE', { hour: '2-digit', minute: '2-digit' }).format(new Date());
}, 1000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
render();
