export const APP_VERSION = '6.2.0-autopilot';
export const SCHEMA_VERSION = 3;

const STATE_KEY = 'ud6_state';
const BACKUP_KEY = 'ud6_backups';
const UNDO_KEY = 'ud6_undo';
const LEGACY_PREFIX = 'ud5_';
const MAX_IMPORT_BYTES = 2_000_000;
const MAX_BACKUPS = 5;
const MAX_UNDO = 8;
const listeners = new Set();

let cache = null;

const now = () => new Date().toISOString();
const clone = value => structuredClone(value);
const uid = (prefix = 'id') =>
  `${prefix}_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`}`;

export const localDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
function storageRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}
function parse(raw, fallback) {
  try { return raw == null ? fallback : JSON.parse(raw); } catch { return fallback; }
}
function clamp(value, min, max, fallback = min) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}
function array(value, limit = 5000) {
  return Array.isArray(value) ? value.slice(-limit) : [];
}
function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function stripUnsafe(value, depth = 0) {
  if (depth > 12) return null;
  if (Array.isArray(value)) return value.slice(-5000).map(item => stripUnsafe(item, depth + 1));
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
    output[key] = stripUnsafe(item, depth + 1);
  }
  return output;
}
function hash(text) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, '0');
}
function defaultDay() {
  return {
    energy: 3,
    pain: 0,
    availableMin: 60,
    sleepHours: 7,
    sleepQuality: 3,
    steps: 0,
    restingHr: 0,
    waterMl: 0,
    proteinG: 0,
    calories: 0,
    fiberG: 0,
    completed: [],
    skipped: [],
    blocked: [],
    note: '',
    mode: 'auto'
  };
}

function baseState() {
  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      createdAt: now(),
      updatedAt: now(),
      revision: 0,
      legacyImportedAt: '',
      legacyKeysFound: 0,
      cleanupCompletedAt: '',
      deviceId: globalThis.crypto?.randomUUID?.() || String(Date.now())
    },
    profile: {
      weightKg: 82,
      heightCm: 168,
      goal: 'athlete',
      proteinPerKg: 1.8,
      waterMl: 2500,
      mealsPerDay: 4,
      sleepTargetHours: 7.5,
      stepsTarget: 7000,
      weeklyFoodBudget: 90,
      equipment: ['haltères', 'machines', 'poulies', 'vélo ou rameur'],
      trainingDays: 6
    },
    focus: {
      primary: ['Santé et athlétisme', 'Trading discipliné', 'Études informatique'],
      parking: ['Projets secondaires']
    },
    days: {},
    nutrition: {
      entries: [],
      weightHistory: [],
      templates: {},
      pantry: []
    },
    sport: {
      sessions: [],
      benchmarks: [],
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
      ruleSnapshot: {
        provider: 'MyFundedFutures',
        verifiedAt: '2026-08-03',
        stage: 'evaluation',
        note: 'Règles à revérifier avant chaque achat.'
      },
      curriculumIndex: 0,
      sessions: [],
      trades: [],
      mockChallenges: [],
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
      },
      preTrade: {
        context: false,
        setup: false,
        stop: false,
        size: false,
        news: false
      }
    },
    study: {
      activeTrack: 'epfc',
      tracks: {},
      sessions: [],
      reviews: [],
      library: []
    },
    reading: {
      activeShelf: 'core',
      shelves: {},
      sessions: [],
      notes: [],
      dailyMinutesTarget: 25
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
      budgets: {}
    },
    ui: {
      route: 'today',
      theme: 'graphite',
      density: 'comfortable',
      installDismissed: false
    }
  };
}

function legacy(key, fallback = null) {
  return parse(storageGet(`${LEGACY_PREFIX}${key}`), fallback);
}
function countLegacyKeys() {
  let count = 0;
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      if (localStorage.key(index)?.startsWith(LEGACY_PREFIX)) count += 1;
    }
  } catch {}
  return count;
}
function purgeRemovedDomainStorage() {
  const keys = [];
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || '';
      if (/vinted/i.test(key)) keys.push(key);
    }
  } catch {}
  keys.forEach(storageRemove);
}
function normalizeSportSession(session = {}) {
  return {
    id: session.id || uid('sport'),
    date: session.date || localDate(),
    createdAt: session.createdAt || now(),
    type: session.type || 'Séance importée',
    sessionId: session.sessionId || '',
    status: ['completed', 'deload', 'stopped', 'skipped'].includes(session.status) ? session.status : 'completed',
    pain: clamp(session.globalPain ?? session.globalPainLevel ?? session.pain, 0, 10, 0),
    energy: clamp(session.energy, 1, 5, 3),
    rpe: clamp(session.rpe, 0, 10, 0),
    durationMin: clamp(session.durationMin, 0, 300, 0),
    notes: String(session.notes || '').slice(0, 4000),
    qualities: array(session.qualities, 20),
    exercises: object(session.exercises),
    advancesCycle: session.advancesCycle !== false,
    imported: Boolean(session.imported)
  };
}
function normalizeTrade(trade = {}) {
  return {
    id: trade.id || uid('trade'),
    createdAt: trade.createdAt || now(),
    date: trade.date || localDate(),
    market: String(trade.market || '').slice(0, 30),
    setup: String(trade.setup || '').slice(0, 80),
    contracts: clamp(trade.contracts, 0, 1000, 0),
    risk: clamp(trade.risk, 0, 1_000_000, 0),
    pnl: clamp(trade.pnl, -10_000_000, 10_000_000, 0),
    breach: Boolean(trade.breach),
    violations: array(trade.violations, 30),
    note: String(trade.note || '').slice(0, 4000)
  };
}
function normalizeDay(value = {}) {
  const fallback = defaultDay();
  return {
    ...fallback,
    ...object(value),
    energy: clamp(value.energy, 1, 5, fallback.energy),
    pain: clamp(value.pain, 0, 10, 0),
    availableMin: clamp(value.availableMin, 5, 720, fallback.availableMin),
    sleepHours: clamp(value.sleepHours, 0, 16, fallback.sleepHours),
    sleepQuality: clamp(value.sleepQuality, 1, 5, fallback.sleepQuality),
    steps: clamp(value.steps, 0, 100_000, 0),
    restingHr: clamp(value.restingHr, 0, 250, 0),
    waterMl: clamp(value.waterMl, 0, 15_000, 0),
    proteinG: clamp(value.proteinG, 0, 1000, 0),
    calories: clamp(value.calories, 0, 20_000, 0),
    fiberG: clamp(value.fiberG, 0, 300, 0),
    completed: array(value.completed, 100),
    skipped: array(value.skipped, 100),
    blocked: array(value.blocked, 100),
    note: String(value.note || '').slice(0, 2000),
    mode: ['auto', 'normal', 'execution', 'fatigue', 'recovery'].includes(value.mode) ? value.mode : 'auto'
  };
}

function importLegacy(state) {
  const legacyCount = countLegacyKeys();
  if (!legacyCount || state.meta.legacyImportedAt) return { state, changed: false };

  const next = clone(state);
  next.meta.legacyImportedAt = now();
  next.meta.legacyKeysFound = legacyCount;

  const focus = legacy('focus_quarter', null);
  if (focus?.primary) next.focus = { primary: array(focus.primary, 3), parking: array(focus.parking, 30) };

  const finance = legacy('finance_month', null);
  if (finance) {
    next.money.settings.income = Number(finance.income || next.money.settings.income);
    const labels = {
      rent: 'Loyer', energy: 'Énergie', internet: 'Internet', phone: 'Téléphone',
      gym: 'Sport', insurance: 'Assurance voiture', contribution: 'Contribution alimentaire', other: 'Autres charges'
    };
    Object.entries(labels).forEach(([key, label]) => {
      const amount = Number(finance[key] || 0);
      if (amount > 0 && !next.money.recurring.some(item => item.label === label)) {
        next.money.recurring.push({ id: uid('rec'), label, amount, type: 'expense', day: 1, source: 'legacy' });
      }
    });
  }

  array(legacy('savings_history', [])).forEach(item => next.money.transactions.push({
    id: item.id || uid('tx'),
    date: item.date || `${item.month || localDate().slice(0, 7)}-01`,
    type: 'saving',
    category: 'Épargne',
    amount: Number(item.amount || 0),
    note: item.note || '',
    source: 'legacy'
  }));

  const sport = parse(storageGet('ud5_sport_clean_v1'), {});
  next.sport.sessions = array(sport.sessions).map(normalizeSportSession);

  next.study.tracks = object(legacy('track_state', {}));
  next.study.sessions = array(legacy('study_activity', [])).map(item => ({ ...item, id: item.id || uid('study'), imported: true }));
  next.study.reviews = array(legacy('error_bank', [])).map(item => ({ ...item, id: item.id || uid('review'), imported: true }));
  next.study.library = array(legacy('study_materials', [])).map(item => ({ ...item, id: item.id || uid('book'), imported: true }));

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || '';
      if (!key.startsWith('ud5_fuel_')) continue;
      const date = key.replace('ud5_fuel_', '');
      const fuel = parse(storageGet(key), { water: 0, protein: 0 });
      next.days[date] = normalizeDay({
        ...(next.days[date] || {}),
        waterMl: Number(fuel.water || 0),
        proteinG: Number(fuel.protein || 0)
      });
    }
  } catch {}

  return { state: next, changed: true };
}

function migrate(input) {
  let source = stripUnsafe(object(input));
  let changed = false;
  const schema = Number(source.meta?.schemaVersion || 1);

  if (schema < 3) {
    source = clone(source);
    const oldMocks = source.trading?.mockChallenges;
    if (typeof oldMocks === 'number') {
      source.trading = object(source.trading);
      source.trading.mockChallenges = Array.from({ length: Math.max(0, oldMocks) }, (_, index) => ({
        id: `legacy_mock_${index + 1}`,
        status: 'unverified',
        passed: false,
        legacy: true,
        createdAt: now()
      }));
    }
    source.meta = { ...object(source.meta), schemaVersion: 3 };
    changed = true;
  }

  return { state: source, changed };
}

function sanitize(input) {
  const fallback = baseState();
  const source = stripUnsafe(object(input));
  const days = {};
  for (const [date, value] of Object.entries(object(source.days))) days[date] = normalizeDay(value);

  const trading = object(source.trading);
  const money = object(source.money);
  const profile = object(source.profile);

  return {
    ...fallback,
    ...source,
    meta: {
      ...fallback.meta,
      ...object(source.meta),
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      revision: Math.max(0, Number(source.meta?.revision || 0))
    },
    profile: {
      ...fallback.profile,
      ...profile,
      weightKg: clamp(profile.weightKg, 35, 300, fallback.profile.weightKg),
      heightCm: clamp(profile.heightCm, 120, 230, fallback.profile.heightCm),
      proteinPerKg: clamp(profile.proteinPerKg, 1.2, 2.2, fallback.profile.proteinPerKg),
      waterMl: clamp(profile.waterMl, 1500, 6000, fallback.profile.waterMl),
      mealsPerDay: clamp(profile.mealsPerDay, 2, 7, fallback.profile.mealsPerDay),
      sleepTargetHours: clamp(profile.sleepTargetHours, 5, 10, fallback.profile.sleepTargetHours),
      stepsTarget: clamp(profile.stepsTarget, 1000, 30_000, fallback.profile.stepsTarget),
      equipment: array(profile.equipment, 30)
    },
    focus: {
      primary: array(source.focus?.primary, 5),
      parking: array(source.focus?.parking, 50)
    },
    days,
    nutrition: {
      ...fallback.nutrition,
      ...object(source.nutrition),
      entries: array(source.nutrition?.entries),
      weightHistory: array(source.nutrition?.weightHistory, 1000),
      templates: object(source.nutrition?.templates),
      pantry: array(source.nutrition?.pantry, 1000)
    },
    sport: {
      ...fallback.sport,
      ...object(source.sport),
      sessions: array(source.sport?.sessions).map(normalizeSportSession),
      benchmarks: array(source.sport?.benchmarks, 1000),
      restrictions: array(source.sport?.restrictions, 50)
    },
    trading: {
      ...fallback.trading,
      ...trading,
      customPlan: object(trading.customPlan),
      ruleSnapshot: { ...fallback.trading.ruleSnapshot, ...object(trading.ruleSnapshot) },
      sessions: array(trading.sessions),
      trades: array(trading.trades).map(normalizeTrade),
      mockChallenges: array(trading.mockChallenges, 100),
      setup: { ...fallback.trading.setup, ...object(trading.setup) },
      risk: { ...fallback.trading.risk, ...object(trading.risk) },
      preTrade: { ...fallback.trading.preTrade, ...object(trading.preTrade) }
    },
    study: {
      ...fallback.study,
      ...object(source.study),
      tracks: object(source.study?.tracks),
      sessions: array(source.study?.sessions),
      reviews: array(source.study?.reviews),
      library: array(source.study?.library)
    },
    reading: {
      ...fallback.reading,
      ...object(source.reading),
      shelves: object(source.reading?.shelves),
      sessions: array(source.reading?.sessions),
      notes: array(source.reading?.notes)
    },
    money: {
      ...fallback.money,
      ...money,
      settings: { ...fallback.money.settings, ...object(money.settings) },
      recurring: array(money.recurring, 1000),
      transactions: array(money.transactions),
      budgets: object(money.budgets)
    },
    ui: {
      ...fallback.ui,
      ...object(source.ui),
      theme: ['graphite', 'light', 'oled'].includes(source.ui?.theme) ? source.ui.theme : fallback.ui.theme,
      density: ['comfortable', 'compact'].includes(source.ui?.density) ? source.ui.density : fallback.ui.density
    }
  };
}

function writeState(state, emit = true, incrementRevision = true) {
  const clean = sanitize(state);
  clean.meta.updatedAt = now();
  if (incrementRevision) clean.meta.revision += 1;
  if (!storageSet(STATE_KEY, JSON.stringify(clean))) throw new Error('Stockage local saturé ou indisponible');
  cache = clean;
  if (emit) listeners.forEach(listener => listener(clone(clean)));
  return clone(clean);
}

function initialize() {
  if (cache) return;
  purgeRemovedDomainStorage();

  const raw = parse(storageGet(STATE_KEY), null);
  let state = raw || baseState();
  let changed = !raw;

  const migration = migrate(state);
  state = migration.state;
  changed ||= migration.changed;

  const imported = importLegacy(sanitize(state));
  state = imported.state;
  changed ||= imported.changed;

  state = sanitize(state);
  if (!state.meta.cleanupCompletedAt) {
    state.meta.cleanupCompletedAt = now();
    changed = true;
  }

  if (changed) writeState(state, false, false);
  else cache = state;
}

function pushSnapshot(key, limit, reason, state = cache) {
  const rows = array(parse(storageGet(key), []), limit);
  rows.push({ id: uid(key === BACKUP_KEY ? 'backup' : 'undo'), createdAt: now(), reason, state: sanitize(state) });
  storageSet(key, JSON.stringify(rows.slice(-limit)));
  return rows.at(-1);
}

export function load() {
  initialize();
  return clone(cache);
}

export function update(mutator, options = {}) {
  initialize();
  const previous = clone(cache);
  if (options.checkpoint) pushSnapshot(UNDO_KEY, MAX_UNDO, options.reason || 'update', previous);
  const draft = clone(previous);
  const result = mutator(draft) || draft;
  return writeState(result);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function day(state = load(), date = localDate()) {
  if (!state.days[date]) state.days[date] = defaultDay();
  else state.days[date] = normalizeDay(state.days[date]);
  return state.days[date];
}

export function createBackup(reason = 'manual') {
  initialize();
  return pushSnapshot(BACKUP_KEY, MAX_BACKUPS, reason);
}

export function listBackups() {
  return array(parse(storageGet(BACKUP_KEY), []), MAX_BACKUPS).map(item => ({
    id: item.id,
    createdAt: item.createdAt,
    reason: item.reason
  })).reverse();
}

export function restoreBackup(id) {
  initialize();
  const backups = array(parse(storageGet(BACKUP_KEY), []), MAX_BACKUPS);
  const backup = backups.find(item => item.id === id);
  if (!backup?.state) throw new Error('Backup introuvable');
  pushSnapshot(UNDO_KEY, MAX_UNDO, 'before_restore', cache);
  return writeState(backup.state);
}

export function deleteBackup(id) {
  const backups = array(parse(storageGet(BACKUP_KEY), []), MAX_BACKUPS).filter(item => item.id !== id);
  storageSet(BACKUP_KEY, JSON.stringify(backups));
  return listBackups();
}

export function undoLast() {
  initialize();
  const rows = array(parse(storageGet(UNDO_KEY), []), MAX_UNDO);
  const snapshot = rows.pop();
  if (!snapshot?.state) throw new Error('Aucune modification à annuler');
  storageSet(UNDO_KEY, JSON.stringify(rows));
  return writeState(snapshot.state);
}

export function removeRecord(collectionPath, id) {
  const [domain, collection] = String(collectionPath).split('.');
  const allowed = new Set([
    'sport.sessions', 'sport.benchmarks',
    'trading.sessions', 'trading.trades', 'trading.mockChallenges',
    'study.sessions', 'study.reviews',
    'reading.sessions',
    'nutrition.entries', 'nutrition.weightHistory',
    'money.transactions', 'money.recurring'
  ]);
  if (!allowed.has(collectionPath)) throw new Error('Collection non modifiable');
  return update(state => {
    const rows = array(state[domain][collection]);
    const removed = rows.find(item => item.id === id);
    state[domain][collection] = rows.filter(item => item.id !== id);
    if (collectionPath === 'nutrition.entries' && removed?.date && removed.kind === 'custom') {
      const dayState = state.days[removed.date];
      if (dayState) {
        dayState.calories = Math.max(0, Number(dayState.calories || 0) - Number(removed.calories || 0));
        dayState.proteinG = Math.max(0, Number(dayState.proteinG || 0) - Number(removed.protein || 0));
        dayState.fiberG = Math.max(0, Number(dayState.fiberG || 0) - Number(removed.fiber || 0));
      }
    }
  }, { checkpoint: true, reason: `delete_${collectionPath}` });
}

export function exportData() {
  const state = load();
  const payload = {
    format: 'ultimate-dashboard-v6',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now(),
    state
  };
  const body = JSON.stringify(payload);
  return JSON.stringify({ ...payload, checksum: hash(body) }, null, 2);
}

export function importData(raw) {
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
  if (text.length > MAX_IMPORT_BYTES) throw new Error('Import trop volumineux (2 Mo maximum)');
  const parsed = stripUnsafe(JSON.parse(text));
  if (!parsed?.state || parsed.format !== 'ultimate-dashboard-v6') throw new Error('Format V6 invalide');
  createBackup('before_import');
  pushSnapshot(UNDO_KEY, MAX_UNDO, 'before_import', load());
  return writeState(parsed.state);
}

export function resetV6() {
  initialize();
  createBackup('before_reset');
  const fresh = baseState();
  fresh.meta.legacyImportedAt = now();
  fresh.meta.legacyKeysFound = countLegacyKeys();
  storageRemove(UNDO_KEY);
  return writeState(fresh);
}

export function storageReport() {
  initialize();
  const stateRaw = storageGet(STATE_KEY) || '';
  const backupsRaw = storageGet(BACKUP_KEY) || '';
  const undoRaw = storageGet(UNDO_KEY) || '';
  return {
    version: APP_VERSION,
    schema: SCHEMA_VERSION,
    revision: cache.meta.revision,
    stateBytes: stateRaw.length,
    backupBytes: backupsRaw.length,
    undoBytes: undoRaw.length,
    backups: array(parse(backupsRaw, [])).length,
    undo: array(parse(undoRaw, [])).length,
    legacyKeys: countLegacyKeys(),
    legacyImportedAt: cache.meta.legacyImportedAt,
    updatedAt: cache.meta.updatedAt
  };
}
