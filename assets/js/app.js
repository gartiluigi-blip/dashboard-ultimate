import { SPORT_LIBRARY, FEATURES, CERTS } from './data.js';
import * as Store from './store.js';
import { $, el, card } from './ui.js';
import { renderHome } from '../../modules/home.js';
import { renderSport } from '../../modules/sport.js';
import { renderStudy } from '../../modules/study.js';
import { renderRoutine } from '../../modules/routine.js';
import { renderMoney } from '../../modules/money.js';
import { renderFuelFab } from '../../modules/fuel.js';
const tabs=[['home','Aujourd\'hui'],['routine','Routine'],['sport','Sport'],['study','Étude'],['money','Argent'],['stats','Stats'],['settings','Réglages']];let route='home';
function nav(){const n=$('#tabs');n.innerHTML='';tabs.forEach(([id,l])=>n.append(el('button',{class:'tab '+(route===id?'active':''),onclick:()=>{route=id;render();}},l)));}
function render(){nav();const app=$('#app');app.innerHTML='';renderFuelFab(render);({home,routine,sport,study,money,stats,settings}[route]||home)(app);}
setInterval(()=>{$('#clock').textContent=new Date().toLocaleTimeString('fr-BE',{hour:'2-digit',minute:'2-digit'});},1000);
function metric(t,s,b,fn){const c=card(t,s,'span-4');c.append(el('button',{class:'btn primary',onclick:fn},b));return c;}
function home(root){renderHome(root,render);}function routine(root){renderRoutine(root,render);}function sport(root){renderSport(root,render);}function study(root){renderStudy(root,render);}function money(root){renderMoney(root,render);}
function stats(root){const g=el('div',{class:'grid'});g.append(metric('Sport Library',SPORT_LIBRARY.length+' exercices','OK',()=>{}));g.append(metric('Sessions',Store.sportSessions().length+' logs','OK',()=>{}));g.append(metric('Vinted',Store.get('vinted_items',[]).length+' articles','OK',()=>{}));g.append(metric('Étude',Store.get('study_resources',[]).length+' ressources','OK',()=>{}));g.append(metric('Certifs',Store.get('certifications',[]).length+' cibles','OK',()=>{}));g.append(metric('Preuves',Store.get('proofs',[]).length+' preuves','OK',()=>{}));g.append(metric('Features',FEATURES.length+' modules','OK',()=>{}));root.append(g);}
function settings(root){const c=card('Réglages / Export','Feature Registry + export local.');c.append(el('textarea',{class:'input',rows:'12'},'features: '+FEATURES.length+' · certifs: '+CERTS.length));root.append(c);}
render();
