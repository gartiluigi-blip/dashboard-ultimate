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

const completedSession = session => ['completed', 'deload'].includes(session.status);
const dayMs = 86400000;

export function daysBetween(a, b) {
  if (!a || !b) return 999;
  return Math.floor((new Date(`${a}T12:00:00`) - new Date(`${b}T12:00:00`)) / dayMs);
}

export function nutritionTargets(profile = {}) {
  const weight = Math.max(45, Number(profile.weightKg || 75));
  const proteinPerKg = Math.min(2.2, Math.max(1.2, Number(profile.proteinPerKg || 1.8)));
  return {
    proteinG: Math.round(weight * proteinPerKg),
    waterMl: Math.max(1800, Number(profile.waterMl || Math.round(weight * 30))),
    meals: Math.min(6, Math.max(2, Number(profile.mealsPerDay || 4)))
  };
}

export function effectiveDayMode(state, date = localDate()) {
  const day = state.days[date] || {};
  if (day.mode && day.mode !== 'auto' && DAY_MODES[day.mode]) return day.mode;
  const pain = Number(day.pain || 0);
  const energy = Number(day.energy || 3);
  if (pain >= 7) return 'recovery';
  if (energy <= 1 || pain >= 5) return 'fatigue';
  if (Number(day.availableMin || 60) >= 120 && energy >= 4) return 'execution';
  return 'normal';
}

function advancesAthleteCycle(state, session) {
  if (!completedSession(session)) return false;
  if (session.advancesCycle === false) return false;
  if (session.advancesCycle === true) return true;
  const recovery = session.type === 'Récupération active' || (session.qualities || []).includes('recovery');
  if (!recovery) return true;
  const context = state.days?.[session.date] || {};
  return !(Number(context.pain || 0) >= 5 || Number(context.energy || 3) <= 1);
}

export function nextAthleteSession(state, date = localDate()) {
  const day = state.days[date] || {};
  const completed = (state.sport.sessions || []).filter(session => advancesAthleteCycle(state, session)).length;
  const baseIndex = completed % ATHLETE_CYCLE.length;
  if (Number(day.pain || 0) >= 5 || Number(day.energy || 3) <= 1) {
    const recoveryIndex = ATHLETE_CYCLE.findIndex(session => session.recovery);
    return { ...ATHLETE_CYCLE[recoveryIndex], index: recoveryIndex, forcedRecovery: true };
  }
  return { ...ATHLETE_CYCLE[baseIndex], index: baseIndex, forcedRecovery: false };
}

export function athleteCoverage(state, window = 14) {
  const since = new Date();
  since.setDate(since.getDate() - window + 1);
  const counts = Object.fromEntries(ATHLETE_QUALITIES.map(([id]) => [id, 0]));
  (state.sport.sessions || [])
    .filter(completedSession)
    .filter(session => new Date(`${session.date}T12:00:00`) >= since)
    .forEach(session => (session.qualities || []).forEach(id => { if (id in counts) counts[id] += 1; }));
  return ATHLETE_QUALITIES.map(([id, label]) => ({ id, label, count: counts[id], target: id === 'recovery' ? 2 : 1 }));
}

export function sportProgression(previous, drill) {
  const entry = previous?.exercises?.[drill.id] || {};
  if (!entry.actual) return 'Construis une première référence propre.';
  const pain = Math.max(Number(entry.pain || 0), Number(previous?.pain || 0));
  if (pain >= 7) return 'Arrêt et avis médical : aucune progression.';
  if (pain >= 4) return 'Réduis charge, amplitude ou durée de 10 à 20 %.';
  if (Number(entry.rpe || previous?.rpe || 0) <= 8) return 'Progression prudente : +1 répétition, +2 à 5 % ou +2 minutes.';
  return 'Maintiens le niveau jusqu’à exécution propre à RPE ≤ 8.';
}

export function selectedPropPlan(state) {
  const id = state.trading.planId || 'flex50';
  const preset = PROP_FIRM_PRESETS[id] || PROP_FIRM_PRESETS.custom;
  return id === 'custom'
    ? { ...PROP_FIRM_PRESETS.custom, ...(state.trading.customPlan || {}), id }
    : { ...preset, id };
}

