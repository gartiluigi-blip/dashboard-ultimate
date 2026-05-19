import { SPORT_LIBRARY, SPORT_PROGRAM, SPORT_CYCLE, FLEX_LEVELS } from '../assets/js/data.js';
import * as Store from '../assets/js/store.js';
import { el, card, subTabs, toast } from '../assets/js/ui.js';

let panel = 'programme';
let cat = 'all';

function cycleType(){
  const c = Store.sportCycle();
  const d = Math.floor((new Date(Store.today()) - new Date(c.anchorDate)) / 86400000);
  const start = SPORT_CYCLE.indexOf(c.anchorType);
  return SPORT_CYCLE[((start < 0 ? 0 : start) + d % SPORT_CYCLE.length + SPORT_CYCLE.length) % SPORT_CYCLE.length];
}
function byId(id){ return SPORT_LIBRARY.find(e => e.id === id); }

export function renderSport(root, rerender){
  root.append(el('div',{class:'row'},[
    el('span',{class:'pill'},'Cycle 9 jours: ' + SPORT_CYCLE.join(' → ')),
    el('button',{class:'btn',onclick:()=>{Store.setSportCycle({anchorDate:Store.today(),anchorType:'push1'}); rerender();}},'Reset Push1'),
    el('button',{class:'btn',onclick:()=>{Store.setSportCycle({anchorDate:Store.today(),anchorType:'pull1'}); rerender();}},'Reset Pull1'),
    el('button',{class:'btn',onclick:()=>{Store.setSportCycle({anchorDate:Store.today(),anchorType:'legs1'}); rerender();}},'Reset Legs1')
  ]));
  root.append(subTabs([
    {id:'programme',label:'Programme'}, {id:'library',label:'Bibliothèque'}, {id:'bodyweight',label:'Poids du corps'},
    {id:'flex',label:'Souplesse'}, {id:'history',label:'Historique'}, {id:'tests',label:'Tests'}
  ], panel, id => { panel = id; rerender(); }));
  const box = el('div'); root.append(box);
  ({programme,library,bodyweight,flex,history,tests}[panel] || programme)(box, rerender);
}

function exercise(ex, draft, log=false){
  if(!ex) return el('div',{class:'exercise danger'},'Exercice manquant');
  const saved = draft.exercises?.[ex.id] || {};
  const d = el('div',{class:'exercise ' + (ex.c7Risk === 'medium' ? 'warn' : '')});
  d.append(el('div',{class:'exercise-title'},ex.name));
  d.append(el('div',{class:'exercise-meta'},[
    el('span',{class:'pill'},ex.category), el('span',{class:'pill'},ex.equipment),
    el('span',{class:'pill risk-'+ex.c7Risk},'C7 ' + ex.c7Risk), el('span',{class:'pill'},ex.difficulty)
  ]));
  d.append(el('div',{class:'small muted'},'Progression: ' + ex.progressionRule));
  d.append(el('div',{class:'small muted'},'Alternatives: ' + ex.alternatives.map(id => byId(id)?.name).filter(Boolean).join(' · ')));
  if(log){
    const row = el('div',{class:'row'});
    ['sets','reps','kg','sec','rpe','pain'].forEach(p => {
      const input = el('input',{class:'input',placeholder:p,type:'number',style:'max-width:92px',value:saved[p] || ''});
      input.addEventListener('change', () => {
        const cur = Store.sportDraft();
        cur.exercises = cur.exercises || {};
        cur.exercises[ex.id] = { ...(cur.exercises[ex.id] || {}), [p]: input.value };
        Store.setSportDraft(Store.today(), cur);
      });
      row.append(input);
    });
    d.append(row);
  }
  return d;
}

function programme(root, rerender){
  const type = cycleType();
  const draft = Store.sportDraft();
  const c = card('Séance du jour: ' + type, 'Log réel: sets, reps, kg, secondes, RPE, douleur. Si douleur ≥7, la séance est marquée pain_stop.');
  (SPORT_PROGRAM[type] || []).forEach(id => c.append(exercise(byId(id), draft, true)));
  const notes = el('textarea',{class:'input',rows:'3',placeholder:'Notes séance / douleur / énergie',value:draft.notes || ''});
  notes.addEventListener('change',()=>Store.setSportDraft(Store.today(),{notes:notes.value}));
  c.append(notes);
  c.append(el('div',{class:'row'},[
    el('button',{class:'btn green',onclick:()=>saveSession('completed', rerender)},'Sauver séance terminée'),
    el('button',{class:'btn',onclick:()=>saveSession('skipped', rerender)},'Séance sautée'),
    el('button',{class:'btn',onclick:()=>saveSession('deload', rerender)},'Deload')
  ]));
  root.append(c);
}
function saveSession(status, rerender){
  const draft = Store.sportDraft();
  const vals = Object.values(draft.exercises || {});
  const maxPain = Math.max(0, ...vals.map(x => Number(x.pain || 0)));
  const finalStatus = maxPain >= 7 ? 'pain_stop' : status;
  Store.addSportSession({date:Store.today(),sessionType:cycleType(),status:finalStatus,exercises:draft.exercises || {},notes:draft.notes || '',globalPainLevel:maxPain});
  Store.setSportDraft(Store.today(),{});
  toast(finalStatus === 'pain_stop' ? 'Pain stop enregistré' : 'Séance sauvegardée');
  rerender();
}

