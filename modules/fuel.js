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
  p.append(section('Eau',data.water,WATER_GOAL,'ml',data,date,'water',refresh,[250,500]));
  p.append(section('Protéines',data.protein,PROTEIN_GOAL,'g',data,date,'protein',refresh,[25,50]));
  return p;
}
function section(title,value,goal,unit,data,date,key,refresh,quick){
  const wrap=el('div',{});
  wrap.append(el('div',{class:'fuel-title'},title+' · '+value+'/'+goal+' '+unit));
  wrap.append(bar(value,goal));
  wrap.append(row([btn('+'+quick[0]+' '+unit,()=>add(data,date,key,quick[0],refresh)),btn('+'+quick[1]+' '+unit,()=>add(data,date,key,quick[1],refresh)),btn('Reset',()=>setv(data,date,key,0,refresh))]));
  const manual=el('input',{class:'fuel-manual',type:'number',min:'0',placeholder:'valeur exacte '+unit,value:value});
  wrap.append(row([manual,btn('Sauver '+unit,()=>setv(data,date,key,Number(manual.value||0),refresh))]));
  return wrap;
}
function add(data,date,key,amount,refresh){data[key]=Math.max(0,Number(data[key]||0)+amount);Store.set('fuel_'+date,data);toast(key==='water'?'Eau ajoutée':'Protéines ajoutées');renderFuelFab(refresh);}
function setv(data,date,key,value,refresh){data[key]=Math.max(0,Number(value||0));Store.set('fuel_'+date,data);toast('Valeur sauvegardée');renderFuelFab(refresh);}
function bar(v,max){return el('div',{class:'fuel-mini-progress'},el('div',{class:'fuel-mini-bar',style:'width:'+Math.min(100,Math.round(Number(v||0)/max*100))+'%'}));}
function row(children){return el('div',{class:'fuel-row'},children);}
function btn(label,fn){return el('button',{class:'fuel-chip',onclick:fn},label);}
