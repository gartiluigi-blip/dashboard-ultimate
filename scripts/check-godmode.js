import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { CULTURE_DOMAINS, HEALTH_PILLARS, LEARNING_BOOKS, META_LEARNING_PATH, ORGAN_SYSTEMS, PREVENTION_ITEMS } from '../v6/godmode-content.js';

for (const file of ['v6/godmode.js', 'v6/godmode-content.js']) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
}
if (HEALTH_PILLARS.length !== 8) throw new Error('Health system must have eight pillars');
if (ORGAN_SYSTEMS.length < 6) throw new Error('Organ systems coverage incomplete');
if (PREVENTION_ITEMS.length < 8) throw new Error('Prevention tracker incomplete');
if (META_LEARNING_PATH.length !== 8) throw new Error('Meta-learning path must have eight steps');
if (LEARNING_BOOKS.length < 8) throw new Error('Learning library incomplete');
if (CULTURE_DOMAINS.length < 14) throw new Error('Culture map incomplete');

const index = readFileSync('index.html', 'utf8');
for (const asset of ['/v6/godmode.css', '/v6/godmode.js']) {
  if (!index.includes(asset)) throw new Error(`Godmode asset missing from shell: ${asset}`);
}
const sw = readFileSync('sw.js', 'utf8');
for (const asset of ['/v6/godmode.css', '/v6/godmode.js', '/v6/godmode-content.js']) {
  if (!sw.includes(asset)) throw new Error(`Godmode asset missing from service worker: ${asset}`);
}
const app = readFileSync('v6/godmode.js', 'utf8');
for (const token of ['renderHealth', 'renderKnowledge', 'health-save-day', 'meta-complete', 'culture-log', 'card-review', 'Gate compléments', 'SANTÉ 360', 'SAVOIR OS']) {
  if (!app.includes(token)) throw new Error(`Godmode contract missing: ${token}`);
}
if (!app.includes('data-god-route="health"')) throw new Error('Health route injection missing');
const css = readFileSync('v6/godmode.css', 'utf8');
for (const token of ['pillar-grid', 'organ-grid', 'culture-map', 'prefers-reduced-motion']) {
  if (!css.includes(token)) throw new Error(`Godmode style missing: ${token}`);
}
console.log('V6.3 Godmode health and knowledge check OK', {
  healthPillars: HEALTH_PILLARS.length,
  organSystems: ORGAN_SYSTEMS.length,
  learningSteps: META_LEARNING_PATH.length,
  cultureDomains: CULTURE_DOMAINS.length,
  books: LEARNING_BOOKS.length
});
