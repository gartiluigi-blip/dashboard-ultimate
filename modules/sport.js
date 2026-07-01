const STORAGE_KEY='ud5_sport_clean_v1';
const LEGACY_KEYS=['ud5_sport_recovery_v1','ud5_sport_cycle','ud5_sport_sessions','ud5_bodyweight_progress','ud5_bodyweight_tests','ud5_sport_monthly_tests'];
const DAY_MS=86400000;

const CYCLE=['Push A','Pull A','Legs A','Rest A','Push B','Pull B','Legs B','Rest B'];

const PROGRAM={
  'Push A':{
    focus:'Pompes prioritaires · pectoraux, triceps, deltoïdes, dentelé',
    exercises:[
      ex('pushups','Pompes progressives',4,'5–8','reps','Mouvement prioritaire · choisis une variante qui garde 1–2 RIR.'),
      ex('incline_db_press','Développé incliné haltères',2,'6–10'),
      ex('lateral_raise','Élévations latérales',3,'12–20'),
      ex('cable_fly','Écarté poulie',2,'10–15'),
      ex('rope_pressdown','Extension triceps corde',2,'10–15'),
      ex('scapular_pushup','Scapular push-up',2,'12–20','reps','Contrôle du dentelé; aucune répétition bâclée.')
    ]
  },
  'Pull A':{
    focus:'Tractions prioritaires · dos, trapèzes, arrière d’épaule, biceps, grip',
    exercises:[
      ex('pullups','Tractions pronation progressives',4,'3–6','reps','Mouvement prioritaire · assistance ou négatives propres si nécessaire.'),
      ex('chest_supported_row','Rowing poitrine appuyée',3,'6–10'),
      ex('face_pull','Face pull',2,'12–20','reps','Trapèzes moyens/inférieurs et arrière d’épaule.'),
      ex('reverse_pec_deck','Reverse pec-deck',2,'12–20'),
      ex('incline_curl','Curl incliné',2,'8–12'),
      ex('farmer_carry','Farmer carry',2,'30–45 sec','time','Grip, avant-bras, trapèzes et gainage.')
    ]
  },
  'Legs A':{
    focus:'Quadriceps, ischios, fessiers, mollets debout, tibial, obliques',
    exercises:[
      ex('leg_press','Presse à cuisses',3,'6–10'),
      ex('bulgarian_split_squat','Bulgarian split squat',2,'8–10 / jambe'),
      ex('seated_leg_curl','Leg curl assis',3,'8–12'),
      ex('hip_thrust','Hip thrust',2,'8–12'),
      ex('standing_calf_raise','Mollets debout',3,'8–15'),
      ex('tibialis_raise','Tibialis raise',2,'15–25'),
      ex('pallof_press','Pallof press',2,'10–15 / côté')
    ]
  },
  'Rest A':{
    focus:'Récupération active. Aucun travail lourd.',
    recovery:['Zone 2 vélo ou marche inclinée · 30–45 min','Mobilité : hanches, chevilles et thoracique.','Pas de travail lourd.']
  },
  'Push B':{
    focus:'Dips prioritaires · pectoraux, triceps, épaules, dentelé',
    exercises:[
      ex('dips','Dips progressifs',4,'3–6','reps','Mouvement prioritaire · assistance si la technique ou les épaules ne sont pas propres.'),
      ex('pike_pushup','Pike push-up progressif',3,'5–8'),
      ex('flat_db_press','Développé haltères plat',2,'6–10'),
      ex('cable_lateral_raise','Élévations latérales',3,'12–20'),
      ex('overhead_triceps','Extension triceps au-dessus de la tête',2,'10–15'),
      ex('wall_slides','Wall slides',2,'10–15','reps','Dentelé et contrôle scapulaire.')
    ]
  },
  'Pull B':{
    focus:'Chin-ups prioritaires · dos, bras, arrière d’épaule, avant-bras',
    exercises:[
      ex('chinups','Chin-ups progressifs',4,'3–6','reps','Mouvement prioritaire · assistance ou négatives propres si nécessaire.'),
      ex('seal_row','Seal row',3,'8–12'),
      ex('straight_arm_pulldown','Pullover poulie bras tendus',2,'10–15'),
      ex('rear_delt_fly','Oiseau poulie / reverse pec-deck',2,'12–20'),
      ex('hammer_curl','Curl marteau',2,'8–12'),
      ex('pronation_supination','Pronation / supination',2,'12–15 / côté')
    ],
    neck:'Nuque : seulement 2 tours isométriques très légers, 10–15 sec dans chaque direction, uniquement si validé par ton soignant. Arrêt immédiat si douleur irradiée, engourdissement ou fourmillements.'
  },
  'Legs B':{
    focus:'Chaîne postérieure, adducteurs, mollets assis, abdos, obliques',
    exercises:[
      ex('romanian_deadlift','Romanian deadlift',3,'6–10'),
      ex('reverse_lunge','Fentes arrière',2,'8–12 / jambe'),
      ex('nordic_assisted','Nordic curl assisté',2,'4–8'),
      ex('adductor_machine','Adducteurs machine',2,'10–15'),
      ex('seated_calf_raise','Mollets assis',3,'10–20'),
      ex('reverse_crunch','Reverse crunch',2,'10–15'),
      ex('side_plank','Side plank',2,'25–45 sec / côté','time')
    ]
  },
  'Rest B':{
    focus:'Récupération selon fatigue et douleurs.',
    recovery:['Zone 2 ou repos complet selon fatigue et douleurs.','Mobilité : hanches, chevilles et thoracique.','Pas de travail lourd.']
  }
};

