import { BOOKS, EXERCISE_PACKS } from '../assets/js/study-catalog.js';
import { SPORT_CYCLE } from '../assets/js/data.js';
import * as Store from '../assets/js/store.js';
import { el, card, toast, isSimple } from '../assets/js/ui.js';
import { xpFor } from './game.js';

const TRACKS = new Set(['nl','coding','ai','iot','repair','python','linux','network','security','epfc','proof','exam']);
const TEMPLATES = {
  repos: { label: 'Repos', cfg: { work:false, school:false, fatigue:2, wake:'08:00', sleep:'23:30', cash:false, exam:false } },
  travail: { label: 'Travail', cfg: { work:true, workStart:'09:00', workEnd:'17:30', school:false, fatigue:3, wake:'07:00', sleep:'23:30', cash:false, exam:false } },
  travailCours: { label: 'Travail + cours', cfg: { work:true, workStart:'09:00', workEnd:'17:30', school:true, schoolStart:'18:00', schoolEnd:'21:30', fatigue:4, wake:'07:00', sleep:'23:45', cash:false, exam:false } },
  minimum: { label: 'Minimum vital', cfg: { work:false, school:false, fatigue:5, wake:'08:00', sleep:'23:00', cash:false, exam:false } },
  examen: { label: 'Examen', cfg: { work:false, school:false, fatigue:3, wake:'07:30', sleep:'23:00', cash:false, exam:true } },
  cash: { label: 'Cash / Vinted', cfg: { work:false, school:false, fatigue:2, wake:'08:00', sleep:'23:30', cash:true, exam:false } }
};

function defaultCfg() {
  return { work:false, workStart:'09:00', workEnd:'17:30', school:false, schoolStart:'18:00', schoolEnd:'21:30', fatigue:3, wake:'07:00', sleep:'23:30', cash:false, exam:false, template:'' };
}

export function renderRoutine(root, refresh) {
  const day = getDay();
  const fullPlan = buildPlan(day.cfg);
  const openPlan = fullPlan.filter(item => !day.done[item.id]);
  root.append(commandCard(day, fullPlan, openPlan, refresh));
  root.append(templatePanel(day, refresh));
  root.append(configPanel(day, refresh));
  const grid = el('div', { class:'grid' });
  grid.append(timeline(openPlan, day, refresh));
  if (!isSimple()) grid.append(controlPanel(fullPlan, day, refresh));
  root.append(grid);
  if (!isSimple()) root.append(notesCard(day, refresh));
}

function key() { return 'routine_' + Store.today(); }
function getDay() {
  const day = Store.get(key(), { cfg: defaultCfg(), done:{}, notes:'' });
  day.cfg = { ...defaultCfg(), ...(day.cfg || {}) };
  day.done = day.done || {};
  return day;
}
function saveDay(day) { Store.set(key(), day); }

function commandCard(day, fullPlan, openPlan, refresh) {
  const done = fullPlan.length - openPlan.length;
  const pct = Math.round(done / Math.max(1, fullPlan.length) * 100);
  const xp = fullPlan.filter(x => day.done[x.id]).reduce((sum, x) => sum + xpFor(x.id), 0);
  const next = openPlan[0];
  const title = next ? 'Prochaine action: ' + next.title : 'Plan terminé.';
  const c = card('Routine · opération', title, 'span-12 ' + (next ? 'warn' : 'ok'));
  c.append(el('div', { class:'grid' }, [
    metric('Blocs', done + '/' + fullPlan.length, pct + '%'),
    metric('Restants', String(openPlan.length), 'masqués après validation'),
    metric('XP', String(xp), 'validé')
  ]));
  c.append(el('div', { class:'progress' }, el('div', { class:'bar', style:'width:' + pct + '%' })));
  if (next) c.append(validatePanel(next, day, refresh, true));
  return c;
}

