export const APP_VERSION = '6.0.0-alpha.1';
export const SCHEMA_VERSION = 1;

const STATE_KEY = 'ud6_state';
const BACKUP_KEY = 'ud6_backups';
const LEGACY_PREFIX = 'ud5_';
const listeners = new Set();

const now = () => new Date().toISOString();
export const localDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const uid = (prefix = 'id') =>
  `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;

function parse(raw, fallback) {
  try {
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function legacy(key, fallback = null) {
  return parse(localStorage.getItem(`${LEGACY_PREFIX}${key}`), fallback);
}

function baseState() {
  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      createdAt: now(),
      updatedAt: now(),
      legacyImportedAt: '',
      legacyKeysFound: 0,
      deviceId: globalThis.crypto?.randomUUID?.() || String(Date.now())
    },
    profile: {
      weightKg: 82,
      heightCm: 168,
      goal: 'recomposition',
      proteinPerKg: 1.8,
      waterMl: 2500,
      mealsPerDay: 4,
      weeklyFoodBudget: 90,
      equipment: ['haltères', 'machines', 'poulies'],
      trainingDays: 4
    },
    focus: {
      primary: ['Santé et énergie', 'Études informatique', 'Argent'],
      parking: ['Échecs', 'Lecture avancée', 'IoT avancé']
    },
    days: {},
    nutrition: {
      entries: [],
      weightHistory: [],
      templates: {},
      pantry: []
    },
    sport: {
      cycleIndex: 0,
      sessions: [],
      draft: {},
      restrictions: ['Adapter selon douleur cervicale et avis médical']
    },
    study: {
      activeTrack: 'epfc',
      tracks: {},
      sessions: [],
      reviews: [],
      library: []
    },
    money: {
      settings: {
        income: 1800,
        openingBalance: 0,
        emergencyTarget: 5400,
        savingsTarget: 200
      },
      recurring: [],
      transactions: [],
      vinted: []
    },
    ui: {
      route: 'today',
      compact: true
    }
  };
}

function countLegacyKeys() {
  let count = 0;
  for (let index = 0; index < localStorage.length; index += 1) {
    if (localStorage.key(index)?.startsWith(LEGACY_PREFIX)) count += 1;
  }
  return count;
}

function normalizeSession(session = {}) {
  return {
    id: session.id || uid('sport'),
    date: session.date || localDate(),
    type: session.type || 'Séance',
    status: session.status || 'completed',
    pain: Number(session.globalPain ?? session.globalPainLevel ?? 0),
    energy: Number(session.energy ?? 3),
    durationMin: Number(session.durationMin ?? 0),
    notes: session.notes || '',
    exercises: session.exercises || {},
    imported: true
  };
}

function normalizeVinted(item = {}) {
  const transactions = [];
  if (Number(item.buy) > 0) transactions.push({ id: uid('cost'), type: 'purchase', amount: Number(item.buy), date: item.listedAt || localDate() });
  if (Number(item.shipping) > 0) transactions.push({ id: uid('cost'), type: 'shipping', amount: Number(item.shipping), date: item.listedAt || localDate() });
  const legacyBoosts = Array.isArray(item.boosts) && item.boosts.length
    ? item.boosts
    : Number(item.boost) > 0
      ? [{ amount: Number(item.boost), date: item.listedAt || localDate() }]
      : [];
  legacyBoosts.forEach(boost => transactions.push({ id: uid('cost'), type: 'boost', amount: Number(boost.amount || 0), date: boost.date || localDate() }));
  if (item.status === 'sold' && Number(item.sold) > 0) transactions.push({ id: uid('sale'), type: 'sale', amount: Number(item.sold), date: item.soldAt || localDate() });
  return {
    id: item.id || uid('vinted'),
    name: item.name || 'Article',
    brand: item.brand || '',
    category: item.category || '',
    condition: item.condition || 'bon',
    listedAt: item.listedAt || localDate(),
    asking: Number(item.asking || 0),
    floor: Number(item.floor || 0),
    targetRoi: Number(item.targetRoi || 50),
    status: item.status || 'listed',
    transactions,
    priceHistory: Array.isArray(item.priceDrops) ? item.priceDrops : [],
    imported: true
  };
}

function importLegacy(state) {
  const legacyCount = countLegacyKeys();
  if (!legacyCount || state.meta.legacyImportedAt) return state;

  const next = structuredClone(state);
  next.meta.legacyImportedAt = now();
  next.meta.legacyKeysFound = legacyCount;

  const focus = legacy('focus_quarter', null);
  if (focus?.primary) next.focus = { primary: focus.primary.slice(0, 3), parking: focus.parking || [] };

  const finance = legacy('finance_month', null);
  if (finance) {
    next.money.settings.income = Number(finance.income || next.money.settings.income);
    const labels = {
      rent: 'Loyer', energy: 'Énergie', internet: 'Internet', phone: 'Téléphone', gym: 'Sport', insurance: 'Assurance', contribution: 'Contribution alimentaire', other: 'Autres charges'
    };
    Object.entries(labels).forEach(([key, label]) => {
      const amount = Number(finance[key] || 0);
      if (amount > 0) next.money.recurring.push({ id: uid('rec'), label, amount, type: 'expense', day: 1, source: 'legacy' });
    });
  }

  const savings = legacy('savings_history', []);
  savings.forEach(item => next.money.transactions.push({
    id: item.id || uid('tx'),
    date: item.date || `${item.month || localDate().slice(0, 7)}-01`,
    type: 'saving',
    category: 'Épargne',
    amount: Number(item.amount || 0),
    note: item.note || '',
    source: 'legacy'
  }));

  const vinted = legacy('vinted_items', []);
  next.money.vinted = vinted.map(normalizeVinted);

  const sport = parse(localStorage.getItem('ud5_sport_clean_v1'), {});
  next.sport.sessions = (sport.sessions || []).map(normalizeSession);
  next.sport.cycleIndex = Math.max(0, ['Push A', 'Pull A', 'Legs A', 'Rest A', 'Push B', 'Pull B', 'Legs B', 'Rest B'].indexOf(sport.anchorType));

  const trackState = legacy('track_state', {});
  next.study.tracks = trackState;
  next.study.sessions = legacy('study_activity', []).map(item => ({ ...item, id: item.id || uid('study'), imported: true }));
  next.study.reviews = legacy('error_bank', []).map(item => ({ ...item, id: item.id || uid('review'), imported: true }));
  next.study.library = legacy('study_materials', []).map(item => ({ ...item, id: item.id || uid('book'), imported: true }));

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || '';
    if (!key.startsWith('ud5_fuel_')) continue;
    const date = key.replace('ud5_fuel_', '');
    const fuel = parse(localStorage.getItem(key), { water: 0, protein: 0 });
    next.days[date] = {
      ...(next.days[date] || {}),
      waterMl: Number(fuel.water || 0),
      proteinG: Number(fuel.protein || 0),
      completed: [],
      blocked: [],
      note: '',
      energy: 3,
      pain: 0
    };
  }

  return next;
}

function sanitize(state) {
  const fallback = baseState();
  return {
    ...fallback,
    ...state,
    meta: { ...fallback.meta, ...(state?.meta || {}), schemaVersion: SCHEMA_VERSION, appVersion: APP_VERSION },
    profile: { ...fallback.profile, ...(state?.profile || {}) },
    focus: { ...fallback.focus, ...(state?.focus || {}) },
    nutrition: { ...fallback.nutrition, ...(state?.nutrition || {}) },
    sport: { ...fallback.sport, ...(state?.sport || {}) },
    study: { ...fallback.study, ...(state?.study || {}) },
    money: { ...fallback.money, ...(state?.money || {}), settings: { ...fallback.money.settings, ...(state?.money?.settings || {}) } },
    ui: { ...fallback.ui, ...(state?.ui || {}) },
    days: state?.days && typeof state.days === 'object' ? state.days : {}
  };
}

function persist(state, emit = true) {
  const clean = sanitize(state);
  clean.meta.updatedAt = now();
  localStorage.setItem(STATE_KEY, JSON.stringify(clean));
  if (emit) listeners.forEach(listener => listener(clean));
  return clean;
}

export function load() {
  let state = sanitize(parse(localStorage.getItem(STATE_KEY), baseState()));
  state = importLegacy(state);
  return persist(state, false);
}

export function update(mutator) {
  const state = load();
  const draft = structuredClone(state);
  const result = mutator(draft) || draft;
  return persist(result);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function day(state = load(), date = localDate()) {
  if (!state.days[date]) {
    state.days[date] = { energy: 3, pain: 0, availableMin: 60, waterMl: 0, proteinG: 0, completed: [], blocked: [], note: '' };
  }
  return state.days[date];
}

export function addEvent(domain, payload = {}) {
  return update(state => {
    const current = day(state);
    const event = { id: uid(domain), date: localDate(), createdAt: now(), domain, ...payload };
    if (domain === 'nutrition') state.nutrition.entries.push(event);
    if (domain === 'sport') state.sport.sessions.push(event);
    if (domain === 'study') state.study.sessions.push(event);
    if (domain === 'money') state.money.transactions.push(event);
    current.completed = Array.from(new Set([...(current.completed || []), payload.actionId || domain]));
  });
}

export function createBackup(reason = 'manual') {
  const state = load();
  const backups = parse(localStorage.getItem(BACKUP_KEY), []);
  backups.push({ id: uid('backup'), createdAt: now(), reason, state });
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(-3)));
  return backups.at(-1);
}

export function exportData() {
  const state = load();
  return JSON.stringify({ format: 'ultimate-dashboard-v6', exportedAt: now(), state }, null, 2);
}

export function importData(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!parsed?.state || parsed.format !== 'ultimate-dashboard-v6') throw new Error('Format V6 invalide');
  createBackup('before_import');
  return persist(parsed.state);
}

export function resetV6() {
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(BACKUP_KEY);
  listeners.forEach(listener => listener(baseState()));
}

export function storageReport() {
  const stateRaw = localStorage.getItem(STATE_KEY) || '';
  const backupsRaw = localStorage.getItem(BACKUP_KEY) || '';
  const state = load();
  return {
    version: APP_VERSION,
    schema: SCHEMA_VERSION,
    stateBytes: stateRaw.length,
    backupBytes: backupsRaw.length,
    backups: parse(backupsRaw, []).length,
    legacyKeys: countLegacyKeys(),
    legacyImportedAt: state.meta.legacyImportedAt,
    updatedAt: state.meta.updatedAt
  };
}
