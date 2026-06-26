import * as Store from '../assets/js/store.js';
import { el, card, hero, kpi, progress, detailsBlock, pill, toast } from '../assets/js/ui.js';
import { BASE } from './nutrition-data.js';
import { DAYS_A } from './nutrition-days-a.js';
import { WEEKLY_MEAL_PLAN } from './meal-plan.js';

const DAYS={...DAYS_A,...WEEKLY_MEAL_PLAN};
const ORDER=[1,2,3,4,5,6,0];
const key=()=> 'nutrition_'+Store.today();
const getDay=()=>{const d=Store.get(key(),{done:{}});d.done=d.done||{};return d};
const save=d=>Store.set(key(),d);
const plan=()=>DAYS[new Date().getDay()]||DAYS[1];
const pTotal=d=>BASE.breakfast.protein+BASE.snack.protein+d.lunch.protein+d.dinner.protein;

export function renderNutrition(root,refresh){
 const p=plan(),d=getDay(),actions=buildActions(p),required=actions.filter(x=>!x.optional),done=required.filter(x=>d.done[x.id]).length;
 root.append(hero('Nutrition · '+p.name,'Menus simples, heures fixes, grammes crus/cuits et checklist datée.',[el('button',{class:'btn',onclick:()=>{d.done={};save(d);toast('Checklist réinitialisée');refresh()}},'Reset du jour')]));
 root.append(el('div',{class:'grid'},[kpi('Protéines prévues','≈'+pTotal(p)+' g','cible ≥150 g','ok'),kpi('Checklist',done+'/'+required.length,Math.round(done/required.length*100)+'%'),kpi('Eau','2,5 L','zéro sucre ajouté')]));
 const next=actions.find(x=>!x.optional&&!d.done[x.id])||actions.find(x=>x.optional&&!d.done[x.id]);
 const command=card('Prochaine exécution',next?next.label:'Plan nutrition terminé.','span-12 '+(next?'warn':'ok'));
 if(next){command.append(el('div',{class:'row'},[pill(next.time),pill(next.optional?'OPTION':'N1',next.optional?'':'danger'),el('b',{},next.label)]),el('div',{class:'small muted'},next.meta),el('button',{class:'btn green',onclick:()=>flip(next,d,refresh)},'Valider'));}
 root.append(command);
 const g=el('div',{class:'grid'});const menu=card('Menu du jour','Les quantités sont nettes. Cru/cuit est indiqué.','span-8');[BASE.breakfast,p.lunch,BASE.snack,p.dinner].forEach(m=>menu.append(meal(m)));g.append(menu,checklist(actions,d,refresh));root.append(g);
 root.append(supplements(p));root.append(week(p));root.append(prep());
}

