import * as Store from '../assets/js/store.js';
import { el, toast } from '../assets/js/ui.js';
const WATER_GOAL=3000;
const PROTEIN_GOAL=150;
let open=false;
export function renderFuelFab(refresh){
  let node=document.getElementById('fuel-fab');
  if(node) node.remove();
  const date=Store.today();
  const data=Store.get('fuel_'+date,{water:0,protein:0});
  node=el('div',{id:'fuel-fab',class:'fuel-fab'});
  const pill=el('button',{class:'fuel-pill',onclick:()=>{open=!open;renderFuelFab(refresh);}},'💧 '+data.water+'/'+WATER_GOAL+' · 🍗 '+data.protein+'/'+PROTEIN_GOAL);
  node.append(pill);
  if(open) node.append(panel(data,date,refresh));
  document.body.append(node);
}
function panel(data,date,refresh){
  const p=el('div',{class:'fuel-popover'});
  p.append(el('div',{class:'fuel-title'},'Eau'));
  p.append(bar(data.water,WATER_GOAL));
  p.append(row([btn('+250 ml',()=>add(data,date,'water',250,refresh)),btn('+500 ml',()=>add(data,date,'water',500,refresh)),btn('Reset',()=>setv(data,date,'water',0,refresh))]));
  p.append(el('div',{class:'fuel-title'},'Protéines'));
  p.append(bar(data.protein,PROTEIN_GOAL));
  p.append(row([btn('+25 g',()=>add(data,date,'protein',25,refresh)),btn('+50 g',()=>add(data,date,'protein',50,refresh)),btn('Reset',()=>setv(data,date,'protein',0,refresh))]));
  return p;
}
function add(data,date,key,amount,refresh){data[key]=Math.max(0,Number(data[key]||0)+amount);Store.set('fuel_'+date,data);toast(key==='water'?'Eau ajoutée':'Protéines ajoutées');renderFuelFab(refresh);}
function setv(data,date,key,value,refresh){data[key]=value;Store.set('fuel_'+date,data);toast('Tracker mis à jour');renderFuelFab(refresh);}
function bar(v,max){return el('div',{class:'fuel-mini-progress'},el('div',{class:'fuel-mini-bar',style:'width:'+Math.min(100,Math.round(Number(v||0)/max*100))+'%'}));}
function row(children){return el('div',{class:'fuel-row'},children);}
function btn(label,fn){return el('button',{class:'fuel-chip',onclick:fn},label);}
