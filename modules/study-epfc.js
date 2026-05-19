import { EPFC_YEAR1, EPFC_REMOVED } from '../assets/js/epfc-year1.js';
import * as Store from '../assets/js/store.js';
import { el, card, subTabs, toast } from '../assets/js/ui.js';

let selected = EPFC_YEAR1[0]?.code || 'PRM3';

export function renderEpfcYear1(root, rerender){
  const state = Store.get('epfc_y1_state', {});
  root.append(card('EPFC première année', 'Parcours séquentiel par matière. Une ressource active à la fois. Tu valides des pages/labs, puis la ressource suivante se débloque.'));
  if (EPFC_REMOVED?.length) {
    const archived = card('Archivé / non prioritaire', EPFC_REMOVED.map(x=>x.code+' · '+x.title+' · '+x.reason).join(' | '));
    root.append(archived);
  }
  root.append(resume(state));
  root.append(subTabs(EPFC_YEAR1.map(c=>({id:c.code,label:c.code})), selected, id=>{selected=id;rerender();}));
  const course = EPFC_YEAR1.find(c=>c.code===selected) || EPFC_YEAR1[0];
  renderCourse(root, course, state, rerender);
}

function resume(state){
  const active = nextResume(state);
  const c = card('Mode reprise', active ? active : 'Aucune ressource active. Choisis une matière et démarre la première ressource.');
  c.append(el('div',{class:'small muted'},'Objectif: reprendre exactement où tu t’es arrêté, sans chercher quoi faire.'));
  return c;
}
function nextResume(state){
  for (const course of EPFC_YEAR1) {
    const st = state[course.code] || {};
    const idx = st.activeIndex || 0;
    const r = course.resources[idx];
    if (r) return course.code+' · '+course.title+' → '+r[1]+' · '+(st.progress?.[r[0]]?.current||0)+'/'+(st.progress?.[r[0]]?.total||'?')+' '+r[3];
  }
  return '';
}
function renderCourse(root, course, state, rerender){
  const st = state[course.code] || {activeIndex:0,progress:{},done:{}};
  const activeIndex = st.activeIndex || 0;
  const c = card(course.code+' · '+course.title, course.focus);
  course.resources.forEach((r, i)=>{
    const prog = st.progress?.[r[0]] || {current:0,total:0};
    const locked = i > activeIndex;
    const done = !!st.done?.[r[0]];
    const row = el('div',{class:'exercise '+(locked?'warn':done?'ok':'')});
    row.append(el('div',{class:'exercise-title'},(locked?'🔒 ':done?'✅ ':'🎯 ')+r[1]));
    row.append(el('div',{class:'small muted'},r[2]+' · unité: '+r[3]+' · '+prog.current+'/'+(prog.total||'?')));
    row.append(el('div',{class:'progress'},el('div',{class:'bar',style:'width:'+percent(prog.current,prog.total)+'%'})));
    if (!locked && !done) row.append(resourceControls(course, r, prog, state, rerender));
    c.append(row);
  });
  c.append(exercisePack(course, state, rerender));
  root.append(c);
}
function resourceControls(course, r, prog, state, rerender){
  const total = input('total '+r[3], 'number', prog.total || '');
  const add = input('+ pages/labs faits', 'number', '');
  return el('div',{class:'row'},[
    total,
    add,
    el('button',{class:'btn',onclick:()=>{saveProgress(course.code,r[0],Number(add.value||0),Number(total.value||0),false,state);toast('Progression sauvée');rerender();}},'Valider progression'),
    el('button',{class:'btn green',onclick:()=>{saveProgress(course.code,r[0],Number(add.value||0),Number(total.value||0),true,state);toast('Ressource terminée, suivante débloquée');rerender();}},'Terminer et débloquer suivant')
  ]);
}
function saveProgress(code,resId,delta,total,finish,state){
  const st = state[code] || {activeIndex:0,progress:{},done:{}};
  st.progress = st.progress || {}; st.done = st.done || {};
  const cur = st.progress[resId] || {current:0,total:0};
  cur.total = total || cur.total || 0;
  cur.current = finish ? (cur.total || cur.current + delta) : cur.current + delta;
  st.progress[resId] = cur;
  if (finish || (cur.total && cur.current >= cur.total)) { st.done[resId] = true; st.activeIndex = Math.min((st.activeIndex||0)+1, 99); }
  state[code]=st;
  Store.set('epfc_y1_state', state);
  Store.push('study_activity',{domain:'epfc',course:code,resourceId:resId,delta,total:cur.total,finished:!!st.done[resId],date:Store.today()});
}
function exercisePack(course, state, rerender){
  const box = el('div',{class:'exercise'});
  box.append(el('div',{class:'exercise-title'},'Exercices liés à la matière'));
  (course.exercises||[]).forEach(x=>box.append(el('button',{class:'btn',onclick:()=>{Store.push('study_exercises',{course:course.code,source:'EPFC year 1',type:'exercise',title:x,difficulty:'course',status:'todo'});toast('Exercice ajouté');}},x)));
  return box;
}
function input(p,t='text',v=''){ return el('input',{class:'input',placeholder:p,type:t,value:v,style:'max-width:160px'}); }
function percent(a,b){ return b ? Math.min(100,Math.round(Number(a||0)/Number(b||1)*100)) : 0; }