function metric(title, value, sub) {
  const c = card(title, sub, 'span-4 compact-card');
  c.append(el('div', { class:'metric' }, value));
  return c;
}

function templatePanel(day, refresh) {
  const c = card('Templates journée', 'Choisis le scénario.');
  const row = el('div', { class:'row' });
  Object.entries(TEMPLATES).forEach(([id, t]) => {
    row.append(el('button', {
      class:'btn ' + (day.cfg.template === id ? 'green' : ''),
      onclick: () => {
        day.cfg = { ...defaultCfg(), ...t.cfg, template:id };
        day.done = {};
        saveDay(day);
        toast('Template appliqué: ' + t.label);
        refresh();
      }
    }, t.label));
  });
  c.append(row);
  return c;
}

function configPanel(day, refresh) {
  const cfg = { ...defaultCfg(), ...(day.cfg || {}) };
  const c = card('Journée', 'Travail/cours OFF = heures masquées.');
  const work = checkbox(cfg.work);
  const school = checkbox(cfg.school);
  const ws = input('début', 'time', cfg.workStart);
  const we = input('fin', 'time', cfg.workEnd);
  const ss = input('début', 'time', cfg.schoolStart);
  const se = input('fin', 'time', cfg.schoolEnd);
  const fatigue = select(['1','2','3','4','5'], String(cfg.fatigue || 3));
  c.append(el('div', { class:'grid' }, [
    toggleBlock('Travail', work, [ws, we]),
    toggleBlock('Cours / école', school, [ss, se]),
    simpleBlock('Fatigue', fatigue)
  ]));
  c.append(el('button', {
    class:'btn green',
    onclick: () => {
      day.cfg = { ...cfg, work:work.checked, workStart:ws.value, workEnd:we.value, school:school.checked, schoolStart:ss.value, schoolEnd:se.value, fatigue:+fatigue.value || 3 };
      day.done = {};
      saveDay(day);
      toast('Routine recalculée');
      refresh();
    }
  }, 'Sauver et calculer'));
  return c;
}

function toggleBlock(title, box, fields) {
  const wrap = el('div', { class:'exercise span-4' });
  const status = el('span', { class:'pill' }, box.checked ? 'ON' : 'OFF');
  const body = el('div', { class:'row' });
  fields.forEach(field => body.append(field));
  function sync() {
    status.textContent = box.checked ? 'ON' : 'OFF';
    body.style.display = box.checked ? 'flex' : 'none';
  }
  box.addEventListener('change', sync);
  wrap.append(el('div', { class:'row' }, [el('span', { class:'pill' }, title), box, status]), body);
  sync();
  return wrap;
}
function simpleBlock(title, field) { return el('div', { class:'exercise span-4' }, el('div', { class:'row' }, [el('span', { class:'pill' }, title), field])); }

function timeline(openPlan, day, refresh) {
  const c = card('Timeline du jour', 'Les blocs validés disparaissent. Les blocs matière mettent à jour leur tracker.', isSimple() ? 'span-12' : 'span-8');
  if (!openPlan.length) c.append(el('div', { class:'empty-state' }, 'Plan terminé.'));
  openPlan.slice(0, isSimple() ? 8 : openPlan.length).forEach((item, index) => c.append(row(item, index, day, refresh)));
  return c;
}

function row(item, index, day, refresh) {
  const cls = item.p === 'N1' ? 'danger' : item.p === 'N2' ? 'warn' : '';
  const r = el('div', { class:'exercise ' + cls });
  r.append(el('div', { class:'row' }, [
    el('span', { class:'pill' }, String(index + 1).padStart(2, '0')),
    el('span', { class:'pill' }, item.p),
    el('span', { class:'pill' }, item.time || '-'),
    el('b', {}, item.title)
  ]));
  r.append(el('div', { class:'small muted' }, item.desc));
  r.append(validatePanel(item, day, refresh, false));
  return r;
}

