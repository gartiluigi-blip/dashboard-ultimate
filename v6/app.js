import * as Store from './store.js';
import { DEFAULT_RECURRING, FOOD_SUBSTITUTIONS, MEAL_PLAN, ROUTES, SPORT_PROGRAM, STUDY_TRACKS } from './content.js';
import { cashForecast, effectiveDayMode, nextWorkout, nutritionTargets, sportProgression, todayOrders, vintedCost, vintedDecision, vintedResult, vintedRevenue } from './rules.js';

const app = document.querySelector('#app');
const tabs = document.querySelector('#tabs');
const clock = document.querySelector('#clock');
const toastNode = document.querySelector('#toast');
const uid = prefix => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;

let route = Store.load().ui.route || 'today';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function euro(value) {
  return `${Number(value || 0).toFixed(2)} €`;
}

function toast(message) {
  toastNode.textContent = message;
  toastNode.classList.add('show');
  clearTimeout(window.__ud6Toast);
  window.__ud6Toast = setTimeout(() => toastNode.classList.remove('show'), 1900);
}

function ensureDay(state) {
  const date = Store.localDate();
  if (!state.days[date]) state.days[date] = { energy: 3, pain: 0, availableMin: 60, waterMl: 0, proteinG: 0, completed: [], blocked: [], note: '', mode: 'auto' };
  return state.days[date];
}

function card(title, body, className = '') {
  return `<section class="card ${className}"><div class="card-head"><h2>${escapeHtml(title)}</h2></div>${body}</section>`;
}

function metric(title, value, detail = '', state = '') {
  return `<section class="card metric-card ${state}"><div class="metric-label">${escapeHtml(title)}</div><div class="metric">${escapeHtml(value)}</div><div class="muted">${escapeHtml(detail)}</div></section>`;
}

function progress(value, max) {
  const pct = max ? Math.min(100, Math.round(Number(value || 0) / Number(max || 1) * 100)) : 0;
  return `<div class="progress"><div class="bar" style="width:${pct}%"></div></div>`;
}

function button(label, action, className = '', attrs = '') {
  return `<button type="button" class="btn ${className}" data-action="${action}" ${attrs}>${escapeHtml(label)}</button>`;
}

