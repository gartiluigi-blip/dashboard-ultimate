const STORAGE_KEY='ud5_sport_recovery_v1';
const DAY_MS=24*60*60*1000;
const CYCLE=['Push A','Pull A','Legs A','Rest A','Push B','Pull B','Legs B','Rest B'];
const PLANS={
  'Push A':['Développé incliné haltères · 3×6–10','Pompes progressives · 3×6–12','Landmine press · 3×8–12','Élévations latérales · 3×12–20','Extension triceps corde · 3×10–15'],
  'Pull A':['Tractions pronation · 4×3–8','Rowing poitrine appuyée · 3×6–10','Rowing poulie unilatéral · 3×8–12','Face pull · 3×12–20','Curl incliné · 3×8–12'],
  'Legs A':['Presse à cuisses · 3×8–12','Split squat bulgare · 3×8–12 par jambe','Leg curl assis · 3×8–12','Hip thrust · 3×8–12','Mollets debout · 4×8–15','Pallof press · 3×10–15 par côté'],
  'Rest A':['Zone 2 · 30–45 min','Mobilité hanches, thoracique et chevilles · 12–15 min','Respiration lente · 5 min'],
  'Push B':['Dips progressifs · 3×4–10','Développé haltères plat · 3×6–10','Pike push-up progressif · 3×5–10','Écarté poulie · 2×10–15','Élévation latérale poulie · 3×12–20'],
  'Pull B':['Chin-ups · 4×3–8','Tirage vertical neutre · 3×8–12','Seal row · 3×8–12','Oiseau poulie ou haltères · 3×12–20','Curl marteau · 3×8–12','Avant-bras · 2×12–20'],
  'Legs B':['Romanian deadlift · 3×6–10','Fente arrière · 3×8–12 par jambe','Nordic curl assisté · 3×4–8','Mollets assis · 4×10–20','Adducteurs machine · 3×10–15','Hanging knee raise · 3×8–15'],
  'Rest B':['Zone 2 · 30–45 min','Mobilité hanches, thoracique et chevilles · 12–15 min','Respiration lente · 5 min']
};

function today(){return new Date().toISOString().slice(0,10)}
function clamp(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback}
function read(){
  try{
    const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return {
      anchorDate:typeof value.anchorDate==='string'?value.anchorDate:today(),
      anchorType:CYCLE.includes(value.anchorType)?value.anchorType:CYCLE[0],
      sessions:Array.isArray(value.sessions)?value.sessions:[],
      draft:value.draft&&typeof value.draft==='object'?value.draft:{}
    };
  }catch(error){
    return {anchorDate:today(),anchorType:CYCLE[0],sessions:[],draft:{}};
  }
}
function write(state){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(error){console.error('Sport recovery save failed',error)}
}
function dayNumber(date){return Math.floor(new Date(date+'T00:00:00').getTime()/DAY_MS)}
function activeType(state){
  const start=Math.max(0,CYCLE.indexOf(state.anchorType));
  const elapsed=dayNumber(today())-dayNumber(state.anchorDate);
  const offset=((elapsed%CYCLE.length)+CYCLE.length)%CYCLE.length;
  return CYCLE[(start+offset)%CYCLE.length];
}
function node(tag,className,text){
  const element=document.createElement(tag);
  if(className)element.className=className;
  if(text!==undefined&&text!==null)element.textContent=String(text);
  return element;
}
function button(label,className,onClick){
  const element=node('button','btn '+(className||''),label);
  element.type='button';
  element.addEventListener('click',onClick);
  return element;
}
function card(title,subtitle){
  const element=node('section','card');
  element.append(node('div','card-head',title));
  if(subtitle)element.append(node('div','muted',subtitle));
  return element;
}
function showToast(message){
  const target=document.querySelector('#toast');
  if(!target)return;
  target.textContent=message;
  target.classList.add('show');
  window.clearTimeout(window.__sportRecoveryToast);
  window.__sportRecoveryToast=window.setTimeout(function(){target.classList.remove('show')},1900);
}
function saveSession(state,type,status,pain,energy,notes,refresh){
  state.sessions.push({
    date:today(),
    type:type,
    status:status,
    pain:clamp(pain,0,10,0),
    energy:clamp(energy,1,5,3),
    notes:String(notes||'').trim()
  });
  state.sessions=state.sessions.slice(-100);
  state.draft={};
  write(state);
  showToast(status==='completed'?'Séance enregistrée':'Statut enregistré');
  refresh();
}

