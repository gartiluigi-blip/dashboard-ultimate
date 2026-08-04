import { AUTOMATIONS, BODY_SYSTEMS, CULTURE_DOMAINS, CULTURE_QUESTIONS, HEALTH_PILLARS, LEARNING_BOOKS, LEARNING_PATH, NAV, QUICK_ACTIONS } from '../content.js';
import { dailyQuestionIndex, dueCards, ensureState, euro, getDay, healthScores, learningStats, localDate, moneyStats, num, smartPlan, sportStats, tradingPhase, weeklyReview } from '../engine.js';
import { badge, button, checked, empty, esc, fieldGrid, formField, formatDate, formatTime, icon, iconButton, metric, numberInput, panel, progress, routeButton, scoreRing, selectInput, textInput, textarea, transactionRow } from '../ui.js';
const today = localDate;
import { dailyCheckin, quickButtons } from './shared.js';
export function renderNav(route) {
  return NAV.map(([id,label,symbol])=>`<button type="button" class="nav-item ${route===id?'active':''}" data-action="navigate" data-route="${id}" aria-current="${route===id?'page':'false'}"><span>${esc(symbol)}</span><b>${esc(label)}</b></button>`).join('');
}

export function renderQuickSheet() {
  return `<div class="sheet-backdrop" data-action="close-overlay"></div><section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-title"><header><div><span class="eyebrow">CAPTURE RAPIDE</span><h2 id="quick-title">Ajouter sans chercher</h2></div>${iconButton('Fermer','close-overlay','close')}</header>${quickButtons()}</section>`;
}

export function renderCommand() {
  const commands = [
    ['today','Aujourd’hui','Voir le plan automatique'],
    ['health','Santé','Check-in, mesures, prévention'],
    ['learn','Apprendre','Focus, cartes, livres'],
    ['culture','Culture','14 domaines et question du jour'],
    ['body','Corps','Séance et récupération'],
    ['money','Argent','Transactions et budgets'],
    ['trading','Trading','Parcours guidé'],
    ['review','Revue','Bilan des sept jours'],
    ['settings','Réglages','Automatisations et design']
  ];
  return `<div class="command-backdrop" data-action="close-overlay"></div><section class="command" role="dialog" aria-modal="true" aria-labelledby="command-title"><header><div><span class="eyebrow">COMMANDE</span><h2 id="command-title">Où veux-tu aller ?</h2></div>${iconButton('Fermer','close-overlay','close')}</header><input id="command-search" autofocus placeholder="Tape santé, argent, culture…"><div class="command-list">${commands.map(([route,label,detail])=>`<button type="button" data-action="navigate" data-route="${route}" data-command-label="${esc(`${label} ${detail}`.toLowerCase())}"><span>${esc(label)}</span><small>${esc(detail)}</small>${icon('arrow')}</button>`).join('')}</div></section>`;
}

export function renderCheckinModal(state) {
  return `<div class="modal-backdrop" data-action="close-overlay"></div><section class="modal" role="dialog" aria-modal="true" aria-labelledby="checkin-title"><header><div><span class="eyebrow">30 SECONDES</span><h2 id="checkin-title">Check-in du jour</h2></div>${iconButton('Fermer','close-overlay','close')}</header>${dailyCheckin(state,true)}</section>`;
}

export function renderQuickDialog(kind, state) {
  const forms = {
    expense: `<h2>Ajouter une dépense</h2>${fieldGrid([formField('Catégorie',textInput('quick-expense-category','','Courses')),formField('Montant',numberInput('quick-expense-amount','',0,100000,.01))])}${formField('Note',textInput('quick-expense-note','','Facultatif'))}<div class="actions">${button('Ajouter','save-quick-expense','primary')}</div>`,
    symptom: `<h2>Noter un symptôme</h2>${fieldGrid([formField('Symptôme',textInput('quick-symptom-label','','Ex. fatigue')),formField('Intensité',numberInput('quick-symptom-severity',5,0,10,1))])}${formField('Contexte',textarea('quick-symptom-note','','Quand, après quoi, avec quels signes…',3))}<div class="actions">${button('Journaliser','save-quick-symptom','primary')}</div>`,
    focus: `<h2>Démarrer un bloc focus</h2>${formField('Objectif',textInput('quick-focus-label','','Ce que tu vas produire'))}<div class="actions">${button('Démarrer 25 minutes','start-quick-focus','primary')}</div>`
  };
  return `<div class="modal-backdrop" data-action="close-overlay"></div><section class="modal small" role="dialog" aria-modal="true"><header>${forms[kind] ? '' : '<h2>Capture</h2>'}${iconButton('Fermer','close-overlay','close')}</header>${forms[kind] || ''}</section>`;
}
