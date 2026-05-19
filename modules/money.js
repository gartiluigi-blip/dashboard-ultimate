import * as Store from '../assets/js/store.js';
import { el, card, subTabs, toast } from '../assets/js/ui.js';
let panel='vinted';
export function renderMoney(root, refresh){
  root.append(subTabs([{id:'vinted',label:'Vinted'},{id:'finance',label:'Finance'},{id:'stock',label:'Stock'}], panel, id=>{panel=id;refresh();}));
  const box=el('div'); root.append(box);
  if(panel==='finance') return finance(box, refresh);
  if(panel==='stock') return stock(box, refresh);
  vinted(box, refresh);
}
function input(p,t='text',v=''){return el('input',{class:'input',placeholder:p,type:t,value:v});}
function vinted(root, rr){
  const list=Store.get('vinted_items',[]);
  const c=card('Vinted Profit Command','Ajout article, prix achat, frais, vente, profit, ROI.');
  const name=input('article'); const brand=input('marque'); const buy=input('achat €','number'); const ship=input('frais €','number'); const boost=input('boost €','number'); const ask=input('prix annonce €','number');
  c.append(el('div',{class:'row'},[name,brand,buy,ship,boost,ask]));
  c.append(el('button',{class:'btn green',onclick:()=>{Store.push('vinted_items',{name:name.value,brand:brand.value,buy:+buy.value||0,shipping:+ship.value||0,boost:+boost.value||0,asking:+ask.value||0,sold:0,status:'listed',listedAt:Store.today()});toast('Article ajoute');rr();}},'Ajouter article'));
  root.append(c);
  root.append(summary(list));
  list.slice().reverse().forEach(x=>root.append(item(x,rr)));
}
function summary(list){
  const invested=list.reduce((s,x)=>s+(+x.buy||0)+(+x.shipping||0)+(+x.boost||0),0);
  const revenue=list.reduce((s,x)=>s+(+x.sold||0),0);
  const profit=revenue-invested;
  return card('Résumé Vinted','Investi: '+money(invested)+' · Ventes: '+money(revenue)+' · Profit net: '+money(profit)+' · Articles: '+list.length);
}
function item(x,rr){
  const cost=(+x.buy||0)+(+x.shipping||0)+(+x.boost||0); const profit=(+x.sold||0)-cost; const roi=cost?Math.round(profit/cost*100):0;
  const c=card((x.brand?x.brand+' · ':'')+(x.name||'Article'), 'Statut: '+x.status+' · coût '+money(cost)+' · vente '+money(x.sold||0)+' · profit '+money(profit)+' · ROI '+roi+'%');
  const sold=input('prix vendu €','number',x.sold||'');
  c.append(el('div',{class:'row'},[sold,el('button',{class:'btn green',onclick:()=>{Store.updateList('vinted_items',x.id,{sold:+sold.value||0,status:'sold',soldAt:Store.today()});toast('Vente enregistree');rr();}},'Marquer vendu'),el('button',{class:'btn',onclick:()=>{Store.updateList('vinted_items',x.id,{status:'stale'});toast('Marque stale');rr();}},'Stale'),el('button',{class:'btn',onclick:()=>{Store.updateList('vinted_items',x.id,{status:'abandoned'});toast('Abandonne');rr();}},'Abandon') ]));
  return c;
}
function stock(root,rr){
  const list=Store.get('vinted_items',[]).filter(x=>x.status!=='sold');
  root.append(card('Stock actif','Articles non vendus: '+list.length));
  list.forEach(x=>root.append(card(x.name||'Article',(x.brand||'-')+' · annonce '+money(x.asking||0)+' · achat '+money(x.buy||0)+' · statut '+x.status)));
}
function finance(root,rr){
  const d=Store.get('finance_month',{income:2300,rent:665,energy:100,internet:70,phone:15,gym:30,insurance:115,contribution:500,other:0,savingsGoalPct:20});
  const c=card('Finance War Room','Charges fixes, reste à vivre, objectif épargne.');
  const fields=['income','rent','energy','internet','phone','gym','insurance','contribution','other','savingsGoalPct']; const inputs={};
  fields.forEach(f=>{inputs[f]=input(f,'number',d[f]||0); c.append(inputs[f]);});
  c.append(el('button',{class:'btn green',onclick:()=>{fields.forEach(f=>d[f]=+inputs[f].value||0);Store.set('finance_month',d);toast('Finance sauvee');rr();}},'Sauver finance'));
  root.append(c);
  const charges=d.rent+d.energy+d.internet+d.phone+d.gym+d.insurance+d.contribution+d.other; const savings=Math.round(d.income*d.savingsGoalPct/100); const left=d.income-charges-savings;
  root.append(card('Mensuel','Revenu '+money(d.income)+' · charges '+money(charges)+' · épargne cible '+money(savings)+' · reste après épargne '+money(left)));
}
function money(n){return (Number(n)||0).toFixed(2)+' €';}
