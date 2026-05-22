import{ $,el,modeBar,setUiMode }from'./ui.js?v=20260520-onyx-mode-1';
import{ renderHome as A }from'../../modules/home.js?v=20260520-onyx-mode-1';
import{ renderRoutine as B }from'../../modules/routine.js?v=20260520-onyx-mode-1';
import{ renderStats as C }from'../../modules/stats.js?v=20260520-onyx-mode-1';
import{ renderSport as D }from'../../modules/sport.js?v=20260520-onyx-mode-1';
import{ renderStudy as E }from'../../modules/study.js?v=20260520-onyx-mode-1';
import{ renderMoney as F }from'../../modules/money.js?v=20260520-onyx-mode-1';
import{ renderLeisure as G }from'../../modules/leisure.js?v=20260520-onyx-mode-1';
import{ renderSettings as H }from'../../modules/settings.js?v=20260520-onyx-mode-1';
import{ renderFuelFab as I }from'../../modules/fuel.js?v=20260520-onyx-mode-1';
let r='home';
const names={home:'Today',routine:'Routine',stats:'Stats',sport:'Sport',study:'Study',money:'Money',leisure:'Life',settings:'System'};
const fns={home:A,routine:B,stats:C,sport:D,study:E,money:F,leisure:G,settings:H};
const gs=[['cockpit','Cockpit',['home','routine','stats']],['training','Training',['sport']],['study','Study',['study']],['money','Money',['money']],['life','Life',['leisure']],['settings','Settings',['settings']]];
function grp(){return gs.find(x=>x[2].includes(r))||gs[0]}
function nav(){const n=$('#tabs');n.innerHTML='';gs.forEach(x=>n.append(el('button',{class:'tab '+(grp()[0]===x[0]?'active':''),'data-route':x[2][0]},x[1])))}
function sub(a){const x=grp();if(x[2].length<2)return;const s=el('div',{class:'subtabs'});x[2].forEach(id=>s.append(el('button',{class:'subtab '+(r===id?'active':''),'data-route':id},names[id])));a.append(s)}
function draw(){setUiMode(localStorage.getItem('ud5_ui_mode')||'simple');nav();const a=$('#app');a.innerHTML='';I(draw);a.append(modeBar(draw));sub(a);fns[r](a,draw)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(!b)return;r=b.getAttribute('data-route');draw()});
setInterval(()=>{$('#clock').textContent=new Date().toLocaleTimeString('fr-BE',{hour:'2-digit',minute:'2-digit'})},1000);
draw();