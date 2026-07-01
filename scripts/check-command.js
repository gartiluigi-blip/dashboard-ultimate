import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const files=['assets/js/app.js','assets/js/store.js','modules/today.js','modules/plan.js','modules/sport.js','modules/game.js','modules/home.js','modules/stats.js'];
for(const file of files){
  if(!existsSync(file))throw new Error('Missing required file: '+file);
  execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
}
const app=readFileSync('assets/js/app.js','utf8');
const store=readFileSync('assets/js/store.js','utf8');
const today=readFileSync('modules/today.js','utf8');
for(const token of ['renderToday','renderPlan','ud5:navigate'])if(!app.includes(token))throw new Error('App contract missing: '+token);
for(const token of ['sportSessions','recordAction','today='])if(!store.includes(token))throw new Error('Store contract missing: '+token);
for(const token of ['minimum','reprise','Bloqué'])if(!today.includes(token))throw new Error('Today contract missing: '+token);
console.log('Command check OK',files.length);