export function propFirmStats(state) {
  const plan = selectedPropPlan(state);
  const trades = [...(state.trading.trades || [])].sort((a, b) => `${a.date}${a.createdAt || ''}`.localeCompare(`${b.date}${b.createdAt || ''}`));
  const byDay = new Map();
  let equity = Number(plan.account || 0);
  let peak = equity;
  let intradayMaxDrawdown = 0;
  let grossWin = 0;
  let grossLoss = 0;
  let wins = 0;

  trades.forEach(trade => {
    const pnl = Number(trade.pnl || 0);
    equity += pnl;
    peak = Math.max(peak, equity);
    intradayMaxDrawdown = Math.max(intradayMaxDrawdown, peak - equity);
    byDay.set(trade.date, Number(byDay.get(trade.date) || 0) + pnl);
    if (pnl > 0) { grossWin += pnl; wins += 1; }
    if (pnl < 0) grossLoss += Math.abs(pnl);
  });

  let eodEquity = Number(plan.account || 0);
  let eodPeak = eodEquity;
  let eodMaxDrawdown = 0;
  for (const pnl of byDay.values()) {
    eodEquity += pnl;
    eodPeak = Math.max(eodPeak, eodEquity);
    eodMaxDrawdown = Math.max(eodMaxDrawdown, eodPeak - eodEquity);
  }

  const totalPnl = trades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  const positiveDays = [...byDay.values()].filter(value => value > 0);
  const bestDay = positiveDays.length ? Math.max(...positiveDays) : 0;
  const consistency = totalPnl > 0 ? (bestDay / totalPnl) * 100 : 0;
  const avgWin = wins ? grossWin / wins : 0;
  const losses = trades.filter(trade => Number(trade.pnl || 0) < 0).length;
  const avgLoss = losses ? grossLoss / losses : 0;
  const expectancy = trades.length ? (wins / trades.length) * avgWin - (losses / trades.length) * avgLoss : 0;
  const breaches = trades.filter(trade => trade.breach).length;
  const riskR = trades.filter(trade => Number(trade.risk || 0) > 0).map(trade => Number(trade.pnl || 0) / Number(trade.risk));
  const averageR = riskR.length ? riskR.reduce((a, b) => a + b, 0) / riskR.length : 0;
  const maxDrawdown = plan.drawdown === 'EOD' ? eodMaxDrawdown : intradayMaxDrawdown;
  const personalDailyStop = Number(state.trading.risk?.dailyStop || 0);
  const personalStopBreaches = personalDailyStop > 0
    ? [...byDay.values()].filter(pnl => pnl < -personalDailyStop).length
    : 0;

  return {
    plan,
    trades: trades.length,
    tradingDays: byDay.size,
    totalPnl,
    remainingTarget: Math.max(0, Number(plan.profitTarget || 0) - totalPnl),
    bestDay,
    consistency,
    maxDrawdown,
    eodMaxDrawdown,
    intradayMaxDrawdown,
    drawdownRemaining: Math.max(0, Number(plan.maxLoss || 0) - maxDrawdown),
    winRate: trades.length ? (wins / trades.length) * 100 : 0,
    profitFactor: grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    expectancy,
    averageR,
    breaches,
    personalStopBreaches
  };
}

