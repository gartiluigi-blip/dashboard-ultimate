'use strict';

function table(headers, rows){
  const head = '| ' + headers.join(' | ') + ' |';
  const sep = '| ' + headers.map(() => '---').join(' | ') + ' |';
  const body = rows.map(row => '| ' + row.map(cell => String(cell)).join(' | ') + ' |');
  return [head, sep, ...body].join('\n');
}

function section(title, lines){
  return ['## ' + title, '', ...lines, ''].join('\n');
}

module.exports = {
  table,
  section
};
