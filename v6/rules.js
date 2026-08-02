import {
  ATHLETE_CYCLE,
  ATHLETE_QUALITIES,
  CULTURE_SHELVES,
  DAY_MODES,
  PROP_FIRM_PRESETS,
  STUDY_TRACKS,
  TRADING_CURRICULUM
} from './content.js';
import { localDate } from './store.js';

const DAY_MS = 86400000;
const completedSession = session => ['completed', 'deload'].includes(session.status);

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, number(value)));
}
function dateAtNoon(value) {
  return new Date(`${value}T12:00:00`);
}
function sameMonth(date, month) {
  return String(date || '').slice(0, 7) === month;
}
function sum(items, mapper) {
  return items.reduce((total, item) => total + number(mapper(item)), 0);
}
function groupByDate(items) {
  const map = new Map();
  items.forEach(item => {
    const date = item.date || localDate();
    if (!map.has(date)) map.set(date, []);
    map.get(date).push(item);
  });
  return map;
}
function lastDate(items, predicate = () => true) {
  return items.filter(predicate).map(item => item.date).filter(Boolean).sort().at(-1) || '';
}

export function daysBetween(a, b) {
  if (!a || !b) return 999;
  return Math.floor((dateAtNoon(a) - dateAtNoon(b)) / DAY_MS);
}

export function datePlus(date, days) {
  const next = dateAtNoon(date);
  next.setDate(next.getDate() + days);
  return localDate(next);
}

export function nutritionTargets(profile = {}) {
  const weight = Math.max(45, number(profile.weightKg, 75));
  const proteinPerKg = Math.min(2.2, Math.max(1.2, number(profile.proteinPerKg, 1.8)));
  return {
    proteinG: Math.round(weight * proteinPerKg),
    waterMl: Math.max(1500, number(profile.waterMl, Math.round(weight * 30))),
    meals: Math.min(7, Math.max(2, number(profile.mealsPerDay, 4))),
    sleepHours: Math.min(10, Math.max(5, number(profile.sleepTargetHours, 7.5))),
    steps: Math.min(30_000, Math.max(1000, number(profile.stepsTarget, 7000)))
  };
}

export function recoveryScore(state, date = localDate()) {
  const day = state.days?.[date] || {};
  const targets = nutritionTargets(state.profile || {});
  const sleepRatio = clamp(number(day.sleepHours, 7) / targets.sleepHours, 0, 1.2);
  const sleepQuality = clamp(number(day.sleepQuality, 3) / 5, 0, 1);
  const energy = clamp(number(day.energy, 3) / 5, 0, 1);
  const pain = 1 - clamp(number(day.pain, 0) / 10, 0, 1);
  const movement = day.steps ? clamp(number(day.steps) / targets.steps, 0, 1) : 0.65;
  const score = Math.round(sleepRatio * 30 + sleepQuality * 20 + energy * 25 + pain * 20 + movement * 5);
  return Math.min(100, Math.max(0, score));
}

export function effectiveDayMode(state, date = localDate()) {
  const day = state.days?.[date] || {};
  if (day.mode && day.mode !== 'auto' && DAY_MODES[day.mode]) return day.mode;
  const score = recoveryScore(state, date);
  const pain = number(day.pain);
  if (pain >= 7 || score < 35) return 'recovery';
  if (pain >= 5 || score < 55) return 'fatigue';
  if (number(day.availableMin, 60) >= 120 && score >= 78) return 'execution';
  return 'normal';
}

function advancesAthleteCycle(state, session) {
  if (!completedSession(session)) return false;
  if (session.advancesCycle === false) return false;
  if (session.advancesCycle === true) return true;
  const recovery = session.type === 'Récupération active' || (session.qualities || []).includes('recovery');
  if (!recovery) return true;
  const context = state.days?.[session.date] || {};
  return !(number(context.pain) >= 5 || number(context.energy, 3) <= 1);
}

