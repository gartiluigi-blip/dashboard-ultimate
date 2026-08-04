import * as Store from '../v6/store.js';
import { CULTURE_DOMAINS, LEARNING_BOOKS } from './content.js';
import {
  VERSION,
  cardInterval,
  dateOffset,
  ensureState,
  getDay,
  localDate,
  num,
  uid
} from './engine.js';
import {
  renderCheckinModal,
  renderCommand,
  renderNav,
  renderQuickDialog,
  renderQuickSheet,
  renderRoute
} from './views.js';
import { button, esc, fieldGrid, formField, iconButton, numberInput, textInput, textarea } from './ui.js';

const app = document.querySelector('#app');
const nav = document.querySelector('#nav');
const mobileNav = document.querySelector('#mobile-nav');
const overlay = document.querySelector('#overlay');
const toastNode = document.querySelector('#toast');
const statusNode = document.querySelector('#status');
const versionNode = document.querySelector('#version');
const clockNode = document.querySelector('#clock');
const quickButton = document.querySelector('#quick-button');
const commandButton = document.querySelector('#command-button');
const menuButton = document.querySelector('#menu-button');
const sidebar = document.querySelector('#sidebar');

const VALID_ROUTES = new Set(['today','health','learn','culture','body','money','trading','review','settings']);
let route = resolveRoute();
let focusTicker = null;
let installPrompt = null;

function resolveRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  if (VALID_ROUTES.has(hash)) return hash;
  try {
    const state = ensureState(Store.load());
    return VALID_ROUTES.has(state.nexus.lastRoute) ? state.nexus.lastRoute : 'today';
  } catch { return 'today'; }
}

function state() {
  return ensureState(Store.load());
}

function update(mutator, options = {}) {
  return Store.update(draft => {
    ensureState(draft);
    return mutator(draft) || draft;
  }, options);
}

function value(id) { return document.querySelector(`#${CSS.escape(id)}`)?.value ?? ''; }
function checked(id) { return Boolean(document.querySelector(`#${CSS.escape(id)}`)?.checked); }
function number(id, fallback = 0) { return num(value(id), fallback); }

function toast(message, tone = '') {
  if (!toastNode) return;
  toastNode.textContent = message;
  toastNode.dataset.tone = tone;
  toastNode.classList.add('show');
  clearTimeout(window.__nexusToast);
  window.__nexusToast = window.setTimeout(() => toastNode.classList.remove('show'), 2800);
}

function applyUi(current) {
  document.documentElement.dataset.theme = current.ui.theme || 'graphite';
  document.documentElement.dataset.density = current.ui.density || 'comfortable';
  document.body.dataset.route = route;
  versionNode.textContent = VERSION.replace('-nexus','');
}

function render() {
  const current = state();
  applyUi(current);
  nav.innerHTML = renderNav(route);
  if (mobileNav) mobileNav.innerHTML = renderNav(route);
  try {
    app.innerHTML = renderRoute(route, current);
  } catch (error) {
    console.error(error);
    app.innerHTML = `<section class="fatal-card"><h1>Écran indisponible</h1><p>${esc(error.message || 'Erreur inconnue')}</p>${button('Retour aujourd’hui','navigate','primary','data-route="today"')}</section>`;
  }
  statusNode.textContent = route === 'today' ? 'Nexus actif' : nav.querySelector(`[data-route="${route}"] b`)?.textContent || 'Nexus';
  document.title = `${statusNode.textContent} · Ultimate Dashboard`;
  syncFocusDisplay();
}

