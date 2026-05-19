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

console.log('\n── check-features.js ──\n');

const features = D.FEATURES;
check('D.FEATURES exists', !!features, 'D.FEATURES is undefined');
check('D.FEATURES is array', Array.isArray(features), 'got ' + typeof features);
check('D.FEATURES has entries', Array.isArray(features) && features.length > 0, 'length=' + (features ? features.length : 0));

if (Array.isArray(features) && features.length > 0) {
  // Verify required features are present
  var requiredIds = features.filter(function(f) { return f.required; }).map(function(f) { return f.id; });
  var presentIds = new Set(features.map(function(f) { return f.id; }));
  var missingRequired = requiredIds.filter(function(id) { return !presentIds.has(id); });
  check('All required features present', missingRequired.length === 0, 'missing: ' + missingRequired.join(', '));

  // Verify each entry has id, label, tab, priority, required
  var fieldErrors = [];
  features.forEach(function(f) {
    ['id','label','tab','priority','required'].forEach(function(field) {
      if (f[field] === undefined || f[field] === null) {
        fieldErrors.push(f.id + ' missing ' + field);
      }
    });
  });
  check('All features have required fields', fieldErrors.length === 0, fieldErrors.slice(0,5).join('; '));

  // Count required vs optional
  var reqCount = features.filter(function(f) { return f.required; }).length;
  var optCount = features.filter(function(f) { return !f.required; }).length;
  console.log('  Required features: ' + reqCount);
  console.log('  Optional features: ' + optCount);
  console.log('  Total features: ' + features.length);
}

console.log('\n── Result: ' + (allPassed ? 'ALL PASS ✓' : 'SOME CHECKS FAILED ✗') + ' ──\n');
if (!allPassed) process.exit(1);
