import { EPFC_YEAR1 } from '../assets/js/epfc-year1.js';
import { EPFC_DAILY_ROTATION } from '../assets/js/practice-catalog.js';
import { BOOKS, EXERCISE_PACKS } from '../assets/js/study-catalog.js';
import { SPORT_CYCLE } from '../assets/js/data.js';
import * as Store from '../assets/js/store.js';
import { el, card, toast, isSimple } from '../assets/js/ui.js';
import { xpFor } from './game.js';

const SUPPS = {
  morning: [
    ['creatine', 'Créatine', '3-5 g'],
    ['vitaminD', 'Vitamine D3', '1000-2000 UI'],
    ['omega3', 'Oméga-3', '1-2 g EPA+DHA'],
    ['zinc', 'Zinc', '10-15 mg optionnel']
  ],
  focus: [
    ['caffeine', 'Caféine', '100-200 mg'],
    ['theanine', 'L-théanine', '100-200 mg']
  ],
  evening: [
    ['magnesium', 'Magnésium glycinate', '200-400 mg']
  ]
};

const TEMPLATES = {
  repos: {
    label: 'Repos',
    cfg: {
      work: false,
      school: false,
      fatigue: 2,
      wake: '08:00',
      sleep: '23:30',
      commuteMin: 0,
      mealsMin: 75
    }
  },
  travail: {
    label: 'Travail',
    cfg: {
      work: true,
      workStart: '09:00',
      workEnd: '17:30',
      school: false,
      fatigue: 3,
      wake: '07:00',
      sleep: '23:30',
      commuteMin: 45,
      mealsMin: 75
    }
  },
  travailCours: {
    label: 'Travail + cours',
    cfg: {
      work: true,
      workStart: '09:00',
      workEnd: '17:30',
      school: true,
      schoolStart: '18:00',
      schoolEnd: '21:30',
      fatigue: 4,
      wake: '07:00',
      sleep: '23:45',
      commuteMin: 60,
      mealsMin: 60
    }
  },
  minimum: {
    label: 'Minimum vital',
    cfg: {
      work: false,
      school: false,
      fatigue: 5,
      wake: '08:00',
      sleep: '23:00',
      commuteMin: 0,
      mealsMin: 75
    }
  },
  examen: {
    label: 'Examen',
    cfg: {
      work: false,
      school: false,
      fatigue: 3,
      wake: '07:30',
      sleep: '23:00',
      commuteMin: 0,
      mealsMin: 60,
      exam: true
    }
  },
  cash: {
    label: 'Cash / Vinted',
    cfg: {
      work: false,
      school: false,
      fatigue: 2,
      wake: '08:00',
      sleep: '23:30',
      commuteMin: 0,
      mealsMin: 75,
      cash: true
    }
  }
};

function defaultCfg() {
  return {
    work: false,
    workStart: '09:00',
    workEnd: '17:30',
    school: false,
    schoolStart: '18:00',
    schoolEnd: '21:30',
    fatigue: 3,
    wake: '07:00',
    sleep: '23:30',
    commuteMin: 45,
    mealsMin: 75,
    exam: false,
    cash: false,
    template: ''
  };
}

export function renderRoutine(root, refresh) {
  const day = getRoutine();
  const rawPlan = makePlan(day.cfg);
  const fitted = fitPlan(rawPlan, day.cfg);
  const planned = schedulePlan(fitted.plan, day.cfg);
  const next = planned.find(x => !day.done[x.id]);

  root.append(command(day, planned, fitted, next, refresh));
  root.append(templatePanel(day, refresh));
  root.append(configPanel(day, refresh));

  const grid = el('div', { class: 'grid' });
  grid.append(timeline(planned, day, refresh));

  if (!isSimple()) {
    grid.append(controlPanel(planned, day, fitted, refresh));
  }

  root.append(grid);

  if (!isSimple() && fitted.dropped.length) {
    root.append(droppedCard(fitted.dropped));
  }

  if (!isSimple()) {
    root.append(notesCard(day, refresh));
  }
}

function routineKey() {
  return 'routine_' + Store.today();
}

