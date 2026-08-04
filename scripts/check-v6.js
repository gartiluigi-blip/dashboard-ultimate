import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ATHLETE_CYCLE, ATHLETE_QUALITIES, CULTURE_SHELVES, PROP_FIRM_PRESETS, TRADING_CURRICULUM } from '../v6/content.js';
import {
  athleteCoverage,
  cashForecast,
  dueReviews,
  monthlyMoneySummary,
  nextAthleteSession,
  nutritionTargets,
  propFirmStats,
  recoveryScore,
  selectedPropPlan,
  tradeCompliance,
  tradingReadiness,
  weeklyReview
} from '../v6/rules.js';

const files = ['index.html', 'sw.js', 'v6/app.js', 'v6/app.css', 'v6/content.js', 'v6/rules.js', 'v6/store.js'];
for (const file of files) {
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
}

const index = readFileSync('index.html', 'utf8');
if (!index.includes('/v6/app.js?v=6.2.0') || !index.includes('/v6/app.css?v=6.2.0')) throw new Error('V6.2 core assets missing');
if (index.includes('command-link.js') || index.includes('assets/js/app.js')) throw new Error('Legacy runtime still loaded');

const targets = nutritionTargets({ weightKg: 82, proteinPerKg: 1.8, waterMl: 2500, sleepTargetHours: 7.5, stepsTarget: 7000 });
if (targets.proteinG !== 148 || targets.waterMl !== 2500 || targets.sleepHours !== 7.5) throw new Error('Health targets regression');

const recovery = recoveryScore({ profile: { sleepTargetHours: 8, stepsTarget: 7000 }, days: { '2026-08-03': { sleepHours: 8, sleepQuality: 5, energy: 5, pain: 0, steps: 7000 } } }, '2026-08-03');
if (recovery < 95) throw new Error(`Recovery score regression: ${recovery}`);

if (ATHLETE_CYCLE.length < 8 || ATHLETE_QUALITIES.length < 8) throw new Error('Athlete coverage incomplete');
const coverage = athleteCoverage({ sport: { sessions: [{ date: new Date().toISOString().slice(0, 10), status: 'completed', qualities: ['strength', 'aerobic'] }] } });
if (!coverage.find(item => item.id === 'strength')?.count) throw new Error('Athlete coverage failed');

const forcedRecoveryState = {
  profile: { sleepTargetHours: 7.5, stepsTarget: 7000 },
  days: { '2026-08-01': { pain: 6, energy: 3, sleepHours: 7, sleepQuality: 3 }, '2026-08-02': { pain: 0, energy: 3, sleepHours: 7, sleepQuality: 3 } },
  sport: { sessions: [{ date: '2026-08-01', type: 'Récupération active', status: 'completed', qualities: ['recovery'], advancesCycle: false }] }
};
if (nextAthleteSession(forcedRecoveryState, '2026-08-02').index !== 0) throw new Error('Forced recovery advanced cycle');

const trades = Array.from({ length: 30 }, (_, index) => ({
  id: `trade_${index}`,
  date: `2026-07-${String((index % 10) + 1).padStart(2, '0')}`,
  createdAt: `2026-07-${String((index % 10) + 1).padStart(2, '0')}T${String(index % 24).padStart(2, '0')}:00:00Z`,
  market: 'MNQ', setup: 'Setup A', contracts: 1,
  pnl: index % 3 === 0 ? -50 : 100,
  risk: 100, breach: false, violations: [], note: 'Contexte et exécution documentés.'
}));
const sample = {
  trading: {
    planId: 'flex50', customPlan: { account: 1, maxLoss: 1 },
    ruleSnapshot: { verifiedAt: new Date().toISOString().slice(0, 10) },
    risk: { riskPerTrade: 100, dailyStop: 500, maxTrades: 10, maxConsecutiveLosses: 4 },
    trades,
    sessions: [{ kind: 'backtest', samples: 100 }, ...Array.from({ length: 10 }, () => ({ kind: 'execution', breach: false }))],
    mockChallenges: [{ status: 'completed', passed: true }, { status: 'completed', passed: true }],
    setup: { name: 'Setup A', rules: 'Contexte précis, déclencheur, invalidation, objectif, gestion, filtre horaire et conditions de non-trade documentées.' }
  }
};
const plan = selectedPropPlan(sample);
if (plan.account !== 50000 || plan.maxLoss !== 2000) throw new Error('Official preset overwritten');
const stats = propFirmStats(sample);
if (stats.totalPnl !== 1500 || stats.validTrades !== 30 || stats.profitFactor < 1.2) throw new Error('Prop calculations failed');
if (!tradingReadiness(sample).ready) throw new Error('Readiness gate failed');

