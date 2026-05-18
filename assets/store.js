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

  /* --- Bookmarks --- */
  function getBookmarks() {
    return get('bookmarks', {});
  }

  function setBookmark(id, data) {
    var bm = getBookmarks();
    bm[id] = Object.assign({}, bm[id] || {}, data, { updatedAt: new Date().toISOString() });
    set('bookmarks', bm);
  }

  /* --- Daily log --- */
  function getLog(date) {
    return get('log_' + (date || today()), {});
  }

  function setLog(date, data) {
    var existing = getLog(date);
    set('log_' + (date || today()), Object.assign({}, existing, data));
  }

  /* --- Priorities --- */
  function getPriorities(date) {
    return get('prio_' + (date || today()), []);
  }

  function setPriorities(date, list) {
    set('prio_' + (date || today()), list);
  }

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

  /* --- Sport --- */
  function getSportLog(date) { return get('sport_' + (date || today()), {}); }

  function setSportLog(date, data) {
    var existing = getSportLog(date);
    set('sport_' + (date || today()), Object.assign({}, existing, data));
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

  /* --- Study progress --- */
  function getStudy(matiere) { return get('study_' + matiere, { resource: '', position: '', next: '', notes: '' }); }

  function setStudy(matiere, data) {
    var existing = getStudy(matiere);
    set('study_' + matiere, Object.assign({}, existing, data));
  }

  /* --- Finance --- */
  function getFinance() {
    return get('finance', {
      budget: 0, salary: 0, savings_goal: 0, savings_current: 0,
      charges: [], debts: []
    });
  }

  function setFinance(data) {
    var existing = getFinance();
    set('finance', Object.assign({}, existing, data));
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
    get: get, set: set, remove: remove, today: today,
    getBookmarks: getBookmarks, setBookmark: setBookmark,
    getLog: getLog, setLog: setLog,
    getPriorities: getPriorities, addPriority: addPriority,
    togglePriority: togglePriority, deletePriority: deletePriority,
    getFocusSessions: getFocusSessions, addFocusSession: addFocusSession,
    todayFocusMinutes: todayFocusMinutes,
    getRoutineChecks: getRoutineChecks, toggleRoutineCheck: toggleRoutineCheck,
    getSportLog: getSportLog, setSportLog: setSportLog,
    getChess: getChess, setChess: setChess, addChessGame: addChessGame,
    getStudy: getStudy, setStudy: setStudy,
    getFinance: getFinance, setFinance: setFinance,
    getStreaks: getStreaks, updateStreak: updateStreak,
    getObjectives: getObjectives, setObjectives: setObjectives,
    exportAll: exportAll, importAll: importAll, clearAll: clearAll
  };
})();
