import { $, el, modeBar, setUiMode } from './ui.js?v=20260601-godmode-1';
import { renderFuelFab } from '../../modules/fuel.js?v=20260520-soul-1';
import { renderNutrition } from '../../modules/nutrition.js?v=20260626-nutrition-1';
import { renderHome } from '../../modules/home.js?v=20260601-godmode-1';
import { renderRoutine } from '../../modules/routine.js?v=20260701-sport-clean-1';
import { renderSport } from '../../modules/sport.js?v=20260701-sport-clean-1';
import { renderStudy } from '../../modules/study.js?v=20260601-godmode-1';
import { renderMoney } from '../../modules/money.js?v=20260520-soul-1';
import { renderStats } from '../../modules/stats.js?v=20260601-godmode-1';
import { renderLeisure } from '../../modules/leisure.js?v=20260520-soul-1';
import { renderSettings } from '../../modules/settings.js?v=20260601-godmode-1';

export const APP_VERSION='5.4.0-sport-clean';
window.UD5_VERSION=APP_VERSION;

const names={nutrition:'Nutrition',home:'Mission',routine:'Jour',stats:'Commandement',sport:'Sport',study:'Étude',money:'Argent',leisure:'Loisir',settings:'Système'};
const renders={nutrition:renderNutrition,home:renderHome,routine:renderRoutine,sport:renderSport,study:renderStudy,money:renderMoney,stats:renderStats,leisure:renderLeisure,settings:renderSettings};
const groups=[['nutrition','Nutrition',['nutrition']],['mission','Mission',['home','routine']],['training','Sport',['sport']],['study','Étude',['study']],['money','Argent',['money']],['intel','Stats',['stats']],['life','Loisir',['leisure']],['system','Système',['settings']]];
let route=renders[localStorage.getItem('ud5_route')]?localStorage.getItem('ud5_route'):'home';
function group(){return groups.find(item=>item[2].includes(route))||groups[0]}
function nav(){const target=$('#tabs');if(!target)return;target.innerHTML='';groups.forEach(item=>target.append(el('button',{class:'tab '+(group()[0]===item[0]?'active':''),'data-route':item[2][0]},item[1])))}
function shell(root){try{renderFuelFab(draw)}catch(error){console.error(error)}root.append(modeBar(draw));const current=group();if(current[2].length>1){const tabs=el('div',{class:'subtabs'});current[2].forEach(id=>tabs.append(el('button',{class:'subtab '+(route===id?'active':''),'data-route':id},names[id])));root.append(tabs)}}
function draw(){setUiMode(localStorage.getItem('ud5_ui_mode')||'simple');nav();const root=$('#app');if(!root)return;root.innerHTML='';shell(root);localStorage.setItem('ud5_route',route);try{renders[route](root,draw)}catch(error){console.error(error);root.append(el('section',{class:'card danger'},[el('h2',{},'Module indisponible'),el('div',{class:'small muted'},String(error&&error.message||error))]))}}
document.addEventListener('click',event=>{const target=event.target.closest('[data-route]');if(!target)return;route=target.getAttribute('data-route');draw()});
setInterval(()=>{const clock=$('#clock');if(clock)clock.textContent=new Date().toLocaleTimeString('fr-BE',{hour:'2-digit',minute:'2-digit'})},1000);
draw();