function validatePanel(item, day, refresh, compact) {
  if (TRACKS.has(item.id)) return studyPanel(item, day, refresh, compact);
  return el('button', { class:'btn green', onclick: () => finish(item, day, refresh, {}) }, 'Valider et masquer');
}

function studyPanel(item, day, refresh, compact) {
  const track = mapTrack(item.id);
  const res = activeResource(track);
  const pagesRead = input('pages lues', 'number', res.current);
  const totalPages = input('total pages', 'number', res.total);
  const note = el('input', { class:'input', placeholder:'note / preuve / erreur' });
  const wrap = el('div', { class:'exercise' });
  wrap.append(el('div', { class:'small muted' }, 'Tracker lié: ' + track.toUpperCase() + ' · ' + res.title));
  wrap.append(el('div', { class:'row' }, compact ? [pagesRead, totalPages] : [pagesRead, totalPages, note]));
  wrap.append(el('div', { class:'row' }, [
    el('button', { class:'btn green', onclick: () => {
      saveStudy(track, res.title, +pagesRead.value || 0, +totalPages.value || 0, note.value, false);
      finish(item, day, refresh, { track, title:res.title });
    } }, 'Valider et masquer'),
    el('button', { class:'btn', onclick: () => {
      saveStudy(track, res.title, +pagesRead.value || 0, +totalPages.value || 0, note.value, true);
      finish(item, day, refresh, { track, title:res.title, finished:true });
    } }, 'Terminer ressource')
  ]));
  return wrap;
}

function finish(item, day, refresh, extra) {
  day.done[item.id] = true;
  saveDay(day);
  Store.push('study_activity', { domain:'routine', kind:item.p, title:item.title, date:Store.today(), status:'done', ...extra });
  toast('Bloc validé et masqué');
  refresh();
}

function mapTrack(id) {
  if (id === 'epfc') return 'coding';
  if (id === 'proof' || id === 'exam') return 'nl';
  return id;
}
function activeResource(track) {
  const state = Store.get('track_state', {})[track] || {};
  const list = BOOKS[track] || [];
  const title = list[state.bookIndex || 0] || 'Ressource active';
  const p = state.books?.[title] || {};
  return { title, current:p.current || 0, total:p.total || 0 };
}
function saveStudy(track, title, current, total, note, finishResource) {
  const state = Store.get('track_state', {});
  const s = state[track] || { bookIndex:0, books:{}, exerciseIndex:0, done:{}, notes:{} };
  s.books = s.books || {};
  const p = s.books[title] || { current:0, total:0, done:false };
  p.current = current || p.current || 0;
  p.total = total || p.total || 0;
  p.note = note || p.note || '';
  if (finishResource || (p.total && p.current >= p.total)) {
    p.done = true;
    s.bookIndex = Math.min((s.bookIndex || 0) + 1, (BOOKS[track] || []).length);
  }
  s.books[title] = p;
  state[track] = s;
  Store.set('track_state', state);
  Store.push('study_activity', { domain:track, kind:'routine_book', title, pagesRead:p.current, total:p.total, note, finished:p.done, date:Store.today(), source:track === 'nl' ? 'NL' : 'OReilly' });
  if (note) Store.push('proofs', { course:'étude', title:note, date:Store.today(), dueDate:Store.today(), status:'validated', source:track === 'nl' ? 'NL' : 'OReilly' });
}

function controlPanel(plan, day, refresh) {
  const c = card('Contrôle mission', 'Vue par priorité.', 'span-4');
  ['N1','N2','N3'].forEach(p => {
    const list = plan.filter(x => x.p === p);
    const done = list.filter(x => day.done[x.id]).length;
    c.append(el('div', { class:'exercise ' + (done === list.length ? 'ok' : '') }, p + ' · ' + done + '/' + list.length));
  });
  c.append(el('button', { class:'btn', onclick: () => { day.done = {}; saveDay(day); toast('Routine remise à zéro'); refresh(); } }, 'Reset validations du jour'));
  return c;
}

