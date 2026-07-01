import * as Store from '../assets/js/store.js';
import { el, card, kpi, progress, toast } from '../assets/js/ui.js';

const MODES={
  execution:{label:'Exécution',hint:'Un bloc majeur, une action secondaire, une clôture.'},
  normal:{label:'Normal',hint:'Un ordre principal, un maintien, une clôture.'},
  fatigue:{label:'Fatigue',hint:'Charge réduite. Une victoire utile suffit.'},
  minimum:{label:'Minimum vital',hint:'Santé, reprise de 5 minutes, zéro dette morale.'},
  recovery:{label:'Récupération',hint:'Santé, douleur et sommeil avant performance.'},
  reprise:{label:'Reprise',hint:'Après une coupure : une action minuscule, puis on repart.'}
};

function go(route){window.dispatchEvent(new CustomEvent('ud5:navigate',{detail:{route}}))}
function modeForToday(){
  const saved=Store.dayMode();
  if(saved.mode&&saved.mode!=='auto'&&MODES[saved.mode])return saved.mode;
  const routine=Store.get('routine_'+Store.today(),{cfg:{}});
  const fatigue=Number(routine.cfg?.fatigue||3);
  const latest=Store.sportSessions().slice(-1)[0];
  const pain=Number(latest?.globalPain||latest?.globalPainLevel||0);
  const studyDays=studyDates(3).length;
  const active=Store.recentActionDays(3).length;
  if(pain>=7)return'recovery';
  if(fatigue>=5)return'minimum';
  if(fatigue>=4)return'fatigue';
  if(active===0&&studyDays===0)return'reprise';
  return'normal';
}
function studyDates(days=14){
  const start=new Date(Store.today()+'T12:00:00');
  return [...new Set(Store.get('study_activity',[]).filter(item=>item.date).map(item=>item.date).filter(date=>{const delta=Math.floor((start-new Date(date+'T12:00:00'))/86400000);return delta>=0&&delta<days}))];
}
function sportsToday(){return Store.sportSessions().some(session=>session.date===Store.today()&&['completed','deload'].includes(session.status))}
function sportType(){const cycle=['Push A','Pull A','Legs A','Rest A','Push B','Pull B','Legs B','Rest B'];const state=Store.sportCycle();const start=Math.max(0,cycle.indexOf(state.anchorType));const delta=Math.floor((new Date(Store.today()+'T12:00:00')-new Date(state.anchorDate+'T12:00:00'))/86400000);return cycle[(start+((delta%cycle.length)+cycle.length)%cycle.length)%cycle.length]}
function isRest(){return sportType().startsWith('Rest')}
function staleVinted(){return Store.get('vinted_items',[]).filter(item=>item.status!=='sold'&&item.status!=='abandoned').filter(item=>Math.floor((new Date(Store.today())-new Date(item.listedAt||Store.today()))/86400000)>=14).length}
function moneyDone(){return Store.actionDone('vinted')||Store.actionDone('savings')}
function done(task){return Store.actionDone(task.id)||Store.actionDone(task.id+'_fallback')}
function addFuel(kind,amount,id,title){const key='fuel_'+Store.today();const fuel=Store.get(key,{water:0,protein:0});fuel[kind]=Math.max(0,Number(fuel[kind]||0)+amount);Store.set(key,fuel);Store.recordAction({id,title,domain:'santé',priority:'N1',minutes:2,status:'done'});if(kind==='protein'&&fuel.protein>=150)Store.ensureProof('santé/sport','Objectif protéines atteint',Store.today(),'today');toast(kind==='water'?'Eau ajoutée':'Protéines ajoutées')}
function completeStudy(id,title,minutes){Store.push('study_activity',{domain:id==='nl'?'nl':'epfc',kind:'today_command',title,date:Store.today(),minutes,status:'done',source:id==='nl'?'NL':'EPFC'});Store.recordAction({id,title,domain:'étude',priority:'N1',minutes,status:'done'});Store.ensureProof('étude',title,Store.today(),'today');toast('Étude validée')}
function completeMoney(id,title){Store.recordAction({id,title,domain:'argent',priority:'N2',minutes:10,status:'done'});Store.ensureProof('argent/admin',title,Store.today(),'today');toast('Action argent validée')}
function completeReview(){const routine=Store.get('routine_'+Store.today(),{done:{},cfg:{}});routine.done={...(routine.done||{}),review:true};Store.set('routine_'+Store.today(),routine);const home=Store.get('home_'+Store.today(),{done:{},notes:''});home.done={...(home.done||{}),review:true};Store.set('home_'+Store.today(),home);Store.recordAction({id:'review',title:'Clôture du jour',domain:'routine',priority:'N1',minutes:2,status:'done'});toast('Clôture enregistrée')}
function mobility(title='Mobilité / marche 10 min'){Store.recordAction({id:'mobility',title,domain:'santé',priority:'N1',minutes:10,status:'done'});Store.ensureProof('santé/sport',title,Store.today(),'today');toast('Mouvement léger validé')}
function healthTask(){const fuel=Store.get('fuel_'+Store.today(),{water:0,protein:0});if(Number(fuel.water||0)<1500)return{id:'fuel_water',title:'Eau · 500 ml maintenant',detail:(fuel.water||0)+'/3000 ml · enlève la friction, bois puis valide.',minutes:2,route:'nutrition',fallback:'Bois 250 ml maintenant.',complete:()=>addFuel('water',500,'fuel_water','Eau · 500 ml')};if(Number(fuel.protein||0)<80)return{id:'fuel_protein',title:'Protéines · 25 g simples',detail:(fuel.protein||0)+'/150 g · skyr, œufs, poulet ou autre source simple.',minutes:5,route:'nutrition',fallback:'Prépare la source de protéines pour le prochain repas.',complete:()=>addFuel('protein',25,'fuel_protein','Protéines · 25 g')};return{id:'health_maintain',title:'Santé · maintien propre',detail:'Eau et protéines déjà lancées. Garde le standard, sans ajouter de règles.',minutes:2,route:'nutrition',fallback:'Bois un verre d’eau.',complete:()=>Store.recordAction({id:'health_maintain',title:'Santé · maintien propre',domain:'santé',priority:'N1',minutes:2,status:'done'})}}
function studyTask(short=false){const id=Store.actionDone('epfc')?'nl':'epfc';const title=id==='epfc'?(short?'EPFC · 5 min de reprise':'EPFC · 25 min utile'):(short?'NL · 5 phrases':'NL / SELOR · 10 min');return{id,title,detail:id==='epfc'?'Ouvre le cours actif. Une question comprise compte.':'Cartes, écoute ou phrases. Une mini-preuve suffit.',minutes:short?5:(id==='epfc'?25:10),route:'study',fallback:id==='epfc'?'Ouvre le cours et lis le prochain titre.':'Fais 5 cartes ou une phrase.',complete:()=>completeStudy(id,title,short?5:(id==='epfc'?25:10)),fallbackComplete:()=>completeStudy(id+'_fallback','Reprise · '+title,5)}}
function sportTask(){const type=sportType();if(isRest())return{id:'mobility',title:'Récupération · Zone 2 ou mobilité',detail:'Jour '+type+'. 30–45 min Zone 2 ou 10 min mobilité selon énergie et douleurs.',minutes:10,route:'sport',fallback:'10 minutes de marche ou mobilité.',complete:()=>mobility('Récupération · '+type),fallbackComplete:()=>mobility('Reprise légère · '+type)};return{id:'sport',title:'Sport · '+type,detail:'La séance complète est dans Sport. Valide uniquement après l’entraînement réel.',minutes:45,route:'sport',fallback:'10 min mobilité ou marche, sans te mentir sur la séance.',openOnly:true,fallbackComplete:()=>mobility('Mobilité de secours · '+type)}}
function moneyTask(){const stale=staleVinted();const id=stale?'vinted':'savings';const title=stale?'Vinted · traiter 1 article':'Argent · vérifier l’épargne du mois';return{id,title,detail:stale?stale+' article(s) ≥14 jours : appliquer une décision, pas de réflexion infinie.':'Une vérification courte : versement, charge ou prochaine action.',minutes:10,route:'money',fallback:'Ouvre Argent et note une seule décision.',complete:()=>completeMoney(id,title),fallbackComplete:()=>completeMoney(id+'_fallback','Reprise · '+title)}}
function closeTask(){return{id:'review',title:'Clôture · demain sécurisé',detail:'Une phrase : blocage, reprise ou prochaine action. Puis tu fermes.',minutes:2,route:'home',fallback:'Écris seulement la première action de demain.',complete:completeReview,fallbackComplete:completeReview}}
function tasksFor(mode){const health=healthTask();const study=studyTask(mode==='fatigue'||mode==='minimum'||mode==='reprise');const sport=sportTask();const money=moneyTask();const close=closeTask();if(mode==='minimum')return[health,study,close];if(mode==='fatigue')return[health,study,close];if(mode==='recovery')return[health,{...sport,id:'mobility',title:'Récupération · mouvement léger',minutes:10,openOnly:false,complete:()=>mobility('Récupération · mouvement léger')},close];if(mode==='reprise')return[health,study,close];if(mode==='execution')return[sport,study,close];return[Store.daysSinceAction('sport')>=4?sport:study,health,close]}
function taskCard(task,index,refresh){const complete=done(task);const c=el('div',{class:'exercise '+(complete?'ok':'')});c.append(el('div',{class:'row'},[el('span',{class:'pill'},index===0?'ORDRE':index===1?'MAINTIEN':'CLÔTURE'),el('span',{class:'pill'},task.minutes+' MIN'),el('b',{},task.title)]));c.append(el('div',{class:'small muted'},task.detail));if(complete){c.append(el('div',{class:'small'},'Validé. Rien à répéter.'));return c}const actions=el('div',{class:'row'});if(task.route)actions.append(el('button',{class:'btn',onclick:()=>go(task.route)},task.openOnly?'Ouvrir la séance':'Ouvrir'));
  if(!task.openOnly&&task.complete)actions.append(el('button',{class:'btn green',onclick:()=>{task.complete();refresh()}},'Valider'));
  actions.append(el('button',{class:'btn warn',onclick:()=>{Store.blockAction(task.id,'Blocage déclaré');refresh()}},'Bloqué'));
  c.append(actions);
  const status=Store.action(task.id);
  if(status?.status==='blocked'||status?.status==='deferred'){
    const fallback=el('div',{class:'exercise warn'});fallback.append(el('div',{class:'small'},'Version minimale : '+task.fallback));fallback.append(el('div',{class:'row'},[
      el('button',{class:'btn green',onclick:()=>{(task.fallbackComplete||task.complete)?.();Store.recordAction({id:task.id+'_fallback',title:'Fallback · '+task.title,domain:'reprise',minutes:5,status:'done'});refresh()}},'Faire 5 min'),
      el('button',{class:'btn',onclick:()=>{Store.deferAction(task.id,'Report sans dette');toast('Reporté sans pénalité');refresh()}},'Reporter sans dette')
    ]));c.append(fallback)
  }
  return c}
