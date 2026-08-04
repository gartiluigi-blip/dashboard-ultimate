import { AUTOMATIONS, BODY_SYSTEMS, CULTURE_DOMAINS, CULTURE_QUESTIONS, HEALTH_PILLARS, LEARNING_BOOKS, LEARNING_PATH, NAV, QUICK_ACTIONS } from '../content.js';
import { dailyQuestionIndex, dueCards, ensureState, euro, getDay, healthScores, learningStats, localDate, moneyStats, num, smartPlan, sportStats, tradingPhase, weeklyReview } from '../engine.js';
import { badge, button, checked, empty, esc, fieldGrid, formField, formatDate, formatTime, icon, iconButton, metric, numberInput, panel, progress, routeButton, scoreRing, selectInput, textInput, textarea, transactionRow } from '../ui.js';
const today = localDate;
import { pageHero } from './shared.js';
export function cultureMap(state) {
  const covered = new Set(state.knowledge.cultureSessions.map(row=>row.domainId));
  const current = CULTURE_DOMAINS[num(state.knowledge.cultureIndex)]?.[0];
  return `<div class="culture-map">${CULTURE_DOMAINS.map(([id,label],index)=>`<button type="button" class="culture-tile ${covered.has(id)?'covered':''} ${current===id?'active':''}" data-action="select-culture" data-index="${index}"><span>${index+1}</span><b>${esc(label)}</b><small>${covered.has(id)?'Couvert':'À construire'}</small></button>`).join('')}</div>`;
}

export function renderCulture(raw) {
  const state = ensureState(structuredClone(raw));
  const stats = learningStats(state);
  const domain = CULTURE_DOMAINS[num(state.knowledge.cultureIndex)] || CULTURE_DOMAINS[0];
  const question = CULTURE_QUESTIONS[dailyQuestionIndex()%CULTURE_QUESTIONS.length];
  const recent = [...state.knowledge.cultureSessions].slice(-8).reverse().map(row=>`<div class="data-row"><div><b>${esc(CULTURE_DOMAINS.find(item=>item[0]===row.domainId)?.[1]||row.domainId)}</b><small>${esc(row.date)} · ${num(row.minutes)} min · ${esc(row.proof)}</small></div>${badge(row.kind||'synthèse','muted')}</div>`).join('');
  return `${pageHero('CULTURE GÉNÉRALE',domain[1],domain[2],Math.round(stats.cultureCovered/CULTURE_DOMAINS.length*100),'domaines',button('Question du jour','scroll-to','primary','data-target="daily-question"')+routeButton('Apprendre','learn','secondary'))}<div class="layout-grid">${panel('Carte des 14 domaines',cultureMap(state),{className:'span-12',eyebrow:`${stats.cultureCovered}/14 COUVERTS`})}${panel(domain[1],`<div class="culture-focus"><span>${num(state.knowledge.cultureIndex)+1}</span><div><h3>Fondations</h3><p>${esc(domain[2])}</p><h3>Livrable de maîtrise</h3><p>${esc(domain[3])}</p></div></div>${fieldGrid([formField('Durée',numberInput('culture-minutes',25,5,300,5)),formField('Type',selectInput('culture-kind',[['synthese','Synthèse'],['explication','Explication'],['chronologie','Chronologie'],['carte','Carte mentale'],['comparaison','Comparaison']],'synthese'))])}${formField('Preuve de mémoire',textarea('culture-proof','','Explique sans copier. Indique ce qui reste incertain.',5))}<div class="actions">${button('Enregistrer et passer au suivant','complete-culture','primary')}</div>`,{className:'span-7',eyebrow:'PRODUCTION RÉELLE'})}${panel('Question du jour',`<div class="daily-question"><h3>${esc(question)}</h3><p>Essaie d’abord de répondre sans chercher. Vérifie ensuite avec une source primaire ou institutionnelle.</p>${formField('Ma réponse',textarea('daily-answer','','Réponse, hypothèses et points à vérifier…',5))}<div class="actions">${button('Enregistrer comme session','save-daily-question','secondary')}</div></div>`,{className:'span-5',eyebrow:'ESPRIT CRITIQUE',id:'daily-question'})}${panel('Historique',recent?`<div class="data-list">${recent}</div>`:empty('Aucune production culturelle.'),{className:'span-12',eyebrow:'TRACE'})}</div>`;
}
