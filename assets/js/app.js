import{ $,el,modeBar,setUiMode,toast }from'./ui.js?v=20260601-godmode-1';
import{ renderFuelFab }from'../../modules/fuel.js?v=20260520-soul-1';

export const APP_VERSION='5.3.1-sport-recovery';
window.UD5_VERSION=APP_VERSION;

const names={nutrition:'Nutrition',home:'Mission',routine:'Jour',stats:'Commandement',sport:'Sport',study:'Étude',money:'Argent',leisure:'Loisir',settings:'Système'};
const modules={
  nutrition:{load:()=>import('../../modules/nutrition.js?v=20260626-nutrition-1'),fn:'renderNutrition'},
  home:{load:()=>import('../../modules/home.js?v=20260601-godmode-1'),fn:'renderHome'},
  routine:{load:()=>import('../../modules/routine.js?v=20260520-soul-1'),fn:'renderRoutine'},
  sport:{
    load:async()=>{
      try{return await import('../../modules/hybrid-sport.js?v=20260629-hybrid-ppl-2')}
      catch(primaryError){
        console.error('Primary sport module failed. Loading recovery module.',primaryError);
        return import('../../modules/sport-recovery.js?v=20260629-sport-recovery-1');
      }
    },
    fn:'renderSport'
  },
  study:{load:()=>import('../../modules/study.js?v=20260601-godmode-1'),fn:'renderStudy'},
  money:{load:()=>import('../../modules/money.js?v=20260520-soul-1'),fn:'renderMoney'},
  stats:{load:()=>import('../../modules/stats.js?v=202601-godmode-1'),fn:'renderStats'},
  leisure:{load:()=>import('../../modules/leisure.js?v=20260520-soul-1'),fn:'renderLeisure'},
  settings:{load:()=>import('../../modules/settings.js?v=202601-godmode-1'),fn:'renderSettings'}
};
const groups=[['nutrition','Nutrition',['nutrition']],['mission','Mission',['home','routine']],['training','Sport',['sport']],['study','Étude',['study']],['money','Argent',['money']],['intel','Stats',['stats']],['life','Loisir',['leisure']],['system','Système',['settings']]];
let route=valid(localStorage.getItem('ud5_route')||'home'),token=0;
function valid(x){return modules[x]?x:'home'}
function grp(){return groups.find(x=>x[2].includes(route))||groups[0]}
function nav(){const n=$('#tabs');if(!n)return;n.innerHTML='';groups.forEach(x=>n.append(el('button',{class:'tab '+(grp()[0]===x[0]?'active':''),'data-route':x[2][0]},x[1]))) }
function sub(root){const g=grp();if(g[2].length<2)return;const s=el('div',{class:'subtabs'});g[2].forEach(id=>s.append(el('button',{class:'subtab '+(route===id?'active':''),'data-route':id},names[id])));root.append(s)}
function shell(root){try{renderFuelFab(draw)}catch(e){console.error('fuel error',e)}root.append(modeBar(draw));sub(root)}
function loading(){return el('section',{class:'card module-hero'},[el('h2',{},'Chargement'),el('div',{class:'small muted'},'Module chargé à la demande. Exécution propre.')])}
function errorCard(err){const msg=String(err?.stack||err?.message||err||'Erreur inconnue');const c=el('section',{class:'card danger'});c.append(el('h2',{},'Module bloqué · '+(names[route]||route)));c.append(el('div',{class:'small muted'},'Retour mission ou copie erreur. Le dashboard ne doit jamais mourir entièrement.'));c.append(el('textarea',{class:'input',rows:'8'},msg));c.append(el('div',{class:'row'},[el('button',{class:'btn green',onclick:()=>{route='home';localStorage.setItem('ud5_route',route);draw()}},'Retour mission'),el('button',{class:'btn',onclick:()=>navigator.clipboard.writeText(msg).then(()=>toast('Erreur copiée'))},'Copier'),el('button',{class:'btn',onclick:()=>location.reload()},'Recharger')]));return c}
async function draw(){const id=++token;setUiMode(localStorage.getItem('ud5_ui_mode')||'simple');nav();const root=$('#app');if(!root)return;root.innerHTML='';shell(root);root.append(loading());localStorage.setItem('ud5_route',route);try{const m=modules[route],mod=await m.load();if(id!==token)return;root.innerHTML='';shell(root);const fn=mod[m.fn];if(typeof fn!=='function')throw new Error('Export manquant: '+m.fn);fn(root,draw)}catch(e){console.error(e);if(id!==token)return;root.innerHTML='';shell(root);root.append(errorCard(e))}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-route]');if(!b)return;route=valid(b.getAttribute('data-route'));localStorage.setItem('ud5_route',route);draw()});
window.addEventListener('error',e=>console.error(e.error||e.message));window.addEventListener('unhandledrejection',e=>console.error(e.reason));
setInterval(()=>{const c=$('#clock');if(c)c.textContent=new Date().toLocaleTimeString('fr-BE',{hour:'2-digit',minute:'2-digit'})},1000);
draw();
