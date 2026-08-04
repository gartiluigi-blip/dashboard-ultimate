import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  AUTOMATIONS,
  BODY_SYSTEMS,
  CULTURE_DOMAINS,
  HEALTH_PILLARS,
  LEARNING_BOOKS,
  LEARNING_PATH,
  NAV
} from '../v7/content.js';
import {
  ensureState,
  healthScores,
  learningStats,
  readiness,
  smartPlan,
  tradingPhase,
  weeklyReview
} from '../v7/engine.js';

const required = [
  'index.html', 'manifest.json', 'sw.js', 'v6/store.js',
  'v7/app.js', 'v7/app.css', 'v7/content.js', 'v7/engine.js', 'v7/ui.js', 'v7/views.js'
];
for (const file of required) if (!existsSync(file)) throw new Error(`Missing V7 file: ${file}`);

const javascript = [
  'v6/store.js',
  ...readdirSync('v7').filter(name => name.endsWith('.js')).map(name => `v7/${name}`),
  ...readdirSync('v7/views').filter(name => name.endsWith('.js')).map(name => `v7/views/${name}`),
  'scripts/check-v7.js'
];
for (const file of javascript) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });

const index = readFileSync('index.html', 'utf8');
const scripts = [...index.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]);
if (scripts.length !== 1 || !scripts[0].includes('/v7/app.js')) throw new Error(`V7 must load one runtime only: ${scripts.join(', ')}`);
for (const forbidden of ['/v6/app.js', 'trading-guide.js', 'godmode.js']) {
  if (index.includes(forbidden)) throw new Error(`Sidecar runtime still loaded: ${forbidden}`);
}
for (const id of ['app','nav','mobile-nav','quick-button','command-button','overlay','toast']) {
  if (!index.includes(`id="${id}"`)) throw new Error(`Nexus shell control missing: ${id}`);
}

const app = readFileSync('v7/app.js', 'utf8');
const viewFiles = readdirSync('v7/views').filter(name => name.endsWith('.js')).map(name => readFileSync(`v7/views/${name}`, 'utf8')).join('\n');
const css = readFileSync('v7/app.css', 'utf8');
const sw = readFileSync('sw.js', 'utf8');

if (app.includes('stopImmediatePropagation') || app.includes('MutationObserver')) throw new Error('Blocking sidecar architecture returned');
if ((app.match(/document\.addEventListener\('click'/g) || []).length !== 1) throw new Error('V7 must have one delegated click handler');
if ((app.match(/new MutationObserver/g) || []).length) throw new Error('DOM rewrite observer returned');

const actionMatches = [...viewFiles.matchAll(/data-action=\\?"([^"\\]+)\\?"/g)].map(match => match[1]);
const dynamicActions = [...viewFiles.matchAll(/button\([^,]+,\s*'([^']+)'/g)].map(match => match[1]);
const actions = new Set([...actionMatches, ...dynamicActions]);
const shellActions = ['navigate','open-checkin','open-command','open-quick','close-overlay','scroll-to','quick-action'];
for (const action of [...actions, ...shellActions]) {
  if (!app.includes(`action === '${action}'`) && !['navigate','open-checkin','open-command','open-quick','close-overlay','scroll-to','quick-action'].includes(action)) {
    throw new Error(`Rendered action lacks handler contract: ${action}`);
  }
}
for (const action of ['save-checkin','toggle-focus','save-health-detail','complete-culture','save-sport','add-transaction','save-trading-setup','save-settings','delete-record']) {
  if (!app.includes(`action === '${action}'`)) throw new Error(`Critical interaction missing: ${action}`);
}

if (!/min-height:\s*48px/.test(css)) throw new Error('48px touch target contract missing');
for (const token of [':focus-visible','prefers-reduced-motion','.mobile-nav','.sidebar','.page-hero','.bottom-sheet','.command']) {
  if (!css.includes(token)) throw new Error(`Accessibility/design contract missing: ${token}`);
}
if (!sw.includes('ultimate-dashboard-v7.0.0-nexus') || !sw.includes('/v7/app.js?v=7.0.0')) throw new Error('V7 service worker contract missing');
for (const file of ['views/today.js','views/health.js','views/learn.js','views/culture.js','views/body.js','views/money.js','views/trading.js','views/review.js','views/settings.js']) {
  if (!sw.includes(`/v7/${file}`)) throw new Error(`Offline route missing: ${file}`);
}

if (NAV.length !== 9) throw new Error(`Expected 9 routes, got ${NAV.length}`);
if (HEALTH_PILLARS.length !== 8 || BODY_SYSTEMS.length !== 6) throw new Error('Health system incomplete');
if (LEARNING_PATH.length !== 8 || LEARNING_BOOKS.length !== 8) throw new Error('Learning system incomplete');
if (CULTURE_DOMAINS.length !== 14) throw new Error('Culture map incomplete');
if (AUTOMATIONS.length < 5) throw new Error('Automation system incomplete');

const date = new Date().toISOString().slice(0,10);
const sample = ensureState({
  profile: { sleepTargetHours: 7.5, stepsTarget: 7000, waterMl: 2500, weightKg: 82 },
  days: { [date]: { sleepHours: 7.5, sleepQuality: 4, energy: 4, pain: 1, steps: 7000, waterMl: 2200, proteinG: 140, fiberG: 25, availableMin: 75, completed: [], skipped: [] } },
  health: { daily: { [date]: { fruitVegG: 400, activityMin: 30, stress: 2, mood: 4, daylightMin: 20, recoveryMin: 10, socialMin: 20, alcoholUnits: 0, sugaryDrinks: 0, caffeineLate: false, digestiveSymptoms: 0 } }, vitals: [{ date, systolic: 118, diastolic: 76 }], prevention: [], symptoms: [], supplements: [], settings: {} },
  knowledge: { sessions: [], cards: [], cultureSessions: [], bookSessions: [], books: {}, metaIndex: 0, cultureIndex: 0 },
  sport: { sessions: [], weeklyTarget: 4 },
  money: { settings: { income: 1800, openingBalance: 500, savingsTarget: 200 }, recurring: [{ amount: 600 }], transactions: [], budgets: {} },
  trading: { setup: {}, sessions: [], trades: [], mockChallenges: [], risk: {}, preTrade: {} },
  nutrition: { entries: [], weightHistory: [] }, study: { sessions: [], reviews: [], tracks: {} }, reading: { sessions: [], shelves: {}, notes: [] },
  ui: { theme: 'graphite', density: 'comfortable' }
});
const health = healthScores(sample);
const ready = readiness(sample);
const learn = learningStats(sample);
const plan = smartPlan(sample);
const review = weeklyReview(sample);
const trading = tradingPhase(sample);
if (![health.overall, ready.score, learn.score, review.score].every(Number.isFinite)) throw new Error('Score engine regression');
if (!plan.items.length || plan.items.length > 3) throw new Error('Smart plan must return 1–3 actions');
if (plan.items.reduce((sum, item) => sum + item.minutes, 0) > plan.budget && plan.items.length > 1) throw new Error('Smart plan exceeds available time');
if (trading.index !== 0) throw new Error('Trading guide should start with setup');

console.log('V7 Nexus check OK', {
  routes: NAV.length,
  files: javascript.length,
  actions: actions.size,
  healthPillars: HEALTH_PILLARS.length,
  cultureDomains: CULTURE_DOMAINS.length,
  automations: AUTOMATIONS.length,
  planItems: plan.items.length,
  health: health.overall,
  readiness: ready.score
});
