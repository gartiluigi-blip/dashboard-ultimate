import * as Store from './store.js?v=20260701-command-1';
const ids=['fuel_water','fuel_protein','epfc','nl','coding','ai','iot','repair','vinted','savings','review'];
const ok=['done','completed','validated','deload'];
function run(){const date=Store.today();const actions=Store.actions(date);const done=Object.values(actions).filter(x=>ids.includes(x.id)&&ok.includes(x.status)).map(x=>x.id);if(!done.length)return;const a=Store.get('routine_'+date,{done:{},cfg:{}});const b=Store.get('home_'+date,{done:{},notes:''});done.forEach(id=>{a.done={...(a.done||{}),[id]:true};b.done={...(b.done||{}),[id]:true}});Store.set('routine_'+date,a);Store.set('home_'+date,b)}
window.addEventListener('ud5:navigate',run);run();
