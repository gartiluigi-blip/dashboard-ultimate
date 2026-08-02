import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'index.html',
  'manifest.json',
  'sw.js',
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