function modeBar(mode,refresh){const c=card('Mode du jour',MODES[mode].label+' · '+MODES[mode].hint,'span-12');const row=el('div',{class:'row'});row.append(el('button',{class:'btn '+(Store.dayMode().mode==='auto'?'green':''),onclick:()=>{Store.setDayMode('auto');refresh()}},'Auto'));['execution','normal','fatigue','minimum','recovery','reprise'].forEach(id=>row.append(el('button',{class:'btn '+(mode===id&&Store.dayMode().mode===id?'green':''),onclick:()=>{Store.setDayMode(id);refresh()}},MODES[id].label)));c.append(row);return c}
function rhythm(){const actionDays=Store.recentActionDays(14).length;const sportDays=[...new Set(Store.sportSessions().filter(item=>['completed','deload'].includes(item.status)).map(item=>item.date).filter(Boolean))].filter(date=>Math.floor((new Date(Store.today()+'T12:00:00')-new Date(date+'T12:00:00'))/86400000)<14).length;const study=studyDates(14).length;const money=Store.actionHistory(1200).filter(item=>item.date&&['vinted','savings'].includes(item.id)&&['done','completed','validated','deload'].includes(item.status)).map(item=>item.date).filter((date,index,list)=>list.indexOf(date)===index).length;return{actionDays,sportDays,study,money}}
export function renderToday(root,refresh){const mode=modeForToday();const tasks=tasksFor(mode);const completed=tasks.filter(done).length;const c=card('AUJOURD’HUI','Tu ne choisis pas entre dix écrans. Tu exécutes une chose, puis la suivante.','span-12 module-hero '+(mode==='minimum'||mode==='recovery'?'warn':'ok'));c.append(el('div',{class:'grid'},[kpi('Mode',MODES[mode].label,'adapté au contexte',mode==='minimum'||mode==='recovery'?'warn':'ok'),kpi('Mission',completed+'/'+tasks.length,'trois actions maximum',completed===tasks.length?'ok':'warn'),kpi('Reprise',Store.recentActionDays(14).length+'/14 jours','on mesure le rythme, pas une série fragile','ok')]));c.append(progress(completed,tasks.length));root.append(c);root.append(modeBar(mode,refresh));const queue=card('Ordre du jour','Commence par la première carte. Le reste attend.','span-12');tasks.forEach((task,index)=>queue.append(taskCard(task,index,refresh)));root.append(queue);const r=rhythm();const rail=el('div',{class:'grid'});rail.append(kpi('Rythme 14j',r.actionDays+'/14','jours avec action utile',r.actionDays<5?'warn':'ok'));rail.append(kpi('Étude 14j',r.study+'/14','activité enregistrée',r.study<3?'warn':'ok'));rail.append(kpi('Sport 14j',r.sportDays+'/14','séances réelles',r.sportDays<2?'warn':'ok'));rail.append(kpi('Argent 14j',r.money+'/14','décisions enregistrées',r.money<1?'warn':'ok'));root.append(rail)}
