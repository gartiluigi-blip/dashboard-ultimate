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

  /* --- Routine notes (expand) --- */
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
      var updated = Object.assign({}, item, updates);
      return updated;
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

    // Routine blocks
    var doneBlocks = Object.values(checks).filter(Boolean).length;
    pts += doneBlocks * 15;

    // Focus sessions
    sessions.forEach(function (s) {
      var min = s.seconds / 60;
      if (min >= 50) pts += 50;
      else if (min >= 25) pts += 25;
    });

    // Sport
    var sportDone = (log.sport === '✓ Fait') || sportOff;
    if (sportDone) pts += 50;

    // Log filled (>=5 non-empty fields)
    var filledFields = Object.values(log).filter(function (v) { return v !== '' && v !== null && v !== undefined && v !== 0; }).length;
    var logFilled = filledFields >= 5;
    if (logFilled) pts += 20;

    // Full rotation bonus
    var rotation = (window.D && window.D.todayRotation()) || { tasks: [] };
    var fullRotation = rotation.tasks.length > 0 && doneBlocks >= rotation.tasks.length;
    if (fullRotation) pts += 50;

    // Streak multiplier
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
    if (pts >= 200) return { label: 'LÉGENDE', color: 'tier-legend', next: null, nextPts: 0 };
    if (pts >= 150) return { label: 'CHAMPION', color: 'tier-champion', next: 'LÉGENDE', nextPts: 200 };
    if (pts >= 100) return { label: 'CONTENDER', color: 'tier-contender', next: 'CHAMPION', nextPts: 150 };
    if (pts >= 50)  return { label: 'CHALLENGER', color: 'tier-challenger', next: 'CONTENDER', nextPts: 100 };
    return { label: 'SPARRING', color: 'tier-sparring', next: 'CHALLENGER', nextPts: 50 };
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
    getChess: getChess, setChess: setChess, addChessGame: addChessGame,
    getStudy: getStudy, setStudy: setStudy, logStudyProgress: logStudyProgress,
    getFinance: getFinance, setFinance: setFinance,
    getFinanceMonth: getFinanceMonth, setFinanceMonth: setFinanceMonth,
    getVinted: getVinted, setVinted: setVinted,
    addVintedItem: addVintedItem, updateVintedItem: updateVintedItem,
    deleteVintedItem: deleteVintedItem, getVintedStats: getVintedStats,
    getBooks: getBooks, getBook: getBook, setBook: setBook,
    getDayScore: getDayScore, setDayScore: setDayScore,
    computeDayScore: computeDayScore, getScoreTier: getScoreTier,
    getStreaks: getStreaks, updateStreak: updateStreak,
    getObjectives: getObjectives, setObjectives: setObjectives,
    exportAll: exportAll, importAll: importAll, clearAll: clearAll
  };
})();
