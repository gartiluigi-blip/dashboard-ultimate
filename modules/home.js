import { EPFC_YEAR1 } from '../assets/js/epfc-year1.js';
import { EPFC_DAILY_ROTATION } from '../assets/js/practice-catalog.js';
import { BOOKS, EXERCISE_PACKS } from '../assets/js/study-catalog.js';
import { SPORT_CYCLE } from '../assets/js/data.js';
import * as Store from '../assets/js/store.js';
import { el, card, toast } from '../assets/js/ui.js';

export function renderHome(root, refresh){
  const day = Store.get('home_' + Store.today(), { done: {}, notes: '' });
  const plan = buildPlan();
  const done = Object.values(day.done || {}).filter(Boolean).length;
  const score = Math.round((done / plan.length) * 100);
  const top = card('Aujourd’hui · cockpit', 'Score: ' + done + '/' + plan.length + ' · ' + score + '%');
  top.append(el('div', { class: 'progress' }, el('div', { class: 'bar', style: 'width:' + score + '%' })));
  root.append(top);
  const grid = el('div', { class: 'grid' });
  plan.forEach(item => grid.append(tile(item, day, refresh)));
  root.append(grid);
  const notes = card('Notes reprise', 'Sauvegarde locale du jour.');
  const txt = el('textarea', { class: 'input', rows: '4', placeholder: 'ou je me suis arrete, blocage, prochaine action' }, day.notes || '');
  notes.append(txt);
  notes.append(el('button', { class: 'btn green', onclick: () => { day.notes = txt.value; save(day); toast('Notes sauvegardees'); refresh(); } }, 'Sauver notes'));
  root.append(notes);
}

function save(day){ Store.set('home_' + Store.today(), day); }
function tile(item, day, refresh){
  const ok = !!day.done[item.id];
  const c = card(item.title, item.desc, item.big ? 'span-6' : 'span-4');
  c.className += ' ' + (ok ? 'ok' : '');
  c.append(el('button', { class: 'btn ' + (ok ? 'green' : ''), onclick: () => { day.done[item.id] = !ok; save(day); toast(day.done[item.id] ? 'Valide' : 'Rouvert'); refresh(); } }, ok ? 'Valide' : 'Valider'));
  return c;
}
function buildPlan(){
  const ep = epfcToday();
  return [
    { id:'mission', title:'Mission maintenant', desc:'Commencer par le premier bloc non valide.', big:true },
    { id:'epfc', title:'EPFC du jour', desc: ep.code + ' · ' + ep.title + ' → ' + epfcResume(ep.code), big:true },
    { id:'coding', title:'Coding', desc: trackResume('coding') },
    { id:'ai', title:'IA', desc: trackResume('ai') },
    { id:'iot', title:'IoT', desc: trackResume('iot') },
    { id:'repair', title:'Reparation', desc: trackResume('repair') },
    { id:'nl', title:'NL / SELOR', desc: nlResume() },
    { id:'sport', title:'Sport', desc: 'Seance: ' + sportToday() },
    { id:'proof', title:'Preuve du jour', desc:'Une preuve: exercice, note, lien, capture.' },
    { id:'review', title:'Review soir', desc:'Erreur, reprise, prochaine action.' }
  ];
}
function epfcToday(){ return byCode(EPFC_DAILY_ROTATION[dayIndex(new Date()) % EPFC_DAILY_ROTATION.length]); }
function dayIndex(d){ return Math.floor((d - new Date(d.getFullYear(), 0, 1)) / 86400000); }
function byCode(code){ return EPFC_YEAR1.find(c => c.code === code) || EPFC_YEAR1[0]; }
function epfcResume(code){
  const st = Store.get('epfc_y1_state', {})[code] || {};
  const c = byCode(code);
  const r = c.resources[st.activeIndex || 0];
  if (!r) return 'termine';
  const p = (st.progress || {})[r[0]] || {};
  return r[1] + ' · ' + (p.current || 0) + '/' + (p.total || '?') + ' ' + r[3];
}
function trackResume(track){
  const st = Store.get('track_state', {})[track] || {};
  const book = (BOOKS[track] || [])[st.bookIndex || 0] || 'livres termines';
  const ex = (EXERCISE_PACKS[track] || [])[st.exerciseIndex || 0] || 'exercices termines';
  return 'Livre: ' + book + ' · Exercice: ' + ex;
}
function nlResume(){ const d = Store.get('nl_program', { level:'A1', target:'SELOR' }); return d.level + ' → ' + d.target; }
function sportToday(){
  const c = Store.sportCycle();
  const diff = Math.floor((new Date(Store.today()) - new Date(c.anchorDate)) / 86400000);
  const start = SPORT_CYCLE.indexOf(c.anchorType);
  return SPORT_CYCLE[((start < 0 ? 0 : start) + diff % SPORT_CYCLE.length + SPORT_CYCLE.length) % SPORT_CYCLE.length];
}
