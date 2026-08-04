import { AUTOMATIONS, BODY_SYSTEMS, CULTURE_DOMAINS, CULTURE_QUESTIONS, HEALTH_PILLARS, LEARNING_BOOKS, LEARNING_PATH, NAV, QUICK_ACTIONS } from '../content.js';
import { dailyQuestionIndex, dueCards, ensureState, euro, getDay, healthScores, learningStats, localDate, moneyStats, num, smartPlan, sportStats, tradingPhase, weeklyReview } from '../engine.js';
import { badge, button, checked, empty, esc, fieldGrid, formField, formatDate, formatTime, icon, iconButton, metric, numberInput, panel, progress, routeButton, scoreRing, selectInput, textInput, textarea, transactionRow } from '../ui.js';
const today = localDate;
import { pageHero } from './shared.js';
export function pillarCards(state) {
  const scores = healthScores(state);
  return `<div class="pillar-grid">${HEALTH_PILLARS.map(item => `<article class="pillar ${item.id === scores.weakest.id ? 'weak' : ''}"><div class="pillar-title"><span>${esc(item.icon)}</span><b>${esc(item.label)}</b><strong>${scores.pillars[item.id]}%</strong></div>${progress(scores.pillars[item.id])}<p>${esc(item.target)}</p></article>`).join('')}</div>`;
}

export function systemCards(state) {
  const scores = healthScores(state);
  return `<div class="system-grid">${BODY_SYSTEMS.map(item => `<article class="system-card"><span>${esc(item.icon)}</span><div><b>${esc(item.label)}</b><strong>${scores.systems[item.id]}%</strong><small>${esc(item.inputs)}</small></div></article>`).join('')}</div>`;
}

export function vitalsPanel(state) {
  const latest = [...state.health.vitals].sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0] || {};
  return `<div class="form-section">${fieldGrid([
    formField('Date', `<input id="vital-date" type="date" value="${esc(today())}">`),
    formField('Tension haute', numberInput('vital-sys', latest.systolic || '', 60, 260, 1)),
    formField('Tension basse', numberInput('vital-dia', latest.diastolic || '', 30, 180, 1)),
    formField('Fréquence repos', numberInput('vital-hr', latest.restingHr || '', 25, 240, 1)),
    formField('Poids', numberInput('vital-weight', latest.weightKg || state.profile.weightKg || '', 30, 300, .1)),
    formField('Tour de taille', numberInput('vital-waist', latest.waistCm || '', 40, 250, .1))
  ])}<div class="actions">${button('Enregistrer les mesures','save-vitals','primary')}</div></div>`;
}

export function preventionPanel(state) {
  const rows = state.health.prevention.map(item => `<div class="data-row"><div><b>${esc(item.label)}</b><small>${esc(item.cadence || '')}</small></div><div class="row-end">${item.doneAt ? badge(formatDate(item.doneAt),'good') : badge('À vérifier','warning')}${button(item.doneAt?'Réinitialiser':'Marquer fait','toggle-prevention',item.doneAt?'quiet':'secondary',`data-id="${esc(item.id)}"`)}</div></div>`).join('');
  return `<div class="data-list">${rows}</div>`;
}

export function symptomPanel(state) {
  const rows = [...state.health.symptoms].slice(-6).reverse().map(item => `<div class="data-row"><div><b>${esc(item.label)}</b><small>${esc(item.date)} · intensité ${num(item.severity)}/10 · ${esc(item.note || '')}</small></div>${iconButton('Supprimer','delete-health','trash',`data-kind="symptom" data-id="${esc(item.id)}"`)}</div>`).join('');
  return `${fieldGrid([
    formField('Symptôme', textInput('symptom-label','','Ex. fatigue, douleur, nausée…')),
    formField('Intensité', numberInput('symptom-severity',5,0,10,1)),
    formField('Contexte', textInput('symptom-note','','Moment, déclencheur, médicament…'))
  ])}<div class="actions">${button('Journaliser','add-symptom','secondary')}</div><div class="data-list compact">${rows || empty('Aucun symptôme journalisé.')}</div>`;
}

export function supplementPanel(state) {
  const rows = [...state.health.supplements].slice(-5).reverse().map(item => `<div class="data-row"><div><b>${esc(item.name)}</b><small>${esc(item.goal)} · preuve ${esc(item.evidence)} · ${esc(item.decision)}</small></div>${iconButton('Supprimer','delete-health','trash',`data-kind="supplement" data-id="${esc(item.id)}"`)}</div>`).join('');
  return `${fieldGrid([
    formField('Complément', textInput('supp-name','','Nom exact')),
    formField('Objectif', textInput('supp-goal','','Pourquoi ?')),
    formField('Preuve', selectInput('supp-evidence',[['forte','Forte'],['moderee','Modérée'],['faible','Faible ou inconnue']],'faible')),
    formField('Décision', selectInput('supp-decision',[['refuse','Refusé'],['verifier','À vérifier'],['pro','Validé avec professionnel']],'verifier'))
  ])}${formField('Interactions / remarque',textarea('supp-note','','Médicaments, pathologies, dose, source…',2))}<div class="actions">${button('Ajouter au gate','add-supplement','secondary')}</div><div class="data-list compact">${rows || empty('Aucun complément évalué.')}</div>`;
}

