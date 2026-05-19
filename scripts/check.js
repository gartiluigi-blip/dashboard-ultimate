#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
let allPassed = true;

function run(label, cmd) {
  try {
    execSync(cmd, { cwd: root, stdio: 'pipe' });
    console.log('PASS  ' + label);
    return true;
  } catch (e) {
    const out = (e.stdout || '').toString().trim();
    const err = (e.stderr || '').toString().trim();
    console.log('FAIL  ' + label);
    if (out) console.log('      ' + out.split('\n').join('\n      '));
    if (err) console.log('      ' + err.split('\n').join('\n      '));
    allPassed = false;
    return false;
  }
}

console.log('\n── Dashboard v4 checks ──\n');

// 1. Syntax check for all JS files
const jsFiles = fs.readdirSync(path.join(root, 'assets'))
  .filter(f => f.endsWith('.js'))
  .map(f => path.join(root, 'assets', f));

jsFiles.forEach(function(f) {
  run('Syntax: ' + path.basename(f), 'node --check "' + f + '"');
});

// 2. No Trading references
run(
  'No Trading/trading references',
  'bash -c \'! grep -r "Trading\\|trading" --include="*.js" --include="*.html" --include="*.css" assets/ index.html\''
);

// 3. No native prompt/alert/confirm in app.js
// We exclude: function definitions (function alert/confirm/prompt),
// Modal method calls (Modal.alert/confirm), and inner method names.
// We only flag bare window-level calls: lines matching prompt(/alert(/confirm(
// but NOT preceded by 'function ', 'Modal.', '. ', or in a comment.
run(
  'No native prompt/alert/confirm in app.js',
  'bash -c \'! grep -n "prompt(\\|alert(\\|confirm(" assets/app.js | grep -v "function\\s\\+\\(alert\\|confirm\\|prompt\\)\\|Modal\\.\\(alert\\|confirm\\|destroy\\)\\|//"\''
);

// 4. Sport library integrity
run('Sport library integrity', 'node scripts/check-sport.js');

// 5. Feature registry integrity
run('Feature registry integrity', 'node scripts/check-features.js');

console.log('\n── Result: ' + (allPassed ? 'ALL PASS ✓' : 'SOME CHECKS FAILED ✗') + ' ──\n');

if (!allPassed) process.exit(1);
