import { AUTOMATIONS, BODY_SYSTEMS, CULTURE_DOMAINS, CULTURE_QUESTIONS, HEALTH_PILLARS, LEARNING_BOOKS, LEARNING_PATH, NAV, QUICK_ACTIONS } from '../content.js';
import { dailyQuestionIndex, dueCards, ensureState, euro, getDay, healthScores, learningStats, localDate, moneyStats, num, smartPlan, sportStats, tradingPhase, weeklyReview } from '../engine.js';
import { badge, button, checked, empty, esc, fieldGrid, formField, formatDate, formatTime, icon, iconButton, metric, numberInput, panel, progress, routeButton, scoreRing, selectInput, textInput, textarea, transactionRow } from '../ui.js';
const today = localDate;
import { pageHero, onboarding, planCards, quickButtons } from './shared.js';
export function renderToday(raw) {
  const state = ensureState(structuredClone(raw));
  const plan = smartPlan(state);
  const health = plan.health;
  const learn = plan.learning;
  const ready = plan.readiness;
  const money = plan.money;
  const sport = plan.sport;
  const widgets = state.nexus.widgets;
  const name = state.nexus.onboarding.name?.trim();
  const greeting = name ? `${name}, voici ton système.` : 'Voici ton système.';
  const widgetHtml = [
    widgets.energy ? panel('Énergie', `${progress(ready.score,'Readiness',ready.mode)}<div class="mini-stats"><span><b>${health.sleepHours.toFixed(1)} h</b> sommeil</span><span><b>${health.steps}</b> pas</span><span><b>${getDay(state).pain}/10</b> douleur</span></div>`, { className:'widget span-4', eyebrow:'AUJOURD’HUI', actions:routeButton('Ouvrir','health','text') }) : '',
    widgets.health ? panel('Santé 360', `${progress(health.overall,'Habitudes',`${health.weakest.label} est le maillon faible`)}<div class="widget-highlight"><span>${esc(health.weakest.icon)}</span><div><b>${esc(health.weakest.label)}</b><p>${esc(health.weakest.target)}</p></div></div>`, { className:'widget span-4', eyebrow:'PRIORITÉ', actions:routeButton('Détails','health','text') }) : '',
    widgets.learning ? panel('Cerveau & savoir', `${progress(learn.score,'Maîtrise',`${learn.due} carte(s) dues`)}<div class="mini-stats"><span><b>${learn.minutes7}</b> min/7j</span><span><b>${learn.cultureCovered}/14</b> domaines</span><span><b>${learn.books}</b> livres</span></div>`, { className:'widget span-4', eyebrow:'APPRENDRE', actions:routeButton('Ouvrir','learn','text') }) : '',
    widgets.body ? panel('Corps', `<div class="widget-number">${esc(sport.next)}</div><p>${sport.sessions} séance(s) et ${sport.minutes} minutes sur sept jours.</p>${sport.pain >= 6 ? `<div class="alert danger">Douleur élevée : récupération proposée.</div>` : `<div class="alert good">Cycle prêt pour la prochaine séance.</div>`}`, { className:'widget span-6', eyebrow:'PROCHAINE SÉANCE', actions:routeButton('Ouvrir','body','text') }) : '',
    widgets.money ? panel('Argent', `<div class="widget-number">${euro(money.forecast)}</div><p>Prévision après charges, dépenses et épargne du mois.</p><div class="mini-stats"><span><b>${euro(money.expenses)}</b> dépenses</span><span><b>${money.alerts.length}</b> alertes</span></div>`, { className:'widget span-6', eyebrow:'PRÉVISION', actions:routeButton('Ouvrir','money','text') }) : ''
  ].join('');
  return `${onboarding(state)}${pageHero(`NEXUS · ${formatDate(today())}`, greeting, `${ready.mode} · ${ready.availableMin} minutes disponibles · une seule interface, trois priorités.`, ready.score, 'readiness', button('Tout saisir', 'open-checkin', 'primary', '', 'edit') + button('Commande rapide', 'open-command', 'secondary', '', 'search'))}<div class="metrics-row">${metric('Santé',`${health.overall}/100`,health.weakest.label,health.overall<60?'danger':'good','♥')}${metric('Savoir',`${learn.score}/100`,`${learn.due} cartes dues`,'','◎')}${metric('Corps',`${sport.sessions} séances`,`${sport.minutes} min / 7 jours`,'','△')}${metric('Argent',euro(money.forecast),`${money.alerts.length} alerte(s)`,money.alerts.length?'danger':'','€')}</div><div class="layout-grid">${panel('Tes trois actions', planCards(state), { className:'span-8', eyebrow:`${plan.used}/${plan.budget} MIN PLANIFIÉES` })}${panel('Capture instantanée', quickButtons(), { className:'span-4', eyebrow:'UN GESTE' })}${widgetHtml}</div>`;
}
