import * as Store from './store.js';
import {
  ATHLETE_CYCLE,
  ATHLETE_QUALITIES,
  CULTURE_SHELVES,
  DEFAULT_RECURRING,
  FOOD_SUBSTITUTIONS,
  MEAL_PLAN,
  PROP_FIRM_PRESETS,
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
  domainCompletedToday,
  dueReviews,
  mockChallengeStats,
  monthlyMoneySummary,
  nextAthleteSession,
  nutritionTargets,
  propFirmStats,
  recommendedFeatures,
  recoveryScore,
  reviewSchedule,
  riskBudget,
  ruleFreshness,
  selectedPropPlan,
  sportProgression,
  todayOrders,
  tradeCompliance,
  tradingReadiness,
  weeklyReview,
  weightTrend
} from './rules.js';

const app = document.querySelector('#app');
const tabs = document.querySelector('#tabs');
const clock = document.querySelector('#clock');
const toastNode = document.querySelector('#toast');
const statusNode = document.querySelector('#status');

const NAV = [
  ['today', 'Aujourd’hui', 'A'],
  ['review', 'Revue', 'R'],
  ['athlete', 'Athlète', 'S'],
  ['trading', 'Trading', 'T'],
  ['study', 'Études', 'E'],
  ['library', 'Lecture', 'L'],
  ['nutrition', 'Nutrition', 'N'],
  ['money', 'Argent', '€'],
  ['system', 'Système', '⚙']
];

