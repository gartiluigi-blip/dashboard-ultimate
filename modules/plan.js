import * as Store from '../assets/js/store.js';
import { el, card, toast } from '../assets/js/ui.js';

const SECTIONS=[
  {id:'nutrition',label:'Nutrition',desc:'Repas, suppléments, eau et protéines.'},
  {id:'home',label:'Mission',desc:'Plan complet et file d’action détaillée.'},
  {id:'routine',label:'Jour',desc:'Templates travail, cours et fatigue.'},
  {id:'sport',label:'Sport',desc:'Cycle PPL, séries, progression et historique.'},
  {id:'study',label:'Étude',desc:'EPFC, NL, tracks techniques, erreurs et preuves.'},
  {id:'money',label:'Argent',desc:'Vinted, cashflow, épargne et décisions.'},
  {id:'leisure',label:'Loisir',desc:'Échecs, lecture et récupération.'},
  {id:'settings',label:'Système',desc:'Sauvegarde, diagnostics et réglages.'}
];
function go(route){window.dispatchEvent(new CustomEvent('ud5:navigate',{detail:{route}}))}
function focus(){return Store.get('focus_quarter',{primary:['EPFC / informatique','Sport santé','Argent / Vinted'],parking:['Échecs','Lecture avancée','IA avancée','IoT avancé']})}
export function renderPlan(root,refresh){const f=focus();const c=card('PLAN · axes actifs','Le contenu reste disponible. Seuls trois axes entrent dans la mission quotidienne.','span-12 module-hero');const active=el('div',{class:'grid'});f.primary.slice(0,3).forEach((item,index)=>active.append(card('#'+(index+1)+' · '+item,'Actif maintenant.','span-4 compact-card ok')));c.append(active);root.append(c);const edit=card('Focus trimestre','Change les trois axes sans supprimer le parking.','span-12');const fields=f.primary.slice(0,3).map((item,index)=>el('input',{class:'input',placeholder:'Axe '+(index+1),value:item}));const parking=el('input',{class:'input',placeholder:'Parking séparé par virgules',value:(f.parking||[]).join(', ')});edit.append(el('div',{class:'grid'},fields.map(field=>{const wrap=el('div',{class:'span-4'});wrap.append(field);return wrap;})),parking,el('button',{class:'btn green',onclick:()=>{const primary=fields.map(field=>field.value.trim()).filter(Boolean).slice(0,3);Store.set('focus_quarter',{primary,parking:parking.value.split(',').map(item=>item.trim()).filter(Boolean)});toast('Focus sauvegardé');refresh()}},'Sauver les axes'));root.append(edit);const all=card('Tout le contenu','Le dashboard ne perd rien : ouvre seulement ce dont tu as besoin.','span-12');const grid=el('div',{class:'grid'});SECTIONS.forEach(section=>{const item=card(section.label,section.desc,'span-4 compact-card');item.append(el('button',{class:'btn',onclick:()=>go(section.id)},'Ouvrir'));grid.append(item)});all.append(grid);root.append(all)}