function buildPlan(cfg) {
  const fatigue = +cfg.fatigue || 3;
  const vital = fatigue >= 5;
  const tired = fatigue >= 4;
  const plan = [
    block('brief','N1','Briefing','Lire la reprise. 5 min.', '', 5),
    block('nl','N1','NL / SELOR', trackResume('nl'), '', vital ? 5 : 20),
    block('coding','N1','Coding / EPFC', trackResume('coding'), '', vital ? 10 : 25),
    block('review','N1','Review reprise','Erreur, blocage, prochaine action.', '', 5)
  ];
  if (cfg.work) plan.splice(1, 0, block('work','N1','Travail', cfg.workStart + ' → ' + cfg.workEnd, cfg.workStart + ' → ' + cfg.workEnd, 0));
  if (cfg.school) plan.splice(cfg.work ? 2 : 1, 0, block('school','N1','Cours', cfg.schoolStart + ' → ' + cfg.schoolEnd, cfg.schoolStart + ' → ' + cfg.schoolEnd, 0));
  if (vital) return schedule(plan);
  if (!tired) plan.push(block('ai','N2','IA',trackResume('ai'),'',20), block('iot','N2','IoT',trackResume('iot'),'',20), block('repair','N2','Réparation',trackResume('repair'),'',20));
  plan.push(block('proof','N2','Preuve du jour','Note, lien, capture ou exercice validé.','',5));
  plan.push(block('vinted','N2','Vinted urgent',vintedDesc(),'',cfg.cash ? 25 : 10));
  plan.push(block('sport','N3','Sport','Séance ' + sportToday(),'',tired ? 15 : 45));
  plan.push(block('admin','N3','Admin rapide','Préparer demain / argent.','',10));
  return schedule(plan);
}
function block(id, p, title, desc, time='', min=5) { return { id, p, title, desc, time, min }; }
function schedule(plan) { let h = 9; return plan.map(item => { if (item.time || item.min === 0) return item; const start = String(h).padStart(2,'0') + ':00'; h += 1; return { ...item, time:start }; }); }
function notesCard(day, refresh) { const c = card('Notes routine','Reprise exacte et blocages.'); const t = el('textarea', { class:'input', rows:'3', placeholder:'notes' }, day.notes || ''); c.append(t, el('button', { class:'btn green', onclick: () => { day.notes = t.value; saveDay(day); toast('Notes sauvées'); refresh(); } }, 'Sauver notes')); return c; }
function input(placeholder, type='text', value='') { return el('input', { class:'input', placeholder, type, value:String(value ?? ''), style:'max-width:160px' }); }
function select(items, value) { const s = el('select', { class:'input' }); items.forEach(x => s.append(el('option', { value:x }, x))); s.value = value; return s; }
function checkbox(value) { return el('input', { type:'checkbox', checked:!!value }); }
function trackResume(track) { const state = Store.get('track_state', {})[track] || {}; const book = (BOOKS[track] || [])[state.bookIndex || 0] || 'livres terminés'; const ex = (EXERCISE_PACKS[track] || [])[state.exerciseIndex || 0] || 'exercices terminés'; return 'Livre: ' + book + ' · Exercice: ' + ex; }
function vintedDesc() { const list = Store.get('vinted_items', []).filter(x => x.status !== 'sold' && x.status !== 'abandoned'); return list.length ? list.length + ' articles actifs à contrôler.' : 'Vérifier stock, messages, prix.'; }
function sportToday() { const c = Store.sportCycle(); const diff = Math.floor((new Date(Store.today()) - new Date(c.anchorDate)) / 86400000); const start = SPORT_CYCLE.indexOf(c.anchorType); return SPORT_CYCLE[((start < 0 ? 0 : start) + diff % SPORT_CYCLE.length + SPORT_CYCLE.length) % SPORT_CYCLE.length]; }
