import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const required = [
  'index.html',
  'manifest.json',
  'sw.js',
  'v6/app.js',
  'v6/app.css',
  'v6/content.js',
  'v6/rules.js',
  'v6/store.js',
  'v6/trading-guide.js',
  'v6/trading-guide.css'
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing active file: ${file}`);
}

const index = readFileSync('index.html', 'utf8');
for (const asset of ['/v6/app.js', '/v6/app.css', '/v6/trading-guide.js', '/v6/trading-guide.css']) {
  if (!index.includes(asset)) throw new Error(`Root shell missing asset: ${asset}`);
}

execFileSync(process.execPath, ['--check', 'v6/trading-guide.js'], { stdio: 'pipe' });
const guide = readFileSync('v6/trading-guide.js', 'utf8');
for (const token of ['PARCOURS GUIDÉ', 'Comprendre les bases', 'Écrire un seul setup', 'Backtester 100 cas', 'Passer deux mocks', 'toggle-view']) {
  if (!guide.includes(token)) throw new Error(`Trading guide contract missing: ${token}`);
}
const guideCss = readFileSync('v6/trading-guide.css', 'utf8');
if (!guideCss.includes('.trading-guided') || !guideCss.includes('@media (max-width: 600px)')) {
  throw new Error('Trading guide responsive contract missing');
}
const sw = readFileSync('sw.js', 'utf8');
if (!sw.includes('/v6/trading-guide.js?v=1') || !sw.includes('/v6/trading-guide.css?v=1')) {
  throw new Error('Trading guide assets missing from service worker');
}

function legacyJavaScript(root) {
  if (!existsSync(root)) return [];
  const found = [];
  const walk = directory => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (path.endsWith('.js')) found.push(path);
    }
  };
  walk(root);
  return found;
}

const legacy = [...legacyJavaScript('assets/js'), ...legacyJavaScript('modules')];
if (legacy.length) throw new Error(`Legacy JavaScript remains: ${legacy.join(', ')}`);

console.log('Repository structure check OK');
