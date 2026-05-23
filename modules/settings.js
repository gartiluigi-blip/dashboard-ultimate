import { FEATURES, CERTS } from '../assets/js/data.js';
import * as Store from '../assets/js/store.js';
import { el, card, subTabs, toast } from '../assets/js/ui.js';
let panel='backup';
const PREFIX='ud5_';
const LEGACY_PREFIXES=['dashv2_','ultimate_','dashboard_','old_'];
const LEGACY_WORDS=['nutrition','practice','patch','legacy','old','demo'];
const GROUPS={
  today:['home_','today_','routine_','fuel_','supplements_'],
  study:['epfc_y1_state','track_state','study_materials','study_exercises','study_activity','study_mission_','nl_program','certifications','proofs','exam_targets','error_bank'],
  sport:['sport_cycle','sport_sessions','sport_draft_','bodyweight_progress','bodyweight_tests','flexibility_progress','sport_monthly_tests'],
  money:['vinted_items','finance_month','savings_history'],
  leisure:['chess_elo_history','chess_games','chess_goal','reading_tracks','reading_activity','leisure_books'],
  logs:['log_','tasks_']
};
const GROUP_LABELS={today:'aujourd’hui',study:'étude',sport:'sport',money:'argent',leisure:'loisir',logs:'journaux',other:'autres'};
export function renderSettings(root,refresh){
  root.append(subTabs([{id:'backup',label:'Sauvegarde'},{id:'import',label:'Import'},{id:'reset',label:'Reset ciblé'},{id:'cleanup',label:'Nettoyage ancien'},{id:'diagnostic',label:'Diagnostic'}],panel,id=>{panel=id;refresh();}));
  if(panel==='import')return importPanel(root,refresh);
  if(panel==='reset')return resetPanel(root,refresh);
  if(panel==='cleanup')return cleanupPanel(root,refresh);
  if(panel==='diagnostic')return diagnostic(root);
  backup(root);
}
function backup(root){let data='';try{data=Store.exportJson()}catch(e){data=JSON.stringify({error:'export_failed',message:String(e)},null,2)}const c=card('Sauvegarde complète','Copie tout le stockage du dashboard avant modification.');const t=el('textarea',{class:'input',rows:'14'},data);c.append(t);c.append(el('div',{class:'row'},[el('button',{class:'btn green',onclick:()=>navigator.clipboard.writeText(data).then(()=>toast('Sauvegarde copiée'))},'Copier sauvegarde'),el('button',{class:'btn',onclick:()=>download(data)},'Télécharger JSON')]));root.append(c)}
function importPanel(root,refresh){const c=card('Importer une sauvegarde','Colle un export JSON. Les clés doivent commencer par ud5_.');const t=el('textarea',{class:'input',rows:'14',placeholder:'Coller sauvegarde JSON ici'});c.append(t);c.append(el('button',{class:'btn green',onclick:()=>{try{const obj=JSON.parse(t.value);let n=0;Object.entries(obj).forEach(([k,v])=>{if(k.startsWith(PREFIX)){localStorage.setItem(k,JSON.stringify(v));n++;}});toast('Import réussi: '+n+' clés');refresh();}catch(e){toast('JSON invalide');}}},'Importer'));root.append(c)}
function resetPanel(root,refresh){const c=card('Reset ciblé','Efface seulement la zone choisie. Pas de reset total accidentel.');Object.keys(GROUPS).forEach(g=>c.append(el('button',{class:'btn danger',onclick:()=>{resetGroup(g);toast('Reset '+(GROUP_LABELS[g]||g)+' terminé');refresh();}},'Reset '+(GROUP_LABELS[g]||g))));c.append(el('div',{class:'exercise'},'Reset total volontaire: écrire RESET puis cliquer.'));const confirm=el('input',{class:'input',placeholder:'RESET'});c.append(confirm);c.append(el('button',{class:'btn danger',onclick:()=>{if(confirm.value==='RESET'){resetAll();toast('Reset total terminé');refresh();}else toast('Écris RESET exactement');}},'Reset total'));root.append(c)}
function cleanupPanel(root,refresh){const legacy=legacyKeys(),unknown=unknownUd5Keys();const c=card('Nettoyage ancien sécurisé','Anciennes clés supprimables. Clés ud5 inconnues: affichage seulement, pas de suppression automatique.');c.append(el('div',{class:'exercise'},'Anciennes clés détectées: '+legacy.length));c.append(el('div',{class:'exercise '+(unknown.length?'warn':'ok')},'Clés ud5 inconnues: '+unknown.length+' · suppression désactivée par sécurité'));const confirm=el('input',{class:'input',placeholder:'DELETE LEGACY'});c.append(confirm);c.append(el('div',{class:'row'},[el('button',{class:'btn danger',onclick:()=>{if(confirm.value!=='DELETE LEGACY')return toast('Écris DELETE LEGACY');legacy.forEach(k=>localStorage.removeItem(k));toast('Anciennes clés supprimées: '+legacy.length);refresh();}},'Supprimer anciennes clés'),el('button',{class:'btn green',onclick:()=>hardRefresh(refresh)},'Vider caches + SW') ]));root.append(c);const l=card('Anciennes clés','Uniquement hors ud5: dashv2_, ultimate_, dashboard_, old_, nutrition, practice, patch, legacy.');legacy.forEach(k=>l.append(el('div',{class:'small muted'},k)));root.append(l);const u=card('Clés ud5 inconnues','Non supprimées automatiquement. À intégrer au registre si elles sont valides.');unknown.forEach(k=>u.append(el('div',{class:'small muted'},k)));root.append(u)}
function diagnostic(root){const keys=localKeys();const c=card('Diagnostic stockage','Clés locales ud5: '+keys.length+' · préfixe: '+PREFIX);const counts={today:0,study:0,sport:0,money:0,leisure:0,logs:0,other:0};keys.forEach(k=>{const short=k.replace(PREFIX,'');const g=Object.keys(GROUPS).find(x=>matchAny(short,GROUPS[x]));counts[g||'other']++;});Object.entries(counts).forEach(([k,v])=>c.append(el('div',{class:'exercise'},(GROUP_LABELS[k]||k)+' · '+v+' clés')));c.append(el('div',{class:'exercise'},'Registre fonctionnalités: '+FEATURES.length+' · Certifs: '+CERTS.length));c.append(el('div',{class:'exercise'},'Anciennes clés hors ud5: '+legacyKeys().length));root.append(c);const list=card('Clés détectées','Contrôle brut pour repérer les anciennes couches.');[...keys,...legacyKeys()].sort().forEach(k=>list.append(el('div',{class:'small muted'},k)));root.append(list)}
function allKeys(){const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k)out.push(k)}return out}
function localKeys(){return allKeys().filter(k=>k.startsWith(PREFIX))}
function legacyKeys(){return allKeys().filter(k=>!k.startsWith(PREFIX)&&(LEGACY_PREFIXES.some(p=>k.startsWith(p))||LEGACY_WORDS.some(w=>k.toLowerCase().includes(w))))}
function unknownUd5Keys(){return localKeys().filter(k=>{const short=k.replace(PREFIX,'');return !Object.keys(GROUPS).some(g=>matchAny(short,GROUPS[g]))})}
function matchAny(k,arr){return arr.some(p=>k===p||k.startsWith(p))}
function resetGroup(g){localKeys().forEach(k=>{const short=k.replace(PREFIX,'');if(matchAny(short,GROUPS[g]))localStorage.removeItem(k)})}
function resetAll(){localKeys().forEach(k=>localStorage.removeItem(k))}
async function hardRefresh(refresh){let n=0;if('caches'in window){const names=await caches.keys();for(const name of names){await caches.delete(name);n++}}if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs){await r.unregister();n++}}toast('Caches/SW nettoyés: '+n);refresh()}
function download(data){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download='ultimate-dashboard-backup-'+Store.today()+'.json';a.click();URL.revokeObjectURL(a.href)}