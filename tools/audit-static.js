#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const v73 = read('assets/ud-v73-command.js');
const v72 = read('assets/ud-v72-godmode-pack.js');
const coach = read('netlify/functions/coach.js');

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const v73Code = stripComments(v73);

// v73 must not monkey patch window.go anymore. This regex detects assignment only.
assert.equal(/window\.go\s*=/.test(v73Code), false, 'v73 must not assign window.go');
assert.equal(/\bwrapGo\b/.test(v73Code), false, 'v73 wrapGo must stay removed');
assert.match(v73, /window\.UDStore/, 'v73 must expose or use UDStore bridge');
assert.match(v73, /window\.UDRouter/, 'v73 must expose or use UDRouter bridge');

// v72 timer audit must be opt-in only.
assert.match(v72, /timerAudit:\s*false/, 'v72 timerAudit must default to false');
assert.match(v72, /debugTimers=1/, 'v72 timer patch must require explicit debugTimers flag or debug mode');
assert.match(v72, /BACKUP_SECRETS_RAW/, 'v72 must define backup secret exclusion set');
assert.match(v72, /UDSafeLocalStorageExport/, 'v72 must expose safe export helper');

// coach voice mode must keep dedicated normalization.
assert.match(coach, /function normalizeVoice/, 'coach must contain normalizeVoice');
assert.match(coach, /mode === 'voice' \? normalizeVoice/, 'coach must route voice mode to normalizeVoice');
assert.match(coach, /action:\s*\[/, 'coach voice payload must include action allowlist');

console.log('static audit OK');
