import { CULTURE_DOMAINS, HEALTH_PILLARS, LEARNING_BOOKS, LEARNING_PATH, PREVENTION } from './content.js';

export const VERSION = '7.0.0-nexus';
const DAY_MS = 86_400_000;

export const uid = (prefix = 'id') => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
export const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, num(value)));
export const mean = values => values.length ? values.reduce((sum, value) => sum + num(value), 0) / values.length : 0;
export const euro = value => `${num(value).toFixed(2)} €`;
export const localDate = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
export const dateOffset = (days, from = new Date()) => {
  const copy = new Date(from);
  copy.setDate(copy.getDate() + days);
  return localDate(copy);
};
export const daysBetween = (a, b = localDate()) => Math.floor((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / DAY_MS);

export function ensureState(state) {
  state.nexus ||= {};
  state.nexus.version = VERSION;
  state.nexus.onboarding = { completed: false, goal: 'balanced', name: '', ...state.nexus.onboarding };
  state.nexus.automation = {
    morningPlan: true,
    weakPillarNudge: true,
    weeklyReview: true,
    smartDefaults: true,
    oneTapLogging: true,
    ...state.nexus.automation
  };
  state.nexus.widgets = {
    energy: true,
    health: true,
    learning: true,
    money: true,
    body: true,
    ...state.nexus.widgets
  };
  state.nexus.plans ||= {};
  state.nexus.achievements ||= [];
  state.nexus.notifications ||= [];
  state.nexus.lastRoute ||= 'today';
  state.nexus.focus ||= { running: false, endAt: 0, remaining: 25 * 60, label: '' };

  state.health ||= {};
  state.health.daily ||= {};
  state.health.vitals ||= [];
  state.health.symptoms ||= [];
  state.health.supplements ||= [];
  state.health.prevention ||= PREVENTION.map(([id, label, cadence]) => ({ id, label, cadence, doneAt: '', dueAt: '' }));
  state.health.settings = {
    nicotine: 'none',
    alcoholGoal: 'zero',
    caffeineCutoff: '14:00',
    fruitVegTargetG: 400,
    fiberTargetG: 25,
    activityTargetMin: 150,
    ...state.health.settings
  };

  state.knowledge ||= {};
  state.knowledge.metaIndex = clamp(state.knowledge.metaIndex, 0, LEARNING_PATH.length - 1);
  state.knowledge.sessions ||= [];
  state.knowledge.cards ||= [];
  state.knowledge.cultureSessions ||= [];
  state.knowledge.bookSessions ||= [];
  state.knowledge.books ||= {};
  state.knowledge.cultureIndex = clamp(state.knowledge.cultureIndex, 0, CULTURE_DOMAINS.length - 1);
  state.knowledge.dailyQuestionIndex = clamp(state.knowledge.dailyQuestionIndex, 0, 10_000);

  state.days ||= {};
  state.nutrition ||= { entries: [], weightHistory: [] };
  state.sport ||= { sessions: [], benchmarks: [], weeklyTarget: 4 };
  state.study ||= { sessions: [], reviews: [], tracks: {} };
  state.reading ||= { sessions: [], shelves: {}, notes: [] };
  state.money ||= { settings: {}, recurring: [], transactions: [], budgets: {} };
  state.trading ||= { sessions: [], trades: [], setup: {}, mockChallenges: [], curriculumIndex: 0, risk: {}, preTrade: {} };
  state.ui ||= { theme: 'graphite', density: 'comfortable', route: 'today' };
  return state;
}

export function getDay(state, date = localDate()) {
  ensureState(state);
  state.days[date] ||= {
    energy: 3,
    pain: 0,
    availableMin: 60,
    sleepHours: 7,
    sleepQuality: 3,
    steps: 0,
    restingHr: 0,
    waterMl: 0,
    proteinG: 0,
    calories: 0,
    fiberG: 0,
    completed: [],
    skipped: [],
    blocked: [],
    note: '',
    mode: 'auto'
  };
  state.health.daily[date] ||= {
    fruitVegG: 0,
    activityMin: 0,
    stress: 3,
    mood: 3,
    daylightMin: 0,
    recoveryMin: 0,
    socialMin: 0,
    alcoholUnits: 0,
    sugaryDrinks: 0,
    caffeineLate: false,
    digestiveSymptoms: 0
  };
  return state.days[date];
}

export function dayCombined(state, date = localDate()) {
  ensureState(state);
  getDay(state, date);
  return { ...state.days[date], ...state.health.daily[date] };
}

export function entriesSince(rows = [], days = 7, dateKey = 'date') {
  const start = dateOffset(-(days - 1));
  return rows.filter(item => String(item?.[dateKey] || '') >= start);
}

export function healthScores(raw) {
  const state = ensureState(structuredClone(raw));
  const day = dayCombined(state);
  const healthDay = state.health.daily[localDate()] || {};
  const profile = state.profile || {};
  const targetSleep = num(profile.sleepTargetHours, 7.5);
  const sleepHours = num(day.sleepHours, 0);
  const sleep = sleepHours >= 7 && sleepHours <= 9 ? 100 : clamp(100 - Math.abs(targetSleep - sleepHours) * 24);
  const steps = clamp(num(day.steps) / Math.max(1, num(profile.stepsTarget, 7000)) * 100);
  const sportMinutes = entriesSince(state.sport.sessions, 7).reduce((sum, row) => sum + num(row.durationMin), 0);
  const dailyMinutes = Object.entries(state.health.daily)
    .filter(([date]) => date >= dateOffset(-6))
    .reduce((sum, [, row]) => sum + num(row.activityMin), 0);
  const activityWeek = sportMinutes + dailyMinutes;
  const movement = mean([steps, clamp(activityWeek / Math.max(1, num(state.health.settings.activityTargetMin, 150)) * 100)]);
  const water = clamp(num(day.waterMl) / Math.max(1, num(profile.waterMl, 2500)) * 100);
  const fiber = clamp(Math.max(num(day.fiberG), num(healthDay.fiberG)) / Math.max(1, num(state.health.settings.fiberTargetG, 25)) * 100);
  const plants = clamp(num(healthDay.fruitVegG) / Math.max(1, num(state.health.settings.fruitVegTargetG, 400)) * 100);
  const sugar = num(healthDay.sugaryDrinks) === 0 ? 100 : clamp(100 - num(healthDay.sugaryDrinks) * 35);
  const nutrition = mean([water, fiber, plants, sugar]);
  const vital = [...state.health.vitals].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
  let bp = 55;
  if (vital?.systolic && vital?.diastolic) {
    if (vital.systolic < 120 && vital.diastolic < 80) bp = 100;
    else if (vital.systolic < 130 && vital.diastolic < 80) bp = 80;
    else if (vital.systolic < 140 && vital.diastolic < 90) bp = 60;
    else bp = 30;
  }
  const nicotine = state.health.settings.nicotine === 'none' ? 100 : 0;
  const heart = mean([movement, sleep, nutrition, bp, nicotine]);
  const mood = clamp(num(healthDay.mood, 3) * 20);
  const social = clamp(num(healthDay.socialMin) / 20 * 100);
  const learningToday = [...state.knowledge.sessions, ...state.knowledge.cultureSessions, ...state.knowledge.bookSessions]
    .filter(item => item.date === localDate()).reduce((sum, row) => sum + num(row.minutes), 0);
  const brain = mean([sleep, movement, mood, social, clamp(learningToday / 30 * 100)]);
  const stress = clamp(120 - num(healthDay.stress, 3) * 20);
  const light = clamp(num(healthDay.daylightMin) / 20 * 100);
  const quiet = clamp(num(healthDay.recoveryMin) / 10 * 100);
  const pain = clamp(120 - num(day.pain) * 12);
  const recovery = mean([sleep, stress, light, quiet, pain]);
  const preventionDone = state.health.prevention.filter(item => item.doneAt).length;
  const prevention = clamp(preventionDone / Math.max(1, state.health.prevention.length) * 100);
  const alcohol = num(healthDay.alcoholUnits) === 0 ? 100 : clamp(100 - num(healthDay.alcoholUnits) * 30);
  const caffeine = healthDay.caffeineLate ? 35 : 100;
  const safety = mean([nicotine, alcohol, caffeine]);
  const pillars = { sleep, movement, nutrition, heart, brain, recovery, prevention, safety };
  const systems = {
    energy: mean([sleep, movement, water, stress, pain]),
    heart: mean([heart, bp, sleep, nicotine]),
    brain,
    liver: mean([alcohol, movement, nutrition, sugar]),
    metabolic: mean([movement, nutrition, sleep, bp]),
    gut: mean([fiber, plants, water, clamp(100 - num(healthDay.digestiveSymptoms) * 20)])
  };
  const weakest = HEALTH_PILLARS.map(item => ({ ...item, score: Math.round(pillars[item.id]) })).sort((a, b) => a.score - b.score)[0];
  return {
    overall: Math.round(mean(Object.values(pillars))),
    pillars: Object.fromEntries(Object.entries(pillars).map(([key, value]) => [key, Math.round(value)])),
    systems: Object.fromEntries(Object.entries(systems).map(([key, value]) => [key, Math.round(value)])),
    weakest,
    activityWeek,
    vital,
    learningToday,
    water: num(day.waterMl),
    sleepHours,
    steps: num(day.steps)
  };
}

export function readiness(raw) {
  const state = ensureState(structuredClone(raw));
  const day = dayCombined(state);
  const target = num(state.profile?.sleepTargetHours, 7.5);
  const sleep = clamp(num(day.sleepHours) / target * 100);
  const quality = clamp(num(day.sleepQuality, 3) * 20);
  const energy = clamp(num(day.energy, 3) * 20);
  const pain = clamp(100 - num(day.pain) * 10);
  const score = Math.round(mean([sleep, quality, energy, pain]));
  const mode = score < 45 || num(day.pain) >= 7 ? 'Récupération' : score < 65 ? 'Allégé' : score > 84 ? 'Exécution' : 'Normal';
  return { score, mode, availableMin: num(day.availableMin, 60) };
}

export function dueCards(raw) {
  const state = ensureState(structuredClone(raw));
  return state.knowledge.cards.filter(card => !card.dueDate || card.dueDate <= localDate());
}

export function learningStats(raw) {
  const state = ensureState(structuredClone(raw));
  const metaIds = new Set(state.knowledge.sessions.filter(row => row.kind === 'meta').map(row => row.moduleId));
  const cultureIds = new Set(state.knowledge.cultureSessions.map(row => row.domainId));
  const books = Object.values(state.knowledge.books).filter(row => row.finished).length;
  const minutes7 = entriesSince([...state.knowledge.sessions, ...state.knowledge.cultureSessions, ...state.knowledge.bookSessions], 7)
    .reduce((sum, row) => sum + num(row.minutes), 0);
  const cards = state.knowledge.cards.length;
  const score = Math.round(mean([
    clamp(metaIds.size / LEARNING_PATH.length * 100),
    clamp(cultureIds.size / CULTURE_DOMAINS.length * 100),
    clamp(books / LEARNING_BOOKS.length * 100),
    clamp(cards / 30 * 100),
    clamp(minutes7 / 210 * 100)
  ]));
  return { score, metaDone: metaIds.size, cultureCovered: cultureIds.size, books, cards, due: dueCards(state).length, minutes7 };
}

export function moneyStats(raw) {
  const state = ensureState(structuredClone(raw));
  const month = localDate().slice(0, 7);
  const rows = state.money.transactions.filter(row => String(row.date || '').startsWith(month));
  const income = rows.filter(row => row.type === 'income').reduce((sum, row) => sum + num(row.amount), 0);
  const expenses = rows.filter(row => row.type === 'expense').reduce((sum, row) => sum + num(row.amount), 0);
  const savings = rows.filter(row => row.type === 'saving').reduce((sum, row) => sum + num(row.amount), 0);
  const recurring = state.money.recurring.reduce((sum, row) => sum + num(row.amount), 0);
  const baselineIncome = num(state.money.settings.income, 0);
  const opening = num(state.money.settings.openingBalance, 0);
  const forecast = opening + baselineIncome + income - recurring - expenses - savings;
  const byCategory = {};
  rows.filter(row => row.type === 'expense').forEach(row => { byCategory[row.category || 'Autre'] = num(byCategory[row.category]) + num(row.amount); });
  const alerts = Object.entries(state.money.budgets || {}).filter(([category, limit]) => num(byCategory[category]) > num(limit));
  return { month, income, expenses, savings, recurring, forecast, byCategory, alerts };
}

export function sportStats(raw) {
  const state = ensureState(structuredClone(raw));
  const recent = entriesSince(state.sport.sessions, 7);
  const minutes = recent.reduce((sum, row) => sum + num(row.durationMin), 0);
  const pain = recent.length ? Math.max(...recent.map(row => num(row.pain))) : 0;
  const last = [...state.sport.sessions].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
  const types = ['Force', 'Cardio zone 2', 'Mobilité & tronc', 'Conditionnement', 'Récupération active'];
  const next = pain >= 6 ? 'Récupération active' : types[state.sport.sessions.filter(row => row.advancesCycle !== false).length % types.length];
  return { sessions: recent.length, minutes, pain, last, next };
}

export function tradingPhase(raw) {
  const state = ensureState(structuredClone(raw));
  const setupReady = String(state.trading.setup?.name || '').trim().length >= 3 && String(state.trading.setup?.rules || '').trim().length >= 40;
  const backtests = state.trading.sessions.filter(row => row.kind === 'backtest').reduce((sum, row) => sum + num(row.samples), 0);
  const simulations = state.trading.sessions.filter(row => row.kind === 'execution' && !row.breach).length;
  const trades = state.trading.trades.length;
  const mocks = state.trading.mockChallenges.filter(row => row.status === 'completed' && row.passed).length;
  if (!setupReady) return { index: 0, title: 'Écrire un setup unique', progress: 0, detail: 'Un marché, un déclencheur, un stop et des conditions de non-trade.' };
  if (backtests < 100) return { index: 1, title: 'Backtester 100 cas', progress: backtests, detail: `${backtests}/100 cas mesurés sans changer les règles.` };
  if (simulations < 10 || trades < 30) return { index: 2, title: 'Simulation propre', progress: Math.min(100, Math.round(mean([simulations / 10 * 100, trades / 30 * 100]))), detail: `${simulations}/10 séances · ${trades}/30 trades.` };
  if (mocks < 2) return { index: 3, title: 'Deux mock challenges', progress: mocks * 50, detail: `${mocks}/2 réussis.` };
  return { index: 4, title: 'Gate prêt à être réévalué', progress: 100, detail: 'Revoir les règles officielles avant tout achat.' };
}

export function streak(raw, predicate) {
  const state = ensureState(structuredClone(raw));
  let count = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const date = dateOffset(-offset);
    if (!predicate(state, date)) break;
    count += 1;
  }
  return count;
}

