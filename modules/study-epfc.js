import { EPFC_YEAR1, EPFC_REMOVED } from '../assets/js/epfc-year1.js';
import { EPFC_DAILY_ROTATION } from '../assets/js/practice-catalog.js';
import * as Store from '../assets/js/store.js';
import { el, card, subTabs, toast } from '../assets/js/ui.js';
let selected = EPFC_YEAR1[0]?.code || 'PRM3';
function dayIndex(){ const d=new Date(); const start=new Date(d.getFullYear(),0,1); return Math.floor((d-start)/86400000); }
function courseByCode(code){ return EPFC_YEAR1.find(c=>c.code===code) || EPFC_YEAR1[0]; }
function courseOfDay(){ return courseByCode(EPFC_DAILY_ROTATION[dayIndex()%EPFC_DAILY_ROTATION.length]); }
export function renderEpfcYear1(root, rr){
 const state=Store.get('epfc_y1_state',{}); const todayCourse=courseOfDay(); selected=selected||todayCourse.code;
 const top=card('EPFC première année','Règle: une matière EPFC par jour. Hors EPFC: Practice quotidien séparé pour Coding/IA/IoT/Réparation.');
 top.append(el('div',{class:'exercise ok'},'Matière EPFC du jour: '+todayCourse.code+' · '+todayCourse.title));
 top.append(el('button',{class:'btn primary',onclick:()=>{selected=todayCourse.code;rr();}},'Ouvrir matière du jour'));
 root.append(top);
 if(EPFC_REMOVED?.length)root.append(card('Archivé / non prioritaire',EPFC_REMOVED.map(x=>x.code+' · '+x.title).join(' | ')));
 root.append(resume(state));
 root.append(subTabs(EPFC_YEAR1.map(c=>({id:c.code,label:c.code})),selected,id=>{selected=id;rr();}));
 renderCourse(root,courseByCode(selected),state,rr);
}
function resume(state){const r=nextResume(state);return card('Mode reprise EPFC',r||'Aucune progression. Démarre la première ressource de la matière du jour.')}
function nextResume(state){for(const c of EPFC_YEAR1){const st=state[c.code]||{};const idx=st.activeIndex||0;const r=c.resources[idx];if(r)return c.code+' · '+c.title+' → '+r[1]+' · '+(st.progress?.[r[0]]?.current||0)+'/'+(st.progress?.[r[0]]?.total||'?')+' '+r[3]}return''}
function renderCourse(root,c,state,rr){const st=state[c.code]||{activeIndex:0,progress:{},done:{}};const activeIndex=st.activeIndex||0;const box=card(c.code+' · '+c.title,c.focus);c.resources.forEach((r,i)=>{const p=st.progress?.[r[0]]||{current:0,total:0};const locked=i>activeIndex,done=!!st.done?.[r[0]];const row=el('div',{class:'exercise '+(locked?'warn':done?'ok':'')});row.append(el('div',{class:'exercise-title'},(locked?'🔒 ':done?'✅ ':'🎯 ')+r[1]));row.append(el('div',{class:'small muted'},r[2]+' · unité: '+r[3]+' · '+p.current+'/'+(p.total||'?')));row.append(el('div',{class:'progress'},el('div',{class:'bar',style:'width:'+percent(p.current,p.total)+'%'})));if(!locked&&!done)row.append(controls(c.code,r,p,state,rr));box.append(row)});box.append(exercisePack(c,rr));root.append(box)}
function controls(code,r,p,state,rr){const total=input('total '+r[3],'number',p.total||''),add=input('+ faits','number','');return el('div',{class:'row'},[total,add,el('button',{class:'btn',onclick:()=>{saveProgress(code,r[0],Number(add.value||0),Number(total.value||0),false,state);toast('Progression sauvée');rr()}},'Valider'),el('button',{class:'btn green',onclick:()=>{saveProgress(code,r[0],Number(add.value||0),Number(total.value||0),true,state);toast('Suivant débloqué');rr()}},'Terminer')])}
function saveProgress(code,resId,delta,total,finish,state){const st=state[code]||{activeIndex:0,progress:{},done:{}};st.progress=st.progress||{};st.done=st.done||{};const cur=st.progress[resId]||{current:0,total:0};cur.total=total||cur.total||0;cur.current=finish?(cur.total||cur.current+delta):cur.current+delta;st.progress[resId]=cur;if(finish||(cur.total&&cur.current>=cur.total)){st.done[resId]=true;st.activeIndex=Math.min((st.activeIndex||0)+1,99)}state[code]=st;Store.set('epfc_y1_state',state);Store.push('study_activity',{domain:'epfc',course:code,resourceId:resId,delta,total:cur.total,finished:!!st.done[resId],date:Store.today()})}
function exercisePack(c,rr){const box=el('div',{class:'exercise'});box.append(el('div',{class:'exercise-title'},'Exercices liés à la matière'));(c.exercises||[]).forEach(x=>box.append(el('button',{class:'btn',onclick:()=>{Store.push('study_exercises',{course:c.code,source:'EPFC year 1',type:'exercise',title:x,difficulty:'course',status:'todo'});toast('Exercice ajouté')}},x)));return box}
function input(p,t='text',v=''){return el('input',{class:'input',placeholder:p,type:t,value:v,style:'max-width:160px'})}function percent(a,b){return b?Math.min(100,Math.round(Number(a||0)/Number(b||1)*100)):0}
