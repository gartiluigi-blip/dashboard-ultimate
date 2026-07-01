const P='ud5_';
const db=globalThis.localStorage;
const j=JSON;
const DONE=new Set(['done','completed','validated','deload']);
export const APP_VERSION='5.5.0-command-core';
export const SCHEMA_VERSION=7;
const META_KEY='__meta';

function localDay(date=new Date()){const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return y+'-'+m+'-'+d}
export const today=()=>localDay();
export const now=()=>new Date().toISOString();
function safeParse(raw,fallback=null){try{return raw===null||raw===undefined?fallback:j.parse(raw)}catch{return fallback}}
function sameShape(value,shape){if(Array.isArray(shape))return Array.isArray(value);if(shape&&typeof shape==='object')return value&&typeof value==='object'&&!Array.isArray(value);return true}
function fallback(value,shape){if(value===undefined||value===null)return shape;return sameShape(value,shape)?value:shape}
function keys(){if(!db)return[];return Array.from({length:db.length},(_,index)=>db.key(index)).filter(key=>key&&key.startsWith(P))}
function full(key){return key.startsWith(P)?key:P+key}
function writeRaw(key,value){db.setItem(full(key),j.stringify(value));return value}
function readRaw(key,shape=null){return fallback(safeParse(db.getItem(full(key)),undefined),shape)}
function backupBeforeMigration(reason='migration'){const payload=all();const stamp=now().replaceAll(':','-').slice(0,19);const key='backup_'+stamp+'_'+reason;writeRaw(key,{schemaVersion:SCHEMA_VERSION,createdAt:now(),reason,payload});writeRaw('last_backup_meta',{date:today(),createdAt:now(),bytes:j.stringify(payload).length,reason,key});return key}
function defaultMeta(){return{schemaVersion:SCHEMA_VERSION,appVersion:APP_VERSION,createdAt:now(),updatedAt:now(),deviceId:globalThis.crypto?.randomUUID?.()||String(Date.now()),lastMigrationAt:now(),migrationLog:[]}}
function meta(){return readRaw(META_KEY,null)}
function saveMeta(value){return writeRaw(META_KEY,{...defaultMeta(),...(value||{}),updatedAt:now()})}
function migrate(){let current=meta();if(!current){current=defaultMeta();saveMeta(current);return current}if((+current.schemaVersion||0)===SCHEMA_VERSION)return saveMeta({...current,appVersion:APP_VERSION});backupBeforeMigration('schema_'+(current.schemaVersion||0)+'_to_'+SCHEMA_VERSION);current={...current,schemaVersion:SCHEMA_VERSION,appVersion:APP_VERSION,lastMigrationAt:now(),migrationLog:[...(current.migrationLog||[]),{from:current.schemaVersion||0,to:SCHEMA_VERSION,date:now()}]};saveMeta(current);return current}
export function boot(){return migrate()}
export function getMeta(){return saveMeta(migrate())}
export function get(key,shape=null){migrate();return readRaw(key,shape)}
export function set(key,value){migrate();return writeRaw(key,value)}
export function remove(key){db.removeItem(full(key))}
export function push(key,item){const value=get(key,[]);const list=Array.isArray(value)?value:[];const row={...item,id:item.id||globalThis.crypto?.randomUUID?.()||String(Date.now()),createdAt:item.createdAt||now(),updatedAt:now()};list.push(row);set(key,list);return list}
export function updateList(key,id,patch){const value=get(key,[]);const list=Array.isArray(value)?value:[];const next=list.map(item=>item.id===id?{...item,...patch,updatedAt:now()}:item);set(key,next);return next}
export function all(){return keys().reduce((out,key)=>{try{out[key]=j.parse(db.getItem(key))}catch{out[key]={invalidJson:true}}return out},{})}
export function exportJson(){const payload=all();payload[P+META_KEY]=getMeta();return j.stringify(payload,null,2)}
export function backup(reason='manual'){return backupBeforeMigration(reason)}
export function storageReport(){const currentKeys=keys();let bytes=0;const invalid=[];currentKeys.forEach(key=>{const raw=db.getItem(key)||'';bytes+=raw.length+key.length;if(safeParse(raw,undefined)===undefined)invalid.push(key)});return{keys:currentKeys.length,bytes,invalid,meta:getMeta(),backups:currentKeys.filter(key=>key.startsWith(P+'backup_')).length}}
export function validateList(key){const value=get(key,[]);return Array.isArray(value)?value:[]}
export function importJson(raw,{allowAll=false}={}){const object=typeof raw==='string'?j.parse(raw):raw;let count=0;Object.entries(object||{}).forEach(([key,value])=>{if(key.startsWith(P)||allowAll){db.setItem(key.startsWith(P)?key:P+key,j.stringify(value));count++}});saveMeta({...getMeta(),lastImportAt:now()});return count}
export function purgeAll(){keys().forEach(key=>db.removeItem(key))}
export function repairNulls(){let count=0;keys().forEach(key=>{if(safeParse(db.getItem(key),undefined)===null){db.removeItem(key);count++}});return count}

