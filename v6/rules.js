import { DAY_MODES, SPORT_PROGRAM, STUDY_TRACKS } from './content.js';
import { localDate } from './store.js';

const completedSport = session => ['completed', 'deload'].includes(session.status);
const daysBetween = (a, b) => Math.floor((new Date(`${a}T12:00:00`) - new Date(`${b}T12:00:00`)) / 86400000);

export function nutritionTargets(profile) {
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

export function nextWorkout(state) {
  const completed = state.sport.sessions.filter(completedSport).length;
  const index = completed % SPORT_PROGRAM.length;
  return { ...SPORT_PROGRAM[index], index };
}

export function sportProgression(previous, exercise) {
  const sets = previous?.exercises?.[exercise.id]?.sets || [];
  if (!sets.length) return 'Première référence : charge légère et technique propre.';
  const pain = Math.max(...sets.map(set => Number(set.pain || 0)), Number(previous.pain || 0));
  const rir = sets.map(set => Number(set.rir)).filter(Number.isFinite);
  const reps = sets.map(set => Number(set.reps || 0));
  const targetTop = Number(String(exercise.target).match(/(\d+)(?!.*\d)/)?.[1] || 0);
  const allTop = targetTop > 0 && reps.length >= exercise.sets && reps.every(value => value >= targetTop);
  const controlled = !rir.length || rir.every(value => value >= 1 && value <= 3);
  if (pain >= 7) return 'Arrêt : douleur élevée. Pas de progression.';
  if (pain >= 4) return 'Réduire charge ou amplitude de 10 à 20 %.';
  if (allTop && controlled) return 'Progression proposée : +1 à 2 kg ou variante légèrement plus dure.';
  return 'Maintenir la charge et gagner des répétitions propres.';
}

export function vintedCost(item) {
  return (item.transactions || [])
    .filter(transaction => ['purchase', 'shipping', 'boost', 'packaging', 'fee'].includes(transaction.type))
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
}

export function vintedRevenue(item) {
  return (item.transactions || [])
    .filter(transaction => transaction.type === 'sale')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
}

export function vintedResult(item) {
  return vintedRevenue(item) - vintedCost(item);
}

export function vintedDecision(item, today = localDate()) {
  if (item.status === 'sold') return { label: vintedResult(item) >= 0 ? 'PROFIT' : 'PERTE', priority: vintedResult(item) >= 0 ? 0 : 100, reason: 'Vente clôturée' };
  if (item.status === 'abandoned') return { label: 'ARCHIVÉ', priority: 0, reason: 'Sorti du stock actif' };
  const cost = vintedCost(item);
  const asking = Number(item.asking || 0);
  const age = Math.max(0, daysBetween(today, item.listedAt || today));
  const margin = asking ? (asking - cost) / asking : -1;
  if (!asking) return { label: 'COMPLÉTER', priority: 100, reason: 'Prix manquant' };
  if (asking < cost) return { label: 'CORRIGER', priority: 95, reason: 'Prix sous le coût réel' };
  if (age >= 60) return { label: 'SORTIR', priority: 90, reason: 'Stock immobilisé depuis 60 jours' };
  if (age >= 30 && margin < 0.25) return { label: 'SORTIR', priority: 85, reason: 'Marge faible après 30 jours' };
  if (age >= 30) return { label: 'BAISSER', priority: 75, reason: 'Aucune vente après 30 jours' };
  if (age >= 14) return { label: 'TESTER PRIX', priority: 55, reason: 'Annonce active depuis 14 jours' };
  return { label: 'GARDER', priority: 10, reason: 'Annonce encore saine' };
}

export function cashForecast(state, days = 30) {
  const settings = state.money.settings;
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  let balance = Number(settings.openingBalance || 0);
  balance += Number(settings.income || 0) * (days / 30);
  const recurring = state.money.recurring.reduce((sum, row) => sum + Number(row.amount || 0), 0) * (days / 30);
  balance -= recurring;
  const recent = state.money.transactions
    .filter(transaction => {
      const date = new Date(`${transaction.date || localDate()}T12:00:00`);
      return date >= now && date <= end;
    })
    .reduce((sum, transaction) => sum + (transaction.type === 'income' ? Number(transaction.amount || 0) : -Number(transaction.amount || 0)), 0);
  return Math.round((balance + recent) * 100) / 100;
}

function lastStudyDays(state, days = 14) {
  const today = localDate();
  return new Set(state.study.sessions.filter(session => session.date && daysBetween(today, session.date) >= 0 && daysBetween(today, session.date) < days).map(session => session.date)).size;
}

function lastSportDate(state) {
  return state.sport.sessions.filter(completedSport).map(session => session.date).filter(Boolean).sort().at(-1) || '';
}

function activeVintedActions(state) {
  return state.money.vinted
    .filter(item => !['sold', 'abandoned'].includes(item.status))
    .map(item => ({ item, decision: vintedDecision(item) }))
    .filter(row => row.decision.priority >= 55)
    .sort((a, b) => b.decision.priority - a.decision.priority);
}

function studyOrder(state, short = false) {
  const trackId = state.study.activeTrack || 'epfc';
  const track = STUDY_TRACKS[trackId] || STUDY_TRACKS.epfc;
  const trackState = state.study.tracks[trackId] || {};
  const index = Math.min(Number(trackState.index || trackState.bookIndex || 0), track.resources.length - 1);
  const resource = track.resources[Math.max(0, index)];
  return {
    id: 'study',
    domain: 'study',
    route: 'study',
    minutes: short ? 10 : 30,
    title: `${track.label} · ${resource[0]}`,
    detail: `${resource[1]} · preuve attendue : ${resource[2]}`
  };
}

function healthOrder(state, targets) {
  const day = state.days[localDate()] || {};
  if (Number(day.waterMl || 0) < targets.waterMl * 0.5) {
    return { id: 'water', domain: 'nutrition', route: 'nutrition', minutes: 2, title: 'Boire 500 ml', detail: `${day.waterMl || 0}/${targets.waterMl} ml enregistrés` };
  }
  if (Number(day.proteinG || 0) < targets.proteinG * 0.55) {
    return { id: 'protein', domain: 'nutrition', route: 'nutrition', minutes: 10, title: 'Préparer une source de protéines', detail: `${day.proteinG || 0}/${targets.proteinG} g enregistrés` };
  }
  return { id: 'nutrition', domain: 'nutrition', route: 'nutrition', minutes: 5, title: 'Sécuriser le prochain repas', detail: 'Choisir le repas ou une substitution rapide.' };
}

function sportOrder(state, mode) {
  const workout = nextWorkout(state);
  const last = lastSportDate(state);
  const delay = last ? daysBetween(localDate(), last) : 99;
  if (workout.recovery || mode === 'recovery') {
    return { id: 'sport', domain: 'sport', route: 'sport', minutes: 15, title: 'Récupération active', detail: 'Marche ou vélo facile, sans provoquer de douleur.' };
  }
  return { id: 'sport', domain: 'sport', route: 'sport', minutes: mode === 'fatigue' ? 20 : 50, title: `Sport · ${workout.name}`, detail: `${workout.focus}${delay >= 4 ? ` · dernière séance il y a ${delay} jours` : ''}` };
}

function moneyOrder(state) {
  const urgent = activeVintedActions(state)[0];
  if (urgent) return { id: 'money', domain: 'money', route: 'money', minutes: 10, title: `Vinted · ${urgent.decision.label}`, detail: `${urgent.item.name} · ${urgent.decision.reason}` };
  const forecast = cashForecast(state, 30);
  return { id: 'money', domain: 'money', route: 'money', minutes: 5, title: 'Contrôle cash', detail: `Prévision 30 jours : ${forecast.toFixed(2)} €` };
}

export function todayOrders(state) {
  const date = localDate();
  const day = state.days[date] || {};
  const completed = new Set(day.completed || []);
  const mode = effectiveDayMode(state, date);
  const targets = nutritionTargets(state.profile);
  const study = studyOrder(state, mode === 'fatigue' || mode === 'recovery');
  const health = healthOrder(state, targets);
  const sport = sportOrder(state, mode);
  const money = moneyOrder(state);
  const studyDays = lastStudyDays(state);
  const sportDelay = lastSportDate(state) ? daysBetween(date, lastSportDate(state)) : 99;
  const vintedUrgent = activeVintedActions(state).length;

  let candidates = [
    { ...study, score: studyDays < 3 ? 85 : 55 },
    { ...health, score: Number(day.waterMl || 0) < targets.waterMl * 0.5 ? 90 : 60 },
    { ...sport, score: sportDelay >= 4 ? 88 : 50 },
    { ...money, score: vintedUrgent ? 82 : 40 }
  ];

  if (mode === 'recovery') candidates = candidates.filter(item => ['nutrition', 'study', 'sport'].includes(item.domain));
  if (mode === 'fatigue') candidates = candidates.map(item => ({ ...item, minutes: Math.min(item.minutes, 15), score: item.domain === 'nutrition' ? item.score + 15 : item.score }));
  if (mode === 'execution') candidates = candidates.map(item => ({ ...item, score: item.domain === 'study' ? item.score + 20 : item.score }));

  const orders = candidates
    .filter(item => !completed.has(item.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return { mode, modeLabel: DAY_MODES[mode].label, targets, orders };
}