function library(root, rerender){
  const cats = ['all','push','pull','legs','core','bodyweight','mobility','warmup'];
  root.append(subTabs(cats.map(x=>({id:x,label:x})), cat, id=>{cat=id; rerender();}));
  const list = SPORT_LIBRARY.filter(e => cat === 'all' || e.category === cat);
  root.append(card('Bibliothèque', 'Total: ' + SPORT_LIBRARY.length + ' exercices · catégorie: ' + cat));
  list.forEach(e => root.append(exercise(e, {}, false)));
}

function bodyweight(root){
  const data = Store.bodyweight();
  const c = card('Poids du corps', 'Progressions niveau 0-5 + meilleur score.');
  ['pushups','pullups','dips','legs','core','mobility'].forEach(f => {
    const row = el('div',{class:'exercise'});
    row.append(el('b',{},f));
    const lvl = el('input',{class:'input',placeholder:'niveau 0-5',type:'number',value:data[f]?.level || ''});
    const best = el('input',{class:'input',placeholder:'meilleur score',type:'number',value:data[f]?.best || ''});
    const save = el('button',{class:'btn green',onclick:()=>{data[f]={level:Number(lvl.value||0),best:Number(best.value||0),lastTestDate:Store.today()};Store.setBodyweight(data);Store.addBodyweightTest({date:Store.today(),family:f,level:data[f].level,best:data[f].best});toast('Test poids du corps sauvé');}},'Sauver');
    row.append(el('div',{class:'row'},[lvl,best,save])); c.append(row);
  });
  root.append(c);
}

function flex(root){
  const c = card('Souplesse niveaux 0-4', 'Mesures mensuelles + routines.');
  FLEX_LEVELS.forEach(l => c.append(el('div',{class:'exercise'},'Niveau '+l.level+' · '+l.label+' · '+l.routineMin+' min · '+l.milestones.join(' / '))));
  const fields = ['forwardFoldCm','pikeCm','straddleDeg','frontSplitRightCm','frontSplitLeftCm','middleSplitCm','deepSquatSec','bridgeScore'];
  const inputs = {};
  fields.forEach(f => { inputs[f]=el('input',{class:'input',placeholder:f,type:'number'}); c.append(inputs[f]); });
  c.append(el('button',{class:'btn green',onclick:()=>{const m={date:Store.today()};fields.forEach(f=>m[f]=inputs[f].value?Number(inputs[f].value):null);Store.addFlexMeasurement(m);toast('Mesures souplesse sauvées');}},'Sauver mesures'));
  root.append(c);
}

function history(root){
  const c = card('Historique sport','Dernières séances.');
  Store.sportSessions().slice(-30).reverse().forEach(s => c.append(el('div',{class:'exercise ' + (s.status==='pain_stop'?'danger':'')},s.date+' · '+s.sessionType+' · '+s.status+' · douleur '+(s.globalPainLevel ?? 0))));
  root.append(c);
}

function tests(root){
  const c = card('Tests mensuels','Pompes, plank, dead hang, squat, poids.');
  const fields = ['pushupsMax','plankSec','deadHangSec','deepSquatSec','bodyweightKg']; const inputs={};
  fields.forEach(f => { inputs[f]=el('input',{class:'input',placeholder:f,type:'number'}); c.append(inputs[f]); });
  c.append(el('button',{class:'btn green',onclick:()=>{const t={date:Store.today()};fields.forEach(f=>t[f]=inputs[f].value?Number(inputs[f].value):null);Store.addSportMonthlyTest(t);toast('Test mensuel sauvé');}},'Sauver test'));
  Store.sportMonthlyTests().slice(-6).reverse().forEach(t => c.append(el('div',{class:'exercise'},t.date+' · pompes '+(t.pushupsMax??'-')+' · plank '+(t.plankSec??'-')+'s')));
  root.append(c);
}
