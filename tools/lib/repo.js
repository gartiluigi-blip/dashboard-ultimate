'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');

function repoPath(...parts){
  return path.join(root, ...parts);
}

function readText(rel){
  return fs.readFileSync(repoPath(rel), 'utf8');
}

function writeText(rel, content){
  const file = repoPath(rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function exists(rel){
  return fs.existsSync(repoPath(rel));
}

function relPath(file){
  return path.relative(root, file).replace(/\\/g, '/');
}

module.exports = {
  root,
  repoPath,
  readText,
  writeText,
  exists,
  relPath
};
