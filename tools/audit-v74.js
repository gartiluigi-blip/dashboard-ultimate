#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const src = fs.readFileSync('assets/ud-v74-ops-features.js','utf8');
const v73 = fs.readFileSync('assets/ud-v73-command.js','utf8');
assert.match(src, /UD v74 · Ops Command Suite/, 'v74 module header missing');
assert.match(src, /EPFC Proof Tracker|EPFC/, 'EPFC proof tracker missing');
assert.match(src, /Vinted Profit|Vinted/, 'Vinted profit feature missing');
assert.match(src, /Cashflow/, 'Finance cashflow feature missing');
assert.match(src, /Weekly War Review/, 'Weekly review missing');
assert.match(src, /Voice Command/, 'Voice command missing');
assert.match(src, /epfc_proofs_v1/, 'EPFC storage key missing');
assert.match(src, /vinted_items_v1/, 'Vinted storage key missing');
assert.match(src, /finance_cashflow_v1/, 'Finance storage key missing');
assert.match(v73, /ud-v74-ops-features\.js/, 'v73 must load v74 module');
assert.equal((src.match(/window\.go\s*=/g)||[]).length, 0, 'v74 must not assign window.go');
console.log('v74 ops audit OK');