function navigate(next) {
  if (!VALID_ROUTES.has(next)) next = 'today';
  route = next;
  location.hash = next;
  closeOverlay();
  update(draft => { draft.nexus.lastRoute = next; draft.ui.route = next; });
  sidebar?.classList.remove('open');
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openOverlay(html) {
  overlay.innerHTML = html;
  overlay.hidden = false;
  document.body.classList.add('overlay-open');
  requestAnimationFrame(() => overlay.querySelector('input, textarea, select, button')?.focus({ preventScroll: true }));
}
function closeOverlay() {
  overlay.hidden = true;
  overlay.innerHTML = '';
  document.body.classList.remove('overlay-open');
}

function downloadJson(content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ultimate-dashboard-v7-${localDate()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function renderBookModal(id) {
  const current = state();
  const book = LEARNING_BOOKS.find(row => row[0] === id);
  if (!book) return;
  const data = current.knowledge.books[id] || {};
  openOverlay(`<div class="modal-backdrop" data-action="close-overlay"></div><section class="modal" role="dialog" aria-modal="true"><header><div><span class="eyebrow">LIVRE MÉTHODOLOGIQUE</span><h2>${esc(book[1])}</h2><p>${esc(book[2])}</p></div>${iconButton('Fermer','close-overlay','close')}</header>${fieldGrid([formField('Pages lues',numberInput('book-pages',20,1,500,1)),formField('Durée',numberInput('book-minutes',25,5,300,5))])}${formField('Idée reformulée',textarea('book-idea','','Une idée dans tes mots.',3))}${formField('Application concrète',textarea('book-application','','Ce que tu vas changer ou tester.',3))}<label class="toggle-line"><input id="book-finished" type="checkbox" ${data.finished?'checked':''}><span>Livre terminé</span></label><div class="actions">${button('Enregistrer','save-book','primary',`data-id="${esc(id)}"`)}</div></section>`);
}

function quickAction(kind) {
  if (kind === 'water') {
    update(draft => { getDay(draft).waterMl += 250; });
    toast('+250 ml d’eau'); return render();
  }
  if (kind === 'protein') {
    update(draft => { getDay(draft).proteinG += 25; });
    toast('+25 g de protéines'); return render();
  }
  if (kind === 'walk') {
    update(draft => {
      const day = getDay(draft);
      day.steps += 1000;
      draft.health.daily[localDate()].activityMin += 10;
    });
    toast('+10 minutes de marche'); return render();
  }
  if (kind === 'expense' || kind === 'symptom' || kind === 'focus') {
    openOverlay(renderQuickDialog(kind, state()));
  }
}

function saveCheckin() {
  update(draft => {
    const day = getDay(draft);
    day.sleepHours = number('check-sleep', 7);
    day.energy = number('check-energy', 3);
    day.pain = number('check-pain', 0);
    day.availableMin = number('check-minutes', 60);
    if (document.querySelector('#check-steps')) day.steps = number('check-steps', day.steps);
    if (document.querySelector('#check-stress')) draft.health.daily[localDate()].stress = number('check-stress', 3);
    draft.nexus.plans[localDate()] = { generatedAt: new Date().toISOString() };
  }, { checkpoint: true, reason: 'daily_checkin' });
  closeOverlay();
  toast('Plan du jour recalculé');
  render();
}

function saveHealthDetail() {
  update(draft => {
    const day = getDay(draft);
    const health = draft.health.daily[localDate()];
    day.sleepQuality = number('health-sleep-quality', 3);
    day.waterMl = number('health-water');
    day.proteinG = number('health-protein');
    day.fiberG = number('health-fiber');
    day.note = value('health-note').trim();
    health.fiberG = day.fiberG;
    health.fruitVegG = number('health-plants');
    health.activityMin = number('health-activity');
    health.daylightMin = number('health-light');
    health.recoveryMin = number('health-recovery');
    health.socialMin = number('health-social');
    health.mood = number('health-mood',3);
    health.sugaryDrinks = number('health-sugary');
    health.alcoholUnits = number('health-alcohol');
    health.caffeineLate = checked('health-caffeine');
  }, { checkpoint: true, reason: 'health_detail' });
  toast('Journal santé enregistré'); render();
}

function saveVitals() {
  const systolic = number('vital-sys');
  const diastolic = number('vital-dia');
  if ((systolic && !diastolic) || (!systolic && diastolic)) return toast('Renseigne les deux valeurs de tension.', 'danger');
  update(draft => {
    draft.health.vitals.push({
      id: uid('vital'),
      date: value('vital-date') || localDate(),
      systolic,
      diastolic,
      restingHr: number('vital-hr'),
      weightKg: number('vital-weight'),
      waistCm: number('vital-waist'),
      createdAt: new Date().toISOString()
    });
    if (number('vital-weight')) draft.profile.weightKg = number('vital-weight');
  }, { checkpoint: true, reason: 'vitals' });
  toast('Mesures enregistrées'); render();
}

function toggleFocus() {
  const current = state();
  const focus = current.nexus.focus;
  if (focus.running) {
    const remaining = Math.max(0, Math.ceil((num(focus.endAt)-Date.now())/1000));
    update(draft => { draft.nexus.focus.running = false; draft.nexus.focus.remaining = remaining; draft.nexus.focus.endAt = 0; });
    toast('Focus en pause');
  } else {
    const remaining = num(focus.remaining,1500) || 1500;
    const label = value('focus-label').trim() || focus.label || 'Bloc focus';
    update(draft => { draft.nexus.focus = { running: true, remaining, endAt: Date.now()+remaining*1000, label }; });
    toast('Bloc focus démarré');
  }
  render();
}

function resetFocus() {
  update(draft => { draft.nexus.focus = { running:false,endAt:0,remaining:1500,label:'' }; });
  toast('Minuteur réinitialisé'); render();
}

function syncFocusDisplay() {
  clearInterval(focusTicker);
  const display = document.querySelector('#focus-display');
  if (!display) return;
  const tick = () => {
    const current = state().nexus.focus;
    let seconds = current.running ? Math.max(0, Math.ceil((num(current.endAt)-Date.now())/1000)) : num(current.remaining,1500);
    display.textContent = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    if (current.running && seconds <= 0) {
      clearInterval(focusTicker);
      update(draft => {
        draft.nexus.focus = { running:false,endAt:0,remaining:1500,label:current.label };
        draft.knowledge.sessions.push({ id:uid('focus'),date:localDate(),kind:'focus',minutes:25,proof:current.label });
      });
      navigator.vibrate?.([120,80,120]);
      toast('Bloc terminé : produis maintenant une preuve.','success');
      render();
    }
  };
  tick();
  focusTicker = window.setInterval(tick,1000);
}

function addTransaction() {
  const amount = number('tx-amount');
  if (amount <= 0) return toast('Montant invalide.', 'danger');
  update(draft => draft.money.transactions.push({
    id:uid('tx'), date:value('tx-date')||localDate(), type:value('tx-type')||'expense', category:value('tx-category').trim()||'Autre', amount, note:value('tx-note').trim()
  }), { checkpoint:true, reason:'transaction' });
  toast('Transaction ajoutée'); render();
}

async function handleAction(target, action) {
  if (action === 'navigate') return navigate(target.dataset.route);
  if (action === 'open-checkin') return openOverlay(renderCheckinModal(state()));
  if (action === 'open-command') return openOverlay(renderCommand());
  if (action === 'open-quick') return openOverlay(renderQuickSheet());
  if (action === 'close-overlay') return closeOverlay();
  if (action === 'scroll-to') return document.querySelector(`#${CSS.escape(target.dataset.target)}`)?.scrollIntoView({ behavior:'smooth',block:'start' });
  if (action === 'quick-action') return quickAction(target.dataset.quick);
  if (action === 'save-checkin') return saveCheckin();
  if (action === 'finish-onboarding') {
    update(draft => { draft.nexus.onboarding.completed=true; draft.nexus.onboarding.goal=value('onboarding-goal')||'balanced'; });
    toast('Nexus configuré'); return render();
  }
  if (action === 'complete-plan-item') {
    update(draft => { const day=getDay(draft); if(!day.completed.includes(target.dataset.id)) day.completed.push(target.dataset.id); }, {checkpoint:true,reason:'complete_plan'});
    toast('Priorité validée'); return render();
  }
  if (action === 'skip-plan-item') {
    const reason = prompt('Pourquoi reporter cette action aujourd’hui ?') || '';
    update(draft => { const day=getDay(draft); day.skipped.push({id:target.dataset.id,reason,at:new Date().toISOString()}); }, {checkpoint:true,reason:'skip_plan'});
    return render();
  }
  if (action === 'save-health-detail') return saveHealthDetail();
  if (action === 'save-vitals') return saveVitals();
  if (action === 'toggle-prevention') {
    update(draft => { const row=draft.health.prevention.find(item=>item.id===target.dataset.id); if(row) row.doneAt=row.doneAt?'':localDate(); }, {checkpoint:true,reason:'prevention'});
    toast('Prévention mise à jour'); return render();
  }
  if (action === 'add-symptom') {
    const label=value('symptom-label').trim(); if(!label) return toast('Symptôme obligatoire.','danger');
    update(draft=>draft.health.symptoms.push({id:uid('symptom'),date:localDate(),label,severity:number('symptom-severity',5),note:value('symptom-note').trim()}),{checkpoint:true,reason:'symptom'});
    toast('Symptôme journalisé'); return render();
  }
  if (action === 'add-supplement') {
    const name=value('supp-name').trim(); const goal=value('supp-goal').trim(); if(!name||!goal) return toast('Nom et objectif obligatoires.','danger');
    update(draft=>draft.health.supplements.push({id:uid('supp'),date:localDate(),name,goal,evidence:value('supp-evidence'),decision:value('supp-decision'),note:value('supp-note').trim()}),{checkpoint:true,reason:'supplement'});
    toast('Complément ajouté au gate'); return render();
  }
  if (action === 'delete-health') {
    if(!confirm('Supprimer cette donnée ?')) return;
    update(draft=>{const key=target.dataset.kind==='symptom'?'symptoms':'supplements';draft.health[key]=draft.health[key].filter(row=>row.id!==target.dataset.id);},{checkpoint:true,reason:'delete_health'});
    toast('Donnée supprimée'); return render();
  }
  if (action === 'toggle-focus') return toggleFocus();
  if (action === 'reset-focus') return resetFocus();
  if (action === 'complete-meta') {
    const proof=value('meta-proof').trim(); if(proof.length<20) return toast('Ajoute une preuve concrète.','danger');
    update(draft=>{const index=num(draft.knowledge.metaIndex);draft.knowledge.sessions.push({id:uid('meta'),date:localDate(),kind:'meta',moduleId:index,minutes:25,proof});draft.knowledge.metaIndex=Math.min(7,index+1);},{checkpoint:true,reason:'meta_learning'});
    toast('Méthode validée'); return render();
  }
  if (action === 'add-card') {
    const question=value('card-question').trim(); const answer=value('card-answer').trim(); if(question.length<5||answer.length<5) return toast('Question et réponse obligatoires.','danger');
    update(draft=>draft.knowledge.cards.push({id:uid('card'),question,answer,domain:value('card-domain').trim()||'Général',dueDate:localDate(),interval:1,createdAt:new Date().toISOString()}),{checkpoint:true,reason:'flashcard'});
    toast('Carte créée'); return render();
  }
  if (action === 'review-card') {
    update(draft=>{const card=draft.knowledge.cards.find(row=>row.id===target.dataset.id);if(!card)return;const interval=cardInterval(target.dataset.rating,num(card.interval,1));card.interval=interval;card.dueDate=dateOffset(interval);card.lastRating=target.dataset.rating;card.reviewedAt=new Date().toISOString();});
    toast('Prochaine révision programmée'); return render();
  }
  if (action === 'open-book-log') return renderBookModal(target.dataset.id);
  if (action === 'save-book') {
    const idea=value('book-idea').trim(); const application=value('book-application').trim(); if(idea.length<10||application.length<5) return toast('Idée et application obligatoires.','danger');
    update(draft=>{const id=target.dataset.id;draft.knowledge.bookSessions.push({id:uid('book'),bookId:id,date:localDate(),pages:number('book-pages'),minutes:number('book-minutes'),idea,application});const row=draft.knowledge.books[id]||{};draft.knowledge.books[id]={...row,pages:num(row.pages)+number('book-pages'),finished:checked('book-finished'),lastAt:localDate()};},{checkpoint:true,reason:'book_log'});
    closeOverlay(); toast('Lecture méthodologique enregistrée'); return render();
  }
  if (action === 'select-culture') {
    update(draft=>{draft.knowledge.cultureIndex=num(target.dataset.index);}); return render();
  }
  if (action === 'complete-culture') {
    const proof=value('culture-proof').trim(); if(proof.length<30) return toast('La synthèse doit être plus développée.','danger');
    update(draft=>{const index=num(draft.knowledge.cultureIndex);draft.knowledge.cultureSessions.push({id:uid('culture'),date:localDate(),domainId:CULTURE_DOMAINS[index][0],minutes:number('culture-minutes',25),kind:value('culture-kind'),proof});draft.knowledge.cultureIndex=(index+1)%14;},{checkpoint:true,reason:'culture'});
    toast('Domaine enregistré'); return render();
  }
  if (action === 'save-daily-question') {
    const proof=value('daily-answer').trim(); if(proof.length<20) return toast('Écris une vraie réponse avant de valider.','danger');
    update(draft=>draft.knowledge.cultureSessions.push({id:uid('question'),date:localDate(),domainId:'media',minutes:15,kind:'question',proof}),{checkpoint:true,reason:'daily_question'});
    toast('Réponse enregistrée'); return render();
  }
  if (action === 'save-sport') {
    const proof=value('sport-proof').trim(); const pain=number('sport-pain'); if(proof.length<10) return toast('Ajoute une preuve de séance.','danger');
    update(draft=>draft.sport.sessions.push({id:uid('sport'),date:localDate(),createdAt:new Date().toISOString(),type:value('sport-type'),status:pain>=7?'stopped':pain>=4?'deload':'completed',pain,rpe:number('sport-rpe'),durationMin:number('sport-duration'),notes:proof,qualities:[],exercises:{},advancesCycle:value('sport-type')!=='Récupération active'}),{checkpoint:true,reason:'sport'});
    toast('Séance enregistrée'); return render();
  }
  if (action === 'log-recovery') {
    update(draft=>draft.sport.sessions.push({id:uid('sport'),date:localDate(),createdAt:new Date().toISOString(),type:'Récupération active',status:'completed',pain:0,rpe:2,durationMin:20,notes:'Récupération rapide',qualities:['recovery'],exercises:{},advancesCycle:false}),{checkpoint:true,reason:'recovery'});
    toast('Récupération enregistrée'); return render();
  }
  if (action === 'add-transaction') return addTransaction();
  if (action === 'save-money-settings') {
    update(draft=>{draft.money.settings.income=number('money-income');draft.money.settings.openingBalance=number('money-balance');draft.money.settings.savingsTarget=number('money-saving');draft.money.settings.emergencyTarget=number('money-emergency');});
    toast('Paramètres sauvegardés'); return render();
  }
  if (action === 'save-budget') {
    const category=value('budget-category').trim(); const limit=number('budget-limit'); if(!category||limit<=0) return toast('Budget invalide.','danger');
    update(draft=>{draft.money.budgets[category]=limit;}); toast('Budget sauvegardé'); return render();
  }
  if (action === 'add-recurring') {
    const label=value('rec-label').trim(); const amount=number('rec-amount'); if(!label||amount<=0) return toast('Charge invalide.','danger');
    update(draft=>draft.money.recurring.push({id:uid('rec'),label,amount,day:number('rec-day',1),type:'expense'}),{checkpoint:true,reason:'recurring'});
    toast('Charge ajoutée'); return render();
  }
  if (action === 'save-trading-setup') {
    const name=value('trade-setup-name').trim(); const rules=value('trade-rules').trim(); if(name.length<3||rules.length<40) return toast('Nom et règles précises obligatoires.','danger');
    update(draft=>{draft.trading.setup.name=name;draft.trading.setup.market=value('trade-market').trim()||'MNQ';draft.trading.setup.session=value('trade-session').trim()||'New York AM';draft.trading.setup.rules=rules;});
    toast('Setup unique sauvegardé'); return render();
  }
  if (action === 'add-backtest') {
    const note=value('backtest-note').trim(); if(note.length<10) return toast('Ajoute un résultat concret.','danger');
    update(draft=>draft.trading.sessions.push({id:uid('backtest'),date:localDate(),kind:'backtest',samples:number('backtest-samples',10),durationMin:number('backtest-minutes',45),note,breach:false}),{checkpoint:true,reason:'backtest'});
    toast('Backtest ajouté'); return render();
  }
  if (action === 'add-sim-trade') {
    const note=value('trade-note').trim(); if(note.length<10) return toast('Décision et preuve obligatoires.','danger');
    update(draft=>{draft.trading.trades.push({id:uid('trade'),date:value('trade-date')||localDate(),createdAt:new Date().toISOString(),market:draft.trading.setup.market||'MNQ',setup:draft.trading.setup.name||'Setup',contracts:number('trade-contracts',1),risk:number('trade-risk'),pnl:number('trade-pnl'),note,breach:false,violations:[]});draft.trading.sessions.push({id:uid('execution'),date:localDate(),kind:'execution',durationMin:30,breach:false,note});},{checkpoint:true,reason:'sim_trade'});
    toast('Simulation journalisée'); return render();
  }
  if (action === 'save-risk') {
    update(draft=>{draft.trading.risk.riskPerTrade=number('risk-per-trade');draft.trading.risk.dailyStop=number('risk-daily');draft.trading.risk.maxTrades=number('risk-count');draft.trading.risk.maxConsecutiveLosses=number('risk-losses');});
    toast('Garde-fous sauvegardés'); return render();
  }
  if (action === 'delete-record') {
    if(!confirm('Supprimer cette donnée ? Une annulation restera disponible.')) return;
    try { Store.removeRecord(target.dataset.path,target.dataset.id); toast('Donnée supprimée'); render(); } catch(error) { toast(error.message,'danger'); }
    return;
  }
  if (action === 'create-backup') { Store.createBackup('manual_v7'); toast('Backup créé'); return; }
  if (action === 'export-data') return downloadJson(Store.exportData());
  if (action === 'undo') { try { Store.undoLast(); toast('Modification annulée'); render(); } catch(error) { toast(error.message,'danger'); } return; }
  if (action === 'reset-app') { if(!confirm('Réinitialiser toutes les données locales ?'))return; Store.resetV6(); closeOverlay(); toast('Dashboard réinitialisé'); return navigate('today'); }
  if (action === 'save-settings') {
    update(draft=>{draft.ui.theme=value('setting-theme');draft.ui.density=value('setting-density');draft.nexus.onboarding.goal=value('setting-goal');draft.nexus.onboarding.name=value('setting-name').trim();draft.nexus.onboarding.completed=true;});
    toast('Réglages appliqués'); return render();
  }
  if (action === 'save-quick-expense') {
    const amount=number('quick-expense-amount'); if(amount<=0)return toast('Montant invalide.','danger');
    update(draft=>draft.money.transactions.push({id:uid('tx'),date:localDate(),type:'expense',category:value('quick-expense-category').trim()||'Autre',amount,note:value('quick-expense-note').trim()}),{checkpoint:true,reason:'quick_expense'});
    closeOverlay(); toast('Dépense ajoutée'); return render();
  }
  if (action === 'save-quick-symptom') {
    const label=value('quick-symptom-label').trim(); if(!label)return toast('Symptôme obligatoire.','danger');
    update(draft=>draft.health.symptoms.push({id:uid('symptom'),date:localDate(),label,severity:number('quick-symptom-severity',5),note:value('quick-symptom-note').trim()}),{checkpoint:true,reason:'quick_symptom'});
    closeOverlay(); toast('Symptôme journalisé'); return render();
  }
  if (action === 'start-quick-focus') {
    const label=value('quick-focus-label').trim()||'Bloc focus';
    update(draft=>{draft.nexus.focus={running:true,remaining:1500,endAt:Date.now()+1500*1000,label};});
    closeOverlay(); toast('Focus démarré'); navigate('learn');
  }
  if (action === 'install-app' && installPrompt) { installPrompt.prompt(); installPrompt=null; return; }
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  Promise.resolve(handleAction(target, action)).catch(error => { console.error(error); toast(error.message || 'Action impossible','danger'); });
});

document.addEventListener('change', async event => {
  const target = event.target;
  if (target.matches('[data-setting="automation"]')) {
    update(draft => { draft.nexus.automation[target.dataset.key] = target.checked; });
    toast('Automatisation mise à jour'); return;
  }
  if (target.matches('[data-setting="widget"]')) {
    update(draft => { draft.nexus.widgets[target.dataset.key] = target.checked; });
    toast('Widget mis à jour'); return;
  }
  if (target.id === 'import-file' && target.files?.[0]) {
    try { Store.importData(await target.files[0].text()); toast('Import terminé'); render(); }
    catch(error) { toast(error.message || 'Import impossible','danger'); }
  }
});

document.addEventListener('input', event => {
  if (event.target.id !== 'command-search') return;
  const query = event.target.value.trim().toLowerCase();
  document.querySelectorAll('.command-list [data-command-label]').forEach(row => { row.hidden = query && !row.dataset.commandLabel.includes(query); });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeOverlay();
  if (event.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) {
    event.preventDefault(); openOverlay(renderCommand());
  }
});

quickButton?.addEventListener('click', () => openOverlay(renderQuickSheet()));
commandButton?.addEventListener('click', () => openOverlay(renderCommand()));
menuButton?.addEventListener('click', () => sidebar?.classList.toggle('open'));
window.addEventListener('hashchange', () => { const next=resolveRoute(); if(next!==route){route=next;render();} });
window.addEventListener('storage', event => { if(event.key==='ud6_state') render(); });
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt=event; });

setInterval(() => {
  if (clockNode) clockNode.textContent = new Intl.DateTimeFormat('fr-BE',{hour:'2-digit',minute:'2-digit'}).format(new Date());
},1000);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

try {
  const current = Store.load();
  if (!current.nexus) Store.update(draft => ensureState(draft));
} catch (error) { console.error(error); }
render();