function buildActions(p){const omega=p.fattyFish?{id:'omega',time:'07:30',label:'Oméga-3 non requis',meta:'Poisson gras prévu au dîner.',optional:true}:{id:'omega',time:'07:30',label:'Oméga-3 · 1 g EPA+DHA',meta:'Option capsule avec petit-déjeuner.',optional:true};return [
{id:'water',time:'07:00',label:'Eau · 500 ml',meta:'Démarrage hydratation.',optional:false},
{id:'breakfast',time:'07:30',label:'Petit-déjeuner terminé',meta:'Skyr, avoine, œufs, fruits, lin.',optional:false},
{id:'creatine',time:'07:30',label:'Créatine monohydrate · 3 à 5 g',meta:'Tous les jours avec le petit-déjeuner.',optional:false},
{id:'d3',time:'07:30',label:'Vitamine D3 selon protocole',meta:'Option avec repas contenant des lipides.',optional:true},omega,
{id:'focus',time:'08:30',label:'Focus étude · caféine + L-théanine + citicoline',meta:'Option : caféine 100 mg + L-théanine 200 mg + citicoline 250 mg. Rien après 14h.',optional:true},
{id:'lunch',time:'12:30',label:'Déjeuner terminé',meta:p.lunch.items[0],optional:false},
{id:'snack',time:'16:30',label:'Collation terminée',meta:'Skyr, oléagineux, fruit.',optional:false},
{id:'dinner',time:'19:30',label:'Dîner terminé',meta:p.dinner.items[0],optional:false},
{id:'waterTotal',time:'21:00',label:'Total eau · 2,5 L',meta:'Coche seulement cible atteinte.',optional:false},
{id:'sugar',time:'21:00',label:'Zéro sucre ajouté',meta:'Pas de soda, jus, biscuits, dessert, sauce sucrée ou energy drink.',optional:false},
{id:'magnesium',time:'22:00',label:'Magnésium bisglycinate · 200 à 300 mg',meta:'Routine récupération du soir.',optional:false},
{id:'cutoff',time:'22:00',label:'Aucune caféine après 14h',meta:'Protection du sommeil.',optional:false}
];}
function flip(a,d,refresh){d.done[a.id]=!d.done[a.id];save(d);toast(d.done[a.id]?'Validé':'Réouvert');refresh();}
function meal(m){const b=el('div',{class:'exercise'});const l=el('ul',{class:'small'});m.items.forEach(x=>l.append(el('li',{},x)));b.append(el('div',{class:'row'},[pill(m.time),el('b',{},m.title),pill('≈'+m.protein+' g prot','green')]),l);return b;}
function checklist(actions,d,refresh){const c=card('Checklist du jour','Coche au fur et à mesure. Les OPTION ne baissent pas le score.','span-4');actions.forEach(a=>{const checked=!!d.done[a.id],box=el('input',{type:'checkbox',checked,style:'width:20px;height:20px'});box.addEventListener('change',()=>flip(a,d,refresh));c.append(el('label',{class:'action-row '+(checked?'ok':'')},[el('div',{class:'action-main'},[el('div',{class:'row'},[box,pill(a.time),el('b',{},a.label),a.optional?pill('OPTION'):null]),el('div',{class:'small muted'},a.meta)])]));});const r=actions.filter(x=>!x.optional),n=r.filter(x=>d.done[x.id]).length;c.append(progress(n,r.length));return c;}
function supplements(p){const c=card('Suppléments','Protocole court. Les options ne sont pas obligatoires.');const g=el('div',{class:'grid'});[['Base','07:30','Créatine 3–5 g · D3 selon protocole · Oméga-3 seulement sans poisson gras'],['Focus','08:30','Caféine 100 mg + L-théanine 200 mg + citicoline 250 mg (option)'],['Soir','22:00','Magnésium bisglycinate 200–300 mg · glycine 3 g (option)']].forEach(x=>g.append(el('div',{class:'exercise span-4'},[el('b',{},x[0]),el('div',{class:'small muted'},x[1]),el('div',{class:'small'},x[2])])));c.append(g,el('div',{class:'small muted'},'Évite pré-workouts chargés, energy drinks, test boosters, brûleurs et mégadoses.'));return c;}
function week(today){const c=card('Rotation semaine','Même petit-déjeuner et même collation. Déjeuner/dîner tournent.');ORDER.forEach(i=>{const d=DAYS[i];c.append(detailsBlock(d.name+' · ≈'+pTotal(d)+' g protéines',[el('div',{class:'exercise '+(d.name===today.name?'ok':'')},[el('div',{class:'small'},'12:30 · '+d.lunch.items.slice(0,2).join(' · ')),el('div',{class:'small'},'19:30 · '+d.dinner.items.slice(0,2).join(' · '))])]));});return c;}
function prep(){const c=card('Préparation dimanche','90 minutes. Prépare les bases ; poisson à cuire le jour même.');c.append(el('div',{class:'grid'},[el('div',{class:'exercise span-4'},'Poulet/dinde 2 kg crus · bœuf 700 g · riz 600 g cru · pommes de terre 3 kg · légumes 4 kg'),el('div',{class:'exercise span-4'},'Skyr 3 kg · œufs 24 · poisson 1,2 kg · sardines 2 boîtes · fruits rouges 1 kg · 14 fruits'),el('div',{class:'exercise span-4'},'Huile d’olive · citron · ail · paprika · curcuma · poivre · herbes · cannelle') ]));return c;}