export function nextAthleteSession(state, date = localDate()) {
  const day = state.days?.[date] || {};
  const completed = (state.sport?.sessions || []).filter(session => advancesAthleteCycle(state, session)).length;
  const baseIndex = completed % ATHLETE_CYCLE.length;
  if (number(day.pain) >= 5 || recoveryScore(state, date) < 45) {
    const recoveryIndex = ATHLETE_CYCLE.findIndex(session => session.recovery);
    return { ...ATHLETE_CYCLE[recoveryIndex], index: recoveryIndex, forcedRecovery: true };
  }
  return { ...ATHLETE_CYCLE[baseIndex], index: baseIndex, forcedRecovery: false };
}

export function athleteCoverage(state, window = 14, endDate = localDate()) {
  const startDate = datePlus(endDate, -window + 1);
  const counts = Object.fromEntries(ATHLETE_QUALITIES.map(([id]) => [id, 0]));
  (state.sport?.sessions || [])
    .filter(completedSession)
    .filter(session => session.date >= startDate && session.date <= endDate)
    .forEach(session => (session.qualities || []).forEach(id => {
      if (id in counts) counts[id] += 1;
    }));
  return ATHLETE_QUALITIES.map(([id, label]) => ({
    id,
    label,
    count: counts[id],
    target: id === 'recovery' ? 2 : id === 'strength' || id === 'aerobic' ? 2 : 1
  }));
}

export function sportProgression(previous, drill) {
  const entry = previous?.exercises?.[drill.id] || {};
  if (!entry.actual) return 'Crée une première référence technique, sans chercher le maximum.';
  const pain = Math.max(number(entry.pain), number(previous?.pain));
  const rpe = number(entry.rpe || previous?.rpe);
  if (pain >= 7) return 'Stop : pas de progression et avis médical.';
  if (pain >= 4) return 'Réduis charge, amplitude ou durée de 10 à 20 %.';
  if (rpe <= 7.5) return 'Ajoute 1 répétition, 2 à 5 % de charge ou 2 minutes.';
  if (rpe <= 8.5) return 'Maintiens et améliore la qualité avant de charger.';
  return 'Décharge la prochaine exposition de 5 à 10 %.';
}

export function selectedPropPlan(state) {
  const id = state.trading?.planId || 'flex50';
  const preset = PROP_FIRM_PRESETS[id] || PROP_FIRM_PRESETS.custom;
  const plan = id === 'custom'
    ? { ...PROP_FIRM_PRESETS.custom, ...(state.trading?.customPlan || {}), id }
    : { ...preset, id };
  return {
    ...plan,
    verifiedAt: id === 'custom' ? state.trading?.ruleSnapshot?.verifiedAt || '' : '2026-08-03',
    provider: id === 'custom' ? 'Personnalisé' : 'MyFundedFutures',
    dailyLoss: plan.dailyLoss ?? 0,
    newsTrading: plan.newsTrading ?? true
  };
}

export function ruleFreshness(state, today = localDate()) {
  const plan = selectedPropPlan(state);
  const ageDays = plan.verifiedAt ? daysBetween(today, plan.verifiedAt) : 999;
  return {
    verifiedAt: plan.verifiedAt,
    ageDays,
    fresh: ageDays <= 30,
    warning: ageDays > 30 ? 'Revérifie les règles officielles avant achat.' : ''
  };
}