const uid = prefix => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
let route = Store.load().ui.route || 'today';
let installPrompt = null;

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
function checked(value) { return value ? 'checked' : ''; }
function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}
function toast(message, tone = '') {
  toastNode.textContent = message;
  toastNode.dataset.tone = tone;
  toastNode.classList.add('show');
  clearTimeout(window.__udToast);
  window.__udToast = setTimeout(() => toastNode.classList.remove('show'), 2600);
}
function ensureDay(state) { return Store.day(state, Store.localDate()); }
function button(label, action, className = '', attrs = '') {
  return `<button type="button" class="btn ${className}" data-action="${action}" ${attrs}>${esc(label)}</button>`;
}
function routeButton(label, next, className = '') { return button(label, 'navigate', className, `data-route="${next}"`); }
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
function empty(message) { return `<div class="empty">${esc(message)}</div>`; }
function setRoute(next) {
  route = NAV.some(([id]) => id === next) ? next : 'today';
  Store.update(state => { state.ui.route = route; });
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function applyUi(state) {
  document.documentElement.dataset.theme = state.ui.theme || 'graphite';
  document.documentElement.dataset.density = state.ui.density || 'comfortable';
}
function renderNav() {
  tabs.innerHTML = NAV.map(([id, label, icon]) => `<button class="tab ${route === id ? 'active' : ''}" data-action="navigate" data-route="${id}" aria-current="${route === id ? 'page' : 'false'}"><span class="tab-icon" aria-hidden="true">${esc(icon)}</span><span>${esc(label)}</span></button>`).join('');
}
function render() {
  const state = Store.load();
  applyUi(state);
  renderNav();
  const views = { today: renderToday, review: renderReview, athlete: renderAthlete, trading: renderTrading, study: renderStudy, library: renderLibrary, nutrition: renderNutrition, money: renderMoney, system: renderSystem };
  try {
    app.innerHTML = (views[route] || renderToday)(state);
  } catch (error) {
    console.error(error);
    app.innerHTML = card('Module indisponible', `<p>${esc(error.message || 'Erreur inconnue')}</p>${routeButton('Retour au cockpit', 'today', 'primary')}`, 'span-12');
  }
  document.querySelector('#version')?.replaceChildren(document.createTextNode(Store.APP_VERSION));
  const day = ensureDay(state);
  if (statusNode) statusNode.textContent = `${recoveryScore(state)}% récupération · ${day.availableMin || 60} min`;
}

function renderToday(state) {
  const day = ensureDay(state);
  const command = todayOrders(state);
  const readiness = tradingReadiness(state);
  const coverage = athleteCoverage(state);
  const weak = coverage.filter(item => item.count < item.target);
  const orders = command.orders.map(order => {
    const skipped = (day.skipped || []).some(item => item.id === order.id);
    return `<article class="mission"><div class="mission-rank">${order.rank}</div><div class="mission-main"><div class="tag-row"><span class="tag">${esc(order.domain)}</span><span class="tag">${order.minutes} min</span></div><h3>${esc(order.title)}</h3><p>${esc(order.detail)}</p><div class="actions">${routeButton('Ouvrir et produire la preuve', order.route, 'primary')}${button(skipped ? 'Réactiver' : 'Reporter aujourd’hui', 'skip-order', 'quiet', `data-id="${order.id}"`)}</div></div></article>`;
  }).join('') || empty('Toutes les priorités sont prouvées ou consciemment reportées. Récupère.');

  return `<section class="page-head"><div><span class="eyebrow">COCKPIT · ${formatDate(Store.localDate())}</span><h1>${command.orders.length ? 'Exécute ce qui compte.' : 'Journée sécurisée.'}</h1><p>Une priorité n’est validée que par une donnée réelle dans son module. Le bouton “terminé” générique a été supprimé.</p></div><div class="score-ring" style="--score:${command.recovery}"><strong>${command.recovery}</strong><span>récupération</span></div></section>
    <div class="metric-grid">${metric('Mode', command.modeLabel, 'calculé par sommeil, énergie et douleur')}${metric('Prop firm', `${readiness.score}%`, readiness.ready ? 'challenge autorisé' : 'gate non validé', readiness.ready ? 'good' : '')}${metric('Lacunes physiques', String(weak.length), weak.slice(0, 2).map(item => item.label).join(' · ') || 'couverture complète')}${metric('Preuves du jour', String(['health','athlete','trading','study','reading'].filter(id => domainCompletedToday(state, id)).length), 'sur 5 domaines')}</div>
    <div class="dashboard-grid">${card('Données du jour', `<div class="form-grid"><label>Mode<select id="day-mode">${['auto','normal','execution','fatigue','recovery'].map(item => `<option value="${item}" ${selected(item, day.mode || 'auto')}>${item}</option>`).join('')}</select></label><label>Temps disponible<input id="day-minutes" type="number" min="5" max="720" value="${day.availableMin || 60}"></label><label>Sommeil (heures)<input id="day-sleep" type="number" min="0" max="16" step=".25" value="${day.sleepHours ?? 7}"></label><label>Qualité sommeil 1–5<input id="day-sleep-quality" type="number" min="1" max="5" value="${day.sleepQuality || 3}"></label><label>Énergie 1–5<input id="day-energy" type="number" min="1" max="5" value="${day.energy || 3}"></label><label>Douleur 0–10<input id="day-pain" type="number" min="0" max="10" value="${day.pain || 0}"></label><label>Pas<input id="day-steps" type="number" min="0" max="100000" value="${day.steps || 0}"></label><label>Fréquence repos (facultatif)<input id="day-rhr" type="number" min="0" max="250" value="${day.restingHr || 0}"></label></div><label>Contexte<textarea id="day-note" rows="2" placeholder="Symptômes, rendez-vous, contrainte, sommeil…">${esc(day.note || '')}</textarea></label><div class="actions">${button('Enregistrer et recalculer', 'save-day', 'primary')}</div>`, 'span-12', 'READINESS')}${card('Priorités actives', `<div class="mission-list">${orders}</div>`, 'span-8', 'AUTOPILOT')}${card('Capture rapide', `<div class="quick-stack">${button('+250 ml eau', 'add-water', '', 'data-amount="250"')}${button('+500 ml eau', 'add-water', '', 'data-amount="500"')}${button('+25 g protéines', 'add-protein', '', 'data-amount="25"')}${routeButton('Ouvrir la revue hebdo', 'review')}</div>`, 'span-4', 'LOG')}</div>`;
}

function renderReview(state) {
  const review = weeklyReview(state);
  const alerts = review.alerts.map(item => `<li>${esc(item)}</li>`).join('');
  const domains = Object.entries(review.domainScores).map(([id, score]) => `<article class="review-domain"><div><b>${esc(id)}</b><span>${score}%</span></div>${progress(score, 100)}</article>`).join('');
  const weakest = Object.entries(review.domainScores).sort((a, b) => a[1] - b[1]).slice(0, 2);
  return `<section class="page-head"><div><span class="eyebrow">REVUE · ${formatDate(review.startDate)} → ${formatDate(review.endDate)}</span><h1>Score hebdomadaire ${review.overall}/100</h1><p>La revue transforme les journaux en décisions. Elle ne récompense pas le volume brut, mais la couverture et la conformité.</p></div><div class="score-ring" style="--score:${review.overall}"><strong>${review.overall}</strong><span>semaine</span></div></section><div class="metric-grid">${metric('Sport', `${review.sportSessions} séances`, `${review.averageRecovery}% récupération moyenne`)}${metric('Trading', `${review.validTrades} trades conformes`, `${review.tradingSessions} sessions`)}${metric('Études', `${review.studyMinutes} min`, `${dueReviews(state).length} révisions dues`)}${metric('Lecture', `${review.readingPages} pages`, `${review.readingMinutes} min`)}</div><div class="dashboard-grid">${card('Scores par domaine', `<div class="review-domains">${domains}</div>`, 'span-7', 'TENDANCE')}${card('Alertes', alerts ? `<ul class="alert-list">${alerts}</ul>` : empty('Aucune alerte critique.'), 'span-5', 'RISQUES')}${card('Décision de la semaine', `<p class="lead">Renforce en priorité <b>${esc(weakest.map(([id]) => id).join(' et '))}</b>.</p><div class="principles"><p>1. Garde les domaines ≥80 % en maintenance.</p><p>2. Corrige une seule lacune à la fois.</p><p>3. Ne paie aucun challenge prop firm tant que le gate reste incomplet.</p></div>`, 'span-6', 'FOCUS')}${card('Argent', `<div class="stats-list"><p><span>Dépenses du mois</span><b>${euro(review.money.expenses)}</b></p><p><span>Épargne enregistrée</span><b>${euro(review.money.savings)}</b></p><p><span>Budgets dépassés</span><b>${review.money.alerts.length}</b></p></div>`, 'span-6', 'MOIS')}</div>`;
}

function renderAthlete(state) {
  const next = nextAthleteSession(state);
  const previous = (state.sport.sessions || []).filter(item => item.type === next.name).at(-1);
  const coverage = athleteCoverage(state);
  const exercises = next.exercises.map(drill => {
    const old = previous?.exercises?.[drill.id] || {};
    return `<article class="drill-card"><div class="drill-head"><div><h3>${esc(drill.name)}</h3><p>${esc(drill.note)}</p></div><span class="target">${esc(drill.target)}</span></div><div class="progression">${esc(sportProgression(previous, drill))}</div><div class="exercise-log" data-drill="${drill.id}"><input aria-label="Résultat réel" placeholder="Preuve : 4×8 à 60 kg, 35 min, etc." value="${esc(old.actual || '')}"><input aria-label="RPE" type="number" min="1" max="10" placeholder="RPE" value="${esc(old.rpe || '')}"><input aria-label="Douleur" type="number" min="0" max="10" placeholder="Douleur"></div></article>`;
  }).join('');
  const recent = (state.sport.sessions || []).slice(-10).reverse().map(item => `<div class="history-line"><div><b>${esc(item.date)} · ${esc(item.type)}</b><small>${item.durationMin || 0} min · RPE ${item.rpe || 0} · douleur ${item.pain || 0}/10</small></div><div class="row-actions"><span class="tag">${esc(item.status)}</span>${button('Supprimer', 'delete-record', 'icon danger', `data-path="sport.sessions" data-id="${item.id}"`)}</div></div>`).join('') || empty('Aucune séance enregistrée.');
  return `<section class="page-head"><div><span class="eyebrow">ATHLÈTE HYBRIDE</span><h1>${esc(next.name)}</h1><p>${next.forcedRecovery ? 'Récupération imposée par tes données.' : 'Le cycle avance uniquement après une preuve réelle.'}</p></div><div class="score-pill">${next.index + 1}/${ATHLETE_CYCLE.length}</div></section><div class="quality-grid">${coverage.map(item => `<article class="quality ${item.count >= item.target ? 'covered' : ''}"><span>${esc(item.label)}</span><strong>${item.count}/${item.target}</strong><small>14 jours</small></article>`).join('')}</div><div class="dashboard-grid">${card('Séance active', `<div class="tag-row">${next.qualities.map(id => `<span class="tag accent">${esc(ATHLETE_QUALITIES.find(row => row[0] === id)?.[1] || id)}</span>`).join('')}<span class="tag">${next.duration} min</span></div><div class="drill-grid">${exercises}</div>`, 'span-8', 'PROGRAMME')}${card('Clôture', `<div class="form-grid one-col"><label>Durée réelle<input id="sport-duration" type="number" min="5" max="300" value="${next.duration}"></label><label>Énergie après 1–5<input id="sport-energy" type="number" min="1" max="5" value="3"></label><label>RPE global 1–10<input id="sport-rpe" type="number" min="1" max="10" value="7"></label><label>Douleur globale 0–10<input id="sport-pain" type="number" min="0" max="10" value="0"></label></div><label>Notes<textarea id="sport-notes" rows="3" placeholder="Technique, symptômes, prochaine progression…"></textarea></label><div class="actions">${button('Enregistrer la séance', 'complete-athlete', 'primary')}</div><div class="callout">Une séance de force sans résultat renseigné ne peut plus être validée.</div>`, 'span-4', 'PREUVE')}${card('Benchmark', `<div class="form-grid"><label>Test<input id="benchmark-name" placeholder="Pompes, 5 km, planche…"></label><label>Résultat<input id="benchmark-value" placeholder="25 reps, 31:20…"></label></div><label>Note<input id="benchmark-note" placeholder="Conditions du test"></label><div class="actions">${button('Enregistrer le benchmark', 'log-benchmark')}</div>`, 'span-4', '6–8 SEMAINES')}${card('Historique', `<div class="history">${recent}</div>`, 'span-8', 'TRACE')}</div>`;
}

function renderTrading(state) {
  const stats = propFirmStats(state);
  const readiness = tradingReadiness(state);
  const active = activeTradingModule(state);
  const plan = selectedPropPlan(state);
  const budget = riskBudget(state);
  const freshness = ruleFreshness(state);
  const mocks = state.trading.mockChallenges || [];
  const activeMock = mocks.find(item => item.status === 'active');
  const preTrade = state.trading.preTrade || {};
  const preTradeReady = ['context','setup','stop','size','news'].every(key => preTrade[key]);
  const trades = (state.trading.trades || []).slice(-12).reverse().map(trade => `<div class="trade-row ${num(trade.pnl) >= 0 ? 'positive' : 'negative'}"><div><b>${esc(trade.date)} · ${esc(trade.setup || 'setup')}</b><small>${esc(trade.market)} · ${trade.contracts || 0} contrat(s) · risque ${euro(trade.risk)}${trade.violations?.length ? ` · ${esc(trade.violations.join(', '))}` : ''}</small></div><div class="row-actions"><strong>${num(trade.pnl) >= 0 ? '+' : ''}${euro(trade.pnl)}</strong>${button('Supprimer', 'delete-record', 'icon danger', `data-path="trading.trades" data-id="${trade.id}"`)}</div></div>`).join('') || empty('Aucun trade journalisé.');
  const criteria = readiness.criteria.map(item => `<div class="criterion ${item.ok ? 'ok' : ''}"><span>${item.ok ? '✓' : '×'}</span><b>${esc(item.label)}</b><em>${esc(item.value || '')}</em></div>`).join('');
  return `<section class="page-head"><div><span class="eyebrow">PROP FIRM LAB</span><h1>${readiness.ready ? 'Gate validé.' : 'Challenge interdit pour l’instant.'}</h1><p>Snapshot ${esc(plan.provider)} vérifié le ${esc(freshness.verifiedAt || 'jamais')}. ${freshness.warning ? esc(freshness.warning) : 'Règles encore fraîches.'}</p></div><div class="score-ring" style="--score:${readiness.score}"><strong>${readiness.score}</strong><span>readiness</span></div></section><div class="metric-grid">${metric('P&L simulé', euro(stats.totalPnl), `reste ${euro(stats.remainingTarget)}`, stats.totalPnl >= 0 ? 'good' : 'danger')}${metric('Drawdown', euro(stats.maxDrawdown), `${budget.lossesRemaining} pertes pleines restantes`, stats.maxDrawdown > plan.maxLoss * .6 ? 'danger' : '')}${metric('Profit factor', Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞', `${pct(stats.winRate)} win rate`)}${metric('Conformité', `${stats.validTrades}/${stats.trades}`, `${stats.ruleBreaches + stats.floorBreaches + stats.personalStopBreaches} violation(s)`)}</div><div class="dashboard-grid">${card('Gate challenge', `<div class="criteria">${criteria}</div>`, 'span-7', 'NO PAY BEFORE PROOF')}${card('Risk engine', `<div class="stats-list"><p><span>Risque personnel</span><b>${euro(budget.personalRisk)}</b></p><p><span>Risque conservateur</span><b>${euro(budget.conservativeRisk)}</b></p><p><span>Stop journalier</span><b>${euro(budget.dailyStop)}</b></p><p><span>Trades maximum</span><b>${budget.maxTrades}</b></p></div><div class="form-grid one-col"><label>Risque / trade<input id="risk-trade" type="number" value="${state.trading.risk.riskPerTrade}"></label><label>Stop journalier<input id="risk-day" type="number" value="${state.trading.risk.dailyStop}"></label><label>Trades max<input id="risk-count" type="number" value="${state.trading.risk.maxTrades}"></label><label>Pertes consécutives max<input id="risk-losses" type="number" value="${state.trading.risk.maxConsecutiveLosses}"></label></div><div class="actions">${button('Sauver le risque', 'save-risk')}</div>`, 'span-5', 'SURVIE')}${card('Checklist pré-trade', `<div class="checklist">${[['context','Contexte et niveau clé définis'],['setup','Setup exact présent'],['stop','Stop et invalidation placés'],['size','Taille conforme au risque'],['news','Calendrier/news vérifié']].map(([key,label]) => `<label class="check-row"><input class="pretrade-check" data-key="${key}" type="checkbox" ${checked(preTrade[key])}><span>${esc(label)}</span></label>`).join('')}</div><div class="actions">${button('Sauver la checklist', 'save-pretrade', preTradeReady ? 'good' : 'primary')}</div>`, 'span-5', 'AVANT ORDRE')}${card('Journaliser un trade', `<div class="form-grid"><label>Date<input id="trade-date" type="date" value="${Store.localDate()}"></label><label>Marché<input id="trade-market" value="${esc(state.trading.setup.market || 'MNQ')}"></label><label>Setup<input id="trade-setup" value="${esc(state.trading.setup.name || '')}"></label><label>Contrats<input id="trade-contracts" type="number" min="1" value="1"></label><label>Risque<input id="trade-risk" type="number" min="1" value="${state.trading.risk.riskPerTrade}"></label><label>P&L<input id="trade-pnl" type="number" step=".01"></label></div><label>Preuve et décision<textarea id="trade-note" rows="3" placeholder="Contexte, entrée, stop, sortie, erreur ou capture référencée…"></textarea></label><div class="actions">${button('Journaliser', 'log-trade', 'primary')}</div>`, 'span-7', preTradeReady ? 'CHECKLIST OK' : 'CHECKLIST INCOMPLÈTE')}${card('Plan prop firm', `<div class="form-grid"><label>Plan<select id="prop-plan">${Object.entries(PROP_FIRM_PRESETS).map(([id, item]) => `<option value="${id}" ${selected(id, state.trading.planId)}>${esc(item.label)}</option>`).join('')}</select></label><label>Capital<input id="prop-account" type="number" value="${plan.account}"></label><label>Objectif<input id="prop-target" type="number" value="${plan.profitTarget}"></label><label>Perte max<input id="prop-loss" type="number" value="${plan.maxLoss}"></label><label>Mini max<input id="prop-mini" type="number" value="${plan.maxMini}"></label><label>Cohérence %<input id="prop-consistency" type="number" value="${plan.consistencyPct}"></label></div><div class="actions">${button('Sauver le plan', 'save-prop-plan')}</div><div class="callout">Les presets officiels restent verrouillés. Le plan personnalisé est modifiable.</div>`, 'span-5', 'RÈGLES')}${card(`Module ${active.week}/12 · ${active.title}`, `<p class="lead">${esc(active.objective)}</p><ul>${active.resources.map(item => `<li>${esc(item)}</li>`).join('')}</ul><div class="proof">Preuve : ${esc(active.proof)}</div><label>Preuve produite<textarea id="trading-proof" rows="3"></textarea></label><div class="actions">${button('Valider le module', 'complete-trading-module', 'primary')}</div>`, 'span-7', 'CURRICULUM')}${card('Session de travail', `<div class="form-grid one-col"><label>Type<select id="trading-session-kind"><option value="backtest">Backtest</option><option value="execution">Replay / simulation</option><option value="review">Revue</option></select></label><label>Occurrences<input id="trading-samples" type="number" min="0"></label><label>Durée<input id="trading-duration" type="number" min="5" value="45"></label></div><label>Résultat<textarea id="trading-session-note" rows="3"></textarea></label><div class="actions">${button('Enregistrer la session', 'log-trading-session')}</div>`, 'span-5', 'ENTRAÎNEMENT')}${card('Mock challenge', activeMock ? `<p>Mock actif depuis ${esc(activeMock.startedAt)} · ${state.trading.trades.length - activeMock.startTradeIndex} trade(s).</p><div class="actions">${button('Clôturer et calculer', 'finish-mock', 'primary', `data-id="${activeMock.id}"`)}</div>` : `<p>Un mock utilise uniquement les trades ajoutés après son démarrage et calcule automatiquement le résultat.</p><div class="actions">${button('Démarrer un mock', 'start-mock', 'primary')}</div>`, 'span-5', `${readiness.passedMocks}/2 RÉUSSIS`)}${card('Outils à maîtriser', `<div class="tool-grid">${TRADING_TOOLS.map(item => `<article><b>${esc(item[0])}</b><span>${esc(item[1])}</span><p>${esc(item[2])}</p></article>`).join('')}</div>`, 'span-7', 'STACK')}${card('Trades récents', `<div class="history">${trades}</div>`, 'span-12', 'AUDIT')}</div>`;
}

function renderStudy(state) {
  const active = activeStudyResource(state);
  const reviews = dueReviews(state);
  const reviewRows = reviews.map(review => `<article class="review-card"><div><b>${esc(review.resource || review.label || 'Révision')}</b><small>Due ${esc(review.dueDate)} · intervalle ${review.interval} j</small></div><input id="review-proof-${review.id}" placeholder="Rappel sans notes / résultat"><select id="review-recall-${review.id}"><option value="1">1 — oublié</option><option value="3" selected>3 — moyen</option><option value="5">5 — maîtrisé</option></select>${button('Valider', 'complete-review', 'primary', `data-id="${review.id}"`)}</article>`).join('');
  const recent = (state.study.sessions || []).slice(-10).reverse().map(item => `<div class="history-line"><div><b>${esc(item.date)} · ${esc(item.trackLabel || item.trackId)}</b><small>${item.durationMin || 0} min · ${esc(item.proof || '')}</small></div>${button('Supprimer', 'delete-record', 'icon danger', `data-path="study.sessions" data-id="${item.id}"`)}</div>`).join('') || empty('Aucune session récente.');
  return `<section class="page-head"><div><span class="eyebrow">APPRENTISSAGE ACTIF</span><h1>${esc(active.track.label)}</h1><p>Rappel espacé à J+1, J+3, J+7, J+14 et J+30.</p></div><div class="score-pill">${reviews.length} due(s)</div></section><div class="dashboard-grid">${reviews.length ? card('Révisions dues', `<div class="review-list">${reviewRows}</div>`, 'span-12', 'PRIORITÉ') : ''}${card('Parcours actif', `<div class="segmented">${Object.entries(STUDY_TRACKS).map(([id, track]) => button(track.label, 'switch-study', id === active.trackId ? 'active' : '', `data-track="${id}"`)).join('')}</div><div class="focus-card"><span class="eyebrow">${esc(active.resource[0])}</span><h2>${esc(active.resource[1])}</h2><p>Preuve : ${esc(active.resource[2])}</p></div><div class="form-grid"><label>Durée<input id="study-duration" type="number" min="10" value="35"></label><label>Qualité 1–5<input id="study-quality" type="number" min="1" max="5" value="4"></label></div><label>Preuve réelle<textarea id="study-proof" rows="4" placeholder="Code, exercices, mesures, phrases, lien ou résultat…"></textarea></label><div class="actions">${button('Valider et programmer les révisions', 'complete-study', 'primary')}</div>`, 'span-7', 'FOCUS')}${card('Méthode', `<div class="routine-list"><p><b>5 min</b> rappel sans notes</p><p><b>25 min</b> production active</p><p><b>5 min</b> preuve</p><p><b>5 min</b> prochaine action</p></div><div class="history">${recent}</div>`, 'span-5', '40 MIN')}</div>`;
}

function renderLibrary(state) {
  const active = activeReadingBook(state);
  const bookSessions = (state.reading.sessions || []).filter(item => item.bookId === active.book.id);
  const pages = bookSessions.reduce((total, item) => total + num(item.pages), 0);
  const recent = (state.reading.sessions || []).slice(-10).reverse().map(item => `<div class="history-line"><div><b>${esc(item.date)} · ${esc(item.title)}</b><small>${item.pages || 0} pages · ${esc(item.note || '')}</small></div>${button('Supprimer', 'delete-record', 'icon danger', `data-path="reading.sessions" data-id="${item.id}"`)}</div>`).join('') || empty('Aucune lecture.');
  return `<section class="page-head"><div><span class="eyebrow">BIBLIOTHÈQUE</span><h1>${esc(active.book.title)}</h1><p>${esc(active.book.author)} · ${esc(active.book.category)} · ${pages} pages enregistrées</p></div><div class="score-pill">${active.index + 1}/${active.shelf.books.length}</div></section><div class="dashboard-grid">${card('Livre actif', `<div class="segmented">${Object.entries(CULTURE_SHELVES).map(([id, shelf]) => button(shelf.label, 'switch-shelf', id === active.shelfId ? 'active' : '', `data-shelf="${id}"`)).join('')}</div><div class="reading-focus"><h2>${esc(active.book.title)}</h2><p>${esc(active.book.author)}</p><span class="tag">${esc(active.book.category)}</span></div><div class="form-grid"><label>Pages lues<input id="reading-pages" type="number" min="1" value="20"></label><label>Durée<input id="reading-duration" type="number" min="5" value="${state.reading.dailyMinutesTarget || 25}"></label></div><label>Idée retenue<textarea id="reading-note" rows="3" placeholder="Reformule une idée ou une question."></textarea></label><div class="actions">${button('Enregistrer', 'log-reading', 'primary')}${button('Livre terminé', 'finish-book')}</div>`, 'span-7', 'PLAISIR + CULTURE')}${card('Protocole', `<div class="principles"><p><b>Lundi–jeudi :</b> lecture active.</p><p><b>Vendredi :</b> synthèse d’une page.</p><p><b>Week-end :</b> roman plaisir.</p><p><b>Chaque livre :</b> 5 idées, 3 désaccords, 1 application.</p></div>`, 'span-5', 'SANS EMPILER')}${card('Catalogue', `<div class="book-grid">${active.shelf.books.map((book, index) => `<article class="book ${index === active.index ? 'active' : ''}"><span>${index + 1}</span><div><h3>${esc(book.title)}</h3><p>${esc(book.author)} · ${esc(book.category)}</p></div></article>`).join('')}</div>`, 'span-7', active.shelf.label)}${card('Historique', `<div class="history">${recent}</div>`, 'span-5', 'TRACE')}</div>`;
}

function renderNutrition(state) {
  const day = ensureDay(state);
  const targets = nutritionTargets(state.profile);
  const plan = MEAL_PLAN[new Date().getDay()] || MEAL_PLAN[1];
  const completed = new Set((state.nutrition.entries || []).filter(item => item.date === Store.localDate() && item.kind === 'meal').map(item => item.mealId));
  const trend = weightTrend(state);
  const calories = plan.meals.reduce((total, meal) => total + meal.calories, 0);
  const protein = plan.meals.reduce((total, meal) => total + meal.protein, 0);
  const recent = (state.nutrition.entries || []).filter(item => item.kind === 'custom').slice(-8).reverse().map(item => `<div class="history-line"><div><b>${esc(item.date)} · ${esc(item.label)}</b><small>${item.calories || 0} kcal · ${item.protein || 0} g prot.</small></div>${button('Supprimer', 'delete-record', 'icon danger', `data-path="nutrition.entries" data-id="${item.id}"`)}</div>`).join('');
  return `<section class="page-head"><div><span class="eyebrow">NUTRITION</span><h1>Plan simple, données réelles.</h1><p>Poids ${trend.latest.toFixed(1)} kg · évolution ${trend.change >= 0 ? '+' : ''}${trend.change.toFixed(1)} kg sur les dernières mesures.</p></div><div class="score-pill">${day.proteinG || 0}/${targets.proteinG} g</div></section><div class="metric-grid">${metric('Menu prévu', `${calories} kcal`, `${protein} g protéines`)}${metric('Eau', `${day.waterMl || 0}/${targets.waterMl}`, 'ml')}${metric('Fibres', `${day.fiberG || 0}`, 'g enregistrés')}${metric('Sommeil cible', `${targets.sleepHours} h`, `${targets.steps} pas`)}</div><div class="dashboard-grid">${card('Menu du jour', `<div class="meal-grid">${plan.meals.map(meal => `<article class="meal ${completed.has(meal.id) ? 'done' : ''}"><div class="tag-row"><span class="tag">${meal.time}</span><span class="tag">${meal.calories} kcal</span><span class="tag">${meal.protein} g</span></div><h3>${esc(meal.title)}</h3><ul>${meal.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>${completed.has(meal.id) ? '<b class="done-label">Enregistré</b>' : button('Repas consommé', 'complete-meal', 'primary', `data-meal="${meal.id}"`)}</article>`).join('')}</div>`, 'span-8', 'PLAN')}${card('Capture rapide', `<div class="quick-stack">${button('+250 ml eau', 'add-water', '', 'data-amount="250"')}${button('+500 ml eau', 'add-water', '', 'data-amount="500"')}${button('+20 g protéines', 'add-protein', '', 'data-amount="20"')}${button('+30 g protéines', 'add-protein', '', 'data-amount="30"')}</div>`, 'span-4', 'LOG')}${card('Repas personnalisé', `<div class="form-grid"><label>Nom<input id="food-label" placeholder="Repas ou aliment"></label><label>Calories<input id="food-calories" type="number" min="0"></label><label>Protéines<input id="food-protein" type="number" min="0"></label><label>Fibres<input id="food-fiber" type="number" min="0"></label></div><div class="actions">${button('Ajouter au jour', 'add-food', 'primary')}</div>${recent ? `<div class="history">${recent}</div>` : ''}`, 'span-6', 'RÉEL')}${card('Poids et profil', `<div class="form-grid one-col"><label>Poids actuel<input id="profile-weight" type="number" step=".1" value="${state.profile.weightKg}"></label><label>Protéines g/kg<input id="profile-protein" type="number" min="1.2" max="2.2" step=".1" value="${state.profile.proteinPerKg}"></label><label>Eau cible<input id="profile-water" type="number" min="1500" max="6000" step="100" value="${state.profile.waterMl}"></label><label>Sommeil cible<input id="profile-sleep" type="number" min="5" max="10" step=".25" value="${state.profile.sleepTargetHours}"></label><label>Pas cible<input id="profile-steps" type="number" min="1000" max="30000" value="${state.profile.stepsTarget}"></label></div><div class="actions">${button('Sauver le profil', 'save-profile', 'primary')}${button('Journaliser le poids', 'log-weight')}</div>`, 'span-6', 'TENDANCE')}${card('Substitutions', `<div class="accordion">${Object.entries(FOOD_SUBSTITUTIONS).map(([name, items]) => `<details><summary>${esc(name)}</summary><div class="chip-list">${items.map(item => `<span class="chip">${esc(item)}</span>`).join('')}</div></details>`).join('')}</div>`, 'span-12', 'FLEXIBLE')}</div>`;
}

function renderMoney(state) {
  const forecast = cashForecast(state);
  const summary = monthlyMoneySummary(state);
  const recurringTotal = (state.money.recurring || []).reduce((total, item) => total + num(item.amount), 0);
  const recent = (state.money.transactions || []).slice(-12).reverse().map(item => `<div class="history-line"><div><b>${esc(item.date)} · ${esc(item.category)}</b><small>${esc(item.note || '')}</small></div><div class="row-actions"><strong>${item.type === 'income' ? '+' : '-'}${euro(item.amount)}</strong>${button('Supprimer', 'delete-record', 'icon danger', `data-path="money.transactions" data-id="${item.id}"`)}</div></div>`).join('') || empty('Aucune transaction.');
  const recurring = (state.money.recurring || []).map(item => `<div class="history-line"><div><b>${esc(item.label)}</b><small>jour ${item.day || 1}</small></div><div class="row-actions"><strong>${euro(item.amount)}</strong>${button('Supprimer', 'delete-record', 'icon danger', `data-path="money.recurring" data-id="${item.id}"`)}</div></div>`).join('') || empty('Aucune charge.');
  const budgets = Object.entries(state.money.budgets || {}).map(([category, limit]) => `<div class="history-line"><div><b>${esc(category)}</b><small>dépensé ${euro(summary.byCategory[category] || 0)}</small></div><strong>${euro(limit)}</strong></div>`).join('') || empty('Aucun budget par catégorie.');
  return `<section class="page-head"><div><span class="eyebrow">ARGENT</span><h1>Prévision ${euro(forecast)}</h1><p>Moyenne variable sur 90 jours, charges fixes et épargne cible incluses.</p></div><div class="score-pill">${summary.alerts.length} alerte(s)</div></section><div class="metric-grid">${metric('Revenu mensuel', euro(state.money.settings.income), 'paramètre')}${metric('Charges fixes', euro(recurringTotal), 'mensuel')}${metric('Dépenses du mois', euro(summary.expenses), summary.month)}${metric('Épargne', euro(summary.savings), `cible ${euro(state.money.settings.savingsTarget)}`)}</div><div class="dashboard-grid">${card('Paramètres', `<div class="form-grid"><label>Revenu<input id="money-income" type="number" value="${state.money.settings.income}"></label><label>Solde actuel<input id="money-balance" type="number" value="${state.money.settings.openingBalance}"></label><label>Épargne cible<input id="money-saving" type="number" value="${state.money.settings.savingsTarget}"></label><label>Fonds urgence<input id="money-emergency" type="number" value="${state.money.settings.emergencyTarget}"></label></div><div class="actions">${button('Sauver', 'save-money-settings', 'primary')}</div>`, 'span-5', 'BASE')}${card('Transaction', `<div class="form-grid"><label>Date<input id="tx-date" type="date" value="${Store.localDate()}"></label><label>Type<select id="tx-type"><option value="expense">Dépense</option><option value="income">Revenu</option><option value="saving">Épargne</option></select></label><label>Catégorie<input id="tx-category" placeholder="Courses, voiture…"></label><label>Montant<input id="tx-amount" type="number" step=".01"></label></div><label>Note<input id="tx-note"></label><div class="actions">${button('Ajouter', 'add-transaction', 'primary')}</div>`, 'span-7', 'RÉEL')}${card('Charge récurrente', `<div class="form-grid"><label>Nom<input id="rec-label"></label><label>Montant<input id="rec-amount" type="number"></label><label>Jour<input id="rec-day" type="number" min="1" max="31" value="1"></label></div><div class="actions">${button('Ajouter', 'add-recurring')}${button('Charger mes bases', 'init-recurring')}</div><div class="history">${recurring}</div>`, 'span-6', 'FIXES')}${card('Budget catégorie', `<div class="form-grid"><label>Catégorie<input id="budget-category" placeholder="Courses"></label><label>Limite mensuelle<input id="budget-limit" type="number"></label></div><div class="actions">${button('Sauver le budget', 'save-budget')}</div><div class="history">${budgets}</div>`, 'span-6', 'LIMITES')}${card('Historique', `<div class="history">${recent}</div>`, 'span-12', 'TRANSACTIONS')}</div>`;
}

function renderSystem(state) {
  const report = Store.storageReport();
  const backups = Store.listBackups();
  const features = recommendedFeatures();
  return `<section class="page-head"><div><span class="eyebrow">SYSTÈME</span><h1>V6.2 Autopilot</h1><p>Stockage à écritures contrôlées, annulation, backups restaurables et validation stricte.</p></div><div class="score-pill">rev ${report.revision}</div></section><div class="dashboard-grid">${card('Interface', `<div class="form-grid"><label>Thème<select id="ui-theme"><option value="graphite" ${selected('graphite', state.ui.theme)}>Graphite</option><option value="oled" ${selected('oled', state.ui.theme)}>OLED</option><option value="light" ${selected('light', state.ui.theme)}>Clair</option></select></label><label>Densité<select id="ui-density"><option value="comfortable" ${selected('comfortable', state.ui.density)}>Confort</option><option value="compact" ${selected('compact', state.ui.density)}>Compact</option></select></label></div><div class="actions">${button('Appliquer', 'save-ui', 'primary')}${installPrompt ? button('Installer l’application', 'install-app') : ''}</div>`, 'span-5', 'DESIGN')}${card('Stockage', `<div class="stats-list"><p><span>Version</span><b>${esc(report.version)}</b></p><p><span>Schéma</span><b>${report.schema}</b></p><p><span>État</span><b>${report.stateBytes} octets</b></p><p><span>Backups</span><b>${report.backups}</b></p><p><span>Annulations</span><b>${report.undo}</b></p><p><span>Mise à jour</span><b>${esc(report.updatedAt)}</b></p></div>`, 'span-7', 'LOCAL-FIRST')}${card('Sauvegardes', `<div class="history">${backups.map(item => `<div class="history-line"><div><b>${esc(item.reason)}</b><small>${esc(item.createdAt)}</small></div><div class="row-actions">${button('Restaurer', 'restore-backup', '', `data-id="${item.id}"`)}${button('Supprimer', 'delete-backup', 'icon danger', `data-id="${item.id}"`)}</div></div>`).join('') || empty('Aucun backup.')}</div><div class="actions">${button('Créer backup', 'backup')}${button('Annuler dernière modification', 'undo')}${button('Exporter JSON', 'export', 'primary')}<label class="file-btn">Importer JSON<input id="import-file" type="file" accept="application/json"></label>${button('Réinitialiser', 'reset', 'danger')}</div>`, 'span-12', 'RÉSILIENCE')}${card('Nouvelles fonctions proposées', `<div class="roadmap">${features.map(item => `<article><span class="tag">${esc(item.priority)}</span><b>${esc(item.label)}</b><small>${esc(item.status)}</small></article>`).join('')}</div>`, 'span-7', 'ROADMAP')}${card('Audit V6.2', `<div class="criteria">${['Aucune validation générique sans preuve','Store sans écriture à chaque lecture','Suppression et annulation des journaux','Revue hebdomadaire automatique','Règles prop firm datées et contrôlées','Checklist pré-trade et violations automatiques','Récupération fondée sur sommeil, douleur et énergie','Révisions espacées programmées','Budgets mensuels et moyenne variable 90 jours','PWA versionnée et interface accessible'].map(item => `<div class="criterion ok"><span>✓</span><b>${esc(item)}</b></div>`).join('')}</div>`, 'span-5', 'CONTRATS')}</div>`;
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
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
function currentMeal(mealId) {
  const plan = MEAL_PLAN[new Date().getDay()] || MEAL_PLAN[1];
  return plan.meals.find(item => item.id === mealId);
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
      day.availableMin = num(document.querySelector('#day-minutes').value, 60);
      day.sleepHours = num(document.querySelector('#day-sleep').value, 7);
      day.sleepQuality = num(document.querySelector('#day-sleep-quality').value, 3);
      day.energy = num(document.querySelector('#day-energy').value, 3);
      day.pain = num(document.querySelector('#day-pain').value);
      day.steps = num(document.querySelector('#day-steps').value);
      day.restingHr = num(document.querySelector('#day-rhr').value);
      day.note = document.querySelector('#day-note').value.trim();
    });
    toast('Readiness recalculée'); return render();
  }
  if (action === 'skip-order') {
    const reason = prompt('Pourquoi reporter cette priorité aujourd’hui ?') || '';
    Store.update(state => {
      const day = ensureDay(state);
      const rows = day.skipped || [];
      day.skipped = rows.some(item => item.id === target.dataset.id) ? rows.filter(item => item.id !== target.dataset.id) : [...rows, { id: target.dataset.id, reason, at: new Date().toISOString() }];
    }, { checkpoint: true, reason: 'skip_order' });
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
    const meal = currentMeal(target.dataset.meal);
    if (!meal) return toast('Repas introuvable', 'danger');
    Store.update(state => {
      state.nutrition.entries.push({ id: uid('meal'), date: Store.localDate(), kind: 'meal', mealId: meal.id, label: meal.title, calories: meal.calories, protein: meal.protein, fiber: meal.fiber, createdAt: new Date().toISOString() });
      const day = ensureDay(state);
      day.calories = num(day.calories) + meal.calories;
      day.proteinG = num(day.proteinG) + meal.protein;
      day.fiberG = num(day.fiberG) + meal.fiber;
    });
    toast('Repas et macros enregistrés'); return render();
  }
  if (action === 'add-food') {
    const label = document.querySelector('#food-label').value.trim();
    if (!label) return toast('Nom du repas obligatoire', 'danger');
    const entry = { id: uid('food'), date: Store.localDate(), kind: 'custom', label, calories: num(document.querySelector('#food-calories').value), protein: num(document.querySelector('#food-protein').value), fiber: num(document.querySelector('#food-fiber').value), createdAt: new Date().toISOString() };
    Store.update(state => {
      state.nutrition.entries.push(entry);
      const day = ensureDay(state);
      day.calories = num(day.calories) + entry.calories;
      day.proteinG = num(day.proteinG) + entry.protein;
      day.fiberG = num(day.fiberG) + entry.fiber;
    });
    toast('Repas personnalisé ajouté'); return render();
  }
  if (action === 'save-profile' || action === 'log-weight') {
    const weight = num(document.querySelector('#profile-weight').value, 82);
    Store.update(state => {
      state.profile.weightKg = weight;
      state.profile.proteinPerKg = num(document.querySelector('#profile-protein').value, 1.8);
      state.profile.waterMl = num(document.querySelector('#profile-water').value, 2500);
      state.profile.sleepTargetHours = num(document.querySelector('#profile-sleep').value, 7.5);
      state.profile.stepsTarget = num(document.querySelector('#profile-steps').value, 7000);
      if (action === 'log-weight') state.nutrition.weightHistory.push({ id: uid('weight'), date: Store.localDate(), weightKg: weight });
    });
    toast(action === 'log-weight' ? 'Poids journalisé' : 'Profil sauvegardé'); return render();
  }
  if (action === 'complete-athlete') {
    const state = Store.load();
    const next = nextAthleteSession(state);
    const exercises = collectExerciseLogs();
    const proofCount = Object.values(exercises).filter(item => item.actual).length;
    const duration = num(document.querySelector('#sport-duration').value);
    if (!next.recovery && proofCount === 0) return toast('Renseigne au moins un résultat réel.', 'danger');
    if (next.recovery && duration < 10) return toast('Récupération trop courte pour être validée.', 'danger');
    const pain = num(document.querySelector('#sport-pain').value);
    Store.update(draft => draft.sport.sessions.push({ id: uid('athlete'), createdAt: new Date().toISOString(), date: Store.localDate(), type: next.name, sessionId: next.id, qualities: next.qualities, status: pain >= 7 ? 'stopped' : pain >= 4 ? 'deload' : 'completed', advancesCycle: !next.forcedRecovery, durationMin: duration, energy: num(document.querySelector('#sport-energy').value, 3), rpe: num(document.querySelector('#sport-rpe').value, 7), pain, notes: document.querySelector('#sport-notes').value.trim(), exercises }));
    toast('Séance enregistrée'); return render();
  }
  if (action === 'log-benchmark') {
    const name = document.querySelector('#benchmark-name').value.trim();
    const value = document.querySelector('#benchmark-value').value.trim();
    if (!name || !value) return toast('Test et résultat obligatoires', 'danger');
    Store.update(state => state.sport.benchmarks.push({ id: uid('benchmark'), date: Store.localDate(), name, value, note: document.querySelector('#benchmark-note').value.trim() }));
    toast('Benchmark enregistré'); return render();
  }
  if (action === 'save-prop-plan') {
    const planId = document.querySelector('#prop-plan').value;
    Store.update(state => {
      state.trading.planId = planId;
      if (planId === 'custom') {
        state.trading.customPlan = { account: num(document.querySelector('#prop-account').value), profitTarget: num(document.querySelector('#prop-target').value), maxLoss: num(document.querySelector('#prop-loss').value), maxMini: num(document.querySelector('#prop-mini').value), consistencyPct: num(document.querySelector('#prop-consistency').value), minDays: 2, drawdown: 'EOD' };
        state.trading.ruleSnapshot.verifiedAt = Store.localDate();
      }
    });
    toast(planId === 'custom' ? 'Plan personnalisé sauvegardé' : 'Preset officiel sélectionné'); return render();
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
  if (action === 'save-pretrade') {
    Store.update(state => document.querySelectorAll('.pretrade-check').forEach(input => { state.trading.preTrade[input.dataset.key] = input.checked; }));
    toast('Checklist sauvegardée'); return render();
  }
  if (action === 'log-trade') {
    const state = Store.load();
    const preTradeReady = ['context','setup','stop','size','news'].every(key => state.trading.preTrade?.[key]);
    if (!preTradeReady) return toast('Checklist pré-trade incomplète.', 'danger');
    const candidate = { id: uid('trade'), createdAt: new Date().toISOString(), date: document.querySelector('#trade-date').value || Store.localDate(), market: document.querySelector('#trade-market').value.trim(), setup: document.querySelector('#trade-setup').value.trim(), contracts: num(document.querySelector('#trade-contracts').value), risk: num(document.querySelector('#trade-risk').value), pnl: num(document.querySelector('#trade-pnl').value), note: document.querySelector('#trade-note').value.trim() };
    const compliance = tradeCompliance(state, candidate);
    if (!compliance.ok && !confirm(`Violations détectées :\n- ${compliance.violations.join('\n- ')}\n\nEnregistrer quand même comme breach ?`)) return;
    candidate.violations = compliance.violations;
    candidate.breach = !compliance.ok;
    Store.update(draft => { draft.trading.trades.push(candidate); draft.trading.preTrade = { context: false, setup: false, stop: false, size: false, news: false }; });
    toast(compliance.ok ? 'Trade conforme journalisé' : 'Trade enregistré avec violation', compliance.ok ? '' : 'danger'); return render();
  }
  if (action === 'complete-trading-module') {
    const proof = document.querySelector('#trading-proof').value.trim();
    if (proof.length < 30) return toast('Preuve trop courte.', 'danger');
    Store.update(state => {
      const active = activeTradingModule(state);
      state.trading.sessions.push({ id: uid('trading'), date: Store.localDate(), kind: 'curriculum', moduleId: active.id, durationMin: 45, proof, breach: false });
      state.trading.curriculumIndex = Math.min(TRADING_CURRICULUM.length - 1, active.index + 1);
    });
    toast('Module validé'); return render();
  }
  if (action === 'log-trading-session') {
    const note = document.querySelector('#trading-session-note').value.trim();
    if (note.length < 10) return toast('Ajoute un résultat concret.', 'danger');
    Store.update(state => state.trading.sessions.push({ id: uid('session'), date: Store.localDate(), kind: document.querySelector('#trading-session-kind').value, samples: num(document.querySelector('#trading-samples').value), durationMin: num(document.querySelector('#trading-duration').value), breach: false, note }));
    toast('Session enregistrée'); return render();
  }
  if (action === 'start-mock') {
    Store.update(state => state.trading.mockChallenges.push({ id: uid('mock'), status: 'active', passed: false, startedAt: Store.localDate(), startTradeIndex: state.trading.trades.length, planId: state.trading.planId }));
    toast('Mock challenge démarré'); return render();
  }
  if (action === 'finish-mock') {
    Store.update(state => {
      const mock = state.trading.mockChallenges.find(item => item.id === target.dataset.id);
      if (!mock) return;
      mock.endTradeIndex = state.trading.trades.length;
      mock.endedAt = Store.localDate();
      mock.status = 'completed';
      const result = mockChallengeStats(state, mock);
      mock.passed = result.passed;
      mock.totalPnl = result.totalPnl;
      mock.maxDrawdown = result.maxDrawdown;
      mock.violations = result.ruleBreaches + result.floorBreaches + result.personalStopBreaches;
    });
    toast('Mock challenge calculé'); return render();
  }
  if (action === 'switch-study') { Store.update(state => { state.study.activeTrack = target.dataset.track; }); return render(); }
  if (action === 'complete-study') {
    const proof = document.querySelector('#study-proof').value.trim();
    if (proof.length < 20) return toast('Ajoute une preuve concrète.', 'danger');
    Store.update(state => {
      const active = activeStudyResource(state);
      const sessionId = uid('study');
      state.study.sessions.push({ id: sessionId, date: Store.localDate(), trackId: active.trackId, trackLabel: active.track.label, resource: active.resource[0], durationMin: num(document.querySelector('#study-duration').value), quality: num(document.querySelector('#study-quality').value), proof });
      reviewSchedule().forEach(({ interval, dueDate }) => state.study.reviews.push({ id: uid('review'), sessionId, trackId: active.trackId, resource: active.resource[0], interval, dueDate, status: 'due' }));
      state.study.tracks[active.trackId] = { ...(state.study.tracks[active.trackId] || {}), index: Math.min(active.track.resources.length - 1, active.index + 1) };
    });
    toast('Étude validée et révisions programmées'); return render();
  }
  if (action === 'complete-review') {
    const proof = document.querySelector(`#review-proof-${CSS.escape(target.dataset.id)}`).value.trim();
    const recall = num(document.querySelector(`#review-recall-${CSS.escape(target.dataset.id)}`).value);
    if (proof.length < 10) return toast('Preuve de rappel trop courte.', 'danger');
    Store.update(state => {
      const review = state.study.reviews.find(item => item.id === target.dataset.id);
      if (!review) return;
      review.status = 'done'; review.completedAt = new Date().toISOString(); review.recall = recall; review.proof = proof;
    });
    toast('Révision validée'); return render();
  }
  if (action === 'switch-shelf') { Store.update(state => { state.reading.activeShelf = target.dataset.shelf; }); return render(); }
  if (action === 'log-reading' || action === 'finish-book') {
    const note = document.querySelector('#reading-note').value.trim();
    const pages = num(document.querySelector('#reading-pages').value);
    const durationMin = num(document.querySelector('#reading-duration').value);
    if (pages <= 0 || durationMin < 5 || note.length < 5) return toast('Pages, durée et idée retenue obligatoires.', 'danger');
    Store.update(state => {
      const active = activeReadingBook(state);
      state.reading.sessions.push({ id: uid('read'), date: Store.localDate(), shelfId: active.shelfId, bookId: active.book.id, title: active.book.title, pages, durationMin, note, finished: action === 'finish-book' });
      if (action === 'finish-book') state.reading.shelves[active.shelfId] = { ...(state.reading.shelves[active.shelfId] || {}), index: Math.min(active.shelf.books.length - 1, active.index + 1) };
    });
    toast(action === 'finish-book' ? 'Livre terminé' : 'Lecture enregistrée'); return render();
  }
  if (action === 'save-money-settings') {
    Store.update(state => {
      state.money.settings.income = num(document.querySelector('#money-income').value);
      state.money.settings.openingBalance = num(document.querySelector('#money-balance').value);
      state.money.settings.savingsTarget = num(document.querySelector('#money-saving').value);
      state.money.settings.emergencyTarget = num(document.querySelector('#money-emergency').value);
    });
    toast('Paramètres financiers sauvegardés'); return render();
  }
  if (action === 'add-transaction') {
    const amount = num(document.querySelector('#tx-amount').value);
    if (amount <= 0) return toast('Montant invalide.', 'danger');
    Store.update(state => state.money.transactions.push({ id: uid('tx'), date: document.querySelector('#tx-date').value || Store.localDate(), type: document.querySelector('#tx-type').value, category: document.querySelector('#tx-category').value.trim() || 'Autre', amount, note: document.querySelector('#tx-note').value.trim() }));
    toast('Transaction ajoutée'); return render();
  }
  if (action === 'add-recurring') {
    const label = document.querySelector('#rec-label').value.trim();
    const amount = num(document.querySelector('#rec-amount').value);
    if (!label || amount <= 0) return toast('Charge invalide.', 'danger');
    Store.update(state => state.money.recurring.push({ id: uid('rec'), label, amount, day: num(document.querySelector('#rec-day').value, 1), type: 'expense' }));
    toast('Charge ajoutée'); return render();
  }
  if (action === 'init-recurring') {
    Store.update(state => { if (!(state.money.recurring || []).length) state.money.recurring = DEFAULT_RECURRING.map(([label, amount, day]) => ({ id: uid('rec'), label, amount, day, type: 'expense' })); });
    toast('Charges de base chargées'); return render();
  }
  if (action === 'save-budget') {
    const category = document.querySelector('#budget-category').value.trim();
    const limit = num(document.querySelector('#budget-limit').value);
    if (!category || limit <= 0) return toast('Budget invalide.', 'danger');
    Store.update(state => { state.money.budgets[category] = limit; });
    toast('Budget sauvegardé'); return render();
  }
  if (action === 'delete-record') {
    if (!confirm('Supprimer cette donnée ? Une annulation restera disponible.')) return;
    try { Store.removeRecord(target.dataset.path, target.dataset.id); toast('Donnée supprimée'); render(); } catch (error) { toast(error.message, 'danger'); }
    return;
  }
  if (action === 'save-ui') {
    Store.update(state => { state.ui.theme = document.querySelector('#ui-theme').value; state.ui.density = document.querySelector('#ui-density').value; });
    toast('Interface mise à jour'); return render();
  }
  if (action === 'backup') { Store.createBackup('manual'); toast('Backup créé'); return render(); }
  if (action === 'undo') { try { Store.undoLast(); toast('Modification annulée'); render(); } catch (error) { toast(error.message, 'danger'); } return; }
  if (action === 'restore-backup') { if (!confirm('Restaurer ce backup et remplacer l’état actuel ?')) return; try { Store.restoreBackup(target.dataset.id); toast('Backup restauré'); render(); } catch (error) { toast(error.message, 'danger'); } return; }
  if (action === 'delete-backup') { Store.deleteBackup(target.dataset.id); toast('Backup supprimé'); return render(); }
  if (action === 'export') { downloadJson(Store.exportData()); return; }
  if (action === 'reset') { if (!confirm('Réinitialiser la V6.2 ? Un backup sera créé avant.')) return; Store.resetV6(); route = 'today'; toast('Dashboard réinitialisé'); return render(); }
  if (action === 'install-app' && installPrompt) { installPrompt.prompt(); installPrompt = null; return render(); }
});

document.addEventListener('change', async event => {
  if (event.target.id !== 'import-file' || !event.target.files?.[0]) return;
  try { Store.importData(await event.target.files[0].text()); toast('Import terminé'); render(); } catch (error) { toast(error.message || 'Import impossible', 'danger'); }
});

window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; if (route === 'system') render(); });
Store.subscribe(() => { const state = Store.load(); applyUi(state); });
setInterval(() => { if (clock) clock.textContent = new Intl.DateTimeFormat('fr-BE', { hour: '2-digit', minute: '2-digit' }).format(new Date()); }, 1000);
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(registration => {
    setInterval(() => registration.update(), 60 * 60 * 1000);
    if (registration.waiting) toast('Mise à jour disponible : recharge la page.');
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) toast('Nouvelle version prête : recharge la page.'); });
    });
  }).catch(() => {});
}
render();
