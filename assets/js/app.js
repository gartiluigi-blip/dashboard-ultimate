import { $, el } from './ui.js?v=20260520-hardcache-1';
import { renderHome } from '../../modules/home.js?v=20260520-hardcache-1';
import { renderSport } from '../../modules/sport.js?v=20260520-hardcache-1';
import { renderStudy } from '../../modules/study.js?v=20260520-hardcache-1';
import { renderRoutine } from '../../modules/routine.js?v=20260520-hardcache-1';
import { renderMoney } from '../../modules/money.js?v=20260520-hardcache-1';
import { renderLeisure } from '../../modules/leisure.js?v=20260520-hardcache-1';
import { renderFuelFab } from '../../modules/fuel.js?v=20260520-hardcache-1';
import { renderStats } from '../../modules/stats.js?v=20260520-hardcache-1';
import { renderSettings } from '../../modules/settings.js?v=20260520-hardcache-1';
const tabs=[['home','Aujourd\'hui'],['routine','Routine'],['sport','Sport'],['study','Étude'],['money','Argent'],['leisure','Loisir'],['stats','Stats'],['settings','Réglages']];let route='home';
function nav(){const n=$('#tabs');n.innerHTML='';tabs.forEach(([id,l])=>n.append(el('button',{class:'tab '+(route===id?'active':''),onclick:()=>{route=id;render();}},l)));}
function render(){nav();const app=$('#app');app.innerHTML='';renderFuelFab(render);({home,routine,sport,study,money,leisure,stats,settings}[route]||home)(app);}
setInterval(()=>{$('#clock').textContent=new Date().toLocaleTimeString('fr-BE',{hour:'2-digit',minute:'2-digit'});},1000);
function home(root){renderHome(root,render)}function routine(root){renderRoutine(root,render)}function sport(root){renderSport(root,render)}function study(root){renderStudy(root,render)}function money(root){renderMoney(root,render)}function leisure(root){renderLeisure(root,render)}function stats(root){renderStats(root,render)}function settings(root){renderSettings(root,render)}
render();