export function renderSport(root,refresh){
  const state=read();
  const type=activeType(state);
  const plan=PLANS[type]||[];

  const notice=card('Sport · mode de continuité','Le moteur détaillé est temporairement isolé. Ta séance et ton historique restent opérationnels localement.');
  notice.classList.add('warn');
  root.append(notice);

  const cycle=card('Cycle actif','Sélectionne le point de départ du cycle de huit jours.');
  const cycleRow=node('div','row');
  const select=node('select','input');
  CYCLE.forEach(function(item){
    const option=node('option','',item);
    option.value=item;
    select.append(option);
  });
  select.value=type;
  cycleRow.append(node('span','pill','AUJOURD HUI · '+type),select);
  cycleRow.append(button('Démarrer ici','green',function(){
    state.anchorDate=today();
    state.anchorType=select.value;
    write(state);
    showToast('Cycle redémarré');
    refresh();
  }));
  cycle.append(cycleRow);
  root.append(cycle);

  const workout=card('Séance · '+type,type.indexOf('Rest')===0?'Récupération active. Aucune charge forcée.':'Garde 1 à 2 répétitions en réserve et arrête immédiatement en cas de douleur inhabituelle.');
  const list=node('div','');
  plan.forEach(function(item,index){
    const row=node('div','exercise');
    row.append(node('div','row',''));
    row.firstChild.append(node('span','pill',String(index+1).padStart(2,'0')),node('b','',item));
    list.append(row);
  });
  workout.append(list);

  const inputs=node('div','row');
  const pain=node('input','input');
  pain.type='number';
  pain.min='0';
  pain.max='10';
  pain.placeholder='Douleur globale 0–10';
  pain.value=state.draft.pain||'0';
  const energy=node('input','input');
  energy.type='number';
  energy.min='1';
  energy.max='5';
  energy.placeholder='Énergie 1–5';
  energy.value=state.draft.energy||'3';
  inputs.append(pain,energy);
  const notes=node('textarea','input');
  notes.rows=3;
  notes.placeholder='Notes séance · douleur · charge · variante';
  notes.value=state.draft.notes||'';
  function persistDraft(){
    state.draft={pain:pain.value,energy:energy.value,notes:notes.value};
    write(state);
  }
  pain.addEventListener('change',persistDraft);
  energy.addEventListener('change',persistDraft);
  notes.addEventListener('change',persistDraft);
  workout.append(inputs,notes);
  const actions=node('div','row');
  actions.append(
    button('Séance validée','green',function(){saveSession(state,type,'completed',pain.value,energy.value,notes.value,refresh)}),
    button('Séance allégée','warn',function(){saveSession(state,type,'deload',pain.value,energy.value,notes.value,refresh)}),
    button('Sautée','',function(){saveSession(state,type,'skipped',pain.value,energy.value,notes.value,refresh)})
  );
  workout.append(actions);
  root.append(workout);

  const history=card('Historique de continuité','Les dix dernières entrées sauvegardées sur cet appareil.');
  const recent=state.sessions.slice(-10).reverse();
  if(!recent.length){
    history.append(node('div','empty-state','Aucune séance enregistrée.'));
  }else{
    recent.forEach(function(entry){
      const row=node('div','exercise '+(entry.status==='deload'?'warn':''));
      const text=entry.date+' · '+entry.type+' · '+entry.status+' · douleur '+entry.pain+'/10 · énergie '+entry.energy+'/5';
      row.append(node('div','',text));
      if(entry.notes)row.append(node('div','small muted',entry.notes));
      history.append(row);
    });
  }
  root.append(history);
}