function getRoutine() {
  const d = Store.get(routineKey(), {
    cfg: defaultCfg(),
    done: {},
    notes: ''
  });

  d.cfg = { ...defaultCfg(), ...(d.cfg || {}) };
  d.done = d.done || {};

  return d;
}

function saveRoutine(day) {
  Store.set(routineKey(), day);
}

function command(day, plan, fitted, next, refresh) {
  const done = plan.filter(x => day.done[x.id]);
  const pct = Math.round(done.length / Math.max(1, plan.length) * 100);
  const doneXp = done.reduce((sum, x) => sum + xpFor(x.id), 0);
  const maxXp = plan.reduce((sum, x) => sum + xpFor(x.id), 0);
  const vital = Number(day.cfg.fatigue || 3) >= 5;

  const c = card(
    vital ? 'Routine · minimum vital' : 'Routine · opération',
    next ? 'Prochaine action: ' + next.time + ' · ' + next.title : 'Plan terminé.',
    'span-12'
  );

  c.className += ' ' + (vital ? 'danger' : next ? 'warn' : 'ok');

  c.append(
    el('div', { class: 'grid' }, [
      metric('Blocs', done.length + '/' + plan.length, pct + '%'),
      metric('XP', doneXp + '/' + maxXp, 'validé'),
      metric('Temps', fitted.planned + '/' + fitted.budget + ' min', 'planifié'),
      !isSimple() ? metric('Mode', vital ? 'Vital' : 'Normal', 'fatigue ' + day.cfg.fatigue + '/5') : null
    ].filter(Boolean))
  );

  c.append(el('div', { class: 'progress' }, el('div', { class: 'bar', style: 'width:' + pct + '%' })));

  if (vital) {
    c.append(el('div', { class: 'exercise danger' }, 'Fatigue 5: plan réduit. Objectif = garder la chaîne sans te cramer.'));
  }

  if (next) {
    c.append(el('button', {
      class: 'btn green',
      onclick: () => {
        day.done[next.id] = true;
        saveRoutine(day);
        logActivity(next, 'done');
        toast('Prochaine action validée');
        refresh();
      }
    }, 'Valider prochaine action'));
  }

  return c;
}

function metric(title, value, sub) {
  const c = card(title, sub, 'span-4 compact-card');
  c.append(el('div', { class: 'metric' }, value));
  return c;
}