function setRoute(next) {
  route = ROUTES.some(([id]) => id === next) ? next : 'today';
  Store.update(state => { state.ui.route = route; });
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderNav() {
  tabs.innerHTML = ROUTES.map(([id, label]) => `<button class="tab ${route === id ? 'active' : ''}" data-action="navigate" data-route="${id}">${escapeHtml(label)}</button>`).join('');
}

function render() {
  const state = Store.load();
  renderNav();
  const renderer = { today: renderToday, nutrition: renderNutrition, sport: renderSport, study: renderStudy, money: renderMoney, system: renderSystem }[route] || renderToday;
  app.innerHTML = renderer(state);
  document.querySelector('#version')?.replaceChildren(document.createTextNode(Store.APP_VERSION));
}

function renderToday(state) {
  const day = ensureDay(state);
  const command = todayOrders(state);
  const completed = new Set(day.completed || []);
  const orders = command.orders.map(order => {
    const blocked = (day.blocked || []).some(row => row.id === order.id);
    return `<article class="order ${blocked ? 'warn' : ''}">
      <div class="order-rank">${order.rank}</div>
      <div class="order-body">
        <div class="row"><span class="pill">${escapeHtml(order.domain)}</span><span class="pill">${order.minutes} min</span></div>
        <h3>${escapeHtml(order.title)}</h3>
        <p>${escapeHtml(order.detail)}</p>
        ${blocked ? `<div class="fallback">Blocage enregistré. Passe à une version de 5 minutes ou reporte sans dette.</div>` : ''}
        <div class="row">
          ${button('Ouvrir', 'navigate', '', `data-route="${order.route}"`)}
          ${button('Terminé', 'complete-order', 'primary', `data-id="${order.id}"`)}
          ${button(blocked ? 'Débloquer' : 'Bloqué', 'block-order', 'ghost', `data-id="${order.id}"`)}
        </div>
      </div>
    </article>`;
  }).join('') || `<div class="empty">Les trois ordres sont exécutés. Clôture la journée et arrête d’empiler.</div>`;

  const allDone = command.orders.length === 0;
  return `
    <section class="hero ${allDone ? 'ok' : ''}">
      <div><div class="eyebrow">CENTRE DE COMMANDE · ${Store.localDate()}</div><h2>${allDone ? 'Journée sécurisée' : 'Exécute dans cet ordre'}</h2><p>Un moteur, trois ordres maximum, aucune validation fictive.</p></div>
      <div class="hero-score">${completed.size}</div>
    </section>
    <div class="metrics">
      ${metric('Mode', command.modeLabel, 'calculé selon contexte', command.mode === 'recovery' ? 'warn' : '')}
      ${metric('Temps', `${day.availableMin || 60} min`, 'disponible aujourd’hui')}
      ${metric('Énergie', `${day.energy || 3}/5`, `douleur ${day.pain || 0}/10`, Number(day.pain || 0) >= 5 ? 'warn' : '')}
      ${metric('Hydratation', `${day.waterMl || 0}/${command.targets.waterMl} ml`, 'cible personnalisée')}
    </div>
    ${card('Contexte du jour', `<div class="form-grid compact">
      <label>Mode<select id="day-mode"><option value="auto">Auto</option><option value="normal">Normal</option><option value="execution">Exécution</option><option value="fatigue">Fatigue</option><option value="recovery">Récupération</option></select></label>
      <label>Énergie 1–5<input id="day-energy" type="number" min="1" max="5" value="${day.energy || 3}"></label>
      <label>Douleur 0–10<input id="day-pain" type="number" min="0" max="10" value="${day.pain || 0}"></label>
      <label>Minutes disponibles<input id="day-minutes" type="number" min="5" max="600" value="${day.availableMin || 60}"></label>
    </div><label>Note opérationnelle<textarea id="day-note" rows="2" placeholder="Blocage, contrainte, prochaine reprise">${escapeHtml(day.note || '')}</textarea></label><div class="row">${button('Recalculer la journée', 'save-day', 'primary')}</div>`, 'span-12')}
    ${card('Ordres actifs', `<div class="order-list">${orders}</div>`, 'span-12')}
    ${card('Capture rapide', `<div class="quick-grid">
      ${button('+250 ml eau', 'add-water', '', 'data-amount="250"')}
      ${button('+500 ml eau', 'add-water', '', 'data-amount="500"')}
      ${button('+25 g protéines', 'add-protein', '', 'data-amount="25"')}
      ${button('Bloc étude', 'navigate', '', 'data-route="study"')}
      ${button('Séance sport', 'navigate', '', 'data-route="sport"')}
      ${button('Dépense', 'navigate', '', 'data-route="money"')}
    </div>`, 'span-12')}
  `;
}

function renderNutrition(state) {
  const day = ensureDay(state);
  const targets = nutritionTargets(state.profile);
  const plan = MEAL_PLAN[new Date().getDay()] || MEAL_PLAN[1];
  const mealsDone = new Set((state.nutrition.entries || []).filter(entry => entry.date === Store.localDate() && entry.kind === 'meal').map(entry => entry.mealId));
  const totalCalories = plan.meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = plan.meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalFiber = plan.meals.reduce((sum, meal) => sum + meal.fiber, 0);

  const meals = plan.meals.map(meal => `<article class="meal ${mealsDone.has(meal.id) ? 'ok' : ''}">
    <div class="row"><span class="pill">${meal.time}</span><span class="pill">${meal.calories} kcal</span><span class="pill">${meal.protein} g prot.</span></div>
    <h3>${escapeHtml(meal.title)}</h3>
    <ul>${meal.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    ${mealsDone.has(meal.id) ? '<div class="status-ok">Enregistré</div>' : button('Repas consommé', 'complete-meal', 'primary', `data-meal="${meal.id}"`)}
  </article>`).join('');

  return `
    <section class="hero"><div><div class="eyebrow">NUTRITION · ${plan.name}</div><h2>Plan précis, substitutions libres</h2><p>La cible s’adapte au profil. Les suppléments restent facultatifs et séparés du score.</p></div><div class="hero-score">${targets.proteinG}g</div></section>
    <div class="metrics">
      ${metric('Plan', `${totalCalories} kcal`, `${totalProtein} g protéines`)}
      ${metric('Fibres', `${totalFiber} g`, 'prévision du menu')}
      ${metric('Eau', `${day.waterMl || 0}/${targets.waterMl} ml`, 'enregistrée')}
      ${metric('Protéines', `${day.proteinG || 0}/${targets.proteinG} g`, 'enregistrées')}
    </div>
    ${card('Menu du jour', `<div class="meal-grid">${meals}</div>`, 'span-12')}
    ${card('Saisie rapide', `<div class="quick-grid">${button('+250 ml', 'add-water', '', 'data-amount="250"')}${button('+500 ml', 'add-water', '', 'data-amount="500"')}${button('+20 g protéines', 'add-protein', '', 'data-amount="20"')}${button('+30 g protéines', 'add-protein', '', 'data-amount="30"')}</div>`, 'span-12')}
    ${card('Substitutions', Object.entries(FOOD_SUBSTITUTIONS).map(([group, items]) => `<details><summary>${escapeHtml(group)}</summary><div class="chip-list">${items.map(item => `<span class="chip">${escapeHtml(item)}</span>`).join('')}</div></details>`).join(''), 'span-12')}
    ${card('Profil nutrition', `<div class="form-grid">
      <label>Poids kg<input id="profile-weight" type="number" step="0.1" value="${state.profile.weightKg}"></label>
      <label>Protéines g/kg<input id="profile-protein" type="number" min="1.2" max="2.2" step="0.1" value="${state.profile.proteinPerKg}"></label>
      <label>Eau cible ml<input id="profile-water" type="number" min="1800" max="5000" step="100" value="${state.profile.waterMl}"></label>
      <label>Repas par jour<input id="profile-meals" type="number" min="2" max="6" value="${state.profile.mealsPerDay}"></label>
    </div><div class="row">${button('Sauver le profil', 'save-profile', 'primary')}</div><p class="notice">Les valeurs sont des objectifs de suivi, pas une prescription médicale. En cas de restriction rénale, cardiaque ou autre, le protocole doit être validé par un soignant.</p>`, 'span-12')}
  `;
}

function lastMatchingSession(state, type) {
  return state.sport.sessions.filter(session => session.type === type && ['completed', 'deload'].includes(session.status)).at(-1);
}

function renderSport(state) {
  const workout = nextWorkout(state);
  const previous = lastMatchingSession(state, workout.name);
  const exercises = workout.exercises.map(exercise => {
    const oldSets = previous?.exercises?.[exercise.id]?.sets || [];
    const rows = Array.from({ length: exercise.sets }, (_, index) => {
      const old = oldSets[index] || {};
      return `<div class="set-row" data-exercise="${exercise.id}"><span>S${index + 1}</span><input aria-label="Répétitions" type="number" min="0" placeholder="reps" value="${escapeHtml(old.reps || '')}"><input aria-label="Charge" type="number" min="0" step="0.5" placeholder="kg" value="${escapeHtml(old.kg || '')}"><input aria-label="RIR" type="number" min="0" max="5" placeholder="RIR" value="${escapeHtml(old.rir || '2')}"><input aria-label="Douleur" type="number" min="0" max="10" placeholder="douleur" value="0"></div>`;
    }).join('');
    return `<article class="exercise-card"><div class="row"><span class="pill">${exercise.sets} séries</span><span class="pill">${escapeHtml(exercise.target)}</span></div><h3>${escapeHtml(exercise.name)}</h3><p>${escapeHtml(exercise.note || '')}</p><div class="progression">${escapeHtml(sportProgression(previous, exercise))}</div>${rows}</article>`;
  }).join('');

  const recent = state.sport.sessions.slice(-8).reverse().map(session => `<div class="history-row"><div><b>${escapeHtml(session.date)} · ${escapeHtml(session.type)}</b><div class="muted">${escapeHtml(session.status)} · douleur ${session.pain || 0}/10 · énergie ${session.energy || 3}/5</div></div></div>`).join('') || '<div class="empty">Aucune séance enregistrée.</div>';

  return `
    <section class="hero ${workout.recovery ? 'ok' : ''}"><div><div class="eyebrow">SPORT · CYCLE PAR EXÉCUTION</div><h2>${escapeHtml(workout.name)}</h2><p>${escapeHtml(workout.focus)}</p></div><div class="hero-score">${workout.index + 1}/${SPORT_PROGRAM.length}</div></section>
    ${card('Principe', '<p>Le cycle avance uniquement après une séance réellement terminée. Une séance ratée ne décale plus automatiquement le programme.</p>', 'span-12')}
    ${card('Séance', workout.recovery ? '<div class="recovery-box"><h3>Récupération active</h3><p>20 à 40 minutes de marche ou vélo facile. Mobilité uniquement dans une amplitude confortable.</p></div>' : `<div class="exercise-grid">${exercises}</div>`, 'span-12')}
    ${card('Clôture séance', `<div class="form-grid compact"><label>Énergie 1–5<input id="sport-energy" type="number" min="1" max="5" value="3"></label><label>Douleur globale 0–10<input id="sport-pain" type="number" min="0" max="10" value="0"></label><label>Durée minutes<input id="sport-duration" type="number" min="0" max="240" value="${workout.recovery ? 25 : 50}"></label></div><label>Notes<textarea id="sport-notes" rows="2" placeholder="Technique, charge, douleur, modification"></textarea></label><div class="row">${button('Séance terminée', 'save-sport', 'primary', 'data-status="completed"')}${button('Séance allégée', 'save-sport', '', 'data-status="deload"')}${button('Séance sautée', 'save-sport', 'ghost', 'data-status="skipped"')}</div><p class="notice">Une douleur élevée force le statut arrêt douleur. Douleur irradiée, engourdissement ou faiblesse : arrêt et avis médical.</p>`, 'span-12')}
    ${card('Historique récent', recent, 'span-12')}
  `;
}

function activeStudyResource(state, trackId) {
  const track = STUDY_TRACKS[trackId] || STUDY_TRACKS.epfc;
  const progress = state.study.tracks[trackId] || {};
  const index = Math.min(Number(progress.index || progress.bookIndex || 0), track.resources.length - 1);
  return { track, progress, index: Math.max(0, index), resource: track.resources[Math.max(0, index)] };
}

function renderStudy(state) {
  const trackId = state.study.activeTrack || 'epfc';
  const active = activeStudyResource(state, trackId);
  const due = state.study.reviews.filter(review => review.status !== 'closed' && (review.nextReview || '9999-12-31') <= Store.localDate());
  const recent = state.study.sessions.slice(-10).reverse().map(session => `<div class="history-row"><div><b>${escapeHtml(session.date)} · ${escapeHtml(session.track || session.domain || '')}</b><div class="muted">${escapeHtml(session.title || session.proof || '')} · ${session.minutes || 0} min</div></div></div>`).join('') || '<div class="empty">Aucune session enregistrée.</div>';

  const trackTabs = Object.entries(STUDY_TRACKS).map(([id, track]) => button(track.label, 'study-track', id === trackId ? 'primary' : '', `data-track="${id}"`)).join('');
  const roadmap = active.track.resources.map((resource, index) => `<div class="roadmap-row ${index < active.index ? 'ok' : index === active.index ? 'active' : ''}"><span>${index + 1}</span><div><b>${escapeHtml(resource[0])}</b><div class="muted">${escapeHtml(resource[1])}</div></div></div>`).join('');
  const reviews = due.slice(0, 6).map(review => `<article class="review"><b>${escapeHtml(review.error || review.title || 'Erreur')}</b><p>${escapeHtml(review.fix || review.correction || '')}</p><div class="row">${button('Correct', 'review-done', 'primary', `data-id="${review.id}" data-result="success"`)}${button('À revoir', 'review-done', '', `data-id="${review.id}" data-result="fail"`)}</div></article>`).join('') || '<div class="empty">Aucune révision due.</div>';

  return `
    <section class="hero"><div><div class="eyebrow">ÉTUDES · UNE RESSOURCE ACTIVE</div><h2>${escapeHtml(active.track.label)}</h2><p>Livre ou cours actif → exercice concret → preuve réelle → révision.</p></div><div class="hero-score">${active.index + 1}/${active.track.resources.length}</div></section>
    ${card('Parcours', `<div class="row">${trackTabs}</div><div class="roadmap">${roadmap}</div>`, 'span-12')}
    ${card('Mission active', `<div class="active-resource"><span class="pill">${escapeHtml(active.resource[0])}</span><h3>${escapeHtml(active.resource[1])}</h3><p>Preuve attendue : ${escapeHtml(active.resource[2])}</p></div><div class="form-grid compact"><label>Minutes<input id="study-minutes" type="number" min="5" max="240" value="30"></label><label>Type<select id="study-kind"><option value="course">Cours / lecture</option><option value="exercise">Exercice</option><option value="project">Projet</option><option value="review">Révision</option></select></label></div><label>Preuve réelle<input id="study-proof" type="text" placeholder="Exercice terminé, lien GitHub, note produite, résultat quiz"></label><label>Erreur ou point à revoir<input id="study-error" type="text" placeholder="Facultatif"></label><label>Correction / règle<input id="study-fix" type="text" placeholder="Facultatif"></label><div class="row">${button('Enregistrer la session', 'save-study', 'primary')}${button('Session + ressource terminée', 'save-study', '', 'data-finish="true"')}</div>`, 'span-12')}
    ${card(`Révisions dues · ${due.length}`, reviews, 'span-12')}
    ${card('Activité récente', recent, 'span-12')}
  `;
}

function monthTotals(state) {
  const month = Store.localDate().slice(0, 7);
  const transactions = state.money.transactions.filter(transaction => String(transaction.date || '').startsWith(month));
  const income = transactions.filter(row => row.type === 'income').reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const expenses = transactions.filter(row => !['income', 'saving'].includes(row.type)).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const savings = transactions.filter(row => row.type === 'saving').reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return { income, expenses, savings };
}

function renderMoney(state) {
  if (!state.money.recurring.length) {
    Store.update(draft => {
      draft.money.recurring = DEFAULT_RECURRING.map(([label, amount, day]) => ({ id: uid('rec'), label, amount, day, type: 'expense' }));
    });
    return renderMoney(Store.load());
  }
  const totals = monthTotals(state);
  const recurringTotal = state.money.recurring.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const forecast = cashForecast(state, 30);
  const vinted = state.money.vinted.slice().sort((a, b) => vintedDecision(b).priority - vintedDecision(a).priority);
  const vintedCards = vinted.map(item => {
    const decision = vintedDecision(item);
    const result = vintedResult(item);
    return `<article class="vinted-card ${decision.priority >= 80 ? 'danger' : decision.priority >= 55 ? 'warn' : ''}">
      <div class="row"><span class="pill">${escapeHtml(decision.label)}</span><span class="pill">${escapeHtml(item.status)}</span></div>
      <h3>${escapeHtml(item.brand ? `${item.brand} · ${item.name}` : item.name)}</h3>
      <p>${escapeHtml(decision.reason)}</p>
      <div class="money-line"><span>Coût réel</span><b>${euro(vintedCost(item))}</b></div><div class="money-line"><span>Prix affiché</span><b>${euro(item.asking)}</b></div><div class="money-line"><span>Recette</span><b>${euro(vintedRevenue(item))}</b></div><div class="money-line"><span>Résultat</span><b>${euro(result)}</b></div>
      <div class="form-grid compact"><label>Montant<input id="vinted-amount-${item.id}" type="number" min="0" step="0.01"></label><label>Opération<select id="vinted-type-${item.id}"><option value="boost">Boost</option><option value="packaging">Emballage</option><option value="fee">Frais</option><option value="sale">Vente</option></select></label></div>
      <div class="row">${button('Ajouter opération', 'vinted-transaction', 'primary', `data-id="${item.id}"`)}${button('Archiver', 'vinted-archive', 'ghost', `data-id="${item.id}"`)}</div>
    </article>`;
  }).join('') || '<div class="empty">Aucun article Vinted.</div>';

  const recent = state.money.transactions.slice(-12).reverse().map(transaction => `<div class="history-row"><div><b>${escapeHtml(transaction.date || '')} · ${escapeHtml(transaction.category || transaction.type || '')}</b><div class="muted">${escapeHtml(transaction.note || '')}</div></div><strong>${transaction.type === 'income' ? '+' : '-'}${euro(transaction.amount)}</strong></div>`).join('') || '<div class="empty">Aucune transaction.</div>';

  return `
    <section class="hero ${forecast < 0 ? 'danger' : ''}"><div><div class="eyebrow">ARGENT · PRÉVISION RÉELLE</div><h2>${euro(forecast)} à 30 jours</h2><p>Budget prévu, transactions réelles et Vinted sont séparés.</p></div><div class="hero-score">€</div></section>
    <div class="metrics">${metric('Revenu réglé', euro(state.money.settings.income), 'base mensuelle')}${metric('Charges fixes', euro(recurringTotal), `${state.money.recurring.length} lignes`, recurringTotal > state.money.settings.income * 0.75 ? 'warn' : '')}${metric('Dépenses réelles', euro(totals.expenses), 'mois courant')}${metric('Épargne réelle', euro(totals.savings), `cible ${euro(state.money.settings.savingsTarget)}`)}</div>
    ${card('Paramètres', `<div class="form-grid"><label>Revenu mensuel<input id="money-income" type="number" step="0.01" value="${state.money.settings.income}"></label><label>Solde de départ<input id="money-balance" type="number" step="0.01" value="${state.money.settings.openingBalance}"></label><label>Cible épargne<input id="money-saving" type="number" step="0.01" value="${state.money.settings.savingsTarget}"></label><label>Fonds urgence cible<input id="money-emergency" type="number" step="0.01" value="${state.money.settings.emergencyTarget}"></label></div><div class="row">${button('Sauver les paramètres', 'save-money-settings', 'primary')}</div>`, 'span-12')}
    ${card('Ajouter transaction', `<div class="form-grid"><label>Date<input id="tx-date" type="date" value="${Store.localDate()}"></label><label>Type<select id="tx-type"><option value="expense">Dépense</option><option value="income">Revenu</option><option value="saving">Épargne</option></select></label><label>Catégorie<input id="tx-category" type="text" placeholder="Courses, carburant, salaire..."></label><label>Montant<input id="tx-amount" type="number" min="0" step="0.01"></label></div><label>Note<input id="tx-note" type="text"></label><div class="row">${button('Ajouter', 'add-transaction', 'primary')}</div>`, 'span-12')}
    ${card('Ajouter article Vinted', `<div class="form-grid"><label>Article<input id="vin-name" type="text"></label><label>Marque<input id="vin-brand" type="text"></label><label>Achat<input id="vin-buy" type="number" min="0" step="0.01"></label><label>Livraison<input id="vin-shipping" type="number" min="0" step="0.01"></label><label>Prix annonce<input id="vin-asking" type="number" min="0" step="0.01"></label><label>Date annonce<input id="vin-date" type="date" value="${Store.localDate()}"></label></div><div class="row">${button('Ajouter l’article', 'add-vinted', 'primary')}</div>`, 'span-12')}
    ${card('Stock Vinted', `<div class="vinted-grid">${vintedCards}</div>`, 'span-12')}
    ${card('Transactions récentes', recent, 'span-12')}
  `;
}

function renderSystem(state) {
  const report = Store.storageReport();
  return `
    <section class="hero ok"><div><div class="eyebrow">SYSTÈME · DONNÉES PROTÉGÉES</div><h2>V6 ${escapeHtml(report.version)}</h2><p>Migration non destructive. Les données V5 restent intactes tant que la V6 n’est pas validée.</p></div><div class="hero-score">${report.schema}</div></section>
    <div class="metrics">${metric('État V6', `${Math.round(report.stateBytes / 1024)} KB`, 'base unifiée')}${metric('Backups', String(report.backups), `${Math.round(report.backupBytes / 1024)} KB`)}${metric('Clés V5', String(report.legacyKeys), report.legacyImportedAt ? 'import effectué' : 'non importé')}${metric('Version', report.version, `schéma ${report.schema}`)}</div>
    ${card('Sauvegarde', `<div class="row">${button('Créer backup local', 'backup', 'primary')}${button('Exporter JSON', 'export')}${button('Importer JSON', 'show-import')}</div><div id="import-zone" class="hidden"><textarea id="import-data" rows="10" placeholder="Colle ici un export V6"></textarea>${button('Importer maintenant', 'import', 'primary')}</div><p class="notice">Les backups locaux sont limités aux trois derniers et ne contiennent jamais d’autres backups.</p>`, 'span-12')}
    ${card('Migration', `<div class="audit-grid"><div><span>Import V5</span><b>${report.legacyImportedAt ? 'TERMINÉ' : 'AUCUNE DONNÉE'}</b></div><div><span>Anciennes clés supprimées</span><b>NON</b></div><div><span>Sport converti sans effacement</span><b>OUI</b></div><div><span>Vinted boosts dédupliqués</span><b>OUI</b></div></div><p class="notice">La suppression définitive de l’ancien système reste volontairement bloquée jusqu’à validation manuelle de la migration et export externe.</p>`, 'span-12')}
    ${card('Focus trimestre', `<div class="form-grid"><label>Axe 1<input id="focus-1" value="${escapeHtml(state.focus.primary[0] || '')}"></label><label>Axe 2<input id="focus-2" value="${escapeHtml(state.focus.primary[1] || '')}"></label><label>Axe 3<input id="focus-3" value="${escapeHtml(state.focus.primary[2] || '')}"></label></div><label>Parking<input id="focus-parking" value="${escapeHtml((state.focus.parking || []).join(', '))}"></label><div class="row">${button('Sauver le focus', 'save-focus', 'primary')}</div>`, 'span-12')}
    ${card('Zone dangereuse', `<p>Réinitialise uniquement la V6. Les clés V5 ne sont pas touchées.</p><div class="row">${button('Réinitialiser V6', 'reset-v6', 'danger')}</div>`, 'span-12 danger')}
  `;
}

function readValue(id) {
  return document.querySelector(`#${CSS.escape(id)}`)?.value ?? '';
}

function completeOrder(id) {
  Store.update(state => {
    const day = ensureDay(state);
    day.completed = Array.from(new Set([...(day.completed || []), id]));
    day.blocked = (day.blocked || []).filter(row => row.id !== id);
  });
  toast('Action enregistrée');
  render();
}

function parseExerciseRows() {
  const exercises = {};
  document.querySelectorAll('[data-exercise]').forEach(row => {
    const id = row.dataset.exercise;
    const values = [...row.querySelectorAll('input')].map(input => input.value);
    exercises[id] ||= { sets: [] };
    exercises[id].sets.push({ reps: Number(values[0] || 0), kg: Number(values[1] || 0), rir: Number(values[2] || 0), pain: Number(values[3] || 0) });
  });
  return exercises;
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'navigate') return setRoute(target.dataset.route);
  if (action === 'complete-order') return completeOrder(target.dataset.id);
  if (action === 'block-order') {
    Store.update(state => {
      const day = ensureDay(state);
      const exists = (day.blocked || []).some(row => row.id === target.dataset.id);
      day.blocked = exists ? day.blocked.filter(row => row.id !== target.dataset.id) : [...(day.blocked || []), { id: target.dataset.id, date: Store.localDate() }];
    });
    toast('Blocage mis à jour');
    return render();
  }
  if (action === 'save-day') {
    Store.update(state => {
      const day = ensureDay(state);
      day.mode = readValue('day-mode');
      day.energy = Number(readValue('day-energy') || 3);
      day.pain = Number(readValue('day-pain') || 0);
      day.availableMin = Number(readValue('day-minutes') || 60);
      day.note = readValue('day-note');
    });
    toast(`Mode ${effectiveDayMode(Store.load())}`);
    return render();
  }
  if (action === 'add-water' || action === 'add-protein') {
    const amount = Number(target.dataset.amount || 0);
    Store.update(state => {
      const day = ensureDay(state);
      if (action === 'add-water') day.waterMl = Math.max(0, Number(day.waterMl || 0) + amount);
      else day.proteinG = Math.max(0, Number(day.proteinG || 0) + amount);
      state.nutrition.entries.push({ id: uid('nutrition'), date: Store.localDate(), kind: action === 'add-water' ? 'water' : 'protein', amount });
    });
    toast(action === 'add-water' ? 'Eau enregistrée' : 'Protéines enregistrées');
    return render();
  }
  if (action === 'complete-meal') {
    const plan = MEAL_PLAN[new Date().getDay()] || MEAL_PLAN[1];
    const meal = plan.meals.find(item => item.id === target.dataset.meal);
    if (!meal) return;
    Store.update(state => {
      const day = ensureDay(state);
      if (state.nutrition.entries.some(entry => entry.date === Store.localDate() && entry.mealId === meal.id)) return;
      state.nutrition.entries.push({ id: uid('meal'), date: Store.localDate(), kind: 'meal', mealId: meal.id, title: meal.title, calories: meal.calories, protein: meal.protein, fiber: meal.fiber });
      day.proteinG = Number(day.proteinG || 0) + meal.protein;
    });
    toast('Repas enregistré');
    return render();
  }
  if (action === 'save-profile') {
    Store.update(state => {
      state.profile.weightKg = Number(readValue('profile-weight') || state.profile.weightKg);
      state.profile.proteinPerKg = Number(readValue('profile-protein') || state.profile.proteinPerKg);
      state.profile.waterMl = Number(readValue('profile-water') || state.profile.waterMl);
      state.profile.mealsPerDay = Number(readValue('profile-meals') || state.profile.mealsPerDay);
    });
    toast('Profil mis à jour');
    return render();
  }
  if (action === 'save-sport') {
    const state = Store.load();
    const workout = nextWorkout(state);
    const pain = Number(readValue('sport-pain') || 0);
    const requested = target.dataset.status;
    const status = pain >= 7 ? 'pain_stop' : requested === 'completed' && pain >= 4 ? 'deload' : requested;
    Store.update(draft => {
      draft.sport.sessions.push({ id: uid('sport'), date: Store.localDate(), type: workout.name, status, pain, energy: Number(readValue('sport-energy') || 3), durationMin: Number(readValue('sport-duration') || 0), notes: readValue('sport-notes'), exercises: parseExerciseRows() });
      if (['completed', 'deload'].includes(status)) {
        const day = ensureDay(draft);
        day.completed = Array.from(new Set([...(day.completed || []), 'sport']));
      }
    });
    toast(status === 'pain_stop' ? 'Arrêt douleur enregistré' : 'Séance enregistrée');
    return render();
  }
  if (action === 'study-track') {
    Store.update(state => { state.study.activeTrack = target.dataset.track; });
    return render();
  }
  if (action === 'save-study') {
    const proof = readValue('study-proof').trim();
    if (!proof) return toast('Preuve réelle obligatoire');
    Store.update(state => {
      const trackId = state.study.activeTrack || 'epfc';
      const active = activeStudyResource(state, trackId);
      state.study.sessions.push({ id: uid('study'), date: Store.localDate(), track: trackId, title: active.resource[0], resource: active.resource[1], kind: readValue('study-kind'), minutes: Number(readValue('study-minutes') || 0), proof });
      const error = readValue('study-error').trim();
      if (error) state.study.reviews.push({ id: uid('review'), error, fix: readValue('study-fix'), nextReview: Store.localDate(), status: 'open', reviewCount: 0 });
      if (target.dataset.finish === 'true') {
        state.study.tracks[trackId] ||= {};
        state.study.tracks[trackId].index = Math.min(active.index + 1, active.track.resources.length - 1);
      }
      const day = ensureDay(state);
      day.completed = Array.from(new Set([...(day.completed || []), 'study']));
    });
    toast('Session et preuve enregistrées');
    return render();
  }
  if (action === 'review-done') {
    Store.update(state => {
      const review = state.study.reviews.find(item => item.id === target.dataset.id);
      if (!review) return;
      const success = target.dataset.result === 'success';
      review.reviewCount = Number(review.reviewCount || 0) + 1;
      const delay = success ? Math.min(30, [1, 3, 7, 14, 30][Math.min(review.reviewCount, 4)]) : 1;
      const date = new Date();
      date.setDate(date.getDate() + delay);
      review.nextReview = Store.localDate(date);
      review.status = success && review.reviewCount >= 4 ? 'closed' : 'open';
    });
    toast('Révision planifiée');
    return render();
  }
  if (action === 'save-money-settings') {
    Store.update(state => {
      state.money.settings.income = Number(readValue('money-income') || 0);
      state.money.settings.openingBalance = Number(readValue('money-balance') || 0);
      state.money.settings.savingsTarget = Number(readValue('money-saving') || 0);
      state.money.settings.emergencyTarget = Number(readValue('money-emergency') || 0);
    });
    toast('Paramètres enregistrés');
    return render();
  }
  if (action === 'add-transaction') {
    const amount = Number(readValue('tx-amount') || 0);
    if (amount <= 0) return toast('Montant invalide');
    Store.update(state => state.money.transactions.push({ id: uid('tx'), date: readValue('tx-date') || Store.localDate(), type: readValue('tx-type'), category: readValue('tx-category') || 'Autre', amount, note: readValue('tx-note') }));
    toast('Transaction ajoutée');
    return render();
  }
  if (action === 'add-vinted') {
    const name = readValue('vin-name').trim();
    if (!name) return toast('Nom de l’article obligatoire');
    Store.update(state => {
      const transactions = [];
      const buy = Number(readValue('vin-buy') || 0);
      const shipping = Number(readValue('vin-shipping') || 0);
      if (buy > 0) transactions.push({ id: uid('cost'), type: 'purchase', amount: buy, date: readValue('vin-date') || Store.localDate() });
      if (shipping > 0) transactions.push({ id: uid('cost'), type: 'shipping', amount: shipping, date: readValue('vin-date') || Store.localDate() });
      state.money.vinted.push({ id: uid('vinted'), name, brand: readValue('vin-brand'), listedAt: readValue('vin-date') || Store.localDate(), asking: Number(readValue('vin-asking') || 0), status: 'listed', transactions, priceHistory: [] });
    });
    toast('Article ajouté');
    return render();
  }
  if (action === 'vinted-transaction') {
    const id = target.dataset.id;
    const amount = Number(readValue(`vinted-amount-${id}`) || 0);
    const type = readValue(`vinted-type-${id}`);
    if (amount <= 0) return toast('Montant invalide');
    Store.update(state => {
      const item = state.money.vinted.find(row => row.id === id);
      if (!item) return;
      item.transactions.push({ id: uid(type), type, amount, date: Store.localDate() });
      if (type === 'sale') item.status = 'sold';
    });
    toast('Opération Vinted ajoutée une seule fois');
    return render();
  }
  if (action === 'vinted-archive') {
    Store.update(state => {
      const item = state.money.vinted.find(row => row.id === target.dataset.id);
      if (item) item.status = 'abandoned';
    });
    toast('Article archivé');
    return render();
  }
  if (action === 'backup') {
    Store.createBackup('manual');
    toast('Backup local créé');
    return render();
  }
  if (action === 'export') {
    const blob = new Blob([Store.exportData()], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ultimate-dashboard-v6-${Store.localDate()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    return;
  }
  if (action === 'show-import') {
    document.querySelector('#import-zone')?.classList.toggle('hidden');
    return;
  }
  if (action === 'import') {
    try {
      Store.importData(readValue('import-data'));
      toast('Import V6 terminé');
      return render();
    } catch (error) {
      return toast(error.message || 'Import invalide');
    }
  }
  if (action === 'save-focus') {
    Store.update(state => {
      state.focus.primary = [readValue('focus-1'), readValue('focus-2'), readValue('focus-3')].map(value => value.trim()).filter(Boolean).slice(0, 3);
      state.focus.parking = readValue('focus-parking').split(',').map(value => value.trim()).filter(Boolean);
    });
    toast('Focus sauvegardé');
    return render();
  }
  if (action === 'reset-v6') {
    if (prompt('Écris RESET V6 pour confirmer') !== 'RESET V6') return toast('Annulé');
    Store.resetV6();
    toast('V6 réinitialisée, V5 intacte');
    return render();
  }
});

Store.subscribe(() => {});
setInterval(() => {
  if (clock) clock.textContent = new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
}, 1000);
render();
