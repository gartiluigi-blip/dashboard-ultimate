const P = 'ud5_';
export const today = () => new Date().toISOString().slice(0,10);
export function get(k, d = null) { try { return JSON.parse(localStorage.getItem(P + k)) ?? d; } catch { return d; } }
export function set(k, v) { localStorage.setItem(P + k, JSON.stringify(v)); return v; }
export function push(k, item) { const a = get(k, []); a.push({ ...item, id: item.id || crypto.randomUUID(), createdAt: new Date().toISOString() }); set(k, a); return a; }
export function all() { const out = {}; for (let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && k.startsWith(P)) out[k]=JSON.parse(localStorage.getItem(k)); } return out; }
export function sportCycle(){ return get('sport_cycle', { anchorDate: today(), anchorType: 'push1' }); }
export function setSportCycle(v){ return set('sport_cycle', v); }
export function sessions(){ return get('sport_sessions', []); }
export function addSession(s){ return push('sport_sessions', s); }
export function logDay(date=today()){ return get('log_' + date, {}); }
export function saveLog(date, data){ return set('log_' + date, { ...logDay(date), ...data }); }
export function tasks(date=today()){ return get('tasks_' + date, []); }
export function addTask(title, date=today()){ return push('tasks_' + date, { title, done:false }); }
export function exportJson(){ return JSON.stringify(all(), null, 2); }
