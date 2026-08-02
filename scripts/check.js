import { existsSync, readFileSync } from 'node:fs';

const required = [
  'index.html',
  'manifest.json',
  'v6/app.js',
  'v6/app.css',
  'v6/content.js',
  'v6/rules.js',
  'v6/store.js'
];
for (const file of required) {
  if (!existsSync(file)) throw new Error(`Missing active file: ${file}`);
}

const index = readFileSync('index.html', 'utf8');
if (!index.includes('/v6/app.js') || !index.includes('/v6/app.css')) {
  throw new Error('Root shell does not load the V6 runtime');
}

for (const legacy of ['assets/js/app.js', 'assets/js/command-link.js', 'modules/today.js']) {
  if (existsSync(legacy)) throw new Error(`Legacy runtime must be removed: ${legacy}`);
}

console.log('Repository structure check OK');