export function renderHealth(raw) {
  const state = ensureState(structuredClone(raw));
  const scores = healthScores(state);
  const day = getDay(state);
  const daily = state.health.daily[today()] || {};
  const detailedFields = [
    formField('Qualité sommeil',selectInput('health-sleep-quality',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],num(day.sleepQuality,3))),
    formField('Eau ml',numberInput('health-water',day.waterMl,0,15000,250)),
    formField('Protéines g',numberInput('health-protein',day.proteinG,0,500,5)),
    formField('Fibres g',numberInput('health-fiber',Math.max(num(day.fiberG),num(daily.fiberG)),0,100,1)),
    formField('Fruits/légumes g',numberInput('health-plants',daily.fruitVegG||0,0,2000,50)),
    formField('Activité min',numberInput('health-activity',daily.activityMin||0,0,600,5)),
    formField('Lumière extérieure min',numberInput('health-light',daily.daylightMin||0,0,600,5)),
    formField('Récupération calme min',numberInput('health-recovery',daily.recoveryMin||0,0,300,5)),
    formField('Liens sociaux min',numberInput('health-social',daily.socialMin||0,0,600,5)),
    formField('Humeur',selectInput('health-mood',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],num(daily.mood,3))),
    formField('Boissons sucrées',numberInput('health-sugary',daily.sugaryDrinks||0,0,20,1)),
    formField('Alcool unités',numberInput('health-alcohol',daily.alcoholUnits||0,0,30,1))
  ];
  return `${pageHero('SANTÉ 360',`${scores.weakest.label} est le levier prioritaire.`,scores.weakest.target,scores.overall,'habitudes',button('Check-in rapide','open-checkin','primary')+button('Ajouter mesures','scroll-to','secondary','data-target="vitals"'))}<div class="metrics-row">${metric('Sommeil',`${scores.sleepHours.toFixed(1)} h`,'objectif profil','','☾')}${metric('Activité',`${scores.activityWeek} min`,'sept derniers jours','','↟')}${metric('Eau',`${scores.water} ml`,'aujourd’hui','','≈')}${metric('Tension',scores.vital?`${scores.vital.systolic}/${scores.vital.diastolic}`:'—','dernière mesure','','♥')}</div><div class="layout-grid">${panel('Huit piliers',pillarCards(state),{className:'span-12',eyebrow:'UN LEVIER À LA FOIS'})}${panel('Systèmes corporels',systemCards(state)+`<div class="medical-note">Ces scores décrivent seulement tes habitudes et données saisies. Ils ne diagnostiquent aucun organe.</div>`,{className:'span-12',eyebrow:'INDICATEURS PERSONNELS'})}${panel('Journal santé complet',`<form data-form="health-detail">${fieldGrid(detailedFields)}${formField('Note du jour',textarea('health-note',day.note||'','Symptômes, rendez-vous, contexte…',3))}<label class="toggle-line"><input id="health-caffeine" type="checkbox" ${checked(daily.caffeineLate)}><span>Caféine tardive</span></label><div class="actions">${button('Enregistrer la journée','save-health-detail','primary')}</div></form>`,{className:'span-8',eyebrow:'DONNÉES RÉELLES'})}${panel('Protocole énergie',`<div class="timeline"><article><span>Réveil</span><p>Lumière extérieure, eau, mouvement léger et heure stable.</p></article><article><span>Matin</span><p>Tâche mentale difficile avant les distractions.</p></article><article><span>Midi</span><p>Repas protéiné et riche en fibres, puis marche courte.</p></article><article><span>Après-midi</span><p>Hydratation, pause active et tâche adaptée.</p></article><article><span>Soir</span><p>Moins de stimulation, caféine coupée assez tôt.</p></article><article><span>Nuit</span><p>Chambre sombre, calme et fraîche.</p></article></div>`,{className:'span-4',eyebrow:'AUTOMATISATION'})}${panel('Mesures',vitalsPanel(state),{className:'span-6',eyebrow:'TENDANCES',id:'vitals'})}${panel('Prévention',preventionPanel(state),{className:'span-6',eyebrow:'À PLANIFIER'})}${panel('Journal de symptômes',symptomPanel(state),{className:'span-6',eyebrow:'POUR LA CONSULTATION'})}${panel('Gate compléments',supplementPanel(state),{className:'span-6',eyebrow:'OBJECTIF · PREUVE · INTERACTIONS'})}</div>`;
}
