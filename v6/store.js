export const APP_VERSION = '6.1.0-godmode';
export const SCHEMA_VERSION = 2;

const STATE_KEY = 'ud6_state';
const BACKUP_KEY = 'ud6_backups';
const LEGACY_PREFIX = 'ud5_';
const REMOVED_DOMAIN_PATTERN = /vinted/i;
const listeners = new Set();

const now = () => new Date().toISOString();
export const localDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const uid = (prefix = 'id') => `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;

function parse(raw, fallback) {
  try { return raw == null ? fallback : JSON.parse(raw); } catch { return fallback; }
}
function legacy(key, fallback = null) { return parse(localStorage.getItem(`${LEGACY_PREFIX}${key}`), fallback); }

function baseState() {
  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      createdAt: now(),
      updatedAt: now(),
      legacyImportedAt: '',
      legacyKeysFound: 0,
      removedDomainsAt: '',
      deviceId: globalThis.crypto?.randomUUID?.() || String(Date.now())
    },
    profile: {
      weightKg: 82,
      heightCm: 168,
      goal: 'athlete',
      proteinPerKg: 1.8,
      waterMl: 2500,
      mealsPerDay: 4,
      weeklyFoodBudget: 90,
      equipment: ['haltères', 'machines', 'poulies', 'vélo ou rameur'],
      trainingDays: 6
    },
    focus: {
      primary: ['Santé et athlétisme', 'Trading discipliné', 'Études informatique'],
      parking: ['Projets secondaires']
    },
    days: {},
    nutrition: { entries: [], weightHistory: [], templates: {}, pantry: [] },
    sport: {
      sessions: [],
      draft: {},
      benchmarks: {},
      weeklyTarget: 6,
      restrictions: [
        'Douleur cervicale : nuque neutre, pas de charge directe sur le cou',
        'Stop si faiblesse, engourdissement progressif ou douleur irradiée',
        'Toute reprise intense doit rester compatible avec l’avis médical'
      ]
    },
    trading: {
      planId: 'flex50',
      customPlan: {},
      curriculumIndex: 0,
      sessions: [],
      trades: [],
      mockChallenges: 0,
      setup: {
        market: 'MNQ',
        session: 'New York AM',
        platform: 'TradingView + plateforme d’exécution',
        name: '',
        rules: ''
      },
      risk: {
        riskPerTrade: 100,
        dailyStop: 250,
        maxTrades: 3,
        maxConsecutiveLosses: 2,
        stopAfterTarget: true
      }
    },
    study: { activeTrack: 'epfc', tracks: {}, sessions: [], reviews: [], library: [] },
    reading: { activeShelf: 'core', shelves: {}, sessions: [], notes: [] },
    money: {
      settings: { income: 1800, openingBalance: 0, emergencyTarget: 5400, savingsTarget: 200 },
      recurring: [],
      transactions: []
    },
    ui: { route: 'today', compact: false }
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
    type: session.type || 'Séance importée',
    status: session.status || 'completed',
    pain: Number(session.globalPain ?? session.globalPainLevel ?? session.pain ?? 0),
    energy: Number(session.energy ?? 3),
    rpe: Number(session.rpe ?? 0),
    durationMin: Number(session.durationMin ?? 0),
    notes: session.notes || '',
    qualities: Array.isArray(session.qualities) ? session.qualities : ['strength'],
    exercises: session.exercises || {},
    imported: true
  };
}

function removeDeletedDomainData(value) {
  if (!value || typeof value !== 'object') return value;
  const clone = structuredClone(value);
  if (clone.money && typeof clone.money === 'object') {
    for (const key of Object.keys(clone.money)) {
      if (REMOVED_DOMAIN_PATTERN.test(key)) delete clone.money[key];
    }
  }
  return clone;
}

function purgeDeletedDomainStorage() {
  const keys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || '';
    if (REMOVED_DOMAIN_PATTERN.test(key)) keys.push(key);
  }
  keys.forEach(key => localStorage.removeItem(key));

  const backups = parse(localStorage.getItem(BACKUP_KEY), []);
  if (Array.isArray(backups) && backups.length) {
    const clean = backups.map(item => ({ ...item, state: removeDeletedDomainData(item.state) }));
    localStorage.setItem(BACKUP_KEY, JSON.stringify(clean.slice(-3)));
  }
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
      rent: 'Loyer', energy: 'Énergie', internet: 'Internet', phone: 'Téléphone',
      gym: 'Sport', insurance: 'Assurance', contribution: 'Contribution alimentaire', other: 'Autres charges'
    };
    Object.entries(labels).forEach(([key, label]) => {
      const amount = Number(finance[key] || 0);
      if (amount > 0) next.money.recurring.push({ id: uid('rec'), label, amount, type: 'expense', day: 1, source: 'legacy' });
    });
  }

  legacy('savings_history', []).forEach(item => next.money.transactions.push({
    id: item.id || uid('tx'),
    date: item.date || `${item.month || localDate().slice(0, 7)}-01`,
    type: 'saving',
    category: 'Épargne',
    amount: Number(item.amount || 0),
    note: item.note || '',
    source: 'legacy'
  }));

  const sport = parse(localStorage.getItem('ud5_sport_clean_v1'), {});
  next.sport.sessions = (sport.sessions || []).map(normalizeSession);

  next.study.tracks = legacy('track_state', {});
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
      availableMin: 60,
      energy: 3,
      pain: 0,
      mode: 'auto'
    };
  }
  return next;
}

function sanitize(state) {
  const fallback = baseState();
  const source = removeDeletedDomainData(state || {});
  const cleanMoney = source.money || {};
  return {
    ...fallback,
    ...source,
    meta: { ...fallback.meta, ...(source.meta || {}), schemaVersion: SCHEMA_VERSION, appVersion: APP_VERSION },
    profile: { ...fallback.profile, ...(source.profile || {}) },
    focus: { ...fallback.focus, ...(source.focus || {}) },
    nutrition: { ...fallback.nutrition, ...(source.nutrition || {}) },
    sport: { ...fallback.sport, ...(source.sport || {}) },
    trading: {
      ...fallback.trading,
      ...(source.trading || {}),
      setup: { ...fallback.trading.setup, ...(source.trading?.setup || {}) },
      risk: { ...fallback.trading.risk, ...(source.trading?.risk || {}) }
    },
    study: { ...fallback.study, ...(source.study || {}) },
    reading: { ...fallback.reading, ...(source.reading || {}) },
    money: {
      ...fallback.money,
      ...cleanMoney,
      settings: { ...fallback.money.settings, ...(cleanMoney.settings || {}) },
      recurring: Array.isArray(cleanMoney.recurring) ? cleanMoney.recurring : [],
      transactions: Array.isArray(cleanMoney.transactions) ? cleanMoney.transactions : []
    },
    ui: { ...fallback.ui, ...(source.ui || {}) },
    days: source.days && typeof source.days === 'object' ? source.days : {}
  };
}

function persist(state, emit = true) {
  const clean = sanitize(state);
  clean.meta.updatedAt = now();
  if (!clean.meta.removedDomainsAt) clean.meta.removedDomainsAt = now();
  localStorage.setItem(STATE_KEY, JSON.stringify(clean));
  if (emit) listeners.forEach(listener => listener(clean));
  return clean;
}

export function load() {
  purgeDeletedDomainStorage();
  let state = sanitize(parse(localStorage.getItem(STATE_KEY), baseState()));
  state = importLegacy(state);
  return persist(state, false);
}

export function update(mutator) {
  const draft = structuredClone(load());
  return persist(mutator(draft) || draft);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function day(state = load(), date = localDate()) {
  if (!state.days[date]) {
    state.days[date] = { energy: 3, pain: 0, availableMin: 60, waterMl: 0, proteinG: 0, completed: [], blocked: [], note: '', mode: 'auto' };
  }
  return state.days[date];
}

export function createBackup(reason = 'manual') {
  const state = sanitize(load());
  const backups = parse(localStorage.getItem(BACKUP_KEY), []);
  backups.push({ id: uid('backup'), createdAt: now(), reason, state });
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(-3)));
  return backups.at(-1);
}

export function exportData() {
  return JSON.stringify({ format: 'ultimate-dashboard-v6', exportedAt: now(), state: sanitize(load()) }, null, 2);
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
  purgeDeletedDomainStorage();
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
