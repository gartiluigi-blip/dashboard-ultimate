#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'assets', 'ud-v73-command.js');
let src = fs.readFileSync(file, 'utf8');

if (src.includes("version: 'v73-storage-core'")) {
  console.log('v73 core patch already applied');
  process.exit(0);
}

const bridgeRe = /\n  function ensureUDStore\(\) \{[\s\S]*?\n  const Store = ensureUDStore\(\);\n  const Router = ensureUDRouter\(\);/;

if (!bridgeRe.test(src)) {
  throw new Error('Unable to find V73 bridge block');
}

const replacement = `
  const Store = window.UDStore;
  const Router = window.UDRouter;

  if (!Store || !Router) {
    console.error('UD v73 requires core store/router modules before boot.');
    return;
  }`;

src = src.replace(bridgeRe, replacement);
src = src.replace(
  'window.UD_V73 = { updateMission, pickMission, go, openDrawer, syncNav, Store, Router, loadV74 };',
  "window.UD_V73 = { updateMission, pickMission, go, openDrawer, syncNav, Store, Router, loadV74, version: 'v73-storage-core' };"
);

fs.writeFileSync(file, src);
console.log('patched v73 to require core store/router');
