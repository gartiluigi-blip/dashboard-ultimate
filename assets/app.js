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

    /* Nutrition — Mode Lite check */
    var hiddenFeatures = Store.getHiddenFeatures ? Store.getHiddenFeatures() : [];
    if (hiddenFeatures.indexOf('nutrition') < 0) {
      page.appendChild(renderNutritionCard(today));
    }
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
  /* Lance le focus timer sur un domaine donné depuis la routine */
  function launchTimer(domain) {
    Router.navigate('aujourdhui');
    setTimeout(function () {
      qsa('.focus-btn').forEach(function (b) {
        if (b.textContent.trim().toUpperCase() === domain.toUpperCase()) b.click();
      });
    }, 160);
  }

  /* Badge de priorité (A/B/C/null) avec cycle au tap */
  function makePrioBadge(blockId, onUpdate) {
    var cur = Store.getBlockPriority(blockId);
    var labels = { null: '—', 'A': 'A', 'B': 'B', 'C': 'C' };
    var classes = { null: 'prio-none', 'A': 'prio-a', 'B': 'prio-b', 'C': 'prio-c' };
    var badge = el('span', { class:'prio-badge ' + (classes[cur] || 'prio-none'), title:'Priorité (appuyer pour changer)' },
      labels[cur] || '—');
    badge.addEventListener('click', function (e) {
      e.stopPropagation();
      var next = Store.cyclePriority(blockId);
      badge.className = 'prio-badge ' + (classes[next] || 'prio-none');
      badge.textContent = labels[next] || '—';
      if (onUpdate) onUpdate(next);
    });
    return badge;
  }

  /* Étoiles de difficulté */
  function makeStarRating(key) {
    var wrap = el('div', { class:'star-rating' });
    wrap.appendChild(el('span', { class:'star-rating-label' }, 'Difficulté :'));
    var cur = Store.getBlockRating(key);
    for (var s = 1; s <= 5; s++) {
      (function (star) {
        var starEl = el('span', { class:'star' + (cur >= star ? ' active' : '') }, '⭐');
        starEl.addEventListener('click', function () {
          var same = Store.getBlockRating(key) === star;
          Store.setBlockRating(key, same ? 0 : star);
          wrap.querySelectorAll('.star').forEach(function (se, i) {
            se.classList.toggle('active', !same && i < star);
          });
        });
        wrap.appendChild(starEl);
      })(s);
    }
    return wrap;
  }

  function renderRoutine() {
    var page = qs('#page-routine');
    if (!page) return;
    page.innerHTML = '';

    var today = Store.today();
    var rotation = D.todayRotation();
    var checks   = Store.getRoutineChecks(today);
    var dailyPractice = Store.getDailyPractice(today);

    /* Total blocs = rotation + daily practice */
    var doneCount = Object.values(checks).filter(Boolean).length
      + D.DAILY_PRACTICE.filter(function(dp){ return dailyPractice[dp.id]; }).length;
    var total = rotation.tasks.length + D.DAILY_PRACTICE.length;
    var pctDone = pct(doneCount, total || 1);

    /* ═══════════════ ANNEAU DE COMPLÉTION ═══════════════ */
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

    /* ═══════════════ TRAVAIL / SHIFT ═══════════════ */
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

    /* ═══════════════ PRATIQUE QUOTIDIENNE ═══════════════ */
    page.appendChild(el('div', { class:'section-title' }, '⚡ Pratique quotidienne'));

    D.DAILY_PRACTICE.forEach(function (dp) {
      var isDone = !!dailyPractice[dp.id];
      var blockId = 'daily_' + dp.id;
      var prio    = Store.getBlockPriority(blockId) || dp.defaultPriority;
      var weekCount = Store.getDailyWeekStats(dp.id);
      var timeKey = blockId + '_' + today;
      var noteKey = blockId + '_' + today;
      var savedNote = Store.getDailyNote(noteKey);
      var subtaskKey = 'dsub_' + dp.id + '_' + today;
      var subtaskData = Store.get(subtaskKey, {});

      var block = el('div', { class:'daily-block rcat-' + dp.cat + (isDone ? ' done' : '') + (prio === 'A' ? ' has-prio-a' : prio === 'B' ? ' has-prio-b' : prio === 'C' ? ' has-prio-c' : '') });

      /* Main row */
      var mainRow = el('div', { class:'daily-block-main' });
      mainRow.appendChild(el('div', { class:'daily-block-icon' }, dp.icon));

      var infoEl = el('div', { class:'daily-block-info' });
      infoEl.appendChild(el('div', { class:'daily-block-title' }, dp.label));

      var metaRow = el('div', { class:'daily-block-meta' });
      metaRow.appendChild(el('span', { class:'cat-chip cat-' + dp.cat }, dp.cat));
      metaRow.appendChild(el('span', { class:'time-est' }, '⏱ ' + dp.min + ' min'));

      /* Week dots */
      var dotsRow = el('div', { class:'week-dots' });
      var todayDow = new Date().getDay();
      for (var wd = 0; wd < 7; wd++) {
        var ddot = new Date(); ddot.setDate(ddot.getDate() - ((todayDow - wd + 7) % 7));
        var ddk = ddot.getFullYear() + '-' + String(ddot.getMonth()+1).padStart(2,'0') + '-' + String(ddot.getDate()).padStart(2,'0');
        var dotDone = !!Store.getDailyPractice(ddk)[dp.id];
        var isToday2 = ddk === today;
        var dot = el('div', { class:'week-dot' + (dotDone ? ' done' : '') + (isToday2 ? ' today' : ''), title: ['D','L','M','Me','J','V','S'][wd] });
        dotsRow.appendChild(dot);
      }
      metaRow.appendChild(dotsRow);

      if (weekCount > 0) {
        metaRow.appendChild(el('span', { class:'time-est', style:'color:var(--violet3)' }, weekCount + '/7 cette semaine'));
      }

      infoEl.appendChild(metaRow);
      if (savedNote) infoEl.appendChild(el('div', { class:'routine-block-note' }, '→ ' + savedNote));
      mainRow.appendChild(infoEl);

      /* Actions */
      var actions = el('div', { class:'daily-block-actions' });

      /* Priority badge */
      var prioBadge = makePrioBadge(blockId, function (next) {
        var pClass = next === 'A' ? ' has-prio-a' : next === 'B' ? ' has-prio-b' : next === 'C' ? ' has-prio-c' : '';
        block.className = 'daily-block rcat-' + dp.cat + (isDone ? ' done' : '') + pClass;
      });
      actions.appendChild(prioBadge);

      /* Expand button */
      var expandBtn = el('button', { class:'routine-expand-btn', type:'button' }, '▾');
      actions.appendChild(expandBtn);

      /* Check button */
      var chkBtn = el('button', {
        class: 'btn-icon',
        type: 'button',
        style: isDone ? 'color:var(--green2);border-color:rgba(16,185,129,.5)' : ''
      }, isDone ? '✓' : '○');
      chkBtn.addEventListener('click', function () {
        Store.toggleDailyPractice(dp.id, today);
        if (!isDone) Store.updateStreak(dp.id);
        renderRoutine();
      });
      actions.appendChild(chkBtn);
      mainRow.appendChild(actions);
      block.appendChild(mainRow);

      /* ── Expand panel ── */
      var expandPanel = el('div', { class:'daily-block-expand' });

      /* Hint */
      var hint = el('div', { class:'routine-hint' });
      hint.appendChild(el('span', { class:'routine-hint-icon' }, '💡'));
      hint.appendChild(el('span', {}, dp.hint));
      expandPanel.appendChild(hint);

      /* Timer launch */
      var timerRow = el('div', { style:'display:flex;gap:8px;margin-bottom:10px;align-items:center' });
      var timerBtn = el('button', { class:'btn-timer', type:'button' }, '⏱ Démarrer timer');
      timerBtn.addEventListener('click', function () {
        launchTimer(dp.id.toUpperCase() === 'CHESS' ? 'AUTRE' : dp.id.toUpperCase());
        toast('Timer lancé → ' + dp.label);
      });
      timerRow.appendChild(timerBtn);
      var spentVal = Store.getBlockTimeSpent(timeKey);
      if (spentVal > 0) timerRow.appendChild(el('span', { class:'time-est', style:'color:var(--green2)' }, '✓ ' + spentVal + ' min loggées'));
      expandPanel.appendChild(timerRow);

      /* Sous-tâches */
      if (dp.subtasks && dp.subtasks.length) {
        var stDiv = el('div', { class:'daily-subtasks' });
        stDiv.appendChild(el('div', { class:'daily-subtask-title' }, 'Checklist'));
        dp.subtasks.forEach(function (stLabel, si) {
          var stDone = !!(subtaskData[si]);
          var stEl = el('div', { class:'daily-subtask' + (stDone ? ' checked' : '') });
          stEl.appendChild(el('span', { style:'font-size:14px' }, stDone ? '✅' : '⬜'));
          stEl.appendChild(el('span', {}, stLabel));
          stEl.addEventListener('click', function () {
            subtaskData[si] = !subtaskData[si];
            Store.set(subtaskKey, subtaskData);
            stEl.classList.toggle('checked', !!subtaskData[si]);
            stEl.querySelector('span').textContent = subtaskData[si] ? '✅' : '⬜';
          });
          stDiv.appendChild(stEl);
        });
        expandPanel.appendChild(stDiv);
      }

      /* Temps passé log */
      var tRow = el('div', { class:'daily-time-row' });
      tRow.appendChild(el('span', { class:'unit-label' }, 'Temps réel :'));
      var tInp = el('input', { type:'number', min:'0', max:'360', placeholder:'0' });
      tInp.value = spentVal || '';
      tRow.appendChild(tInp);
      tRow.appendChild(el('span', { class:'unit-label' }, 'min'));
      expandPanel.appendChild(tRow);

      /* Note libre */
      var noteWrap = el('div', { class:'routine-note-field' });
      noteWrap.appendChild(el('label', {}, 'Où j\'en suis / reprendre à...'));
      var noteTA = el('textarea', { placeholder:'Ex: page 42, exercice 3, niveau ELO…' });
      noteTA.value = savedNote || '';
      noteWrap.appendChild(noteTA);
      expandPanel.appendChild(noteWrap);

      /* Étoiles difficulté */
      expandPanel.appendChild(makeStarRating(timeKey));

      /* Bouton Sauvegarder */
      var saveRow = el('div', { style:'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap' });
      var saveBtn = el('button', { class:'btn btn-primary btn-sm', type:'button' }, '💾 Sauvegarder');
      saveBtn.addEventListener('click', function () {
        var mins = parseInt(tInp.value)||0;
        if (mins > 0) Store.setBlockTimeSpent(timeKey, mins);
        Store.setDailyNote(noteKey, noteTA.value.trim());
        Store.toggleDailyPractice(dp.id, today); /* marque fait */
        Store.updateStreak(dp.id);
        if (dp.studyMat && mins > 0) {
          Store.logStudyProgress(dp.studyMat, mins);
        }
        toast(dp.label + ' — sauvegardé ✓');
        renderRoutine();
      });
      saveRow.appendChild(saveBtn);

      var doneBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button' }, '✓ Terminé');
      doneBtn.addEventListener('click', function () {
        Store.getDailyPractice(today)[dp.id] || Store.toggleDailyPractice(dp.id, today);
        renderRoutine();
      });
      saveRow.appendChild(doneBtn);
      expandPanel.appendChild(saveRow);

      /* Dutch Command link for nl block */
      if (dp.id === 'nl') {
        var dutchLink = el('div', { style:'margin-top:8px' });
        var dutchBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button' }, '🇳🇱 → Voir Dutch Command');
        dutchBtn.addEventListener('click', function () {
          Router.navigate('etude');
          /* After nav, activate Dutch Command tab */
          setTimeout(function () {
            var page2 = qs('#page-etude');
            if (!page2) return;
            var hiddenF = Store.getHiddenFeatures ? Store.getHiddenFeatures() : [];
            if (hiddenF.indexOf('dutch_command') < 0) {
              /* Create a temporary Dutch panel if needed */
              var tmpPanel = qs('#etude-panel-dutch_command');
              if (!tmpPanel) {
                /* Add dutch tab dynamically */
                var innerTabRow2 = qs('.inner-tabs', page2);
                if (innerTabRow2) {
                  var dt = el('div', { class:'inner-tab', 'data-etab':'dutch_command' }, '🇳🇱 Dutch');
                  innerTabRow2.appendChild(dt);
                  var dp2 = el('div', { class:'inner-panel', id:'etude-panel-dutch_command' });
                  page2.appendChild(dp2);
                  renderDutchCommand(dp2);
                  dt.addEventListener('click', function () {
                    qsa('.inner-tab', innerTabRow2).forEach(function (x) { x.classList.remove('active'); });
                    dt.classList.add('active');
                    qsa('.inner-panel', page2).forEach(function (p) {
                      p.classList.toggle('active', p.id === 'etude-panel-dutch_command');
                    });
                  });
                  dt.click();
                }
              } else {
                /* Activate existing */
                qsa('.inner-tab', qs('.inner-tabs', page2)).forEach(function (x) {
                  x.classList.toggle('active', x.dataset.etab === 'dutch_command');
                });
                qsa('.inner-panel', page2).forEach(function (p) {
                  p.classList.toggle('active', p.id === 'etude-panel-dutch_command');
                });
              }
            }
          }, 200);
        });
        dutchLink.appendChild(dutchBtn);
        expandPanel.appendChild(dutchLink);
      }

      block.appendChild(expandPanel);
      page.appendChild(block);

      expandBtn.addEventListener('click', function () {
        var isOpen = expandPanel.classList.contains('open');
        expandPanel.classList.toggle('open', !isOpen);
        expandBtn.classList.toggle('open', !isOpen);
      });
    });

    /* ═══════════════ ROTATION DU JOUR ═══════════════ */
    page.appendChild(el('div', { class:'section-title' }, 'Blocs du jour'));

    /* Sort rotation by priority (A first, then B, C, none) */
    var prioOrder = { 'A':0, 'B':1, 'C':2, null:3 };
    var rotIndexed = rotation.tasks.map(function(t, i){ return { task:t, idx:i }; });
    rotIndexed.sort(function(a, b) {
      var pa = Store.getBlockPriority('rot_' + today + '_' + a.idx);
      var pb = Store.getBlockPriority('rot_' + today + '_' + b.idx);
      return (prioOrder[pa] || 3) - (prioOrder[pb] || 3);
    });

    rotIndexed.forEach(function (item) {
      var task = item.task; var idx = item.idx;
      var done       = !!checks[idx];
      var dateIndex  = today + '_' + idx;
      var savedNote  = Store.getRoutineNote(dateIndex);
      var meta       = D.getRoutineMeta(task);
      var studyMat   = D.taskToStudyMatiere(task);
      var isSport    = D.taskIsSport(task);
      var isRepair   = D.isRepairTask(task);
      var cat        = meta.cat || 'autre';
      var blockId    = 'rot_' + today + '_' + idx;
      var prio       = Store.getBlockPriority(blockId);
      var prioClass  = prio === 'A' ? ' has-prio-a' : prio === 'B' ? ' has-prio-b' : prio === 'C' ? ' has-prio-c' : '';
      var timeSpent  = Store.getBlockTimeSpent(blockId + '_time');

      var block = el('div', { class:'routine-block rcat-' + cat + (done ? ' done' : '') + prioClass });

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

      /* Priority badge */
      var prioBadgeRot = makePrioBadge(blockId, function (next) {
        var pClass2 = next === 'A' ? ' has-prio-a' : next === 'B' ? ' has-prio-b' : next === 'C' ? ' has-prio-c' : '';
        block.className = 'routine-block rcat-' + cat + (done ? ' done' : '') + pClass2;
      });
      actions.appendChild(prioBadgeRot);

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
        var hintEl = el('div', { class:'routine-hint' });
        hintEl.appendChild(el('span', { class:'routine-hint-icon' }, '💡'));
        hintEl.appendChild(el('span', {}, meta.hint));
        expandPanel.appendChild(hintEl);
      }

      /* Timer shortcut row */
      var timerRowRot = el('div', { style:'display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap' });
      var timerBtnRot = el('button', { class:'btn-timer', type:'button' }, '⏱ Démarrer timer');
      timerBtnRot.addEventListener('click', function () {
        var domain = cat === 'study' ? 'EPFC' : cat === 'code' ? 'CODE' : cat === 'repair' ? 'RÉPARATION' : cat === 'tech' ? 'IA' : cat === 'loisir' ? 'AUTRE' : 'AUTRE';
        launchTimer(domain);
        toast('Timer lancé → ' + task);
      });
      timerRowRot.appendChild(timerBtnRot);
      if (timeSpent > 0) timerRowRot.appendChild(el('span', { class:'time-est', style:'color:var(--green2)' }, '✓ ' + timeSpent + ' min'));
      expandPanel.appendChild(timerRowRot);

      /* Temps réel passé */
      var tRowRot = el('div', { class:'daily-time-row' });
      tRowRot.appendChild(el('span', { class:'unit-label' }, 'Temps réel :'));
      var tInpRot = el('input', { type:'number', min:'0', max:'360', placeholder:'0' });
      tInpRot.value = timeSpent || '';
      tRowRot.appendChild(tInpRot);
      tRowRot.appendChild(el('span', { class:'unit-label' }, 'min'));
      expandPanel.appendChild(tRowRot);

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
          /* Save time spent */
          var tMin = parseInt(tInpRot ? tInpRot.value : '0', 10);
          if (tMin > 0) Store.setBlockTimeSpent(blockId + '_time', tMin);
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

        /* Étoiles difficulté */
        expandPanel.appendChild(makeStarRating(blockId + '_rate'));

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

    /* Dutch stats */
    var dutch = Store.getDutchProgress();
    var dutchLog = Store.getDutchLog(today);
    var dutchCard = el('div', { class:'card' });
    dutchCard.innerHTML =
      '<div class="card-head"><div class="card-title">🇳🇱 Dutch</div></div>' +
      '<div class="text-xs" style="line-height:1.9">' +
        'Niveau : <b>' + (dutch.currentLevel||'A1') + '</b> → <b>' + (dutch.targetLevel||'B2') + '</b><br>' +
        'Sessions totales : <b>' + (dutch.totalSessions||0) + '</b><br>' +
        'Aujourd\'hui : <b>' + (dutchLog.minutes||0) + ' min</b> · <b>' + (dutchLog.anki||0) + ' cartes Anki</b>' +
      '</div>';
    page.appendChild(dutchCard);

    /* Enhanced stats extras */
    renderStatsExtras(page);
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

    var hiddenFeatures = Store.getHiddenFeatures ? Store.getHiddenFeatures() : [];

    var innerTabRow = el('div', { class:'inner-tabs' });
    var panelWrap = el('div', {});

    /* Standard study tabs from D.STUDY_TABS */
    var allTabs = []; /* {id, label, panel, isStudy} */

    D.STUDY_TABS.forEach(function (t, idx) {
      allTabs.push({ id: t.id, label: t.label, studyTab: t, isStudy: true });
    });

    /* Extra tabs: Coding, Repair/IoT & Dutch */
    if (hiddenFeatures.indexOf('coding') < 0) {
      allTabs.push({ id:'coding', label:'💻 Coding', isStudy: false });
    }
    if (hiddenFeatures.indexOf('repair_iot') < 0) {
      allTabs.push({ id:'repair_iot', label:'🔧 Réparation/IoT', isStudy: false });
    }
    if (hiddenFeatures.indexOf('dutch_command') < 0) {
      allTabs.push({ id:'dutch_command', label:'🇳🇱 Dutch', isStudy: false });
    }

    var panels = {};

    allTabs.forEach(function (t, idx) {
      var isFirst = idx === 0;
      var tab = el('div', { class:'inner-tab' + (isFirst ? ' active' : ''), 'data-etab': t.id }, t.label);
      innerTabRow.appendChild(tab);

      var panel = el('div', { class:'inner-panel' + (isFirst ? ' active' : ''), id:'etude-panel-' + t.id });
      panels[t.id] = panel;

      if (t.isStudy) {
        buildStudyPanel(panel, t.studyTab);
      }
      panelWrap.appendChild(panel);
    });

    page.appendChild(innerTabRow);
    page.appendChild(panelWrap);

    qsa('.inner-tab', innerTabRow).forEach(function (t) {
      t.addEventListener('click', function () {
        qsa('.inner-tab', innerTabRow).forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        var tid = t.dataset.etab;

        Object.keys(panels).forEach(function (k) {
          panels[k].classList.toggle('active', k === tid);
        });

        /* Lazy-build extra panels */
        if (tid === 'coding' && panels.coding && !panels.coding._built) {
          panels.coding._built = true;
          renderCodingArena(panels.coding);
        }
        if (tid === 'repair_iot' && panels.repair_iot && !panels.repair_iot._built) {
          panels.repair_iot._built = true;
          renderRepairIoTLab(panels.repair_iot);
        }
        if (tid === 'dutch_command' && panels.dutch_command && !panels.dutch_command._built) {
          panels.dutch_command._built = true;
          renderDutchCommand(panels.dutch_command);
        }
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

    /* Net Worth + ETF Simulator */
    renderFinanceExtras(panel);
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

    /* AI Coach + Mode Lite/Full */
    renderReglagesExtras(page);

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
     SIMPLE MODAL HELPER
  ═══════════════════════════════════════════ */
  var SimpleModal = (function () {
    function show(opts) {
      /* opts: { title, fields:[{id,label,type,options,placeholder,value}], onSave(data), saveLabel } */
      var overlay = el('div', { class:'simple-modal-overlay' });
      var modal   = el('div', { class:'simple-modal' });

      modal.appendChild(el('div', { class:'simple-modal-title' }, opts.title || ''));

      var inputs = {};
      (opts.fields || []).forEach(function (f) {
        var wrap = el('div', { class:'simple-modal-field' });
        wrap.appendChild(el('label', {}, f.label || f.id));
        var inp;
        if (f.type === 'select') {
          inp = el('select', {});
          (f.options || []).forEach(function (o) {
            var val = typeof o === 'object' ? o.value : o;
            var lbl = typeof o === 'object' ? o.label : o;
            inp.appendChild(el('option', { value:val }, lbl));
          });
          if (f.value !== undefined) inp.value = f.value;
        } else if (f.type === 'textarea') {
          inp = el('textarea', { placeholder: f.placeholder || '', style:'height:70px' });
          inp.value = f.value || '';
        } else {
          inp = el('input', { type: f.type || 'text', placeholder: f.placeholder || '' });
          inp.value = f.value || '';
        }
        inputs[f.id] = inp;
        wrap.appendChild(inp);
        modal.appendChild(wrap);
      });

      var actions = el('div', { class:'simple-modal-actions' });
      var saveBtn = el('button', { class:'btn btn-primary', type:'button' }, opts.saveLabel || '💾 Sauvegarder');
      var cancelBtn = el('button', { class:'btn btn-secondary', type:'button' }, 'Annuler');

      saveBtn.addEventListener('click', function () {
        var data = {};
        (opts.fields || []).forEach(function (f) {
          data[f.id] = inputs[f.id] ? inputs[f.id].value : '';
        });
        if (opts.onSave) opts.onSave(data);
        document.body.removeChild(overlay);
      });
      cancelBtn.addEventListener('click', function () { document.body.removeChild(overlay); });

      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
      modal.appendChild(actions);

      overlay.appendChild(modal);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) document.body.removeChild(overlay); });
      document.body.appendChild(overlay);
    }

    function confirm(msg, onConfirm) {
      var overlay = el('div', { class:'simple-modal-overlay' });
      var modal   = el('div', { class:'simple-modal' });
      modal.appendChild(el('div', { class:'simple-modal-title' }, msg));
      var actions = el('div', { class:'simple-modal-actions' });
      var okBtn  = el('button', { class:'btn btn-primary', type:'button' }, 'Confirmer');
      var noBtn  = el('button', { class:'btn btn-secondary', type:'button' }, 'Annuler');
      okBtn.addEventListener('click', function () { document.body.removeChild(overlay); if (onConfirm) onConfirm(); });
      noBtn.addEventListener('click', function () { document.body.removeChild(overlay); });
      actions.appendChild(okBtn); actions.appendChild(noBtn);
      modal.appendChild(actions);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    }

    return { show: show, confirm: confirm };
  })();

  /* ═══════════════════════════════════════════
     1. NUTRITION CARD
  ═══════════════════════════════════════════ */
  function renderNutritionCard(today) {
    var card = el('div', { class:'card card-l-orange' });
    var goals = Store.getNutritionGoals();
    var log = Store.getNutritionLog(today);

    /* Header */
    var head = el('div', { class:'card-head' });
    head.innerHTML = '<div class="card-title"><span class="card-title-icon">🥗</span> Nutrition</div>';
    var subEl = el('div', { class:'text-xs text-muted', style:'margin-top:2px' }, 'Suivi performance — pas de régime');
    card.appendChild(head);
    card.appendChild(subEl);

    /* Goals row */
    var goalsDiv = el('div', { style:'display:flex;gap:12px;flex-wrap:wrap;margin:10px 0;align-items:center' });
    goalsDiv.appendChild(el('span', { style:'font-size:10px;color:var(--muted);font-weight:800' }, 'OBJECTIFS :'));

    var protGoalInp = el('input', { type:'number', style:'width:55px;text-align:center', value: goals.proteinG || 150 });
    var protGoalWrap = el('span', { style:'display:flex;align-items:center;gap:4px;font-size:11px;color:var(--dim)' });
    protGoalWrap.appendChild(protGoalInp);
    protGoalWrap.appendChild(document.createTextNode('g protéines/j'));
    goalsDiv.appendChild(protGoalWrap);

    var waterGoalInp = el('input', { type:'number', step:'0.1', style:'width:50px;text-align:center', value: goals.waterL || 2.5 });
    var waterGoalWrap = el('span', { style:'display:flex;align-items:center;gap:4px;font-size:11px;color:var(--dim)' });
    waterGoalWrap.appendChild(waterGoalInp);
    waterGoalWrap.appendChild(document.createTextNode('L eau/j'));
    goalsDiv.appendChild(waterGoalWrap);

    [protGoalInp, waterGoalInp].forEach(function (inp) {
      inp.addEventListener('change', function () {
        Store.setNutritionGoals({
          proteinG: parseFloat(protGoalInp.value) || 150,
          waterL: parseFloat(waterGoalInp.value) || 2.5,
          cleanMealsPerDay: goals.cleanMealsPerDay || 3
        });
      });
    });
    card.appendChild(goalsDiv);

    /* Daily inputs */
    var grid = el('div', { class:'log-grid', style:'margin-bottom:10px' });

    /* Protein */
    var protWrap = el('div', { class:'log-field' });
    protWrap.appendChild(el('label', {}, 'Protéines (g)'));
    var protInp = el('input', { type:'number', min:'0', max:'500', placeholder:'0', value: log.protein || '' });
    protWrap.appendChild(protInp);
    grid.appendChild(protWrap);

    /* Bodyweight */
    var bwWrap = el('div', { class:'log-field' });
    bwWrap.appendChild(el('label', {}, 'Poids (kg, optionnel)'));
    var bwInp = el('input', { type:'number', step:'0.1', min:'30', max:'200', placeholder:'–', value: log.bodyweight || '' });
    bwWrap.appendChild(bwInp);
    grid.appendChild(bwWrap);

    /* Clean meals */
    var mealsWrap = el('div', { class:'log-field' });
    mealsWrap.appendChild(el('label', {}, 'Repas propres'));
    var mealsSel = el('select', {});
    [0,1,2,3,4].forEach(function (n) { mealsSel.appendChild(el('option', { value:n }, n + (n === 4 ? '+' : ''))); });
    mealsSel.value = log.cleanMeals || 0;
    mealsWrap.appendChild(mealsSel);
    grid.appendChild(mealsWrap);

    /* Creatine toggle */
    var creatWrap = el('div', { class:'log-field' });
    creatWrap.appendChild(el('label', {}, 'Créatine'));
    var creatBtn = el('button', { type:'button',
      class:'btn btn-sm ' + (log.creatine ? 'btn-primary' : 'btn-secondary'),
      style:'width:100%'
    }, log.creatine ? '✓ Prise' : '— Non prise');
    creatBtn.addEventListener('click', function () {
      log.creatine = !log.creatine;
      creatBtn.className = 'btn btn-sm ' + (log.creatine ? 'btn-primary' : 'btn-secondary');
      creatBtn.textContent = log.creatine ? '✓ Prise' : '— Non prise';
      saveNutrition();
    });
    creatWrap.appendChild(creatBtn);
    grid.appendChild(creatWrap);

    card.appendChild(grid);

    /* Water with +/- buttons */
    var waterRow = el('div', { class:'nutrition-water-btns', style:'margin-bottom:10px' });
    waterRow.appendChild(el('span', { style:'font-size:11px;color:var(--muted);font-weight:800;margin-right:4px' }, 'Eau (L) :'));
    var waterMinus = el('button', { type:'button', class:'nutrition-water-btn' }, '−');
    var waterVal = el('span', { style:'font-size:18px;font-weight:900;color:var(--cyan2);min-width:40px;text-align:center' },
      (parseFloat(log.water) || 0).toFixed(2));
    var waterPlus = el('button', { type:'button', class:'nutrition-water-btn' }, '+');
    var waterInp2 = el('input', { type:'number', step:'0.01', style:'width:60px;text-align:center', value: parseFloat(log.water || 0).toFixed(2) });

    waterMinus.addEventListener('click', function () {
      var v = Math.max(0, (parseFloat(log.water) || 0) - 0.25);
      log.water = parseFloat(v.toFixed(2));
      waterVal.textContent = log.water.toFixed(2);
      waterInp2.value = log.water.toFixed(2);
      saveNutrition(); updateBars();
    });
    waterPlus.addEventListener('click', function () {
      var v = (parseFloat(log.water) || 0) + 0.25;
      log.water = parseFloat(v.toFixed(2));
      waterVal.textContent = log.water.toFixed(2);
      waterInp2.value = log.water.toFixed(2);
      saveNutrition(); updateBars();
    });
    waterInp2.addEventListener('change', function () {
      log.water = parseFloat(waterInp2.value) || 0;
      waterVal.textContent = log.water.toFixed(2);
      saveNutrition(); updateBars();
    });
    waterRow.appendChild(waterMinus);
    waterRow.appendChild(waterVal);
    waterRow.appendChild(waterPlus);
    waterRow.appendChild(waterInp2);
    card.appendChild(waterRow);

    /* Progress bars */
    var protGoal = parseFloat(goals.proteinG) || 150;
    var waterGoal = parseFloat(goals.waterL) || 2.5;

    var protPct = Math.min(100, ((parseFloat(log.protein)||0) / protGoal * 100)).toFixed(0);
    var waterPct = Math.min(100, ((parseFloat(log.water)||0) / waterGoal * 100)).toFixed(0);

    var barsDiv = el('div', { style:'margin-bottom:10px' });

    var protBarLabel = el('div', { style:'display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:2px' });
    protBarLabel.innerHTML = '<span>Protéines</span><span>' + (log.protein||0) + '/' + protGoal + 'g (' + protPct + '%)</span>';
    var protBar = el('div', { class:'nutrition-progress' });
    var protFill = el('div', { class:'nutrition-progress-fill', style:'width:' + protPct + '%;background:var(--violet2)' });
    protBar.appendChild(protFill);

    var waterBarLabel = el('div', { style:'display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-bottom:2px;margin-top:8px' });
    waterBarLabel.innerHTML = '<span>Eau</span><span>' + (parseFloat(log.water)||0).toFixed(2) + '/' + waterGoal + 'L (' + waterPct + '%)</span>';
    var waterBar = el('div', { class:'nutrition-progress' });
    var waterFill = el('div', { class:'nutrition-progress-fill', style:'width:' + waterPct + '%;background:var(--cyan2)' });
    waterBar.appendChild(waterFill);

    barsDiv.appendChild(protBarLabel);
    barsDiv.appendChild(protBar);
    barsDiv.appendChild(waterBarLabel);
    barsDiv.appendChild(waterBar);
    card.appendChild(barsDiv);

    /* 7-day protein avg */
    var protSum = 0, protDays = 0;
    for (var i2 = 0; i2 < 7; i2++) {
      var dd2 = new Date(); dd2.setDate(dd2.getDate() - i2);
      var dk3 = dd2.getFullYear() + '-' + String(dd2.getMonth()+1).padStart(2,'0') + '-' + String(dd2.getDate()).padStart(2,'0');
      var dLog = Store.getNutritionLog(dk3);
      if (dLog.protein > 0) { protSum += parseFloat(dLog.protein)||0; protDays++; }
    }
    var avgProt = protDays > 0 ? (protSum / protDays).toFixed(0) : 0;
    card.appendChild(el('div', { style:'font-size:10px;color:var(--muted);margin-bottom:10px' },
      '📊 Moy. 7j protéines : ' + avgProt + 'g/j'));

    /* Notes */
    var notesWrap = el('div', { class:'log-field', style:'margin-bottom:10px' });
    notesWrap.appendChild(el('label', {}, 'Notes'));
    var notesTA = el('textarea', { placeholder:'Repas, suppléments, ressentis...', style:'height:60px' });
    notesTA.value = log.notes || '';
    notesWrap.appendChild(notesTA);
    card.appendChild(notesWrap);

    function saveNutrition() {
      log.protein = parseFloat(protInp.value) || 0;
      log.bodyweight = parseFloat(bwInp.value) || null;
      log.cleanMeals = parseInt(mealsSel.value) || 0;
      log.notes = notesTA.value;
      Store.setNutritionLog(today, log);
    }

    function updateBars() {
      var pg = parseFloat(Store.getNutritionGoals().proteinG) || 150;
      var wg = parseFloat(Store.getNutritionGoals().waterL) || 2.5;
      var pp = Math.min(100, ((log.protein||0) / pg * 100));
      var wp = Math.min(100, ((log.water||0) / wg * 100));
      protFill.style.width = pp + '%';
      waterFill.style.width = wp + '%';
    }

    [protInp, bwInp, mealsSel, notesTA].forEach(function (inp) {
      inp.addEventListener('change', function () { saveNutrition(); updateBars(); });
    });

    return card;
  }

  /* ═══════════════════════════════════════════
     2. CODING ARENA
  ═══════════════════════════════════════════ */
  function renderCodingArena(page) {
    page.innerHTML = '';
    var arena = Store.getCodingArena();
    var exercises = arena.exercises || [];
    var projects  = arena.projects  || [];

    /* Filter state */
    var filterPlatform = 'All';
    var filterStatus   = 'All';
    var filterDiff     = 'All';

    /* Stats bar */
    var doneCount2 = exercises.filter(function (e) { return e.status === 'done'; }).length;
    var redoCount  = exercises.filter(function (e) { return e.status === 'redo'; }).length;

    var statsCard = el('div', { class:'card card-glow-o card-spotlight' });
    statsCard.innerHTML =
      '<div class="card-head"><div class="card-title">💻 Coding Arena</div></div>' +
      '<div class="stat-row">' +
        '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + exercises.length + '</div><div class="stat-label">Exos</div></div>' +
        '<div class="stat-box stat-box-gr"><div class="stat-value v-green">' + doneCount2 + '</div><div class="stat-label">Réussis</div></div>' +
        '<div class="stat-box stat-box-g"><div class="stat-value v-gold">' + redoCount + '</div><div class="stat-label">À refaire</div></div>' +
        '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + projects.length + '</div><div class="stat-label">Projets</div></div>' +
      '</div>';
    page.appendChild(statsCard);

    /* Redo queue */
    var redoExs = exercises.filter(function (e) { return e.status === 'redo'; });
    if (redoExs.length) {
      var redoDiv = el('div', { class:'coding-redo-queue' });
      redoDiv.innerHTML = '<div style="font-size:10px;font-weight:800;color:var(--amber2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">🔁 File de redo (' + redoExs.length + ')</div>';
      redoExs.forEach(function (e) {
        var item = el('div', { style:'font-size:11px;color:var(--dim);margin-bottom:2px' });
        item.innerHTML = '• ' + e.title + (e.redoDate ? ' <span style="color:var(--amber2)">→ ' + e.redoDate + '</span>' : '');
        redoDiv.appendChild(item);
      });
      page.appendChild(redoDiv);
    }

    /* Filters */
    var platforms = ['All','CodingBat','Exercism','LeetCode','Codewars','SQLBolt','freeCodeCamp','MDN','Autre'];
    var statuses  = ['All','todo','in_progress','done','redo'];
    var diffs     = ['All','easy','medium','hard'];

    var filterCard = el('div', { class:'card', style:'margin-bottom:10px' });
    var filterHead = el('div', { style:'font-size:10px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px' }, 'Filtres');
    filterCard.appendChild(filterHead);

    function makeFilterChips(list, current, onSet) {
      var row = el('div', { style:'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px' });
      list.forEach(function (v) {
        var chip = el('button', { type:'button',
          style:'padding:3px 8px;border-radius:8px;font-size:10px;font-weight:800;cursor:pointer;' +
            'border:1px solid ' + (current() === v ? 'rgba(124,58,237,.6)' : 'var(--border2)') + ';' +
            'background:' + (current() === v ? 'rgba(124,58,237,.15)' : 'var(--panel3)') + ';' +
            'color:' + (current() === v ? 'var(--violet2)' : 'var(--dim)')
        }, v);
        chip.addEventListener('click', function () { onSet(v); rebuildList(); rebuildFilters(); });
        row.appendChild(chip);
      });
      return row;
    }

    var filtersWrap = el('div', {});
    filterCard.appendChild(filtersWrap);
    page.appendChild(filterCard);

    /* Exercises list container */
    var listContainer = el('div', {});
    page.appendChild(listContainer);

    function statusCycle(cur) {
      var order = ['todo','in_progress','done','redo'];
      var idx2 = order.indexOf(cur);
      return order[(idx2 + 1) % order.length];
    }

    function diffColor(d) {
      return d === 'easy' ? 'var(--green2)' : d === 'medium' ? 'var(--amber2)' : d === 'hard' ? 'var(--red2)' : 'var(--dim)';
    }

    function statusColor(s) {
      return s === 'done' ? 'var(--green2)' : s === 'in_progress' ? 'var(--cyan2)' : s === 'redo' ? 'var(--amber2)' : 'var(--dim)';
    }

    function rebuildFilters() {
      filtersWrap.innerHTML = '';
      filtersWrap.appendChild(makeFilterChips(platforms, function(){return filterPlatform;}, function(v){filterPlatform=v;}));
      filtersWrap.appendChild(makeFilterChips(statuses,  function(){return filterStatus;},   function(v){filterStatus=v;}));
      filtersWrap.appendChild(makeFilterChips(diffs,     function(){return filterDiff;},     function(v){filterDiff=v;}));
    }

    function rebuildList() {
      listContainer.innerHTML = '';
      var filtered = exercises.filter(function (e) {
        return (filterPlatform === 'All' || e.platform === filterPlatform) &&
               (filterStatus   === 'All' || e.status   === filterStatus) &&
               (filterDiff     === 'All' || e.difficulty === filterDiff);
      });

      if (!filtered.length) {
        listContainer.appendChild(el('div', { class:'empty-state' },
          el('div', { class:'empty-state-text text-muted' }, 'Aucun exercice correspondant')));
      }

      filtered.forEach(function (ex) {
        var exCard = el('div', { class:'coding-ex-card' + (ex.status === 'done' ? ' done' : '') });
        var topRow = el('div', { style:'display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px' });

        var titleEl = el('span', { style:'font-weight:800;font-size:13px;flex:1;color:var(--text)' }, ex.title);
        topRow.appendChild(titleEl);

        if (ex.platform) topRow.appendChild(el('span', { class:'coding-platform-badge' }, ex.platform));

        if (ex.difficulty) {
          topRow.appendChild(el('span', { style:'font-size:10px;font-weight:800;padding:2px 7px;border-radius:8px;background:rgba(255,255,255,.06);color:' + diffColor(ex.difficulty) }, ex.difficulty));
        }

        /* Status badge — tappable cycle */
        var stBadge = el('span', { style:'font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px;cursor:pointer;background:rgba(255,255,255,.05);color:' + statusColor(ex.status) }, ex.status || 'todo');
        stBadge.addEventListener('click', function () {
          var ns = statusCycle(ex.status || 'todo');
          Store.updateCodingExercise(ex.id, { status: ns });
          ex.status = ns;
          stBadge.textContent = ns;
          stBadge.style.color = statusColor(ns);
          exCard.classList.toggle('done', ns === 'done');
        });
        topRow.appendChild(stBadge);
        exCard.appendChild(topRow);

        if (ex.language) exCard.appendChild(el('div', { style:'font-size:10px;color:var(--muted)' }, '🔤 ' + ex.language));
        if (ex.errorType) exCard.appendChild(el('div', { style:'font-size:10px;color:var(--dim);margin-top:2px' }, '⚠️ ' + ex.errorType));
        if (ex.solutionNotes) exCard.appendChild(el('div', { style:'font-size:10px;color:var(--muted);margin-top:2px' }, '📝 ' + ex.solutionNotes));
        if (ex.status === 'redo' && ex.redoDate) {
          exCard.appendChild(el('div', { style:'font-size:10px;color:var(--amber2);margin-top:2px' }, '🔁 Refaire le ' + ex.redoDate));
        }

        listContainer.appendChild(exCard);
      });

      /* Add exercise button */
      var addExBtn = el('button', { class:'btn btn-primary', type:'button', style:'width:100%;margin-top:8px' }, '➕ Ajouter exercice');
      addExBtn.addEventListener('click', function () {
        SimpleModal.show({
          title: '➕ Nouvel exercice',
          fields: [
            { id:'title',      label:'Titre',      type:'text',   placeholder:'Ex: Two Sum' },
            { id:'platform',   label:'Plateforme', type:'select', options:['CodingBat','Exercism','LeetCode','Codewars','SQLBolt','freeCodeCamp','MDN','Autre'] },
            { id:'difficulty', label:'Difficulté', type:'select', options:['easy','medium','hard'] },
            { id:'language',   label:'Langage',    type:'text',   placeholder:'JavaScript, Python...' },
            { id:'status',     label:'Statut',     type:'select', options:['todo','in_progress','done','redo'] },
            { id:'errorType',  label:'Type d\'erreur', type:'text', placeholder:'Logique, syntaxe...' },
            { id:'solutionNotes', label:'Notes solution', type:'textarea', placeholder:'...' }
          ],
          onSave: function (data) {
            if (!data.title) { toast('Titre requis'); return; }
            Store.addCodingExercise(data);
            toast('Exercice ajouté ✓');
            renderCodingArena(page);
          }
        });
      });
      listContainer.appendChild(addExBtn);
    }

    rebuildFilters();
    rebuildList();

    /* Projects section */
    var projSection = el('div', { style:'margin-top:16px' });
    projSection.appendChild(el('div', { class:'section-title' }, '🗂 Projets Portfolio'));

    projects.forEach(function (proj) {
      var pCard = el('div', { class:'coding-project-card' });
      var pTop = el('div', { style:'display:flex;align-items:center;gap:8px;margin-bottom:4px' });
      pTop.appendChild(el('span', { style:'font-weight:800;font-size:13px;flex:1' }, proj.name));
      var pStatus = el('span', { style:'font-size:10px;font-weight:800;color:' + (proj.status==='done'?'var(--green2)':proj.status==='in_progress'?'var(--cyan2)':'var(--dim)') }, proj.status || 'planned');
      pTop.appendChild(pStatus);
      pCard.appendChild(pTop);
      if (proj.stack) pCard.appendChild(el('div', { style:'font-size:10px;color:var(--muted)' }, '🔧 ' + proj.stack));
      if (proj.description) pCard.appendChild(el('div', { style:'font-size:11px;color:var(--dim);margin-top:2px' }, proj.description));
      if (proj.githubUrl) {
        var gh = el('a', { href: proj.githubUrl, target:'_blank', style:'font-size:10px;color:var(--cyan2)' }, '🔗 GitHub');
        pCard.appendChild(gh);
      }
      projSection.appendChild(pCard);
    });

    var addProjBtn = el('button', { class:'btn btn-secondary', type:'button', style:'width:100%;margin-top:8px' }, '➕ Nouveau projet');
    addProjBtn.addEventListener('click', function () {
      SimpleModal.show({
        title: '➕ Nouveau projet',
        fields: [
          { id:'name',      label:'Nom',         type:'text',   placeholder:'Mon projet' },
          { id:'stack',     label:'Stack',        type:'text',   placeholder:'HTML/CSS/JS, React...' },
          { id:'description', label:'Description', type:'textarea', placeholder:'Description...' },
          { id:'githubUrl', label:'GitHub URL',   type:'text',   placeholder:'https://github.com/...' },
          { id:'status',    label:'Statut',       type:'select', options:['planned','in_progress','done','paused'] }
        ],
        onSave: function (data) {
          if (!data.name) { toast('Nom requis'); return; }
          Store.addCodingProject(data);
          toast('Projet ajouté ✓');
          renderCodingArena(page);
        }
      });
    });
    projSection.appendChild(addProjBtn);
    page.appendChild(projSection);
  }

  /* ═══════════════════════════════════════════
     3. REPAIR & IoT LAB
  ═══════════════════════════════════════════ */
  var IOT_LEVEL_LABELS = ['ESP32 basics','Capteurs + MQTT','HTTP API + dashboard','Automatisation','Sécurité réseau','Projet complet'];

  function renderRepairIoTLab(page) {
    page.innerHTML = '';

    /* ── Réparation section ── */
    page.appendChild(el('div', { class:'section-title' }, '🔧 Atelier Réparation'));

    var logs = Store.getRepairLogs();
    var repaired = logs.filter(function (l) { return l.status === 'repaired'; }).length;
    var inRepair = logs.filter(function (l) { return l.status === 'in_repair'; }).length;
    var costTotal = logs.reduce(function (a, l) { return a + (parseFloat(l.cost)||0); }, 0);

    var repStats = el('div', { class:'card card-glow-o card-spotlight' });
    repStats.innerHTML =
      '<div class="card-head"><div class="card-title">🔧 Stats Réparation</div></div>' +
      '<div class="stat-row">' +
        '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + logs.length + '</div><div class="stat-label">Total</div></div>' +
        '<div class="stat-box stat-box-gr"><div class="stat-value v-green">' + repaired + '</div><div class="stat-label">Réparés</div></div>' +
        '<div class="stat-box stat-box-g"><div class="stat-value v-gold">' + inRepair + '</div><div class="stat-label">En cours</div></div>' +
        '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + costTotal.toFixed(0) + '€</div><div class="stat-label">Coût total</div></div>' +
      '</div>';
    page.appendChild(repStats);

    /* Status filter */
    var repFilterState = { status: 'All' };
    var repStatuses = ['All','diagnostic','in_repair','repaired','irreparable','paused'];

    var repFilterRow = el('div', { style:'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px' });
    repStatuses.forEach(function (s) {
      var chip = el('button', { type:'button',
        style:'padding:3px 8px;border-radius:8px;font-size:10px;font-weight:800;cursor:pointer;' +
          'border:1px solid ' + (repFilterState.status === s ? 'rgba(124,58,237,.6)' : 'var(--border2)') + ';' +
          'background:' + (repFilterState.status === s ? 'rgba(124,58,237,.15)' : 'var(--panel3)') + ';' +
          'color:' + (repFilterState.status === s ? 'var(--violet2)' : 'var(--dim)')
      }, s);
      chip.addEventListener('click', function () {
        repFilterState.status = s;
        renderRepairIoTLab(page);
      });
      repFilterRow.appendChild(chip);
    });
    page.appendChild(repFilterRow);

    /* Repair log cards */
    var filteredLogs = repFilterState.status === 'All' ? logs : logs.filter(function (l) { return l.status === repFilterState.status; });

    if (!filteredLogs.length) {
      page.appendChild(el('div', { class:'empty-state' },
        el('div', { class:'empty-state-text text-muted' }, 'Aucun diagnostic')));
    }

    var repStatusCycle = { diagnostic:'in_repair', in_repair:'repaired', repaired:'paused', paused:'irreparable', irreparable:'diagnostic' };

    filteredLogs.forEach(function (log) {
      var card = el('div', { class:'repair-log-card' });
      var topRow = el('div', { style:'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px' });

      var deviceEl = el('span', { style:'font-weight:800;font-size:13px;flex:1' }, log.device + (log.brand ? ' (' + log.brand + ')' : ''));
      topRow.appendChild(deviceEl);

      var stClass = 'repair-status-' + (log.status || 'diagnostic');
      var stBadge = el('span', { class:stClass, style:'cursor:pointer' }, log.status || 'diagnostic');
      stBadge.addEventListener('click', function () {
        var ns = repStatusCycle[log.status] || 'diagnostic';
        Store.updateRepairLog(log.id, { status: ns });
        log.status = ns;
        stBadge.className = 'repair-status-' + ns;
        stBadge.textContent = ns;
      });
      topRow.appendChild(stBadge);

      if (log.cost) topRow.appendChild(el('span', { style:'font-size:10px;color:var(--amber2)' }, log.cost + '€'));
      card.appendChild(topRow);

      if (log.symptoms) card.appendChild(el('div', { style:'font-size:11px;color:var(--dim);margin-bottom:2px' }, '🔍 ' + log.symptoms));
      if (log.fault) card.appendChild(el('div', { style:'font-size:10px;color:var(--muted)' }, '⚡ Panne : ' + log.fault));
      if (log.partsNeeded) card.appendChild(el('div', { style:'font-size:10px;color:var(--muted)' }, '🛒 Pièces : ' + log.partsNeeded));

      var lastUpd = el('div', { style:'font-size:9px;color:var(--dim);margin-top:4px' },
        'Mis à jour : ' + (log.updatedAt ? log.updatedAt.slice(0,10) : '—'));
      card.appendChild(lastUpd);

      var delBtn = el('button', { class:'btn-icon', type:'button', style:'float:right;margin-top:-18px' }, '×');
      delBtn.addEventListener('click', function () {
        SimpleModal.confirm('Supprimer "' + log.device + '" ?', function () {
          Store.deleteRepairLog(log.id);
          toast('Supprimé ✓');
          renderRepairIoTLab(page);
        });
      });
      card.appendChild(delBtn);

      page.appendChild(card);
    });

    /* Add repair btn */
    var addRepBtn = el('button', { class:'btn btn-primary', type:'button', style:'width:100%;margin-top:8px;margin-bottom:20px' }, '➕ Nouveau diagnostic');
    addRepBtn.addEventListener('click', function () {
      SimpleModal.show({
        title: '🔧 Nouveau diagnostic',
        fields: [
          { id:'device',           label:'Appareil',         type:'text',     placeholder:'PS4, Ampli, Lampe...' },
          { id:'brand',            label:'Marque',           type:'text',     placeholder:'Sony, Philips...' },
          { id:'symptoms',         label:'Symptômes',        type:'textarea', placeholder:'Pas de son, surchauffe...' },
          { id:'fault',            label:'Panne identifiée', type:'text',     placeholder:'Court-circuit, condo claqué...' },
          { id:'measurements',     label:'Mesures',          type:'text',     placeholder:'12V, 0.5A...' },
          { id:'componentsTested', label:'Composants testés',type:'text',     placeholder:'Fusible, transistor...' },
          { id:'partsNeeded',      label:'Pièces nécessaires',type:'text',    placeholder:'Condensateur 10µF...' },
          { id:'cost',             label:'Coût estimé (€)',  type:'number',   placeholder:'0' },
          { id:'status',           label:'Statut',           type:'select',   options:['diagnostic','in_repair','repaired','irreparable','paused'] },
          { id:'evidenceUrl',      label:'Preuve (URL)',      type:'text',     placeholder:'https://...' },
          { id:'notes',            label:'Notes',            type:'textarea', placeholder:'Observations...' }
        ],
        onSave: function (data) {
          if (!data.device) { toast('Appareil requis'); return; }
          Store.addRepairLog(data);
          toast('Diagnostic ajouté ✓');
          renderRepairIoTLab(page);
        }
      });
    });
    page.appendChild(addRepBtn);

    /* ── IoT Labs section ── */
    page.appendChild(el('div', { class:'section-title' }, '⚡ Labs IoT'));

    var iotData = Store.getIoTLabs();
    var iotLabs = iotData.labs || [];
    var curLevel = iotData.currentLevel || 0;

    /* Level indicator */
    var levelCard = el('div', { class:'card card-glow-o', style:'margin-bottom:10px' });
    var levelRow = el('div', { style:'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px' });
    IOT_LEVEL_LABELS.forEach(function (lbl, li) {
      var pill = el('div', {
        class: 'iot-level-badge',
        style: li <= curLevel ? '' : 'opacity:.4',
        title: lbl
      }, 'L' + li);
      levelRow.appendChild(pill);
    });
    levelCard.appendChild(el('div', { style:'font-size:10px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px' }, 'Niveau IoT'));
    levelCard.appendChild(levelRow);
    levelCard.appendChild(el('div', { style:'font-size:12px;color:var(--cyan2);font-weight:700' }, 'L' + curLevel + ' : ' + (IOT_LEVEL_LABELS[curLevel] || '')));
    page.appendChild(levelCard);

    /* IoT labs */
    iotLabs.forEach(function (lab) {
      var lCard = el('div', { class:'iot-lab-card' });
      var lTop = el('div', { style:'display:flex;align-items:center;gap:8px;margin-bottom:4px' });
      lTop.appendChild(el('span', { style:'font-weight:800;flex:1' }, lab.title));
      lTop.appendChild(el('span', { class:'iot-level-badge' }, 'L' + (lab.level || 0)));
      lTop.appendChild(el('span', { style:'font-size:10px;font-weight:800;color:' + (lab.status==='done'?'var(--green2)':lab.status==='in_progress'?'var(--cyan2)':'var(--dim)') }, lab.status || 'planned'));
      lCard.appendChild(lTop);
      if (lab.description) lCard.appendChild(el('div', { style:'font-size:11px;color:var(--dim);margin-top:2px' }, lab.description));
      if (lab.components) lCard.appendChild(el('div', { style:'font-size:10px;color:var(--muted)' }, '🔌 ' + lab.components));
      if (lab.githubUrl) lCard.appendChild(el('a', { href:lab.githubUrl, target:'_blank', style:'font-size:10px;color:var(--cyan2)' }, '🔗 GitHub'));
      page.appendChild(lCard);
    });

    var addLabBtn = el('button', { class:'btn btn-secondary', type:'button', style:'width:100%;margin-top:8px' }, '➕ Nouveau lab IoT');
    addLabBtn.addEventListener('click', function () {
      SimpleModal.show({
        title: '⚡ Nouveau lab IoT',
        fields: [
          { id:'title',       label:'Titre',       type:'text',   placeholder:'Mon lab ESP32' },
          { id:'level',       label:'Niveau (0-5)', type:'select', options:['0','1','2','3','4','5'] },
          { id:'description', label:'Description',  type:'textarea', placeholder:'...' },
          { id:'components',  label:'Composants',   type:'text',   placeholder:'ESP32, capteur DHT22...' },
          { id:'githubUrl',   label:'GitHub URL',   type:'text',   placeholder:'https://github.com/...' },
          { id:'status',      label:'Statut',       type:'select', options:['planned','in_progress','done'] }
        ],
        onSave: function (data) {
          if (!data.title) { toast('Titre requis'); return; }
          var d = Store.getIoTLabs();
          data.id = Date.now().toString(); data.createdAt = new Date().toISOString();
          d.labs = d.labs || [];
          d.labs.push(data);
          Store.setIoTLabs(d);
          toast('Lab ajouté ✓');
          renderRepairIoTLab(page);
        }
      });
    });
    page.appendChild(addLabBtn);
  }

  /* ═══════════════════════════════════════════
     4. DUTCH COMMAND
  ═══════════════════════════════════════════ */
  function renderDutchCommand(page) {
    page.innerHTML = '';
    var today = Store.today();
    var progress = Store.getDutchProgress();
    var dayLog = Store.getDutchLog(today);

    /* Header */
    var headerCard = el('div', { class:'card card-glow-o card-spotlight' });
    var hTop = el('div', { style:'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px' });
    hTop.appendChild(el('div', { style:'font-size:18px;font-weight:900;color:var(--text)' }, '🇳🇱 Dutch Command'));
    hTop.appendChild(el('span', { style:'padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;background:rgba(6,182,212,.2);border:1px solid rgba(6,182,212,.4);color:var(--cyan2)' }, progress.currentLevel || 'A1'));
    hTop.appendChild(el('span', { style:'font-size:10px;color:var(--muted)' }, '→ ' + (progress.targetLevel || 'B2')));
    headerCard.appendChild(hTop);

    /* Level selector */
    var levels = ['A1','A2','B1','B2','C1'];
    var levelRow = el('div', { style:'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px' });
    levels.forEach(function (lv) {
      var pill = el('button', { type:'button',
        class:'dutch-level-pill' + (progress.currentLevel === lv ? ' active' : '')
      }, lv);
      pill.addEventListener('click', function () {
        Store.setDutchProgress({ currentLevel: lv });
        progress.currentLevel = lv;
        qsa('.dutch-level-pill', headerCard).forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        hTop.querySelector('span').textContent = lv;
        toast('Niveau mis à jour : ' + lv);
      });
      levelRow.appendChild(pill);
    });
    headerCard.appendChild(levelRow);
    page.appendChild(headerCard);

    /* Today's log */
    var logCard = el('div', { class:'card card-l-orange' });
    logCard.innerHTML = '<div class="card-head"><div class="card-title">📅 Log du jour</div></div>';

    var logGrid = el('div', { class:'log-grid' });

    var minWrap = el('div', { class:'log-field' });
    minWrap.appendChild(el('label', {}, 'Minutes pratiquées'));
    var minInp = el('input', { type:'number', min:'0', placeholder:'0', value: dayLog.minutes || '' });
    minWrap.appendChild(minInp);
    logGrid.appendChild(minWrap);

    var ankiWrap = el('div', { class:'log-field' });
    ankiWrap.appendChild(el('label', {}, 'Cartes Anki'));
    var ankiInp = el('input', { type:'number', min:'0', placeholder:'0', value: dayLog.anki || '' });
    ankiWrap.appendChild(ankiInp);
    logGrid.appendChild(ankiWrap);

    var sentWrap = el('div', { class:'log-field' });
    sentWrap.appendChild(el('label', {}, 'Phrases produites'));
    var sentInp = el('input', { type:'number', min:'0', placeholder:'0', value: dayLog.sentences || '' });
    sentWrap.appendChild(sentInp);
    logGrid.appendChild(sentWrap);

    var wordsWrap = el('div', { class:'log-field' });
    wordsWrap.appendChild(el('label', {}, 'Nouveaux mots'));
    var wordsInp = el('input', { type:'number', min:'0', placeholder:'0', value: dayLog.newWords || '' });
    wordsWrap.appendChild(wordsInp);
    logGrid.appendChild(wordsWrap);

    logCard.appendChild(logGrid);

    /* Listening toggle */
    var listenBtn = el('button', { type:'button',
      class:'btn btn-sm ' + (dayLog.listening ? 'btn-primary' : 'btn-secondary'),
      style:'width:100%;margin-bottom:10px'
    }, dayLog.listening ? '🎧 Écoute active ✓' : '🎧 Écoute passive — Non');
    listenBtn.addEventListener('click', function () {
      dayLog.listening = !dayLog.listening;
      listenBtn.className = 'btn btn-sm ' + (dayLog.listening ? 'btn-primary' : 'btn-secondary');
      listenBtn.textContent = dayLog.listening ? '🎧 Écoute active ✓' : '🎧 Écoute passive — Non';
      saveDutchLog();
    });
    logCard.appendChild(listenBtn);

    /* Notes */
    var notesWrap = el('div', { class:'log-field', style:'margin-bottom:10px' });
    notesWrap.appendChild(el('label', {}, 'Notes'));
    var notesTA = el('textarea', { placeholder:'Vocabulaire, expressions, difficultés...', style:'height:60px' });
    notesTA.value = dayLog.notes || '';
    notesWrap.appendChild(notesTA);
    logCard.appendChild(notesWrap);

    function saveDutchLog() {
      dayLog.minutes  = parseInt(minInp.value)  || 0;
      dayLog.anki     = parseInt(ankiInp.value)  || 0;
      dayLog.sentences = parseInt(sentInp.value) || 0;
      dayLog.newWords = parseInt(wordsInp.value) || 0;
      dayLog.notes    = notesTA.value;
      Store.setDutchLog(today, dayLog);
      /* update progress totals */
      Store.setDutchProgress({ totalSessions: (progress.totalSessions || 0) + (dayLog.minutes > 0 ? 1 : 0) });
    }

    [minInp, ankiInp, sentInp, wordsInp, notesTA].forEach(function (inp) {
      inp.addEventListener('change', saveDutchLog);
    });

    page.appendChild(logCard);

    /* Progress stats */
    var statsCard = el('div', { class:'card' });
    statsCard.innerHTML = '<div class="card-head"><div class="card-title">📊 Progression</div></div>';

    /* weekly avg */
    var weekMins = 0;
    for (var wi = 0; wi < 7; wi++) {
      var wd2 = new Date(); wd2.setDate(wd2.getDate() - wi);
      var wk = wd2.getFullYear() + '-' + String(wd2.getMonth()+1).padStart(2,'0') + '-' + String(wd2.getDate()).padStart(2,'0');
      weekMins += Store.getDutchLog(wk).minutes || 0;
    }
    var weekAvg = (weekMins / 7).toFixed(0);

    statsCard.innerHTML +=
      '<div class="stat-row">' +
        '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + (progress.totalSessions||0) + '</div><div class="stat-label">Sessions</div></div>' +
        '<div class="stat-box stat-box-g"><div class="stat-value v-gold">' + weekAvg + '</div><div class="stat-label">Min/j moy</div></div>' +
        '<div class="stat-box stat-box-gr"><div class="stat-value v-green">' + weekMins + '</div><div class="stat-label">Min cette sem</div></div>' +
      '</div>';
    page.appendChild(statsCard);

    /* Monthly test */
    var testCard = el('div', { class:'card' });
    testCard.innerHTML = '<div class="card-head"><div class="card-title">📝 Test mensuel</div></div>';

    var testGrid = el('div', { class:'log-grid' });
    var testFields = [
      { id:'testDate',    label:'Date',           type:'text',   placeholder: today },
      { id:'vocabScore',  label:'Vocabulaire /50', type:'number', placeholder:'0' },
      { id:'gramScore',   label:'Grammaire /50',   type:'number', placeholder:'0' },
      { id:'listeningScore', label:'Écoute /50',   type:'number', placeholder:'0' },
      { id:'speakingComfort', label:'Aisance orale (1-5)', type:'number', placeholder:'1' }
    ];
    var testInputs = {};
    testFields.forEach(function (f) {
      var wrap = el('div', { class:'log-field' });
      wrap.appendChild(el('label', {}, f.label));
      var inp = el('input', { type: f.type, placeholder: f.placeholder });
      testInputs[f.id] = inp;
      wrap.appendChild(inp);
      testGrid.appendChild(wrap);
    });
    testCard.appendChild(testGrid);

    var testNotesWrap = el('div', { class:'log-field', style:'margin-bottom:10px' });
    testNotesWrap.appendChild(el('label', {}, 'Notes'));
    var testNotesTA = el('textarea', { placeholder:'Observations...', style:'height:50px' });
    testNotesWrap.appendChild(testNotesTA);
    testCard.appendChild(testNotesWrap);

    var saveTestBtn = el('button', { class:'btn btn-primary btn-sm', type:'button' }, '💾 Enregistrer test');
    saveTestBtn.addEventListener('click', function () {
      var testData = { date: testInputs.testDate.value || today };
      testFields.slice(1).forEach(function (f) { testData[f.id] = parseFloat(testInputs[f.id].value)||0; });
      testData.notes = testNotesTA.value;
      var p2 = Store.getDutchProgress();
      p2.monthlyTests = p2.monthlyTests || [];
      p2.monthlyTests.push(testData);
      Store.setDutchProgress({ monthlyTests: p2.monthlyTests });
      toast('Test enregistré ✓');
      renderDutchCommand(page);
    });
    testCard.appendChild(saveTestBtn);
    page.appendChild(testCard);

    /* Last 4 tests table */
    var tests = (Store.getDutchProgress().monthlyTests || []).slice(-4).reverse();
    if (tests.length) {
      var tblCard = el('div', { class:'card' });
      tblCard.innerHTML = '<div class="card-head"><div class="card-title">📈 Derniers tests</div></div>';
      tests.forEach(function (t) {
        var row = el('div', { class:'finance-item' });
        var total = ((t.vocabScore||0)+(t.gramScore||0)+(t.listeningScore||0));
        row.innerHTML =
          '<span>' + (t.date || '—') + '</span>' +
          '<span class="font-bold" style="color:var(--cyan2)">' + total + '/150 · aisance ' + (t.speakingComfort||0) + '/5</span>';
        tblCard.appendChild(row);
      });
      page.appendChild(tblCard);
    }

    /* Resources */
    var resCard = el('div', { class:'card' });
    resCard.innerHTML = '<div class="card-head"><div class="card-title">📚 Ressources</div></div>';
    var resources = [
      { name:'Taalgarage', desc:'Podcasts néerlandais naturels' },
      { name:'Anki NL deck', desc:'Deck 1000 mots les plus courants' },
      { name:'Language Transfer Dutch', desc:'Méthode structurée gratuite' },
      { name:'Dutchpod101', desc:'Leçons audio/vidéo progressives' },
      { name:'Netflix NL subtitles', desc:'Immersion avec sous-titres' }
    ];
    resources.forEach(function (r) {
      var item = el('div', { class:'dutch-resource-item' });
      item.innerHTML = '<span style="font-weight:800;font-size:12px">' + r.name + '</span><span style="font-size:10px;color:var(--muted)">' + r.desc + '</span>';
      resCard.appendChild(item);
    });
    page.appendChild(resCard);
  }

  /* ═══════════════════════════════════════════
     5. ENHANCED STATS — RADAR + EXTRA SECTIONS
  ═══════════════════════════════════════════ */
  function renderStatsExtras(page) {
    /* a) 7/30/90 day range selector */
    var rangeState = Store.get('stats_range', 30);
    var rangeCard = el('div', { class:'card', style:'margin-bottom:10px' });
    var rangeRow = el('div', { style:'display:flex;gap:6px' });
    [7, 30, 90].forEach(function (r) {
      var chip = el('button', { type:'button',
        style:'padding:4px 14px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;' +
          'border:1px solid ' + (rangeState === r ? 'rgba(124,58,237,.6)' : 'var(--border2)') + ';' +
          'background:' + (rangeState === r ? 'rgba(124,58,237,.15)' : 'var(--panel3)') + ';' +
          'color:' + (rangeState === r ? 'var(--violet2)' : 'var(--dim)')
      }, r + 'j');
      chip.addEventListener('click', function () {
        Store.set('stats_range', r);
        renderStats();
      });
      rangeRow.appendChild(chip);
    });
    rangeCard.appendChild(el('div', { style:'font-size:10px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px' }, 'Période d\'analyse'));
    rangeCard.appendChild(rangeRow);
    page.appendChild(rangeCard);

    /* b) Radar / domain scores */
    var radarCard = el('div', { class:'card card-glow-o card-spotlight' });
    radarCard.innerHTML = '<div class="card-head"><div class="card-title">🎯 Radar Multi-Domaines</div></div>';

    /* Compute scores */
    var sessions = Store.getFocusSessions();
    var cutoff2 = new Date(); cutoff2.setDate(cutoff2.getDate() - 30);

    /* Étude: sessions EPFC/CODE in last 30d */
    var etudeMin = sessions.filter(function (s) { return new Date(s.date) >= cutoff2 && (s.domain === 'EPFC' || s.domain === 'CODE'); })
                           .reduce(function (a, s) { return a + s.seconds/60; }, 0);
    var etudeScore = Math.min(100, Math.round(etudeMin / 300 * 100)); /* 300 min = 100% */

    /* Sport: sessions done in last 30d */
    var sportDaysCount = 0;
    for (var si = 0; si < 30; si++) {
      var sd2 = new Date(); sd2.setDate(sd2.getDate() - si);
      var sdk = sd2.getFullYear() + '-' + String(sd2.getMonth()+1).padStart(2,'0') + '-' + String(sd2.getDate()).padStart(2,'0');
      if (Store.getSportLog(sdk).sessionDone || Store.getSportOff(sdk)) sportDaysCount++;
    }
    var sportScore = Math.min(100, Math.round(sportDaysCount / 20 * 100));

    /* Finance: based on budget vs charges */
    var fin = Store.getFinanceMonth();
    var salary3 = parseFloat(fin.salary)||0;
    var charges3 = (fin.charges||[]).reduce(function(a,c){return a+(parseFloat(c.amount)||0);}, 0);
    var financeScore = salary3 > 0 ? Math.min(100, Math.round(((salary3 - charges3) / salary3) * 100)) : 50;

    /* Langue: Dutch weekly minutes */
    var dutchWeekMin = 0;
    for (var dw = 0; dw < 7; dw++) {
      var dwd = new Date(); dwd.setDate(dwd.getDate() - dw);
      var dwk = dwd.getFullYear() + '-' + String(dwd.getMonth()+1).padStart(2,'0') + '-' + String(dwd.getDate()).padStart(2,'0');
      dutchWeekMin += Store.getDutchLog(dwk).minutes || 0;
    }
    var langueScore = Math.min(100, Math.round(dutchWeekMin / 60 * 100));

    /* Projets: coding done / total */
    var arena2 = Store.getCodingArena();
    var totalEx = (arena2.exercises||[]).length;
    var doneEx  = (arena2.exercises||[]).filter(function(e){return e.status==='done';}).length;
    var projetsScore = totalEx > 0 ? Math.min(100, Math.round(doneEx / totalEx * 100)) : 0;

    /* Santé: avg energy last 7 days */
    var energySum = 0, energyDays = 0;
    for (var ei = 0; ei < 7; ei++) {
      var ed = new Date(); ed.setDate(ed.getDate() - ei);
      var edk = ed.getFullYear() + '-' + String(ed.getMonth()+1).padStart(2,'0') + '-' + String(ed.getDate()).padStart(2,'0');
      var rtWork = Store.get('routine_work_' + edk, {});
      if (rtWork.fatigue) { energySum += parseFloat(rtWork.fatigue)||0; energyDays++; }
    }
    var avgEnergy = energyDays > 0 ? energySum / energyDays : 0;
    var santeScore = Math.min(100, Math.round(avgEnergy / 5 * 100));

    var radarDomains = [
      { label:'Étude',    score: etudeScore,   color:'var(--violet2)' },
      { label:'Sport',    score: sportScore,   color:'var(--green2)' },
      { label:'Finance',  score: financeScore, color:'var(--amber2)' },
      { label:'Langue',   score: langueScore,  color:'var(--cyan2)' },
      { label:'Projets',  score: projetsScore, color:'var(--orange2)' },
      { label:'Santé',    score: santeScore,   color:'var(--pink)' }
    ];

    radarDomains.forEach(function (d) {
      var row = el('div', { class:'radar-row' });
      row.appendChild(el('div', { class:'radar-label' }, d.label));
      var barOuter = el('div', { class:'radar-bar-outer' });
      var barInner = el('div', { class:'radar-bar-inner', style:'width:' + d.score + '%;background:' + d.color });
      barOuter.appendChild(barInner);
      row.appendChild(barOuter);
      row.appendChild(el('div', { class:'radar-score' }, d.score + '%'));
      radarCard.appendChild(row);
    });
    page.appendChild(radarCard);

    /* c) Vinted performance */
    var vStats = Store.getVintedStats();
    var vintedItems = Store.getVinted().items || [];
    var soldCount = vintedItems.filter(function (i) { return i.status === 'Vendu'; }).length;
    var staleCount = vintedItems.filter(function (i) { return i.status === 'En vente'; }).length;
    var avgROI = soldCount > 0 ?
      (vintedItems.filter(function(i){return i.status==='Vendu';}).reduce(function(a,i){
        var roi = (parseFloat(i.buyPrice)||0) > 0 ? ((parseFloat(i.sellPrice)||0)-(parseFloat(i.buyPrice)||0))/(parseFloat(i.buyPrice)||0)*100 : 0;
        return a + roi;
      }, 0) / soldCount).toFixed(0) + '%' : '–';

    var vintedStatsCard = el('div', { class:'card' });
    vintedStatsCard.innerHTML =
      '<div class="card-head"><div class="card-title">🛍 Performance Vinted</div></div>' +
      '<div class="stat-row">' +
        '<div class="stat-box stat-box-o"><div class="stat-value v-orange">' + vintedItems.length + '</div><div class="stat-label">Articles</div></div>' +
        '<div class="stat-box stat-box-gr"><div class="stat-value v-green">' + soldCount + '</div><div class="stat-label">Vendus</div></div>' +
        '<div class="stat-box stat-box-g"><div class="stat-value v-gold">' + fmtEur(vStats.profit) + '</div><div class="stat-label">Profit</div></div>' +
      '</div>' +
      '<div class="text-xs text-muted" style="margin-top:8px">ROI moyen : <b>' + avgROI + '</b> · En vente : <b>' + staleCount + '</b></div>';
    page.appendChild(vintedStatsCard);

    /* d) Markdown export */
    var exportCard = el('div', { class:'card', style:'margin-top:10px' });
    exportCard.innerHTML = '<div class="card-head"><div class="card-title">📤 Export Stats</div></div>';
    var mdBtn = el('button', { class:'btn btn-secondary', type:'button', style:'width:100%' }, '📥 Exporter stats en .md');
    mdBtn.addEventListener('click', function () {
      var today3 = Store.today();
      var md = [
        '# Stats Dashboard — ' + today3,
        '',
        '## Radar Scores',
      ];
      radarDomains.forEach(function (d) { md.push('- **' + d.label + '** : ' + d.score + '%'); });
      md.push('', '## Vinted');
      md.push('- Articles : ' + vintedItems.length);
      md.push('- Vendus : ' + soldCount);
      md.push('- Profit total : ' + fmtEur(vStats.profit));
      md.push('', '## Dutch');
      var dutch2 = Store.getDutchProgress();
      md.push('- Niveau : ' + (dutch2.currentLevel || 'A1') + ' → ' + (dutch2.targetLevel || 'B2'));
      md.push('- Minutes cette semaine : ' + dutchWeekMin);
      md.push('', '## Coding');
      md.push('- Exercices : ' + totalEx + ' (' + doneEx + ' réussis)');
      md.push('- Projets : ' + (arena2.projects||[]).length);
      md.push('', '## Sport');
      md.push('- Séances ce mois : ' + sportDaysCount + '/30');
      md.push('', '_Généré par Dashboard Ultimate_');

      var blob = new Blob([md.join('\n')], { type:'text/markdown' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'stats-' + today3 + '.md';
      a.click(); URL.revokeObjectURL(url);
      toast('Export .md ✓');
    });
    exportCard.appendChild(mdBtn);
    page.appendChild(exportCard);
  }

  /* ═══════════════════════════════════════════
     6–7. RÉGLAGES ADDITIONS (AI Coach + Mode Lite/Full)
  ═══════════════════════════════════════════ */
  function renderReglagesExtras(page) {
    /* AI Coach stub */
    var aiCard = el('div', { class:'card card-l-orange' });
    aiCard.innerHTML =
      '<div class="card-head"><div class="card-title">🤖 AI Coach</div>' +
        '<span style="padding:2px 8px;border-radius:8px;font-size:10px;font-weight:800;background:rgba(245,158,11,.15);color:var(--amber2)">Non configuré</span>' +
      '</div>' +
      '<div class="text-xs text-muted" style="line-height:1.8;margin-bottom:10px">' +
        'AI Coach — disponible via Netlify Functions<br>' +
        'Pour activer le coach IA, une Netlify Function est requise.<br>' +
        'Les appels locaux ne sont pas supportés.<br><br>' +
        '💰 Quota journalier : <b>5 appels</b> · Cache : <b>6h</b>' +
      '</div>';
    var docBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button', disabled:true, style:'opacity:.5;cursor:not-allowed' }, '📖 Documentation');
    aiCard.appendChild(docBtn);
    page.appendChild(aiCard);

    /* Mode Lite / Full */
    var mode = Store.getAppMode();
    var modeCard = el('div', { class:'card' });
    modeCard.innerHTML = '<div class="card-head"><div class="card-title">⚡ Mode d\'affichage</div></div>';

    var modeRow = el('div', { style:'display:flex;gap:8px;margin-bottom:14px' });
    var liteBtn = el('button', { type:'button', class:'mode-btn' + (mode === 'lite' ? ' active' : '') },
      'LITE — modules essentiels');
    var fullBtn = el('button', { type:'button', class:'mode-btn' + (mode === 'full' ? ' active' : '') },
      'FULL — tout afficher');

    liteBtn.addEventListener('click', function () {
      Store.setAppMode('lite');
      Store.setHiddenFeatures(['nutrition','coding','repair_iot','dutch_command']);
      liteBtn.classList.add('active'); fullBtn.classList.remove('active');
      toast('Mode Lite activé — rechargement...');
      setTimeout(function () { location.reload(); }, 1000);
    });
    fullBtn.addEventListener('click', function () {
      Store.setAppMode('full');
      Store.setHiddenFeatures([]);
      fullBtn.classList.add('active'); liteBtn.classList.remove('active');
      toast('Mode Full activé — rechargement...');
      setTimeout(function () { location.reload(); }, 1000);
    });

    modeRow.appendChild(liteBtn);
    modeRow.appendChild(fullBtn);
    modeCard.appendChild(modeRow);

    if (mode === 'lite') {
      var hidden = Store.getHiddenFeatures();
      if (hidden.length) {
        var hiddenList = el('div', { class:'text-xs text-muted' });
        hiddenList.innerHTML = 'Modules masqués : <b>' + hidden.join(', ') + '</b>';
        modeCard.appendChild(hiddenList);
      }
    }

    page.appendChild(modeCard);
  }

  /* ═══════════════════════════════════════════
     8. FINANCE EXTRAS (Net Worth + ETF Simulator)
  ═══════════════════════════════════════════ */
  function renderFinanceExtras(panel) {
    /* Net Worth Tracker */
    var month = Store.currentMonth();
    var nw = Store.getNetWorth(month);

    var nwCard = el('div', { class:'card card-glow-g card-spotlight', style:'margin-top:12px' });
    nwCard.innerHTML = '<div class="card-head"><div class="card-title">💎 Patrimoine Net — ' + month + '</div></div>';

    var nwGrid = el('div', { class:'log-grid' });
    var nwFields = [
      { id:'savings',    label:'Épargne actuelle (€)',    ph:'5000' },
      { id:'etf',        label:'Valeur ETF (€)',           ph:'0' },
      { id:'realestate', label:'Immobilier estimé (€)',    ph:'0' },
      { id:'other',      label:'Autres actifs (€)',        ph:'0' },
      { id:'debts',      label:'Dettes totales (€)',       ph:'0' }
    ];
    var nwInputs = {};
    nwFields.forEach(function (f) {
      var wrap = el('div', { class:'log-field' });
      wrap.appendChild(el('label', {}, f.label));
      var inp = el('input', { type:'number', min:'0', placeholder:f.ph, value: nw[f.id] || '' });
      nwInputs[f.id] = inp;
      wrap.appendChild(inp);
      nwGrid.appendChild(wrap);
    });
    nwCard.appendChild(nwGrid);

    var nwTotal = el('div', { style:'margin:10px 0;padding:10px;background:var(--panel3);border-radius:var(--r-sm)' });
    function updateNW() {
      var assets = (parseFloat(nwInputs.savings.value)||0) + (parseFloat(nwInputs.etf.value)||0) +
                   (parseFloat(nwInputs.realestate.value)||0) + (parseFloat(nwInputs.other.value)||0);
      var debts = parseFloat(nwInputs.debts.value)||0;
      var net = assets - debts;
      nwTotal.innerHTML = '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">Patrimoine net</div>' +
        '<div style="font-size:22px;font-weight:900;color:' + (net >= 0 ? 'var(--green2)' : 'var(--red2)') + '">' +
        (net >= 0 ? '+' : '') + net.toFixed(0) + ' €</div>';
    }
    Object.keys(nwInputs).forEach(function (k) { nwInputs[k].addEventListener('input', updateNW); });
    updateNW();
    nwCard.appendChild(nwTotal);

    var nwSaveBtn = el('button', { class:'btn btn-primary btn-sm', type:'button' }, '💾 Sauvegarder');
    nwSaveBtn.addEventListener('click', function () {
      var data = {};
      nwFields.forEach(function (f) { data[f.id] = parseFloat(nwInputs[f.id].value)||0; });
      Store.setNetWorth(month, data);
      toast('Patrimoine sauvegardé ✓');
    });
    nwCard.appendChild(nwSaveBtn);
    panel.appendChild(nwCard);

    /* ETF Simulator */
    var etfCard = el('div', { class:'card', style:'margin-top:12px' });
    etfCard.innerHTML = '<div class="card-head"><div class="card-title">📈 Simulateur ETF</div></div>';

    var etfGrid = el('div', { class:'log-grid' });
    var etfFields = [
      { id:'monthly', label:'Investissement mensuel (€)', ph:'200',  type:'number', step:'1',    default:'200' },
      { id:'rate',    label:'Rendement annuel (%)',        ph:'7',    type:'number', step:'0.1',  default:'7' },
      { id:'years',   label:'Durée (années)',              ph:'10',   type:'number', step:'1',    default:'10' }
    ];
    var etfInputs = {};
    etfFields.forEach(function (f) {
      var wrap = el('div', { class:'log-field' });
      wrap.appendChild(el('label', {}, f.label));
      var inp = el('input', { type:f.type || 'number', step:f.step || '1', placeholder:f.ph });
      inp.value = f.default;
      etfInputs[f.id] = inp;
      wrap.appendChild(inp);
      etfGrid.appendChild(wrap);
    });
    etfCard.appendChild(etfGrid);

    var etfResult = el('div', { class:'etf-result-box' });
    function calcETF() {
      var pmt = parseFloat(etfInputs.monthly.value) || 0;
      var r   = (parseFloat(etfInputs.rate.value) || 7) / 100;
      var yrs = parseFloat(etfInputs.years.value) || 10;
      var months = yrs * 12;
      var rm = r / 12;
      var fv = rm > 0 ? pmt * ((Math.pow(1 + rm, months) - 1) / rm) : pmt * months;
      var invested = pmt * months;
      var gain = fv - invested;
      etfResult.innerHTML =
        '<div class="etf-result-value">' + Math.round(fv).toLocaleString('fr-FR') + ' €</div>' +
        '<div class="etf-result-label">Valeur finale projetée</div>' +
        '<div style="margin-top:8px;display:flex;gap:16px;flex-wrap:wrap">' +
          '<div><div class="etf-result-label">Investi</div><div style="font-size:14px;font-weight:800;color:var(--dim)">' + Math.round(invested).toLocaleString('fr-FR') + ' €</div></div>' +
          '<div><div class="etf-result-label">Gain</div><div style="font-size:14px;font-weight:800;color:var(--green2)">+' + Math.round(gain).toLocaleString('fr-FR') + ' €</div></div>' +
        '</div>';
    }
    Object.keys(etfInputs).forEach(function (k) { etfInputs[k].addEventListener('input', calcETF); });
    calcETF();
    etfCard.appendChild(etfResult);
    panel.appendChild(etfCard);
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