export function tradingReadiness(state) {
  const stats = propFirmStats(state);
  const sessions = state.trading.sessions || [];
  const backtestSamples = sessions.reduce((sum, item) => sum + Number(item.samples || 0), 0);
  const cleanExecutionSessions = sessions.filter(item => item.kind === 'execution' && !item.breach).length;
  const mockChallenges = Number(state.trading.mockChallenges || 0);
  const playbookReady = Boolean((state.trading.setup?.name || '').trim() && (state.trading.setup?.rules || '').trim().length >= 40);
  const drawdownBuffer = Number(stats.plan.maxLoss || 0) > 0 && stats.maxDrawdown <= Number(stats.plan.maxLoss) * 0.6;
  const consistencyOk = stats.totalPnl > 0 && stats.tradingDays >= 2 && stats.consistency <= Number(stats.plan.consistencyPct || 100);
  const criteria = [
    { id: 'setup', label: 'Un setup écrit et testable', ok: playbookReady },
    { id: 'sample', label: '100 occurrences backtestées', ok: backtestSamples >= 100, value: `${backtestSamples}/100` },
    { id: 'trades', label: '30 trades simulés journalisés', ok: stats.trades >= 30, value: `${stats.trades}/30` },
    { id: 'expectancy', label: 'Expectancy positive', ok: stats.expectancy > 0, value: stats.expectancy.toFixed(2) },
    { id: 'profit-factor', label: 'Profit factor ≥ 1,20', ok: stats.profitFactor >= 1.2, value: Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞' },
    { id: 'drawdown', label: 'Drawdown ≤ 60 % de la limite', ok: drawdownBuffer, value: `${Math.round(stats.maxDrawdown)}/${stats.plan.maxLoss}` },
    { id: 'consistency', label: 'Cohérence conforme au plan', ok: consistencyOk, value: `${stats.consistency.toFixed(1)} %` },
    { id: 'execution', label: '10 séances propres en replay/sim', ok: cleanExecutionSessions >= 10, value: `${cleanExecutionSessions}/10` },
    { id: 'mock', label: '2 mock challenges sans breach', ok: mockChallenges >= 2, value: `${mockChallenges}/2` },
    { id: 'rules', label: 'Aucune violation enregistrée', ok: stats.breaches === 0 && stats.personalStopBreaches === 0, value: `${stats.breaches + stats.personalStopBreaches}` }
  ];
  return {
    criteria,
    score: Math.round(criteria.filter(item => item.ok).length / criteria.length * 100),
    ready: criteria.every(item => item.ok),
    backtestSamples,
    cleanExecutionSessions
  };
}

export function activeTradingModule(state) {
  const index = Math.min(Math.max(0, Number(state.trading.curriculumIndex || 0)), TRADING_CURRICULUM.length - 1);
  return { ...TRADING_CURRICULUM[index], index };
}

export function activeStudyResource(state) {
  const trackId = state.study.activeTrack || 'epfc';
  const track = STUDY_TRACKS[trackId] || STUDY_TRACKS.epfc;
  const progress = state.study.tracks[trackId] || {};
  const index = Math.min(Math.max(0, Number(progress.index || 0)), track.resources.length - 1);
  return { trackId, track, resource: track.resources[index], index };
}

export function activeReadingBook(state) {
  const shelfId = state.reading.activeShelf || 'core';
  const shelf = CULTURE_SHELVES[shelfId] || CULTURE_SHELVES.core;
  const progress = state.reading.shelves[shelfId] || {};
  const index = Math.min(Math.max(0, Number(progress.index || 0)), shelf.books.length - 1);
  return { shelfId, shelf, book: shelf.books[index], index };
}

export function cashForecast(state, days = 30) {
  const horizon = Math.max(0, Number(days || 30)) / 30;
  const settings = state.money.settings || {};
  const recurring = state.money.recurring || [];
  const recurringTotal = recurring.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const recurringLabels = new Set(recurring.map(row => String(row.label || '').trim().toLowerCase()).filter(Boolean));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const variableExpenses = (state.money.transactions || [])
    .filter(transaction => transaction.type === 'expense')
    .filter(transaction => new Date(`${transaction.date || localDate()}T12:00:00`) >= cutoff)
    .filter(transaction => !recurringLabels.has(String(transaction.category || '').trim().toLowerCase()))
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const balance = Number(settings.openingBalance || 0)
    + Number(settings.income || 0) * horizon
    - recurringTotal * horizon
    - variableExpenses * horizon
    - Number(settings.savingsTarget || 0) * horizon;
  return Math.round(balance * 100) / 100;
}

function lastDate(items, predicate = () => true) {
  return items.filter(predicate).map(item => item.date).filter(Boolean).sort().at(-1) || '';
}

function healthOrder(state, targets) {
  const day = state.days[localDate()] || {};
  if (Number(day.waterMl || 0) < targets.waterMl * 0.5) {
    return { id: 'health', domain: 'Santé', route: 'nutrition', minutes: 3, title: 'Hydratation', detail: `Boire 500 ml · ${day.waterMl || 0}/${targets.waterMl} ml` };
  }
  if (Number(day.proteinG || 0) < targets.proteinG * 0.55) {
    return { id: 'health', domain: 'Santé', route: 'nutrition', minutes: 10, title: 'Sécuriser les protéines', detail: `${day.proteinG || 0}/${targets.proteinG} g enregistrés` };
  }
  return { id: 'health', domain: 'Santé', route: 'nutrition', minutes: 5, title: 'Préparer le prochain repas', detail: 'Choisis le menu ou une substitution simple.' };
}

function athleteOrder(state, mode) {
  const next = nextAthleteSession(state);
  const last = lastDate(state.sport.sessions || [], completedSession);
  const delay = daysBetween(localDate(), last);
  return {
    id: 'athlete',
    domain: 'Athlète',
    route: 'athlete',
    minutes: mode === 'fatigue' ? Math.min(25, next.duration) : next.duration,
    title: next.name,
    detail: `${next.qualities.length} qualités travaillées${delay >= 3 ? ` · dernière séance il y a ${delay} jours` : ''}`
  };
}

function tradingOrder(state, mode) {
  const active = activeTradingModule(state);
  const readiness = tradingReadiness(state);
  return {
    id: 'trading',
    domain: 'Trading',
    route: 'trading',
    minutes: mode === 'fatigue' ? 15 : 45,
    title: `Semaine ${active.week} · ${active.title}`,
    detail: `${readiness.score}% prêt pour challenge · preuve : ${active.proof}`
  };
}

function studyOrder(state, mode) {
  const { track, resource } = activeStudyResource(state);
  return {
    id: 'study',
    domain: 'Études',
    route: 'study',
    minutes: mode === 'fatigue' ? 15 : 35,
    title: `${track.label} · ${resource[0]}`,
    detail: `${resource[1]} · preuve : ${resource[2]}`
  };
}

function readingOrder(state, mode) {
  const { shelf, book } = activeReadingBook(state);
  return {
    id: 'reading',
    domain: 'Lecture',
    route: 'library',
    minutes: mode === 'fatigue' ? 10 : 25,
    title: book.title,
    detail: `${book.author} · ${shelf.label}`
  };
}

export function todayOrders(state) {
  const date = localDate();
  const day = state.days[date] || {};
  const completed = new Set(day.completed || []);
  const mode = effectiveDayMode(state, date);
  const targets = nutritionTargets(state.profile);
  const readiness = tradingReadiness(state);
  const lastAthlete = lastDate(state.sport.sessions || [], completedSession);
  const lastTradeStudy = lastDate(state.trading.sessions || []);
  const lastStudy = lastDate(state.study.sessions || []);
  const lastRead = lastDate(state.reading.sessions || []);

  let candidates = [
    { ...healthOrder(state, targets), score: Number(day.waterMl || 0) < targets.waterMl * 0.5 ? 95 : 62 },
    { ...athleteOrder(state, mode), score: daysBetween(date, lastAthlete) >= 2 ? 90 : 58 },
    { ...tradingOrder(state, mode), score: readiness.ready ? 55 : daysBetween(date, lastTradeStudy) >= 1 ? 88 : 68 },
    { ...studyOrder(state, mode), score: daysBetween(date, lastStudy) >= 2 ? 82 : 54 },
    { ...readingOrder(state, mode), score: daysBetween(date, lastRead) >= 2 ? 66 : 42 }
  ];

  if (mode === 'recovery') candidates = candidates.filter(item => ['Santé', 'Lecture', 'Études', 'Athlète'].includes(item.domain));
  if (mode === 'fatigue') candidates = candidates.map(item => ({ ...item, minutes: Math.min(15, item.minutes), score: item.domain === 'Santé' ? item.score + 10 : item.score }));
  if (mode === 'execution') candidates = candidates.map(item => ({ ...item, score: ['Trading', 'Études'].includes(item.domain) ? item.score + 12 : item.score }));

  const orders = candidates
    .filter(item => !completed.has(item.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return { mode, modeLabel: DAY_MODES[mode].label, targets, orders };
}
