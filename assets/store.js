/* store.js — localStorage with prefix dashv3_ */
'use strict';

window.Store = (function () {
  var PFX = 'dashv3_';

  function key(k) { return PFX + k; }

  function get(k, def) {
    try {
      var raw = localStorage.getItem(key(k));
      if (raw === null) return def !== undefined ? def : null;
      return JSON.parse(raw);
    } catch (e) { return def !== undefined ? def : null; }
  }

  function set(k, v) {
    try { localStorage.setItem(key(k), JSON.stringify(v)); return true; }
    catch (e) { return false; }
  }

  function remove(k) {
    try { localStorage.removeItem(key(k)); } catch (e) {}
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function currentMonth() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
  }

  /* --- Bookmarks --- */
  function getBookmarks() { return get('bookmarks', {}); }

  function setBookmark(id, data) {
    var bm = getBookmarks();
    bm[id] = Object.assign({}, bm[id] || {}, data, { updatedAt: new Date().toISOString() });
    set('bookmarks', bm);
  }

  /* --- Daily log --- */
  function getLog(date) { return get('log_' + (date || today()), {}); }

  function setLog(date, data) {
    var existing = getLog(date);
    set('log_' + (date || today()), Object.assign({}, existing, data));
  }

  /* --- Priorities --- */
  function getPriorities(date) { return get('prio_' + (date || today()), []); }

  function setPriorities(date, list) { set('prio_' + (date || today()), list); }

  function addPriority(text, level, category) {
    var list = getPriorities();
    list.push({ id: Date.now(), text: text, level: level || 'B', category: category || 'Autre', done: false });
    setPriorities(null, list);
    return list;
  }

  function togglePriority(id) {
    var list = getPriorities();
    list = list.map(function (p) {
      return p.id === id ? Object.assign({}, p, { done: !p.done }) : p;
    });
    setPriorities(null, list);
    return list;
  }

  function deletePriority(id) {
    var list = getPriorities().filter(function (p) { return p.id !== id; });
    setPriorities(null, list);
    return list;
  }

  /* --- Focus sessions --- */
  function getFocusSessions() { return get('focus_sessions', []); }

  function addFocusSession(domain, seconds) {
    var sessions = getFocusSessions();
    sessions.push({ domain: domain, seconds: seconds, date: today(), ts: Date.now() });
    if (sessions.length > 500) sessions = sessions.slice(-500);
    set('focus_sessions', sessions);
  }

  function todayFocusMinutes() {
    var td = today();
    return getFocusSessions()
      .filter(function (s) { return s.date === td; })
      .reduce(function (acc, s) { return acc + Math.round(s.seconds / 60); }, 0);
  }

  /* --- Routine checks --- */
  function getRoutineChecks(date) { return get('routine_' + (date || today()), {}); }

  function toggleRoutineCheck(taskIdx, date) {
    var checks = getRoutineChecks(date);
    checks[taskIdx] = !checks[taskIdx];
    set('routine_' + (date || today()), checks);
    return checks;
  }

  function setRoutineCheck(taskIdx, value, date) {
    var checks = getRoutineChecks(date);
    checks[taskIdx] = value;
    set('routine_' + (date || today()), checks);
    return checks;
  }

  /* --- Routine notes (expand) --- stored as routine_note_DATEINDEX e.g. "2026-01-01_2" --- */
  function getRoutineNote(dateIndex) { return get('routine_note_' + dateIndex, ''); }

  function setRoutineNote(dateIndex, text) { set('routine_note_' + dateIndex, text); }

  /* --- Sport --- */
  function getSportLog(date) { return get('sport_' + (date || today()), {}); }

  function setSportLog(date, data) {
    var existing = getSportLog(date);
    set('sport_' + (date || today()), Object.assign({}, existing, data));
  }

  function getSportOff(date) { return get('sport_off_' + (date || today()), false); }

  function setSportOff(date, val) { set('sport_off_' + (date || today()), val); }

  /* Mark sport done today — also marks routine sport block as completed */
  function markSportDone(date) {
    var d = date || today();
    setSportLog(d, { sessionDone: true, sessionTs: Date.now() });
    /* Sync log field */
    setLog(d, { sport: '✓ Fait' });
    /* Find sport block index in today's rotation and mark it */
    if (window.D) {
      var rotation = D.todayRotation ? D.todayRotation() : { tasks: [] };
      rotation.tasks.forEach(function (task, idx) {
        var lower = task.toLowerCase();
        if (lower.indexOf('sport') >= 0 || lower.indexOf('push') >= 0 ||
            lower.indexOf('pull') >= 0 || lower.indexOf('legs') >= 0 ||
            lower.indexOf('full body') >= 0 || lower.indexOf('souplesse') >= 0 ||
            lower.indexOf('mobilité') >= 0 || lower.indexOf('core') >= 0) {
          setRoutineCheck(idx, true, d);
        }
      });
    }
  }

  /* --- Chess --- */
  function getChess() { return get('chess', { elo: 1200, goal: 1400, games: [] }); }

  function setChess(data) {
    var existing = getChess();
    set('chess', Object.assign({}, existing, data));
  }

  function addChessGame(eloAfter, result, note) {
    var c = getChess();
    var prev = c.elo || 1200;
    c.games = c.games || [];
    c.games.push({ date: today(), elo: eloAfter, prev: prev, result: result, note: note || '', ts: Date.now() });
    if (c.games.length > 200) c.games = c.games.slice(-200);
    c.elo = eloAfter;
    set('chess', c);
  }

  /* --- Study progress (enhanced) --- */
  function getStudy(matiere) {
    return get('study_' + matiere, {
      resource: '', position: 0, total: 0, unit: 'pages', notes: '', next: ''
    });
  }

  function setStudy(matiere, data) {
    var existing = getStudy(matiere);
    set('study_' + matiere, Object.assign({}, existing, data));
  }

  function logStudyProgress(matiere, addAmount) {
    var s = getStudy(matiere);
    var pos = (parseInt(s.position, 10) || 0) + (parseInt(addAmount, 10) || 0);
    if (s.total && pos > parseInt(s.total, 10)) pos = parseInt(s.total, 10);
    setStudy(matiere, { position: pos });
    return pos;
  }

  /* Mark a study-related routine block as done when logging from routine */
  function logStudyFromRoutine(matiere, addAmount, taskIdx, date) {
    var newPos = logStudyProgress(matiere, addAmount);
    if (taskIdx !== undefined && taskIdx !== null) {
      setRoutineCheck(taskIdx, true, date || today());
    }
    return newPos;
  }

  /* --- Finance (monthly budget) --- */
  function getFinanceMonth(month) {
    return get('finance_' + (month || currentMonth()), {
      budget: 0, salary: 0, savings_goal: 0, savings_current: 0,
      charges: [], debts: []
    });
  }

  function setFinanceMonth(month, data) {
    var existing = getFinanceMonth(month);
    set('finance_' + (month || currentMonth()), Object.assign({}, existing, data));
  }

  /* Legacy finance accessor for backward compat */
  function getFinance() { return getFinanceMonth(currentMonth()); }
  function setFinance(data) { setFinanceMonth(currentMonth(), data); }

  /* List of months that have finance data */
  function getFinanceMonths() {
    var months = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PFX + 'finance_') === 0) {
          var m = k.slice((PFX + 'finance_').length);
          if (/^\d{4}-\d{2}$/.test(m)) months.push(m);
        }
      }
    } catch(e) {}
    /* Always include current month */
    var cm = currentMonth();
    if (months.indexOf(cm) < 0) months.push(cm);
    months.sort();
    return months;
  }

  /* --- Vinted --- */
  function getVinted() {
    return get('vinted', { items: [], totalInvested: 0 });
  }

  function setVinted(data) {
    var existing = getVinted();
    set('vinted', Object.assign({}, existing, data));
  }

  function addVintedItem(item) {
    var v = getVinted();
    v.items = v.items || [];
    v.items.push(Object.assign({ id: Date.now(), status: 'En vente' }, item));
    v.totalInvested = (v.totalInvested || 0) + (parseFloat(item.buyPrice) || 0);
    set('vinted', v);
  }

  function updateVintedItem(id, updates) {
    var v = getVinted();
    v.items = (v.items || []).map(function (item) {
      if (item.id !== id) return item;
      return Object.assign({}, item, updates);
    });
    set('vinted', v);
  }

  function deleteVintedItem(id) {
    var v = getVinted();
    var item = (v.items || []).find(function (i) { return i.id === id; });
    if (item) {
      v.totalInvested = Math.max(0, (v.totalInvested || 0) - (parseFloat(item.buyPrice) || 0));
    }
    v.items = (v.items || []).filter(function (i) { return i.id !== id; });
    set('vinted', v);
  }

  function getVintedStats() {
    var v = getVinted();
    var items = v.items || [];
    var totalGained = items
      .filter(function (i) { return i.status === 'Vendu'; })
      .reduce(function (acc, i) { return acc + (parseFloat(i.sellPrice) || 0); }, 0);
    var totalInvested = v.totalInvested || 0;
    return { totalGained: totalGained, totalInvested: totalInvested, profit: totalGained - totalInvested };
  }

  /* --- Books (Lecture) --- */
  function getBooks() { return get('books', {}); }

  function getBook(id) {
    var books = getBooks();
    return books[id] || { status: 'non_commence', position: 0, total: 0 };
  }

  function setBook(id, data) {
    var books = getBooks();
    books[id] = Object.assign({}, books[id] || {}, data);
    set('books', books);
  }

  function logBookPages(id, addPages) {
    var b = getBook(id);
    var pos = (parseInt(b.position, 10) || 0) + (parseInt(addPages, 10) || 0);
    var total = parseInt(b.total, 10) || 0;
    if (total && pos >= total) { pos = total; setBook(id, { position: pos, status: 'termine' }); }
    else setBook(id, { position: pos });
    return pos;
  }

  /* --- Scoring --- */
  function getDayScore(date) {
    return get('score_' + (date || today()), {
      pts: 0,
      routineBlocks: 0,
      focusSessions: 0,
      sportDone: false,
      logFilled: false,
      fullRotation: false
    });
  }

  function setDayScore(date, data) {
    var existing = getDayScore(date);
    set('score_' + (date || today()), Object.assign({}, existing, data));
  }

  function computeDayScore(date) {
    var d = date || today();
    var checks = getRoutineChecks(d);
    var sportOff = getSportOff(d);
    var log = getLog(d);
    var sessions = getFocusSessions().filter(function (s) { return s.date === d; });

    var pts = 0;

    /* Routine blocks */
    var doneBlocks = Object.values(checks).filter(Boolean).length;
    pts += doneBlocks * 15;

    /* Focus sessions */
    sessions.forEach(function (s) {
      var min = s.seconds / 60;
      if (min >= 50) pts += 50;
      else if (min >= 25) pts += 25;
    });

    /* Sport */
    var sportDone = (log.sport === '✓ Fait') || sportOff ||
      (getSportLog(d).sessionDone === true);
    if (sportDone) pts += 50;

    /* Log filled (>=5 non-empty fields) */
    var filledFields = Object.values(log).filter(function (v) {
      return v !== '' && v !== null && v !== undefined && v !== 0;
    }).length;
    var logFilled = filledFields >= 5;
    if (logFilled) pts += 20;

    /* Full rotation bonus */
    var rotation = (window.D && window.D.todayRotation) ? D.todayRotation() : { tasks: [] };
    var fullRotation = rotation.tasks.length > 0 && doneBlocks >= rotation.tasks.length;
    if (fullRotation) pts += 50;

    /* Streak multiplier */
    var streaks = getStreaks();
    var maxStreak = 0;
    Object.values(streaks).forEach(function (s) { if ((s.count || 0) > maxStreak) maxStreak = s.count; });
    var mult = 1.0;
    if (maxStreak >= 30) mult = 2.0;
    else if (maxStreak >= 7) mult = 1.5;
    else mult = 1.0 + (maxStreak / 7) * 0.5;
    mult = Math.min(2.0, mult);

    var finalPts = Math.round(pts * mult);

    setDayScore(d, {
      pts: finalPts,
      rawPts: pts,
      mult: mult,
      routineBlocks: doneBlocks,
      sportDone: sportDone,
      logFilled: logFilled,
      fullRotation: fullRotation
    });

    return finalPts;
  }

  function getScoreTier(pts) {
    if (pts >= 200) return { label: 'LÉGENDE',   color: 'tier-legend',    next: null,        nextPts: 0,   prevPts: 200 };
    if (pts >= 150) return { label: 'CHAMPION',   color: 'tier-champion',  next: 'LÉGENDE',   nextPts: 200, prevPts: 150 };
    if (pts >= 100) return { label: 'CONTENDER',  color: 'tier-contender', next: 'CHAMPION',  nextPts: 150, prevPts: 100 };
    if (pts >= 50)  return { label: 'CHALLENGER', color: 'tier-challenger',next: 'CONTENDER', nextPts: 100, prevPts: 50  };
    return             { label: 'SPARRING',    color: 'tier-sparring',  next: 'CHALLENGER',nextPts: 50,  prevPts: 0   };
  }

  /* --- Streaks --- */
  function getStreaks() { return get('streaks', {}); }

  function updateStreak(domain) {
    var streaks = getStreaks();
    var s = streaks[domain] || { count: 0, lastDate: null };
    var td = today();
    if (s.lastDate === td) return streaks;
    var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    var yd = yesterday.getFullYear() + '-' + String(yesterday.getMonth()+1).padStart(2,'0') + '-' + String(yesterday.getDate()).padStart(2,'0');
    if (s.lastDate === yd) {
      s.count += 1;
    } else {
      s.count = 1;
    }
    s.lastDate = td;
    streaks[domain] = s;
    set('streaks', streaks);
    return streaks;
  }

  /* --- Objectives (monthly) --- */
  function getObjectives() { return get('objectives', []); }
  function setObjectives(list) { set('objectives', list); }

  /* --- Export / Import --- */
  function exportAll() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PFX) === 0) {
          try { out[k.slice(PFX.length)] = JSON.parse(localStorage.getItem(k)); }
          catch (e) { out[k.slice(PFX.length)] = localStorage.getItem(k); }
        }
      }
    } catch(e) {}
    return out;
  }

  function importAll(obj) {
    if (typeof obj !== 'object' || !obj) return false;
    Object.keys(obj).forEach(function (k) {
      try { localStorage.setItem(key(k), JSON.stringify(obj[k])); } catch (e) {}
    });
    return true;
  }

  function clearAll() {
    try {
      var toDelete = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PFX) === 0) toDelete.push(k);
      }
      toDelete.forEach(function (k) { try { localStorage.removeItem(k); } catch(e){} });
    } catch(e) {}
  }

  function pruneOldKeys() {
    try {
      var cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      var toDelete = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf(PFX) !== 0) continue;
        var inner = k.slice(PFX.length);
        var m = inner.match(/^(log|prio|routine|sport)_(\d{4}-\d{2}-\d{2})$/);
        if (m) {
          var d = new Date(m[2]);
          if (d < cutoff) toDelete.push(k);
        }
      }
      toDelete.forEach(function (k) { try { localStorage.removeItem(k); } catch(e){} });
    } catch(e) {}
  }

  pruneOldKeys();

  /* ── Priorité par bloc (persistante, pas par jour) ── */
  function getBlockPriority(blockId) { return get('blkprio_' + blockId, null); }
  function setBlockPriority(blockId, priority) {
    if (!priority) { remove('blkprio_' + blockId); }
    else { set('blkprio_' + blockId, priority); }
  }
  function cyclePriority(blockId) {
    var cur = getBlockPriority(blockId);
    var next = cur === null ? 'A' : cur === 'A' ? 'B' : cur === 'B' ? 'C' : null;
    setBlockPriority(blockId, next);
    return next;
  }

  /* ── Pratique quotidienne (IA/Coding/Réparation/Échecs) ── */
  function getDailyPractice(date) { return get('daily_' + (date || today()), {}); }
  function toggleDailyPractice(id, date) {
    var d = getDailyPractice(date);
    d[id] = !d[id];
    set('daily_' + (date || today()), d);
    return d;
  }
  function getDailyWeekStats(id) {
    /* Compte combien de fois dans les 7 derniers jours ce bloc a été fait */
    var count = 0;
    for (var i = 0; i < 7; i++) {
      var dd = new Date(); dd.setDate(dd.getDate() - i);
      var dk = dd.getFullYear() + '-' + String(dd.getMonth()+1).padStart(2,'0') + '-' + String(dd.getDate()).padStart(2,'0');
      var dp = getDailyPractice(dk);
      if (dp[id]) count++;
    }
    return count;
  }

  /* ── Note + temps passé par bloc+jour ── */
  function getDailyNote(key) { return get('dnote_' + key, ''); }
  function setDailyNote(key, text) { set('dnote_' + key, text); }
  function getBlockTimeSpent(key) { return get('btime_' + key, 0); }
  function setBlockTimeSpent(key, minutes) { set('btime_' + key, parseInt(minutes)||0); }
  function addBlockTimeSpent(key, minutes) {
    var cur = getBlockTimeSpent(key);
    set('btime_' + key, cur + (parseInt(minutes)||0));
  }

  /* ── Difficulté/évaluation après bloc (1-5) ── */
  function getBlockRating(key) { return get('brating_' + key, 0); }
  function setBlockRating(key, stars) { set('brating_' + key, parseInt(stars)||0); }

  /* ══════════════════════════════════════════════════════════════
     CERTIFICATIONS (v4)
  ══════════════════════════════════════════════════════════════ */
  function getCertifications() {
    try { return get('certifications', []); }
    catch(e) { return []; }
  }
  function setCertifications(arr) {
    try { set('certifications', arr); } catch(e) {}
  }
  function getCertification(id) {
    try {
      return getCertifications().find(function(c){ return c.id === id; }) || null;
    } catch(e) { return null; }
  }
  function updateCertification(id, patch) {
    try {
      var certs = getCertifications();
      certs = certs.map(function(c){
        return c.id === id ? Object.assign({}, c, patch) : c;
      });
      setCertifications(certs);
    } catch(e) {}
  }
  function addMockScore(certId, scoreObj) {
    try {
      var cert = getCertification(certId);
      if (!cert) return;
      cert.mockScores = cert.mockScores || [];
      cert.mockScores.push(scoreObj);
      updateCertification(certId, { mockScores: cert.mockScores });
    } catch(e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     PROOFS (v4)
  ══════════════════════════════════════════════════════════════ */
  function getProofs() {
    try { return get('proofs', []); }
    catch(e) { return []; }
  }
  function setProofs(arr) {
    try { set('proofs', arr); } catch(e) {}
  }
  function addProof(proof) {
    try {
      var proofs = getProofs();
      var now = new Date().toISOString();
      proofs.push(Object.assign({}, proof, { id: Date.now().toString(), createdAt: now, updatedAt: now }));
      setProofs(proofs);
    } catch(e) {}
  }
  function updateProof(id, patch) {
    try {
      var proofs = getProofs();
      proofs = proofs.map(function(p){
        return p.id === id ? Object.assign({}, p, patch, { updatedAt: new Date().toISOString() }) : p;
      });
      setProofs(proofs);
    } catch(e) {}
  }
  function deleteProof(id) {
    try {
      setProofs(getProofs().filter(function(p){ return p.id !== id; }));
    } catch(e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     MISSION NOW (v4)
  ══════════════════════════════════════════════════════════════ */
  function getMissionNow() {
    try { return get('mission_now', { activeMissionId: null, history: [] }); }
    catch(e) { return { activeMissionId: null, history: [] }; }
  }
  function setMissionNow(data) {
    try { set('mission_now', data); } catch(e) {}
  }
  function addMissionHistory(entry) {
    try {
      var mn = getMissionNow();
      mn.history = mn.history || [];
      mn.history.push(entry);
      if (mn.history.length > 50) mn.history = mn.history.slice(-50);
      setMissionNow(mn);
    } catch(e) {}
  }
  function selectNextMission(dateStr) {
    try {
      var d = dateStr || today();
      var dp = getDailyPractice(d);
      var now = new Date().toISOString();

      // 1. A-priority daily practice not done today
      if (window.D && D.DAILY_PRACTICE) {
        for (var i = 0; i < D.DAILY_PRACTICE.length; i++) {
          var practice = D.DAILY_PRACTICE[i];
          var prio = getBlockPriority('daily_' + practice.id);
          if (prio === 'A' && !dp[practice.id]) {
            return { id: 'dp_' + practice.id + '_' + d, domain: practice.cat.toUpperCase(),
              title: practice.label, durationMin: practice.min, source: 'routine',
              sourceLabel: 'Priorité A — pratique quotidienne', status: 'pending', createdAt: now };
          }
        }
      }
      // 2. Overdue proof
      var proofs = getProofs();
      for (var j = 0; j < proofs.length; j++) {
        var proof = proofs[j];
        if (proof.dueDate && proof.dueDate < d && proof.status !== 'validated' && proof.status !== 'archived') {
          return { id: 'proof_' + proof.id, domain: 'ÉTUDE', title: 'Preuve en retard: ' + proof.title,
            durationMin: 30, source: 'proof', sourceLabel: 'Preuve en retard', status: 'pending', createdAt: now };
        }
      }
      // 3. Active certification
      var certs = getCertifications();
      for (var k = 0; k < certs.length; k++) {
        var cert = certs[k];
        if (cert.status === 'active') {
          return { id: 'cert_' + cert.id, domain: 'ÉTUDE', title: 'Certif: ' + cert.name,
            durationMin: 60, source: 'cert', sourceLabel: 'Certification active', status: 'pending', createdAt: now };
        }
      }
      // 4. Daily practice not done
      if (window.D && D.DAILY_PRACTICE) {
        for (var m = 0; m < D.DAILY_PRACTICE.length; m++) {
          var dp2 = D.DAILY_PRACTICE[m];
          if (!dp[dp2.id]) {
            return { id: 'dp_' + dp2.id + '_' + d, domain: dp2.cat.toUpperCase(),
              title: dp2.label, durationMin: dp2.min, source: 'routine',
              sourceLabel: 'Pratique quotidienne', status: 'pending', createdAt: now };
          }
        }
      }
      return null;
    } catch(e) { return null; }
  }

  /* ══════════════════════════════════════════════════════════════
     OPS BRIEFING (v4)
  ══════════════════════════════════════════════════════════════ */
  function getOpsBriefing(date) {
    try { return get('ops_briefing_' + (date || today()), null); }
    catch(e) { return null; }
  }
  function setOpsBriefing(date, data) {
    try { set('ops_briefing_' + (date || today()), data); } catch(e) {}
  }
  function generateBriefing(date) {
    try {
      var d = date || today();
      var rtData = get('routine_work_' + d, {});
      var log = getLog(d);
      var dp = getDailyPractice(d);
      var proofs = getProofs();
      var certs = getCertifications();

      var overdueProofs = proofs.filter(function(p){
        return p.dueDate && p.dueDate < d && p.status !== 'validated' && p.status !== 'archived';
      });
      var activeCerts = certs.filter(function(c){ return c.status === 'active'; });

      var risks = [];
      if (overdueProofs.length) risks.push(overdueProofs.length + ' preuve(s) en retard');
      var vv2 = get('vinted_v2', { items: [] });
      var staleItems = (vv2.items || []).filter(function(it){
        if (it.status === 'sold' || it.status === 'archived') return false;
        if (!it.listedAt) return false;
        var daysListed = Math.floor((Date.now() - new Date(it.listedAt).getTime()) / 86400000);
        return daysListed > 14;
      });
      if (staleItems.length) risks.push(staleItems.length + ' article(s) Vinted stale');

      var shift = rtData.shift || '';
      var mode = 'full';
      var dayTemplate = get('day_template_' + d, null);
      if (dayTemplate && dayTemplate.template) {
        var t = dayTemplate.template;
        if (t === 'malade' || t === 'repos') mode = 'survival';
        else if (t === 'travail-soir' || t === 'famille') mode = 'reduced';
      } else if (shift === 'Soir') { mode = 'reduced'; }

      var topMissions = [];
      if (window.D && D.DAILY_PRACTICE) {
        D.DAILY_PRACTICE.forEach(function(practice){
          if (!dp[practice.id]) topMissions.push({ title: practice.label, domain: practice.cat, min: practice.min });
        });
      }
      topMissions = topMissions.slice(0, 3);

      var briefing = { mode: mode, shift: shift, risks: risks, topMissions: topMissions,
        activeCerts: activeCerts.length, overdueProofs: overdueProofs.length, generatedAt: new Date().toISOString() };
      setOpsBriefing(d, briefing);
      return briefing;
    } catch(e) { return { mode:'full', risks:[], topMissions:[], generatedAt: new Date().toISOString() }; }
  }

  /* ══════════════════════════════════════════════════════════════
     VINTED V2 (v4)
  ══════════════════════════════════════════════════════════════ */
  function getVintedV2() {
    try { return get('vinted_v2', { items: [] }); }
    catch(e) { return { items: [] }; }
  }
  function setVintedV2(data) {
    try { set('vinted_v2', data); } catch(e) {}
  }
  function migrateVintedToV2() {
    try {
      if (get('vinted_v2', null) !== null) return; // already migrated
      var old = get('vinted', null);
      if (!old || !old.items || !old.items.length) return;
      var newItems = old.items.map(function(item){
        return {
          id: String(item.id || Date.now()),
          name: item.name || '',
          brand: item.brand || '',
          buyPrice: parseFloat(item.buyPrice)||0,
          listingPrice: parseFloat(item.sellPrice)||0,
          soldPrice: item.status === 'Vendu' ? parseFloat(item.sellPrice)||0 : 0,
          shippingCost: 0, boostCost: 0, platformCost: 0,
          status: item.status === 'Vendu' ? 'sold' : item.status === 'Non vendu' ? 'archived' : 'listed',
          listedAt: item.createdAt || new Date().toISOString(),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });
      setVintedV2({ items: newItems });
    } catch(e) {}
  }
  function addVintedV2Item(item) {
    try {
      var v = getVintedV2();
      var now = new Date().toISOString();
      v.items = v.items || [];
      v.items.push(Object.assign({ id: Date.now().toString(), status:'listed', shippingCost:0, boostCost:0, platformCost:0 }, item, { createdAt:now, updatedAt:now, listedAt: item.listedAt || now }));
      setVintedV2(v);
    } catch(e) {}
  }
  function updateVintedV2Item(id, patch) {
    try {
      var v = getVintedV2();
      v.items = (v.items||[]).map(function(it){
        return it.id === id ? Object.assign({}, it, patch, { updatedAt: new Date().toISOString() }) : it;
      });
      setVintedV2(v);
    } catch(e) {}
  }
  function deleteVintedV2Item(id) {
    try {
      var v = getVintedV2();
      v.items = (v.items||[]).filter(function(it){ return it.id !== id; });
      setVintedV2(v);
    } catch(e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     FINANCE COMMAND (v4)
  ══════════════════════════════════════════════════════════════ */
  function getFinanceCommand(month) {
    try {
      return get('finance_command_' + (month || currentMonth()), {
        income: 0, fixedCharges: 0, variableSpent: 0,
        savingsTarget: 20, debtRemaining: 0,
        projectBuckets: [], notes: '', correctionPlan: ''
      });
    } catch(e) { return { income:0, fixedCharges:0, variableSpent:0, savingsTarget:20, debtRemaining:0, projectBuckets:[], notes:'', correctionPlan:'' }; }
  }
  function setFinanceCommand(month, data) {
    try {
      var existing = getFinanceCommand(month);
      set('finance_command_' + (month || currentMonth()), Object.assign({}, existing, data));
    } catch(e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     HEALTH / PERFORMANCE (v4)
  ══════════════════════════════════════════════════════════════ */
  function getPerformance(date) {
    try { return get('performance_' + (date || today()), null); }
    catch(e) { return null; }
  }
  function setPerformance(date, data) {
    try {
      var existing = getPerformance(date) || {};
      set('performance_' + (date || today()), Object.assign({}, existing, data));
    } catch(e) {}
  }
  function getPerformanceRange(days) {
    try {
      var result = [];
      for (var i = days - 1; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i);
        var dk = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        var perf = getPerformance(dk);
        result.push({ date: dk, data: perf });
      }
      return result;
    } catch(e) { return []; }
  }

  /* ══════════════════════════════════════════════════════════════
     WEEKLY REVIEW (v4)
  ══════════════════════════════════════════════════════════════ */
  function currentIsoWeek() {
    try {
      var d = new Date();
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
      var week1 = new Date(d.getFullYear(), 0, 4);
      var weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      return d.getFullYear() + '-W' + String(weekNum).padStart(2, '0');
    } catch(e) { return ''; }
  }
  function getWeeklyReview(isoWeek) {
    try { return get('weekly_review_' + (isoWeek || currentIsoWeek()), null); }
    catch(e) { return null; }
  }
  function setWeeklyReview(isoWeek, data) {
    try { set('weekly_review_' + (isoWeek || currentIsoWeek()), data); } catch(e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     DAY TEMPLATES (v4)
  ══════════════════════════════════════════════════════════════ */
  function getDayTemplate(date) {
    try { return get('day_template_' + (date || today()), null); }
    catch(e) { return null; }
  }
  function setDayTemplate(date, template, notes) {
    try { set('day_template_' + (date || today()), { template: template, notes: notes || '', setAt: new Date().toISOString() }); }
    catch(e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     SPORT COMMAND CENTER (v5)
  ══════════════════════════════════════════════════════════════ */
  function getSportCycle() {
    try { return get('sport_cycle', { anchorDate: today(), anchorType: 'push1', currentDeload: false, lastResetAt: null }); }
    catch(e) { return { anchorDate: today(), anchorType: 'push1', currentDeload: false, lastResetAt: null }; }
  }
  function setSportCycle(data) { try { set('sport_cycle', data); } catch(e) {} }

  function getSportSessions() {
    try { return get('sport_sessions', []); }
    catch(e) { return []; }
  }
  function addSportSession(session) {
    try {
      var sessions = getSportSessions();
      session.id = session.id || Date.now().toString();
      session.createdAt = session.createdAt || new Date().toISOString();
      session.updatedAt = new Date().toISOString();
      sessions.push(session);
      set('sport_sessions', sessions);
      return session;
    } catch(e) { return session; }
  }
  function updateSportSession(id, patch) {
    try {
      var sessions = getSportSessions();
      sessions = sessions.map(function(s) { return s.id === id ? Object.assign({}, s, patch, { updatedAt: new Date().toISOString() }) : s; });
      set('sport_sessions', sessions);
    } catch(e) {}
  }
  function getSessionForDate(date) {
    try {
      var sessions = getSportSessions();
      return sessions.filter(function(s) { return s.date === date; }).pop() || null;
    } catch(e) { return null; }
  }
  function getPreviousExerciseLog(exerciseId) {
    try {
      var sessions = getSportSessions();
      for (var i = sessions.length - 1; i >= 0; i--) {
        var s = sessions[i];
        if (!s.exercises) continue;
        for (var j = 0; j < s.exercises.length; j++) {
          if (s.exercises[j].exerciseId === exerciseId) return s.exercises[j];
        }
      }
      return null;
    } catch(e) { return null; }
  }

  function getBodyweightProgress() {
    try {
      return get('bodyweight_progress', { pushups:{level:0,best:0,lastTestDate:null,notes:''}, pullups:{level:0,best:0,lastTestDate:null,notes:''}, dips:{level:0,best:0,lastTestDate:null,notes:''}, legs:{level:0,best:0,lastTestDate:null,notes:''}, core:{level:0,best:0,lastTestDate:null,notes:''}, mobility:{level:0,best:0,lastTestDate:null,notes:''} });
    } catch(e) { return { pushups:{level:0,best:0,lastTestDate:null,notes:''}, pullups:{level:0,best:0,lastTestDate:null,notes:''}, dips:{level:0,best:0,lastTestDate:null,notes:''}, legs:{level:0,best:0,lastTestDate:null,notes:''}, core:{level:0,best:0,lastTestDate:null,notes:''}, mobility:{level:0,best:0,lastTestDate:null,notes:''} }; }
  }
  function setBodyweightProgress(data) { try { set('bodyweight_progress', data); } catch(e) {} }

  function getFlexibilityProgress() {
    try { return get('flexibility_progress', { currentLevel:0, measurements:[], dailyChecks:{} }); }
    catch(e) { return { currentLevel:0, measurements:[], dailyChecks:{} }; }
  }
  function setFlexibilityProgress(data) { try { set('flexibility_progress', data); } catch(e) {} }

  function getSportMonthlyTests() {
    try { return get('sport_monthly_tests', []); }
    catch(e) { return []; }
  }
  function addSportMonthlyTest(test) {
    try {
      var tests = getSportMonthlyTests();
      test.date = test.date || today();
      tests.push(test);
      set('sport_monthly_tests', tests);
    } catch(e) {}
  }

  return {
    get: get, set: set, remove: remove, today: today, currentMonth: currentMonth,
    getBookmarks: getBookmarks, setBookmark: setBookmark,
    getLog: getLog, setLog: setLog,
    getPriorities: getPriorities, addPriority: addPriority,
    togglePriority: togglePriority, deletePriority: deletePriority,
    getFocusSessions: getFocusSessions, addFocusSession: addFocusSession,
    todayFocusMinutes: todayFocusMinutes,
    getRoutineChecks: getRoutineChecks, toggleRoutineCheck: toggleRoutineCheck,
    setRoutineCheck: setRoutineCheck,
    getRoutineNote: getRoutineNote, setRoutineNote: setRoutineNote,
    getSportLog: getSportLog, setSportLog: setSportLog,
    getSportOff: getSportOff, setSportOff: setSportOff,
    markSportDone: markSportDone,
    getChess: getChess, setChess: setChess, addChessGame: addChessGame,
    getStudy: getStudy, setStudy: setStudy, logStudyProgress: logStudyProgress,
    logStudyFromRoutine: logStudyFromRoutine,
    getFinance: getFinance, setFinance: setFinance,
    getFinanceMonth: getFinanceMonth, setFinanceMonth: setFinanceMonth,
    getFinanceMonths: getFinanceMonths,
    getVinted: getVinted, setVinted: setVinted,
    addVintedItem: addVintedItem, updateVintedItem: updateVintedItem,
    deleteVintedItem: deleteVintedItem, getVintedStats: getVintedStats,
    getBooks: getBooks, getBook: getBook, setBook: setBook, logBookPages: logBookPages,
    getDayScore: getDayScore, setDayScore: setDayScore,
    computeDayScore: computeDayScore, getScoreTier: getScoreTier,
    getStreaks: getStreaks, updateStreak: updateStreak,
    getObjectives: getObjectives, setObjectives: setObjectives,
    getBlockPriority: getBlockPriority, setBlockPriority: setBlockPriority, cyclePriority: cyclePriority,
    getDailyPractice: getDailyPractice, toggleDailyPractice: toggleDailyPractice, getDailyWeekStats: getDailyWeekStats,
    getDailyNote: getDailyNote, setDailyNote: setDailyNote,
    getBlockTimeSpent: getBlockTimeSpent, setBlockTimeSpent: setBlockTimeSpent, addBlockTimeSpent: addBlockTimeSpent,
    getBlockRating: getBlockRating, setBlockRating: setBlockRating,
    exportAll: exportAll, importAll: importAll, clearAll: clearAll,
    /* v4 */
    getCertifications: getCertifications, setCertifications: setCertifications,
    getCertification: getCertification, updateCertification: updateCertification, addMockScore: addMockScore,
    getProofs: getProofs, setProofs: setProofs, addProof: addProof, updateProof: updateProof, deleteProof: deleteProof,
    getMissionNow: getMissionNow, setMissionNow: setMissionNow, addMissionHistory: addMissionHistory, selectNextMission: selectNextMission,
    getOpsBriefing: getOpsBriefing, setOpsBriefing: setOpsBriefing, generateBriefing: generateBriefing,
    getVintedV2: getVintedV2, setVintedV2: setVintedV2, migrateVintedToV2: migrateVintedToV2,
    addVintedV2Item: addVintedV2Item, updateVintedV2Item: updateVintedV2Item, deleteVintedV2Item: deleteVintedV2Item,
    getFinanceCommand: getFinanceCommand, setFinanceCommand: setFinanceCommand,
    getPerformance: getPerformance, setPerformance: setPerformance, getPerformanceRange: getPerformanceRange,
    currentIsoWeek: currentIsoWeek, getWeeklyReview: getWeeklyReview, setWeeklyReview: setWeeklyReview,
    getDayTemplate: getDayTemplate, setDayTemplate: setDayTemplate,
    /* v5 Sport */
    getSportCycle: getSportCycle, setSportCycle: setSportCycle,
    getSportSessions: getSportSessions, addSportSession: addSportSession,
    updateSportSession: updateSportSession, getSessionForDate: getSessionForDate,
    getPreviousExerciseLog: getPreviousExerciseLog,
    getBodyweightProgress: getBodyweightProgress, setBodyweightProgress: setBodyweightProgress,
    getFlexibilityProgress: getFlexibilityProgress, setFlexibilityProgress: setFlexibilityProgress,
    getSportMonthlyTests: getSportMonthlyTests, addSportMonthlyTest: addSportMonthlyTest
  };
})();
