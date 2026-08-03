import * as Store from './store.js';
import {
  CULTURE_DOMAINS,
  CULTURE_QUESTIONS,
  ENERGY_PROTOCOL,
  HEALTH_PILLARS,
  LEARNING_BOOKS,
  META_LEARNING_PATH,
  ORGAN_SYSTEMS,
  PREVENTION_ITEMS,
  SOURCE_LADDER
} from './godmode-content.js';

const app = document.querySelector('#app');
const tabs = document.querySelector('#tabs');
const toastNode = document.querySelector('#toast');
const CUSTOM_ROUTES = new Set(['health', 'knowledge']);
const today = () => Store.localDate();
const uid = prefix => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;
let customRoute = null;
let quizRevealed = false;
let timer = { endAt: 0, remaining: 25 * 60, interval: null, running: false };
let decorating = false;

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}
function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function clamp(value, min = 0, max = 100) { return Math.min(max, Math.max(min, num(value))); }
function mean(values) { return values.length ? values.reduce((sum, value) => sum + num(value), 0) / values.length : 0; }
function formatDate(value) {
  if (!value) return 'Jamais';
  try { return new Intl.DateTimeFormat('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)); }
  catch { return value; }
}
function toast(message, tone = '') {
  if (!toastNode) return;
  toastNode.textContent = message;
  toastNode.dataset.tone = tone;
  toastNode.classList.add('show');
  clearTimeout(window.__godToast);
  window.__godToast = window.setTimeout(() => toastNode.classList.remove('show'), 2800);
}
function button(label, action, className = '', attrs = '') {
  return `<button type="button" class="btn ${className}" data-god-action="${action}" ${attrs}>${esc(label)}</button>`;
}
function progress(value, label = '') {
  const score = Math.round(clamp(value));
  return `<div class="god-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${score}">${label ? `<div><span>${esc(label)}</span><b>${score}%</b></div>` : ''}<i><span style="width:${score}%"></span></i></div>`;
}
function card(title, body, className = '', eyebrow = '') {
  return `<section class="panel god-panel ${className}"><header class="panel-head">${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}<h2>${esc(title)}</h2></header>${body}</section>`;
}
function metric(label, value, detail = '', tone = '') {
  return `<article class="metric-card god-metric ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`;
}
function ensureDomains(state) {
  state.health ||= {};
  state.health.daily ||= {};
  state.health.vitals ||= [];
  state.health.symptoms ||= [];
  state.health.supplements ||= [];
  state.health.settings = {
    nicotine: 'none',
    alcoholGoal: 'zero',
    caffeineCutoff: '14:00',
    fruitVegTargetG: 400,
    fiberTargetG: 25,
    activityTargetMin: 150,
    ...state.health.settings
  };
  state.health.prevention ||= PREVENTION_ITEMS.map(item => ({ ...item, doneAt: '', dueNote: '' }));
  state.knowledge ||= {};
  state.knowledge.metaIndex = Math.max(0, Math.min(META_LEARNING_PATH.length - 1, num(state.knowledge.metaIndex)));
  state.knowledge.sessions ||= [];
  state.knowledge.cultureIndex = Math.max(0, Math.min(CULTURE_DOMAINS.length - 1, num(state.knowledge.cultureIndex)));
  state.knowledge.cultureSessions ||= [];
  state.knowledge.cards ||= [];
  state.knowledge.books ||= {};
  state.knowledge.bookSessions ||= [];
}
function normalized(state) {
  const copy = structuredClone(state);
  ensureDomains(copy);
  return copy;
}
function dayData(state, date = today()) {
  return { ...(state.days?.[date] || {}), ...(state.health?.daily?.[date] || {}) };
}
function sessionsSince(rows = [], days = 7) {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return rows.filter(item => new Date(`${item.date || today()}T12:00:00`) >= cutoff);
}
function recentVital(state) { return [...(state.health.vitals || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null; }
function weeklyActivityMinutes(state) {
  const healthMinutes = sessionsSince(Object.entries(state.health.daily || {}).map(([date, row]) => ({ date, minutes: num(row.activityMin) }))).reduce((sum, row) => sum + row.minutes, 0);
  const sportMinutes = sessionsSince(state.sport?.sessions || []).reduce((sum, row) => sum + num(row.durationMin), 0);
  return healthMinutes + sportMinutes;
}
function knowledgeMinutesToday(state) {
  return [...(state.knowledge.sessions || []), ...(state.knowledge.cultureSessions || []), ...(state.knowledge.bookSessions || [])]
    .filter(item => item.date === today()).reduce((sum, item) => sum + num(item.minutes), 0);
}
function healthScores(rawState) {
  const state = normalized(rawState);
  const day = dayData(state);
  const profile = state.profile || {};
  const daily = state.health.daily?.[today()] || {};
  const targetSleep = num(profile.sleepTargetHours, 7.5);
  const sleepHours = num(day.sleepHours, 0);
  const sleepScore = sleepHours >= 7 && sleepHours <= 9 ? 100 : clamp(100 - Math.abs(targetSleep - sleepHours) * 24);
  const stepsScore = clamp(num(day.steps) / Math.max(1, num(profile.stepsTarget, 7000)) * 100);
  const activityWeek = weeklyActivityMinutes(state);
  const movementScore = mean([stepsScore, clamp(activityWeek / num(state.health.settings.activityTargetMin, 150) * 100)]);
  const fruitVegScore = clamp(num(daily.fruitVegG) / num(state.health.settings.fruitVegTargetG, 400) * 100);
  const fiber = Math.max(num(day.fiberG), num(daily.fiberG));
  const fiberScore = clamp(fiber / num(state.health.settings.fiberTargetG, 25) * 100);
  const hydrationScore = clamp(num(day.waterMl) / Math.max(1, num(profile.waterMl, 2500)) * 100);
  const nutritionScore = mean([fruitVegScore, fiberScore, hydrationScore, num(daily.sugaryDrinks) === 0 ? 100 : clamp(100 - num(daily.sugaryDrinks) * 35)]);
  const vital = recentVital(state);
  let bpScore = 55;
  if (vital?.systolic && vital?.diastolic) {
    if (vital.systolic < 120 && vital.diastolic < 80) bpScore = 100;
    else if (vital.systolic < 130 && vital.diastolic < 80) bpScore = 82;
    else if (vital.systolic < 140 && vital.diastolic < 90) bpScore = 62;
    else bpScore = 30;
  }
  const cardioScore = mean([movementScore, sleepScore, nutritionScore, bpScore]);
  const stressScore = clamp(120 - num(daily.stress, 3) * 20);
  const moodScore = clamp(num(daily.mood, 3) * 20);
  const socialScore = clamp(num(daily.socialMin) / 20 * 100);
  const learningScore = clamp(knowledgeMinutesToday(state) / 30 * 100);
  const brainScore = mean([sleepScore, movementScore, moodScore, socialScore, learningScore]);
  const lightScore = clamp(num(daily.daylightMin) / 20 * 100);
  const breathingScore = clamp(num(daily.recoveryMin) / 10 * 100);
  const recoveryScore = mean([sleepScore, stressScore, lightScore, breathingScore, clamp(120 - num(day.pain) * 12)]);
  const preventionDone = (state.health.prevention || []).filter(item => item.doneAt).length;
  const preventionScore = clamp(preventionDone / Math.max(1, PREVENTION_ITEMS.length) * 100);
  const nicotineScore = state.health.settings.nicotine === 'none' ? 100 : 0;
  const alcoholScore = num(daily.alcoholUnits) === 0 ? 100 : clamp(100 - num(daily.alcoholUnits) * 30);
  const caffeineScore = daily.caffeineLate ? 35 : 100;
  const safetyScore = mean([nicotineScore, alcoholScore, caffeineScore]);
  const pillars = {
    sleep: sleepScore,
    movement: movementScore,
    nutrition: nutritionScore,
    cardio: cardioScore,
    brain: brainScore,
    recovery: recoveryScore,
    prevention: preventionScore,
    safety: safetyScore
  };
  const overall = Math.round(mean(Object.values(pillars)));
  const organ = {
    energy: Math.round(mean([sleepScore, hydrationScore, movementScore, stressScore, clamp(120 - num(day.pain) * 12)])),
    heart: Math.round(mean([cardioScore, bpScore, nicotineScore, sleepScore])),
    brain: Math.round(brainScore),
    liver: Math.round(mean([alcoholScore, nutritionScore, movementScore, num(daily.sugaryDrinks) === 0 ? 100 : 45])),
    metabolic: Math.round(mean([movementScore, nutritionScore, sleepScore, bpScore])),
    gut: Math.round(mean([fiberScore, fruitVegScore, hydrationScore, clamp(100 - num(daily.digestiveSymptoms) * 20)]))
  };
  const weakest = HEALTH_PILLARS.map(item => ({ ...item, score: Math.round(pillars[item.id]) })).sort((a, b) => a.score - b.score)[0];
  return { overall, pillars, organ, weakest, activityWeek, sleepHours, fiber, fruitVeg: num(daily.fruitVegG), bpScore, vital };
}
function sleepDebt(state) {
  const target = num(state.profile?.sleepTargetHours, 7.5);
  const rows = Object.entries(state.days || {}).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);
  return rows.reduce((sum, [, row]) => sum + Math.max(0, target - num(row.sleepHours, target)), 0);
}
function dueCards(state) { return (state.knowledge.cards || []).filter(item => !item.dueDate || item.dueDate <= today()); }
function knowledgeStats(rawState) {
  const state = normalized(rawState);
  const metaDone = new Set((state.knowledge.sessions || []).filter(item => item.kind === 'meta').map(item => item.moduleId)).size;
  const cultureCovered = new Set((state.knowledge.cultureSessions || []).map(item => item.domainId)).size;
  const booksFinished = Object.values(state.knowledge.books || {}).filter(item => item.finished).length;
  const totalMinutes = [...state.knowledge.sessions, ...state.knowledge.cultureSessions, ...state.knowledge.bookSessions].reduce((sum, row) => sum + num(row.minutes), 0);
  const score = Math.round(mean([
    clamp(metaDone / META_LEARNING_PATH.length * 100),
    clamp(cultureCovered / CULTURE_DOMAINS.length * 100),
    clamp(booksFinished / 8 * 100),
    clamp(state.knowledge.cards.length)
  ]));
  return { metaDone, cultureCovered, booksFinished, totalMinutes, score, due: dueCards(state).length };
}
function healthPriorityText(pillar) {
  const map = {
    sleep: 'Ce soir, protège une fenêtre de 7–9 heures et une heure de lever stable.',
    movement: 'Ajoute 20–30 minutes de marche active ou exécute la séance Athlète prévue.',
    nutrition: 'Atteins 400 g de fruits/légumes, 25 g de fibres et ton objectif d’eau.',
    cardio: 'Mesure correctement ta tension si tu disposes d’un tensiomètre et garde le cardio régulier.',
    brain: 'Fais 30 minutes de rappel actif ou de culture, puis explique ce que tu as appris.',
    recovery: 'Prends 10 minutes sans écran : respiration lente, lumière extérieure et marche légère.',
    prevention: 'Choisis un contrôle préventif en retard et programme-le.',
    safety: 'Évite nicotine, alcool et caféine tardive; vérifie les interactions avant tout complément.'
  };
  return map[pillar.id] || pillar.target;
}
function renderHealth(rawState) {
  const state = normalized(rawState);
  const score = healthScores(state);
  const day = dayData(state);
  const daily = state.health.daily[today()] || {};
  const vital = score.vital || {};
  const prevention = state.health.prevention.map(item => `<article class="god-check-row ${item.doneAt ? 'done' : ''}"><div><b>${esc(item.label)}</b><small>${esc(item.cadence)} · ${esc(item.category)}</small></div><div class="god-row-actions">${item.doneAt ? `<span class="tag">${formatDate(item.doneAt)}</span>` : ''}${button(item.doneAt ? 'Réinitialiser' : 'Marquer fait', 'prevention-toggle', item.doneAt ? 'quiet' : '', `data-id="${item.id}"`)}</div></article>`).join('');
  const symptoms = state.health.symptoms.slice(-6).reverse().map(item => `<div class="history-line"><div><b>${esc(item.date)} · ${esc(item.label)}</b><small>intensité ${item.severity}/10 · ${esc(item.note)}</small></div>${button('Supprimer', 'health-delete', 'icon danger', `data-kind="symptom" data-id="${item.id}"`)}</div>`).join('') || '<div class="empty">Aucun symptôme journalisé.</div>';
  const supplements = state.health.supplements.slice(-6).reverse().map(item => `<div class="history-line"><div><b>${esc(item.name)}</b><small>${esc(item.goal)} · preuve ${esc(item.evidence)} · ${esc(item.decision)}</small></div>${button('Supprimer', 'health-delete', 'icon danger', `data-kind="supplement" data-id="${item.id}"`)}</div>`).join('') || '<div class="empty">Aucun complément évalué.</div>';
  const organCards = ORGAN_SYSTEMS.map(item => `<article class="organ-card"><div class="organ-head"><span>${esc(item.icon)}</span><div><b>${esc(item.label)}</b><strong>${score.organ[item.id]}%</strong></div></div>${progress(score.organ[item.id])}<p>${esc(item.note)}</p><small>${esc(item.inputs.join(' · '))}</small></article>`).join('');
  const pillarCards = HEALTH_PILLARS.map(item => `<article class="pillar-card ${item.id === score.weakest.id ? 'weak' : ''}"><div><span>${esc(item.icon)}</span><b>${esc(item.label)}</b><strong>${Math.round(score.pillars[item.id])}%</strong></div>${progress(score.pillars[item.id])}<p>${esc(item.target)}</p></article>`).join('');
  return `<section class="page-head god-hero health-hero"><div><span class="eyebrow">SANTÉ 360 · SCORE D’HABITUDES</span><h1>${esc(score.weakest.label)} est ta priorité.</h1><p>${esc(healthPriorityText(score.weakest))}</p><div class="actions">${button('Saisir ma journée', 'scroll', 'primary', 'data-target="health-daily"')}${button('Voir la prévention', 'scroll', '', 'data-target="health-prevention"')}</div></div><div class="score-ring god-score" style="--score:${score.overall}"><strong>${score.overall}</strong><span>santé globale</span></div></section>
    <div class="callout god-disclaimer">Ces scores mesurent des habitudes et des données saisies. Ils ne mesurent pas le fonctionnement réel d’un organe et ne remplacent ni examen, ni analyse, ni diagnostic médical.</div>
    <div class="metric-grid god-metrics">${metric('Sommeil', `${num(day.sleepHours).toFixed(1)} h`, `dette 7 j : ${sleepDebt(state).toFixed(1)} h`, score.pillars.sleep < 60 ? 'danger' : 'good')}${metric('Activité 7 j', `${Math.round(score.activityWeek)} min`, 'objectif de base 150 min')}${metric('Végétaux', `${score.fruitVeg} g`, 'objectif 400 g')}${metric('Fibres', `${score.fiber} g`, 'objectif 25 g')}</div>
    <div class="dashboard-grid">
      ${card('Aujourd’hui', `<div id="health-daily" class="form-grid"><label>Sommeil (h)<input id="health-sleep" type="number" min="0" max="16" step=".25" value="${num(day.sleepHours, 7)}"></label><label>Qualité sommeil 1–5<input id="health-sleep-quality" type="number" min="1" max="5" value="${num(day.sleepQuality, 3)}"></label><label>Énergie 1–5<input id="health-energy" type="number" min="1" max="5" value="${num(day.energy, 3)}"></label><label>Douleur 0–10<input id="health-pain" type="number" min="0" max="10" value="${num(day.pain)}"></label><label>Pas<input id="health-steps" type="number" min="0" max="100000" value="${num(day.steps)}"></label><label>Activité hors séance (min)<input id="health-activity" type="number" min="0" max="600" value="${num(daily.activityMin)}"></label><label>Eau (ml)<input id="health-water" type="number" min="0" max="15000" value="${num(day.waterMl)}"></label><label>Fruits et légumes (g)<input id="health-plants" type="number" min="0" max="3000" value="${num(daily.fruitVegG)}"></label><label>Fibres (g)<input id="health-fiber" type="number" min="0" max="150" value="${Math.max(num(day.fiberG), num(daily.fiberG))}"></label><label>Stress 1–5<input id="health-stress" type="number" min="1" max="5" value="${num(daily.stress, 3)}"></label><label>Humeur 1–5<input id="health-mood" type="number" min="1" max="5" value="${num(daily.mood, 3)}"></label><label>Lumière extérieure (min)<input id="health-light" type="number" min="0" max="600" value="${num(daily.daylightMin)}"></label><label>Récupération calme (min)<input id="health-recovery" type="number" min="0" max="180" value="${num(daily.recoveryMin)}"></label><label>Contact social réel (min)<input id="health-social" type="number" min="0" max="600" value="${num(daily.socialMin)}"></label><label>Alcool (unités)<input id="health-alcohol" type="number" min="0" max="30" step=".5" value="${num(daily.alcoholUnits)}"></label><label>Boissons sucrées<input id="health-sugar-drinks" type="number" min="0" max="20" value="${num(daily.sugaryDrinks)}"></label></div><div class="checklist-inline"><label class="check-row"><input id="health-caffeine-late" type="checkbox" ${daily.caffeineLate ? 'checked' : ''}><span>Caféine après l’heure limite</span></label><label class="check-row"><input id="health-digestive" type="checkbox" ${num(daily.digestiveSymptoms) ? 'checked' : ''}><span>Symptômes digestifs aujourd’hui</span></label></div><div class="actions">${button('Enregistrer et recalculer', 'health-save-day', 'primary')}</div>`, 'span-12', 'INPUTS RÉELS')}
      ${card('Huit piliers protecteurs', `<div class="pillar-grid">${pillarCards}</div>`, 'span-12', 'FONDATIONS')}
      ${card('Systèmes du corps', `<div class="organ-grid">${organCards}</div>`, 'span-12', 'INDICATEURS COMPORTEMENTAUX')}
      ${card('Protocole énergie stable', `<div class="energy-timeline">${ENERGY_PROTOCOL.map(([time, text]) => `<article><span>${esc(time)}</span><p>${esc(text)}</p></article>`).join('')}</div><div class="callout">Une fatigue persistante, importante ou nouvelle mérite une évaluation médicale plutôt qu’une escalade de caféine ou de compléments.</div>`, 'span-7', 'JOURNÉE TYPE')}
      ${card('Mesures utiles', `<div class="form-grid"><label>Date<input id="vital-date" type="date" value="${today()}"></label><label>Tension systolique<input id="vital-sys" type="number" min="60" max="260" value="${vital.systolic || ''}"></label><label>Tension diastolique<input id="vital-dia" type="number" min="30" max="180" value="${vital.diastolic || ''}"></label><label>Fréquence au repos<input id="vital-rhr" type="number" min="30" max="220" value="${vital.rhr || ''}"></label><label>Tour de taille (cm)<input id="vital-waist" type="number" min="40" max="250" step=".1" value="${vital.waist || ''}"></label><label>Poids (kg)<input id="vital-weight" type="number" min="35" max="300" step=".1" value="${vital.weight || state.profile?.weightKg || ''}"></label></div><div class="actions">${button('Journaliser les mesures', 'health-save-vitals', 'primary')}</div><small>Mesure la tension assis, au calme et selon les instructions de ton appareil. Une valeur inquiétante ou des symptômes doivent être discutés avec un professionnel.</small>`, 'span-5', 'TENDANCES, PAS DIAGNOSTIC')}
      ${card('Prévention personnelle', `<div id="health-prevention" class="god-check-list">${prevention}</div>`, 'span-7', 'À ADAPTER AVEC LE MÉDECIN')}
      ${card('Journal symptômes', `<div class="form-grid one-col"><label>Symptôme<input id="symptom-label" placeholder="Fatigue, douleur, digestion, urinaire…"></label><label>Intensité 0–10<input id="symptom-severity" type="number" min="0" max="10" value="3"></label><label>Contexte<textarea id="symptom-note" rows="3" placeholder="Début, durée, déclencheur, signes associés, médicament…"></textarea></label></div><div class="actions">${button('Ajouter au journal', 'health-add-symptom', 'primary')}</div><div class="history">${symptoms}</div>`, 'span-5', 'POUR MIEUX CONSULTER')}
      ${card('Gate compléments', `<p class="lead">Aucun complément n’entre dans la routine uniquement parce qu’il “booste” quelque chose.</p><div class="form-grid"><label>Produit<input id="supp-name" placeholder="Créatine, vitamine D…"></label><label>Objectif précis<input id="supp-goal" placeholder="Carence confirmée, performance…"></label><label>Niveau de preuve<select id="supp-evidence"><option>Inconnu</option><option>Faible</option><option>Modéré</option><option>Fort pour mon objectif</option></select></label><label>Décision<select id="supp-decision"><option>À vérifier</option><option>Refusé</option><option>Validé avec professionnel</option></select></label></div><label>Interactions / dose / source<textarea id="supp-note" rows="3" placeholder="Médicaments, maladie, analyse, dose, source primaire…"></textarea></label><div class="actions">${button('Évaluer le complément', 'health-add-supplement')}</div><div class="history">${supplements}</div>`, 'span-7', 'SÉCURITÉ')}
      ${card('Signaux à ne pas optimiser soi-même', `<div class="red-flag-grid"><article><b>Urgence</b><p>Douleur thoracique, difficulté respiratoire importante, déficit neurologique soudain, confusion, perte de connaissance ou saignement important.</p></article><article><b>Consultation rapide</b><p>Jaunisse, sang dans les urines ou selles, faiblesse progressive, douleur qui irradie, perte de poids inexpliquée ou fatigue marquée persistante.</p></article></div><p class="muted">Le dashboard sert à documenter et décider plus tôt, pas à retarder les soins.</p>`, 'span-5', 'SÉCURITÉ MÉDICALE')}
    </div>`;
}
function renderKnowledge(rawState) {
  const state = normalized(rawState);
  const stats = knowledgeStats(state);
  const meta = META_LEARNING_PATH[state.knowledge.metaIndex];
  const domain = CULTURE_DOMAINS[state.knowledge.cultureIndex];
  const currentBook = LEARNING_BOOKS.find(book => !state.knowledge.books[book.id]?.finished) || LEARNING_BOOKS[0];
  const bookState = state.knowledge.books[currentBook.id] || {};
  const question = CULTURE_QUESTIONS[new Date().getDate() % CULTURE_QUESTIONS.length];
  const due = dueCards(state);
  const path = META_LEARNING_PATH.map((item, index) => `<article class="learning-step ${index < state.knowledge.metaIndex ? 'done' : index === state.knowledge.metaIndex ? 'active' : ''}"><span>${index + 1}</span><div><b>${esc(item.title)}</b><small>${esc(item.goal)}</small></div></article>`).join('');
  const domains = CULTURE_DOMAINS.map((item, index) => `<button type="button" class="culture-domain ${index === state.knowledge.cultureIndex ? 'active' : ''} ${state.knowledge.cultureSessions.some(row => row.domainId === item.id) ? 'covered' : ''}" data-god-action="culture-select" data-index="${index}"><span>${esc(item.icon)}</span><b>${esc(item.label)}</b><small>${state.knowledge.cultureSessions.filter(row => row.domainId === item.id).length} session(s)</small></button>`).join('');
  const cards = due.slice(0, 8).map(item => `<article class="flashcard"><div><span class="tag">Due ${esc(item.dueDate || today())}</span><h3>${esc(item.question)}</h3><details><summary>Afficher la réponse</summary><p>${esc(item.answer)}</p></details></div><div class="flash-actions">${button('Oublié', 'card-review', 'danger', `data-id="${item.id}" data-rating="1"`)}${button('Difficile', 'card-review', '', `data-id="${item.id}" data-rating="2"`)}${button('Bon', 'card-review', 'primary', `data-id="${item.id}" data-rating="3"`)}</div></article>`).join('') || '<div class="empty">Aucune carte due. Crée des questions à partir de ce que tu étudies.</div>';
  const books = LEARNING_BOOKS.map(item => { const info = state.knowledge.books[item.id] || {}; return `<article class="book-card ${item.id === currentBook.id ? 'active' : ''}"><span>${item.order}</span><div><b>${esc(item.title)}</b><small>${esc(item.author)}</small><p>${esc(item.role)}</p>${info.finished ? '<span class="tag">Terminé</span>' : info.pages ? `<span class="tag">${info.pages} pages</span>` : ''}</div></article>`; }).join('');
  return `<section class="page-head god-hero knowledge-hero"><div><span class="eyebrow">SAVOIR OS · APPRENDRE, RELIER, EXPLIQUER</span><h1>${esc(meta.title)}</h1><p>${esc(meta.goal)} Tu avances par production réelle, pas par accumulation de contenus.</p><div class="actions">${button('Lancer 25 minutes', 'timer-start', 'primary')}${button('Pause', 'timer-pause')}${button('Aller au module', 'scroll', '', 'data-target="meta-active"')}</div></div><div class="knowledge-score"><strong>${stats.score}</strong><span>score savoir</span><div id="god-timer-display">25:00</div></div></section>
    <div class="metric-grid god-metrics">${metric('Méthodes maîtrisées', `${stats.metaDone}/${META_LEARNING_PATH.length}`, 'apprendre à apprendre')}${metric('Culture couverte', `${stats.cultureCovered}/${CULTURE_DOMAINS.length}`, 'domaines avec production')}${metric('Cartes dues', String(stats.due), `${state.knowledge.cards.length} cartes totales`, stats.due > 15 ? 'danger' : '')}${metric('Livres terminés', `${stats.booksFinished}/8`, `${stats.totalMinutes} min de savoir`)}</div>
    <div class="dashboard-grid">
      ${card('Parcours apprendre à apprendre', `<div class="learning-path">${path}</div>`, 'span-5', '8 ÉTAPES')}
      ${card(`Étape ${state.knowledge.metaIndex + 1} · ${meta.title}`, `<div id="meta-active" class="focus-card"><p class="lead">${esc(meta.goal)}</p><div class="proof"><b>Exercice :</b> ${esc(meta.drill)}</div><div class="proof"><b>Preuve :</b> ${esc(meta.proof)}</div></div><div class="form-grid"><label>Durée<input id="meta-minutes" type="number" min="10" max="240" value="30"></label><label>Qualité de rappel 1–5<input id="meta-recall" type="number" min="1" max="5" value="3"></label></div><label>Production réelle<textarea id="meta-proof" rows="5" placeholder="Réponses de mémoire, erreurs, explication, résultat du projet…"></textarea></label><div class="actions">${button('Valider cette étape', 'meta-complete', 'primary')}</div>`, 'span-7', 'ACTION UNIQUE')}
      ${card('Mémoire : rappel espacé', `<div class="flashcards">${cards}</div><details class="god-details"><summary>Créer une nouvelle carte</summary><div class="form-grid one-col"><label>Question<input id="card-question" placeholder="Question précise, une seule idée"></label><label>Réponse<textarea id="card-answer" rows="3" placeholder="Réponse courte dans tes propres mots"></textarea></label><label>Domaine<input id="card-domain" placeholder="EPFC, culture, néerlandais…"></label></div><div class="actions">${button('Créer la carte', 'card-add', 'primary')}</div></details>`, 'span-7', `${due.length} DUE`) }
      ${card('Règles mémoire', `<div class="principles"><p><b>Rappel :</b> essaie avant de regarder.</p><p><b>Espacement :</b> reviens après un délai.</p><p><b>Correction :</b> confronte immédiatement l’erreur.</p><p><b>Entrelacement :</b> mélange les problèmes proches.</p><p><b>Transfert :</b> utilise l’idée dans un projet.</p></div><div class="callout">Relire et surligner donnent une impression de maîtrise; la preuve est ce que tu peux récupérer et utiliser sans support.</div>`, 'span-5', 'ANTI-ILLUSION')}
      ${card('Carte de culture générale', `<div class="culture-map">${domains}</div>`, 'span-12', '14 DOMAINES')}
      ${card(domain.label, `<div class="culture-focus"><span>${esc(domain.icon)}</span><div><h2>${esc(domain.label)}</h2><p>${esc(domain.foundation)}</p></div></div><div class="proof"><b>Production de maîtrise :</b> ${esc(domain.output)}</div><div class="form-grid"><label>Durée<input id="culture-minutes" type="number" min="10" max="240" value="35"></label><label>Rappel 1–5<input id="culture-recall" type="number" min="1" max="5" value="3"></label></div><label>Synthèse / réponse / carte mentale<textarea id="culture-output" rows="5" placeholder="Explique sans copier. Ajoute une source et une question restante."></textarea></label><div class="actions">${button('Enregistrer la session', 'culture-log', 'primary')}${button('Domaine suivant', 'culture-next')}</div>`, 'span-7', 'DOMAINE ACTIF')}
      ${card('Question du jour', `<div class="daily-question"><span class="tag">${esc(question[0])}</span><h3>${esc(question[1])}</h3>${quizRevealed ? `<p>${esc(question[2])}</p>` : '<p class="muted">Réponds à voix haute avant de révéler.</p>'}<div class="actions">${button(quizRevealed ? 'Masquer' : 'Révéler', 'quiz-toggle', quizRevealed ? '' : 'primary')}</div></div>`, 'span-5', 'RAPPEL ACTIF')}
      ${card('Bibliothèque pour apprendre à apprendre', `<div class="book-stack">${books}</div>`, 'span-7', 'ORDRE RECOMMANDÉ')}
      ${card(`Livre actif · ${currentBook.title}`, `<p>${esc(currentBook.author)}</p><div class="callout">${esc(currentBook.role)}</div><div class="form-grid"><label>Pages lues<input id="book-pages" type="number" min="1" value="15"></label><label>Durée<input id="book-minutes" type="number" min="5" value="25"></label></div><label>Idée reformulée<textarea id="book-note" rows="4" placeholder="Une idée, un désaccord, une application."></textarea></label><div class="actions">${button('Enregistrer', 'book-log', 'primary', `data-id="${currentBook.id}"`)}${button('Livre terminé', 'book-finish', '', `data-id="${currentBook.id}"`)}</div><small>${num(bookState.pages)} pages enregistrées sur ce livre.</small>`, 'span-5', 'LECTURE ACTIVE')}
      ${card('Échelle de qualité des sources', `<div class="source-ladder">${SOURCE_LADDER.map(([level, label, text]) => `<article><span>${esc(level)}</span><div><b>${esc(label)}</b><p>${esc(text)}</p></div></article>`).join('')}</div>`, 'span-7', 'NE PAS CONFONDRE CONTENU ET PREUVE')}
      ${card('Routine hebdomadaire', `<div class="week-plan"><p><b>4×</b> apprentissage actif de 30–45 min.</p><p><b>2×</b> culture générale avec synthèse.</p><p><b>Quotidien</b> cartes dues, maximum 20 min.</p><p><b>1×</b> explication orale enregistrée.</p><p><b>1×</b> revue : ce que je sais, ce que je confonds, ce que j’applique.</p></div>`, 'span-5', 'SYSTÈME MINIMUM')}
    </div>`;
}
function decorateNav() {
  if (!tabs || decorating) return;
  decorating = true;
  try {
    const library = tabs.querySelector('.tab[data-route="library"]');
    if (library) {
      const label = library.querySelector('span:last-child') || library;
      label.textContent = 'Savoir';
      library.dataset.godKnowledge = 'true';
    }
    if (!tabs.querySelector('[data-god-route="health"]')) {
      const health = document.createElement('button');
      health.type = 'button';
      health.className = 'tab';
      health.dataset.godRoute = 'health';
      health.innerHTML = '<span class="tab-icon" aria-hidden="true">H</span><span>Santé</span>';
      const athlete = tabs.querySelector('.tab[data-route="athlete"]');
      tabs.insertBefore(health, athlete || tabs.firstChild);
    }
    updateNavActive();
  } finally { decorating = false; }
}
function updateNavActive() {
  if (!tabs || !customRoute) return;
  tabs.querySelectorAll('.tab').forEach(node => node.classList.remove('active'));
  const target = customRoute === 'health' ? tabs.querySelector('[data-god-route="health"]') : tabs.querySelector('.tab[data-route="library"]');
  target?.classList.add('active');
}
function openCustom(route, shouldScroll = true) {
  customRoute = route;
  Store.update(state => { state.ui ||= {}; state.ui.route = route; });
  renderCustom();
  updateNavActive();
  if (shouldScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}
function renderCustom() {
  if (!app || !CUSTOM_ROUTES.has(customRoute)) return;
  const state = Store.load();
  app.dataset.godView = customRoute;
  app.innerHTML = customRoute === 'health' ? renderHealth(state) : renderKnowledge(state);
  document.querySelector('#version')?.replaceChildren(document.createTextNode('6.3'));
  updateTimerDisplay();
}
function injectCockpit() {
  if (!app || app.dataset.godView) return;
  const eyebrow = app.querySelector('.page-head .eyebrow')?.textContent || '';
  if (eyebrow.includes('COCKPIT') && !app.querySelector('.godmode-today')) {
    const state = Store.load();
    const health = healthScores(state);
    const knowledge = knowledgeStats(state);
    const grid = app.querySelector('.dashboard-grid');
    if (grid) {
      const panel = document.createElement('section');
      panel.className = 'panel god-panel span-12 godmode-today';
      panel.innerHTML = `<header class="panel-head"><span class="eyebrow">GODMODE</span><h2>Santé et savoir</h2></header><div class="god-command-split"><article><span>Santé</span><strong>${health.overall}%</strong><p>${esc(healthPriorityText(health.weakest))}</p>${button('Ouvrir Santé 360', 'open-health', 'primary')}</article><article><span>Savoir</span><strong>${knowledge.score}%</strong><p>${knowledge.due} carte(s) due(s) · prochaine méthode : ${esc(META_LEARNING_PATH[normalized(state).knowledge.metaIndex].title)}</p>${button('Ouvrir Savoir OS', 'open-knowledge')}</article></div>`;
      grid.prepend(panel);
    }
  }
  if (eyebrow.includes('REVUE') && !app.querySelector('.godmode-review')) {
    const state = Store.load();
    const health = healthScores(state);
    const knowledge = knowledgeStats(state);
    const grid = app.querySelector('.dashboard-grid');
    if (grid) {
      const panel = document.createElement('section');
      panel.className = 'panel god-panel span-12 godmode-review';
      panel.innerHTML = `<header class="panel-head"><span class="eyebrow">NOUVEAUX AXES</span><h2>Santé globale et capital intellectuel</h2></header><div class="god-command-split"><article>${progress(health.overall, 'Santé')}<p>Faiblesse : ${esc(health.weakest.label)}</p></article><article>${progress(knowledge.score, 'Savoir')}<p>${knowledge.cultureCovered}/${CULTURE_DOMAINS.length} domaines culturels couverts.</p></article></div>`;
      grid.prepend(panel);
    }
  }
  document.querySelector('#version')?.replaceChildren(document.createTextNode('6.3'));
}
function timerSeconds() {
  if (!timer.running) return timer.remaining;
  return Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
}
function updateTimerDisplay() {
  const node = document.querySelector('#god-timer-display');
  if (!node) return;
  const seconds = timerSeconds();
  const minutes = Math.floor(seconds / 60);
  node.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  if (timer.running && seconds <= 0) {
    clearInterval(timer.interval);
    timer.running = false;
    timer.remaining = 25 * 60;
    toast('Bloc terminé. Écris maintenant la preuve produite.');
  }
}
function startTimer() {
  if (!timer.running) {
    timer.running = true;
    timer.endAt = Date.now() + timer.remaining * 1000;
    clearInterval(timer.interval);
    timer.interval = setInterval(updateTimerDisplay, 1000);
  }
  updateTimerDisplay();
}
function pauseTimer() {
  timer.remaining = timerSeconds();
  timer.running = false;
  clearInterval(timer.interval);
  updateTimerDisplay();
}
function resetTimer() {
  timer.running = false;
  timer.remaining = 25 * 60;
  clearInterval(timer.interval);
  updateTimerDisplay();
}
function saveDailyHealth() {
  Store.update(state => {
    ensureDomains(state);
    state.days ||= {};
    state.days[today()] ||= {};
    Object.assign(state.days[today()], {
      sleepHours: num(document.querySelector('#health-sleep')?.value, 7),
      sleepQuality: num(document.querySelector('#health-sleep-quality')?.value, 3),
      energy: num(document.querySelector('#health-energy')?.value, 3),
      pain: num(document.querySelector('#health-pain')?.value),
      steps: num(document.querySelector('#health-steps')?.value),
      waterMl: num(document.querySelector('#health-water')?.value),
      fiberG: num(document.querySelector('#health-fiber')?.value)
    });
    state.health.daily[today()] = {
      ...(state.health.daily[today()] || {}),
      activityMin: num(document.querySelector('#health-activity')?.value),
      fruitVegG: num(document.querySelector('#health-plants')?.value),
      fiberG: num(document.querySelector('#health-fiber')?.value),
      stress: num(document.querySelector('#health-stress')?.value, 3),
      mood: num(document.querySelector('#health-mood')?.value, 3),
      daylightMin: num(document.querySelector('#health-light')?.value),
      recoveryMin: num(document.querySelector('#health-recovery')?.value),
      socialMin: num(document.querySelector('#health-social')?.value),
      alcoholUnits: num(document.querySelector('#health-alcohol')?.value),
      sugaryDrinks: num(document.querySelector('#health-sugar-drinks')?.value),
      caffeineLate: Boolean(document.querySelector('#health-caffeine-late')?.checked),
      digestiveSymptoms: document.querySelector('#health-digestive')?.checked ? 1 : 0
    };
  }, { checkpoint: true, reason: 'health_daily' });
}
function scheduleCard(item, rating) {
  const intervals = rating === 1 ? [1] : rating === 2 ? [3, 7, 14, 30] : [7, 14, 30, 60];
  const index = Math.min(num(item.reviewCount), intervals.length - 1);
  item.reviewCount = num(item.reviewCount) + 1;
  const date = new Date(`${today()}T12:00:00`);
  date.setDate(date.getDate() + intervals[index]);
  item.dueDate = Store.localDate(date);
  item.lastRating = rating;
  item.lastReviewedAt = new Date().toISOString();
}
function handleGodAction(target, action) {
  if (action === 'open-health') return openCustom('health');
  if (action === 'open-knowledge') return openCustom('knowledge');
  if (action === 'scroll') { document.querySelector(`#${CSS.escape(target.dataset.target)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  if (action === 'health-save-day') { saveDailyHealth(); toast('Santé du jour enregistrée'); return renderCustom(); }
  if (action === 'health-save-vitals') {
    const sys = num(document.querySelector('#vital-sys')?.value);
    const dia = num(document.querySelector('#vital-dia')?.value);
    if ((sys && !dia) || (!sys && dia)) return toast('Saisis les deux valeurs de tension.', 'danger');
    Store.update(state => {
      ensureDomains(state);
      state.health.vitals.push({ id: uid('vital'), date: document.querySelector('#vital-date')?.value || today(), systolic: sys, diastolic: dia, rhr: num(document.querySelector('#vital-rhr')?.value), waist: num(document.querySelector('#vital-waist')?.value), weight: num(document.querySelector('#vital-weight')?.value), createdAt: new Date().toISOString() });
      const weight = num(document.querySelector('#vital-weight')?.value);
      if (weight) state.profile.weightKg = weight;
    }, { checkpoint: true, reason: 'health_vitals' });
    toast('Mesures journalisées'); return renderCustom();
  }
  if (action === 'prevention-toggle') {
    Store.update(state => { ensureDomains(state); const item = state.health.prevention.find(row => row.id === target.dataset.id); if (item) item.doneAt = item.doneAt ? '' : today(); }, { checkpoint: true, reason: 'prevention' });
    return renderCustom();
  }
  if (action === 'health-add-symptom') {
    const label = document.querySelector('#symptom-label')?.value.trim();
    if (!label) return toast('Décris le symptôme.', 'danger');
    Store.update(state => { ensureDomains(state); state.health.symptoms.push({ id: uid('symptom'), date: today(), label, severity: num(document.querySelector('#symptom-severity')?.value), note: document.querySelector('#symptom-note')?.value.trim() || '', createdAt: new Date().toISOString() }); }, { checkpoint: true, reason: 'symptom' });
    toast('Symptôme ajouté au journal'); return renderCustom();
  }
  if (action === 'health-add-supplement') {
    const name = document.querySelector('#supp-name')?.value.trim();
    const goal = document.querySelector('#supp-goal')?.value.trim();
    if (!name || !goal) return toast('Produit et objectif précis obligatoires.', 'danger');
    Store.update(state => { ensureDomains(state); state.health.supplements.push({ id: uid('supp'), date: today(), name, goal, evidence: document.querySelector('#supp-evidence')?.value, decision: document.querySelector('#supp-decision')?.value, note: document.querySelector('#supp-note')?.value.trim() || '' }); }, { checkpoint: true, reason: 'supplement_gate' });
    toast('Complément évalué, pas automatiquement approuvé'); return renderCustom();
  }
  if (action === 'health-delete') {
    Store.update(state => { ensureDomains(state); const key = target.dataset.kind === 'symptom' ? 'symptoms' : 'supplements'; state.health[key] = state.health[key].filter(item => item.id !== target.dataset.id); }, { checkpoint: true, reason: 'health_delete' });
    return renderCustom();
  }
  if (action === 'timer-start') { startTimer(); return; }
  if (action === 'timer-pause') { pauseTimer(); return; }
  if (action === 'timer-reset') { resetTimer(); return; }
  if (action === 'meta-complete') {
    const proof = document.querySelector('#meta-proof')?.value.trim();
    if (!proof || proof.length < 30) return toast('La preuve doit être concrète et détaillée.', 'danger');
    Store.update(state => {
      ensureDomains(state);
      const module = META_LEARNING_PATH[state.knowledge.metaIndex];
      state.knowledge.sessions.push({ id: uid('meta'), kind: 'meta', moduleId: module.id, title: module.title, date: today(), minutes: num(document.querySelector('#meta-minutes')?.value, 30), recall: num(document.querySelector('#meta-recall')?.value, 3), proof });
      state.knowledge.metaIndex = Math.min(META_LEARNING_PATH.length - 1, state.knowledge.metaIndex + 1);
    }, { checkpoint: true, reason: 'meta_learning' });
    resetTimer(); toast('Étape validée par une production réelle'); return renderCustom();
  }
  if (action === 'culture-select') { Store.update(state => { ensureDomains(state); state.knowledge.cultureIndex = num(target.dataset.index); }); return renderCustom(); }
  if (action === 'culture-next') { Store.update(state => { ensureDomains(state); state.knowledge.cultureIndex = (state.knowledge.cultureIndex + 1) % CULTURE_DOMAINS.length; }); return renderCustom(); }
  if (action === 'culture-log') {
    const output = document.querySelector('#culture-output')?.value.trim();
    if (!output || output.length < 40) return toast('Produis une vraie synthèse dans tes mots.', 'danger');
    Store.update(state => {
      ensureDomains(state);
      const domain = CULTURE_DOMAINS[state.knowledge.cultureIndex];
      state.knowledge.cultureSessions.push({ id: uid('culture'), date: today(), domainId: domain.id, label: domain.label, minutes: num(document.querySelector('#culture-minutes')?.value, 35), recall: num(document.querySelector('#culture-recall')?.value, 3), output });
    }, { checkpoint: true, reason: 'culture_session' });
    toast('Session culturelle enregistrée'); return renderCustom();
  }
  if (action === 'quiz-toggle') { quizRevealed = !quizRevealed; return renderCustom(); }
  if (action === 'card-add') {
    const question = document.querySelector('#card-question')?.value.trim();
    const answer = document.querySelector('#card-answer')?.value.trim();
    if (!question || !answer) return toast('Question et réponse obligatoires.', 'danger');
    Store.update(state => { ensureDomains(state); state.knowledge.cards.push({ id: uid('card'), question, answer, domain: document.querySelector('#card-domain')?.value.trim() || 'Général', dueDate: today(), reviewCount: 0, createdAt: new Date().toISOString() }); }, { checkpoint: true, reason: 'knowledge_card' });
    toast('Carte créée'); return renderCustom();
  }
  if (action === 'card-review') {
    Store.update(state => { ensureDomains(state); const item = state.knowledge.cards.find(row => row.id === target.dataset.id); if (item) scheduleCard(item, num(target.dataset.rating, 1)); });
    return renderCustom();
  }
  if (action === 'book-log' || action === 'book-finish') {
    const pages = num(document.querySelector('#book-pages')?.value);
    const minutes = num(document.querySelector('#book-minutes')?.value);
    const note = document.querySelector('#book-note')?.value.trim();
    if (pages <= 0 || minutes < 5 || !note) return toast('Pages, durée et idée reformulée obligatoires.', 'danger');
    Store.update(state => {
      ensureDomains(state);
      const id = target.dataset.id;
      state.knowledge.books[id] = { ...(state.knowledge.books[id] || {}), pages: num(state.knowledge.books[id]?.pages) + pages, finished: action === 'book-finish' || Boolean(state.knowledge.books[id]?.finished) };
      state.knowledge.bookSessions.push({ id: uid('book'), bookId: id, date: today(), pages, minutes, note, finished: action === 'book-finish' });
    }, { checkpoint: true, reason: 'learning_book' });
    toast(action === 'book-finish' ? 'Livre terminé' : 'Lecture active enregistrée'); return renderCustom();
  }
}

document.addEventListener('click', event => {
  const healthTab = event.target.closest('[data-god-route="health"]');
  if (healthTab) {
    event.preventDefault(); event.stopImmediatePropagation(); openCustom('health'); return;
  }
  const libraryTab = event.target.closest('.tab[data-route="library"]');
  if (libraryTab) {
    event.preventDefault(); event.stopImmediatePropagation(); openCustom('knowledge'); return;
  }
  const standardTab = event.target.closest('.tab[data-route]');
  if (standardTab && standardTab.dataset.route !== 'library') {
    customRoute = null;
    if (app) delete app.dataset.godView;
    return;
  }
  const target = event.target.closest('[data-god-action]');
  if (!target) return;
  event.preventDefault(); event.stopImmediatePropagation();
  handleGodAction(target, target.dataset.godAction);
}, true);

const navObserver = new MutationObserver(() => decorateNav());
if (tabs) navObserver.observe(tabs, { childList: true, subtree: true });
const appObserver = new MutationObserver(() => {
  if (CUSTOM_ROUTES.has(customRoute)) return;
  if (app) delete app.dataset.godView;
  queueMicrotask(injectCockpit);
});
if (app) appObserver.observe(app, { childList: true, subtree: false });
Store.subscribe(() => { if (CUSTOM_ROUTES.has(customRoute)) renderCustom(); });
decorateNav();
const storedRoute = Store.load().ui?.route;
if (storedRoute === 'health') openCustom('health', false);
else if (storedRoute === 'knowledge' || storedRoute === 'library') openCustom('knowledge', false);
else injectCockpit();
