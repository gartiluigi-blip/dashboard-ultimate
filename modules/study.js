import { CERTS, STUDY_TABS } from '../assets/js/data.js';
import * as Store from '../assets/js/store.js';
import { el, card, subTabs, toast } from '../assets/js/ui.js';
let panel='resources';
export function renderStudy(root, rerender){
  root.append(subTabs([{id:'resources',label:'Ressources'},{id:'certs',label:'Certifications'},{id:'proofs',label:'Preuves'},{id:'exam',label:'Mode examen'}],panel,id=>{panel=id;rerender();}));
  const box=el('div'); root.append(box);
  if(panel==='certs') return certs(box,rerender);
  if(panel==='proofs') return proofs(box,rerender);
  if(panel==='exam') return exam(box);
  resources(box,rerender);
}
function input(p,t='text'){return el('input',{class:'input',placeholder:p,type:t});}
function sel(items){const s=el('select',{class:'input'});items.forEach(x=>s.append(el('option',{value:x},x)));return s;}
function resources(root,rerender){
  const list=Store.get('study_resources',[]);
  const c=card('Ressources étude','Livres, cours, vidéos, labs, progression.');
  const domain=sel(STUDY_TABS);const title=input('Titre');const cur=input('Actuel','number');const total=input('Total','number');
  c.append(el('div',{class:'row'},[domain,title,cur,total]));
  c.append(el('button',{class:'btn green',onclick:()=>{Store.push('study_resources',{domain:domain.value,title:title.value,current:Number(cur.value||0),total:Number(total.value||0),status:'active'});toast('Ressource ajoutée');rerender();}},'Ajouter'));
  root.append(c);
  list.forEach(r=>{const pct=r.total?Math.round((Number(r.current||0)/Number(r.total))*100):0;const row=card(r.title||'Ressource',r.domain+' · '+pct+'%');row.append(el('div',{class:'progress'},el('div',{class:'bar',style:'width:'+Math.min(100,pct)+'%'})));row.append(el('button',{class:'btn',onclick:()=>{Store.updateList('study_resources',r.id,{current:Number(r.current||0)+1});rerender();}},'+1'));root.append(row);});
}
function certs(root,rerender){
 const list=Store.get('certifications',[]);const c=card('Certifications','Roadmap IT, coding, IA, IoT.');const name=sel(CERTS);const date=input('Date cible','date');c.append(el('div',{class:'row'},[name,date]));c.append(el('button',{class:'btn green',onclick:()=>{Store.push('certifications',{name:name.value,targetDate:date.value,status:'planned',scores:[]});toast('Certification ajoutée');rerender();}},'Ajouter'));root.append(c);
 list.forEach(x=>{const row=card(x.name,'Statut: '+x.status+' · cible: '+(x.targetDate||'-'));const score=input('Score %','number');row.append(el('div',{class:'row'},[score,el('button',{class:'btn',onclick:()=>{Store.updateList('certifications',x.id,{scores:[...(x.scores||[]),{date:Store.today(),score:Number(score.value||0)}]});rerender();}},'Score'),el('button',{class:'btn green',onclick:()=>{Store.updateList('certifications',x.id,{status:'passed'});rerender();}},'Réussie')]));root.append(row);});
}
function proofs(root,rerender){
 const list=Store.get('proofs',[]);const c=card('Preuves','Une compétence = une preuve.');const domain=sel(STUDY_TABS);const title=input('Titre preuve');const due=input('Échéance','date');c.append(el('div',{class:'row'},[domain,title,due]));c.append(el('button',{class:'btn green',onclick:()=>{Store.push('proofs',{domain:domain.value,title:title.value,dueDate:due.value,status:'todo'});toast('Preuve ajoutée');rerender();}},'Ajouter'));root.append(c);
 list.forEach(p=>{const row=card(p.title,p.domain+' · '+p.status+' · '+(p.dueDate||'-'));row.append(el('div',{class:'row'},[el('button',{class:'btn green',onclick:()=>{Store.updateList('proofs',p.id,{status:'validated'});rerender();}},'Valider'),el('button',{class:'btn',onclick:()=>{Store.updateList('proofs',p.id,{status:'active'});rerender();}},'En cours')]));root.append(row);});
}
function exam(root){const r=Store.get('study_resources',[]).length;const p=Store.get('proofs',[]);const v=p.filter(x=>x.status==='validated').length;root.append(card('Mode examen','Ressources: '+r+' · preuves validées: '+v+'/'+p.length));}