function actionStateKey(date=today()){return'action_state_'+date}
export function actions(date=today()){const value=get(actionStateKey(date),{});return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}
export function action(id,date=today()){return actions(date)[id]||null}
export function actionDone(id,date=today()){return DONE.has(action(id,date)?.status)}
export function recordAction(input={}){
  const date=input.date||today();
  const id=String(input.id||'action');
  const status=input.status||'done';
  const state=actions(date);
  const previous=state[id];
  if(previous&&DONE.has(previous.status)&&!DONE.has(status))return previous;
  const row={...previous,...input,id,date,status,updatedAt:now(),createdAt:previous?.createdAt||now()};
  state[id]=row;
  set(actionStateKey(date),state);
  const history=get('action_events',[]);
  history.push({...row,eventId:date+'::'+id+'::'+row.updatedAt});
  set('action_events',history.slice(-1200));
  return row;
}
export function blockAction(id,reason='',date=today()){return recordAction({id,date,status:'blocked',reason,title:reason||id})}
export function deferAction(id,reason='',date=today()){return recordAction({id,date,status:'deferred',reason,title:reason||id})}
export function actionHistory(limit=100){return get('action_events',[]).slice(-limit)}
export function recentActionDays(days=14){const from=new Date(today()+'T12:00:00');const seen=new Set();actionHistory(1200).forEach(event=>{if(!DONE.has(event.status)||!event.date)return;const delta=Math.floor((from-new Date(event.date+'T12:00:00'))/86400000);if(delta>=0&&delta<days)seen.add(event.date)});sportSessions().forEach(session=>{if(!['completed','deload'].includes(session.status)||!session.date)return;const delta=Math.floor((from-new Date(session.date+'T12:00:00'))/86400000);if(delta>=0&&delta<days)seen.add(session.date)});return[...seen].sort()}
export function daysSinceAction(id){const rows=actionHistory(1200).filter(event=>event.id===id&&DONE.has(event.status)&&event.date).map(event=>event.date);if(id==='sport')sportSessions().filter(session=>['completed','deload'].includes(session.status)&&session.date).forEach(session=>rows.push(session.date));if(!rows.length)return 99;rows.sort();return Math.max(0,Math.floor((new Date(today()+'T12:00:00')-new Date(rows[rows.length-1]+'T12:00:00'))/86400000))}
export function dayMode(date=today()){return get('day_mode_'+date,{mode:'auto',updatedAt:''})}
export function setDayMode(mode,date=today()){return set('day_mode_'+date,{mode,updatedAt:now()})}
export function ensureProof(course,title,date=today(),source='system'){
  const list=get('proofs',[]);
  const existing=list.find(item=>item.course===course&&(item.date===date||item.dueDate===date)&&item.status==='validated');
  if(existing)return existing;
  const row={course,title,date,dueDate:date,status:'validated',source};
  push('proofs',row);
  return row;
}

export function sportSessions(){
  const clean=safeParse(db.getItem('ud5_sport_clean_v1'),{});
  return Array.isArray(clean?.sessions)?clean.sessions:[];
}
export function sportCycle(){
  const clean=safeParse(db.getItem('ud5_sport_clean_v1'),{});
  const anchorDate=typeof clean?.anchorDate==='string'?clean.anchorDate:today();
  const types=['Push A','Pull A','Legs A','Rest A','Push B','Pull B','Legs B','Rest B'];
  const anchorType=types.includes(clean?.anchorType)?clean.anchorType:'Push A';
  return{anchorDate,anchorType};
}
export function logDay(date=today()){return get('log_'+date,{})}
export function saveLog(date,data){return set('log_'+date,{...logDay(date),...data})}
export function tasks(date=today()){return validateList('tasks_'+date)}
export function addTask(title,date=today()){return push('tasks_'+date,{title,done:false,date})}
boot();