export function tradeCompliance(state, candidate, existingTrades = state.trading?.trades || []) {
  const plan = selectedPropPlan(state);
  const risk = state.trading?.risk || {};
  const violations = [];
  const date = candidate.date || localDate();
  const dayTrades = existingTrades.filter(trade => trade.date === date);
  const contracts = number(candidate.contracts);
  const maxContracts = String(candidate.market || '').startsWith('M') ? number(plan.maxMicro) : number(plan.maxMini);

  if (!String(candidate.market || '').trim()) violations.push('Marché manquant');
  if (!String(candidate.setup || '').trim()) violations.push('Setup manquant');
  if (number(candidate.risk) <= 0) violations.push('Risque non défini');
  if (number(risk.riskPerTrade) > 0 && number(candidate.risk) > number(risk.riskPerTrade) * 1.05) violations.push('Risque par trade dépassé');
  if (contracts <= 0) violations.push('Nombre de contrats invalide');
  if (maxContracts > 0 && contracts > maxContracts) violations.push('Limite de contrats dépassée');
  if (number(risk.maxTrades) > 0 && dayTrades.length >= number(risk.maxTrades)) violations.push('Nombre maximal de trades atteint');

  const dayPnlBefore = sum(dayTrades, trade => trade.pnl);
  if (number(risk.dailyStop) > 0 && dayPnlBefore <= -number(risk.dailyStop)) violations.push('Stop journalier déjà atteint');

  const recent = [...existingTrades].sort((a, b) => `${a.date}${a.createdAt || ''}`.localeCompare(`${b.date}${b.createdAt || ''}`));
  let consecutiveLosses = 0;
  for (let index = recent.length - 1; index >= 0; index -= 1) {
    if (number(recent[index].pnl) < 0) consecutiveLosses += 1;
    else break;
  }
  if (number(risk.maxConsecutiveLosses) > 0 && consecutiveLosses >= number(risk.maxConsecutiveLosses)) violations.push('Série maximale de pertes atteinte');
  if (String(candidate.note || '').trim().length < 10) violations.push('Preuve/notes trop courtes');
  return { ok: violations.length === 0, violations };
}

export function propFirmStats(state, tradesInput = state.trading?.trades || []) {
  const plan = selectedPropPlan(state);
  const trades = [...tradesInput].sort((a, b) => `${a.date}${a.createdAt || ''}`.localeCompare(`${b.date}${b.createdAt || ''}`));
  const byDay = groupByDate(trades);
  const dailyPnl = new Map([...byDay].map(([date, rows]) => [date, sum(rows, row => row.pnl)]));
  let equity = number(plan.account);
  let intradayPeak = equity;
  let intradayMaxDrawdown = 0;
  let grossWin = 0;
  let grossLoss = 0;
  let wins = 0;
  let losses = 0;
  let ruleBreaches = 0;

  trades.forEach(trade => {
    const pnl = number(trade.pnl);
    equity += pnl;
    intradayPeak = Math.max(intradayPeak, equity);
    intradayMaxDrawdown = Math.max(intradayMaxDrawdown, intradayPeak - equity);
    if (pnl > 0) { grossWin += pnl; wins += 1; }
    if (pnl < 0) { grossLoss += Math.abs(pnl); losses += 1; }
    if (trade.breach || (trade.violations || []).length) ruleBreaches += 1;
  });

  let eodEquity = number(plan.account);
  let eodPeak = eodEquity;
  let eodMaxDrawdown = 0;
  let eodFloor = number(plan.account) - number(plan.maxLoss);
  let floorBreaches = 0;
  [...dailyPnl.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([, pnl]) => {
    eodEquity += pnl;
    if (eodEquity < eodFloor) floorBreaches += 1;
    eodPeak = Math.max(eodPeak, eodEquity);
    eodMaxDrawdown = Math.max(eodMaxDrawdown, eodPeak - eodEquity);
    eodFloor = Math.max(eodFloor, eodPeak - number(plan.maxLoss));
  });

  const totalPnl = sum(trades, trade => trade.pnl);
  const positiveDays = [...dailyPnl.values()].filter(value => value > 0);
  const bestDay = positiveDays.length ? Math.max(...positiveDays) : 0;
  const consistency = totalPnl > 0 ? bestDay / totalPnl * 100 : 0;
  const avgWin = wins ? grossWin / wins : 0;
  const avgLoss = losses ? grossLoss / losses : 0;
  const expectancy = trades.length ? wins / trades.length * avgWin - losses / trades.length * avgLoss : 0;
  const riskR = trades.filter(trade => number(trade.risk) > 0).map(trade => number(trade.pnl) / number(trade.risk));
  const averageR = riskR.length ? sum(riskR, value => value) / riskR.length : 0;
  const maxDrawdown = plan.drawdown === 'EOD' ? eodMaxDrawdown : intradayMaxDrawdown;
  const dailyStop = number(state.trading?.risk?.dailyStop);
  const personalStopBreaches = dailyStop > 0 ? [...dailyPnl.values()].filter(pnl => pnl < -dailyStop).length : 0;

  let maxLosingStreak = 0;
  let currentLosingStreak = 0;
  trades.forEach(trade => {
    if (number(trade.pnl) < 0) {
      currentLosingStreak += 1;
      maxLosingStreak = Math.max(maxLosingStreak, currentLosingStreak);
    } else currentLosingStreak = 0;
  });

  return {
    plan,
    trades: trades.length,
    validTrades: trades.filter(trade => !(trade.breach || (trade.violations || []).length)).length,
    tradingDays: byDay.size,
    totalPnl,
    remainingTarget: Math.max(0, number(plan.profitTarget) - totalPnl),
    bestDay,
    consistency,
    maxDrawdown,
    eodMaxDrawdown,
    intradayMaxDrawdown,
    drawdownRemaining: Math.max(0, number(plan.maxLoss) - maxDrawdown),
    currentFloor: eodFloor,
    winRate: trades.length ? wins / trades.length * 100 : 0,
    profitFactor: grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    expectancy,
    averageR,
    maxLosingStreak,
    ruleBreaches,
    floorBreaches,
    personalStopBreaches,
    dailyPnl: [...dailyPnl.entries()].map(([date, pnl]) => ({ date, pnl }))
  };
}

