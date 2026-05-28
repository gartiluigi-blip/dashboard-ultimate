import{ $,el,modeBar,setUiMode,toast }from'./ui.js?v=20260520-soul-1';
import{ renderHome as A }from'../../modules/home.js?v=20260520-soul-1';
import{ renderRoutine as B }from'../../modules/routine.js?v=20260520-soul-1';
import{ renderStats as C }from'../../modules/stats.js?v=20260520-soul-1';
import{ renderSport as D }from'../../modules/sport.js?v=20260520-soul-1';
import{ renderStudy as E }from'../../modules/study.js?v=20260520-soul-1';
import{ renderMoney as F }from'../../modules/money.js?v=20260520-soul-1';
import{ renderLeisure as G }from'../../modules/leisure.js?v=20260520-soul-1';
import{ renderSettings as H }from'../../modules/settings.js?v=20260520-soul-1';
import{ renderFuelFab as I }from'../../modules/fuel.js?v=20260520-soul-1';
const names={home:'Aujourd’hui',routine:'Plan du jour',stats:'Progrès',sport:'Sport',study:'Étude',money:'Argent',leisure:'Loisir',settings:'Réglages'};
const fns={home:A,routine:B,stats:C,sport:D,study:E,money:F,leisure:G,settings:H};
const groups=[['cockpit','Accueil',['home','routine','stats']],['training','Sport',['sport']],['study','Apprendre',['study']],['money','Argent',['money']],['life','Loisir',['leisure']],['settings','Réglages',['settings']]];
let route=valid(localStorage.getItem('ud5_route')||'home');
function valid(x){return fns[x]?x:'home'}
function grp(){return groups.find(x=>x[2].includes(route))||groups[0]}
function nav(){const n=$('#tabs');if(!n)return;n.innerHTML='';groups.forEach(x=>n.append(el('button',{class:'tab '+(grp()[0]===x[0]?'active':''),'data-route':x[2][0]},x[1])))}
function sub(root){const g=grp();if(g[2].length<2)return;const s=el('div',{class:'subtabs'});g[2].forEach(id=>s.append(el('button',{class:'subtab '+(route===id?'active':''),'data-route':id},names[id])));root.append(s)}
function errorCard(err){const msg=String(err?.stack||err?.message||err||'Erreur inconnue');const c=el('div',{class:'card danger'});c.append(el('h2',{},'Onglet bloqué · '+(names[route]||route)));c.append(el('div',{class:'small muted'},'Le reste du dashboard reste utilisable. Copie l’erreur ou reviens à l’accueil.'));const box=el('textarea',{class:'input',rows:'8'},msg);c.append(box);c.append(el('div',{class:'row'},[el('button',{class:'btn green',onclick:()=>{route='home';localStorage.setItem('ud5_route',route);draw()}},'Retour accueil'),el('button',{class:'btn',onclick:()=>navigator.clipboard.writeText(msg).then(()=>toast('Erreur copiée'))},'Copier erreur'),el('button',{class:'btn',onclick:()=>location.reload()},'Recharger')]));return c}
function draw(){setUiMode(localStorage.getItem('ud5_ui_mode')||'simple');nav();const root=$('#app');if(!root)return;root.innerHTML='';try{I(draw)}catch(e){console.error('fuel error',e)}root.append(modeBar(draw));sub(root);try{localStorage.setItem('ud5_route',route);fns[route](root,draw)}catch(e){console.error(e);root.append(errorCard(e))}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(!b)return;route=valid(b.getAttribute('data-route'));localStorage.setItem('ud5_route',route);draw()});
window.addEventListener('error',e=>{console.error(e.error||e.message)});window.addEventListener('unhandledrejection',e=>{console.error(e.reason)});
setInterval(()=>{const c=$('#clock');if(c)c.textContent=new Date().toLocaleTimeString('fr-BE',{hour:'2-digit',minute:'2-digit'})},1000);
draw();