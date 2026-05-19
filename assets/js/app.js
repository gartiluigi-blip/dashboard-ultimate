import { SPORT_LIBRARY, FEATURES, CERTS, STUDY_TABS } from './data.js';
import * as Store from './store.js';
import { $, el, toast, card } from './ui.js';
import { renderSport } from '../../modules/sport.js';

const tabs = [['home','Aujourd\'hui'],['routine','Routine'],['sport','Sport'],['study','Étude'],['money','Argent'],['stats','Stats'],['settings','Réglages']];
let route = 'home';

function nav(){ const n=$('#tabs'); n.innerHTML=''; tabs.forEach(([id,l])=>n.append(el('button',{class:'tab '+(route===id?'active':''),onclick:()=>{route=id;render();}},l))); }
function render(){ nav(); const app=$('#app'); app.innerHTML=''; ({home,routine,sport,study,money,stats,settings}[route]||home)(app); }
setInterval(()=>{$('#clock').textContent=new Date().toLocaleTimeString('fr-BE',{hour:'2-digit',minute:'2-digit'});},1000);

function metric(t,s,b,fn){ const c=card(t,s,'span-4'); c.append(el('button',{class:'btn primary',onclick:fn},b)); return c; }
function home(root){ const g=el('div',{class:'grid'}); g.append(metric('Mission maintenant','Exécuter le prochain bloc prioritaire','Démarrer',()=>toast('Focus lancé'))); g.append(metric('Score du jour','Routine + sport + étude','Logger',()=>{Store.saveLog(Store.today(),{mood:4});toast('Log rapide enregistré');})); g.append(metric('Sport','Ouvre le module Sport complet','Voir sport',()=>{route='sport';render();})); root.append(g); }
function routine(root){ const g=el('div',{class:'grid'}); ['Étude 45 min','Sport selon cycle','Néerlandais 20 min','Vinted/Finance 15 min','Lecture 20 min'].forEach(x=>{const c=card(x,'Bloc minimum vital.','span-4'); c.append(el('button',{class:'btn green',onclick:()=>toast('Bloc validé')},'Valider')); g.append(c);}); root.append(g); }
function sport(root){ renderSport(root, render); }
function study(root){ const g=el('div',{class:'grid'}); STUDY_TABS.forEach(t=>{const c=card(t,'Ressource, progression, preuves, prochaine action.','span-4'); c.append(el('input',{class:'input',placeholder:'Ressource actuelle'})); g.append(c);}); root.append(g); }
function money(root){ const g=el('div',{class:'grid'}); ['Vinted Profit Command','Finance War Room','Nutrition'].forEach(x=>g.append(card(x,'Module v5 propre à compléter.','span-4'))); root.append(g); }
function stats(root){ const g=el('div',{class:'grid'}); g.append(metric('Sport Library',SPORT_LIBRARY.length+' exercices','OK',()=>{})); g.append(metric('Sessions',Store.sportSessions().length+' logs','OK',()=>{})); g.append(metric('Features',FEATURES.length+' modules','OK',()=>{})); root.append(g); }
function settings(root){ const counts=SPORT_LIBRARY.reduce((m,e)=>(m[e.category]=(m[e.category]||0)+1,m),{}); const c=card('Réglages / Export','Feature Registry + export local.'); c.append(el('textarea',{class:'input',rows:'12'},JSON.stringify({features:FEATURES,counts,certifications:CERTS},null,2))); c.append(el('button',{class:'btn primary',onclick:()=>navigator.clipboard.writeText(Store.exportJson()).then(()=>toast('Export copié'))},'Copier export JSON')); root.append(c); }

render();
