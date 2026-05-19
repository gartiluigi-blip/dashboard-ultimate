import { FEATURES, CERTS } from '../assets/js/data.js';
import * as Store from '../assets/js/store.js';
import { el, card, subTabs, toast } from '../assets/js/ui.js';
let panel='backup';
const PREFIX='ud5_';
const GROUPS={
  today:['home_','today_','routine_','fuel_','supplements_'],
  study:['epfc_y1_state','track_state','study_materials','study_exercises','study_activity','nl_program','certifications','proofs'],
  sport:['sport_cycle','sport_sessions','sport_draft_','bodyweight_progress','bodyweight_tests','flexibility_progress','sport_monthly_tests'],
  money:['vinted_items','finance_month'],
  logs:['log_','tasks_']
};
export function renderSettings(root,refresh){
  root.append(subTabs([{id:'backup',label:'Backup'},{id:'import',label:'Import'},{id:'reset',label:'Reset ciblé'},{id:'diagnostic',label:'Diagnostic'}],panel,id=>{panel=id;refresh();}));
  if(panel==='import')return importPanel(root,refresh);
  if(panel==='reset')return resetPanel(root,refresh);
  if(panel==='diagnostic')return diagnostic(root);
  backup(root);
}
function backup(root){
  const data=Store.exportJson();
  const c=card('Backup complet','Copie tout le localStorage du dashboard. À sauvegarder avant gros changement.');
  const t=el('textarea',{class:'input',rows:'14'},data);
  c.append(t);
  c.append(el('div',{class:'row'},[
    el('button',{class:'btn green',onclick:()=>navigator.clipboard.writeText(data).then(()=>toast('Backup copié'))},'Copier backup'),
    el('button',{class:'btn',onclick:()=>download(data)},'Télécharger JSON')
  ]));
  root.append(c);
}
function importPanel(root,refresh){
  const c=card('Import backup','Colle un export JSON. Les clés doivent commencer par ud5_.');
  const t=el('textarea',{class:'input',rows:'14',placeholder:'Coller backup JSON ici'});
  c.append(t);
  c.append(el('button',{class:'btn green',onclick:()=>{try{const obj=JSON.parse(t.value);let n=0;Object.entries(obj).forEach(([k,v])=>{if(k.startsWith(PREFIX)){localStorage.setItem(k,JSON.stringify(v));n++;}});toast('Import ok: '+n+' clés');refresh();}catch(e){toast('JSON invalide');}}},'Importer'));
  root.append(c);
}
function resetPanel(root,refresh){
  const c=card('Reset ciblé','Efface seulement la zone choisie. Pas de reset total accidentel.');
  Object.keys(GROUPS).forEach(g=>c.append(el('button',{class:'btn danger',onclick:()=>{resetGroup(g);toast('Reset '+g+' terminé');refresh();}},'Reset '+g)));
  c.append(el('div',{class:'exercise'},'Reset total volontaire: écrire RESET puis cliquer.'));
  const confirm=el('input',{class:'input',placeholder:'RESET'});
  c.append(confirm);
  c.append(el('button',{class:'btn danger',onclick:()=>{if(confirm.value==='RESET'){resetAll();toast('Reset total terminé');refresh();}else toast('Écris RESET exactement');}},'Reset total'));
  root.append(c);
}
function diagnostic(root){
  const keys=localKeys();
  const c=card('Diagnostic stockage','Clés locales: '+keys.length+' · préfixe: '+PREFIX);
  const counts={today:0,study:0,sport:0,money:0,logs:0,other:0};
  keys.forEach(k=>{const short=k.replace(PREFIX,'');const g=Object.keys(GROUPS).find(x=>matchAny(short,GROUPS[x]));counts[g||'other']++;});
  Object.entries(counts).forEach(([k,v])=>c.append(el('div',{class:'exercise'},k+' · '+v+' clés')));
  c.append(el('div',{class:'exercise'},'Features registry: '+FEATURES.length+' · Certifs: '+CERTS.length));
  root.append(c);
  const list=card('Clés détectées','Contrôle brut pour repérer les anciennes couches.');
  keys.sort().forEach(k=>list.append(el('div',{class:'small muted'},k)));
  root.append(list);
}
function localKeys(){const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PREFIX))out.push(k);}return out;}
function matchAny(k,arr){return arr.some(p=>k===p||k.startsWith(p));}
function resetGroup(g){localKeys().forEach(k=>{const short=k.replace(PREFIX,'');if(matchAny(short,GROUPS[g]))localStorage.removeItem(k);});}
function resetAll(){localKeys().forEach(k=>localStorage.removeItem(k));}
function download(data){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download='ultimate-dashboard-backup-'+Store.today()+'.json';a.click();URL.revokeObjectURL(a.href);}
