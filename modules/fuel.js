import * as Store from '../assets/js/store.js';
import { el, card, toast } from '../assets/js/ui.js';
const WATER_GOAL = 3000;
const PROTEIN_GOAL = 150;
export function renderFuel(root, refresh){
  const date = Store.today();
  const data = Store.get('fuel_' + date, { water:0, protein:0 });
  const box = card('Tracker eau / protéines', 'Eau: ' + data.water + '/' + WATER_GOAL + ' ml · Protéines: ' + data.protein + '/' + PROTEIN_GOAL + ' g');
  box.append(bar(data.water, WATER_GOAL));
  box.append(row([
    btn('+250 ml', () => add(data, 'water', 250, date, refresh)),
    btn('+500 ml', () => add(data, 'water', 500, date, refresh)),
    btn('Reset eau', () => setVal(data, 'water', 0, date, refresh))
  ]));
  box.append(bar(data.protein, PROTEIN_GOAL));
  box.append(row([
    btn('+25 g', () => add(data, 'protein', 25, date, refresh)),
    btn('+50 g', () => add(data, 'protein', 50, date, refresh)),
    btn('Reset prot', () => setVal(data, 'protein', 0, date, refresh))
  ]));
  root.append(box);
}
function add(data, key, amount, date, refresh){ data[key] = Math.max(0, Number(data[key]||0) + amount); Store.set('fuel_' + date, data); toast(key === 'water' ? 'Eau ajoutee' : 'Proteines ajoutees'); refresh(); }
function setVal(data, key, val, date, refresh){ data[key] = val; Store.set('fuel_' + date, data); toast('Tracker mis a jour'); refresh(); }
function bar(v, max){ return el('div', { class:'progress' }, el('div', { class:'bar', style:'width:' + Math.min(100, Math.round(Number(v||0)/max*100)) + '%' })); }
function row(children){ return el('div', { class:'row' }, children); }
function btn(label, fn){ return el('button', { class:'btn', onclick:fn }, label); }
