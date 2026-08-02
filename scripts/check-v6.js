import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { nutritionTargets, sportProgression, vintedCost, vintedDecision, vintedResult } from '../v6/rules.js';

const files = ['index.html', 'v6/app.js', 'v6/app.css', 'v6/content.js', 'v6/rules.js', 'v6/store.js'];
for (const file of files) {
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
}

const index = readFileSync('index.html', 'utf8');
if (!index.includes('/v6/app.js') || !index.includes('/v6/app.css')) throw new Error('V6 root assets missing');
if (index.includes('command-link.js') || index.includes('assets/js/app.js')) throw new Error('Legacy runtime still loaded by index');

const sample = {
  status: 'listed',
  listedAt: '2026-01-01',
  asking: 100,
  transactions: [
    { type: 'purchase', amount: 30 },
    { type: 'shipping', amount: 5 },
    { type: 'boost', amount: 4 }
  ]
};
if (vintedCost(sample) !== 39) throw new Error('Vinted cost is not transaction based');
sample.transactions.push({ type: 'sale', amount: 90 });
sample.status = 'sold';
if (vintedResult(sample) !== 51) throw new Error('Vinted result calculation failed');
if (vintedDecision(sample).label !== 'PROFIT') throw new Error('Vinted sold decision failed');

const targets = nutritionTargets({ weightKg: 82, proteinPerKg: 1.8, waterMl: 2500, mealsPerDay: 4 });
if (targets.proteinG !== 148 || targets.waterMl !== 2500 || targets.meals !== 4) throw new Error('Nutrition targets failed');

const progression = sportProgression({ pain: 0, exercises: { test: { sets: [{ reps: 10, rir: 2, pain: 0 }, { reps: 10, rir: 2, pain: 0 }] } } }, { id: 'test', sets: 2, target: '6–10' });
if (!progression.includes('Progression proposée')) throw new Error('Sport progression rule failed');

const store = readFileSync('v6/store.js', 'utf8');
for (const token of ['legacyImportedAt', 'createBackup', 'exportData', 'normalizeVinted']) {
  if (!store.includes(token)) throw new Error(`Store contract missing: ${token}`);
}
if (store.includes('localStorage.removeItem(`${LEGACY_PREFIX}')) throw new Error('Legacy deletion must remain blocked');

const app = readFileSync('v6/app.js', 'utf8');
for (const token of ['todayOrders', 'Preuve réelle obligatoire', 'V6 intacte', 'Opération Vinted ajoutée une seule fois']) {
  if (!app.includes(token)) throw new Error(`V6 app contract missing: ${token}`);
}

console.log('V6 check OK', { files: files.length, vintedCost: vintedCost(sample), protein: targets.proteinG });