export function riskBudget(state) {
  const stats = propFirmStats(state);
  const personalRisk = number(state.trading?.risk?.riskPerTrade, 100);
  const drawdownRemaining = Math.max(0, stats.drawdownRemaining);
  return {
    personalRisk,
    conservativeRisk: Math.max(10, Math.floor(number(stats.plan.maxLoss) / 20)),
    lossesRemaining: personalRisk > 0 ? Math.floor(drawdownRemaining / personalRisk) : 0,
    dailyStop: number(state.trading?.risk?.dailyStop),
    maxTrades: number(state.trading?.risk?.maxTrades)
  };
}

export function mockChallengeStats(state, mock) {
  const trades = (state.trading?.trades || []).slice(number(mock.startTradeIndex), mock.endTradeIndex == null ? undefined : number(mock.endTradeIndex));
  const stats = propFirmStats(state, trades);
  const plan = stats.plan;
  const passed = stats.totalPnl >= number(plan.profitTarget)
    && stats.maxDrawdown <= number(plan.maxLoss)
    && stats.consistency <= number(plan.consistencyPct || 100)
    && stats.tradingDays >= number(plan.minDays || 1)
    && stats.ruleBreaches === 0
    && stats.floorBreaches === 0
    && stats.personalStopBreaches === 0;
  return { ...stats, passed };
}

