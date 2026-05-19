import { SPORT_LIBRARY, FEATURES } from '../assets/js/data.js';
import { BOOKS, EXERCISE_PACKS } from '../assets/js/study-catalog.js';
import * as Store from '../assets/js/store.js';
import { el, card } from '../assets/js/ui.js';

export function renderStats(root){
  const grid = el('div',{class:'grid'});
  grid.append(metric('Sport library', SPORT_LIBRARY.length + ' exercices'));
  grid.append(metric('Sport sessions', Store.sportSessions().length + ' séances'));
  grid.append(metric('Vinted stock', Store.get('vinted_items',[]).length + ' articles'));
  grid.append(metric('Features', FEATURES.length + ' modules'));
  grid.append(metric('Fuel today', fuelText()));
  grid.append(metric('Today score', todayScore()));
  root.append(grid);
  root.append(trackStats());
  root.append(vintedStats());
  root.append(activityStats());
}
function metric(title,value){const c=card(title,value,'span-4');c.append(el('div',{class:'metric'},String(value).split(' ')[0]));return c;}
function fuelText(){const f=Store.get('fuel_'+Store.today(),{water:0,protein:0});return 'eau '+f.water+'/3000 · prot '+f.protein+'/150';}
function todayScore(){const s=Store.get('home_'+Store.today(),{done:{}});const done=Object.values(s.done||{}).filter(Boolean).length;return done+'/10 blocs';}
function trackStats(){const all=Store.get('track_state',{});const c=card('Parcours étude','Coding / IA / IoT / Réparation : progression livres + exercices.');['coding','ai','iot','repair'].forEach(k=>{const s=all[k]||{};const b=BOOKS[k]||[];const e=EXERCISE_PACKS[k]||[];c.append(el('div',{class:'exercise'},k.toUpperCase()+' · livres '+(s.bookIndex||0)+'/'+b.length+' · exercices '+(s.exerciseIndex||0)+'/'+e.length));});return c;}
function vintedStats(){const list=Store.get('vinted_items',[]);const invested=list.reduce((a,x)=>a+(+x.buy||0)+(+x.shipping||0)+(+x.boost||0),0);const revenue=list.reduce((a,x)=>a+(+x.sold||0),0);const sold=list.filter(x=>x.status==='sold').length;return card('Vinted stats','Articles '+list.length+' · vendus '+sold+' · investi '+euro(invested)+' · ventes '+euro(revenue)+' · profit '+euro(revenue-invested));}
function activityStats(){const a=Store.get('study_activity',[]);const c=card('Activité récente','Derniers logs enregistrés.');a.slice(-10).reverse().forEach(x=>c.append(el('div',{class:'exercise'},(x.date||'-')+' · '+(x.domain||'-')+' · '+(x.kind||x.status||'-')+' · '+(x.title||x.exercise||x.resourceId||'-'))));return c;}
function euro(n){return (Number(n)||0).toFixed(2)+' €';}
