/* app.js — main entry point */
'use strict';

(function () {

  /* ─── utils ─── */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function el(tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else if (k.startsWith('data-')) e.setAttribute(k, attrs[k]);
      else e[k] = attrs[k];
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function toast(msg, duration) {
    var t = qs('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, duration || 2000);
  }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }

  function fmtDate(d) {
    if (!d) d = new Date();
    var days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    var months = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
    return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function pct(v, max) { return Math.min(100, max > 0 ? Math.round(v / max * 100) : 0); }

  /* ─── Header date ─── */
  function initHeader() {
    var d = qs('#header-date');
    if (d) d.textContent = fmtDate(new Date());
  }

  /* ═══════════════════════════════════════════
     PAGE : AUJOURD'HUI
  ═══════════════════════════════════════════ */
  function renderAujourdhui() {
    var page = qs('#page-aujourdhui');
    if (!page) return;

    var today = Store.today();
    var log = Store.getLog(today);
    var streaks = Store.getStreaks();
    var focusMin = Store.todayFocusMinutes();

    page.innerHTML = '';

    /* Hero — prochaine action */
    var rotation = D.todayRotation();
    var hero = el('div', { class:'hero-card' });
    hero.innerHTML =
      '<div class="hero-eyebrow">⚡ Prochaine action</div>' +
      '<div class="hero-content">' + (rotation.tasks[0] || 'Planifie ta journée') + '</div>' +
      '<div class="hero-sub">' + rotation.day.charAt(0).toUpperCase() + rotation.day.slice(1) + ' · ' +
        rotation.tasks.length + ' blocs</div>';
    page.appendChild(hero);

    /* Stats rapides */
    var statRow = el('div', { class:'stat-row' });
    var totalStudy = (log.epfc_min||0)+(log.code_min||0)+(log.nl_min||0)+(log.ia_min||0)+(log.repair_min||0)+(log.iot_min||0);
    statRow.innerHTML =
      '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + focusMin + '</div><div class="stat-label">Focus min</div></div>' +
      '<div class="stat-box stat-box-g"><div class="stat-value v-gold">' + totalStudy + '</div><div class="stat-label">Étude min</div></div>' +
      '<div class="stat-box stat-box-gr"><div class="stat-value v-green">' + (log.sport === '✓ Fait' ? '✓' : '–') + '</div><div class="stat-label">Sport</div></div>';
    page.appendChild(statRow);

    /* Focus launcher */
    page.appendChild(renderFocusCard());

    /* Reprendre */
    page.appendChild(renderBookmarksCard());

    /* Priorités du jour */
    page.appendChild(renderPrioritiesCard(today));

    /* Log du jour */
    page.appendChild(renderLogCard(today));

    /* Objectifs du mois */
    page.appendChild(renderObjectivesCard());

    /* Streaks */
    page.appendChild(renderStreaksCard(streaks));
  }

  /* ─── Focus card ─── */
  var focusState = { running: false, seconds: 0, domain: null, interval: null };

  function renderFocusCard() {
    var card = el('div', { class:'card card-glow-o' });

    var head = el('div', { class:'card-head' });
    head.innerHTML = '<div class="card-title"><span class="card-title-icon">🥊</span> Focus</div>';
    card.appendChild(head);

    var grid = el('div', { class:'focus-domain-grid' });
    D.FOCUS_DOMAINS.forEach(function (d) {
      var btn = el('button', { class:'focus-btn', type:'button' }, d);
      if (focusState.domain === d) btn.classList.add('selected');
      btn.addEventListener('click', function () {
        focusState.domain = d;
        qsa('.focus-btn', card).forEach(function (b) {
          b.classList.toggle('selected', b.textContent === d);
        });
        qs('.focus-domain-label', card).textContent = d;
      });
      grid.appendChild(btn);
    });
    card.appendChild(grid);

    var display = el('div', { class:'focus-timer-display' });
    var timeEl  = el('div', { class:'focus-time' + (focusState.running ? ' running' : '') }, fmtTime(focusState.seconds));
    var lblEl   = el('div', { class:'focus-domain-label' }, focusState.domain || 'Choisir domaine');
    display.appendChild(timeEl);
    display.appendChild(lblEl);
    card.appendChild(display);

    var controls = el('div', { class:'focus-controls' });

    var btnStart = el('button', { class:'btn btn-primary', type:'button' },
      focusState.running ? '⏸ Pause' : (focusState.seconds > 0 ? '▶ Reprendre' : '▶ Démarrer'));

    var btnStop = el('button', { class:'btn btn-secondary', type:'button' }, '⏹ Stop');

    btnStart.addEventListener('click', function () {
      if (!focusState.domain && !focusState.running) { toast('Choisis un domaine'); return; }
      if (focusState.running) {
        clearInterval(focusState.interval);
        focusState.running = false;
        btnStart.textContent = '▶ Reprendre';
      } else {
        focusState.running = true;
        btnStart.textContent = '⏸ Pause';
        timeEl.classList.add('running');
        focusState.interval = setInterval(function () {
          focusState.seconds++;
          timeEl.textContent = fmtTime(focusState.seconds);
        }, 1000);
      }
    });

    btnStop.addEventListener('click', function () {
      if (focusState.seconds < 30) { focusState.seconds = 0; timeEl.textContent = fmtTime(0); return; }
      clearInterval(focusState.interval);
      Store.addFocusSession(focusState.domain, focusState.seconds);
      Store.updateStreak(focusState.domain);
      toast('Session ' + focusState.domain + ' · ' + Math.round(focusState.seconds/60) + 'min sauvegardée');
      focusState.running = false;
      focusState.seconds = 0;
      focusState.domain = null;
      timeEl.textContent = fmtTime(0);
      timeEl.classList.remove('running');
      lblEl.textContent = 'Choisir domaine';
      btnStart.textContent = '▶ Démarrer';
      qsa('.focus-btn', card).forEach(function (b) { b.classList.remove('selected'); });
    });

    controls.appendChild(btnStart);
    controls.appendChild(btnStop);
    card.appendChild(controls);

    return card;
  }

  /* ─── Bookmarks / Reprendre card ─── */
  function renderBookmarksCard() {
    var card = el('div', { class:'card' });
    card.innerHTML = '<div class="card-head"><div class="card-title"><span class="card-title-icon">📍</span> Reprendre</div></div>';

    var list = el('div', { class:'bookmark-list' });
    var bm = Store.getBookmarks();

    D.BOOKMARKS.forEach(function (b) {
      var saved = bm[b.id] || {};
      var item = el('div', { class:'bookmark-item' });

      var left = el('div', { class:'bookmark-left' });
      left.innerHTML = '<span class="bookmark-icon">' + b.icon + '</span><span class="bookmark-label">' + b.label + '</span>';

      var inp = el('input', {
        type: 'text',
        placeholder: b.ph,
        value: saved.position || ''
      });
      inp.addEventListener('change', function () {
        Store.setBookmark(b.id, { position: inp.value });
      });

      item.appendChild(left);
      item.appendChild(inp);
      list.appendChild(item);
    });

    card.appendChild(list);
    return card;
  }

  /* ─── Priorities card ─── */
  function renderPrioritiesCard(today) {
    var card = el('div', { class:'card' });

    function rebuild() {
      card.innerHTML = '';
      var head = el('div', { class:'card-head' });
      head.innerHTML = '<div class="card-title">🎯 Priorités du jour</div>';

      /* Add form */
      var form = el('div', { class:'flex gap-6 mt-8', style:'margin-bottom:10px' });
      var txt = el('input', { type:'text', placeholder:'Nouvelle priorité...', style:'flex:1' });
      var sel = el('select', { style:'width:60px;flex-shrink:0' });
      ['A','B','C'].forEach(function (l) {
        var o = el('option', { value:l }, l);
        sel.appendChild(o);
      });
      sel.value = 'B';
      var addBtn = el('button', { class:'btn btn-primary btn-sm', type:'button' }, '+');
      addBtn.addEventListener('click', function () {
        var v = txt.value.trim();
        if (!v) return;
        Store.addPriority(v, sel.value, 'Autre');
        txt.value = '';
        rebuild();
      });
      txt.addEventListener('keydown', function (e) { if (e.key === 'Enter') addBtn.click(); });
      form.appendChild(txt);
      form.appendChild(sel);
      form.appendChild(addBtn);

      card.appendChild(head);
      card.appendChild(form);

      var list = Store.getPriorities(today);
      if (!list.length) {
        card.appendChild(el('div', { class:'empty-state' },
          el('div', { class:'empty-state-text text-muted' }, 'Aucune priorité pour aujourd\'hui')));
        return;
      }

      list.forEach(function (p) {
        var item = el('div', { class:'priority-item' + (p.done ? ' done' : '') });
        var tag  = el('span', { class:'tag tag-' + p.level.toLowerCase() }, p.level);
        var lbl  = el('span', { class:'priority-text' }, p.text);
        var chk  = el('button', { class:'btn-icon', type:'button' }, p.done ? '✓' : '○');
        var del  = el('button', { class:'btn-icon', type:'button' }, '×');
        chk.addEventListener('click', function () { Store.togglePriority(p.id); rebuild(); });
        del.addEventListener('click', function () { Store.deletePriority(p.id); rebuild(); });
        item.appendChild(tag);
        item.appendChild(lbl);
        item.appendChild(chk);
        item.appendChild(del);
        card.appendChild(item);
      });
    }

    rebuild();
    return card;
  }

  /* ─── Log du jour card ─── */
  function renderLogCard(today) {
    var card = el('div', { class:'card' });
    card.innerHTML = '<div class="card-head"><div class="card-title">📋 Log du jour</div></div>';

    var log = Store.getLog(today);
    var grid = el('div', { class:'log-grid' });

    D.LOG_FIELDS.forEach(function (f) {
      var wrap = el('div', { class:'log-field' + (f.wide ? ' ' : '') });
      if (f.wide) wrap.style.gridColumn = 'span 2';
      var label = el('label', {}, f.label + (f.unit ? ' (' + f.unit + ')' : ''));

      var input;
      if (f.type === 'select') {
        input = el('select', {});
        (f.options || []).forEach(function (o) {
          var opt = el('option', { value:o }, o);
          input.appendChild(opt);
        });
        input.value = log[f.id] || '';
      } else if (f.type === 'text') {
        input = el('input', { type:'text', placeholder:'Notes...', value: log[f.id] || '' });
      } else {
        input = el('input', { type:'number', min:'0', value: log[f.id] || '' });
      }

      input.addEventListener('change', function () {
        var data = {}; data[f.id] = input.value;
        Store.setLog(today, data);
      });

      wrap.appendChild(label);
      wrap.appendChild(input);
      grid.appendChild(wrap);
    });

    card.appendChild(grid);

    var saveBtn = el('button', { class:'btn btn-primary btn-sm mt-8', type:'button' }, '💾 Sauvegarder');
    saveBtn.style.marginTop = '10px';
    saveBtn.addEventListener('click', function () { toast('Log sauvegardé'); });
    card.appendChild(saveBtn);

    return card;
  }

  /* ─── Objectives card ─── */
  function renderObjectivesCard() {
    var card = el('div', { class:'card' });
    card.innerHTML = '<div class="card-head"><div class="card-title">🏆 Objectifs du mois</div></div>';

    var objs = Store.getObjectives();
    if (!objs.length) {
      var addBtn2 = el('button', { class:'btn btn-secondary btn-sm', type:'button' }, '+ Ajouter objectif');
      addBtn2.addEventListener('click', function () { showAddObjectiveModal(); });
      card.appendChild(el('div', { class:'empty-state' },
        el('div', { class:'empty-state-text text-muted' }, 'Aucun objectif ce mois')));
      card.appendChild(addBtn2);
      return card;
    }

    objs.forEach(function (o) {
      var item = el('div', { class:'obj-item' });
      var p = pct(o.current || 0, o.target || 1);
      item.innerHTML =
        '<div class="obj-head"><span class="obj-label">' + o.label + '</span><span class="obj-pct">' + p + '%</span></div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + p + '%"></div></div>';
      card.appendChild(item);
    });

    var addBtn = el('button', { class:'btn btn-secondary btn-sm mt-8', type:'button' }, '+ Objectif');
    addBtn.style.marginTop = '10px';
    addBtn.addEventListener('click', showAddObjectiveModal);
    card.appendChild(addBtn);
    return card;
  }

  function showAddObjectiveModal() {
    var label = prompt('Objectif :');
    if (!label) return;
    var target = parseInt(prompt('Cible (nombre) :') || '0', 10);
    var objs = Store.getObjectives();
    objs.push({ id: Date.now(), label: label, target: target, current: 0 });
    Store.setObjectives(objs);
    renderAujourdhui();
  }

  /* ─── Streaks card ─── */
  function renderStreaksCard(streaks) {
    var card = el('div', { class:'card' });
    card.innerHTML = '<div class="card-head"><div class="card-title">🔥 Streaks</div></div>';

    var domains = ['EPFC','CODE','NL','IA','LECTURE','SPORT','RÉPARATION','IOT'];
    var grid = el('div', { class:'streak-grid' });

    domains.forEach(function (d) {
      var s = streaks[d] || { count: 0 };
      var chip = el('div', { class:'streak-chip' });
      chip.innerHTML = '<div class="streak-num">' + (s.count || 0) + '</div><div class="streak-name">' + d + '</div>';
      grid.appendChild(chip);
    });

    card.appendChild(grid);
    return card;
  }

  /* ═══════════════════════════════════════════
     PAGE : ROUTINE
  ═══════════════════════════════════════════ */
  function renderRoutine() {
    var page = qs('#page-routine');
    if (!page) return;
    page.innerHTML = '';

    var today = Store.today();
    var rotation = D.todayRotation();
    var checks = Store.getRoutineChecks(today);

    /* Day badge */
    var pill = el('div', { class:'day-badge' },
      '📅 ' + rotation.day.charAt(0).toUpperCase() + rotation.day.slice(1));
    page.appendChild(pill);

    /* Travail */
    var workCard = el('div', { class:'card card-l-orange' });
    workCard.innerHTML =
      '<div class="card-head"><div class="card-title"><span class="card-title-icon">💼</span> Travail</div></div>' +
      '<div class="work-grid">' +
        '<div class="log-field"><label>Début</label><input type="time" id="rt-work-start"></div>' +
        '<div class="log-field"><label>Fin</label><input type="time" id="rt-work-end"></div>' +
        '<div class="log-field" style="grid-column:span 2"><label>Fatigue (1-5)</label><input type="number" id="rt-fatigue" min="1" max="5" style="max-width:100px"></div>' +
      '</div>';
    var rtData = Store.get('routine_work_' + today, {});
    page.appendChild(workCard);

    setTimeout(function () {
      var ws = qs('#rt-work-start'), we = qs('#rt-work-end'), fa = qs('#rt-fatigue');
      if (ws) { ws.value = rtData.start || ''; ws.addEventListener('change', saveRT); }
      if (we) { we.value = rtData.end || '';   we.addEventListener('change', saveRT); }
      if (fa) { fa.value = rtData.fatigue || ''; fa.addEventListener('change', saveRT); }
      function saveRT() {
        Store.set('routine_work_' + today, {
          start: ws ? ws.value : '', end: we ? we.value : '',
          fatigue: fa ? fa.value : ''
        });
      }
    }, 0);

    /* Rotation du jour */
    var rotTitle = el('div', { class:'section-title' }, 'Rotation du jour');
    page.appendChild(rotTitle);

    var icons = { 'EPFC':'🎓','Coding':'💻','IoT':'🌐','Lecture':'📚','Réparation':'🔧','IA':'🤖',
                  'Néerlandais':'🇳🇱','Sport':'💪','Souplesse':'🧘','Vinted':'🛍','Famille':'👨‍👩‍👧','Weekly':'📊',
                  'Révision':'📖','Planning':'📅','Stretch':'🧘','Mobilité':'🦵','Échecs':'♟️','Long':'📚' };

    function getIcon(label) {
      var keys = Object.keys(icons);
      for (var i = 0; i < keys.length; i++) {
        if (label.indexOf(keys[i]) >= 0) return icons[keys[i]];
      }
      return '▸';
    }

    rotation.tasks.forEach(function (task, idx) {
      var done = !!checks[idx];
      var block = el('div', { class:'routine-block' + (done ? ' done' : '') });
      block.innerHTML =
        '<div class="routine-block-icon">' + getIcon(task) + '</div>' +
        '<div class="routine-block-info">' +
          '<div class="routine-block-title">' + task + '</div>' +
        '</div>';
      var chk = el('button', { class:'btn-icon', type:'button' }, done ? '✓' : '○');
      chk.addEventListener('click', function () {
        Store.toggleRoutineCheck(idx, today);
        renderRoutine();
      });
      block.appendChild(chk);
      page.appendChild(block);
    });

    /* Total productif */
    var log = Store.getLog(today);
    var total = (log.epfc_min||0)+(log.code_min||0)+(log.nl_min||0)+(log.repair_min||0)+(log.iot_min||0);
    var doneCount = Object.values(checks).filter(Boolean).length;

    var totalCard = el('div', { class:'card card-glow-o' });
    totalCard.style.marginTop = '12px';
    totalCard.innerHTML =
      '<div class="card-head"><div class="card-title"><span class="card-title-icon">⚡</span> Total productif</div></div>' +
      '<div class="stat-row">' +
        '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + total + '</div><div class="stat-label">Min étude</div></div>' +
        '<div class="stat-box stat-box-g"><div class="stat-value v-gold">' + doneCount + '/' + rotation.tasks.length + '</div><div class="stat-label">Blocs faits</div></div>' +
        '<div class="stat-box stat-box-gr"><div class="stat-value v-green">' + (log.sport === '✓ Fait' ? '1' : '0') + '</div><div class="stat-label">Sport</div></div>' +
      '</div>';
    page.appendChild(totalCard);
  }

  /* ═══════════════════════════════════════════
     PAGE : STATS
  ═══════════════════════════════════════════ */
  function renderStats() {
    var page = qs('#page-stats');
    if (!page) return;
    page.innerHTML = '';

    /* Last 7 days */
    var sTitle = el('div', { class:'section-title' }, '7 derniers jours');
    page.appendChild(sTitle);

    var sessions = Store.getFocusSessions();
    var today = Store.today();

    /* Heatmap */
    var hCard = el('div', { class:'card' });
    hCard.innerHTML = '<div class="card-head"><div class="card-title">📅 Activité (90j)</div></div>';
    var hRow = el('div', { class:'heatmap-row' });

    var dailyMap = {};
    sessions.forEach(function (s) {
      dailyMap[s.date] = (dailyMap[s.date] || 0) + Math.round(s.seconds / 60);
    });

    for (var i = 89; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var dk = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      var min = dailyMap[dk] || 0;
      var lvl = min === 0 ? '0' : min < 30 ? '1' : min < 60 ? '2' : min < 120 ? '3' : '4';
      var cell = el('div', { class:'heatmap-cell', 'data-level': lvl, title: dk + ': ' + min + 'min' });
      hRow.appendChild(cell);
    }
    hCard.appendChild(hRow);
    page.appendChild(hCard);

    /* Domain totals */
    var domCard = el('div', { class:'card' });
    domCard.innerHTML = '<div class="card-head"><div class="card-title">📊 Minutes par domaine</div></div>';

    var domTotals = {};
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    sessions.filter(function (s) { return new Date(s.date) >= cutoff; }).forEach(function (s) {
      domTotals[s.domain] = (domTotals[s.domain] || 0) + Math.round(s.seconds / 60);
    });

    var maxVal = Math.max.apply(null, Object.values(domTotals).concat([1]));
    var sorted = Object.keys(domTotals).sort(function (a,b) { return domTotals[b]-domTotals[a]; });

    if (!sorted.length) {
      domCard.appendChild(el('div', { class:'empty-state' },
        el('div', { class:'empty-state-text' }, 'Aucune session ce mois')));
    } else {
      sorted.forEach(function (d) {
        var v = domTotals[d];
        var p = pct(v, maxVal);
        var row = el('div', { style:'margin-bottom:8px' });
        row.innerHTML =
          '<div class="flex justify-between text-sm" style="margin-bottom:4px">' +
            '<span>' + d + '</span><span class="text-orange font-bold">' + v + ' min</span>' +
          '</div>' +
          '<div class="progress-bar"><div class="progress-fill" style="width:' + p + '%"></div></div>';
        domCard.appendChild(row);
      });
    }
    page.appendChild(domCard);

    /* Streaks */
    var sCard = el('div', { class:'card' });
    sCard.innerHTML = '<div class="card-head"><div class="card-title">🔥 Streaks actuels</div></div>';
    sCard.appendChild(renderStreaksCard(Store.getStreaks()));
    page.appendChild(sCard);

    /* Today log summary */
    var log = Store.getLog(today);
    var logCard = el('div', { class:'card' });
    logCard.innerHTML = '<div class="card-head"><div class="card-title">📋 Log aujourd\'hui</div></div>';
    var fields = [
      ['EPFC', log.epfc_min, 'min'], ['Code', log.code_min, 'min'],
      ['NL', log.nl_min, 'min'], ['Lecture', log.lecture_pg, 'pages'],
      ['Réparation', log.repair_min, 'min'], ['IoT', log.iot_min, 'min'],
      ['Anki', log.anki, 'cartes'], ['Sport', log.sport, '']
    ];
    fields.forEach(function (f) {
      if (!f[1] && f[1] !== 0) return;
      var item = el('div', { class:'finance-item' });
      item.innerHTML = '<span>' + f[0] + '</span><span class="font-bold">' + f[1] + (f[2] ? ' '+f[2] : '') + '</span>';
      logCard.appendChild(item);
    });
    page.appendChild(logCard);
  }

  /* ═══════════════════════════════════════════
     PAGE : SPORT
  ═══════════════════════════════════════════ */
  function renderSport() {
    var page = qs('#page-sport');
    if (!page) return;
    page.innerHTML = '';

    var today = Store.today();

    /* Inner tabs */
    var tabs = [
      { id:'push', label:'Push' },
      { id:'pull', label:'Pull' },
      { id:'legs', label:'Legs' },
      { id:'core', label:'Core' },
      { id:'souplesse', label:'Souplesse' }
    ];

    var innerTabRow = el('div', { class:'inner-tabs' });
    var panels = {};

    tabs.forEach(function (t) {
      var tab = el('div', { class:'inner-tab' + (t.id === 'push' ? ' active' : ''), 'data-itab': t.id }, t.label);
      innerTabRow.appendChild(tab);
      var panel = el('div', { class:'inner-panel' + (t.id === 'push' ? ' active' : ''), id:'sport-panel-' + t.id });
      panels[t.id] = panel;
    });

    page.appendChild(innerTabRow);

    qsa('.inner-tab', innerTabRow).forEach(function (t) {
      t.addEventListener('click', function () {
        qsa('.inner-tab', innerTabRow).forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        var tid = t.dataset.itab;
        Object.keys(panels).forEach(function (k) {
          panels[k].classList.toggle('active', k === tid);
        });
      });
    });

    var sportLog = Store.getSportLog(today);

    Object.keys(panels).forEach(function (key) {
      var panel = panels[key];
      var exercises = D.SPORT[key] || [];
      var card = el('div', { class:'card' });

      exercises.forEach(function (ex, idx) {
        var savedKey = key + '_' + idx;
        var saved = sportLog[savedKey] || {};
        var row = el('div', { class:'exercise-item' });
        var name = el('span', { class:'exercise-name' }, ex.name);
        var inputs = el('div', { class:'exercise-inputs' });

        if (ex.type === 'kg') {
          var sets = el('input', { type:'number', min:'0', value: saved.sets||'', placeholder:'sets' });
          var reps = el('input', { type:'number', min:'0', value: saved.reps||'', placeholder:'reps' });
          var kg   = el('input', { type:'number', min:'0', step:'0.5', value: saved.kg||'', placeholder:'kg' });
          var unit = el('span', { class:'exercise-unit' }, 'kg');
          [sets, reps, kg].forEach(function (inp) {
            inp.addEventListener('change', function () {
              var d2 = {}; d2[savedKey] = { sets:sets.value, reps:reps.value, kg:kg.value };
              Store.setSportLog(today, d2);
            });
          });
          inputs.appendChild(sets);
          inputs.appendChild(el('span', { class:'exercise-unit' }, '×'));
          inputs.appendChild(reps);
          inputs.appendChild(el('span', { class:'exercise-unit' }, '@'));
          inputs.appendChild(kg);
          inputs.appendChild(unit);
        } else if (ex.type === 'sec') {
          var sec = el('input', { type:'number', min:'0', value: saved.sec||'', placeholder:'sec' });
          sec.addEventListener('change', function () {
            var d3 = {}; d3[savedKey] = { sec: sec.value };
            Store.setSportLog(today, d3);
          });
          inputs.appendChild(sec);
          inputs.appendChild(el('span', { class:'exercise-unit' }, 'sec'));
        } else {
          var sets2 = el('input', { type:'number', min:'0', value: saved.sets||'', placeholder:'sets' });
          var reps2 = el('input', { type:'number', min:'0', value: saved.reps||'', placeholder:'reps' });
          [sets2, reps2].forEach(function (inp) {
            inp.addEventListener('change', function () {
              var d4 = {}; d4[savedKey] = { sets:sets2.value, reps:reps2.value };
              Store.setSportLog(today, d4);
            });
          });
          inputs.appendChild(sets2);
          inputs.appendChild(el('span', { class:'exercise-unit' }, '×'));
          inputs.appendChild(reps2);
        }

        row.appendChild(name);
        row.appendChild(inputs);
        card.appendChild(row);
      });

      panel.appendChild(card);
      page.appendChild(panel);
    });
  }

  /* ═══════════════════════════════════════════
     PAGE : ÉTUDE
  ═══════════════════════════════════════════ */
  function renderEtude() {
    var page = qs('#page-etude');
    if (!page) return;
    page.innerHTML = '';

    var innerTabRow = el('div', { class:'inner-tabs' });
    var panelWrap = el('div', {});

    D.STUDY_TABS.forEach(function (t, idx) {
      var tab = el('div', { class:'inner-tab' + (idx === 0 ? ' active' : ''), 'data-itab': t.id }, t.label);
      innerTabRow.appendChild(tab);

      var panel = el('div', { class:'inner-panel' + (idx === 0 ? ' active' : ''), id:'study-panel-' + t.id });
      buildStudyPanel(panel, t);
      panelWrap.appendChild(panel);
    });

    page.appendChild(innerTabRow);
    page.appendChild(panelWrap);

    qsa('.inner-tab', innerTabRow).forEach(function (t) {
      t.addEventListener('click', function () {
        qsa('.inner-tab', innerTabRow).forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        var tid = t.dataset.itab;
        qsa('.inner-panel', panelWrap).forEach(function (p) {
          p.classList.toggle('active', p.id === 'study-panel-' + tid);
        });
      });
    });
  }

  function buildStudyPanel(panel, t) {
    var data = Store.getStudy(t.id);

    /* Progress card */
    var card = el('div', { class:'card' });
    card.innerHTML = '<div class="card-title" style="margin-bottom:10px;font-weight:700;font-size:14px">' + t.label + '</div>';

    var fields = [
      { id:'resource', label:'Ressource actuelle', ph:'Titre du livre / cours' },
      { id:'position', label:'Position exacte',    ph:'Page, chapitre, timestamp...' },
      { id:'next',     label:'Prochaine action',   ph:'Ce que je dois faire' }
    ];

    fields.forEach(function (f) {
      var wrap = el('div', { class:'log-field', style:'margin-bottom:8px' });
      wrap.appendChild(el('label', {}, f.label));
      var inp = el('input', { type:'text', placeholder: f.ph, value: data[f.id] || '' });
      inp.addEventListener('change', function () {
        var upd = {}; upd[f.id] = inp.value;
        Store.setStudy(t.id, upd);
      });
      wrap.appendChild(inp);
      card.appendChild(wrap);
    });

    /* Notes */
    var notesWrap = el('div', { class:'log-field', style:'margin-bottom:8px' });
    notesWrap.appendChild(el('label', {}, 'Notes'));
    var notes = el('textarea', { placeholder:'Notes libres...', style:'height:70px;resize:vertical' });
    notes.value = data.notes || '';
    notes.addEventListener('change', function () { Store.setStudy(t.id, { notes: notes.value }); });
    notesWrap.appendChild(notes);
    card.appendChild(notesWrap);

    panel.appendChild(card);

    /* Resources */
    var resources = D.RESOURCES[t.id];
    if (resources && resources.length) {
      var rCard = el('div', { class:'card' });
      rCard.innerHTML = '<div class="card-head"><div class="card-title">📚 Ressources O\'Reilly</div></div>';
      resources.forEach(function (r) {
        var item = el('div', { class:'resource-item' });
        item.innerHTML = '<div class="resource-dot"></div><div class="resource-title">' + r + '</div>';
        rCard.appendChild(item);
      });
      panel.appendChild(rCard);
    }
  }

  /* ═══════════════════════════════════════════
     PAGE : LOISIR (Échecs)
  ═══════════════════════════════════════════ */
  function renderLoisir() {
    var page = qs('#page-loisir');
    if (!page) return;
    page.innerHTML = '';

    var chess = Store.getChess();
    var lastGame = chess.games && chess.games.length ? chess.games[chess.games.length-1] : null;
    var eloChange = lastGame ? chess.elo - (lastGame.prev || chess.elo) : 0;

    /* ELO card */
    var eloCard = el('div', { class:'card card-glow-g' });
    eloCard.innerHTML =
      '<div class="card-head"><div class="card-title">♟️ Échecs</div>' +
        '<span class="card-head-badge badge-gold">ELO</span></div>' +
      '<div class="elo-display">' +
        '<div class="elo-value">' + chess.elo + '</div>' +
        (eloChange !== 0 ? '<div class="elo-change ' + (eloChange > 0 ? 'elo-up' : 'elo-down') + '">' +
          (eloChange > 0 ? '+' : '') + eloChange + '</div>' : '') +
      '</div>' +
      '<div class="text-muted text-xs mt-8">Objectif : ' + chess.goal + '</div>';

    var goalPct = pct(chess.elo - 800, chess.goal - 800);
    var prog = el('div', { class:'progress-bar mt-8' });
    prog.innerHTML = '<div class="progress-fill progress-fill-gold" style="width:' + goalPct + '%"></div>';
    eloCard.appendChild(prog);
    page.appendChild(eloCard);

    /* Log partie */
    var logCard = el('div', { class:'card' });
    logCard.innerHTML = '<div class="card-head"><div class="card-title">🎮 Enregistrer une partie</div></div>';

    var form = el('div', { class:'log-grid' });
    var eloInp = el('input', { type:'number', value: chess.elo || 1200 });
    var resSelect = el('select', {});
    ['Victoire','Défaite','Nulle'].forEach(function (r) {
      resSelect.appendChild(el('option', { value:r }, r));
    });
    var noteInp = el('input', { type:'text', placeholder:'Erreur critique, ouverture...' });

    var wEl = el('div', { class:'log-field' }); wEl.appendChild(el('label', {}, 'Nouvel ELO')); wEl.appendChild(eloInp);
    var rEl = el('div', { class:'log-field' }); rEl.appendChild(el('label', {}, 'Résultat')); rEl.appendChild(resSelect);
    var nEl = el('div', { class:'log-field', style:'grid-column:span 2' }); nEl.appendChild(el('label', {}, 'Note')); nEl.appendChild(noteInp);
    form.appendChild(wEl); form.appendChild(rEl); form.appendChild(nEl);
    logCard.appendChild(form);

    var saveBtn = el('button', { class:'btn btn-primary btn-sm mt-8', type:'button' }, '💾 Enregistrer');
    saveBtn.style.marginTop = '10px';
    saveBtn.addEventListener('click', function () {
      var newElo = parseInt(eloInp.value, 10);
      if (isNaN(newElo) || newElo < 100) { toast('ELO invalide'); return; }
      Store.addChessGame(newElo, resSelect.value, noteInp.value);
      toast('Partie enregistrée · ELO ' + newElo);
      renderLoisir();
    });
    logCard.appendChild(saveBtn);
    page.appendChild(logCard);

    /* Set goal */
    var goalCard = el('div', { class:'card' });
    goalCard.innerHTML = '<div class="card-head"><div class="card-title">🎯 Objectif ELO</div></div>';
    var goalInp = el('input', { type:'number', value: chess.goal || 1400, placeholder:'1400' });
    goalInp.addEventListener('change', function () {
      Store.setChess({ goal: parseInt(goalInp.value, 10) || chess.goal });
    });
    var gWrap = el('div', { class:'log-field' }); gWrap.appendChild(el('label', {}, 'Objectif')); gWrap.appendChild(goalInp);
    goalCard.appendChild(gWrap);
    page.appendChild(goalCard);

    /* Last 5 games */
    if (chess.games && chess.games.length) {
      var histCard = el('div', { class:'card' });
      histCard.innerHTML = '<div class="card-head"><div class="card-title">📈 Historique</div></div>';
      chess.games.slice(-5).reverse().forEach(function (g) {
        var diff = g.elo - (g.prev || g.elo);
        var item = el('div', { class:'finance-item' });
        item.innerHTML =
          '<span>' + g.date + ' · ' + g.result + '</span>' +
          '<span class="font-bold ' + (diff >= 0 ? 'finance-pos' : 'finance-neg') + '">' +
            (diff >= 0 ? '+' : '') + diff + ' → ' + g.elo +
          '</span>';
        histCard.appendChild(item);
      });
      page.appendChild(histCard);
    }
  }

  /* ═══════════════════════════════════════════
     PAGE : ARGENT
  ═══════════════════════════════════════════ */
  function renderArgent() {
    var page = qs('#page-argent');
    if (!page) return;
    page.innerHTML = '';

    var fin = Store.getFinance();

    /* Budget */
    var budCard = el('div', { class:'card' });
    budCard.innerHTML = '<div class="card-head"><div class="card-title">💰 Budget mensuel</div></div>';
    var fields = [
      { id:'salary', label:'Salaire net', ph:'2500' },
      { id:'budget', label:'Budget libre', ph:'500' },
      { id:'savings_goal', label:'Objectif épargne', ph:'300' },
      { id:'savings_current', label:'Épargne actuelle', ph:'150' }
    ];
    var fGrid = el('div', { class:'log-grid' });
    fields.forEach(function (f) {
      var wrap = el('div', { class:'log-field' });
      wrap.appendChild(el('label', {}, f.label));
      var inp = el('input', { type:'number', min:'0', placeholder: f.ph, value: fin[f.id] || '' });
      inp.addEventListener('change', function () {
        var upd = {}; upd[f.id] = parseFloat(inp.value) || 0;
        Store.setFinance(upd);
      });
      wrap.appendChild(inp);
      fGrid.appendChild(wrap);
    });
    budCard.appendChild(fGrid);
    page.appendChild(budCard);

    /* Charges */
    var cCard = el('div', { class:'card' });
    cCard.innerHTML = '<div class="card-head"><div class="card-title">📋 Charges fixes</div><button class="btn btn-secondary btn-sm" id="add-charge">+</button></div>';
    var charges = fin.charges || [];
    charges.forEach(function (c, idx) {
      var item = el('div', { class:'finance-item' });
      item.innerHTML =
        '<span>' + c.label + '</span>' +
        '<div class="flex gap-6 items-center">' +
          '<span class="font-bold finance-neg">-' + c.amount + ' €</span>' +
          '<button class="btn-icon" data-idx="' + idx + '">×</button>' +
        '</div>';
      item.querySelector('[data-idx]').addEventListener('click', function () {
        var upd = (Store.getFinance().charges || []).filter(function (_,i) { return i !== idx; });
        Store.setFinance({ charges: upd });
        renderArgent();
      });
      cCard.appendChild(item);
    });
    page.appendChild(cCard);

    setTimeout(function () {
      var addBtn = qs('#add-charge');
      if (addBtn) addBtn.addEventListener('click', function () {
        var label = prompt('Nom de la charge :');
        if (!label) return;
        var amount = parseFloat(prompt('Montant (€) :') || '0');
        var f2 = Store.getFinance();
        var c2 = (f2.charges || []).concat([{ label: label, amount: amount }]);
        Store.setFinance({ charges: c2 });
        renderArgent();
      });
    }, 0);

    /* Dettes */
    var dCard = el('div', { class:'card' });
    dCard.innerHTML = '<div class="card-head"><div class="card-title">📉 Dettes / Remboursements</div><button class="btn btn-secondary btn-sm" id="add-debt">+</button></div>';
    var debts = fin.debts || [];
    debts.forEach(function (d, idx) {
      var item = el('div', { class:'finance-item' });
      var p2 = pct(d.paid || 0, d.total || 1);
      item.innerHTML =
        '<div style="flex:1">' +
          '<div class="flex justify-between"><span>' + d.label + '</span><span class="finance-neg">-' + ((d.total||0)-(d.paid||0)) + ' €</span></div>' +
          '<div class="progress-bar mt-8"><div class="progress-fill progress-fill-gold" style="width:' + p2 + '%"></div></div>' +
        '</div>' +
        '<button class="btn-icon" style="margin-left:8px" data-idx="' + idx + '">×</button>';
      item.querySelector('[data-idx]').addEventListener('click', function () {
        var upd = (Store.getFinance().debts || []).filter(function (_,i) { return i !== idx; });
        Store.setFinance({ debts: upd });
        renderArgent();
      });
      dCard.appendChild(item);
    });
    page.appendChild(dCard);

    setTimeout(function () {
      var addBtn = qs('#add-debt');
      if (addBtn) addBtn.addEventListener('click', function () {
        var label = prompt('Nom de la dette :');
        if (!label) return;
        var total = parseFloat(prompt('Montant total (€) :') || '0');
        var paid  = parseFloat(prompt('Déjà remboursé (€) :') || '0');
        var f2 = Store.getFinance();
        var d2 = (f2.debts || []).concat([{ label: label, total: total, paid: paid }]);
        Store.setFinance({ debts: d2 });
        renderArgent();
      });
    }, 0);
  }

  /* ═══════════════════════════════════════════
     PAGE : RÉGLAGES
  ═══════════════════════════════════════════ */
  function renderReglages() {
    var page = qs('#page-reglages');
    if (!page) return;
    page.innerHTML = '';

    var items = [
      {
        label:'Exporter les données', sub:'JSON complet en téléchargement',
        action: function () {
          var data = JSON.stringify(Store.exportAll(), null, 2);
          var blob = new Blob([data], { type:'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url; a.download = 'dashboard-backup-' + Store.today() + '.json';
          a.click(); URL.revokeObjectURL(url);
          toast('Export téléchargé');
        }
      },
      {
        label:'Importer des données', sub:'Charger un fichier JSON de sauvegarde',
        action: function () {
          var inp = document.createElement('input');
          inp.type = 'file'; inp.accept = '.json';
          inp.addEventListener('change', function () {
            var file = inp.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (e) {
              try {
                var data = JSON.parse(e.target.result);
                Store.importAll(data);
                toast('Import réussi · rechargement...');
                setTimeout(function () { location.reload(); }, 1200);
              } catch (ex) { toast('Fichier invalide'); }
            };
            reader.readAsText(file);
          });
          inp.click();
        }
      },
      {
        label:'Vider le cache', sub:'Supprimer le cache du navigateur',
        action: function () {
          if (!confirm('Vider le cache ?')) return;
          if (window.caches) {
            caches.keys().then(function (keys) {
              keys.forEach(function (k) { caches.delete(k); });
              toast('Cache vidé');
            });
          } else { toast('Cache API non disponible'); }
        }
      },
      {
        label:'Réinitialiser les données', sub:'⚠️ Supprime TOUTES les données',
        action: function () {
          if (!confirm('Supprimer TOUTES les données du dashboard ?')) return;
          Store.clearAll();
          toast('Données supprimées · rechargement...');
          setTimeout(function () { location.reload(); }, 1200);
        }
      }
    ];

    var card = el('div', { class:'card' });
    card.innerHTML = '<div class="card-head"><div class="card-title">⚙️ Réglages</div></div>';

    items.forEach(function (item) {
      var row = el('div', { class:'settings-item' });
      var info = el('div', {});
      info.innerHTML = '<div class="settings-label">' + item.label + '</div>' +
                       '<div class="settings-sub">' + item.sub + '</div>';
      var btn = el('button', { class:'btn btn-secondary btn-sm', type:'button' }, '›');
      btn.addEventListener('click', item.action);
      row.appendChild(info);
      row.appendChild(btn);
      card.appendChild(row);
    });

    page.appendChild(card);

    /* Debug info */
    var dbgCard = el('div', { class:'card' });
    dbgCard.innerHTML =
      '<div class="card-head"><div class="card-title">🔬 Debug</div></div>' +
      '<div class="text-xs text-muted" style="line-height:1.8">' +
        'Version : dashv3-20260518<br>' +
        'LocalStorage : ' + (function () {
          var n = 0;
          for (var i = 0; i < localStorage.length; i++) {
            if ((localStorage.key(i) || '').startsWith('dashv3_')) n++;
          }
          return n + ' clés';
        })() + '<br>' +
        'Agent : ' + navigator.userAgent.slice(0, 60) + '…' +
      '</div>';
    page.appendChild(dbgCard);
  }

  /* ═══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */
  function init() {
    initHeader();
    Router.init();

    renderAujourdhui();

    Router.onNavigate(function (tab) {
      if (tab === 'routine')    renderRoutine();
      if (tab === 'stats')      renderStats();
      if (tab === 'sport')      renderSport();
      if (tab === 'etude')      renderEtude();
      if (tab === 'loisir')     renderLoisir();
      if (tab === 'argent')     renderArgent();
      if (tab === 'reglages')   renderReglages();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