export function tradingReadiness(state) {
  const stats = propFirmStats(state);
  const sessions = state.trading?.sessions || [];
  const backtestSamples = sessions.filter(item => item.kind === 'backtest').reduce((total, item) => total + number(item.samples), 0);
  const cleanExecutionSessions = sessions.filter(item => item.kind === 'execution' && !item.breach).length;
  const passedMocks = (state.trading?.mockChallenges || []).filter(mock => mock.status === 'completed' && mock.passed).length;
  const playbookReady = Boolean(String(state.trading?.setup?.name || '').trim() && String(state.trading?.setup?.rules || '').trim().length >= 80);
  const drawdownBuffer = number(stats.plan.maxLoss) > 0 && stats.maxDrawdown <= number(stats.plan.maxLoss) * 0.6;
  const consistencyOk = stats.totalPnl > 0 && stats.tradingDays >= number(stats.plan.minDays || 2) && stats.consistency <= number(stats.plan.consistencyPct || 100);
  const freshness = ruleFreshness(state);

  const criteria = [
    { id: 'rules-fresh', label: 'Règles vérifiées depuis moins de 30 jours', ok: freshness.fresh, value: freshness.verifiedAt || 'jamais' },
    { id: 'setup', label: 'Setup détaillé et testable', ok: playbookReady },
    { id: 'sample', label: '100 occurrences backtestées', ok: backtestSamples >= 100, value: `${backtestSamples}/100` },
    { id: 'trades', label: '30 trades simulés conformes', ok: stats.validTrades >= 30, value: `${stats.validTrades}/30` },
    { id: 'expectancy', label: 'Expectancy positive', ok: stats.expectancy > 0, value: stats.expectancy.toFixed(2) },
    { id: 'profit-factor', label: 'Profit factor ≥ 1,20', ok: stats.profitFactor >= 1.2, value: Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞' },
    { id: 'drawdown', label: 'Drawdown ≤ 60 % de la limite', ok: drawdownBuffer, value: `${Math.round(stats.maxDrawdown)}/${stats.plan.maxLoss}` },
    { id: 'consistency', label: 'Cohérence conforme au plan', ok: consistencyOk, value: `${stats.consistency.toFixed(1)} %` },
    { id: 'execution', label: '10 séances propres en replay/sim', ok: cleanExecutionSessions >= 10, value: `${cleanExecutionSessions}/10` },
    { id: 'mock', label: '2 mock challenges réellement réussis', ok: passedMocks >= 2, value: `${passedMocks}/2` },
    { id: 'rules', label: 'Aucune violation enregistrée', ok: stats.ruleBreaches + stats.floorBreaches + stats.personalStopBreaches === 0, value: `${stats.ruleBreaches + stats.floorBreaches + stats.personalStopBreaches}` }
  ];

  return {
    criteria,
    score: Math.round(criteria.filter(item => item.ok).length / criteria.length * 100),
    ready: criteria.every(item => item.ok),
    backtestSamples,
    cleanExecutionSessions,
    passedMocks,
    freshness
  };
}

export function activeTradingModule(state) {
  const index = Math.min(Math.max(0, number(state.trading?.curriculumIndex)), TRADING_CURRICULUM.length - 1);
  return { ...TRADING_CURRICULUM[index], index };
}

export function activeStudyResource(state) {
  const trackId = state.study?.activeTrack || 'epfc';
  const track = STUDY_TRACKS[trackId] || STUDY_TRACKS.epfc;
  const progress = state.study?.tracks?.[trackId] || {};
  const index = Math.min(Math.max(0, number(progress.index)), track.resources.length - 1);
  return { trackId, track, resource: track.resources[index], index };
}

export function activeReadingBook(state) {
  const shelfId = state.reading?.activeShelf || 'core';
  const shelf = CULTURE_SHELVES[shelfId] || CULTURE_SHELVES.core;
  const progress = state.reading?.shelves?.[shelfId] || {};
  const index = Math.min(Math.max(0, number(progress.index)), shelf.books.length - 1);
  return { shelfId, shelf, book: shelf.books[index], index };
}

export function dueReviews(state, date = localDate()) {
  return (state.study?.reviews || []).filter(review => review.status !== 'done' && review.dueDate <= date).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function reviewSchedule(date = localDate()) {
  return [1, 3, 7, 14, 30].map(interval => ({ interval, dueDate: datePlus(date, interval) }));
}

export function weightTrend(state, window = 14) {
  const rows = [...(state.nutrition?.weightHistory || [])].filter(item => item.date).sort((a, b) => a.date.localeCompare(b.date)).slice(-window);
  if (!rows.length) return { latest: number(state.profile?.weightKg), change: 0, average: number(state.profile?.weightKg), rows: [] };
  const latest = number(rows.at(-1).weightKg);
  const first = number(rows[0].weightKg);
  return { latest, change: latest - first, average: sum(rows, row => row.weightKg) / rows.length, rows };
}

export function monthlyMoneySummary(state, month = localDate().slice(0, 7)) {
  const transactions = (state.money?.transactions || []).filter(item => sameMonth(item.date, month));
  const income = sum(transactions.filter(item => item.type === 'income'), item => item.amount);
  const expenses = sum(transactions.filter(item => item.type === 'expense'), item => item.amount);
  const savings = sum(transactions.filter(item => item.type === 'saving'), item => item.amount);
  const byCategory = {};
  transactions.filter(item => item.type === 'expense').forEach(item => {
    const category = String(item.category || 'Autre');
    byCategory[category] = number(byCategory[category]) + number(item.amount);
  });
  const budgets = state.money?.budgets || {};
  const alerts = Object.entries(budgets).map(([category, limit]) => ({ category, limit: number(limit), spent: number(byCategory[category]) })).filter(item => item.limit > 0 && item.spent > item.limit);
  return { month, income, expenses, savings, net: income - expenses - savings, byCategory, budgets, alerts };
}

export function cashForecast(state, days = 30) {
  const horizon = Math.max(0, number(days, 30)) / 30;
  const settings = state.money?.settings || {};
  const recurring = state.money?.recurring || [];
  const recurringTotal = sum(recurring, row => row.amount);
  const recurringLabels = new Set(recurring.map(row => String(row.label || '').trim().toLowerCase()).filter(Boolean));
  const cutoff = datePlus(localDate(), -90);
  const variable = (state.money?.transactions || []).filter(transaction => transaction.type === 'expense' && transaction.date >= cutoff).filter(transaction => !recurringLabels.has(String(transaction.category || '').trim().toLowerCase()));
  const variableMonthlyAverage = sum(variable, item => item.amount) / 3;

  const balance = number(settings.openingBalance)
    + number(settings.income) * horizon
    - recurringTotal * horizon
    - variableMonthlyAverage * horizon
    - number(settings.savingsTarget) * horizon;
  return Math.round(balance * 100) / 100;
}

export function domainCompletedToday(state, domain, date = localDate()) {
  const day = state.days?.[date] || {};
  if ((day.skipped || []).some(item => item.id === domain)) return true;
  if (domain === 'health') {
    const targets = nutritionTargets(state.profile || {});
    const meal = (state.nutrition?.entries || []).some(item => item.date === date && ['meal', 'custom'].includes(item.kind));
    return meal && number(day.waterMl) >= targets.waterMl * 0.5 && number(day.proteinG) >= targets.proteinG * 0.5;
  }
  if (domain === 'athlete') return (state.sport?.sessions || []).some(item => item.date === date && item.status !== 'skipped');
  if (domain === 'trading') return (state.trading?.sessions || []).some(item => item.date === date) || (state.trading?.trades || []).some(item => item.date === date);
  if (domain === 'study') return (state.study?.sessions || []).some(item => item.date === date) || (state.study?.reviews || []).some(item => item.completedAt?.slice(0, 10) === date);
  if (domain === 'reading') return (state.reading?.sessions || []).some(item => item.date === date);
  return false;
}

function healthOrder(state, targets) {
  const day = state.days?.[localDate()] || {};
  if (number(day.waterMl) < targets.waterMl * 0.5) return { id: 'health', domain: 'Santé', route: 'nutrition', minutes: 3, title: 'Hydratation', detail: `Boire 500 ml · ${day.waterMl || 0}/${targets.waterMl} ml` };
  if (number(day.proteinG) < targets.proteinG * 0.55) return { id: 'health', domain: 'Santé', route: 'nutrition', minutes: 10, title: 'Sécuriser les protéines', detail: `${day.proteinG || 0}/${targets.proteinG} g enregistrés` };
  return { id: 'health', domain: 'Santé', route: 'nutrition', minutes: 5, title: 'Enregistrer le prochain repas', detail: 'Le score santé exige une preuve alimentaire réelle.' };
}
function athleteOrder(state, mode) {
  const next = nextAthleteSession(state);
  const last = lastDate(state.sport?.sessions || [], completedSession);
  const delay = daysBetween(localDate(), last);
  return { id: 'athlete', domain: 'Athlète', route: 'athlete', minutes: mode === 'fatigue' ? Math.min(25, next.duration) : next.duration, title: next.name, detail: `${next.qualities.length} qualités travaillées${delay >= 3 ? ` · dernière séance il y a ${delay} jours` : ''}` };
}
function tradingOrder(state, mode) {
  const active = activeTradingModule(state);
  const readiness = tradingReadiness(state);
  return { id: 'trading', domain: 'Trading', route: 'trading', minutes: mode === 'fatigue' ? 15 : 45, title: `Semaine ${active.week} · ${active.title}`, detail: `${readiness.score}% prêt · preuve : ${active.proof}` };
}
function studyOrder(state, mode) {
  const reviews = dueReviews(state);
  if (reviews.length) return { id: 'study', domain: 'Études', route: 'study', minutes: 15, title: `${reviews.length} révision(s) due(s)`, detail: 'Rappel actif avant nouvelle matière.' };
  const { track, resource } = activeStudyResource(state);
  return { id: 'study', domain: 'Études', route: 'study', minutes: mode === 'fatigue' ? 15 : 35, title: `${track.label} · ${resource[0]}`, detail: `${resource[1]} · preuve : ${resource[2]}` };
}
function readingOrder(state, mode) {
  const { shelf, book } = activeReadingBook(state);
  return { id: 'reading', domain: 'Lecture', route: 'library', minutes: mode === 'fatigue' ? 10 : number(state.reading?.dailyMinutesTarget, 25), title: book.title, detail: `${book.author} · ${shelf.label}` };
}

export function todayOrders(state, date = localDate()) {
  const day = state.days?.[date] || {};
  const mode = effectiveDayMode(state, date);
  const targets = nutritionTargets(state.profile || {});
  const readiness = tradingReadiness(state);
  const lastAthlete = lastDate(state.sport?.sessions || [], completedSession);
  const lastTradeStudy = lastDate(state.trading?.sessions || []);
  const lastStudy = lastDate(state.study?.sessions || []);
  const lastRead = lastDate(state.reading?.sessions || []);

  let candidates = [
    { ...healthOrder(state, targets), score: number(day.waterMl) < targets.waterMl * 0.5 ? 96 : 62 },
    { ...athleteOrder(state, mode), score: daysBetween(date, lastAthlete) >= 2 ? 90 : 58 },
    { ...tradingOrder(state, mode), score: readiness.ready ? 55 : daysBetween(date, lastTradeStudy) >= 1 ? 88 : 68 },
    { ...studyOrder(state, mode), score: dueReviews(state, date).length ? 89 : daysBetween(date, lastStudy) >= 2 ? 82 : 54 },
    { ...readingOrder(state, mode), score: daysBetween(date, lastRead) >= 2 ? 66 : 42 }
  ];

  if (mode === 'recovery') candidates = candidates.filter(item => ['Santé', 'Lecture', 'Études', 'Athlète'].includes(item.domain));
  if (mode === 'fatigue') candidates = candidates.map(item => ({ ...item, minutes: Math.min(15, item.minutes), score: item.id === 'health' ? item.score + 10 : item.score }));
  if (mode === 'execution') candidates = candidates.map(item => ({ ...item, score: ['trading', 'study'].includes(item.id) ? item.score + 12 : item.score }));

  const orders = candidates
    .filter(item => !domainCompletedToday(state, item.id, date))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return { mode, modeLabel: DAY_MODES[mode].label, targets, recovery: recoveryScore(state, date), orders };
}

export function weeklyReview(state, endDate = localDate()) {
  const startDate = datePlus(endDate, -6);
  const dates = Array.from({ length: 7 }, (_, index) => datePlus(startDate, index));
  const sport = (state.sport?.sessions || []).filter(item => item.date >= startDate && item.date <= endDate && completedSession(item));
  const tradingSessions = (state.trading?.sessions || []).filter(item => item.date >= startDate && item.date <= endDate);
  const trades = (state.trading?.trades || []).filter(item => item.date >= startDate && item.date <= endDate);
  const study = (state.study?.sessions || []).filter(item => item.date >= startDate && item.date <= endDate);
  const reading = (state.reading?.sessions || []).filter(item => item.date >= startDate && item.date <= endDate);
  const nutritionDays = dates.map(date => {
    const day = state.days?.[date] || {};
    const targets = nutritionTargets(state.profile || {});
    return number(day.waterMl) >= targets.waterMl * 0.75 && number(day.proteinG) >= targets.proteinG * 0.75;
  }).filter(Boolean).length;
  const averageRecovery = dates.reduce((total, date) => total + recoveryScore(state, date), 0) / 7;
  const coverage = athleteCoverage(state, 14, endDate);
  const tradeStats = propFirmStats(state, trades);
  const money = monthlyMoneySummary(state, endDate.slice(0, 7));

  const domainScores = {
    recovery: Math.round(averageRecovery),
    athlete: Math.min(100, Math.round(sport.length / Math.max(1, number(state.sport?.weeklyTarget, 6)) * 100)),
    trading: Math.min(100, tradingSessions.length * 15 + Math.min(40, tradeStats.validTrades * 4)),
    study: Math.min(100, Math.round(sum(study, item => item.durationMin) / 210 * 100)),
    reading: Math.min(100, Math.round(sum(reading, item => item.durationMin) / 175 * 100)),
    nutrition: Math.round(nutritionDays / 7 * 100)
  };
  const overall = Math.round(Object.values(domainScores).reduce((a, b) => a + b, 0) / Object.keys(domainScores).length);

  const alerts = [];
  coverage.filter(item => item.count < item.target).forEach(item => alerts.push(`Lacune physique : ${item.label}`));
  if (tradeStats.ruleBreaches || tradeStats.personalStopBreaches) alerts.push('Trading : violations de règles détectées');
  if (dueReviews(state, endDate).length) alerts.push(`${dueReviews(state, endDate).length} révision(s) en retard`);
  if (money.alerts.length) alerts.push(`${money.alerts.length} budget(s) dépassé(s)`);
  if (averageRecovery < 55) alerts.push('Récupération moyenne trop basse');

  return {
    startDate,
    endDate,
    overall,
    domainScores,
    sportSessions: sport.length,
    tradingSessions: tradingSessions.length,
    validTrades: tradeStats.validTrades,
    studyMinutes: sum(study, item => item.durationMin),
    readingMinutes: sum(reading, item => item.durationMin),
    readingPages: sum(reading, item => item.pages),
    nutritionDays,
    averageRecovery: Math.round(averageRecovery),
    coverage,
    alerts,
    money
  };
}

export function recommendedFeatures() {
  return [
    { id: 'cloud-sync', label: 'Synchronisation chiffrée multi-appareils', priority: 'P1', status: 'roadmap' },
    { id: 'calendar', label: 'Planning automatique relié au calendrier', priority: 'P1', status: 'roadmap' },
    { id: 'wearables', label: 'Import sommeil, pas et fréquence cardiaque', priority: 'P2', status: 'roadmap' },
    { id: 'broker-import', label: 'Import CSV automatique des trades', priority: 'P1', status: 'roadmap' },
    { id: 'food-scan', label: 'Scan de repas et calcul macros', priority: 'P3', status: 'roadmap' },
    { id: 'notifications', label: 'Rappels locaux intelligents', priority: 'P2', status: 'roadmap' }
  ];
}
