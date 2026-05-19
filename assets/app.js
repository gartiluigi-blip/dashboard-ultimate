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

  /* ═══════════════════════════════════════════
     MODAL SYSTEM
  ═══════════════════════════════════════════ */
  var Modal = (function () {
    function getOverlay() { return document.getElementById('modal-overlay'); }
    function getBox()     { return document.getElementById('modal-box'); }

    function open(html, afterInsert) {
      var ov = getOverlay(); var box = getBox();
      if (!ov || !box) return;
      box.innerHTML = html;
      ov.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (afterInsert) afterInsert(box);
    }

    function close() {
      var ov = getOverlay();
      if (ov) ov.style.display = 'none';
      document.body.style.overflow = '';
    }

    function escListener(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', escListener);

    function alert(msg) {
      open(
        '<div class="modal-title">ℹ️ Info</div>' +
        '<div class="modal-body">' + String(msg) + '</div>' +
        '<div class="modal-actions"><button class="btn btn-primary modal-ok" type="button">OK</button></div>'
      , function(box) {
        box.querySelector('.modal-ok').addEventListener('click', close);
      });
    }

    function confirm(msg, onConfirm) {
      open(
        '<div class="modal-title">Confirmation</div>' +
        '<div class="modal-body">' + String(msg) + '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-secondary modal-cancel" type="button">Annuler</button>' +
          '<button class="btn btn-primary modal-confirm" type="button">Confirmer</button>' +
        '</div>'
      , function(box) {
        box.querySelector('.modal-cancel').addEventListener('click', close);
        box.querySelector('.modal-confirm').addEventListener('click', function () { close(); if (onConfirm) onConfirm(); });
      });
    }

    function destroy(msg, confirmWord, onConfirm) {
      open(
        '<div class="modal-title" style="color:var(--red)">⚠️ Action destructive</div>' +
        '<div class="modal-body">' + String(msg) + '</div>' +
        '<div class="modal-field">' +
          '<label style="font-size:11px;color:var(--muted);font-weight:700">Tapez <b style="color:var(--red)">' + String(confirmWord) + '</b> pour confirmer :</label>' +
          '<input id="modal-destroy-input" type="text" placeholder="' + String(confirmWord) + '" autocomplete="off">' +
        '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-secondary modal-cancel" type="button">Annuler</button>' +
          '<button class="btn btn-danger modal-destroy" type="button" disabled>Supprimer</button>' +
        '</div>'
      , function(box) {
        var inp = box.querySelector('#modal-destroy-input');
        var destroyBtn = box.querySelector('.modal-destroy');
        box.querySelector('.modal-cancel').addEventListener('click', close);
        inp.addEventListener('input', function () {
          destroyBtn.disabled = inp.value !== confirmWord;
        });
        destroyBtn.addEventListener('click', function () { close(); if (onConfirm) onConfirm(); });
      });
    }

    function form(title, fields, onSubmit) {
      var fieldsHtml = (fields || []).map(function (f) {
        var inp = '';
        if (f.type === 'select') {
          inp = '<select id="mf_' + f.id + '">' +
            (f.options || []).map(function (o) {
              return '<option value="' + o.value + '">' + o.label + '</option>';
            }).join('') + '</select>';
        } else if (f.type === 'textarea') {
          inp = '<textarea id="mf_' + f.id + '" placeholder="' + (f.placeholder || '') + '" rows="3"></textarea>';
        } else {
          inp = '<input id="mf_' + f.id + '" type="' + (f.type || 'text') + '" placeholder="' + (f.placeholder || '') + '"' +
            (f.required ? ' required' : '') + '>';
        }
        return '<div class="modal-field"><label>' + (f.label || f.id) + (f.required ? ' *' : '') + '</label>' + inp + '</div>';
      }).join('');

      open(
        '<div class="modal-title">' + String(title) + '</div>' +
        '<div class="modal-form">' + fieldsHtml + '</div>' +
        '<div class="modal-actions">' +
          '<button class="btn btn-secondary modal-cancel" type="button">Annuler</button>' +
          '<button class="btn btn-primary modal-submit" type="button">Enregistrer</button>' +
        '</div>'
      , function(box) {
        box.querySelector('.modal-cancel').addEventListener('click', close);
        box.querySelector('.modal-submit').addEventListener('click', function () {
          var data = {};
          var valid = true;
          (fields || []).forEach(function (f) {
            var el2 = document.getElementById('mf_' + f.id);
            if (!el2) return;
            var val = el2.value.trim ? el2.value.trim() : el2.value;
            if (f.required && !val) { el2.style.borderColor = 'var(--red)'; valid = false; return; }
            data[f.id] = val;
          });
          if (!valid) return;
          close();
          if (onSubmit) onSubmit(data);
        });
      });
    }

    /* Click outside to close */
    document.addEventListener('click', function (e) {
      var ov = getOverlay();
      if (ov && e.target === ov) close();
    });

    return { alert: alert, confirm: confirm, destroy: destroy, form: form, close: close, open: open };
  })();

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
    Modal.form('Nouvel objectif', [
      { id:'label', label:'Objectif', type:'text', placeholder:'Ex: Lire 300 pages...', required:true },
      { id:'target', label:'Cible (nombre)', type:'number', placeholder:'100', required:true }
    ], function (data) {
      var objs = Store.getObjectives();
      objs.push({ id: Date.now(), label: data.label, target: parseInt(data.target,10)||0, current: 0 });
      Store.setObjectives(objs);
      renderAujourdhui();
    });
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
      Modal.form('Nouvelle charge fixe', [
        { id:'label', label:'Nom de la charge', type:'text', placeholder:'Ex: Loyer, Netflix...', required:true },
        { id:'amount', label:'Montant (€)', type:'number', placeholder:'0', required:true }
      ], function (data) {
        var f2 = Store.getFinanceMonth(selectedMonth);
        var c2 = (f2.charges || []).concat([{ label: data.label, amount: parseFloat(data.amount)||0 }]);
        Store.setFinanceMonth(selectedMonth, { charges: c2 });
        buildBudgetPanel(panel);
      });
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
      Modal.form('Nouvelle dette', [
        { id:'label', label:'Nom de la dette', type:'text', placeholder:'Ex: Prêt voiture...', required:true },
        { id:'total', label:'Montant total (€)', type:'number', placeholder:'0', required:true },
        { id:'paid', label:'Déjà remboursé (€)', type:'number', placeholder:'0' }
      ], function (data) {
        var f2 = Store.getFinanceMonth(selectedMonth);
        var d2 = (f2.debts || []).concat([{ label: data.label, total: parseFloat(data.total)||0, paid: parseFloat(data.paid)||0 }]);
        Store.setFinanceMonth(selectedMonth, { debts: d2 });
        buildBudgetPanel(panel);
      });
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
      Modal.form('Ajouter article Vinted', [
        { id:'name', label:'Nom de l\'article', type:'text', placeholder:'Ex: Veste Nike...', required:true },
        { id:'buyPrice', label:'Prix d\'achat (€)', type:'number', placeholder:'0' },
        { id:'sellPrice', label:'Prix de vente prévu (€)', type:'number', placeholder:'0' }
      ], function (data) {
        Store.addVintedItem({ name: data.name, buyPrice: parseFloat(data.buyPrice)||0, sellPrice: parseFloat(data.sellPrice)||0, status: 'En vente' });
        buildVintedPanel(panel);
        toast('Article ajouté ✓');
      });
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
          Modal.form('Prix de vente réel', [
            { id:'sp', label:'Prix de vente (€)', type:'number', placeholder: String(item.sellPrice || '0'), required:true }
          ], function (data) {
            var sp = parseFloat(data.sp) || parseFloat(item.sellPrice) || 0;
            Store.updateVintedItem(item.id, { status: 'Vendu', sellPrice: sp });
            toast('Vendu ' + fmtEur(sp) + ' · Profit: ' + fmtEur(sp - (item.buyPrice||0)));
            buildVintedPanel(panel);
          });
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
        Modal.confirm('Supprimer "' + item.name + '" ?', function () {
          Store.deleteVintedItem(item.id);
          buildVintedPanel(panel);
        });
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
          Modal.confirm('Vider le cache du navigateur ?', function () {
            if (window.caches) {
              caches.keys().then(function (keys) {
                keys.forEach(function (k) { caches.delete(k); });
                toast('Cache vidé ✓');
              });
            } else { toast('Cache API non disponible'); }
          });
        }
      },
      {
        label:'Réinitialiser les données', sub:'⚠️ Supprime TOUTES les données',
        action: function () {
          Modal.destroy('Supprimer TOUTES les données du dashboard ? Cette action est irréversible.', 'SUPPRIMER', function () {
            Store.clearAll();
            toast('Données supprimées · rechargement...');
            setTimeout(function () { location.reload(); }, 1200);
          });
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
     V4 : CERTIFICATIONS (Étude tab)
  ═══════════════════════════════════════════ */
  function seedCertificationsIfEmpty() {
    try {
      var existing = Store.getCertifications();
      if (existing && existing.length > 0) return;
      if (!window.D || !D.CERTIFICATION_SEED) return;
      var now = new Date().toISOString();
      var seeded = D.CERTIFICATION_SEED.map(function (c, i) {
        return Object.assign({}, c, {
          id: 'cert_' + Date.now() + '_' + i,
          status: 'planned',
          readinessPct: 0,
          mockScores: [],
          createdAt: now
        });
      });
      Store.setCertifications(seeded);
    } catch(e) {}
  }

  function computeReadiness(cert) {
    if (!cert) return 0;
    if (cert.status === 'passed') return 100;
    var base = 0;
    var scores = cert.mockScores || [];
    if (scores.length > 0) {
      var last = scores[scores.length - 1];
      base = (parseFloat(last.score) || 0) * 0.6;
    }
    var statusBonus = cert.status === 'active' ? 10 : cert.status === 'exam_ready' ? 20 : 0;
    var proofsCount = (cert.proofsRequired || []).length;
    var proofFactor = proofsCount > 0 ? Math.min(10, proofsCount * 2) : 0;
    var total = base + statusBonus + proofFactor;
    return Math.min(99, Math.round(total));
  }

  function renderCertifications() {
    seedCertificationsIfEmpty();
    var certs = Store.getCertifications() || [];
    var tracks = (window.D && D.CERT_TRACKS) ? D.CERT_TRACKS : [{ id:'all', label:'Tous' }];
    var statuses = (window.D && D.CERT_STATUSES) ? D.CERT_STATUSES : [];

    var wrap = el('div', { class:'cert-panel' });

    /* Header */
    var header = el('div', { class:'cert-panel-header' });
    header.innerHTML = '<div class="card-title">📜 Certifications</div>';
    wrap.appendChild(header);

    /* Stats bar */
    var total = certs.length;
    var active = certs.filter(function(c){ return c.status === 'active'; }).length;
    var passed = certs.filter(function(c){ return c.status === 'passed'; }).length;
    var statsBar = el('div', { class:'cert-stats-bar' });
    statsBar.innerHTML =
      '<div class="cert-stat"><div class="cert-stat-val">' + total + '</div><div class="cert-stat-lbl">Total</div></div>' +
      '<div class="cert-stat"><div class="cert-stat-val" style="color:var(--violet3)">' + active + '</div><div class="cert-stat-lbl">Actives</div></div>' +
      '<div class="cert-stat"><div class="cert-stat-val" style="color:var(--green)">' + passed + '</div><div class="cert-stat-lbl">Passées</div></div>';
    wrap.appendChild(statsBar);

    /* Track filter tabs */
    var filterRow = el('div', { class:'cert-filter-row' });
    var activeTFilter = Store.get('cert_track_filter', 'all');
    var activeOnly = !!Store.get('cert_active_only', false);

    tracks.forEach(function (tr) {
      var btn = el('button', { class:'cert-track-btn' + (activeTFilter === tr.id ? ' active' : ''), type:'button' }, tr.label);
      btn.addEventListener('click', function () {
        Store.set('cert_track_filter', tr.id);
        var cp = qs('#cert-panel-inner');
        if (cp) cp.parentElement.replaceChild(renderCertifications(), cp.parentElement.querySelector('.cert-panel'));
      });
      filterRow.appendChild(btn);
    });
    wrap.appendChild(filterRow);

    /* Active only toggle */
    var toggleRow = el('div', { style:'display:flex;align-items:center;gap:10px;margin:8px 0' });
    var toggleBtn = el('button', { class:'btn btn-secondary btn-sm' + (activeOnly ? ' active' : ''), type:'button' }, activeOnly ? '✓ Active seulement' : 'Active seulement');
    toggleBtn.addEventListener('click', function () {
      Store.set('cert_active_only', !activeOnly);
      var cp = qs('.cert-panel');
      if (cp && cp.parentElement) cp.parentElement.replaceChild(renderCertifications(), cp);
    });
    toggleRow.appendChild(toggleBtn);
    wrap.appendChild(toggleRow);

    /* Timeline collapsible */
    var timelineCard = el('div', { class:'card card-l-blue', style:'margin-bottom:12px' });
    var tlHead = el('div', { class:'card-head', style:'cursor:pointer;margin-bottom:0' });
    tlHead.innerHTML = '<div class="card-title">📅 Séquence recommandée</div><span class="cert-expand-btn">▾</span>';
    var tlBody = el('div', { class:'cert-timeline', style:'display:none;margin-top:12px' });
    var phases = ['0-3m', '3-6m', '6-12m', '12-24m'];
    var phaseColors = ['var(--green)', 'var(--cyan)', 'var(--violet3)', 'var(--amber2)'];
    phases.forEach(function (ph, pi) {
      var phaseCerts = certs.filter(function(c){ return c.sequence === ph; });
      if (!phaseCerts.length) return;
      var phEl = el('div', { class:'cert-timeline-phase' });
      phEl.innerHTML = '<div class="cert-phase-label" style="color:' + phaseColors[pi] + '">' + ph + '</div>';
      phaseCerts.forEach(function (c) {
        var chip = el('div', { class:'cert-phase-chip' }, c.name);
        phEl.appendChild(chip);
      });
      tlBody.appendChild(phEl);
    });
    tlHead.addEventListener('click', function () {
      var open = tlBody.style.display !== 'none';
      tlBody.style.display = open ? 'none' : 'block';
      tlHead.querySelector('.cert-expand-btn').textContent = open ? '▾' : '▴';
    });
    timelineCard.appendChild(tlHead);
    timelineCard.appendChild(tlBody);
    wrap.appendChild(timelineCard);

    /* Cert cards */
    var innerWrap = el('div', { id:'cert-panel-inner' });
    var filtered = certs.filter(function (c) {
      if (activeOnly && c.status !== 'active' && c.status !== 'exam_ready') return false;
      if (activeTFilter !== 'all' && c.track !== activeTFilter) return false;
      return true;
    });

    if (!filtered.length) {
      innerWrap.appendChild(el('div', { class:'empty-state' },
        el('div', { class:'empty-state-text text-muted' }, 'Aucune certification pour ce filtre')));
    }

    filtered.forEach(function (cert) {
      var readiness = computeReadiness(cert);
      var statusCycleOrder = ['planned','active','paused','exam_ready','passed','failed','skipped'];
      var statusColors = { planned:'var(--muted)', active:'var(--violet3)', paused:'var(--amber2)',
        exam_ready:'var(--cyan)', passed:'var(--green)', failed:'var(--red)', skipped:'var(--dim)' };

      var card = el('div', { class:'card cert-card', style:'border-left:4px solid ' + (statusColors[cert.status] || 'var(--border2)') });

      /* Card header row */
      var head = el('div', { class:'cert-card-head' });
      var nameEl = el('div', { class:'cert-card-name' }, cert.name);
      var trackChip = el('span', { class:'cert-track-chip track-' + (cert.track || '') }, (cert.track || '').replace(/_/g,' '));
      var statusBadge = el('span', {
        class:'cert-status-badge status-' + cert.status,
        title:'Cliquer pour changer',
        style:'cursor:pointer'
      }, cert.status);
      statusBadge.addEventListener('click', function () {
        var idx = statusCycleOrder.indexOf(cert.status);
        var next = statusCycleOrder[(idx + 1) % statusCycleOrder.length];
        Store.updateCertification(cert.id, { status: next });
        statusBadge.textContent = next;
        statusBadge.className = 'cert-status-badge status-' + next;
        card.style.borderLeftColor = statusColors[next] || 'var(--border2)';
        var rd2 = computeReadiness(Object.assign({}, cert, { status: next }));
        var pf = card.querySelector('.cert-progress-fill');
        var pt = card.querySelector('.cert-readiness-pct');
        if (pf) pf.style.width = rd2 + '%';
        if (pt) pt.textContent = rd2 + '%';
      });
      head.appendChild(nameEl);
      var chips = el('div', { style:'display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;align-items:center' });
      chips.appendChild(trackChip);
      if (cert.level) chips.appendChild(el('span', { class:'cert-level-badge' }, cert.level));
      chips.appendChild(statusBadge);
      var certInfo = el('div', { style:'flex:1' });
      certInfo.appendChild(nameEl);
      certInfo.appendChild(chips);
      head.appendChild(certInfo);

      /* Expand toggle */
      var expandBtn = el('button', { class:'routine-expand-btn', type:'button' }, '▾');
      head.appendChild(expandBtn);
      card.appendChild(head);

      /* Readiness bar */
      var readRow = el('div', { class:'cert-readiness-row' });
      var pct2El = el('span', { class:'cert-readiness-pct' }, readiness + '%');
      var pb = el('div', { class:'progress-bar', style:'flex:1;height:6px' });
      var pf = el('div', { class:'progress-fill cert-progress-fill', style:'width:' + readiness + '%;background:linear-gradient(90deg,var(--violet),var(--cyan))' });
      pb.appendChild(pf);
      readRow.appendChild(el('span', { class:'cert-readiness-lbl' }, 'Préparation'));
      readRow.appendChild(pb);
      readRow.appendChild(pct2El);
      card.appendChild(readRow);

      /* Next action inline */
      var naRow = el('div', { class:'cert-next-action-row' });
      naRow.appendChild(el('span', { class:'cert-na-lbl' }, '→'));
      var naInp = el('input', { type:'text', placeholder:'Prochaine action...', value: cert.nextAction || '', class:'cert-na-input' });
      naInp.addEventListener('change', function () { Store.updateCertification(cert.id, { nextAction: naInp.value.trim() }); });
      naRow.appendChild(naInp);
      card.appendChild(naRow);

      /* Expand panel */
      var expandPanel = el('div', { class:'cert-expand-panel', style:'display:none' });

      /* Target date + Cost */
      var metaGrid = el('div', { class:'cert-meta-grid' });
      var tdWrap = el('div', { class:'log-field' });
      tdWrap.appendChild(el('label', {}, '📅 Date cible'));
      var tdInp = el('input', { type:'date', value: cert.targetDate || '' });
      tdInp.addEventListener('change', function () { Store.updateCertification(cert.id, { targetDate: tdInp.value }); });
      tdWrap.appendChild(tdInp);
      metaGrid.appendChild(tdWrap);
      if (cert.costEstimate) {
        var costEl = el('div', { class:'log-field' });
        costEl.appendChild(el('label', {}, '💰 Coût estimé'));
        costEl.appendChild(el('div', { style:'color:var(--amber2);font-weight:700;padding:6px 0' }, cert.costEstimate));
        metaGrid.appendChild(costEl);
      }
      expandPanel.appendChild(metaGrid);

      /* Mock scores */
      var msCard = el('div', { class:'cert-mock-section' });
      msCard.appendChild(el('div', { class:'cert-section-title' }, '🎯 Scores mock'));
      var scores = cert.mockScores || [];
      if (!scores.length) {
        msCard.appendChild(el('div', { class:'text-muted text-xs' }, 'Aucun score mock enregistré'));
      } else {
        var msList = el('div', { class:'cert-mock-list' });
        scores.slice(-5).forEach(function (s) {
          var item = el('div', { class:'cert-mock-item' });
          var scoreVal = parseFloat(s.score) || 0;
          var scoreColor = scoreVal >= 80 ? 'var(--green)' : scoreVal >= 65 ? 'var(--amber2)' : 'var(--red)';
          item.innerHTML =
            '<span class="cert-mock-date">' + (s.date || '') + '</span>' +
            '<span class="cert-mock-score" style="color:' + scoreColor + '">' + scoreVal + '%</span>';
          if (s.weakDomains) item.innerHTML += '<span class="cert-mock-weak">Faible: ' + s.weakDomains + '</span>';
          msList.appendChild(item);
        });
        msCard.appendChild(msList);
      }
      var addScoreBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button', style:'margin-top:8px' }, '+ Ajouter score mock');
      addScoreBtn.addEventListener('click', function () {
        Modal.form('Ajouter score mock', [
          { id:'date', label:'Date', type:'date', required:true },
          { id:'score', label:'Score (%)', type:'number', placeholder:'0-100', required:true },
          { id:'weakDomains', label:'Domaines faibles', type:'text', placeholder:'Ex: Sécurité, TCP/IP...' },
          { id:'notes', label:'Notes', type:'textarea', placeholder:'Observations...' }
        ], function (data) {
          Store.addMockScore(cert.id, data);
          toast('Score mock ajouté ✓');
          var cp = qs('.cert-panel');
          if (cp && cp.parentElement) cp.parentElement.replaceChild(renderCertifications(), cp);
        });
      });
      msCard.appendChild(addScoreBtn);
      expandPanel.appendChild(msCard);

      /* Proofs required */
      if (cert.proofsRequired && cert.proofsRequired.length) {
        var proofsEl = el('div', { class:'cert-section-title', style:'margin-top:12px' }, '✅ Preuves requises');
        expandPanel.appendChild(proofsEl);
        cert.proofsRequired.forEach(function (p) {
          var pItem = el('div', { class:'cert-proof-item' });
          pItem.innerHTML = '• ' + p;
          expandPanel.appendChild(pItem);
        });
      }

      /* Skills */
      if (cert.skills && cert.skills.length) {
        var skillsEl = el('div', { class:'cert-section-title', style:'margin-top:12px' }, '🧠 Compétences');
        expandPanel.appendChild(skillsEl);
        var skillsList = el('div', { style:'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px' });
        cert.skills.forEach(function (s) {
          skillsList.appendChild(el('span', { class:'cert-skill-chip' }, s));
        });
        expandPanel.appendChild(skillsList);
      }

      /* Resources */
      if (cert.resources && cert.resources.length) {
        var resEl = el('div', { class:'cert-section-title', style:'margin-top:8px' }, '📚 Ressources');
        expandPanel.appendChild(resEl);
        cert.resources.forEach(function (r) {
          expandPanel.appendChild(el('div', { class:'cert-proof-item' }, '• ' + r));
        });
      }

      card.appendChild(expandPanel);

      expandBtn.addEventListener('click', function () {
        var isOpen = expandPanel.style.display !== 'none';
        expandPanel.style.display = isOpen ? 'none' : 'block';
        expandBtn.textContent = isOpen ? '▾' : '▴';
      });

      innerWrap.appendChild(card);
    });

    wrap.appendChild(innerWrap);
    return wrap;
  }

  /* ═══════════════════════════════════════════
     V4 : PROOFS (Étude tab)
  ═══════════════════════════════════════════ */
  function renderProofs() {
    var proofs = Store.getProofs() || [];
    var wrap = el('div', { class:'proofs-panel' });

    /* Header + add button */
    var head = el('div', { class:'card-head' });
    head.innerHTML = '<div class="card-title">📋 Preuves EPFC</div>';
    var addBtn = el('button', { class:'btn btn-primary btn-sm', type:'button' }, '➕ Nouvelle preuve');
    addBtn.addEventListener('click', function () {
      Modal.form('Nouvelle preuve de compétence', [
        { id:'title', label:'Titre', type:'text', placeholder:'Ex: Projet Python CRUD', required:true },
        { id:'course', label:'Cours / Module', type:'text', placeholder:'Ex: EPFC Python L1' },
        { id:'domain', label:'Domaine', type:'select', options:[
          {value:'programmation',label:'Programmation'},{value:'reseau',label:'Réseau'},
          {value:'base_donnees',label:'Base de données'},{value:'web',label:'Web'},
          {value:'securite',label:'Sécurité'},{value:'systeme',label:'Système'},
          {value:'ia',label:'IA/Data'},{value:'projet',label:'Gestion projet'},{value:'autre',label:'Autre'}
        ]},
        { id:'type', label:'Type', type:'select', options:[
          {value:'projet',label:'Projet'},{value:'exercice',label:'Exercice'},
          {value:'certification',label:'Certification'},{value:'rapport',label:'Rapport'},
          {value:'presentation',label:'Présentation'},{value:'autre',label:'Autre'}
        ]},
        { id:'dueDate', label:'Date limite', type:'date' },
        { id:'evidenceUrl', label:'Lien preuve (URL)', type:'url', placeholder:'https://github.com/...' },
        { id:'nextAction', label:'Prochaine action', type:'text', placeholder:'Ce que je dois faire...' },
        { id:'notes', label:'Notes', type:'textarea', placeholder:'Notes libres...' }
      ], function (data) {
        Store.addProof(Object.assign({ status: 'not_started' }, data));
        toast('Preuve ajoutée ✓');
        var pp = qs('.proofs-panel');
        if (pp && pp.parentElement) pp.parentElement.replaceChild(renderProofs(), pp);
      });
    });
    head.appendChild(addBtn);
    wrap.appendChild(head);

    /* Stats bar */
    var total = proofs.length;
    var validated = proofs.filter(function(p){ return p.status === 'validated'; }).length;
    var inProgress = proofs.filter(function(p){ return p.status === 'in_progress'; }).length;
    var statsBar = el('div', { class:'cert-stats-bar' });
    statsBar.innerHTML =
      '<div class="cert-stat"><div class="cert-stat-val">' + total + '</div><div class="cert-stat-lbl">Total</div></div>' +
      '<div class="cert-stat"><div class="cert-stat-val" style="color:var(--violet3)">' + inProgress + '</div><div class="cert-stat-lbl">En cours</div></div>' +
      '<div class="cert-stat"><div class="cert-stat-val" style="color:var(--green)">' + validated + '</div><div class="cert-stat-lbl">Validées</div></div>';
    wrap.appendChild(statsBar);

    if (!proofs.length) {
      wrap.appendChild(el('div', { class:'empty-state' },
        el('div', { class:'empty-state-text text-muted' }, 'Aucune preuve enregistrée')));
      return wrap;
    }

    var statusCycle = ['not_started','in_progress','blocked','validated','archived'];
    var statusColors = { not_started:'var(--dim)', in_progress:'var(--violet3)',
      blocked:'var(--red)', validated:'var(--green)', archived:'var(--muted)' };
    var statusLabels = { not_started:'Non démarré', in_progress:'En cours',
      blocked:'Bloqué', validated:'Validé ✓', archived:'Archivé' };
    var domainColors = { programmation:'var(--violet3)', reseau:'var(--cyan)',
      base_donnees:'var(--amber2)', web:'var(--blue2)', securite:'var(--red)',
      systeme:'var(--muted)', ia:'var(--green)', projet:'var(--pink)', autre:'var(--dim)' };

    proofs.slice().reverse().forEach(function (proof) {
      var today = Store.today();
      var isOverdue = proof.dueDate && proof.dueDate < today && proof.status !== 'validated' && proof.status !== 'archived';
      var card = el('div', { class:'card proof-card' + (proof.status === 'validated' ? ' proof-validated' : '') });

      var pHead = el('div', { class:'proof-card-head' });
      var titleEl = el('div', { class:'proof-title' },
        (proof.status === 'validated' ? '✅ ' : '') + (proof.title || 'Sans titre'));
      var domainChip = el('span', { class:'proof-domain-chip', style:'background:' + ((domainColors[proof.domain] || 'var(--dim)') + '22') + ';color:' + (domainColors[proof.domain] || 'var(--dim)') }, proof.domain || 'autre');
      var statusBadge = el('span', {
        class:'proof-status-badge',
        style:'cursor:pointer;color:' + (statusColors[proof.status] || 'var(--dim)'),
        title:'Cliquer pour changer'
      }, statusLabels[proof.status] || proof.status);
      statusBadge.addEventListener('click', function () {
        var idx = statusCycle.indexOf(proof.status);
        var next = statusCycle[(idx + 1) % statusCycle.length];
        Store.updateProof(proof.id, { status: next });
        statusBadge.textContent = statusLabels[next] || next;
        statusBadge.style.color = statusColors[next] || 'var(--dim)';
        if (next === 'validated') { card.classList.add('proof-validated'); titleEl.textContent = '✅ ' + proof.title; }
        else { card.classList.remove('proof-validated'); titleEl.textContent = proof.title; }
      });
      pHead.appendChild(titleEl);
      var pMeta = el('div', { style:'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;align-items:center' });
      pMeta.appendChild(domainChip);
      if (proof.type) pMeta.appendChild(el('span', { class:'cert-level-badge' }, proof.type));
      pMeta.appendChild(statusBadge);
      if (isOverdue) pMeta.appendChild(el('span', { style:'color:var(--red);font-size:10px;font-weight:900' }, '⚠️ En retard'));
      var pInfo = el('div', { style:'flex:1' });
      pInfo.appendChild(titleEl);
      if (proof.course) pInfo.appendChild(el('div', { class:'text-muted', style:'font-size:11px;margin-top:2px' }, proof.course));
      pInfo.appendChild(pMeta);
      pHead.appendChild(pInfo);

      /* Edit + delete buttons */
      var pActions = el('div', { style:'display:flex;flex-direction:column;gap:6px;flex-shrink:0' });
      var editBtn = el('button', { class:'btn-icon', type:'button', title:'Modifier' }, '✏️');
      editBtn.addEventListener('click', function () {
        Modal.form('Modifier preuve', [
          { id:'title', label:'Titre', type:'text', placeholder:proof.title || '', required:true },
          { id:'nextAction', label:'Prochaine action', type:'text', placeholder:proof.nextAction || '' },
          { id:'dueDate', label:'Date limite', type:'date' },
          { id:'notes', label:'Notes', type:'textarea', placeholder:proof.notes || '' }
        ], function (data) {
          Store.updateProof(proof.id, data);
          var pp = qs('.proofs-panel');
          if (pp && pp.parentElement) pp.parentElement.replaceChild(renderProofs(), pp);
        });
      });
      var delBtn2 = el('button', { class:'btn-icon', type:'button', title:'Supprimer' }, '×');
      delBtn2.addEventListener('click', function () {
        Modal.confirm('Supprimer cette preuve ?', function () {
          Store.deleteProof(proof.id);
          var pp = qs('.proofs-panel');
          if (pp && pp.parentElement) pp.parentElement.replaceChild(renderProofs(), pp);
        });
      });
      pActions.appendChild(editBtn);
      pActions.appendChild(delBtn2);
      pHead.appendChild(pActions);
      card.appendChild(pHead);

      /* Due date */
      if (proof.dueDate) {
        var dateEl = el('div', { style:'font-size:11px;margin-top:6px;color:' + (isOverdue ? 'var(--red)' : 'var(--muted)') }, '📅 ' + proof.dueDate);
        card.appendChild(dateEl);
      }

      /* Evidence URL */
      if (proof.evidenceUrl) {
        var linkEl = el('a', { href: proof.evidenceUrl, target:'_blank', class:'proof-link' }, '🔗 Voir la preuve');
        card.appendChild(linkEl);
      }

      /* Next action */
      if (proof.nextAction) {
        card.appendChild(el('div', { class:'cert-next-action-row' }, '→ ' + proof.nextAction));
      }

      /* Notes */
      if (proof.notes) {
        card.appendChild(el('div', { class:'text-muted', style:'font-size:11px;margin-top:4px' }, proof.notes));
      }

      wrap.appendChild(card);
    });

    return wrap;
  }

  /* ═══════════════════════════════════════════
     V4 : MISSION NOW (Aujourd'hui tab)
  ═══════════════════════════════════════════ */
  function renderMissionNow(today) {
    var card = el('div', { class:'card card-mission-now card-glow-v' });
    try {
      var mn = Store.getMissionNow();
      var mission = null;
      var todayStr = today || Store.today();

      /* Try to find active mission from history */
      var history = mn.history || [];
      var todayMissions = history.filter(function (h) {
        return h.createdAt && h.createdAt.indexOf(todayStr) === 0 && h.status !== 'done' && h.status !== 'postponed';
      });
      if (todayMissions.length > 0) {
        mission = todayMissions[todayMissions.length - 1];
      } else {
        mission = Store.selectNextMission(todayStr);
      }

      var head = el('div', { class:'card-head' });
      head.innerHTML = '<div class="card-title">⚡ Mission Maintenant</div>';
      card.appendChild(head);

      if (!mission) {
        card.appendChild(el('div', { class:'mission-done-state' }, '✓ Toutes missions terminées'));
        /* Last 3 completed */
        var doneMissions = history.filter(function (h) { return h.status === 'done'; }).slice(-3).reverse();
        if (doneMissions.length) {
          var histEl = el('div', { class:'mission-history' });
          doneMissions.forEach(function (h) {
            histEl.appendChild(el('div', { class:'mission-history-chip' }, '✓ ' + (h.title || 'Mission')));
          });
          card.appendChild(histEl);
        }
        return card;
      }

      /* Mission info */
      var mInfo = el('div', { class:'mission-info' });
      var mTitle = el('div', { class:'mission-title' }, mission.title || 'Mission');
      var mMeta = el('div', { class:'mission-meta' });
      mMeta.appendChild(el('span', { class:'cert-track-chip' }, mission.domain || 'ÉTUDE'));
      mMeta.appendChild(el('span', { class:'time-est' }, '⏱ ' + (mission.durationMin || 25) + ' min'));
      if (mission.sourceLabel) mMeta.appendChild(el('span', { class:'mission-source-label' }, mission.sourceLabel));
      mInfo.appendChild(mTitle);
      mInfo.appendChild(mMeta);
      card.appendChild(mInfo);

      /* Buttons */
      var btnRow = el('div', { class:'mission-actions' });

      var startBtn = el('button', { class:'btn btn-primary', type:'button' }, '⚡ Démarrer 25 min');
      startBtn.addEventListener('click', function () {
        if (mission.source === 'routine' && window.launchTimer) launchTimer(mission.domain);
        else if (typeof launchTimer === 'function') launchTimer(mission.domain);
        Store.addMissionHistory(Object.assign({}, mission, { status: 'started', startedAt: new Date().toISOString() }));
        toast('Mission démarrée → ' + mission.title);
      });

      var doneBtn = el('button', { class:'btn btn-secondary', type:'button' }, '✅ Terminé');
      doneBtn.addEventListener('click', function () {
        Store.addMissionHistory(Object.assign({}, mission, { status: 'done', doneAt: new Date().toISOString() }));
        if (mission.source === 'routine') Store.toggleDailyPractice(mission.id.replace('dp_','').split('_')[0], todayStr);
        toast('Mission terminée ✓');
        var mc = card.parentElement;
        if (mc) mc.replaceChild(renderMissionNow(todayStr), card);
      });

      var postponeBtn = el('button', { class:'btn btn-ghost btn-sm', type:'button' }, '→ Reporter');
      postponeBtn.addEventListener('click', function () {
        Store.addMissionHistory(Object.assign({}, mission, { status: 'postponed', postponedAt: new Date().toISOString() }));
        var mc = card.parentElement;
        if (mc) mc.replaceChild(renderMissionNow(todayStr), card);
      });

      var minBtn = el('button', { class:'btn btn-ghost btn-sm', type:'button' }, '🎯 Minimum vital');
      minBtn.addEventListener('click', function () {
        mTitle.textContent = '(Min) ' + mission.title;
        var timeEl = mMeta.querySelector('.time-est');
        if (timeEl) timeEl.textContent = '⏱ 15 min (minimum)';
        toast('Mode minimum vital activé');
      });

      btnRow.appendChild(startBtn);
      btnRow.appendChild(doneBtn);
      btnRow.appendChild(postponeBtn);
      btnRow.appendChild(minBtn);
      card.appendChild(btnRow);

      /* History chips */
      var doneMissions2 = history.filter(function (h) { return h.status === 'done'; }).slice(-3).reverse();
      if (doneMissions2.length) {
        var histEl2 = el('div', { class:'mission-history' });
        doneMissions2.forEach(function (h) {
          histEl2.appendChild(el('div', { class:'mission-history-chip' }, '✓ ' + (h.title || 'Mission')));
        });
        card.appendChild(histEl2);
      }
    } catch(e) {
      card.innerHTML = '<div class="card-head"><div class="card-title">⚡ Mission Maintenant</div></div><div class="text-muted text-xs">Erreur de chargement</div>';
    }
    return card;
  }

  /* ═══════════════════════════════════════════
     V4 : DAILY OPS BRIEFING (Aujourd'hui tab)
  ═══════════════════════════════════════════ */
  function renderDailyBriefing(today) {
    var todayStr = today || Store.today();
    var card = el('div', { class:'card card-briefing card-l-blue' });

    try {
      var briefing = Store.getOpsBriefing(todayStr);
      if (!briefing) briefing = Store.generateBriefing(todayStr);

      var modeColors = { full:'var(--green)', reduced:'var(--amber2)', survival:'var(--red)' };
      var modeLabels = { full:'FULL', reduced:'RÉDUIT', survival:'SURVIE' };

      var head = el('div', { class:'card-head' });
      var titleEl = el('div', { class:'card-title' }, '📋 Briefing du jour');
      var modeBadge = el('span', {
        class:'cert-status-badge',
        style:'color:' + (modeColors[briefing.mode] || 'var(--muted)')
      }, modeLabels[briefing.mode] || briefing.mode);
      var regenBtn = el('button', { class:'btn btn-ghost btn-xs', type:'button' }, '↺ Regénérer');
      regenBtn.addEventListener('click', function () {
        Store.setOpsBriefing(todayStr, null);
        var bc = card.parentElement;
        if (bc) bc.replaceChild(renderDailyBriefing(todayStr), card);
      });
      head.appendChild(titleEl);
      var headRight = el('div', { style:'display:flex;gap:6px;align-items:center' });
      headRight.appendChild(modeBadge);
      headRight.appendChild(regenBtn);
      head.appendChild(headRight);

      /* Collapsible body */
      var isOpen = !!Store.get('briefing_open_' + todayStr, false);
      var body = el('div', { class:'briefing-body', style: isOpen ? '' : 'display:none' });

      var toggleBtn = el('button', { class:'routine-expand-btn', type:'button', style:'position:absolute;right:16px;top:16px' }, isOpen ? '▴' : '▾');
      toggleBtn.addEventListener('click', function () {
        var open = body.style.display !== 'none';
        body.style.display = open ? 'none' : 'block';
        toggleBtn.textContent = open ? '▾' : '▴';
        Store.set('briefing_open_' + todayStr, !open);
      });
      card.style.position = 'relative';

      card.appendChild(head);
      card.appendChild(toggleBtn);

      /* Shift */
      if (briefing.shift) {
        body.appendChild(el('div', { class:'text-muted text-xs', style:'margin-bottom:8px' }, '💼 Shift : ' + briefing.shift));
      }

      /* Top missions */
      if (briefing.topMissions && briefing.topMissions.length) {
        body.appendChild(el('div', { class:'cert-section-title', style:'margin:8px 0 4px' }, '🎯 Top missions'));
        briefing.topMissions.forEach(function (m) {
          var mEl = el('div', { class:'briefing-mission-item' });
          mEl.innerHTML = '<span class="cert-track-chip">' + m.domain + '</span> ' + m.title +
            (m.min ? ' <span class="time-est">⏱ ' + m.min + 'min</span>' : '');
          body.appendChild(mEl);
        });
      }

      /* Risks */
      if (briefing.risks && briefing.risks.length) {
        body.appendChild(el('div', { class:'cert-section-title', style:'margin:8px 0 4px;color:var(--red)' }, '⚠️ Risques'));
        briefing.risks.forEach(function (r) {
          body.appendChild(el('div', { class:'briefing-risk-item' }, '• ' + r));
        });
      }

      /* Fallback plans */
      var plansRow = el('div', { class:'briefing-plans-row' });
      var plans = [
        { label:'Full', color:'var(--green)', text:'Routine complète + pratique + certif' },
        { label:'Réduit', color:'var(--amber2)', text:'Pratique quotidienne + 1 certif 30min' },
        { label:'Survie', color:'var(--red)', text:'1 exercice code (15min), noter les tâches' }
      ];
      plans.forEach(function (p) {
        var planCard = el('div', { class:'briefing-plan-card' });
        planCard.innerHTML = '<div style="font-weight:900;color:' + p.color + ';font-size:11px;margin-bottom:4px">' + p.label + '</div>' +
          '<div style="font-size:10px;color:var(--muted)">' + p.text + '</div>';
        plansRow.appendChild(planCard);
      });
      body.appendChild(plansRow);

      card.appendChild(body);
    } catch(e) {
      card.innerHTML = '<div class="card-head"><div class="card-title">📋 Briefing du jour</div></div><div class="text-muted text-xs">Erreur de génération</div>';
    }
    return card;
  }

  /* ═══════════════════════════════════════════
     V4 : PERFORMANCE TRACKING (Aujourd'hui)
  ═══════════════════════════════════════════ */
  function renderPerformanceLog(today) {
    var todayStr = today || Store.today();
    var perf = Store.getPerformance(todayStr) || {};
    var card = el('div', { class:'card card-l-green' });

    var head = el('div', { class:'card-head' });
    head.innerHTML = '<div class="card-title">⚡ Performance <span style="font-size:9px;font-weight:600;color:var(--muted);text-transform:none;margin-left:6px">pas un suivi médical</span></div>';
    card.appendChild(head);

    var grid = el('div', { class:'log-grid' });

    /* Sleep hours */
    var sleepWrap = el('div', { class:'log-field' });
    sleepWrap.appendChild(el('label', {}, '😴 Sommeil (h)'));
    var sleepInp = el('input', { type:'number', min:'0', max:'24', step:'0.5', placeholder:'7', value: perf.sleepHours || '' });
    sleepInp.addEventListener('change', function () { Store.setPerformance(todayStr, { sleepHours: parseFloat(sleepInp.value)||0 }); checkAlert(); });
    sleepWrap.appendChild(sleepInp);
    grid.appendChild(sleepWrap);

    /* Wake time */
    var wakeWrap = el('div', { class:'log-field' });
    wakeWrap.appendChild(el('label', {}, '⏰ Réveil'));
    var wakeInp = el('input', { type:'time', value: perf.wakeTime || '' });
    wakeInp.addEventListener('change', function () { Store.setPerformance(todayStr, { wakeTime: wakeInp.value }); });
    wakeWrap.appendChild(wakeInp);
    grid.appendChild(wakeWrap);

    card.appendChild(grid);

    /* Energy dots 1-5 */
    function makeDots(label, key, color) {
      var row = el('div', { class:'perf-dots-row' });
      row.appendChild(el('span', { class:'unit-label', style:'min-width:80px' }, label));
      var dotsWrap = el('div', { class:'perf-dots' });
      var cur = parseInt(perf[key]) || 0;
      for (var i = 1; i <= 5; i++) {
        (function (n) {
          var dot = el('div', { class:'perf-dot' + (cur >= n ? ' active' : ''), style:'--dot-color:' + color });
          dot.addEventListener('click', function () {
            var upd = {}; upd[key] = n;
            Store.setPerformance(todayStr, upd);
            dotsWrap.querySelectorAll('.perf-dot').forEach(function (d, di) {
              d.classList.toggle('active', di < n);
            });
            perf[key] = n;
            checkAlert();
          });
          dotsWrap.appendChild(dot);
        })(i);
      }
      row.appendChild(dotsWrap);
      return row;
    }

    card.appendChild(makeDots('⚡ Énergie', 'energy', 'var(--amber2)'));
    card.appendChild(makeDots('🧘 Stress', 'stress', 'var(--red)'));

    /* Body warning slider */
    var bwRow = el('div', { class:'perf-dots-row', style:'margin-top:10px' });
    bwRow.appendChild(el('span', { class:'unit-label', style:'min-width:80px' }, '🏥 Corps (0-10)'));
    var bwInp = el('input', { type:'range', min:'0', max:'10', value: perf.bodyWarning || 0, style:'flex:1' });
    var bwVal = el('span', { class:'time-est', style:'min-width:24px;text-align:right' }, String(perf.bodyWarning || 0));
    bwInp.addEventListener('input', function () {
      bwVal.textContent = bwInp.value;
      Store.setPerformance(todayStr, { bodyWarning: parseInt(bwInp.value)||0 });
      perf.bodyWarning = parseInt(bwInp.value)||0;
      checkAlert();
    });
    bwRow.appendChild(bwInp);
    bwRow.appendChild(bwVal);
    card.appendChild(bwRow);

    /* Notes */
    var notesWrap = el('div', { class:'log-field', style:'margin-top:10px' });
    notesWrap.appendChild(el('label', {}, 'Notes'));
    var notesTA = el('textarea', { placeholder:'Comment je me sens...', style:'height:60px' });
    notesTA.value = perf.notes || '';
    notesTA.addEventListener('change', function () { Store.setPerformance(todayStr, { notes: notesTA.value }); });
    notesWrap.appendChild(notesTA);
    card.appendChild(notesWrap);

    /* Alert */
    var alertEl = el('div', { class:'perf-alert', style:'display:none' }, '⚠️ Plan réduit recommandé (faible énergie ou douleur corporelle)');
    card.appendChild(alertEl);

    function checkAlert() {
      var energy = parseInt(perf.energy)||5;
      var bw = parseInt(perf.bodyWarning)||0;
      alertEl.style.display = (bw >= 7 || energy <= 2) ? 'block' : 'none';
    }
    checkAlert();

    return card;
  }

  /* ═══════════════════════════════════════════
     V4 : VINTED V2 (Argent tab)
  ═══════════════════════════════════════════ */
  function renderVintedV2() {
    var v = Store.getVintedV2();
    var items = v.items || [];
    var wrap = el('div', { class:'vinted-v2-panel' });

    /* Portfolio stats */
    var invested = 0, capitalBloque = 0, revenus = 0, netProfit = 0, roi = [], sold = 0;
    items.forEach(function (it) {
      var bp = parseFloat(it.buyPrice)||0;
      var sp = parseFloat(it.soldPrice)||0;
      var lp = parseFloat(it.listingPrice)||0;
      var sh = parseFloat(it.shippingCost)||0;
      var bo = parseFloat(it.boostCost)||0;
      var pl = parseFloat(it.platformCost)||0;
      invested += bp;
      if (it.status === 'listed') capitalBloque += lp;
      if (it.status === 'sold') { revenus += sp; netProfit += sp - bp - sh - bo - pl; sold++; }
      if (it.status === 'sold' && sp > 0 && (bp + sh) > 0) roi.push(Math.round((sp - bp - sh - bo - pl) / (bp + sh) * 100));
    });
    var roiMoyen = roi.length ? Math.round(roi.reduce(function(a,b){return a+b;},0) / roi.length) : 0;
    var tauxVente = items.length > 0 ? Math.round(sold / items.length * 100) : 0;

    var statsCard = el('div', { class:'card card-glow-o card-spotlight' });
    statsCard.innerHTML =
      '<div class="card-head"><div class="card-title">🛍 Vinted Pro</div></div>' +
      '<div class="vinted-v2-stats">' +
        '<div class="vinted-v2-stat"><div class="vinted-v2-stat-val" style="color:var(--muted)">' + fmtEur(invested) + '</div><div class="cert-stat-lbl">Investi</div></div>' +
        '<div class="vinted-v2-stat"><div class="vinted-v2-stat-val" style="color:var(--amber2)">' + fmtEur(capitalBloque) + '</div><div class="cert-stat-lbl">Bloqué</div></div>' +
        '<div class="vinted-v2-stat"><div class="vinted-v2-stat-val" style="color:var(--cyan)">' + fmtEur(revenus) + '</div><div class="cert-stat-lbl">Revenus</div></div>' +
        '<div class="vinted-v2-stat"><div class="vinted-v2-stat-val" style="color:' + (netProfit >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (netProfit >= 0 ? '+' : '') + fmtEur(netProfit) + '</div><div class="cert-stat-lbl">Profit net</div></div>' +
        '<div class="vinted-v2-stat"><div class="vinted-v2-stat-val" style="color:var(--violet3)">' + roiMoyen + '%</div><div class="cert-stat-lbl">ROI moy.</div></div>' +
        '<div class="vinted-v2-stat"><div class="vinted-v2-stat-val" style="color:var(--green)">' + tauxVente + '%</div><div class="cert-stat-lbl">Taux vente</div></div>' +
      '</div>';
    wrap.appendChild(statsCard);

    /* Actions bar */
    var actBar = el('div', { style:'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px' });
    var addV2Btn = el('button', { class:'btn btn-primary', type:'button' }, '➕ Ajouter article');
    addV2Btn.addEventListener('click', function () {
      Modal.form('Ajouter article Vinted', [
        { id:'name', label:'Nom', type:'text', placeholder:'Ex: Veste The North Face', required:true },
        { id:'brand', label:'Marque', type:'text', placeholder:'Ex: Nike' },
        { id:'buyPrice', label:'Prix achat (€)', type:'number', placeholder:'0' },
        { id:'listingPrice', label:'Prix annonce (€)', type:'number', placeholder:'0' },
        { id:'shippingCost', label:'Frais envoi (€)', type:'number', placeholder:'0' },
        { id:'boostCost', label:'Boost (€)', type:'number', placeholder:'0' },
        { id:'platformCost', label:'Commission plateforme (€)', type:'number', placeholder:'0' }
      ], function (data) {
        Store.addVintedV2Item({
          name: data.name, brand: data.brand || '',
          buyPrice: parseFloat(data.buyPrice)||0, listingPrice: parseFloat(data.listingPrice)||0,
          shippingCost: parseFloat(data.shippingCost)||0, boostCost: parseFloat(data.boostCost)||0,
          platformCost: parseFloat(data.platformCost)||0, status:'listed'
        });
        toast('Article ajouté ✓');
        var vp = qs('.vinted-v2-panel');
        if (vp && vp.parentElement) vp.parentElement.replaceChild(renderVintedV2(), vp);
      });
    });
    actBar.appendChild(addV2Btn);

    /* CSV Export */
    var csvBtn = el('button', { class:'btn btn-secondary', type:'button' }, '📥 Export CSV');
    csvBtn.addEventListener('click', function () {
      var rows = ['Nom,Marque,Statut,Achat,Annonce,Vendu,Envoi,Boost,Plateforme,Profit net,ROI%'];
      items.forEach(function (it) {
        var bp = parseFloat(it.buyPrice)||0, sp = parseFloat(it.soldPrice)||0;
        var sh = parseFloat(it.shippingCost)||0, bo = parseFloat(it.boostCost)||0, pl = parseFloat(it.platformCost)||0;
        var np2 = it.status === 'sold' ? sp - bp - sh - bo - pl : 0;
        var roi2 = it.status === 'sold' && sp > 0 && (bp+sh)>0 ? Math.round(np2/(bp+sh)*100) : 0;
        rows.push([it.name||'',it.brand||'',it.status,bp,parseFloat(it.listingPrice)||0,sp,sh,bo,pl,np2.toFixed(2),roi2].join(','));
      });
      var blob = new Blob([rows.join('\n')], { type:'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'vinted-' + Store.today() + '.csv'; a.click();
      URL.revokeObjectURL(url);
      toast('Export CSV ✓');
    });
    actBar.appendChild(csvBtn);
    wrap.appendChild(actBar);

    /* Filter chips */
    var filterRow2 = el('div', { style:'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px' });
    var activeStatusFilter = Store.get('vinted_v2_filter', 'all');
    ['all','listed','sold','archived'].forEach(function (s) {
      var fb = el('button', { class:'cert-track-btn' + (activeStatusFilter === s ? ' active' : ''), type:'button' }, s === 'all' ? 'Tous' : s === 'listed' ? 'En vente' : s === 'sold' ? 'Vendus' : 'Archivés');
      fb.addEventListener('click', function () {
        Store.set('vinted_v2_filter', s);
        var vp = qs('.vinted-v2-panel');
        if (vp && vp.parentElement) vp.parentElement.replaceChild(renderVintedV2(), vp);
      });
      filterRow2.appendChild(fb);
    });
    wrap.appendChild(filterRow2);

    /* Items */
    var filteredItems = items.filter(function (it) {
      return activeStatusFilter === 'all' || it.status === activeStatusFilter;
    }).slice().reverse();

    if (!filteredItems.length) {
      wrap.appendChild(el('div', { class:'empty-state' }, el('div', { class:'empty-state-text text-muted' }, 'Aucun article')));
      return wrap;
    }

    var today2 = Store.today();
    filteredItems.forEach(function (it) {
      var bp = parseFloat(it.buyPrice)||0, sp = parseFloat(it.soldPrice)||0;
      var sh = parseFloat(it.shippingCost)||0, bo = parseFloat(it.boostCost)||0, pl = parseFloat(it.platformCost)||0;
      var np2 = it.status === 'sold' ? sp - bp - sh - bo - pl : 0;
      var roi2 = it.status === 'sold' && sp > 0 && (bp+sh)>0 ? Math.round(np2/(bp+sh)*100) : 0;
      var daysListed = it.listedAt ? Math.floor((Date.now() - new Date(it.listedAt).getTime()) / 86400000) : 0;
      var isStale = it.status === 'listed' && daysListed > 14;

      var statusColors2 = { listed:'var(--amber2)', sold:'var(--green)', archived:'var(--muted)' };
      var itemCard = el('div', { class:'card vinted-v2-item' + (isStale ? ' vinted-stale' : '') });

      var iHead = el('div', { class:'vinted-v2-item-head' });
      var iName = el('div', { class:'vinted-item-name' }, (it.name || 'Sans nom') + (it.brand ? ' · ' + it.brand : ''));
      var iStatus = el('span', { class:'vinted-item-status', style:'color:' + (statusColors2[it.status] || 'var(--muted)') }, it.status);
      iHead.appendChild(iName);
      iHead.appendChild(iStatus);

      var iActions = el('div', { style:'display:flex;gap:6px;align-items:center;flex-shrink:0' });
      if (it.status === 'listed') {
        var markSoldBtn = el('button', { class:'btn btn-green btn-xs', type:'button' }, '✓ Vendu');
        markSoldBtn.addEventListener('click', function () {
          Modal.form('Prix de vente réel', [
            { id:'soldPrice', label:'Prix vendu (€)', type:'number', placeholder: String(it.listingPrice || '0'), required:true }
          ], function (data) {
            Store.updateVintedV2Item(it.id, { status: 'sold', soldPrice: parseFloat(data.soldPrice)||0 });
            var vp = qs('.vinted-v2-panel');
            if (vp && vp.parentElement) vp.parentElement.replaceChild(renderVintedV2(), vp);
          });
        });
        iActions.appendChild(markSoldBtn);
      }
      var delV2Btn = el('button', { class:'btn-icon', type:'button', title:'Supprimer' }, '×');
      delV2Btn.addEventListener('click', function () {
        Modal.destroy('Supprimer "' + it.name + '" ?', 'SUPPRIMER', function () {
          Store.deleteVintedV2Item(it.id);
          var vp = qs('.vinted-v2-panel');
          if (vp && vp.parentElement) vp.parentElement.replaceChild(renderVintedV2(), vp);
        });
      });
      iActions.appendChild(delV2Btn);

      var iInfo = el('div', { style:'flex:1' });
      iInfo.appendChild(iHead);

      var iPrices = el('div', { class:'vinted-item-prices', style:'margin-top:4px' });
      iPrices.innerHTML = 'Achat: ' + fmtEur(bp) + ' · Annonce: ' + fmtEur(parseFloat(it.listingPrice)||0);
      if (it.status === 'sold') {
        iPrices.innerHTML += ' · Vendu: ' + fmtEur(sp) +
          ' · <span style="color:' + (np2 >= 0 ? 'var(--green)' : 'var(--red)') + ';font-weight:900">' +
          (np2 >= 0 ? '+' : '') + fmtEur(np2) + ' (' + roi2 + '%)</span>';
      }
      if (daysListed > 0 && it.status === 'listed') {
        iPrices.innerHTML += ' · <span style="color:' + (isStale ? 'var(--amber2)' : 'var(--muted)') + '">' + daysListed + 'j en vente</span>';
      }
      iInfo.appendChild(iPrices);

      /* Stale warning */
      if (isStale) {
        var staleWarn = el('div', { class:'vinted-stale-warn' }, '💡 Baisser prix / Relister / Booster / Abandonner');
        iInfo.appendChild(staleWarn);
      }

      itemCard.appendChild(iInfo);
      itemCard.appendChild(iActions);
      wrap.appendChild(itemCard);
    });

    return wrap;
  }

  /* ═══════════════════════════════════════════
     V4 : FINANCE CASHFLOW COMMAND (Argent tab)
  ═══════════════════════════════════════════ */
  function renderFinanceCommand(month) {
    var m = month || Store.currentMonth();
    var fc = Store.getFinanceCommand(m);
    var wrap = el('div', { class:'finance-command-panel' });

    var head = el('div', { class:'card-head' });
    head.innerHTML = '<div class="card-title">💰 Cashflow ' + m + '</div>';
    wrap.appendChild(head);

    /* Overview */
    var income = parseFloat(fc.income)||0;
    var fixed = parseFloat(fc.fixedCharges)||0;
    var variable = parseFloat(fc.variableSpent)||0;
    var projected = income - fixed - variable;
    var riskPct = income > 0 ? projected / income * 100 : 0;
    var riskColor = riskPct > 20 ? 'var(--green)' : riskPct > 10 ? 'var(--amber2)' : 'var(--red)';
    var riskLabel = riskPct > 20 ? 'SAIN' : riskPct > 10 ? 'ATTENTION' : 'RISQUE';

    var overviewCard = el('div', { class:'card card-l-green', style:'margin-bottom:10px' });
    overviewCard.innerHTML =
      '<div class="cert-stats-bar">' +
        '<div class="cert-stat"><div class="cert-stat-val" style="color:var(--green)">' + fmtEur(income) + '</div><div class="cert-stat-lbl">Revenus</div></div>' +
        '<div class="cert-stat"><div class="cert-stat-val" style="color:var(--red)">' + fmtEur(fixed) + '</div><div class="cert-stat-lbl">Fixes</div></div>' +
        '<div class="cert-stat"><div class="cert-stat-val" style="color:var(--amber2)">' + fmtEur(variable) + '</div><div class="cert-stat-lbl">Variables</div></div>' +
        '<div class="cert-stat"><div class="cert-stat-val" style="color:' + riskColor + '">' + (projected >= 0 ? '+' : '') + fmtEur(projected) + '</div><div class="cert-stat-lbl">Projeté</div></div>' +
      '</div>' +
      '<div style="margin-top:8px;text-align:center"><span class="cert-status-badge" style="color:' + riskColor + '">' + riskLabel + ' · ' + Math.round(riskPct) + '% libre</span></div>';
    wrap.appendChild(overviewCard);

    /* Form fields */
    var fgrid = el('div', { class:'log-grid' });
    var fcFields = [
      { id:'income', label:'Revenus (€)', ph:'2500' },
      { id:'fixedCharges', label:'Charges fixes (€)', ph:'1200' },
      { id:'variableSpent', label:'Dépenses variables (€)', ph:'300' },
      { id:'savingsTarget', label:'Épargne cible (%)', ph:'20' },
      { id:'debtRemaining', label:'Dettes restantes (€)', ph:'0' }
    ];
    fcFields.forEach(function (f) {
      var w2 = el('div', { class:'log-field' });
      w2.appendChild(el('label', {}, f.label));
      var inp = el('input', { type:'number', min:'0', placeholder:f.ph, value: fc[f.id] || '' });
      inp.addEventListener('change', function () {
        var upd = {}; upd[f.id] = parseFloat(inp.value)||0;
        Store.setFinanceCommand(m, upd);
        /* Refresh overview without full re-render */
      });
      w2.appendChild(inp);
      fgrid.appendChild(w2);
    });
    wrap.appendChild(fgrid);

    /* Project buckets */
    var bucketsCard = el('div', { class:'card', style:'margin-top:10px' });
    var bHead = el('div', { class:'card-head' });
    bHead.innerHTML = '<div class="card-title">🪣 Objectifs épargne</div>';
    var addBucketBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button' }, '+ Projet');
    addBucketBtn.addEventListener('click', function () {
      Modal.form('Nouveau projet d\'épargne', [
        { id:'name', label:'Nom', type:'text', placeholder:'Ex: Vacances, PC...', required:true },
        { id:'target', label:'Objectif (€)', type:'number', placeholder:'1000', required:true },
        { id:'current', label:'Épargné (€)', type:'number', placeholder:'0' }
      ], function (data) {
        var updated = Store.getFinanceCommand(m);
        updated.projectBuckets = (updated.projectBuckets || []).concat([{
          name: data.name, target: parseFloat(data.target)||0, current: parseFloat(data.current)||0
        }]);
        Store.setFinanceCommand(m, updated);
        var fp = qs('.finance-command-panel');
        if (fp && fp.parentElement) fp.parentElement.replaceChild(renderFinanceCommand(m), fp);
      });
    });
    bHead.appendChild(addBucketBtn);
    bucketsCard.appendChild(bHead);

    (fc.projectBuckets || []).forEach(function (b, bi) {
      var bItem = el('div', { class:'finance-item' });
      var bPct = b.target > 0 ? pct(b.current||0, b.target) : 0;
      bItem.innerHTML =
        '<div style="flex:1">' +
          '<div class="flex justify-between"><span>' + b.name + '</span><span class="font-bold">' + fmtEur(b.current||0) + ' / ' + fmtEur(b.target) + '</span></div>' +
          '<div class="progress-bar mt-8"><div class="progress-fill" style="width:' + bPct + '%"></div></div>' +
        '</div>' +
        '<button class="btn-icon" style="margin-left:8px" data-bi="' + bi + '">×</button>';
      bItem.querySelector('[data-bi]').addEventListener('click', function () {
        var upd = Store.getFinanceCommand(m);
        upd.projectBuckets = (upd.projectBuckets||[]).filter(function(_,i){return i!==bi;});
        Store.setFinanceCommand(m, upd);
        var fp = qs('.finance-command-panel');
        if (fp && fp.parentElement) fp.parentElement.replaceChild(renderFinanceCommand(m), fp);
      });
      bucketsCard.appendChild(bItem);
    });
    wrap.appendChild(bucketsCard);

    /* Notes + correction plan */
    var notesCard = el('div', { class:'card', style:'margin-top:10px' });
    notesCard.innerHTML = '<div class="card-head"><div class="card-title">📝 Notes</div></div>';
    var notesTA2 = el('textarea', { placeholder:'Notes du mois...', style:'width:100%;height:70px;margin-bottom:8px' });
    notesTA2.value = fc.notes || '';
    notesTA2.addEventListener('change', function () { Store.setFinanceCommand(m, { notes: notesTA2.value }); });
    var corrTA = el('textarea', { placeholder:'Plan de correction...', style:'width:100%;height:60px' });
    corrTA.value = fc.correctionPlan || '';
    corrTA.addEventListener('change', function () { Store.setFinanceCommand(m, { correctionPlan: corrTA.value }); });
    notesCard.appendChild(el('label', { style:'font-size:11px;color:var(--muted)' }, 'Notes'));
    notesCard.appendChild(notesTA2);
    notesCard.appendChild(el('label', { style:'font-size:11px;color:var(--muted)' }, 'Plan correction'));
    notesCard.appendChild(corrTA);
    wrap.appendChild(notesCard);

    return wrap;
  }

  /* ═══════════════════════════════════════════
     V4 : TASK HISTORY (Stats tab)
  ═══════════════════════════════════════════ */
  function renderTaskHistory(days) {
    var nDays = days || 10;
    var wrap = el('div', { class:'card task-history-card' });

    var head = el('div', { class:'card-head' });
    head.innerHTML = '<div class="card-title">📊 Historique</div>';
    var toggleRow = el('div', { style:'display:flex;gap:6px' });
    [10, 30].forEach(function (n) {
      var tb = el('button', { class:'cert-track-btn' + (nDays === n ? ' active' : ''), type:'button' }, n + 'j');
      tb.addEventListener('click', function () {
        var hw = qs('.task-history-card');
        if (hw && hw.parentElement) hw.parentElement.replaceChild(renderTaskHistory(n), hw);
      });
      toggleRow.appendChild(tb);
    });
    head.appendChild(toggleRow);
    wrap.appendChild(head);

    var days2 = Math.min(nDays, 30);
    var domainTotals2 = {};
    var domainCounts = {};
    var bestDay = null, worstDay = null, bestPct = -1, worstPct = 101;
    var dayRows = el('div', { class:'task-history-rows' });

    for (var i = days2 - 1; i >= 0; i--) {
      var dd3 = new Date(); dd3.setDate(dd3.getDate() - i);
      var dk3 = dd3.getFullYear() + '-' + String(dd3.getMonth()+1).padStart(2,'0') + '-' + String(dd3.getDate()).padStart(2,'0');
      var checks3 = Store.getRoutineChecks(dk3);
      var dp3 = Store.getDailyPractice(dk3);
      var rotation3 = D.todayRotation ? D.todayRotation() : { tasks:[] };
      var total3 = (window.D && D.DAILY_PRACTICE ? D.DAILY_PRACTICE.length : 0) + rotation3.tasks.length;
      var done3 = Object.values(checks3).filter(Boolean).length +
        (window.D && D.DAILY_PRACTICE ? D.DAILY_PRACTICE.filter(function(dp){ return dp3[dp.id]; }).length : 0);
      var p3 = total3 > 0 ? Math.round(done3 / total3 * 100) : 0;
      if (p3 > bestPct) { bestPct = p3; bestDay = dk3; }
      if (p3 < worstPct) { worstPct = p3; worstDay = dk3; }

      /* Track domain sessions that day */
      var sessions3 = Store.getFocusSessions().filter(function(s){ return s.date === dk3; });
      sessions3.forEach(function(s) {
        domainTotals2[s.domain] = (domainTotals2[s.domain] || 0) + Math.round(s.seconds/60);
        domainCounts[s.domain] = (domainCounts[s.domain] || 0) + 1;
      });

      var dayName = ['D','L','M','Me','J','V','S'][dd3.getDay()];
      var dotColor = p3 >= 80 ? 'var(--green)' : p3 >= 50 ? 'var(--amber2)' : p3 > 0 ? 'var(--violet3)' : 'var(--dim)';
      var row = el('div', { class:'task-history-row' });
      row.innerHTML =
        '<span class="task-hist-day">' + dayName + ' ' + dk3.slice(5) + '</span>' +
        '<div class="progress-bar" style="flex:1;height:8px"><div class="progress-fill" style="width:' + p3 + '%;background:' + dotColor + '"></div></div>' +
        '<span class="task-hist-pct" style="color:' + dotColor + '">' + p3 + '%</span>';
      dayRows.appendChild(row);
    }
    wrap.appendChild(dayRows);

    /* Summary */
    var sumEl = el('div', { class:'task-history-summary' });
    if (bestDay) sumEl.appendChild(el('div', { class:'text-xs text-muted', style:'margin-bottom:4px' }, '🏆 Meilleur: ' + bestDay + ' (' + bestPct + '%)'));
    if (worstDay) sumEl.appendChild(el('div', { class:'text-xs text-muted', style:'margin-bottom:8px' }, '📉 Pire: ' + worstDay + ' (' + worstPct + '%)'));

    /* Domain bars */
    var domSorted2 = Object.keys(domainTotals2).sort(function(a,b){ return domainTotals2[b]-domainTotals2[a]; });
    var maxDom = Math.max.apply(null, Object.values(domainTotals2).concat([1]));
    if (domSorted2.length) {
      sumEl.appendChild(el('div', { class:'cert-section-title', style:'margin:8px 0 6px' }, 'Par domaine'));
      domSorted2.forEach(function (d) {
        var v = domainTotals2[d];
        var p4 = pct(v, maxDom);
        var dRow = el('div', { style:'margin-bottom:6px' });
        dRow.innerHTML =
          '<div class="flex justify-between text-xs text-muted" style="margin-bottom:3px">' +
            '<span>' + d + '</span><span>' + v + ' min</span>' +
          '</div>' +
          '<div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:' + p4 + '%"></div></div>';
        sumEl.appendChild(dRow);
      });
    }
    wrap.appendChild(sumEl);
    return wrap;
  }

  /* ═══════════════════════════════════════════
     V4 : WEEKLY REVIEW (Stats tab)
  ═══════════════════════════════════════════ */
  function renderWeeklyReview() {
    var wrap = el('div', { class:'card weekly-review-card' });
    var isoWeek = Store.currentIsoWeek();
    var review = Store.getWeeklyReview(isoWeek) || {};

    var head = el('div', { class:'card-head' });
    head.innerHTML = '<div class="card-title">📝 Revue hebdo <span style="font-size:10px;color:var(--muted);font-weight:600">' + isoWeek + '</span></div>';

    /* Export button */
    var exportBtn = el('button', { class:'btn btn-secondary btn-sm', type:'button' }, '📤 Export MD');
    exportBtn.addEventListener('click', function () {
      var md = '# Revue hebdomadaire — ' + isoWeek + '\n\n' +
        '## Victoires\n' + (review.victories || '') + '\n\n' +
        '## Échecs\n' + (review.failures || '') + '\n\n' +
        '## Causes\n' + (review.causes || '') + '\n\n' +
        '## Corrections\n' + (review.corrections || '') + '\n\n' +
        '## 3 Non-négociables semaine prochaine\n' + (review.nonNegotiables || '') + '\n';
      var blob = new Blob([md], { type:'text/markdown' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'revue-' + isoWeek + '.md'; a.click();
      URL.revokeObjectURL(url);
      toast('Export MD ✓');
    });
    head.appendChild(exportBtn);
    wrap.appendChild(head);

    /* Auto-summary */
    var today3 = Store.today();
    var sessions7 = Store.getFocusSessions().filter(function(s) {
      var d = new Date(s.date); var now = new Date();
      return (now - d) < 7 * 86400000;
    });
    var focusTotal = Math.round(sessions7.reduce(function(a,s){return a+s.seconds;},0)/60);
    var vinted2 = Store.getVintedV2();
    var vintedSales = (vinted2.items||[]).filter(function(it){
      return it.status === 'sold' && it.updatedAt && ((new Date() - new Date(it.updatedAt)) < 7*86400000);
    }).length;

    var autoSummary = el('div', { class:'card card-l-blue', style:'margin-bottom:12px' });
    autoSummary.innerHTML =
      '<div class="card-head" style="margin-bottom:8px"><div class="card-title" style="font-size:11px">📊 Auto-résumé semaine</div></div>' +
      '<div class="cert-stats-bar">' +
        '<div class="cert-stat"><div class="cert-stat-val">' + focusTotal + '</div><div class="cert-stat-lbl">Min focus</div></div>' +
        '<div class="cert-stat"><div class="cert-stat-val" style="color:var(--green)">' + vintedSales + '</div><div class="cert-stat-lbl">Ventes Vinted</div></div>' +
      '</div>';
    wrap.appendChild(autoSummary);

    /* Guided questions */
    var questions = [
      { key:'victories', label:'🏆 Victoires de la semaine' },
      { key:'failures', label:'❌ Échecs / ratés' },
      { key:'causes', label:'🔍 Causes identifiées' },
      { key:'corrections', label:'🛠 Corrections à apporter' },
      { key:'nonNegotiables', label:'🎯 3 non-négociables semaine prochaine' }
    ];
    questions.forEach(function (q) {
      var qWrap = el('div', { class:'log-field', style:'margin-bottom:10px' });
      qWrap.appendChild(el('label', {}, q.label));
      var ta = el('textarea', { placeholder:'...', style:'height:70px;resize:vertical' });
      ta.value = review[q.key] || '';
      ta.addEventListener('change', function () {
        review[q.key] = ta.value;
        Store.setWeeklyReview(isoWeek, review);
      });
      qWrap.appendChild(ta);
      wrap.appendChild(qWrap);
    });

    /* Previous reviews */
    var prevTitle = el('div', { class:'cert-section-title', style:'margin-top:16px' }, '🗓 Revues précédentes');
    wrap.appendChild(prevTitle);
    for (var pw = 1; pw <= 4; pw++) {
      (function (wOffset) {
        var d4 = new Date(); d4.setDate(d4.getDate() - wOffset * 7);
        d4.setHours(0,0,0,0);
        d4.setDate(d4.getDate() + 3 - ((d4.getDay() + 6) % 7));
        var week1b = new Date(d4.getFullYear(), 0, 4);
        var weekNum2 = 1 + Math.round(((d4.getTime() - week1b.getTime()) / 86400000 - 3 + (week1b.getDay() + 6) % 7) / 7);
        var prevIso = d4.getFullYear() + '-W' + String(weekNum2).padStart(2,'0');
        var prevRev = Store.getWeeklyReview(prevIso);
        if (!prevRev) return;
        var prevCard = el('div', { class:'card card-sm', style:'margin-bottom:8px' });
        var prevHead = el('div', { class:'cert-section-title', style:'cursor:pointer;margin:0' }, prevIso + ' ▾');
        var prevBody = el('div', { style:'display:none;margin-top:8px;font-size:11px;color:var(--muted)' });
        prevBody.innerHTML = '<b>Victoires:</b> ' + (prevRev.victories || '—') + '<br>' +
          '<b>Non-négociables:</b> ' + (prevRev.nonNegotiables || '—');
        prevHead.addEventListener('click', function () {
          var open = prevBody.style.display !== 'none';
          prevBody.style.display = open ? 'none' : 'block';
          prevHead.textContent = prevIso + ' ' + (open ? '▾' : '▴');
        });
        prevCard.appendChild(prevHead);
        prevCard.appendChild(prevBody);
        wrap.appendChild(prevCard);
      })(pw);
    }

    return wrap;
  }

  /* ═══════════════════════════════════════════
     V4 : PERFORMANCE TREND (Stats tab)
  ═══════════════════════════════════════════ */
  function renderPerformanceTrend() {
    var data7 = Store.getPerformanceRange(7);
    var hasData = data7.some(function(d){ return d.data !== null; });
    if (!hasData) return null;

    var card = el('div', { class:'card', style:'margin-bottom:12px' });
    card.innerHTML = '<div class="card-head"><div class="card-title">📈 Performance 7j</div></div>';

    var chartWrap = el('div', { class:'perf-trend-chart' });
    data7.forEach(function (d) {
      var perf2 = d.data || {};
      var energy = parseInt(perf2.energy)||0;
      var sleep = Math.min(10, parseFloat(perf2.sleepHours)||0);
      var dayLbl = ['D','L','M','Me','J','V','S'][new Date(d.date + 'T12:00:00').getDay()];

      var col = el('div', { class:'perf-trend-col' });
      var energyDot = el('div', { class:'perf-trend-dot', style:'background:var(--amber2);height:' + (energy * 20) + 'px;opacity:' + (energy > 0 ? 1 : 0.2) });
      var sleepDot = el('div', { class:'perf-trend-dot', style:'background:var(--cyan);height:' + (sleep * 10) + 'px;opacity:' + (sleep > 0 ? 1 : 0.2) });
      col.appendChild(el('div', { class:'perf-trend-bars', style:'display:flex;gap:2px;align-items:flex-end;height:100px' },
        energyDot, sleepDot));
      col.appendChild(el('div', { class:'perf-trend-lbl' }, dayLbl));
      chartWrap.appendChild(col);
    });
    card.appendChild(chartWrap);
    card.innerHTML += '<div style="display:flex;gap:12px;margin-top:6px;font-size:10px;color:var(--muted)">' +
      '<span><span style="background:var(--amber2);width:8px;height:8px;border-radius:50%;display:inline-block"></span> Énergie</span>' +
      '<span><span style="background:var(--cyan);width:8px;height:8px;border-radius:50%;display:inline-block"></span> Sommeil</span>' +
    '</div>';
    return card;
  }

  /* ═══════════════════════════════════════════
     V4 : DAY TEMPLATES (Routine tab)
  ═══════════════════════════════════════════ */
  function renderDayTemplateSelector(today) {
    var wrap = el('div', { class:'card card-l-orange day-template-card' });
    var head = el('div', { class:'card-head' });
    head.innerHTML = '<div class="card-title">📅 Template du jour</div>';
    wrap.appendChild(head);

    var currentTemplate = Store.getDayTemplate(today);
    var selected = currentTemplate ? currentTemplate.template : null;

    var templates = [
      { id:'travail-matin', label:'☀️ Travail matin' },
      { id:'travail-aprem', label:'🌤 Travail aprem' },
      { id:'travail-soir',  label:'🌙 Travail soir' },
      { id:'repos',         label:'😴 Repos' },
      { id:'weekend-enfants', label:'👨‍👩‍👧 Weekend enfants' },
      { id:'malade',        label:'🤒 Malade' },
      { id:'examen',        label:'📝 Examen' },
      { id:'full-etude',    label:'📚 Full étude' },
      { id:'famille',       label:'👪 Famille' }
    ];

    var pills = el('div', { class:'day-template-pills' });
    templates.forEach(function (t) {
      var pill = el('button', { class:'day-template-pill' + (selected === t.id ? ' active' : ''), type:'button' }, t.label);
      pill.addEventListener('click', function () {
        Store.setDayTemplate(today, t.id, '');
        qsa('.day-template-pill', pills).forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        toast('Template : ' + t.label + ' ✓');
      });
      pills.appendChild(pill);
    });
    wrap.appendChild(pills);

    if (currentTemplate && currentTemplate.template) {
      wrap.appendChild(el('div', { class:'text-muted text-xs', style:'margin-top:8px' }, 'Défini à ' + (currentTemplate.setAt ? currentTemplate.setAt.slice(11,16) : '')));
    }

    return wrap;
  }

  /* ═══════════════════════════════════════════
     V4 : COMMAND PALETTE (Global)
  ═══════════════════════════════════════════ */
  function initCommandPalette() {
    var palette = document.getElementById('cmd-palette');
    var input = document.getElementById('cmd-input');
    var results = document.getElementById('cmd-results');
    if (!palette || !input || !results) return;

    var allCommands = [
      { label:'Aujourd\'hui', icon:'🏠', action:function(){ Router.navigate('aujourdhui'); } },
      { label:'Routine', icon:'⚡', action:function(){ Router.navigate('routine'); } },
      { label:'Étude', icon:'📚', action:function(){ Router.navigate('etude'); } },
      { label:'Argent', icon:'💰', action:function(){ Router.navigate('argent'); } },
      { label:'Stats', icon:'📊', action:function(){ Router.navigate('stats'); } },
      { label:'Sport', icon:'💪', action:function(){ Router.navigate('sport'); } },
      { label:'Loisir', icon:'🎮', action:function(){ Router.navigate('loisir'); } },
      { label:'Réglages', icon:'⚙️', action:function(){ Router.navigate('reglages'); } },
      { label:'Ajouter preuve', icon:'➕', action:function(){ Router.navigate('etude'); setTimeout(function(){ var btn = document.querySelector('.proofs-panel .btn-primary'); if(btn) btn.click(); },300); } },
      { label:'Ajouter article Vinted', icon:'🛍', action:function(){ Router.navigate('argent'); setTimeout(function(){ var btn = document.querySelector('.vinted-v2-panel .btn-primary'); if(btn) btn.click(); },300); } },
      { label:'Démarrer focus', icon:'⏱', action:function(){ Router.navigate('aujourdhui'); } },
      { label:'Export données', icon:'💾', action:function(){ Router.navigate('reglages'); setTimeout(function(){ var items=document.querySelectorAll('.settings-item'); if(items[0]) items[0].querySelector('button').click(); },300); } },
      { label:'Certifications', icon:'📜', action:function(){ Router.navigate('etude'); } }
    ];

    var selectedIndex = 0;

    function open() {
      palette.style.display = 'flex';
      input.value = '';
      input.focus();
      renderResults('');
    }

    function close() {
      palette.style.display = 'none';
    }

    function renderResults(query) {
      var q = (query || '').toLowerCase().trim();
      var filtered = q ? allCommands.filter(function(c){ return c.label.toLowerCase().indexOf(q) >= 0; }) : allCommands;
      results.innerHTML = '';
      selectedIndex = 0;
      filtered.forEach(function (c, i) {
        var item = el('div', { class:'cmd-result-item' + (i === 0 ? ' selected' : ''), 'data-idx': String(i) });
        item.innerHTML = '<span class="cmd-result-icon">' + c.icon + '</span><span>' + c.label + '</span>';
        item.addEventListener('click', function () {
          close();
          c.action();
        });
        item.addEventListener('mouseenter', function () {
          qsa('.cmd-result-item', results).forEach(function(x){ x.classList.remove('selected'); });
          item.classList.add('selected');
          selectedIndex = i;
        });
        results.appendChild(item);
      });
      return filtered;
    }

    var lastFiltered = allCommands;
    input.addEventListener('input', function () {
      lastFiltered = renderResults(input.value);
    });

    input.addEventListener('keydown', function (e) {
      var items = qsa('.cmd-result-item', results);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (lastFiltered[selectedIndex]) { close(); lastFiltered[selectedIndex].action(); }
      } else if (e.key === 'Escape') {
        close();
      }
      items.forEach(function(x, i){ x.classList.toggle('selected', i === selectedIndex); });
    });

    /* Keyboard shortcut Ctrl+K */
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); if (palette.style.display === 'none') open(); else close(); }
    });

    /* Click overlay to close */
    palette.addEventListener('click', function (e) { if (e.target === palette) close(); });

    /* Mobile button */
    var mobileBtn = el('button', { id:'cmd-mobile-btn', class:'cmd-mobile-btn', type:'button', title:'Palette de commandes (Ctrl+K)' }, '⌘');
    mobileBtn.addEventListener('click', open);
    document.body.appendChild(mobileBtn);
  }

  /* ═══════════════════════════════════════════
     V4 : BOTTOM NAV (Mobile)
  ═══════════════════════════════════════════ */
  function initBottomNav() {
    var nav = document.getElementById('bottom-nav');
    var drawer = document.getElementById('bnav-drawer');
    if (!nav) return;

    qsa('.bnav-item[data-tab]', nav).forEach(function (item) {
      item.addEventListener('click', function () {
        Router.navigate(item.dataset.tab);
      });
    });

    var moreBtn = document.getElementById('bnav-more');
    if (moreBtn && drawer) {
      moreBtn.addEventListener('click', function () {
        drawer.style.display = drawer.style.display === 'none' ? 'flex' : 'none';
      });
      qsa('.bnav-drawer-item', drawer).forEach(function (item) {
        item.addEventListener('click', function () {
          drawer.style.display = 'none';
          Router.navigate(item.dataset.tab);
        });
      });
      var drawerOverlay = drawer.querySelector('.bnav-drawer-overlay');
      if (drawerOverlay) drawerOverlay.addEventListener('click', function () { drawer.style.display = 'none'; });
    }

    /* Update active state on navigation */
    Router.onNavigate(function (tabId) {
      qsa('.bnav-item', nav).forEach(function (item) {
        item.classList.toggle('active', item.dataset.tab === tabId);
      });
    });
  }

  /* ═══════════════════════════════════════════
     V4 : UPDATED PAGE RENDERERS
  ═══════════════════════════════════════════ */
  /* Override renderAujourdhui to add v4 features at top */
  var _origRenderAujourdhui = renderAujourdhui;
  function renderAujourdhui() {
    _origRenderAujourdhui();
    var page = qs('#page-aujourdhui');
    if (!page) return;
    var today = Store.today();

    /* Prepend mission now + briefing + performance log to top (after hero) */
    var hero = page.querySelector('.hero-card');
    var insertAfter = hero || page.firstChild;

    var missionCard = renderMissionNow(today);
    var briefingCard = renderDailyBriefing(today);
    var perfCard = renderPerformanceLog(today);

    /* Insert after hero card */
    if (insertAfter && insertAfter.nextSibling) {
      page.insertBefore(perfCard, insertAfter.nextSibling);
      page.insertBefore(briefingCard, insertAfter.nextSibling);
      page.insertBefore(missionCard, insertAfter.nextSibling);
    } else {
      page.appendChild(missionCard);
      page.appendChild(briefingCard);
      page.appendChild(perfCard);
    }
  }

  /* Override renderRoutine to add day template selector at top */
  var _origRenderRoutine = renderRoutine;
  function renderRoutine() {
    _origRenderRoutine();
    var page = qs('#page-routine');
    if (!page) return;
    var today = Store.today();
    var templateCard = renderDayTemplateSelector(today);
    if (page.firstChild) {
      page.insertBefore(templateCard, page.firstChild);
    } else {
      page.appendChild(templateCard);
    }
  }

  /* Override renderEtude to add certifications + proofs sub-panels */
  var _origRenderEtude = renderEtude;
  function renderEtude() {
    _origRenderEtude();
    var page = qs('#page-etude');
    if (!page) return;

    /* Add sub-panel toggle buttons at top */
    var btnRow = el('div', { class:'etude-sub-panel-row' });
    var certsBtn = el('button', { class:'cert-track-btn', type:'button' }, '📜 Certifications');
    var proofsBtn = el('button', { class:'cert-track-btn', type:'button' }, '📋 Preuves');
    btnRow.appendChild(certsBtn);
    btnRow.appendChild(proofsBtn);
    if (page.firstChild) {
      page.insertBefore(btnRow, page.firstChild);
    } else {
      page.appendChild(btnRow);
    }

    /* Panel containers */
    var certsContainer = el('div', { id:'etude-certs-panel', style:'display:none' });
    var proofsContainer = el('div', { id:'etude-proofs-panel', style:'display:none' });
    page.insertBefore(certsContainer, btnRow.nextSibling);
    page.insertBefore(proofsContainer, certsContainer.nextSibling);

    certsBtn.addEventListener('click', function () {
      var isOpen = certsContainer.style.display !== 'none';
      certsContainer.style.display = isOpen ? 'none' : 'block';
      proofsContainer.style.display = 'none';
      if (!isOpen && !certsContainer.children.length) {
        certsContainer.appendChild(renderCertifications());
      }
      certsBtn.classList.toggle('active', !isOpen);
      proofsBtn.classList.remove('active');
    });

    proofsBtn.addEventListener('click', function () {
      var isOpen = proofsContainer.style.display !== 'none';
      proofsContainer.style.display = isOpen ? 'none' : 'block';
      certsContainer.style.display = 'none';
      if (!isOpen && !proofsContainer.children.length) {
        proofsContainer.appendChild(renderProofs());
      }
      proofsBtn.classList.toggle('active', !isOpen);
      certsBtn.classList.remove('active');
    });

    /* Auto-open proofs if exist */
    var proofs = Store.getProofs();
    if (proofs && proofs.length) {
      proofsContainer.style.display = 'block';
      proofsContainer.appendChild(renderProofs());
      proofsBtn.classList.add('active');
    }
  }

  /* Override renderArgent to add Vinted v2 + cashflow panels */
  var _origRenderArgent = renderArgent;
  function renderArgent() {
    _origRenderArgent();
    var page = qs('#page-argent');
    if (!page) return;

    var innerTabs = page.querySelector('.inner-tabs');
    if (!innerTabs) return;

    /* Add Vinted v2 tab */
    var vTab = el('div', { class:'inner-tab', 'data-itab':'vinted_v2' }, '🛍 Vinted+');
    var cfTab = el('div', { class:'inner-tab', 'data-itab':'cashflow' }, '💰 Cashflow');
    innerTabs.appendChild(vTab);
    innerTabs.appendChild(cfTab);

    var vPanel = el('div', { class:'inner-panel', id:'argent-panel-vinted_v2' });
    var cfPanel = el('div', { class:'inner-panel', id:'argent-panel-cashflow' });
    page.appendChild(vPanel);
    page.appendChild(cfPanel);

    var allArgentTabs = qsa('.inner-tab', innerTabs);
    var allArgentPanels = page.querySelectorAll('.inner-panel');

    function activateArgentTab(tabId) {
      allArgentTabs.forEach(function(t){ t.classList.toggle('active', t.dataset.itab === tabId); });
      allArgentPanels.forEach(function(p){ p.classList.toggle('active', p.id === 'argent-panel-' + tabId); });
    }

    vTab.addEventListener('click', function () {
      activateArgentTab('vinted_v2');
      if (!vPanel.children.length) vPanel.appendChild(renderVintedV2());
    });
    cfTab.addEventListener('click', function () {
      activateArgentTab('cashflow');
      if (!cfPanel.children.length) cfPanel.appendChild(renderFinanceCommand(Store.currentMonth()));
    });
  }

  /* Override renderStats to add task history + weekly review + perf trend */
  var _origRenderStats = renderStats;
  function renderStats() {
    _origRenderStats();
    var page = qs('#page-stats');
    if (!page) return;

    /* Add performance trend */
    var trend = renderPerformanceTrend();
    if (trend) page.appendChild(trend);

    /* Add task history */
    page.appendChild(renderTaskHistory(10));

    /* Add weekly review */
    page.appendChild(renderWeeklyReview());
  }

  /* ═══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */
  function init() {
    initHeader();
    Store.migrateVintedToV2();
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

    initBottomNav();
    initCommandPalette();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
