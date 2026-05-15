'use strict';

const { spawnSync } = require('node:child_process');

function runNode(script){
  console.log(`$ node ${script}`);
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

module.exports = {
  runNode
};
