import { AUTOMATIONS, BODY_SYSTEMS, CULTURE_DOMAINS, CULTURE_QUESTIONS, HEALTH_PILLARS, LEARNING_BOOKS, LEARNING_PATH, NAV, QUICK_ACTIONS } from '../content.js';
import { dailyQuestionIndex, dueCards, ensureState, euro, getDay, healthScores, learningStats, localDate, moneyStats, num, smartPlan, sportStats, tradingPhase, weeklyReview } from '../engine.js';
import { badge, button, checked, empty, esc, fieldGrid, formField, formatDate, formatTime, icon, iconButton, metric, numberInput, panel, progress, routeButton, scoreRing, selectInput, textInput, textarea, transactionRow } from '../ui.js';
const today = localDate;
import { pageHero } from './shared.js';
export function renderReview(raw) {
  const state = ensureState(structuredClone(raw));
  const review = weeklyReview(state);
  const scores = [
    ['Santé',review.health.overall,'health'],
    ['Savoir',review.learn.score,'learn'],
    ['Corps',Math.min(100,Math.round(review.sport.sessions/Math.max(1,num(state.sport.weeklyTarget,4))*100)),'body'],
    ['Argent',Math.max(0,100-review.money.alerts.length*25),'money']
  ];
  return `${pageHero('REVUE HEBDOMADAIRE','La semaine doit produire des décisions, pas seulement des chiffres.',review.alerts[0]||'Les domaines stables restent en maintenance.',review.score,'semaine',button('Créer backup','create-backup','secondary')+button('Retour aujourd’hui','navigate','primary','data-route="today"'))}<div class="metrics-row">${metric('Sommeil moyen',`${review.sleepAvg.toFixed(1)} h`,'7 jours','','☾')}${metric('Pas moyens',Math.round(review.stepsAvg).toLocaleString('fr-BE'),'7 jours','','↟')}${metric('Énergie moyenne',`${review.energyAvg.toFixed(1)}/5`,'7 jours','','⚡')}${metric('Apprentissage',`${review.learn.minutes7} min`,'7 jours','','◎')}</div><div class="layout-grid">${panel('Scores',`<div class="review-scores">${scores.map(([label,score,route])=>`<button type="button" data-action="navigate" data-route="${route}" class="review-score">${progress(score,label)}<span>Ouvrir ${esc(label.toLowerCase())} ${icon('arrow')}</span></button>`).join('')}</div>`,{className:'span-7',eyebrow:'TENDANCE'})}${panel('Alertes',review.alerts.length?`<div class="alert-list">${review.alerts.map(row=>`<div class="alert warning">${esc(row)}</div>`).join('')}</div>`:empty('Aucune alerte importante.'),{className:'span-5',eyebrow:'À CORRIGER'})}${panel('Victoires',review.wins.length?`<div class="achievement-list">${review.wins.map(row=>`<div><span>✓</span><p>${esc(row)}</p></div>`).join('')}</div>`:empty('Journalise davantage de preuves pour faire apparaître les progrès.'),{className:'span-6',eyebrow:'CE QUI FONCTIONNE'})}${panel('Décision automatique',`<div class="decision-card"><span>FOCUS DE LA PROCHAINE SEMAINE</span><h3>${esc(review.health.weakest.label)}</h3><p>${esc(review.health.weakest.target)}</p><div class="actions">${routeButton('Planifier maintenant','health','primary')}</div></div>`,{className:'span-6',eyebrow:'UNE PRIORITÉ'})}</div>`;
}
