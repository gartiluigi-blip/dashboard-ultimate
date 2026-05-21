const P='ud5_';
const db=globalThis['local'+'Storage'];
const j=JSON;
export const today=()=>new Date().toISOString().slice(0,10);
export function get(k,d=null){try{return j.parse(db.getItem(P+k))??d}catch{return d}}
export function set(k,v){db.setItem(P+k,j.stringify(v));return v}
export function push(k,item){const a=get(k,[]);a.push({...item,id:item.id||crypto.randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});set(k,a);return a}
export function updateList(k,id,patch){const a=get(k,[]);const n=a.map(x=>x.id===id?{...x,...patch,updatedAt:new Date().toISOString()}:x);set(k,n);return n}
function keys(){return Array.from({length:db.length},(_,i)=>db.key(i)).filter(k=>k&&k.startsWith(P))}
export function all(){return keys().reduce((out,k)=>{try{out[k]=j.parse(db.getItem(k))}catch{out[k]={invalidJson:true}}return out},{})}
export function sportCycle(){return get('sport_cycle',{anchorDate:today(),anchorType:'push1'})}
export function setSportCycle(v){return set('sport_cycle',v)}
export function sportSessions(){return get('sport_sessions',[])}
export function addSportSession(s){return push('sport_sessions',s)}
export function sportDraft(date=today()){return get('sport_draft_'+date,{})}
export function setSportDraft(date,data){return set('sport_draft_'+date,{...sportDraft(date),...data})}
export function bodyweight(){return get('bodyweight_progress',{})}
export function setBodyweight(v){return set('bodyweight_progress',v)}
export function addBodyweightTest(test){return push('bodyweight_tests',test)}
export function bodyweightTests(){return get('bodyweight_tests',[])}
export function flexibility(){return get('flexibility_progress',{currentLevel:0,measurements:[],dailyChecks:{}})}
export function setFlexibility(v){return set('flexibility_progress',v)}
export function addFlexMeasurement(m){const f=flexibility();f.measurements.push({...m,id:crypto.randomUUID(),createdAt:new Date().toISOString()});return setFlexibility(f)}
export function addSportMonthlyTest(test){return push('sport_monthly_tests',test)}
export function sportMonthlyTests(){return get('sport_monthly_tests',[])}
export function logDay(date=today()){return get('log_'+date,{})}
export function saveLog(date,data){return set('log_'+date,{...logDay(date),...data})}
export function tasks(date=today()){return get('tasks_'+date,[])}
export function addTask(title,date=today()){return push('tasks_'+date,{title,done:false})}
export function exportJson(){return j.stringify(all(),null,2)}
