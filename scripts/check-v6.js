import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ATHLETE_CYCLE, ATHLETE_QUALITIES, CULTURE_SHELVES, PROP_FIRM_PRESETS, TRADING_CURRICULUM } from '../v6/content.js';
import { athleteCoverage, nutritionTargets, propFirmStats, tradingReadiness } from '../v6/rules.js';

const files = ['index.html', 'sw.js', 'v6/app.js', 'v6/app.css', 'v6/content.js', 'v6/rules.js', 'v6/store.js'];
for (const file of files) {
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
}

const index = readFileSync('index.html', 'utf8');
if (!index.includes('/v6/app.js') || !index.includes('/v6/app.css')) throw new Error('V6 root assets missing');
if (index.includes('command-link.js') || index.includes('assets/js/app.js')) throw new Error('Legacy runtime still loaded');

const targets = nutritionTargets({ weightKg: 82, proteinPerKg: 1.8, waterMl: 2500 });
if (targets.proteinG !== 148 || targets.waterMl !== 2500) throw new Error('Nutrition target regression');

if (ATHLETE_CYCLE.length < 8 || ATHLETE_QUALITIES.length < 8) throw new Error('Athlete coverage is incomplete');
const coverage = athleteCoverage({ sport: { sessions: [{ date: new Date().toISOString().slice(0, 10), status: 'completed', qualities: ['strength', 'aerobic'] }] } });
if (!coverage.find(item => item.id === 'strength')?.count) throw new Error('Athlete coverage calculation failed');

const sample = {
  trading: {
    planId: 'flex50',
    customPlan: {},
    trades: [
      { date: '2026-08-01', pnl: 300, risk: 100, breach: false },
      { date: '2026-08-02', pnl: -100, risk: 100, breach: false },
      { date: '2026-08-03', pnl: 200, risk: 100, breach: false }
    ],
    sessions: [{ kind: 'backtest', samples: 100 }, ...Array.from({ length: 10 }, () => ({ kind: 'execution', breach: false }))],
    mockChallenges: 2,
    setup: { name: 'Setup A', rules: 'Contexte, déclencheur, invalidation, objectif.' }
  }
};
const stats = propFirmStats(sample);
if (stats.totalPnl !== 400 || stats.maxDrawdown !== 100 || stats.trades !== 3) throw new Error('Prop firm calculations failed');
if (!tradingReadiness(sample).ready) throw new Error('Trading readiness gate failed');
if (TRADING_CURRICULUM.length !== 12) throw new Error('Trading curriculum must have 12 modules');
if (!PROP_FIRM_PRESETS.flex25 || !PROP_FIRM_PRESETS.flex50) throw new Error('Verified prop presets missing');
if (Object.keys(CULTURE_SHELVES).length < 3) throw new Error('Culture library incomplete');

const app = readFileSync('v6/app.js', 'utf8');
for (const token of ['renderAthlete', 'renderTrading', 'renderLibrary', 'Gate challenge', 'Aucune validation sans production réelle']) {
  if (!app.includes(token)) throw new Error(`V6.1 contract missing: ${token}`);
}
if (!app.includes("serviceWorker.register('/sw.js')")) throw new Error('Service worker is not registered');
const sw = readFileSync('sw.js', 'utf8');
if (!sw.includes('ultimate-dashboard-v6.1.0') || !sw.includes("caches.delete")) throw new Error('Versioned service worker contract missing');
const css = readFileSync('v6/app.css', 'utf8');
if (!css.includes('min-height: 46px') || !css.includes(':focus-visible')) throw new Error('Mobile accessibility contract missing');

const forbidden = 'vin' + 'ted';
const allowed = new Set(['v6/store.js']);
const extensions = /\.(js|md|json|html|toml|ya?ml)$/i;
const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (extensions.test(name) && !allowed.has(path.replace(/^\.\//, ''))) {
      if (readFileSync(path, 'utf8').toLowerCase().includes(forbidden)) hits.push(path);
    }
  }
}
walk('.');
if (hits.length) throw new Error(`Removed marketplace domain still present in: ${hits.join(', ')}`);

console.log('V6.1 Godmode check OK', {
  athleteSessions: ATHLETE_CYCLE.length,
  tradingModules: TRADING_CURRICULUM.length,
  libraryShelves: Object.keys(CULTURE_SHELVES).length,
  totalPnl: stats.totalPnl,
  offlineShell: true
});
