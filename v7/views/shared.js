import { AUTOMATIONS, BODY_SYSTEMS, CULTURE_DOMAINS, CULTURE_QUESTIONS, HEALTH_PILLARS, LEARNING_BOOKS, LEARNING_PATH, NAV, QUICK_ACTIONS } from '../content.js';
import { dailyQuestionIndex, dueCards, ensureState, euro, getDay, healthScores, learningStats, localDate, moneyStats, num, smartPlan, sportStats, tradingPhase, weeklyReview } from '../engine.js';
import { badge, button, checked, empty, esc, fieldGrid, formField, formatDate, formatTime, icon, iconButton, metric, numberInput, panel, progress, routeButton, scoreRing, selectInput, textInput, textarea, transactionRow } from '../ui.js';
const today = localDate;
export function pageHero(eyebrow, title, text, score, scoreLabel, actions = '') {
  return `<section class="page-hero"><div class="hero-copy"><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1><p>${esc(text)}</p>${actions ? `<div class="actions">${actions}</div>` : ''}</div>${score !== null ? scoreRing(score, scoreLabel) : ''}</section>`;
}

export function dailyCheckin(state, compact = false) {
  const day = getDay(state);
  const health = state.health.daily[today()] || {};
  const fields = [
    formField('Sommeil', numberInput('check-sleep', day.sleepHours, 0, 16, .25), 'heures'),
    formField('Énergie', selectInput('check-energy', [[1,'1 — vidé'],[2,'2'],[3,'3 — moyen'],[4,'4'],[5,'5 — excellent']], num(day.energy,3))),
    formField('Douleur', numberInput('check-pain', day.pain, 0, 10, 1), '0 à 10'),
    formField('Temps disponible', numberInput('check-minutes', day.availableMin, 5, 720, 5), 'minutes'),
    formField('Pas', numberInput('check-steps', day.steps, 0, 100000, 100)),
    formField('Stress', selectInput('check-stress', [[1,'1 — bas'],[2,'2'],[3,'3 — moyen'],[4,'4'],[5,'5 — élevé']], num(health.stress,3)))
  ];
  return `<form class="checkin-card" data-form="checkin"><div class="checkin-head"><div><span class="eyebrow">CHECK-IN 30 SECONDES</span><h2>Comment tu fonctionnes aujourd’hui ?</h2></div>${badge('Auto-plan après sauvegarde','accent')}</div>${fieldGrid(compact ? fields.slice(0,4) : fields)}${compact ? `<details class="more-fields"><summary>Ajouter pas et stress</summary>${fieldGrid(fields.slice(4))}</details>` : ''}<div class="actions">${button('Sauver et recalculer', 'save-checkin', 'primary', '', 'spark')}</div></form>`;
}

export function planCards(state) {
  const plan = smartPlan(state);
  if (!plan.items.length) return empty('Tes trois priorités sont terminées ou reportées.');
  return `<div class="mission-stack">${plan.items.map((item, index) => `<article class="mission-card"><span class="mission-index">${index + 1}</span><div class="mission-copy"><div class="tag-line">${badge(item.domain)}${badge(`${item.minutes} min`,'muted')}</div><h3>${esc(item.title)}</h3><p>${esc(item.detail)}</p><div class="actions">${routeButton('Ouvrir', item.route, 'primary')}${button('Fait', 'complete-plan-item', 'success', `data-id="${esc(item.id)}"`, 'check')}${button('Reporter', 'skip-plan-item', 'quiet', `data-id="${esc(item.id)}"`)}</div></div></article>`).join('')}</div>`;
}

export function quickButtons() {
  return `<div class="quick-grid">${QUICK_ACTIONS.map(([id,label,domain]) => `<button type="button" class="quick-action" data-action="quick-action" data-quick="${esc(id)}"><span>${esc(domain)}</span><b>${esc(label)}</b></button>`).join('')}</div>`;
}

export function onboarding(state) {
  if (state.nexus.onboarding.completed) return '';
  return `<section class="onboarding"><div><span class="eyebrow">PREMIÈRE CONFIGURATION</span><h2>Le dashboard doit travailler pour toi, pas l’inverse.</h2><p>Choisis ton objectif principal. Le plan quotidien adaptera l’ordre des widgets et des priorités.</p></div><div class="onboarding-form">${selectInput('onboarding-goal', [['balanced','Équilibre complet'],['energy','Énergie et santé'],['learning','Apprentissage et culture'],['body','Corps et performance'],['money','Argent et stabilité']], state.nexus.onboarding.goal)}${button('Activer Nexus', 'finish-onboarding', 'primary', '', 'spark')}</div></section>`;
}
