import * as Store from '../assets/js/store.js';
import { el, card } from '../assets/js/ui.js';

const W={N1:50,N2:30,N3:15,bonus:10};
const N1=['work','school','brief','epfc','nl','review','supp_morning','supp_evening','exam','fuel_water','fuel_protein'];
const N2=['coding','ai','iot','repair','proof','vinted','supp_focus','savings','finance','focus'];
const N3=['sport','admin','chess','reading','mobility'];
const D={work:'routine',school:'routine',brief:'routine',review:'routine',epfc:'étude',nl:'langues',coding:'tech',ai:'tech',iot:'tech',repair:'tech',proof:'étude',vinted:'argent',savings:'argent',finance:'argent',sport:'sport',mobility:'sport',chess:'loisir',reading:'loisir',fuel_water:'fuel',fuel_protein:'fuel'};
const DONE=new Set(['done','completed','validated','deload']);

export function priority(id){if(N1.includes(id))return'N1';if(N2.includes(id))return'N2';return'N3'}
export function xpFor(id){return W[priority(id)]||W.bonus}
export function domainFor(id,fallback='routine'){return D[id]||fallback}
export function rankFor(xp){if(xp<500)return{rank:'Recrue',level:1,next:500};if(xp<1500)return{rank:'Bronze',level:2,next:1500};if(xp<3500)return{rank:'Argent',level:3,next:3500};if(xp<7000)return{rank:'Or',level:4,next:7000};if(xp<12000)return{rank:'Platine',level:5,next:12000};if(xp<20000)return{rank:'Diamant',level:6,next:20000};if(xp<35000)return{rank:'Élite',level:7,next:35000};return{rank:'Ultime',level:8,next:null}}
function add(items,seen,id,domain,prio,xp){if(seen.has(id))return 0;seen.add(id);items.push({id,domain,priority:prio,xp});return xp}
function dateMinus(days){const d=new Date(Store.today()+'T12:00:00');d.setDate(d.getDate()-days);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
export function lastDays(count=7){return Array.from({length:count},(_,index)=>dateMinus(count-index-1))}
export function dailyScore(date=Store.today()){
  let xp=0;const items=[];const seen=new Set();
  const routine=Store.get('routine_'+date,{done:{}});const home=Store.get('home_'+date,{done:{}});
  [{...routine.done,...home.done}].forEach(map=>Object.entries(map||{}).forEach(([id,done])=>{if(done){const p=priority(id);xp+=add(items,seen,id,domainFor(id),p,xpFor(id))}}));
  Object.values(Store.actions(date)).forEach(action=>{if(DONE.has(action.status)){const p=action.priority||priority(action.id);xp+=add(items,seen,action.id,action.domain||domainFor(action.id),p,xpFor(action.id))}});
  const fuel=Store.get('fuel_'+date,{water:0,protein:0});if((+fuel.water||0)>=3000)xp+=add(items,seen,'water','fuel','N2',25);if((+fuel.protein||0)>=150)xp+=add(items,seen,'protein','fuel','N2',25);
  Store.sportSessions().filter(session=>session.date===date).forEach(session=>{if(['completed','deload'].includes(session.status))xp+=add(items,seen,'sport','sport','N3',session.status==='completed'?40:25)});
  Store.get('study_activity',[]).filter(item=>item.date===date).forEach(item=>{const id=item.domain==='nl'?'nl':item.domain==='epfc'?'epfc':item.domain;if(['coding','ai','iot','repair'].includes(id))xp+=add(items,seen,id,'tech','N2',Math.min(45,+item.minutes||25));else if(['epfc','nl'].includes(id))xp+=add(items,seen,id,id==='nl'?'langues':'étude','N1',30);else if(item.kind==='fallback')xp+=add(items,seen,'study_fallback','étude','N2',10)});
  Store.get('savings_history',[]).filter(item=>item.date===date&&(+item.amount||0)>0).forEach(()=>{xp+=add(items,seen,'savings','argent','N2',30)});
  Store.get('chess_elo_history',[]).filter(item=>item.date===date).forEach(()=>{xp+=add(items,seen,'chess','loisir','N3',15)});
  Store.get('reading_activity',[]).filter(item=>item.date===date).forEach(item=>{xp+=add(items,seen,'reading','loisir','N3',Math.min(30,Math.ceil((+item.pages||0)/5)*5)+(item.finished?30:0))});
  return{date,xp,items};
}
export function knownDates(){const dates=new Set([Store.today()]);Object.keys(Store.all()).forEach(key=>{const match=key.match(/(\d{4}-\d{2}-\d{2})/);if(match)dates.add(match[1])});Store.sportSessions().forEach(item=>item.date&&dates.add(item.date));['study_activity','savings_history','reading_activity','action_events'].forEach(key=>Store.get(key,[]).forEach(item=>item.date&&dates.add(item.date)));return[...dates].sort()}
export function totalXp(){return knownDates().reduce((sum,date)=>sum+dailyScore(date).xp,0)}
export function weekXp(){return lastDays(7).reduce((sum,date)=>sum+dailyScore(date).xp,0)}
export function domainScore(days=lastDays(7)){const out={routine:0,étude:0,tech:0,langues:0,sport:0,fuel:0,argent:0,loisir:0};days.forEach(date=>dailyScore(date).items.forEach(item=>{out[item.domain]=(out[item.domain]||0)+item.xp}));return out}
export function priorityScore(days=lastDays(7)){const out={N1:0,N2:0,N3:0};days.forEach(date=>dailyScore(date).items.forEach(item=>{if(out[item.priority]!==undefined)out[item.priority]++}));return out}
function proofDone(date,course){return Store.get('proofs',[]).some(item=>(item.date===date||item.dueDate===date)&&item.course===course&&item.status==='validated')}
function pillarDay(date){const fuel=Store.get('fuel_'+date,{water:0,protein:0});const study=Store.get('study_activity',[]).some(item=>item.date===date)||Store.actionDone('epfc',date)||Store.actionDone('nl',date);const health=(+fuel.water||0)>=1500&&(+fuel.protein||0)>=80||Store.sportSessions().some(item=>item.date===date&&['completed','deload'].includes(item.status))||proofDone(date,'santé/sport');const money=Store.actionDone('vinted',date)||Store.actionDone('savings',date)||Store.get('savings_history',[]).some(item=>item.date===date&&(+item.amount||0)>0)||proofDone(date,'argent/admin');return{health,study,money}}
export function pillarScore(days=lastDays(14)){const total={health:0,study:0,money:0};days.forEach(date=>{const row=pillarDay(date);Object.keys(total).forEach(key=>{if(row[key])total[key]++})});return total}
export function weakDomains(){const s=pillarScore();return[['santé',s.health],['étude',s.study],['argent',s.money]].filter(([,value])=>value<4).sort((a,b)=>a[1]-b[1]).map(([domain,xp])=>({domain,xp}))}
export function globalScore(){const s=pillarScore();return Math.round((s.health+s.study+s.money)/42*100)}
export function streak(type='daily'){const dates=lastDays(14).reverse();let count=0;for(const date of dates){const row=pillarDay(date);const ok=type==='sport'?row.health:type==='study'?row.study:type==='n1'?dailyScore(date).items.some(item=>item.priority==='N1'):dailyScore(date).xp>0;if(ok)count++;else break}return count}
export function gameSummary(){const xp=totalXp();const rank=rankFor(xp);const today=dailyScore();const pillars=pillarScore();return{xp,rank:rank.rank,level:rank.level,next:rank.next,todayXp:today.xp,weekXp:weekXp(),global:globalScore(),domains:domainScore(),pillars,weak:weakDomains(),items:today.items,streakDaily:streak('daily'),streakN1:streak('n1'),streakSport:streak('sport'),streakStudy:streak('study'),activeDays14:Store.recentActionDays(14).length}}
export function renderGameCard(){const game=gameSummary();const pct=game.next?Math.min(100,Math.round(game.xp/game.next*100)):100;const c=card('XP / Rythme','Score 14 jours '+game.global+'/100 · rang '+game.rank+' · niveau '+game.level);c.append(el('div',{class:'progress'},el('div',{class:'bar',style:'width:'+pct+'%'})));c.append(el('div',{class:'small muted'},'Rythme '+game.activeDays14+'/14 jours · santé '+game.pillars.health+'/14 · étude '+game.pillars.study+'/14 · argent '+game.pillars.money+'/14'));return c}
export function nextRoutineAction(plan,done){return plan.find(item=>!done[item.id])||null}