const COVERAGE=[
  ['Pectoraux','Pompes, développé incliné/plat, dips, écarté poulie'],
  ['Dos / dorsaux','Tractions, chin-ups, rowings, pullover'],
  ['Trapèzes','Face pull, rowing, farmer carry'],
  ['Épaules','Pike push-up, élévations latérales, face pull, oiseau'],
  ['Triceps','Pompes, dips, extensions corde et au-dessus de la tête'],
  ['Biceps / avant-bras / grip','Tractions, chin-ups, curls, farmer carry, pronation/supination'],
  ['Quadriceps','Presse, Bulgarian split squat, fentes arrière'],
  ['Ischios / fessiers','Leg curl, hip thrust, Romanian deadlift, Nordic curl'],
  ['Mollets','Debout : gastrocnémien · assis : soléaire'],
  ['Tibial / adducteurs','Tibialis raise et machine adducteurs'],
  ['Abdos / obliques','Pallof press, reverse crunch, side plank'],
  ['Nuque','Isométrie légère séparée, uniquement si validée médicalement']
];

let panel='session';

function ex(id,name,sets,target,kind='reps',note=''){return{id,name,sets,target,kind,note}}
function localDate(){const d=new Date();const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day}
function cleanLegacy(){
  try{
    LEGACY_KEYS.forEach(key=>localStorage.removeItem(key));
    for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key&&key.startsWith('ud5_sport_draft_'))localStorage.removeItem(key)}
  }catch(error){console.error('Legacy sport cleanup failed',error)}
}
function defaultState(){return{version:'sport-clean-v1',anchorDate:localDate(),anchorType:'Push A',sessions:[],drafts:{},legacyPurged:true}}
function read(){
  cleanLegacy();
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return defaultState();
    const value=JSON.parse(raw);
    return{
      ...defaultState(),
      ...value,
      anchorType:CYCLE.includes(value.anchorType)?value.anchorType:'Push A',
      sessions:Array.isArray(value.sessions)?value.sessions:[],
      drafts:value.drafts&&typeof value.drafts==='object'?value.drafts:{}
    };
  }catch(error){return defaultState()}
}
function write(state){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({...state,version:'sport-clean-v1',legacyPurged:true}))}
  catch(error){console.error('Sport save failed',error)}
}
function dayNumber(date){return Math.floor(new Date(date+'T12:00:00').getTime()/DAY_MS)}
function currentType(state){
  const anchor=Math.max(0,CYCLE.indexOf(state.anchorType));
  const elapsed=dayNumber(localDate())-dayNumber(state.anchorDate);
  const offset=((elapsed%CYCLE.length)+CYCLE.length)%CYCLE.length;
  return CYCLE[(anchor+offset)%CYCLE.length];
}
function currentDraft(state){
  const date=localDate();
  state.drafts[date]=state.drafts[date]||{globalPain:'0',energy:'3',notes:'',exercises:{}};
  state.drafts[date].exercises=state.drafts[date].exercises||{};
  return state.drafts[date];
}
function rowsFor(exercise){return Array.from({length:exercise.sets},()=>({reps:'',kg:'',rir:'',pain:''}))}
function exerciseDraft(draft,exercise){
  draft.exercises[exercise.id]=draft.exercises[exercise.id]||{sets:rowsFor(exercise)};
  const row=draft.exercises[exercise.id];
  while(row.sets.length<exercise.sets)row.sets.push({reps:'',kg:'',rir:'',pain:''});
  row.sets=row.sets.slice(0,exercise.sets);
  return row;
}
function clamp(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
function previousExercise(state,id){
  for(let i=state.sessions.length-1;i>=0;i--){const found=state.sessions[i].exercises&&state.sessions[i].exercises[id];if(found)return{date:state.sessions[i].date,sets:found.sets||[]}}
  return null;
}
function previousText(previous,kind){
  if(!previous||!previous.sets.length)return'Première séance enregistrée.';
  const text=previous.sets.map(set=>{
    const main=kind==='time'?(set.reps?set.reps+' sec':'—'):(set.reps||'—')+(set.kg?' × '+set.kg+' kg':'');
    return main;
  }).join(' · ');
  return 'Dernière · '+previous.date+' · '+text;
}
function node(tag,attrs={},children=[]){
  const el=document.createElement(tag);
  Object.entries(attrs||{}).forEach(([key,value])=>{
    if(value===undefined||value===null||value===false)return;
    if(key==='class')el.className=value;
    else if(key==='style')el.setAttribute('style',value);
    else if(key.startsWith('on')&&typeof value==='function')el.addEventListener(key.slice(2),value);
    else el.setAttribute(key,value===true?'':String(value));
  });
  const list=Array.isArray(children)?children:[children];
  list.filter(value=>value!==undefined&&value!==null&&value!==false).forEach(value=>el.append(value&&value.nodeType?value:document.createTextNode(String(value))));
  return el;
}
function makeCard(title,subtitle='',cls=''){
  const card=node('section',{class:'card '+cls});
  card.append(node('div',{class:'card-head'},node('h2',{},title)));
  if(subtitle)card.append(node('div',{class:'muted'},subtitle));
  return card;
}
function button(label,handler,cls=''){return node('button',{class:'btn '+cls,type:'button',onclick:handler},label)}
function showToast(message){const toast=document.querySelector('#toast');if(!toast)return;toast.textContent=message;toast.classList.add('show');clearTimeout(window.__sportToast);window.__sportToast=setTimeout(()=>toast.classList.remove('show'),1900)}

export function renderSport(root,refresh){
  const state=read();
  const type=currentType(state);
  root.append(cycleCard(state,type,refresh));
  root.append(node('div',{class:'subtabs',role:'tablist'},[
    tab('session','Séance',refresh),tab('coverage','Couverture',refresh),tab('progress','Progression',refresh),tab('history','Historique',refresh)
  ]));
  if(panel==='coverage')root.append(coveragePanel());
  else if(panel==='progress')root.append(progressPanel(state));
  else if(panel==='history')root.append(historyPanel(state));
  else root.append(sessionPanel(state,type,refresh));
}
function tab(id,label,refresh){return button(label,()=>{panel=id;refresh()},'subtab '+(panel===id?'active':''))}
function cycleCard(state,type,refresh){
  const card=makeCard('Cycle PPL · '+type,'Pompes, tractions, dips et chin-ups restent prioritaires dans cet ordre précis.','span-12');
  const row=node('div',{class:'row'});
  const select=node('select',{class:'input',style:'max-width:220px'});
  CYCLE.forEach(item=>select.append(node('option',{value:item},item)));
  select.value=type;
  row.append(node('span',{class:'pill'},'AUJOURD’HUI · '+type),select,button('Démarrer ici',()=>{
    state.anchorDate=localDate();state.anchorType=select.value;write(state);showToast('Cycle redémarré · '+select.value);refresh();
  },'green'));
  card.append(row);
  return card;
}
function sessionPanel(state,type,refresh){
  const plan=PROGRAM[type];
  const draft=currentDraft(state);
  const card=makeCard('Séance · '+type,plan.focus,'span-12');
  if(plan.recovery){
    const list=node('div',{});
    plan.recovery.forEach((item,index)=>{
      const row=node('div',{class:'exercise'});
      row.append(node('div',{class:'row'},[node('span',{class:'pill'},String(index+1).padStart(2,'0')),node('b',{},item)]));
      list.append(row);
    });
    card.append(list);
  }else{
    plan.exercises.forEach((exercise,index)=>card.append(exerciseCard(state,draft,exercise,index)));
    if(plan.neck)card.append(node('div',{class:'exercise warn'},[node('b',{},'Nuque'),node('div',{class:'small muted'},plan.neck)]));
  }
  const inputs=node('div',{class:'row'});
  const pain=numberInput('Douleur globale 0–10',draft.globalPain,0,10);
  const energy=numberInput('Énergie 1–5',draft.energy,1,5);
  const notes=node('textarea',{class:'input',rows:'3',placeholder:'Notes · charge · douleur · variante'},draft.notes||'');
  function saveDraft(){draft.globalPain=pain.value;draft.energy=energy.value;draft.notes=notes.value;write(state)}
  pain.addEventListener('change',saveDraft);energy.addEventListener('change',saveDraft);notes.addEventListener('change',saveDraft);
  inputs.append(pain,energy);card.append(inputs,notes);
  const actions=node('div',{class:'row'});
  actions.append(
    button('Séance validée',()=>saveSession(state,type,'completed',refresh),'green'),
    button('Séance allégée',()=>saveSession(state,type,'deload',refresh),'warn'),
    button('Sautée',()=>saveSession(state,type,'skipped',refresh))
  );
  card.append(actions);
  return card;
}
function exerciseCard(state,draft,exercise,index){
  const entry=exerciseDraft(draft,exercise);
  const card=node('section',{class:'exercise'});
  card.append(node('div',{class:'row'},[
    node('span',{class:'pill'},String(index+1).padStart(2,'0')),
    index===0?node('span',{class:'pill'},'PRIORITÉ'):null,
    node('b',{},exercise.name)
  ]));
  card.append(node('div',{class:'small'},exercise.sets+' séries · '+exercise.target+(exercise.kind==='time'?' · durée':'')+' · 1–2 RIR'));
  if(exercise.note)card.append(node('div',{class:'small muted'},exercise.note));
  card.append(node('div',{class:'small muted'},previousText(previousExercise(state,exercise.id),exercise.kind)));
  entry.sets.forEach((set,index)=>card.append(setRow(state,draft,exercise,set,index)));
  return card;
}
function setRow(state,draft,exercise,set,index){
  const row=node('div',{class:'set-row'});
  row.append(node('div',{class:'set-index'},'S'+(index+1)+'/'+exercise.sets));
  const main=numberInput(exercise.kind==='time'?'Sec':'Reps',set.reps,'0','999');
  const kg=numberInput('Kg',set.kg,'0','999');
  const rir=numberInput('RIR',set.rir,'0','5');
  const pain=numberInput('Douleur',set.pain,'0','10');
  [[main,'reps'],[kg,'kg'],[rir,'rir'],[pain,'pain']].forEach(([input,key])=>input.addEventListener('change',()=>{set[key]=input.value;write(state)}));
  row.append(field(''+(exercise.kind==='time'?'Sec':'Reps'),main),field('Kg',kg),field('RIR',rir),field('Douleur',pain));
  return row;
}
function numberInput(placeholder,value,min,max){return node('input',{class:'input',type:'number',placeholder,value:String(value===undefined||value===null?'':value),min:String(min),max:String(max)})}
function field(label,input){return node('label',{class:'field-mini'},[node('span',{},label),input])}
function saveSession(state,type,status,refresh){
  const draft=currentDraft(state);
  const plan=PROGRAM[type];
  const exercises={};
  (plan.exercises||[]).forEach(exercise=>{
    const entry=exerciseDraft(draft,exercise);
    exercises[exercise.id]={name:exercise.name,target:exercise.target,kind:exercise.kind,sets:entry.sets.map(set=>({...set}))};
  });
  const allPain=Object.values(exercises).flatMap(exercise=>exercise.sets).map(set=>clamp(set.pain,0,10,0));
  const globalPain=Math.max(clamp(draft.globalPain,0,10,0),0,...allPain);
  const finalStatus=globalPain>=7?'pain_stop':status==='completed'&&globalPain>=4?'deload':status;
  const session={id:localDate()+'_'+type,date:localDate(),type,status:finalStatus,globalPain,energy:clamp(draft.energy,1,5,3),notes:String(draft.notes||'').trim(),exercises};
  const index=state.sessions.findIndex(item=>item.id===session.id);
  if(index>=0)state.sessions[index]=session;else state.sessions.push(session);
  state.sessions=state.sessions.slice(-100);
  delete state.drafts[localDate()];
  write(state);
  showToast(finalStatus==='pain_stop'?'Arrêt douleur enregistré':finalStatus==='deload'?'Séance allégée enregistrée':'Séance enregistrée');
  refresh();
}
function coveragePanel(){
  const card=makeCard('Couverture musculaire','Aucun groupe volontairement oublié. Les volumes restent contrôlés pour éviter les doublons inutiles.','span-12');
  const grid=node('div',{class:'grid'});
  COVERAGE.forEach(([title,text])=>{
    const box=makeCard(title,text,'span-4 compact-card');
    grid.append(box);
  });
  card.append(grid);
  return card;
}
function progressPanel(state){
  const card=makeCard('Progression','Atteins le haut de la plage de répétitions avec 1–2 RIR, puis augmente la charge au prochain passage.','span-12');
  const latest={};
  state.sessions.slice().reverse().forEach(session=>Object.entries(session.exercises||{}).forEach(([id,exercise])=>{if(!latest[id])latest[id]={session,exercise}}));
  const grid=node('div',{class:'grid'});
  Object.values(latest).forEach(({session,exercise})=>{
    const lines=exercise.sets.map(set=>(exercise.kind==='time'?(set.reps||'—')+' sec':(set.reps||'—')+(set.kg?' × '+set.kg+' kg':''))).join(' · ');
    const box=makeCard(exercise.name,session.date+' · '+lines,'span-4 compact-card');
    grid.append(box);
  });
  if(!grid.children.length)card.append(node('div',{class:'empty-state'},'Aucune performance enregistrée.'));
  else card.append(grid);
  card.append(node('div',{class:'exercise'},'Progression : pompes, tractions, dips et chin-ups passent à la variante ou au niveau suivant seulement lorsque toutes les séries du haut de plage sont propres.'));
  return card;
}
function historyPanel(state){
  const card=makeCard('Historique','Les 20 dernières séances. Un enregistrement par jour et par type de séance.','span-12');
  const sessions=state.sessions.slice(-20).reverse();
  if(!sessions.length){card.append(node('div',{class:'empty-state'},'Aucune séance enregistrée.'));return card}
  sessions.forEach(session=>{
    const row=node('div',{class:'exercise '+(session.status==='pain_stop'?'danger':session.status==='deload'?'warn':'')});
    row.append(node('div',{class:'row'},[node('span',{class:'pill'},session.date),node('span',{class:'pill'},session.type),node('b',{},session.status)]));
    row.append(node('div',{class:'small muted'},'Douleur '+session.globalPain+'/10 · énergie '+session.energy+'/5'));
    if(session.notes)row.append(node('div',{class:'small muted'},session.notes));
    card.append(row);
  });
  return card;
}
