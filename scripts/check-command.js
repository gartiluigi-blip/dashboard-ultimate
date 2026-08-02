import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const files = ['v6/app.js', 'v6/content.js', 'v6/rules.js', 'v6/store.js', 'sw.js'];
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });

const app = readFileSync('v6/app.js', 'utf8');
const content = readFileSync('v6/content.js', 'utf8');
const rules = readFileSync('v6/rules.js', 'utf8');
const store = readFileSync('v6/store.js', 'utf8');

for (const token of ['renderToday', 'renderReview', 'renderAthlete', 'renderTrading', 'renderStudy', 'renderLibrary', 'renderNutrition', 'renderMoney', 'renderSystem']) {
  if (!app.includes(token)) throw new Error(`Active route missing: ${token}`);
}
for (const token of ['ATHLETE_CYCLE', 'TRADING_CURRICULUM', 'CULTURE_SHELVES', 'TRADING_TOOLS']) {
  if (!content.includes(token)) throw new Error(`Content contract missing: ${token}`);
}
for (const token of ['todayOrders', 'weeklyReview', 'tradingReadiness', 'tradeCompliance', 'dueReviews', 'monthlyMoneySummary']) {
  if (!rules.includes(token)) throw new Error(`Rules contract missing: ${token}`);
}
for (const token of ['SCHEMA_VERSION = 3', 'undoLast', 'restoreBackup', 'removeRecord', 'MAX_IMPORT_BYTES']) {
  if (!store.includes(token)) throw new Error(`Store contract missing: ${token}`);
}
if (app.includes("action === 'complete-order'")) throw new Error('Generic fake completion returned');
if (!app.includes('Checklist pré-trade') || !app.includes('Révisions dues')) throw new Error('Autopilot evidence features missing');

console.log('Autopilot command check OK', files.length);