function templatePanel(day, refresh) {
  const c = card('Templates journée', 'Choisis le scénario. La routine se recalcule et remet les validations à zéro.');
  const row = el('div', { class: 'row' });

  Object.entries(TEMPLATES).forEach(([id, t]) => {
    row.append(el('button', {
      class: 'btn ' + (day.cfg.template === id ? 'green' : ''),
      onclick: () => {
        day.cfg = { ...defaultCfg(), ...day.cfg, ...t.cfg, template: id };
        day.done = {};
        saveRoutine(day);
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
  const c = card('Journée', 'Active seulement ce qui existe aujourd’hui. Les heures disparaissent si OFF.');

  const work = checkbox(cfg.work);
  const school = checkbox(cfg.school);

  const workStart = input('début', 'time', cfg.workStart);
  const workEnd = input('fin', 'time', cfg.workEnd);
  const schoolStart = input('début', 'time', cfg.schoolStart);
  const schoolEnd = input('fin', 'time', cfg.schoolEnd);

  const fatigue = select(['1', '2', '3', '4', '5'], String(cfg.fatigue || 3));

  const wake = input('réveil', 'time', cfg.wake);
  const sleep = input('sommeil', 'time', cfg.sleep);
  const commute = input('transport min', 'number', cfg.commuteMin);
  const meals = input('repas/admin min', 'number', cfg.mealsMin);

  c.append(el('div', { class: 'grid' }, [
    toggleBlock('Travail', work, [workStart, workEnd]),
    toggleBlock('Cours / école', school, [schoolStart, schoolEnd]),
    simpleBlock('Fatigue', fatigue)
  ]));

  if (!isSimple()) {
    const adv = el('details', { class: 'exercise' });
    adv.append(el('summary', { class: 'exercise-title' }, 'Avancé: sommeil / transport / repas'));
    adv.append(el('div', { class: 'row' }, [wake, sleep, commute, meals]));
    c.append(adv);
  }

  c.append(el('button', {
    class: 'btn green',
    onclick: () => {
      day.cfg = {
        ...cfg,
        work: work.checked,
        workStart: workStart.value,
        workEnd: workEnd.value,
        school: school.checked,
        schoolStart: schoolStart.value,
        schoolEnd: schoolEnd.value,
        fatigue: Number(fatigue.value) || 3,
        wake: wake.value,
        sleep: sleep.value,
        commuteMin: Number(commute.value) || 0,
        mealsMin: Number(meals.value) || 0
      };

      day.done = {};
      saveRoutine(day);
      toast('Routine recalculée');
      refresh();
    }
  }, 'Sauver et calculer'));

  return c;
}

function toggleBlock(title, box, fields) {
  const b = el('div', { class: 'exercise span-4' });
  const status = el('span', { class: 'pill' }, box.checked ? 'ON' : 'OFF');
  const body = el('div', { class: 'row' });

  fields.forEach(f => body.append(f));

  function sync() {
    status.textContent = box.checked ? 'ON' : 'OFF';
    body.style.display = box.checked ? 'flex' : 'none';
  }

  box.addEventListener('change', sync);

  b.append(el('div', { class: 'row' }, [
    el('span', { class: 'pill' }, title),
    box,
    status
  ]));

  b.append(body);
  sync();

  return b;
}

function simpleBlock(title, field) {
  const b = el('div', { class: 'exercise span-4' });
  b.append(el('div', { class: 'row' }, [
    el('span', { class: 'pill' }, title),
    field
  ]));
  return b;
}

function timeline(plan, day, refresh) {
  const c = card('Timeline du jour', 'Ordre réel, horaires, priorité, XP.', isSimple() ? 'span-12' : 'span-8');

  plan.slice(0, isSimple() ? 8 : plan.length).forEach((x, i) => {
    c.append(timelineRow(x, i, day, refresh));
  });

  if (isSimple() && plan.length > 8) {
    c.append(el('div', { class: 'small muted' }, 'Mode simple: ' + (plan.length - 8) + ' blocs masqués. Passe en Expert pour tout voir.'));
  }

  return c;
}

function timelineRow(x, i, day, refresh) {
  const ok = Boolean(day.done[x.id]);
  const cls = ok ? 'ok' : x.p === 'N1' ? 'danger' : x.p === 'N2' ? 'warn' : '';
  const r = el('div', { class: 'exercise ' + cls });

  r.append(el('div', { class: 'row' }, [
    el('span', { class: 'pill' }, String(i + 1).padStart(2, '0')),
    el('span', { class: 'pill' }, x.p),
    !isSimple() ? el('span', { class: 'pill' }, xpFor(x.id) + ' XP') : null,
    el('span', { class: 'pill' }, x.time || '-'),
    el('b', {}, x.title)
  ].filter(Boolean)));

  r.append(el('div', { class: 'small muted' }, x.desc));

  if (x.suppGroup && !isSimple()) {
    r.append(supplementBlock(x.suppGroup, refresh));
  }

  r.append(el('button', {
    class: 'btn ' + (ok ? 'green' : ''),
    onclick: () => {
      day.done[x.id] = !ok;
      saveRoutine(day);
      logActivity(x, day.done[x.id] ? 'done' : 'open');
      toast(day.done[x.id] ? 'Bloc validé' : 'Bloc rouvert');
      refresh();
    }
  }, ok ? 'Validé' : 'Valider'));

  return r;
}

function controlPanel(plan, day, fitted, refresh) {
  const c = card('Contrôle mission', 'Vue par priorité + temps.', 'span-4');

  ['N1', 'N2', 'N3'].forEach(p => {
    const list = plan.filter(x => x.p === p);
    const done = list.filter(x => day.done[x.id]).length;

    c.append(el('div', {
      class: 'exercise ' + (p === 'N1' && done < list.length ? 'danger' : done ? 'ok' : '')
    }, [
      el('div', { class: 'exercise-title' }, p + ' · ' + done + '/' + list.length),
      el('div', { class: 'progress' }, el('div', {
        class: 'bar',
        style: 'width:' + Math.round(done / Math.max(1, list.length) * 100) + '%'
      }))
    ]));
  });

  c.append(el('div', { class: 'exercise' }, 'Temps disponible: ' + fitted.budget + ' min · planifié: ' + fitted.planned + ' min'));

  c.append(el('button', {
    class: 'btn',
    onclick: () => {
      day.done = {};
      saveRoutine(day);
      toast('Routine remise à zéro');
      refresh();
    }
  }, 'Reset validations du jour'));

  return c;
}

function makePlan(cfg) {
  cfg = { ...defaultCfg(), ...(cfg || {}) };

  const epfc = epfcToday();
  const fatigue = Number(cfg.fatigue || 3);
  const vital = fatigue >= 5;
  const tired = fatigue >= 4;
  const heavy = cfg.work && cfg.school;

  const plan = [
    block('supp_morning', 'N1', 'Suppléments matin', 'Créatine + D3 + Oméga-3 + Zinc optionnel.', '08:00', 5, 'morning'),
    block('brief', 'N1', 'Briefing', 'Lire la reprise. 5 min.', '', 5),
    block('epfc', 'N1', 'EPFC du jour', epfc.code + ' · ' + epfc.title + ' → ' + epfcResume(epfc.code), '', vital ? 15 : tired || heavy ? 25 : 45),
    block('nl', 'N1', 'NL / SELOR', nlResume(), '', vital ? 5 : tired || heavy ? 10 : 20),
    block('review', 'N1', 'Review reprise', 'Erreur, blocage, prochaine action.', '', 5),
    block('supp_evening', 'N1', 'Suppléments soir', 'Magnésium glycinate.', '22:30', 5, 'evening')
  ];

  if (cfg.work) {
    plan.splice(1, 0, block('work', 'N1', 'Travail', cfg.workStart + ' → ' + cfg.workEnd, cfg.workStart + ' → ' + cfg.workEnd, 0));
  }

  if (cfg.school) {
    plan.splice(cfg.work ? 2 : 1, 0, block('school', 'N1', 'Cours', cfg.schoolStart + ' → ' + cfg.schoolEnd, cfg.schoolStart + ' → ' + cfg.schoolEnd, 0));
  }

  if (vital) {
    return plan;
  }

  if (cfg.exam) {
    plan.push(block('exam', 'N1', 'Bloc examen', 'Révision active: erreurs + questions types.', '', 60));
  }

  const focusStart = pickStart(cfg);
  if (!isLate(focusStart)) {
    plan.push(block('supp_focus', 'N2', 'Suppléments focus', 'Caféine + L-théanine 30-60 min avant focus.', addMin(focusStart, -30), 5, 'focus'));
  }

  if (!tired) {
    plan.push(
      block('coding', 'N2', 'Coding', trackResume('coding'), '', 20),
      block('ai', 'N2', 'IA', trackResume('ai'), '', 20),
      block('iot', 'N2', 'IoT', trackResume('iot'), '', 20),
      block('repair', 'N2', 'Réparation', trackResume('repair'), '', 20)
    );
  } else {
    plan.push(
      block('coding', 'N2', 'Coding', trackResume('coding'), '', 10),
      block('iot', 'N2', 'IoT', trackResume('iot'), '', 10)
    );
  }

  plan.push(block('proof', 'N2', 'Preuve du jour', 'Note, lien, capture ou exercice validé.', '', 5));
  plan.push(block('vinted', 'N2', 'Vinted urgent', vintedDesc(), '', cfg.cash ? 25 : 10));

  if (cfg.cash) {
    plan.push(block('finance', 'N2', 'Argent / épargne', 'Mettre à jour stock, prix, décisions, épargne.', '', 25));
  }

  plan.push(block('chess', 'N3', 'Échecs', chessDesc(), '', 15));
  plan.push(block('reading', 'N3', 'Lecture scientifique', readingDesc(), '', 20));
  plan.push(block('sport', 'N3', 'Sport', 'Séance ' + sportToday(), '', tired ? 15 : 45));
  plan.push(block('admin', 'N3', 'Admin rapide', 'Préparer demain / argent.', '', 10));

  return plan;
}

function block(id, p, title, desc, time = '', min = 5, suppGroup = '') {
  return { id, p, title, desc, time, min, suppGroup };
}

function fitPlan(plan, cfg) {
  cfg = { ...defaultCfg(), ...(cfg || {}) };

  const budget = timeBudget(cfg).availablePersonal;
  let keep = [...plan];
  const dropped = [];

  const total = arr => arr.reduce((sum, x) => sum + (Number(x.min) || 0), 0);

  if (Number(cfg.fatigue || 3) >= 5) {
    keep = keep.filter(x => x.p === 'N1');
  }

  while (total(keep) > budget && keep.some(x => x.p === 'N3')) {
    const i = keep.map(x => x.p).lastIndexOf('N3');
    dropped.unshift(keep.splice(i, 1)[0]);
  }

  while (total(keep) > budget && keep.some(x => x.p === 'N2')) {
    const i = keep.map(x => x.p).lastIndexOf('N2');
    dropped.unshift(keep.splice(i, 1)[0]);
  }

  return {
    plan: keep,
    dropped,
    budget,
    planned: total(keep)
  };
}

function timeBudget(cfg) {
  const awake = diffMin(cfg.wake || '07:00', cfg.sleep || '23:30');
  const work = cfg.work ? diffMin(cfg.workStart, cfg.workEnd) : 0;
  const school = cfg.school ? diffMin(cfg.schoolStart, cfg.schoolEnd) : 0;
  const commute = cfg.work || cfg.school ? Number(cfg.commuteMin) || 0 : 0;
  const meals = Number(cfg.mealsMin) || 0;

  return {
    awake,
    work,
    school,
    commute,
    meals,
    availablePersonal: Math.max(20, awake - work - school - commute - meals)
  };
}

function schedulePlan(plan, cfg) {
  let cursor = pickStart(cfg);

  return plan.map(b => {
    if (b.time || b.min === 0) return b;

    const start = cursor;
    const end = addMin(start, b.min || 5);
    cursor = addMin(end, 5);

    return {
      ...b,
      time: start + ' → ' + end
    };
  });
}

function droppedCard(list) {
  const c = card('Blocs retirés automatiquement', 'Ils ne rentrent pas dans le temps disponible.');

  list.forEach(x => {
    c.append(el('div', { class: 'exercise' }, x.p + ' · ' + x.title + ' · ' + x.min + ' min'));
  });

  return c;
}

function supplementBlock(group, refresh) {
  const data = Store.get('supplements_' + Store.today(), {});
  const box = el('div', { class: 'exercise' });

  (SUPPS[group] || []).forEach(s => {
    const rec = data[s[0]] || {
      taken: false,
      dose: s[2],
      time: ''
    };

    const dose = input('dose', 'text', rec.dose);
    const time = input('heure', 'time', rec.time);

    box.append(el('div', { class: 'exercise' }, [
      el('b', {}, s[1]),
      el('div', { class: 'small muted' }, s[2]),
      el('div', { class: 'row' }, [
        dose,
        time,
        el('button', {
          class: 'btn ' + (rec.taken ? 'green' : ''),
          onclick: () => {
            data[s[0]] = {
              taken: !rec.taken,
              dose: dose.value,
              time: time.value
            };

            Store.set('supplements_' + Store.today(), data);
            toast(data[s[0]].taken ? 'Pris' : 'Rouvert');
            refresh();
          }
        }, rec.taken ? 'Pris' : 'Marquer pris')
      ])
    ]));
  });

  return box;
}

function notesCard(day, refresh) {
  const c = card('Notes routine', 'Reprise exacte et blocages.');
  const t = el('textarea', {
    class: 'input',
    rows: '3',
    placeholder: 'reprise, blocage, prochaine action'
  }, day.notes || '');

  c.append(t);

  c.append(el('button', {
    class: 'btn green',
    onclick: () => {
      day.notes = t.value;
      saveRoutine(day);
      toast('Notes sauvegardées');
      refresh();
    }
  }, 'Sauver notes'));

  return c;
}

function checkbox(v) {
  const x = el('input', { type: 'checkbox' });
  x.checked = Boolean(v);
  return x;
}

function input(placeholder, type = 'text', value = '') {
  return el('input', {
    class: 'input',
    placeholder,
    type,
    value,
    style: 'max-width:170px'
  });
}

function select(items, value) {
  const s = el('select', {
    class: 'input',
    style: 'max-width:170px'
  });

  items.forEach(x => s.append(el('option', { value: x }, x)));
  s.value = value;

  return s;
}

function pickStart(cfg) {
  if (cfg.work && cfg.school) return addMin(cfg.schoolEnd, 20);
  if (cfg.work) return addMin(cfg.workEnd, 30);
  if (cfg.school) return addMin(cfg.schoolEnd, 20);
  return '09:00';
}

function isLate(t) {
  return Number(String(t).split(':')[0]) >= 16;
}

function toMin(t) {
  const [h, m] = String(t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function diffMin(a, b) {
  let d = toMin(b) - toMin(a);
  if (d < 0) d += 1440;
  return d;
}

function addMin(t, m) {
  let x = toMin(t) + m;

  while (x < 0) x += 1440;
  while (x >= 1440) x -= 1440;

  return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
}

function logActivity(x, status) {
  Store.push('study_activity', {
    domain: 'routine',
    kind: x.p,
    title: x.title,
    time: x.time,
    status,
    date: Store.today()
  });
}

function vintedDesc() {
  const list = Store.get('vinted_items', []).filter(x => x.status !== 'sold' && x.status !== 'abandoned');
  const n30 = list.filter(x => age(x) >= 30).length;
  const n14 = list.filter(x => age(x) >= 14).length;

  if (n30) return n30 + ' articles ≥30j: baisser, booster ou abandonner.';
  if (n14) return n14 + ' articles ≥14j: baisser prix.';

  return 'Vérifier stock, messages, prix, boosts si besoin.';
}

function age(x) {
  return Math.max(0, Math.floor((new Date(Store.today()) - new Date(x.listedAt || Store.today())) / 86400000));
}

function chessDesc() {
  const h = Store.get('chess_elo_history', []);
  const last = h[h.length - 1];

  return last ? 'ELO ' + last.elo + ' · 1 partie analysée ou 5 puzzles.' : 'ELO à logger + 1 partie ou 5 puzzles.';
}

function readingDesc() {
  const st = Store.get('reading_tracks', {});
  let active = 'choisir un parcours et lire 10-20 pages';

  Object.values(st).some(track => Object.values(track.books || {}).some(b => {
    if (!b.done && b.current !== undefined) {
      active = b.title + ' · ' + (b.current || 0) + '/' + (b.total || '?') + ' pages';
      return true;
    }

    return false;
  }));

  return active;
}

function epfcToday() {
  return courseByCode(EPFC_DAILY_ROTATION[dayIndex(new Date()) % EPFC_DAILY_ROTATION.length]);
}

function dayIndex(d) {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d - start) / 86400000);
}

function courseByCode(code) {
  return EPFC_YEAR1.find(c => c.code === code) || EPFC_YEAR1[0];
}

function epfcResume(code) {
  const st = Store.get('epfc_y1_state', {})[code] || {};
  const course = courseByCode(code);
  const res = course.resources[st.activeIndex || 0];

  if (!res) return 'parcours terminé';

  const p = st.progress?.[res[0]] || {};

  return res[1] + ' · ' + (p.current || 0) + '/' + (p.total || '?') + ' ' + res[3];
}

function trackResume(track) {
  const st = Store.get('track_state', {})[track] || {};
  const book = (BOOKS[track] || [])[st.bookIndex || 0] || 'livres terminés';
  const ex = (EXERCISE_PACKS[track] || [])[st.exerciseIndex || 0] || 'exercices terminés';

  return 'Livre: ' + book + ' · Exercice: ' + ex;
}

function nlResume() {
  const d = Store.get('nl_program', {
    level: 'A1',
    target: 'SELOR'
  });

  return d.level + ' → ' + d.target;
}

function sportToday() {
  const c = Store.sportCycle();
  const diff = Math.floor((new Date(Store.today()) - new Date(c.anchorDate)) / 86400000);
  const start = SPORT_CYCLE.indexOf(c.anchorType);

  return SPORT_CYCLE[((start < 0 ? 0 : start) + diff % SPORT_CYCLE.length + SPORT_CYCLE.length) % SPORT_CYCLE.length];
}
