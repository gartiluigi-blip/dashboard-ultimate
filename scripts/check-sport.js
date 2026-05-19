#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
let allPassed = true;

function pass(label) {
  console.log('PASS  ' + label);
}

function fail(label, detail) {
  console.log('FAIL  ' + label + (detail ? ' — ' + detail : ''));
  allPassed = false;
}

function check(label, ok, detail) {
  if (ok) pass(label);
  else fail(label, detail);
}

// Load data.js safely
const src = fs.readFileSync(path.join(root, 'assets/data.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const D = sandbox.window.D;

const lib = D.SPORT_LIBRARY || [];

// Count by category
const counts = {};
lib.forEach(function(ex) {
  counts[ex.category] = (counts[ex.category] || 0) + 1;
});

console.log('\n── check-sport.js ──\n');
console.log('Category counts:');
Object.keys(counts).sort().forEach(function(cat) {
  console.log('  ' + cat + ': ' + counts[cat]);
});
console.log('  TOTAL: ' + lib.length);
console.log('');

// Minimum counts
check('Total >= 150', lib.length >= 150, 'got ' + lib.length);
check('push >= 25',   (counts['push'] || 0) >= 25,   'got ' + (counts['push'] || 0));
check('pull >= 25',   (counts['pull'] || 0) >= 25,   'got ' + (counts['pull'] || 0));
check('legs >= 30',   (counts['legs'] || 0) >= 30,   'got ' + (counts['legs'] || 0));
check('core >= 20',   (counts['core'] || 0) >= 20,   'got ' + (counts['core'] || 0));
check('bodyweight >= 35', (counts['bodyweight'] || 0) >= 35, 'got ' + (counts['bodyweight'] || 0));
check('mobility_flexibility >= 40', (counts['mobility_flexibility'] || 0) >= 40, 'got ' + (counts['mobility_flexibility'] || 0));
check('warmup_recovery >= 20', (counts['warmup_recovery'] || 0) >= 20, 'got ' + (counts['warmup_recovery'] || 0));

// Required fields on every entry
var requiredFields = ['id','name','category','pattern','equipment','difficulty','targetMuscles','c7Risk','type','coachingCues','progressionRule','alternatives','avoid'];
var fieldErrors = [];
lib.forEach(function(ex) {
  requiredFields.forEach(function(f) {
    if (ex[f] === undefined || ex[f] === null) {
      fieldErrors.push(ex.id + ' missing ' + f);
    }
  });
  if (!Array.isArray(ex.alternatives) || ex.alternatives.length < 2) {
    fieldErrors.push(ex.id + ' needs at least 2 alternatives');
  }
});
check('All entries have required fields', fieldErrors.length === 0, fieldErrors.slice(0,5).join('; '));

// Validate alternatives reference real ids
var idSet = new Set(lib.map(function(ex) { return ex.id; }));
var altErrors = [];
lib.forEach(function(ex) {
  if (!Array.isArray(ex.alternatives)) return;
  ex.alternatives.forEach(function(altId) {
    if (!idSet.has(altId)) {
      altErrors.push(ex.id + ' -> unknown alt ' + altId);
    }
  });
});
check('All alternatives reference valid ids', altErrors.length === 0, altErrors.slice(0,5).join('; '));

// SPORT_PROGRAM sessions
var prog = D.SPORT_PROGRAM || {};
var requiredSessions = ['push1','pull1','legs1','push2','pull2','legs2','rest'];
var missingSessions = requiredSessions.filter(function(s) { return !prog[s]; });
check('SPORT_PROGRAM has all 7 sessions', missingSessions.length === 0, 'missing: ' + missingSessions.join(','));

// SOUPLESSE_LEVELS
var souplesse = D.SOUPLESSE_LEVELS || [];
check('SOUPLESSE_LEVELS.length >= 5', souplesse.length >= 5, 'got ' + souplesse.length);

// BODYWEIGHT_PROGRESSIONS
var bwp = D.BODYWEIGHT_PROGRESSIONS || {};
var bwpKeys = Object.keys(bwp);
check('BODYWEIGHT_PROGRESSIONS keys >= 6', bwpKeys.length >= 6, 'got ' + bwpKeys.length);

console.log('\n── Result: ' + (allPassed ? 'ALL PASS ✓' : 'SOME CHECKS FAILED ✗') + ' ──\n');
if (!allPassed) process.exit(1);
