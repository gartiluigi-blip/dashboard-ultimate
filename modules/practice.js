import { DAILY_DOMAINS, PRACTICE_SITES, PRACTICE_QUEUE } from '../assets/js/practice-catalog.js';
import * as Store from '../assets/js/store.js';
import { el, card, subTabs, toast } from '../assets/js/ui.js';
let domain='coding';
export function renderPractice(root,rr){
 root.append(card('Practice quotidien','À faire tous les jours hors EPFC: Coding + IA + IoT + Réparation. Tu valides les exercices un par un, le suivant apparaît en reprise.'));
 root.append(subTabs([...DAILY_DOMAINS,'sql','web','security','nl'].map(x=>({id:x,label:x.toUpperCase()})),domain,id=>{domain=id;rr();}));
 renderResume(root);
 renderSites(root,rr);
 renderQueue(root,rr);
}
function state(){return Store.get('practice_state',{});}function save(s){Store.set('practice_state',s);}function dstate(s=state()){s[domain]=s[domain]||{index:0,done:{},notes:{}};return s[domain];}
function renderResume(root){const s=dstate();const q=PRACTICE_QUEUE[domain]||[];const next=q[s.index]||'File terminée';root.append(card('Reprise '+domain.toUpperCase(),next+' · exercice '+Math.min(s.index+1,q.length)+'/'+q.length));}
function renderSites(root,rr){const c=card('Sites / challenges '+domain.toUpperCase(),'Choisis une plateforme, puis ajoute un exercice dans la file.');(PRACTICE_SITES[domain]||[]).forEach(site=>{c.append(el('div',{class:'exercise'},[el('b',{},site[0]),el('div',{class:'small muted'},site[2]+' · '+site[1]),el('button',{class:'btn',onclick:()=>{Store.push('study_materials',{course:domain,source:'Challenge site',title:site[0],url:site[1],current:0,total:0,status:'active'});toast('Site ajouté au matériel');rr()}},'Ajouter site')]))});root.append(c)}
function renderQueue(root,rr){const s=state();const ds=dstate(s);const q=PRACTICE_QUEUE[domain]||[];const c=card('File exercices '+domain.toUpperCase(),'Validation séquentielle. Pas de dispersion.');q.forEach((name,i)=>{const done=!!ds.done[name];const locked=i>ds.index;const row=el('div',{class:'exercise '+(done?'ok':locked?'warn':'')});row.append(el('div',{class:'exercise-title'},(done?'✅ ':locked?'🔒 ':'🎯 ')+name));row.append(el('div',{class:'small muted'},locked?'Verrouillé jusqu’à validation du précédent':done?'Validé':'À faire maintenant'));
 if(!locked&&!done){const note=el('input',{class:'input',placeholder:'note / erreur / lien preuve'});row.append(el('div',{class:'row'},[note,el('button',{class:'btn green',onclick:()=>{ds.done[name]=true;ds.notes[name]=note.value;ds.index=Math.min(ds.index+1,q.length);s[domain]=ds;save(s);Store.push('study_activity',{domain,exercise:name,status:'done',note:note.value,date:Store.today()});toast('Exercice validé, suivant débloqué');rr()}},'Valider et débloquer suivant')]))}
 c.append(row)});root.append(c)}