function planItem(id, domain, title, detail, minutes, route, priority = 2) {
  return { id, domain, title, detail, minutes, route, priority };
}

export function smartPlan(raw) {
  const state = ensureState(structuredClone(raw));
  const day = getDay(state);
  const ready = readiness(state);
  const health = healthScores(state);
  const learning = learningStats(state);
  const sport = sportStats(state);
  const money = moneyStats(state);
  const phase = tradingPhase(state);
  const pool = [];
  if (health.weakest.id === 'sleep') pool.push(planItem('sleep', 'Santé', 'Protéger le sommeil', 'Fixe heure de coucher et coupe la caféine tardive.', 10, 'health', 1));
  else pool.push(planItem(`health-${health.weakest.id}`, 'Santé', `Corriger ${health.weakest.label.toLowerCase()}`, health.weakest.target, 15, 'health', 1));
  if (ready.mode === 'Récupération') pool.push(planItem('recovery', 'Corps', 'Récupération active', 'Marche légère, respiration et mobilité sans forcer.', 20, 'body', 1));
  else pool.push(planItem('body', 'Corps', sport.next, `${sport.sessions} séance(s) cette semaine · ${sport.minutes} min.`, ready.mode === 'Allégé' ? 25 : 45, 'body', 2));
  if (learning.due > 0) pool.push(planItem('cards', 'Apprendre', `${learning.due} carte(s) à rappeler`, 'Réponds avant d’afficher la réponse.', 15, 'learn', 1));
  else pool.push(planItem('learn', 'Apprendre', 'Bloc de concentration', '25 minutes, puis une preuve écrite.', 25, 'learn', 2));
  if (learning.cultureCovered < CULTURE_DOMAINS.length) pool.push(planItem('culture', 'Culture', 'Culture générale', 'Travaille un domaine et produis une synthèse de mémoire.', 20, 'culture', 3));
  if (money.alerts.length) pool.push(planItem('budget', 'Argent', 'Budget dépassé', `${money.alerts.length} catégorie(s) dépassée(s).`, 10, 'money', 1));
  else pool.push(planItem('money', 'Argent', 'Capture financière', 'Ajoute les mouvements non enregistrés.', 5, 'money', 4));
  pool.push(planItem('trading', 'Trading', phase.title, phase.detail, 30, 'trading', 4));
  const skipped = new Set((day.skipped || []).map(row => typeof row === 'string' ? row : row.id));
  const completed = new Set(day.completed || []);
  const budget = ready.availableMin;
  const selected = [];
  let used = 0;
  for (const item of pool.sort((a, b) => a.priority - b.priority || a.minutes - b.minutes)) {
    if (selected.length >= 3) break;
    if (completed.has(item.id) || skipped.has(item.id)) continue;
    if (used + item.minutes <= budget || selected.length === 0) {
      selected.push(item);
      used += item.minutes;
    }
  }
  return { items: selected, used, budget, readiness: ready, health, learning, money, sport, phase };
}

