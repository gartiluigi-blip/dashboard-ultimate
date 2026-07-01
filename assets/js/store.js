const P='ud5_';
const db=globalThis['local'+'Storage'];
const j=JSON;
export const APP_VERSION='5.2.0-sport-clean';
export const SCHEMA_VERSION=6;
const META_KEY='__meta';

export const today=()=>new Date().toISOString().slice(0,10);
export const now=()=>new Date().toISOString();
function safeParse(raw,fallback=null){try{return raw===null||raw===undefined?fallback:j.parse(raw)}catch{return fallback}}
function sameShape(v,d){if(Array.isArray(d))return Array.isArray(v);if(d&&typeof d==='object')return v&&typeof v==='object'&&!Array.isArray(v);return true}
function fallback(v,d){if(v===undefined||v===null)return d;if(!sameShape(v,d))return d;return v}
function keys(){return Array.from({length:db.length},(_,i)=>db.key(i)).filter(k=>k&&k.startsWith(P))}
function full(k){return k.startsWith(P)?k:P+k}
function writeRaw(k,v){db.setItem(full(k),j.stringify(v));return v}
function readRaw(k,d=null){const v=safeParse(db.getItem(full(k)),undefined);return fallback(v,d)}
function backupBeforeMigration(reason='migration'){const payload=all();const stamp=now().replaceAll(':','-').slice(0,19);const key='backup_'+stamp+'_'+reason;writeRaw(key,{schemaVersion:SCHEMA_VERSION,createdAt:now(),reason,payload});writeRaw('last_backup_meta',{date:today(),createdAt:now(),bytes:j.stringify(payload).length,reason,key});return key}
function defaultMeta(){return{schemaVersion:SCHEMA_VERSION,appVersion:APP_VERSION,createdAt:now(),updatedAt:now(),deviceId:crypto?.randomUUID?.()||String(Date.now()),lastMigrationAt:now(),migrationLog:[]}}
function meta(){return readRaw(META_KEY,null)}
function saveMeta(m){return writeRaw(META_KEY,{...defaultMeta(),...(m||{}),updatedAt:now()})}
function migrate(){let m=meta();if(!m){m=defaultMeta();saveMeta(m);return m}if((+m.schemaVersion||0)===SCHEMA_VERSION)return saveMeta({...m,appVersion:APP_VERSION});backupBeforeMigration('schema_'+(m.schemaVersion||0)+'_to_'+SCHEMA_VERSION);const log=[...(m.migrationLog||[]),{from:m.schemaVersion||0,to:SCHEMA_VERSION,date:now()}];m={...m,schemaVersion:SCHEMA_VERSION,appVersion:APP_VERSION,lastMigrationAt:now(),migrationLog:log};saveMeta(m);return m}
export function boot(){return migrate()}
export function getMeta(){return saveMeta(migrate())}
export function get(k,d=null){migrate();return readRaw(k,d)}
export function set(k,v){migrate();return writeRaw(k,v)}
export function remove(k){db.removeItem(full(k))}
export function push(k,item){const a=get(k,[]);const arr=Array.isArray(a)?a:[];const row={...item,id:item.id||crypto.randomUUID(),createdAt:item.createdAt||now(),updatedAt:now()};arr.push(row);set(k,arr);return arr}
export function updateList(k,id,patch){const a=get(k,[]);const arr=Array.isArray(a)?a:[];const n=arr.map(x=>x.id===id?{...x,...patch,updatedAt:now()}:x);set(k,n);return n}
export function all(){return keys().reduce((out,k)=>{try{out[k]=j.parse(db.getItem(k))}catch{out[k]={invalidJson:true}}return out},{})}
export function exportJson(){const payload=all();payload[P+META_KEY]=getMeta();return j.stringify(payload,null,2)}
export function backup(reason='manual'){return backupBeforeMigration(reason)}
export function storageReport(){const ks=keys();let bytes=0,invalid=[];ks.forEach(k=>{const raw=db.getItem(k)||'';bytes+=raw.length+k.length;if(safeParse(raw,undefined)===undefined)invalid.push(k)});return{keys:ks.length,bytes,invalid,meta:getMeta(),backups:ks.filter(k=>k.startsWith(P+'backup_')).length}}
export function validateList(k){const v=get(k,[]);return Array.isArray(v)?v:[]}
export function importJson(raw,{allowAll=false}={}){const obj=typeof raw==='string'?j.parse(raw):raw;let n=0;Object.entries(obj||{}).forEach(([k,v])=>{if(k.startsWith(P)||allowAll){db.setItem(k.startsWith(P)?k:P+k,j.stringify(v));n++}});saveMeta({...getMeta(),lastImportAt:now()});return n}
export function purgeAll(){keys().forEach(k=>db.removeItem(k))}
export function repairNulls(){let n=0;keys().forEach(k=>{const v=safeParse(db.getItem(k),undefined);if(v===null){db.removeItem(k);n++}});return n}

export function sportCycle(){
  const clean=safeParse(db.getItem('ud5_sport_clean_v1'),{});
  const anchorDate=typeof clean?.anchorDate==='string'?clean.anchorDate:today();
  const anchorType=['Push A','Pull A','Legs A','Rest A','Push B','Pull B','Legs B','Rest B'].includes(clean?.anchorType)?clean.anchorType:'Push A';
  return{anchorDate,anchorType};
}
export function logDay(date=today()){return get('log_'+date,{})}
export function saveLog(date,data){return set('log_'+date,{...logDay(date),...data})}
export function tasks(date=today()){return validateList('tasks_'+date)}
export function addTask(title,date=today()){return push('tasks_'+date,{title,done:false})}
boot();
