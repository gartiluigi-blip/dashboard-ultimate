/* app.js — main entry point — Fight Night Dashboard v3 */
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
    t._timer = setTimeout(function () { t.classList.remove('show'); }, duration || 2200);
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

  function fmtEur(v) { return parseFloat(v || 0).toFixed(2) + ' €'; }

  /* ─── Header date ─── */
  function initHeader() {
    var d = qs('#header-date');
    if (d) d.textContent = fmtDate(new Date());
  }

  /* ═══════════════════════════════════════════
     SCORE WIDGET
  ═══════════════════════════════════════════ */
  function renderScoreWidget() {
    var pts = Store.computeDayScore();
    var tier = Store.getScoreTier(pts);
    var scoreData = Store.getDayScore();

    var wrap = el('div', { class:'score-widget card-spotlight' });

    /* Top row */
    var top = el('div', { class:'score-widget-top' });
    var lbl = el('div', { class:'score-label' }, '⚡ Score du jour');
    var tierBadge = el('div', { class:'score-tier-badge ' + tier.color }, tier.label);
    top.appendChild(lbl);
    top.appendChild(tierBadge);
    wrap.appendChild(top);

    /* Big number */
    var numWrap = el('div', { style:'text-align:center;padding:4px 0 8px' });
    var num = el('div', { class:'score-number' }, String(pts));
    numWrap.appendChild(num);
    if (scoreData.mult && scoreData.mult > 1) {
      var multEl = el('div', { class:'score-mult-badge' }, '×' + scoreData.mult.toFixed(1) + ' streak');
      numWrap.style.position = 'relative';
      numWrap.appendChild(multEl);
    }
    wrap.appendChild(numWrap);

    /* Progress to next tier */
    if (tier.next) {
      var progWrap = el('div', { class:'score-progress-wrap' });
      var progLabels = el('div', { class:'score-progress-labels' });
      var p = pct(pts - tier.prevPts, tier.nextPts - tier.prevPts);
      progLabels.innerHTML =
        '<span>' + tier.label + '</span>' +
        '<span>' + tier.next + ' (' + (tier.nextPts - pts) + ' pts)</span>';
      var progBar = el('div', { class:'score-progress-bar' });
      var progFill = el('div', { class:'score-progress-fill', style:'width:' + p + '%' });
      progBar.appendChild(progFill);
      progWrap.appendChild(progLabels);
      progWrap.appendChild(progBar);
      wrap.appendChild(progWrap);
    } else {
      var legendMsg = el('div', { style:'text-align:center;font-size:11px;color:var(--orange);font-weight:900;letter-spacing:.1em;margin-top:4px' },
        '🏆 NIVEAU MAXIMUM ATTEINT');
      wrap.appendChild(legendMsg);
    }

    /* Score breakdown mini */
    var breakdown = el('div', { style:'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap' });
    var parts = [
      { icon:'🧱', label:'Routine ×' + (scoreData.routineBlocks||0), pts: (scoreData.routineBlocks||0)*15 },
      { icon:'💪', label:'Sport',  pts: scoreData.sportDone ? 50 : 0, done: scoreData.sportDone },
      { icon:'📋', label:'Log',    pts: scoreData.logFilled ? 20 : 0, done: scoreData.logFilled },
      { icon:'🔄', label:'Full',   pts: scoreData.fullRotation ? 50 : 0, done: scoreData.fullRotation }
    ];
    parts.forEach(function (p2) {
      var chip = el('div', {
        style: 'font-size:10px;padding:3px 8px;border-radius:12px;font-weight:800;' +
               'background:' + (p2.pts > 0 || p2.done ? 'rgba(255,90,24,.12)' : 'var(--panel3)') + ';' +
               'color:' + (p2.pts > 0 || p2.done ? 'var(--orange)' : 'var(--dim)') + ';' +
               'border:1px solid ' + (p2.pts > 0 || p2.done ? 'rgba(255,90,24,.25)' : 'var(--border)')
      }, p2.icon + ' ' + p2.label + (p2.pts ? ' +' + p2.pts : ''));
      breakdown.appendChild(chip);
    });
    wrap.appendChild(breakdown);

    return wrap;
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

    /* Hero */
    var rotation = D.todayRotation();
    var hero = el('div', { class:'hero-card' });
    hero.innerHTML =
      '<div class="hero-eyebrow">⚡ Prochaine action</div>' +
      '<div class="hero-content">' + (rotation.tasks[0] || 'Planifie ta journée') + '</div>' +
      '<div class="hero-sub">' + rotation.day.charAt(0).toUpperCase() + rotation.day.slice(1) + ' · ' +
        rotation.tasks.length + ' blocs</div>';
    page.appendChild(hero);

    /* SCORE WIDGET */
    page.appendChild(renderScoreWidget());

    /* Stats rapides */
    var statRow = el('div', { class:'stat-row' });
    var totalStudy = (parseInt(log.epfc_min)||0)+(parseInt(log.code_min)||0)+(parseInt(log.nl_min)||0)+(parseInt(log.ia_min)||0)+(parseInt(log.repair_min)||0)+(parseInt(log.iot_min)||0);
    statRow.innerHTML =
      '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + focusMin + '</div><div class="stat-label">Focus min</div></div>' +
      '<div class="stat-box stat-box-g"><div class="stat-value v-gold">' + totalStudy + '</div><div class="stat-label">Étude min</div></div>' +
      '<div class="stat-box stat-box-gr"><div class="stat-value v-green">' + (log.sport === '✓ Fait' ? '✓' : '–') + '</div><div class="stat-label">Sport</div></div>';
    page.appendChild(statRow);

    /* Focus launcher */
    page.appendChild(renderFocusCard());

    /* Reprendre */
    page.appendChild(renderBookmarksCard());

    /* Priorités */
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
    var card = el('div', { class:'card card-glow-o card-spotlight' });

    var head = el('div', { class:'card-head' });
    head.innerHTML = '<div class="card-title"><span class="card-title-icon">🥊</span> Focus Timer</div>';
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
      if (!focusState.domain && !focusState.running) { toast('Choisis un domaine !'); return; }
      if (focusState.running) {
        clearInterval(focusState.interval);
        focusState.running = false;
        btnStart.textContent = '▶ Reprendre';
        timeEl.classList.remove('running');
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
      toast('Session ' + focusState.domain + ' · ' + Math.round(focusState.seconds/60) + 'min ✓');
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

      var form = el('div', { class:'flex gap-6 mt-8', style:'margin-bottom:10px' });
      var txt = el('input', { type:'text', placeholder:'Nouvelle priorité...' , style:'flex:1'});
      var sel = el('select', { style:'width:60px;flex-shrink:0' });
      ['A','B','C'].forEach(function (l) { sel.appendChild(el('option', { value:l }, l)); });
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
      var wrap = el('div', { class:'log-field' });
      if (f.wide) wrap.style.gridColumn = 'span 2';
      var label = el('label', {}, f.label + (f.unit ? ' (' + f.unit + ')' : ''));

      var input;
      if (f.type === 'select') {
        input = el('select', {});
        (f.options || []).forEach(function (o) {
          input.appendChild(el('option', { value:o }, o));
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

    var saveBtn = el('button', { class:'btn btn-primary btn-sm', type:'button', style:'margin-top:10px' }, '💾 Sauvegarder');
    saveBtn.addEventListener('click', function () { toast('Log sauvegardé ✓'); });
    card.appendChild(saveBtn);

    return card;
  }

  /* ─── Objectives card ─── */
  function renderObjectivesCard() {
    var card = el('div', { class:'card' });
    card.innerHTML = '<div class="card-head"><div class="card-title">🏆 Objectifs du mois</div></div>';

    var objs = Store.getObjectives();

    if (!objs.length) {
      var addBtn2 = el('button', { class:'btn btn-secondary btn-sm', type:'button', style:'margin-top:8px' }, '+ Ajouter objectif');
      addBtn2.addEventListener('click', showAddObjectiveModal);
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

    var addBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button', style:'margin-top:10px' }, '+ Objectif');
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
      var count = s.count || 0;
      var chip = el('div', { class:'streak-chip' + (count > 3 ? ' hot' : '') });
      chip.innerHTML = '<div class="streak-num">' + count + '</div><div class="streak-name">' + d + '</div>';
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
    var checks   = Store.getRoutineChecks(today);
    var doneCount = Object.values(checks).filter(Boolean).length;
    var total     = rotation.tasks.length;
    var pctDone   = pct(doneCount, total || 1);

    /* ── Jour + anneau de complétion ── */
    var topRow = el('div', { class:'completion-ring-row' });

    /* SVG ring */
    var r = 26, circ = 2 * Math.PI * r;
    var dashOffset = circ - (circ * pctDone / 100);
    var ringColor = pctDone >= 100 ? 'var(--green2)' : pctDone >= 50 ? 'var(--violet2)' : 'var(--cyan)';
    var svgHtml =
      '<svg width="68" height="68" viewBox="0 0 68 68" class="completion-ring-svg">' +
        '<circle cx="34" cy="34" r="' + r + '" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="6"/>' +
        '<circle cx="34" cy="34" r="' + r + '" fill="none" stroke="' + ringColor + '" stroke-width="6"' +
          ' stroke-dasharray="' + circ.toFixed(1) + '"' +
          ' stroke-dashoffset="' + dashOffset.toFixed(1) + '"' +
          ' stroke-linecap="round"' +
          ' transform="rotate(-90 34 34)"' +
          ' style="filter:drop-shadow(0 0 5px ' + ringColor + ');transition:stroke-dashoffset .5s ease"/>' +
        '<text x="34" y="39" text-anchor="middle" font-size="13" font-weight="900" fill="' + ringColor + '">' + pctDone + '%</text>' +
      '</svg>';

    var ringWrap = el('div', {});
    ringWrap.innerHTML = svgHtml;
    topRow.appendChild(ringWrap);

    var ringInfo = el('div', { class:'completion-ring-info' });
    var dayName = rotation.day.charAt(0).toUpperCase() + rotation.day.slice(1);
    ringInfo.appendChild(el('div', { class:'completion-ring-pct' }, pctDone + '%'));
    ringInfo.appendChild(el('div', { class:'completion-ring-label' }, 'Complétion · ' + dayName));
    ringInfo.appendChild(el('div', { class:'completion-ring-count' },
      doneCount + ' / ' + total + ' blocs terminés'));
    topRow.appendChild(ringInfo);
    page.appendChild(topRow);

    /* ── Travail / Shift ── */
    var rtData = Store.get('routine_work_' + today, {});
    var workCard = el('div', { class:'card card-l-orange' });
    var shiftOpts = ['','Matin','Après-midi','Soir','Pas de travail'];
    var shiftSel = '<select id="rt-shift"><option value="">Shift...</option>' +
      shiftOpts.slice(1).map(function(s){ return '<option>' + s + '</option>'; }).join('') + '</select>';
    workCard.innerHTML =
      '<div class="card-head"><div class="card-title">💼 Travail du jour</div></div>' +
      '<div class="work-grid">' +
        '<div class="log-field"><label>Début</label><input type="time" id="rt-work-start"></div>' +
        '<div class="log-field"><label>Fin</label><input type="time" id="rt-work-end"></div>' +
        '<div class="log-field"><label>Shift</label>' + shiftSel + '</div>' +
        '<div class="log-field"><label>Énergie (1-5)</label><input type="number" id="rt-fatigue" min="1" max="5" placeholder="–"></div>' +
      '</div>';
    page.appendChild(workCard);

    setTimeout(function () {
      var ws = qs('#rt-work-start'), we = qs('#rt-work-end'), fa = qs('#rt-fatigue'), sh = qs('#rt-shift');
      if (ws) { ws.value = rtData.start || ''; ws.addEventListener('change', saveRT); }
      if (we) { we.value = rtData.end || '';   we.addEventListener('change', saveRT); }
      if (fa) { fa.value = rtData.fatigue || ''; fa.addEventListener('change', saveRT); }
      if (sh) { sh.value = rtData.shift || '';   sh.addEventListener('change', saveRT); }
      function saveRT() {
        Store.set('routine_work_' + today, {
          start: ws ? ws.value : '',
          end:   we ? we.value : '',
          fatigue: fa ? fa.value : '',
          shift: sh ? sh.value : ''
        });
      }
    }, 0);

    /* ── Blocs de la rotation ── */
    page.appendChild(el('div', { class:'section-title' }, 'Blocs du jour'));

    rotation.tasks.forEach(function (task, idx) {
      var done       = !!checks[idx];
      var dateIndex  = today + '_' + idx;
      var savedNote  = Store.getRoutineNote(dateIndex);
      var meta       = D.getRoutineMeta(task);
      var studyMat   = D.taskToStudyMatiere(task);
      var isSport    = D.taskIsSport(task);
      var isRepair   = D.isRepairTask(task);
      var cat        = meta.cat || 'autre';

      var block = el('div', { class:'routine-block rcat-' + cat + (done ? ' done' : '') });

      /* ── Main row ── */
      var mainRow = el('div', { class:'routine-block-main' });

      var iconEl  = el('div', { class:'routine-block-icon' }, meta.icon || '▸');
      var infoEl  = el('div', { class:'routine-block-info' });

      infoEl.appendChild(el('div', { class:'routine-block-title' }, task));

      /* Category chip + time estimate */
      var metaRow = el('div', { style:'display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap' });
      metaRow.appendChild(el('span', { class:'cat-chip cat-' + cat }, cat));
      if (meta.min) {
        metaRow.appendChild(el('span', { class:'time-est' }, '⏱ ' + meta.min + ' min'));
      }
      /* Study progress sub-line */
      if (studyMat) {
        var sd = Store.getStudy(studyMat);
        if (sd && (sd.position || sd.total)) {
          var pv = pct(parseInt(sd.position)||0, parseInt(sd.total)||1);
          metaRow.appendChild(el('span', { class:'time-est', style:'color:var(--violet3)' },
            '📈 ' + pv + '%'));
        }
      }
      infoEl.appendChild(metaRow);

      /* Saved note preview */
      if (savedNote) {
        infoEl.appendChild(el('div', { class:'routine-block-note' }, '→ ' + savedNote));
      }

      mainRow.appendChild(iconEl);
      mainRow.appendChild(infoEl);

      /* Actions */
      var actions = el('div', { class:'routine-block-actions' });

      var expandBtn = el('button', { class:'routine-expand-btn', type:'button' }, '▾');
      actions.appendChild(expandBtn);

      var chk = el('button', {
        class: 'btn-icon',
        type: 'button',
        style: done ? 'color:var(--green2);border-color:rgba(16,185,129,.5)' : ''
      }, done ? '✓' : '○');
      chk.addEventListener('click', function () {
        Store.toggleRoutineCheck(idx, today);
        renderRoutine();
      });
      actions.appendChild(chk);

      mainRow.appendChild(actions);
      block.appendChild(mainRow);

      /* ── Expand panel ── */
      var expandPanel = el('div', { class:'routine-block-expand' });

      /* Hint banner */
      if (meta.hint) {
        var hint = el('div', { class:'routine-hint' });
        hint.appendChild(el('span', { class:'routine-hint-icon' }, '💡'));
        hint.appendChild(el('span', {}, meta.hint));
        expandPanel.appendChild(hint);
      }

      /* Réparation : champs spécifiques + checklist étapes */
      if (isRepair) {
        var repKey = 'repair_' + today + '_' + idx;
        var repData = Store.get(repKey, { device:'', problem:'', parts:'', result:'', steps:{} });

        var repFields = el('div', { class:'repair-fields' });
        var dField = el('div', { class:'repair-field' });
        dField.appendChild(el('label', {}, '🔧 Appareil / Objet'));
        var devInp = el('input', { type:'text', placeholder:'Ex: Ampli Sony, PS4, lampe...' });
        devInp.value = repData.device || '';
        dField.appendChild(devInp);
        repFields.appendChild(dField);

        var pField = el('div', { class:'repair-field' });
        pField.appendChild(el('label', {}, '❗ Problème constaté'));
        var probInp = el('input', { type:'text', placeholder:'Ex: pas de son, court-circuit...' });
        probInp.value = repData.problem || '';
        pField.appendChild(probInp);
        repFields.appendChild(pField);

        expandPanel.appendChild(repFields);

        /* Steps checklist */
        var stepsDiv = el('div', { class:'repair-steps' });
        stepsDiv.appendChild(el('div', { style:'font-size:10px;color:var(--amber2);font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px' }, '📋 Étapes'));

        D.REPAIR_STEPS.forEach(function (stepLabel, si) {
          var stepDone = !!(repData.steps && repData.steps[si]);
          var stepEl = el('div', { class:'repair-step' + (stepDone ? ' checked' : '') });
          stepEl.appendChild(el('span', { class:'repair-step-icon' }, stepDone ? '✅' : '⬜'));
          stepEl.appendChild(el('span', {}, stepLabel));
          stepEl.addEventListener('click', function () {
            repData.steps = repData.steps || {};
            repData.steps[si] = !repData.steps[si];
            Store.set(repKey, repData);
            stepEl.classList.toggle('checked', !!repData.steps[si]);
            stepEl.querySelector('.repair-step-icon').textContent = repData.steps[si] ? '✅' : '⬜';
          });
          stepsDiv.appendChild(stepEl);
        });

        expandPanel.appendChild(stepsDiv);

        /* Parts + result */
        var rep2 = el('div', { class:'repair-fields' });
        var ptField = el('div', { class:'repair-field', style:'grid-column:span 2' });
        ptField.appendChild(el('label', {}, '🛒 Pièces / Composants nécessaires'));
        var partsInp = el('input', { type:'text', placeholder:'Ex: condensateur 10µF, fusible 5A...' });
        partsInp.value = repData.parts || '';
        ptField.appendChild(partsInp);
        rep2.appendChild(ptField);

        var rField = el('div', { class:'repair-field', style:'grid-column:span 2' });
        rField.appendChild(el('label', {}, '✅ Résultat / Conclusion'));
        var resInp = el('input', { type:'text', placeholder:'Réparé, en attente pièce, HS...' });
        resInp.value = repData.result || '';
        rField.appendChild(resInp);
        rep2.appendChild(rField);
        expandPanel.appendChild(rep2);

        /* Note free */
        var noteWrap2 = el('div', { class:'routine-note-field' });
        noteWrap2.appendChild(el('label', {}, 'Notes libres / où j\'en suis'));
        var noteTA2 = el('textarea', { placeholder:'Schéma, lien vidéo, prochaine étape...' });
        noteTA2.value = savedNote || '';
        noteWrap2.appendChild(noteTA2);
        expandPanel.appendChild(noteWrap2);

        /* Save */
        var sr2 = el('div', { style:'display:flex;gap:8px;margin-top:6px' });
        var sb2 = el('button', { class:'btn btn-primary btn-sm', type:'button' }, '💾 Sauvegarder');
        sb2.addEventListener('click', function () {
          repData.device  = devInp.value.trim();
          repData.problem = probInp.value.trim();
          repData.parts   = partsInp.value.trim();
          repData.result  = resInp.value.trim();
          Store.set(repKey, repData);
          Store.setRoutineNote(dateIndex, noteTA2.value.trim());
          Store.setRoutineCheck(idx, true, today);
          toast('Réparation sauvegardée ✓');
          renderRoutine();
        });
        sr2.appendChild(sb2);
        expandPanel.appendChild(sr2);

      } else {
        /* ── Standard expand ── */
        var noteWrap = el('div', { class:'routine-note-field' });
        noteWrap.appendChild(el('label', {}, 'Où j\'en suis / reprendre à...'));
        var noteTA = el('textarea', { placeholder:'Page 42, exercice 3, continuer sur...' });
        noteTA.value = savedNote || '';
        noteWrap.appendChild(noteTA);
        expandPanel.appendChild(noteWrap);

        /* Study log */
        var studyInp = null;
        if (studyMat) {
          var sd2 = Store.getStudy(studyMat);
          var studyRow = el('div', { class:'routine-study-log' });
          studyRow.appendChild(el('span', { class:'unit-label' }, '+ Ajouter'));
          studyInp = el('input', { type:'number', min:'0', placeholder:'0' });
          studyRow.appendChild(studyInp);
          studyRow.appendChild(el('span', { class:'unit-label' }, sd2.unit || 'pages'));
          expandPanel.appendChild(studyRow);
        }

        /* Save button */
        var saveRow = el('div', { style:'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap' });
        var saveBtn = el('button', { class:'btn btn-primary btn-sm', type:'button' }, '💾 Sauvegarder');
        saveBtn.addEventListener('click', function () {
          var noteVal = noteTA.value.trim();
          Store.setRoutineNote(dateIndex, noteVal);
          if (studyMat && studyInp) {
            var addAmt = parseInt(studyInp.value || '0', 10);
            if (addAmt > 0) {
              Store.logStudyFromRoutine(studyMat, addAmt, idx, today);
              toast('+ ' + addAmt + ' ' + (Store.getStudy(studyMat).unit||'') + ' enregistrés ✓');
            } else {
              Store.setRoutineCheck(idx, true, today);
              toast('Bloc terminé ✓');
            }
          } else if (isSport) {
            Store.markSportDone(today);
            toast('Sport enregistré ✓');
          } else {
            Store.setRoutineCheck(idx, true, today);
            toast('Bloc terminé ✓');
          }
          renderRoutine();
        });
        saveRow.appendChild(saveBtn);

        /* Quick "Terminé sans note" */
        var doneBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button' }, '✓ Terminé');
        doneBtn.addEventListener('click', function () {
          Store.setRoutineCheck(idx, true, today);
          renderRoutine();
        });
        saveRow.appendChild(doneBtn);
        expandPanel.appendChild(saveRow);
      }

      block.appendChild(expandPanel);
      page.appendChild(block);

      /* Toggle expand */
      expandBtn.addEventListener('click', function () {
        var isOpen = expandPanel.classList.contains('open');
        expandPanel.classList.toggle('open', !isOpen);
        expandBtn.classList.toggle('open', !isOpen);
        block.classList.toggle('expanded', !isOpen);
      });
    });

    /* ── Résumé du jour ── */
    var log = Store.getLog(today);
    var totalMin = (parseInt(log.epfc_min)||0)+(parseInt(log.code_min)||0)+(parseInt(log.nl_min)||0)+(parseInt(log.repair_min)||0)+(parseInt(log.iot_min)||0);
    var sportDone = log.sport === '✓ Fait' || Store.getSportOff(today) || Store.getSportLog(today).sessionDone;

    var sumCard = el('div', { class:'card card-glow-o', style:'margin-top:14px' });
    sumCard.innerHTML =
      '<div class="card-head"><div class="card-title">📊 Résumé du jour</div></div>' +
      '<div class="stat-row">' +
        '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + totalMin + '</div><div class="stat-label">Min étude</div></div>' +
        '<div class="stat-box stat-box-g"><div class="stat-value v-gold">' + doneCount + '/' + total + '</div><div class="stat-label">Blocs</div></div>' +
        '<div class="stat-box stat-box-gr"><div class="stat-value v-green">' + (sportDone ? '✓' : '–') + '</div><div class="stat-label">Sport</div></div>' +
      '</div>';
    page.appendChild(sumCard);
  }

  /* ═══════════════════════════════════════════
     PAGE : STATS
  ═══════════════════════════════════════════ */
  function renderStats() {
    var page = qs('#page-stats');
    if (!page) return;
    page.innerHTML = '';

    var sessions = Store.getFocusSessions();
    var today = Store.today();

    /* Score history — last 7 days */
    var scoreCard = el('div', { class:'card card-glow-o card-spotlight' });
    scoreCard.innerHTML = '<div class="card-head"><div class="card-title">⚡ Scores 7 jours</div></div>';
    var scoreRow = el('div', { style:'display:flex;gap:6px;flex-wrap:wrap' });
    for (var di = 6; di >= 0; di--) {
      var dd = new Date(); dd.setDate(dd.getDate() - di);
      var dk = dd.getFullYear() + '-' + String(dd.getMonth()+1).padStart(2,'0') + '-' + String(dd.getDate()).padStart(2,'0');
      var sc = Store.getDayScore(dk);
      var pt = sc.pts || 0;
      var tier = Store.getScoreTier(pt);
      var isToday = dk === today;
      var chip = el('div', {
        style: 'flex:1;min-width:36px;text-align:center;padding:8px 4px;border-radius:10px;' +
               'background:' + (isToday ? 'rgba(255,90,24,.15)' : 'var(--panel2)') + ';' +
               'border:1px solid ' + (isToday ? 'rgba(255,90,24,.4)' : 'var(--border)')
      });
      var dayName = ['D','L','M','Me','J','V','S'][dd.getDay()];
      chip.innerHTML =
        '<div style="font-size:9px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.04em">' + dayName + '</div>' +
        '<div style="font-size:18px;font-weight:900;color:var(--orange);margin:3px 0">' + pt + '</div>' +
        '<div style="font-size:8px;font-weight:900;color:var(--dim);letter-spacing:.04em">' + tier.label + '</div>';
      scoreRow.appendChild(chip);
    }
    scoreCard.appendChild(scoreRow);
    page.appendChild(scoreCard);

    /* Heatmap */
    var hCard = el('div', { class:'card' });
    hCard.innerHTML = '<div class="card-head"><div class="card-title">📅 Activité (90j)</div></div>';
    var hRow = el('div', { class:'heatmap-row' });

    var dailyMap = {};
    sessions.forEach(function (s) {
      dailyMap[s.date] = (dailyMap[s.date] || 0) + Math.round(s.seconds / 60);
    });

    for (var i = 89; i >= 0; i--) {
      var d2 = new Date(); d2.setDate(d2.getDate() - i);
      var dk2 = d2.getFullYear() + '-' + String(d2.getMonth()+1).padStart(2,'0') + '-' + String(d2.getDate()).padStart(2,'0');
      var min = dailyMap[dk2] || 0;
      var lvl = min === 0 ? '0' : min < 30 ? '1' : min < 60 ? '2' : min < 120 ? '3' : '4';
      var cell = el('div', { class:'heatmap-cell', 'data-level': lvl, title: dk2 + ': ' + min + 'min' });
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
        var row = el('div', { style:'margin-bottom:10px' });
        row.innerHTML =
          '<div class="flex justify-between text-sm" style="margin-bottom:5px">' +
            '<span>' + d + '</span><span class="text-orange font-bold">' + v + ' min</span>' +
          '</div>' +
          '<div class="progress-bar"><div class="progress-fill" style="width:' + p + '%"></div></div>';
        domCard.appendChild(row);
      });
    }
    page.appendChild(domCard);

    /* Streaks */
    page.appendChild(renderStreaksCard(Store.getStreaks()));

    /* Today log summary */
    var log = Store.getLog(today);
    var logCard = el('div', { class:'card' });
    logCard.innerHTML = '<div class="card-head"><div class="card-title">📋 Log aujourd\'hui</div></div>';
    var fields2 = [
      ['EPFC', log.epfc_min, 'min'], ['Code', log.code_min, 'min'],
      ['NL', log.nl_min, 'min'], ['Lecture', log.lecture_pg, 'pages'],
      ['Réparation', log.repair_min, 'min'], ['IoT', log.iot_min, 'min'],
      ['Anki', log.anki, 'cartes'], ['Sport', log.sport, '']
    ];
    fields2.forEach(function (f) {
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
    var todaySport = D.todaySportDay();
    var sportOff = Store.getSportOff(today);
    var sportLog = Store.getSportLog(today);

    /* Today's session badge */
    var topRow = el('div', { style:'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px' });
    var dayBadge = el('div', { class:'sport-day-badge' },
      todaySport.emoji + ' Séance du jour : ' + todaySport.label);
    topRow.appendChild(dayBadge);

    var offBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button' },
      sportOff ? '😴 OFF aujourd\'hui' : '😴 Jour OFF');
    offBtn.style.marginLeft = 'auto';
    if (sportOff) offBtn.style.opacity = '.6';
    offBtn.addEventListener('click', function () {
      if (!sportOff) {
        Store.setSportOff(today, true);
        Store.markSportDone(today);
        toast('Jour OFF enregistré');
        renderSport();
      }
    });
    topRow.appendChild(offBtn);
    page.appendChild(topRow);

    /* Save session button */
    if (!sportOff && todaySport.type !== 'off') {
      var doneBtn = el('button', { class:'btn btn-green w-full', type:'button', style:'margin-bottom:14px' },
        sportLog.sessionDone ? '✓ Séance enregistrée' : '✅ Marquer séance terminée');
      if (sportLog.sessionDone) doneBtn.style.opacity = '.7';
      doneBtn.addEventListener('click', function () {
        Store.markSportDone(today);
        toast('Séance sport ✓ — Bloc routine mis à jour !');
        renderSport();
      });
      page.appendChild(doneBtn);
    }

    /* Inner tabs */
    var tabs = [
      { id:'push', label:'Push' },
      { id:'pull', label:'Pull' },
      { id:'legs', label:'Legs' },
      { id:'core', label:'Core' },
      { id:'souplesse', label:'Souplesse' },
      { id:'fullbody', label:'Full Body' }
    ];

    var innerTabRow = el('div', { class:'inner-tabs' });
    var panels = {};

    /* Default to today's type */
    var defaultTab = todaySport.type === 'off' ? 'push' : todaySport.type;
    if (!D.SPORT[defaultTab]) defaultTab = 'push';

    tabs.forEach(function (t) {
      var isActive = t.id === defaultTab;
      var tab = el('div', { class:'inner-tab' + (isActive ? ' active' : ''), 'data-itab': t.id }, t.label);
      innerTabRow.appendChild(tab);
      var panel = el('div', { class:'inner-panel' + (isActive ? ' active' : ''), id:'sport-panel-' + t.id });
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

        function saveSport(data) {
          var d2 = {}; d2[savedKey] = data;
          Store.setSportLog(today, d2);
        }

        if (ex.type === 'kg') {
          var sets = el('input', { type:'number', min:'0', value: saved.sets||'', placeholder:'sets' });
          var reps = el('input', { type:'number', min:'0', value: saved.reps||'', placeholder:'reps' });
          var kg   = el('input', { type:'number', min:'0', step:'0.5', value: saved.kg||'', placeholder:'kg' });
          [sets, reps, kg].forEach(function (inp) {
            inp.addEventListener('change', function () {
              saveSport({ sets:sets.value, reps:reps.value, kg:kg.value });
            });
          });
          inputs.appendChild(sets);
          inputs.appendChild(el('span', { class:'exercise-unit' }, '×'));
          inputs.appendChild(reps);
          inputs.appendChild(el('span', { class:'exercise-unit' }, '@'));
          inputs.appendChild(kg);
          inputs.appendChild(el('span', { class:'exercise-unit' }, 'kg'));
        } else if (ex.type === 'sec') {
          var sec = el('input', { type:'number', min:'0', value: saved.sec||'', placeholder:'sec' });
          sec.addEventListener('change', function () { saveSport({ sec: sec.value }); });
          inputs.appendChild(sec);
          inputs.appendChild(el('span', { class:'exercise-unit' }, 'sec'));
        } else {
          var sets2 = el('input', { type:'number', min:'0', value: saved.sets||'', placeholder:'sets' });
          var reps2 = el('input', { type:'number', min:'0', value: saved.reps||'', placeholder:'reps' });
          [sets2, reps2].forEach(function (inp) {
            inp.addEventListener('change', function () {
              saveSport({ sets:sets2.value, reps:reps2.value });
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
    var card = el('div', { class:'card card-l-orange' });
    var titleEl = el('div', {
      style:'margin-bottom:12px;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:.05em'
    }, t.label);
    card.appendChild(titleEl);

    /* Resource */
    var resWrap = el('div', { class:'log-field', style:'margin-bottom:10px' });
    resWrap.appendChild(el('label', {}, 'Ressource actuelle'));
    var resInp = el('input', { type:'text', placeholder:'Titre du livre / cours', value: data.resource || '' });
    resInp.addEventListener('change', function () { Store.setStudy(t.id, { resource: resInp.value }); });
    resWrap.appendChild(resInp);
    card.appendChild(resWrap);

    /* Position / Total / Unit */
    var posRow = el('div', { style:'display:grid;grid-template-columns:1fr 1fr 100px;gap:8px;margin-bottom:10px' });

    var posWrap = el('div', { class:'log-field' });
    posWrap.appendChild(el('label', {}, 'Position actuelle'));
    var posInp = el('input', { type:'number', min:'0', value: data.position || '' });
    posInp.addEventListener('change', function () { Store.setStudy(t.id, { position: parseInt(posInp.value,10)||0 }); });
    posWrap.appendChild(posInp);
    posRow.appendChild(posWrap);

    var totWrap = el('div', { class:'log-field' });
    totWrap.appendChild(el('label', {}, 'Total'));
    var totInp = el('input', { type:'number', min:'0', value: data.total || '' });
    totInp.addEventListener('change', function () { Store.setStudy(t.id, { total: parseInt(totInp.value,10)||0 }); });
    totWrap.appendChild(totInp);
    posRow.appendChild(totWrap);

    var unitWrap = el('div', { class:'log-field' });
    unitWrap.appendChild(el('label', {}, 'Unité'));
    var unitSel = el('select', {});
    ['pages','minutes','chapitres','leçons'].forEach(function (u) {
      unitSel.appendChild(el('option', { value:u }, u));
    });
    unitSel.value = data.unit || 'pages';
    unitSel.addEventListener('change', function () { Store.setStudy(t.id, { unit: unitSel.value }); });
    unitWrap.appendChild(unitSel);
    posRow.appendChild(unitWrap);

    card.appendChild(posRow);

    /* Progress bar */
    var pos = parseInt(data.position)||0;
    var tot = parseInt(data.total)||0;
    var pctVal = tot > 0 ? pct(pos, tot) : 0;
    var remaining = tot > 0 ? (tot - pos) : 0;

    var progSection = el('div', { style:'margin-bottom:10px' });
    var progBar = el('div', { class:'progress-bar' });
    var progFill = el('div', { class:'progress-fill', style:'width:' + pctVal + '%' });
    progBar.appendChild(progFill);
    progSection.appendChild(progBar);

    var progInfo = el('div', { class:'study-progress-info' });
    progInfo.innerHTML =
      '<span class="study-progress-pct">' + pctVal + '%</span>' +
      (remaining > 0 ? '<span class="study-remaining">' + remaining + ' ' + (data.unit||'') + ' restant</span>' : '') +
      (pctVal >= 100 ? '<span style="color:var(--green);font-weight:900">✓ Terminé !</span>' : '');
    progSection.appendChild(progInfo);
    card.appendChild(progSection);

    /* Quick log +X */
    var logRow = el('div', { style:'display:flex;gap:8px;align-items:center;margin-bottom:10px' });
    var logInp = el('input', { type:'number', min:'0', placeholder:'0', style:'width:80px;text-align:center' });
    logRow.appendChild(el('span', { style:'font-size:11px;color:var(--muted);font-weight:700' }, '+'));
    logRow.appendChild(logInp);
    logRow.appendChild(el('span', { style:'font-size:11px;color:var(--muted);font-weight:700' }, data.unit || 'pages'));
    var logBtn = el('button', { class:'btn btn-primary btn-sm', type:'button' }, '+ Logger');
    logBtn.addEventListener('click', function () {
      var add = parseInt(logInp.value, 10);
      if (!add || add < 1) return;
      var newPos = Store.logStudyProgress(t.id, add);
      toast('+' + add + ' ' + (data.unit||'') + ' · Total: ' + newPos);
      logInp.value = '';
      renderEtude();
    });
    logRow.appendChild(logBtn);
    card.appendChild(logRow);

    /* Next action */
    var nextWrap = el('div', { class:'log-field', style:'margin-bottom:10px' });
    nextWrap.appendChild(el('label', {}, 'Prochaine action'));
    var nextInp = el('input', { type:'text', placeholder:'Ce que je dois faire...', value: data.next || '' });
    nextInp.addEventListener('change', function () { Store.setStudy(t.id, { next: nextInp.value }); });
    nextWrap.appendChild(nextInp);
    card.appendChild(nextWrap);

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
      rCard.innerHTML = '<div class="card-head"><div class="card-title">📚 Ressources recommandées</div></div>';
      resources.forEach(function (r) {
        var item = el('div', { class:'resource-item' });
        item.innerHTML = '<div class="resource-dot"></div><div class="resource-title">' + r + '</div>';
        rCard.appendChild(item);
      });
      panel.appendChild(rCard);
    }
  }

  /* ═══════════════════════════════════════════
     PAGE : LOISIR (Échecs + Lecture)
  ═══════════════════════════════════════════ */
  function renderLoisir() {
    var page = qs('#page-loisir');
    if (!page) return;
    page.innerHTML = '';

    var innerTabRow = el('div', { class:'inner-tabs' });
    var panels = {};

    var loisirTabs = [
      { id:'echecs', label:'♟️ Échecs' },
      { id:'lecture', label:'📚 Lecture' }
    ];

    loisirTabs.forEach(function (t, idx) {
      var tab = el('div', { class:'inner-tab' + (idx === 0 ? ' active' : ''), 'data-itab': t.id }, t.label);
      innerTabRow.appendChild(tab);
      var panel = el('div', { class:'inner-panel' + (idx === 0 ? ' active' : ''), id:'loisir-panel-' + t.id });
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

    /* Build chess panel */
    buildChessPanel(panels.echecs);

    /* Build lecture panel */
    buildLecturePanel(panels.lecture);

    Object.keys(panels).forEach(function (k) { page.appendChild(panels[k]); });
  }

  function buildChessPanel(panel) {
    var chess = Store.getChess();
    var lastGame = chess.games && chess.games.length ? chess.games[chess.games.length-1] : null;
    var eloChange = lastGame ? chess.elo - (lastGame.prev || chess.elo) : 0;

    /* ELO card */
    var eloCard = el('div', { class:'card card-glow-g card-spotlight' });
    eloCard.innerHTML =
      '<div class="card-head"><div class="card-title">♟️ Échecs</div>' +
        '<span class="badge badge-gold">ELO</span></div>' +
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
    panel.appendChild(eloCard);

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

    var saveBtn = el('button', { class:'btn btn-primary btn-sm', type:'button', style:'margin-top:10px' }, '💾 Enregistrer');
    saveBtn.addEventListener('click', function () {
      var newElo = parseInt(eloInp.value, 10);
      if (isNaN(newElo) || newElo < 100) { toast('ELO invalide'); return; }
      Store.addChessGame(newElo, resSelect.value, noteInp.value);
      Store.updateStreak('CHESS');
      toast('Partie enregistrée · ELO ' + newElo);
      buildChessPanel(panel); /* rebuild */
    });
    logCard.appendChild(saveBtn);
    panel.appendChild(logCard);

    /* Set goal */
    var goalCard = el('div', { class:'card' });
    goalCard.innerHTML = '<div class="card-head"><div class="card-title">🎯 Objectif ELO</div></div>';
    var goalInp = el('input', { type:'number', value: chess.goal || 1400, placeholder:'1400' });
    goalInp.addEventListener('change', function () {
      Store.setChess({ goal: parseInt(goalInp.value, 10) || chess.goal });
    });
    var gWrap = el('div', { class:'log-field' }); gWrap.appendChild(el('label', {}, 'Objectif ELO')); gWrap.appendChild(goalInp);
    goalCard.appendChild(gWrap);
    panel.appendChild(goalCard);

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
      panel.appendChild(histCard);
    }
  }

  function buildLecturePanel(panel) {
    panel.innerHTML = '';
    var books = Store.getBooks();

    /* Summary */
    var inProgressBooks = D.BOOKS.filter(function (b) {
      var s = books[b.id];
      return s && s.status === 'en_cours';
    });
    var doneBooks = D.BOOKS.filter(function (b) {
      var s = books[b.id];
      return s && s.status === 'termine';
    });

    var summaryCard = el('div', { class:'card card-glow-g card-spotlight' });
    summaryCard.innerHTML =
      '<div class="card-head"><div class="card-title">📚 Bibliothèque</div></div>' +
      '<div class="stat-row">' +
        '<div class="stat-box stat-box-g"><div class="stat-value v-gold">' + inProgressBooks.length + '</div><div class="stat-label">En cours</div></div>' +
        '<div class="stat-box stat-box-gr"><div class="stat-value v-green">' + doneBooks.length + '</div><div class="stat-label">Terminés</div></div>' +
        '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + D.BOOKS.length + '</div><div class="stat-label">Total</div></div>' +
      '</div>';
    panel.appendChild(summaryCard);

    /* Books by category */
    D.BOOK_CATEGORIES.forEach(function (cat) {
      var catBooks = D.BOOKS.filter(function (b) { return b.category === cat; });
      if (!catBooks.length) return;

      var catTitle = el('div', { class:'book-category-title' }, cat);
      panel.appendChild(catTitle);

      catBooks.forEach(function (b) {
        var bData = books[b.id] || { status: 'non_commence', position: 0, total: 0 };
        var status = bData.status || 'non_commence';
        var pos = parseInt(bData.position) || 0;
        var tot = b.pages || parseInt(bData.total) || 0;
        var pctVal = tot > 0 ? pct(pos, tot) : 0;

        var itemClass = 'book-item' + (status === 'en_cours' ? ' in-progress' : status === 'termine' ? ' done' : '');
        var bookEl = el('div', { class: itemClass });

        var statusLabel = status === 'en_cours' ? 'En cours' : status === 'termine' ? 'Terminé' : 'À lire';
        var statusClass = status === 'en_cours' ? 'book-status-en' : status === 'termine' ? 'book-status-done' : 'book-status-nc';

        /* Info */
        var info = el('div', { class:'book-info' });
        info.innerHTML =
          '<div class="book-title">' + b.title + '</div>' +
          '<div class="book-author">' + b.author + '</div>';

        if (status !== 'non_commence') {
          var progRow = el('div', { class:'book-progress-row' });
          progRow.innerHTML =
            '<div class="book-progress-bar"><div class="book-progress-fill" style="width:' + pctVal + '%"></div></div>' +
            '<span class="book-pct">' + pctVal + '%</span>';
          info.appendChild(progRow);
        }
        bookEl.appendChild(info);

        /* Status badge */
        var stBadge = el('span', { class:'book-status-badge ' + statusClass }, statusLabel);
        bookEl.appendChild(stBadge);

        /* Actions */
        var actEl = el('div', { class:'book-actions' });

        if (status !== 'termine') {
          var readBtn = el('button', { class:'btn btn-gold btn-xs', type:'button' },
            status === 'en_cours' ? '+ Pages' : 'Lire');
          readBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (status !== 'en_cours') {
              Store.setBook(b.id, { status: 'en_cours', total: b.pages });
              toast('"' + b.title + '" démarré !');
              buildLecturePanel(panel);
              return;
            }
            /* Toggle log row */
            var logRow = bookEl.querySelector('.book-log-row');
            if (logRow) logRow.classList.toggle('open');
          });
          actEl.appendChild(readBtn);
        }

        if (status === 'en_cours') {
          var doneBtn2 = el('button', { class:'btn-icon', type:'button', title:'Marquer terminé' }, '✓');
          doneBtn2.addEventListener('click', function () {
            Store.setBook(b.id, { status: 'termine', position: tot });
            toast('"' + b.title + '" terminé ! 🎉');
            buildLecturePanel(panel);
          });
          actEl.appendChild(doneBtn2);
        }

        bookEl.appendChild(actEl);

        /* Log pages row (hidden by default) */
        if (status === 'en_cours') {
          var logRow2 = el('div', { class:'book-log-row' });
          var pagesInp = el('input', { type:'number', min:'1', placeholder:'0' });
          logRow2.appendChild(el('span', { style:'font-size:11px;color:var(--muted);font-weight:700' }, '+'));
          logRow2.appendChild(pagesInp);
          logRow2.appendChild(el('span', { style:'font-size:11px;color:var(--muted);font-weight:700' }, 'pages'));
          var logBtnBook = el('button', { class:'btn btn-primary btn-xs', type:'button' }, 'Logger');
          logBtnBook.addEventListener('click', function () {
            var pg = parseInt(pagesInp.value, 10);
            if (!pg || pg < 1) return;
            var newPos = Store.logBookPages(b.id, pg);
            Store.updateStreak('LECTURE');
            toast('+' + pg + ' pages · Total: ' + newPos + '/' + tot);
            buildLecturePanel(panel);
          });
          logRow2.appendChild(logBtnBook);
          bookEl.appendChild(logRow2);
        }

        panel.appendChild(bookEl);
      });
    });
  }

  /* ═══════════════════════════════════════════
     PAGE : ARGENT (Budget + Vinted)
  ═══════════════════════════════════════════ */
  function renderArgent() {
    var page = qs('#page-argent');
    if (!page) return;
    page.innerHTML = '';

    var innerTabRow = el('div', { class:'inner-tabs' });
    var panels = {};

    var argentTabs = [
      { id:'budget', label:'💰 Budget' },
      { id:'vinted', label:'🛍 Vinted' }
    ];

    argentTabs.forEach(function (t, idx) {
      var tab = el('div', { class:'inner-tab' + (idx === 0 ? ' active' : ''), 'data-itab': t.id }, t.label);
      innerTabRow.appendChild(tab);
      var panel = el('div', { class:'inner-panel' + (idx === 0 ? ' active' : ''), id:'argent-panel-' + t.id });
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

    buildBudgetPanel(panels.budget);
    buildVintedPanel(panels.vinted);

    Object.keys(panels).forEach(function (k) { page.appendChild(panels[k]); });
  }

  function buildBudgetPanel(panel) {
    panel.innerHTML = '';

    /* Month selector */
    var months = Store.getFinanceMonths();
    var currentMonth = Store.currentMonth();

    var monthRow = el('div', { class:'month-selector' });
    monthRow.appendChild(el('label', { style:'font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap' }, 'Mois :'));
    var monthSel = el('select', {});
    months.forEach(function (m) {
      var opt = el('option', { value:m }, m);
      if (m === currentMonth) opt.selected = true;
      monthSel.appendChild(opt);
    });
    monthRow.appendChild(monthSel);
    panel.appendChild(monthRow);

    var selectedMonth = monthSel.value || currentMonth;

    monthSel.addEventListener('change', function () {
      buildBudgetPanel(panel);
    });

    var fin = Store.getFinanceMonth(selectedMonth);

    /* Budget overview */
    var salary = parseFloat(fin.salary)||0;
    var charges = (fin.charges||[]).reduce(function(a,c){return a+(parseFloat(c.amount)||0);}, 0);
    var libre = salary - charges;

    if (salary > 0) {
      var overviewCard = el('div', { class:'card card-glow-g card-spotlight' });
      overviewCard.innerHTML =
        '<div class="card-head"><div class="card-title">💰 Vue ensemble — ' + selectedMonth + '</div></div>' +
        '<div class="stat-row">' +
          '<div class="stat-box stat-box-g"><div class="stat-value v-gold">' + salary.toFixed(0) + '</div><div class="stat-label">Salaire €</div></div>' +
          '<div class="stat-box stat-box-o"><div class="stat-value" style="color:var(--red)">' + charges.toFixed(0) + '</div><div class="stat-label">Charges €</div></div>' +
          '<div class="stat-box stat-box-gr"><div class="stat-value v-green">' + libre.toFixed(0) + '</div><div class="stat-label">Libre €</div></div>' +
        '</div>';
      var savPct = fin.savings_goal > 0 ? pct(fin.savings_current||0, fin.savings_goal) : 0;
      overviewCard.innerHTML +=
        '<div style="margin-top:10px"><div class="flex justify-between text-xs text-muted" style="margin-bottom:4px">' +
          '<span>Épargne : ' + (fin.savings_current||0) + ' €</span>' +
          '<span>Objectif : ' + (fin.savings_goal||0) + ' €</span></div>' +
          '<div class="progress-bar"><div class="progress-fill progress-fill-gold" style="width:' + savPct + '%"></div></div></div>';
      panel.appendChild(overviewCard);
    }

    /* Budget fields */
    var budCard = el('div', { class:'card' });
    budCard.innerHTML = '<div class="card-head"><div class="card-title">💰 Budget ' + selectedMonth + '</div></div>';
    var fields = [
      { id:'salary',          label:'Salaire net',     ph:'2500' },
      { id:'budget',          label:'Budget libre',    ph:'500' },
      { id:'savings_goal',    label:'Objectif épargne',ph:'300' },
      { id:'savings_current', label:'Épargne actuelle',ph:'150' }
    ];
    var fGrid = el('div', { class:'log-grid' });
    fields.forEach(function (f) {
      var wrap = el('div', { class:'log-field' });
      wrap.appendChild(el('label', {}, f.label));
      var inp = el('input', { type:'number', min:'0', placeholder: f.ph, value: fin[f.id] || '' });
      inp.addEventListener('change', function () {
        var upd = {}; upd[f.id] = parseFloat(inp.value) || 0;
        Store.setFinanceMonth(selectedMonth, upd);
      });
      wrap.appendChild(inp);
      fGrid.appendChild(wrap);
    });
    budCard.appendChild(fGrid);
    var saveFinBtn = el('button', { class:'btn btn-primary btn-sm', type:'button', style:'margin-top:10px' }, '💾 Sauvegarder');
    saveFinBtn.addEventListener('click', function () { toast('Budget ' + selectedMonth + ' sauvegardé ✓'); });
    budCard.appendChild(saveFinBtn);
    panel.appendChild(budCard);

    /* Charges */
    var cCard = el('div', { class:'card' });
    var cHead = el('div', { class:'card-head' });
    cHead.innerHTML = '<div class="card-title">📋 Charges fixes</div>';
    var addChrBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button' }, '+ Charge');
    addChrBtn.addEventListener('click', function () {
      var label = prompt('Nom de la charge :');
      if (!label) return;
      var amount = parseFloat(prompt('Montant (€) :') || '0');
      var f2 = Store.getFinanceMonth(selectedMonth);
      var c2 = (f2.charges || []).concat([{ label: label, amount: amount }]);
      Store.setFinanceMonth(selectedMonth, { charges: c2 });
      buildBudgetPanel(panel);
    });
    cHead.appendChild(addChrBtn);
    cCard.appendChild(cHead);

    var chargesArr = fin.charges || [];
    if (!chargesArr.length) {
      cCard.appendChild(el('div', { class:'text-muted text-xs', style:'padding:8px 0' }, 'Aucune charge fixe'));
    } else {
      chargesArr.forEach(function (c, idx) {
        var item = el('div', { class:'finance-item' });
        item.innerHTML =
          '<span>' + c.label + '</span>' +
          '<div class="flex gap-6 items-center">' +
            '<span class="font-bold finance-neg">-' + fmtEur(c.amount) + '</span>' +
            '<button class="btn-icon" data-idx="' + idx + '">×</button>' +
          '</div>';
        item.querySelector('[data-idx]').addEventListener('click', function () {
          var f3 = Store.getFinanceMonth(selectedMonth);
          var c3 = (f3.charges || []).filter(function (_,i) { return i !== idx; });
          Store.setFinanceMonth(selectedMonth, { charges: c3 });
          buildBudgetPanel(panel);
        });
        cCard.appendChild(item);
      });
    }
    panel.appendChild(cCard);

    /* Dettes */
    var dCard = el('div', { class:'card' });
    var dHead = el('div', { class:'card-head' });
    dHead.innerHTML = '<div class="card-title">📉 Dettes</div>';
    var addDebtBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button' }, '+ Dette');
    addDebtBtn.addEventListener('click', function () {
      var label = prompt('Nom de la dette :');
      if (!label) return;
      var total = parseFloat(prompt('Montant total (€) :') || '0');
      var paid  = parseFloat(prompt('Déjà remboursé (€) :') || '0');
      var f2 = Store.getFinanceMonth(selectedMonth);
      var d2 = (f2.debts || []).concat([{ label: label, total: total, paid: paid }]);
      Store.setFinanceMonth(selectedMonth, { debts: d2 });
      buildBudgetPanel(panel);
    });
    dHead.appendChild(addDebtBtn);
    dCard.appendChild(dHead);

    var debtsArr = fin.debts || [];
    debtsArr.forEach(function (d, idx) {
      var item = el('div', { class:'finance-item' });
      var p2 = pct(d.paid || 0, d.total || 1);
      item.innerHTML =
        '<div style="flex:1">' +
          '<div class="flex justify-between"><span>' + d.label + '</span><span class="finance-neg">-' + ((d.total||0)-(d.paid||0)).toFixed(0) + ' €</span></div>' +
          '<div class="progress-bar mt-8"><div class="progress-fill progress-fill-gold" style="width:' + p2 + '%"></div></div>' +
        '</div>' +
        '<button class="btn-icon" style="margin-left:8px" data-idx="' + idx + '">×</button>';
      item.querySelector('[data-idx]').addEventListener('click', function () {
        var f2 = Store.getFinanceMonth(selectedMonth);
        var d2 = (f2.debts || []).filter(function (_,i) { return i !== idx; });
        Store.setFinanceMonth(selectedMonth, { debts: d2 });
        buildBudgetPanel(panel);
      });
      dCard.appendChild(item);
    });
    panel.appendChild(dCard);
  }

  function buildVintedPanel(panel) {
    panel.innerHTML = '';

    var stats = Store.getVintedStats();

    /* Stats banner */
    var statsCard = el('div', { class:'card card-glow-o card-spotlight' });
    statsCard.innerHTML = '<div class="card-head"><div class="card-title">🛍 Vinted — Statistiques</div></div>';
    var vStats = el('div', { class:'vinted-stats' });
    vStats.innerHTML =
      '<div class="vinted-stat">' +
        '<div class="vinted-stat-value" style="color:var(--green)">' + fmtEur(stats.totalGained) + '</div>' +
        '<div class="vinted-stat-label">Gagné</div>' +
      '</div>' +
      '<div class="vinted-stat">' +
        '<div class="vinted-stat-value" style="color:var(--red)">' + fmtEur(stats.totalInvested) + '</div>' +
        '<div class="vinted-stat-label">Investi</div>' +
      '</div>' +
      '<div class="vinted-stat">' +
        '<div class="vinted-stat-value" style="color:' + (stats.profit >= 0 ? 'var(--green)' : 'var(--red)') + '">' +
          (stats.profit >= 0 ? '+' : '') + fmtEur(stats.profit) +
        '</div>' +
        '<div class="vinted-stat-label">Profit</div>' +
      '</div>';
    statsCard.appendChild(vStats);
    panel.appendChild(statsCard);

    /* Add article button */
    var addBtn = el('button', { class:'btn btn-primary', type:'button', style:'width:100%;margin-bottom:14px' }, '+ Ajouter article');
    addBtn.addEventListener('click', function () {
      var name = prompt('Nom de l\'article :');
      if (!name) return;
      var buyPrice = parseFloat(prompt('Prix d\'achat (€) :') || '0');
      var sellPrice = parseFloat(prompt('Prix de vente prévu (€) :') || '0');
      Store.addVintedItem({ name: name, buyPrice: buyPrice, sellPrice: sellPrice, status: 'En vente' });
      buildVintedPanel(panel);
      toast('Article ajouté ✓');
    });
    panel.appendChild(addBtn);

    /* Items list */
    var vinted = Store.getVinted();
    var items = (vinted.items || []).slice().reverse();

    if (!items.length) {
      panel.appendChild(el('div', { class:'empty-state' },
        el('div', { class:'empty-state-text text-muted' }, 'Aucun article Vinted')));
      return;
    }

    items.forEach(function (item) {
      var statusClass = item.status === 'Vendu' ? 'vinted-status-sold' :
                        item.status === 'Non vendu' ? 'vinted-status-unsold' : 'vinted-status-selling';
      var itemClass = 'vinted-item' +
        (item.status === 'Vendu' ? ' sold' : item.status === 'Non vendu' ? ' unsold' : '');

      var itemEl = el('div', { class: itemClass });

      var infoEl = el('div', { class:'vinted-item-info' });
      infoEl.innerHTML =
        '<div class="vinted-item-name">' + item.name + '</div>' +
        '<div class="vinted-item-prices">Acheté: ' + fmtEur(item.buyPrice) +
          ' · Vente: ' + fmtEur(item.sellPrice) +
          (item.status === 'Vendu' ? ' · Bénéf: <span style="color:var(--green)">+' + fmtEur((item.sellPrice||0)-(item.buyPrice||0)) + '</span>' : '') +
        '</div>';
      itemEl.appendChild(infoEl);

      var stBadge = el('span', { class:'vinted-item-status ' + statusClass }, item.status);
      itemEl.appendChild(stBadge);

      /* Actions */
      var actEl = el('div', { class:'flex gap-6 items-center', style:'flex-shrink:0' });

      if (item.status !== 'Vendu') {
        var sellBtn = el('button', { class:'btn btn-green btn-xs', type:'button' }, '✓ Vendu');
        sellBtn.addEventListener('click', function () {
          var sp = parseFloat(prompt('Prix de vente réel (€) :', item.sellPrice) || item.sellPrice);
          Store.updateVintedItem(item.id, { status: 'Vendu', sellPrice: sp });
          toast('Vendu ' + fmtEur(sp) + ' · Profit: ' + fmtEur(sp - (item.buyPrice||0)));
          buildVintedPanel(panel);
        });
        actEl.appendChild(sellBtn);

        var noSellBtn = el('button', { class:'btn btn-ghost btn-xs', type:'button' }, 'Non vendu');
        noSellBtn.addEventListener('click', function () {
          Store.updateVintedItem(item.id, { status: 'Non vendu' });
          buildVintedPanel(panel);
        });
        actEl.appendChild(noSellBtn);
      }

      var delBtn = el('button', { class:'btn-icon', type:'button', title:'Supprimer' }, '×');
      delBtn.addEventListener('click', function () {
        if (!confirm('Supprimer "' + item.name + '" ?')) return;
        Store.deleteVintedItem(item.id);
        buildVintedPanel(panel);
      });
      actEl.appendChild(delBtn);

      itemEl.appendChild(actEl);
      panel.appendChild(itemEl);
    });
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
          toast('Export téléchargé ✓');
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
              toast('Cache vidé ✓');
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

    /* Score info */
    var scoreInfoCard = el('div', { class:'card card-l-orange' });
    scoreInfoCard.innerHTML =
      '<div class="card-head"><div class="card-title">⚡ Système de Score</div></div>' +
      '<div class="text-xs text-muted" style="line-height:2">' +
        'Bloc routine : <b>+15 pts</b><br>' +
        'Focus ≥25min : <b>+25 pts</b> · ≥50min : <b>+50 pts</b><br>' +
        'Sport fait : <b>+50 pts</b><br>' +
        'Log ≥5 champs : <b>+20 pts</b><br>' +
        'Rotation complète : <b>+50 pts bonus</b><br>' +
        'Streak ≥7j : <b>×1.5</b> · ≥30j : <b>×2.0</b><br><br>' +
        '<b style="color:var(--muted)">Tiers :</b><br>' +
        '0-49 : <b>Sparring</b> · 50-99 : <b style="color:var(--blue2)">Challenger</b><br>' +
        '100-149 : <b style="color:var(--orange)">Contender</b> · 150-199 : <b style="color:var(--gold)">Champion</b><br>' +
        '200+ : <b style="color:var(--red)">LÉGENDE 🏆</b>' +
      '</div>';
    page.appendChild(scoreInfoCard);

    /* Debug info */
    var dbgCard = el('div', { class:'card' });
    dbgCard.innerHTML =
      '<div class="card-head"><div class="card-title">🔬 Debug</div></div>' +
      '<div class="text-xs text-muted" style="line-height:1.9">' +
        'Version : dashv3-20260518-v3<br>' +
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
