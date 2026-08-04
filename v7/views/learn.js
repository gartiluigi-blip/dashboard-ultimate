import { AUTOMATIONS, BODY_SYSTEMS, CULTURE_DOMAINS, CULTURE_QUESTIONS, HEALTH_PILLARS, LEARNING_BOOKS, LEARNING_PATH, NAV, QUICK_ACTIONS } from '../content.js';
import { dailyQuestionIndex, dueCards, ensureState, euro, getDay, healthScores, learningStats, localDate, moneyStats, num, smartPlan, sportStats, tradingPhase, weeklyReview } from '../engine.js';
import { badge, button, checked, empty, esc, fieldGrid, formField, formatDate, formatTime, icon, iconButton, metric, numberInput, panel, progress, routeButton, scoreRing, selectInput, textInput, textarea, transactionRow } from '../ui.js';
const today = localDate;
import { pageHero } from './shared.js';
export function focusTimer(state) {
  const focus = state.nexus.focus || {};
  const remaining = focus.running ? Math.max(0, Math.ceil((num(focus.endAt)-Date.now())/1000)) : num(focus.remaining,1500);
  return `<div class="focus-box"><span class="eyebrow">BLOC DE CONCENTRATION</span><strong id="focus-display">${formatTime(remaining)}</strong>${formField('Objectif du bloc',textInput('focus-label',focus.label||'','Ex. comprendre la récursivité'))}<div class="actions">${button(focus.running?'Pause':'Démarrer','toggle-focus','primary')}${button('Réinitialiser','reset-focus','quiet')}</div></div>`;
}

export function dueCardList(state) {
  const cards = dueCards(state);
  if (!cards.length) return empty('Aucune carte due. Crée une question à partir de ce que tu apprends.');
  return `<div class="flash-list">${cards.slice(0,8).map(card => `<article class="flash-card"><span class="badge muted">${esc(card.domain||'Général')}</span><h3>${esc(card.question)}</h3><details><summary>Afficher la réponse</summary><p>${esc(card.answer)}</p></details><div class="flash-actions">${button('Oublié','review-card','danger',`data-id="${esc(card.id)}" data-rating="again"`)}${button('Difficile','review-card','secondary',`data-id="${esc(card.id)}" data-rating="hard"`)}${button('Bon','review-card','success',`data-id="${esc(card.id)}" data-rating="good"`)}${button('Facile','review-card','quiet',`data-id="${esc(card.id)}" data-rating="easy"`)}</div></article>`).join('')}</div>`;
}

export function learningRoadmap(state) {
  const index = num(state.knowledge.metaIndex);
  return `<div class="roadmap">${LEARNING_PATH.map((step,i)=>`<article class="roadmap-step ${i<index?'done':i===index?'active':''}"><span>${i<index?'✓':i+1}</span><div><b>${esc(step.label)}</b><small>${esc(step.proof)}</small></div></article>`).join('')}</div>`;
}

export function bookCards(state) {
  return `<div class="book-grid">${LEARNING_BOOKS.map(([id,title,author,focus],index)=>{const data=state.knowledge.books[id]||{};return `<article class="book-card ${data.finished?'done':''}"><span>${index+1}</span><div><h3>${esc(title)}</h3><small>${esc(author)}</small><p>${esc(focus)}</p><div class="book-meta">${data.finished?badge('Terminé','good'):badge(`${num(data.pages)} pages`,'muted')}${button(data.finished?'Réouvrir':'Journaliser','open-book-log','text',`data-id="${esc(id)}"`)}</div></div></article>`}).join('')}</div>`;
}

export function renderLearn(raw) {
  const state = ensureState(structuredClone(raw));
  const stats = learningStats(state);
  const active = LEARNING_PATH[num(state.knowledge.metaIndex)] || LEARNING_PATH[0];
  return `${pageHero('SAVOIR OS','Apprends moins de choses à la fois, mais rends-les récupérables.',`${active.label} : ${active.proof}`,stats.score,'maîtrise',button('Démarrer 25 min','toggle-focus','primary')+routeButton('Culture générale','culture','secondary'))}<div class="metrics-row">${metric('Focus',`${stats.minutes7} min`,'sept jours','','◎')}${metric('Cartes',`${stats.due} dues`,`${stats.cards} créées`,stats.due?'warning':'','◇')}${metric('Méthodes',`${stats.metaDone}/8`,'preuves produites','','✓')}${metric('Livres',`${stats.books}/8`,'méthodologie','','▤')}</div><div class="layout-grid">${panel('Focus',focusTimer(state),{className:'span-4',eyebrow:'SANS DISTRACTION'})}${panel(`Étape active · ${active.label}`,`${learningRoadmap(state)}${formField('Preuve produite',textarea('meta-proof','','Ce que tu as fait, compris ou mesuré…',4))}<div class="actions">${button('Valider cette méthode','complete-meta','primary')}</div>`,{className:'span-8',eyebrow:`ÉTAPE ${num(state.knowledge.metaIndex)+1}/8`})}${panel('Rappel actif',dueCardList(state),{className:'span-7',eyebrow:`${stats.due} DUE(S)`})}${panel('Créer une carte',`${formField('Question',textarea('card-question','','Question précise, une seule idée.',2))}${formField('Réponse',textarea('card-answer','','Réponse courte dans tes mots.',3))}${formField('Domaine',textInput('card-domain','','Ex. informatique, droit, santé…'))}<div class="actions">${button('Créer la carte','add-card','primary')}</div>`,{className:'span-5',eyebrow:'MÉMOIRE'})}${panel('Bibliothèque apprendre à apprendre',bookCards(state),{className:'span-12',eyebrow:'ORDRE RECOMMANDÉ'})}</div>`;
}