export function weeklyReview(raw) {
  const state = ensureState(structuredClone(raw));
  const health = healthScores(state);
  const learn = learningStats(state);
  const money = moneyStats(state);
  const sport = sportStats(state);
  const recentDays = Array.from({ length: 7 }, (_, index) => dayCombined(state, dateOffset(-index)));
  const sleepAvg = mean(recentDays.map(row => num(row.sleepHours)));
  const stepsAvg = mean(recentDays.map(row => num(row.steps)));
  const energyAvg = mean(recentDays.map(row => num(row.energy, 3)));
  const score = Math.round(mean([
    health.overall,
    learn.score,
    clamp(sport.sessions / Math.max(1, num(state.sport.weeklyTarget, 4)) * 100),
    clamp(100 - money.alerts.length * 25),
    clamp(sleepAvg / Math.max(1, num(state.profile?.sleepTargetHours, 7.5)) * 100)
  ]));
  const wins = [];
  const alerts = [];
  if (sleepAvg >= 7) wins.push('Sommeil moyen supérieur ou égal à 7 h.'); else alerts.push(`Sommeil moyen ${sleepAvg.toFixed(1)} h.`);
  if (sport.sessions >= 3) wins.push(`${sport.sessions} séances cette semaine.`); else alerts.push('Volume sportif faible ou non journalisé.');
  if (learn.minutes7 >= 120) wins.push(`${learn.minutes7} minutes d’apprentissage.`); else alerts.push('Moins de deux heures d’apprentissage journalisées.');
  if (!money.alerts.length) wins.push('Aucun budget configuré n’est dépassé.'); else alerts.push(`${money.alerts.length} budget(s) dépassé(s).`);
  if (health.overall < 60) alerts.push(`Score d’habitudes santé ${health.overall}/100.`);
  return { score, sleepAvg, stepsAvg, energyAvg, health, learn, money, sport, wins, alerts };
}

export function dailyQuestionIndex() {
  const epoch = new Date('2026-01-01T12:00:00');
  return Math.abs(Math.floor((new Date() - epoch) / DAY_MS));
}

export function cardInterval(rating, previous = 1) {
  if (rating === 'again') return 1;
  if (rating === 'hard') return Math.max(2, Math.round(previous * 1.5));
  if (rating === 'good') return Math.max(3, Math.round(previous * 2.3));
  return Math.max(7, Math.round(previous * 3.5));
}