const violation = tradeCompliance(sample, { date: '2026-07-11', market: 'MNQ', setup: '', contracts: 40, risk: 500, pnl: 0, note: '' });
if (violation.ok || violation.violations.length < 3) throw new Error('Trade compliance failed');

const forecast = cashForecast({ money: { settings: { openingBalance: 1000, income: 2000, savingsTarget: 200 }, recurring: [{ label: 'Loyer', amount: 600 }], transactions: [{ date: new Date().toISOString().slice(0, 10), type: 'expense', category: 'Courses', amount: 300 }, { date: new Date().toISOString().slice(0, 10), type: 'expense', category: 'Loyer', amount: 600 }] } });
if (forecast !== 2100) throw new Error(`Cash forecast regression: ${forecast}`);

const money = monthlyMoneySummary({ money: { budgets: { Courses: 200 }, transactions: [{ date: new Date().toISOString().slice(0, 10), type: 'expense', category: 'Courses', amount: 300 }] } });
if (money.alerts.length !== 1) throw new Error('Budget alert failed');

const reviews = dueReviews({ study: { reviews: [{ dueDate: '2026-08-01', status: 'due' }] } }, '2026-08-03');
if (reviews.length !== 1) throw new Error('Spaced review due calculation failed');

const review = weeklyReview({ profile: { sleepTargetHours: 7.5, stepsTarget: 7000, weightKg: 82, proteinPerKg: 1.8, waterMl: 2500 }, days: {}, sport: { sessions: [], weeklyTarget: 6 }, trading: sample.trading, study: { sessions: [], reviews: [] }, reading: { sessions: [] }, nutrition: { entries: [] }, money: { transactions: [], budgets: {}, settings: {}, recurring: [] } });
if (!Number.isFinite(review.overall)) throw new Error('Weekly review failed');

if (TRADING_CURRICULUM.length !== 12 || !PROP_FIRM_PRESETS.flex25 || !PROP_FIRM_PRESETS.flex50) throw new Error('Trading content missing');
if (Object.keys(CULTURE_SHELVES).length < 3) throw new Error('Culture library incomplete');

const app = readFileSync('v6/app.js', 'utf8');
for (const token of ['renderReview', 'Checklist pré-trade', 'Révisions dues', 'removeRecord', 'Une priorité n’est validée']) {
  if (!app.includes(token)) throw new Error(`V6.2 contract missing: ${token}`);
}
if (app.includes("action === 'complete-order'")) throw new Error('Fake completion contract returned');

const sw = readFileSync('sw.js', 'utf8');
if (!/ultimate-dashboard-v6\.[23]\.0/.test(sw) || !sw.includes('staleWhileRevalidate')) throw new Error('Versioned service worker missing');
const css = readFileSync('v6/app.css', 'utf8');
if (!/min-height:\s*48px/.test(css) || !css.includes(':focus-visible') || !css.includes('prefers-reduced-motion')) throw new Error('Accessibility contract missing');

const forbidden = 'vin' + 'ted';
const allowed = new Set(['v6/store.js']);
const extensions = /\.(js|md|json|html|toml|ya?ml)$/i;
const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (extensions.test(name) && !allowed.has(path.replace(/^\.\//, '')) && readFileSync(path, 'utf8').toLowerCase().includes(forbidden)) hits.push(path);
  }
}
walk('.');
if (hits.length) throw new Error(`Removed domain remains: ${hits.join(', ')}`);

console.log('V6.2 core check OK', { athleteSessions: ATHLETE_CYCLE.length, tradingModules: TRADING_CURRICULUM.length, weeklyReview: review.overall, totalPnl: stats.totalPnl });
