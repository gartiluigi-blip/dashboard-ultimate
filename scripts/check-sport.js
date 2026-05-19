import { SPORT_LIBRARY, SPORT_PROGRAM, FLEX_LEVELS } from '../assets/js/data.js';
const counts = SPORT_LIBRARY.reduce((m,e)=>(m[e.category]=(m[e.category]||0)+1,m),{});
const req = { push:25, pull:25, legs:30, core:20, bodyweight:35, mobility:40, warmup:20 };
const fail = [];
if (SPORT_LIBRARY.length < 150) fail.push('SPORT_LIBRARY < 150');
for (const [k,v] of Object.entries(req)) if ((counts[k]||0) < v) fail.push(k + ' < ' + v);
for (const k of ['push1','pull1','legs1','push2','pull2','legs2','rest']) if (!SPORT_PROGRAM[k] || SPORT_PROGRAM[k].length < (k==='rest'?4:7)) fail.push('program ' + k + ' too small');
if (FLEX_LEVELS.length !== 5) fail.push('flex levels missing');
for (const e of SPORT_LIBRARY) for (const f of ['id','name','category','equipment','difficulty','c7Risk','alternatives']) if (!(f in e)) fail.push('missing ' + f + ' on ' + e.id);
if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log('Sport check OK', SPORT_LIBRARY.length, counts);
