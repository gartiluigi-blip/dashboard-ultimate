import { SPORT_LIBRARY, SPORT_PROGRAM, SPORT_CYCLE, BODYWEIGHT_LADDERS, MUSCLE_LABELS } from '../assets/js/data.js';

const fail=[];
const requiredDays=['Push A','Pull A','Legs A','Rest A','Push B','Pull B','Legs B','Rest B'];
const requiredMuscles=['chest','sideDelt','rearDelt','triceps','lats','upperBack','biceps','forearms','grip','quads','hamstrings','glutes','adductors','calves','soleus','tibialis','abs','obliques'];
const byId=id=>SPORT_LIBRARY.find(x=>x.id===id);

if (SPORT_CYCLE.length!==8) fail.push('cycle must contain 8 days');
for (const day of requiredDays) {
  const list=SPORT_PROGRAM[day];
  if (!Array.isArray(list)) fail.push('missing program '+day);
  else if (day.startsWith('Rest') ? list.length<3 : list.length<7) fail.push('program too small '+day);
  else list.forEach(id=>{if(!byId(id)) fail.push('unknown exercise '+id+' in '+day)});
}
for (const ex of SPORT_LIBRARY) {
  for (const field of ['id','name','category','muscles','prescription','equipment','difficulty','alternatives']) if (!(field in ex)) fail.push('missing '+field+' on '+ex.id);
  if (!Object.keys(ex.muscles||{}).length && !['mobility','conditioning'].includes(ex.category)) fail.push('no muscle mapping on '+ex.id);
  if (!(+ex.prescription?.sets>0)) fail.push('invalid prescription '+ex.id);
}
const coverage={};
SPORT_CYCLE.filter(day=>!day.startsWith('Rest')).forEach(day=>SPORT_PROGRAM[day].forEach(id=>{const ex=byId(id);Object.entries(ex.muscles||{}).forEach(([muscle,factor])=>coverage[muscle]=(coverage[muscle]||0)+ex.prescription.sets*factor)}));
for (const muscle of requiredMuscles) if (!(coverage[muscle]>0)) fail.push('uncovered muscle '+muscle);
for (const key of ['pullup','chinup','pushup','dip','pike']) if ((BODYWEIGHT_LADDERS[key]||[]).length!==6) fail.push('invalid ladder '+key);
if (!Object.keys(MUSCLE_LABELS).length) fail.push('missing muscle labels');
if (fail.length) { console.error(fail.join('\n')); process.exit(1); }
console.log('Hybrid PPL sport check OK',SPORT_LIBRARY.length,'exercises');
