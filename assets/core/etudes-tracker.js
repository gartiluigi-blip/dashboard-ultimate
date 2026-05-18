(function(){
  'use strict';
  if (window.UDEtudesTracker && window.UDEtudesTracker.version === 'epfc-study-v1') return;

  var KEY = 'dashv2_study_resources';
  var SEED_KEY = 'dashv2_epfc_subject_seed_v1';

  var SUBJECTS = [
    { code:'PRM3', name:'Principes algorithmiques et programmation', focus:'Python, logique, fonctions, exercices courts', target:'100 exercices', unit:'exercices', total:100, preset:'PRM3 · Python / algo — 100 exercices' },
    { code:'BDO1', name:'Initiation aux bases de données', focus:'SQL, tables, clés, SELECT/WHERE/JOIN', target:'150 requêtes', unit:'exercices', total:150, preset:'BDO1 · SQL — 150 requêtes' },
    { code:'WEB1', name:'Web : principes de base', focus:'HTML, CSS, responsive, mini-pages', target:'12 mini-tâches', unit:'exercices', total:12, preset:'WEB1 · HTML/CSS — 12 preuves' },
    { code:'BNE2', name:'Bases des réseaux', focus:'IP, DNS, DHCP, HTTP, ping, nslookup, curl', target:'30 labs', unit:'labs', total:30, preset:'BNE2 · Réseaux — 30 diagnostics/labs' },
    { code:'SYS4', name:'Systèmes d’exploitation', focus:'Linux/Windows, fichiers, permissions, commandes', target:'40 commandes', unit:'exercices', total:40, preset:'SYS4 · OS/Linux — 40 commandes' },
    { code:'STO4', name:'Structure des ordinateurs', focus:'architecture, mémoire, CPU, logique, composants', target:'25 fiches/labs', unit:'exercices', total:25, preset:'STO4 · Architecture ordinateur — 25 preuves' },
    { code:'MAP4', name:'Mathématique appliquée à l’informatique', focus:'logique, fonctions, bases utiles pour algo', target:'40 exercices', unit:'exercices', total:40, preset:'MAP4 · Maths appliquées — 40 exercices' },
    { code:'STA1', name:'Éléments de statistique', focus:'descriptif, probabilités simples, lecture de données', target:'30 exercices', unit:'exercices', total:30, preset:'STA1 · Statistiques — 30 exercices' },
    { code:'PAN2', name:'Analyse informatique', focus:'besoin, diagrammes, cas, solution', target:'10 cas', unit:'exercices', total:10, preset:'PAN2 · Analyse informatique — 10 cas' },
    { code:'BDG4', name:'Bases de données — suite', focus:'après BDO1 : modèles, requêtes, projet', target:'parking après BDO1', unit:'exercices', total:40, preset:'BDG4 · SQL suite — 40 exercices' },
    { code:'ELEC', name:'Réparation électronique / IoT', focus:'diagnostic, multimètre, composants, circuits', target:'bonus technique', unit:'pages', total:416, preset:'How to Diagnose and Fix Everything Electronic — 416 pages' },
    { code:'CYBER', name:'Sécurité / labs', focus:'Linux, web security, CTF, réseau pratique', target:'bonus sécurité', unit:'labs', total:31, preset:'TryHackMe Pre Security — 31 labs' }
  ];

  function ready(fn){ document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once:true }) : fn(); }
  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(value){ return (window.UDHtml && window.UDHtml.escape ? window.UDHtml.escape(value) : String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; })); }
  function uid(){ return 'sr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8); }
  function now(){ return new Date().toISOString(); }

  function read(){
    try { var data = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(data) ? data : []; }
    catch (_) { return []; }
  }
  function write(items){
    try { localStorage.setItem(KEY, JSON.stringify(items)); return true; }
    catch (error) { console.warn('[UDEtudesTracker] save failed', error); return false; }
  }
  function subjectByCode(code){ return SUBJECTS.find(function(s){ return s.code === code; }) || SUBJECTS[0]; }
  function resourcesFor(code){ return read().filter(function(r){ return r && (r.subject_code === code || r.subject === code); }); }
  function pct(r){ var total = Number(r.total_units || 0); var done = Number(r.completed_units || 0); return total ? Math.max(0, Math.min(100, Math.round(done / total * 100))) : 0; }
  function remaining(r){ return Math.max(0, Number(r.total_units || 0) - Number(r.completed_units || 0)); }
  function statusLabel(r){ if (pct(r) >= 100 || r.status === 'completed') return 'terminé'; if ((r.completed_units || 0) > 0 || r.status === 'active') return 'actif'; return 'à démarrer'; }

  function seedDefaults(){
    var items = read();
    var existing = {};
    items.forEach(function(r){ if (r && r.subject_code) existing[r.subject_code] = true; });
    SUBJECTS.forEach(function(s){
      if (existing[s.code]) return;
      items.push({
        id: uid(), schema_version: 2,
        domain: s.code === 'ELEC' ? 'ElectronicsRepair' : (s.code === 'CYBER' ? 'Cybersecurity' : 'EPFC'),
        subject_code: s.code,
        type: s.code === 'ELEC' ? 'book' : (s.code === 'CYBER' ? 'lab_path' : 'exercise_set'),
        title: s.preset,
        provider: s.code === 'ELEC' ? 'OReilly' : (s.code === 'CYBER' ? 'TryHackMe' : 'EPFC'),
        total_units: s.total,
        unit_type: s.unit,
        completed_units: 0,
        status: 'not_started',
        priority_level: (s.code === 'ELEC' || s.code === 'CYBER' || s.code === 'BDG4') ? 'P3' : 'P1',
        color: 'blue', created_at: now(), updated_at: now(), last_session_at: null, notes: s.focus
      });
    });
    localStorage.setItem(SEED_KEY, '1');
    write(items);
    render();
    if (window.__studyTracker && window.__studyTracker.render) window.__studyTracker.render();
  }

  function addResource(code){
    var s = subjectByCode(code);
    var title = prompt('Titre du livre / cours / vidéo / lab pour ' + s.code + ' :', '');
    if (!title) return;
    var unit = prompt('Unité de suivi : pages, minutes, labs ou exercices ?', s.unit || 'pages');
    if (!unit) return;
    unit = String(unit).trim().toLowerCase();
    var total = parseInt(prompt('Total à suivre pour calculer le pourcentage :', ''), 10);
    if (!total || total < 1) { alert('Total invalide. Exemple : 416 pages, 120 minutes, 31 labs.'); return; }
    var items = read();
    items.push({ id: uid(), schema_version: 2, domain: code === 'ELEC' ? 'ElectronicsRepair' : (code === 'CYBER' ? 'Cybersecurity' : 'EPFC'), subject_code: code, type: unit === 'minutes' ? 'video' : (unit === 'labs' ? 'lab_path' : 'book'), title: title.trim(), provider: code === 'ELEC' ? 'OReilly' : (code === 'CYBER' ? 'Lab' : 'EPFC'), total_units: total, unit_type: unit, completed_units: 0, status: 'active', priority_level: 'P1', color: 'blue', created_at: now(), updated_at: now(), last_session_at: null, notes: s.focus });
    write(items); render();
    if (window.__studyTracker && window.__studyTracker.render) window.__studyTracker.render();
  }

  function increment(id, amount){
    var items = read();
    var r = items.find(function(x){ return x && x.id === id; });
    if (!r) return;
    var total = Number(r.total_units || 0);
    var done = Number(r.completed_units || 0) + Number(amount || 0);
    r.completed_units = total ? Math.min(done, total) : done;
    r.status = r.completed_units >= total && total > 0 ? 'completed' : 'active';
    r.updated_at = now();
    r.last_session_at = now();
    write(items); render();
    if (window.__studyTracker && window.__studyTracker.render) window.__studyTracker.render();
  }
  function customIncrement(id){ var n = parseInt(prompt('Combien d’unités validées ?', '10'), 10); if (n && n > 0) increment(id, n); }
  function removeResource(id){ if (!confirm('Supprimer cette ressource de suivi ?')) return; write(read().filter(function(x){ return x && x.id !== id; })); render(); if (window.__studyTracker && window.__studyTracker.render) window.__studyTracker.render(); }

  function currentResume(items){
    var active = items.filter(function(r){ return r && r.subject_code && statusLabel(r) !== 'terminé'; });
    active.sort(function(a,b){ return String(b.last_session_at || b.updated_at || '').localeCompare(String(a.last_session_at || a.updated_at || '')); });
    return active[0] || null;
  }

  function renderResource(r){
    var p = pct(r), rem = remaining(r);
    var smallStep = r.unit_type === 'labs' ? 1 : (r.unit_type === 'minutes' ? 15 : 10);
    var bigStep = r.unit_type === 'labs' ? 3 : (r.unit_type === 'minutes' ? 30 : 25);
    return '<div class="ud-et-res"><div class="ud-et-res-head"><div><b>' + esc(r.title || 'Ressource') + '</b><span>' + esc(r.provider || '') + ' · ' + esc(r.unit_type || 'unités') + ' · ' + esc(statusLabel(r)) + '</span></div><button type="button" data-et-del="' + esc(r.id) + '">×</button></div><div class="ud-et-bar"><i style="width:' + p + '%"></i></div><div class="ud-et-meta"><span>' + p + '% fait</span><span>' + rem + ' ' + esc(r.unit_type || 'unités') + ' restantes</span><span>' + Number(r.completed_units || 0) + '/' + Number(r.total_units || 0) + '</span></div><div class="ud-et-actions"><button type="button" data-et-inc="' + esc(r.id) + '" data-et-n="' + smallStep + '">+' + smallStep + '</button><button type="button" data-et-inc="' + esc(r.id) + '" data-et-n="' + bigStep + '">+' + bigStep + '</button><button type="button" data-et-custom="' + esc(r.id) + '">Valider autre</button></div></div>';
  }

  function ensurePanel(){
    var epfc = qs('#p-epfc');
    if (!epfc) return null;
    var panel = qs('#ud-etudes-panel');
    if (panel) return panel;
    panel = document.createElement('section');
    panel.id = 'ud-etudes-panel';
    panel.className = 'ud-etudes-panel card';
    var anchor = qs('#v80-epfc-panel', epfc) || qs('.page-header', epfc) || epfc.firstElementChild;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    else epfc.insertBefore(panel, epfc.firstChild);
    return panel;
  }

  function render(){
    var panel = ensurePanel();
    if (!panel) return;
    var items = read();
    var resume = currentResume(items);
    var seeded = localStorage.getItem(SEED_KEY) === '1' || SUBJECTS.some(function(s){ return resourcesFor(s.code).length; });
    var html = '<div class="ud-et-head"><div><h2>Études · reprise par matière</h2><p>Tu reprends directement par UE : livre, vidéo, lab ou exercices. Le pourcentage est calculé sur pages / minutes / labs / exercices.</p></div><button type="button" data-et-seed>Précharger matières</button></div>';
    if (resume) html += '<div class="ud-et-resume"><strong>Reprise immédiate :</strong> ' + esc(resume.subject_code || '') + ' · ' + esc(resume.title || '') + ' · ' + pct(resume) + '% · ' + remaining(resume) + ' ' + esc(resume.unit_type || 'unités') + ' restantes</div>';
    else if (!seeded) html += '<div class="ud-et-resume warn"><strong>Action :</strong> clique “Précharger matières” pour créer les suivis PRM3, BDO1, WEB1, BNE2, SYS4, STO4, MAP4, STA1, PAN2 + bonus électronique/cyber.</div>';
    html += '<div class="ud-et-grid">';
    SUBJECTS.forEach(function(s){
      var rs = resourcesFor(s.code);
      var done = rs.length ? Math.round(rs.reduce(function(a,r){ return a + pct(r); }, 0) / rs.length) : 0;
      html += '<article class="ud-et-subj ' + (s.code === 'ELEC' || s.code === 'CYBER' || s.code === 'BDG4' ? 'bonus' : '') + '"><header><div><b>' + esc(s.code) + '</b><h3>' + esc(s.name) + '</h3><p>' + esc(s.focus) + '</p></div><span>' + done + '%</span></header><div class="ud-et-target">Objectif : ' + esc(s.target) + '</div>' + (rs.length ? rs.map(renderResource).join('') : '<div class="ud-et-empty">Aucune ressource. Ajoute ton livre, vidéo ou série d’exercices.</div>') + '<footer><button type="button" data-et-add="' + esc(s.code) + '">+ ressource</button></footer></article>';
    });
    html += '</div>';
    panel.innerHTML = html;
  }

  function css(){
    if (qs('#ud-etudes-style')) return;
    var style = document.createElement('style');
    style.id = 'ud-etudes-style';
    style.textContent = '#ud-etudes-panel{margin:16px 0;padding:16px;border:1px solid rgba(99,102,241,.35);background:linear-gradient(180deg,rgba(15,23,42,.9),rgba(2,6,23,.78));border-radius:18px}.ud-et-head{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;margin-bottom:12px}.ud-et-head h2{margin:0;color:#e5e7eb;font:900 18px system-ui}.ud-et-head p{margin:4px 0 0;color:#94a3b8;font:600 12px/1.4 system-ui}.ud-et-head button,.ud-et-subj footer button,.ud-et-actions button{border:1px solid rgba(148,163,184,.28);border-radius:10px;background:#1e293b;color:#e5e7eb;padding:8px 10px;font:800 12px system-ui;cursor:pointer}.ud-et-head button{background:#4f46e5;color:white}.ud-et-resume{border:1px solid rgba(34,197,94,.35);background:rgba(6,78,59,.28);border-radius:12px;padding:10px;margin:10px 0;color:#dcfce7;font:800 12px system-ui}.ud-et-resume.warn{border-color:rgba(245,158,11,.45);background:rgba(120,53,15,.25);color:#fde68a}.ud-et-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ud-et-subj{border:1px solid rgba(148,163,184,.2);border-radius:14px;padding:12px;background:rgba(15,23,42,.7)}.ud-et-subj.bonus{border-color:rgba(245,158,11,.24)}.ud-et-subj header{display:flex;gap:8px;justify-content:space-between}.ud-et-subj header b{display:inline-flex;border-radius:8px;background:#0f172a;color:#93c5fd;padding:3px 7px;font:900 11px ui-monospace}.ud-et-subj h3{margin:6px 0 3px;color:#f8fafc;font:900 13px system-ui}.ud-et-subj p{margin:0;color:#94a3b8;font:600 11px/1.35 system-ui}.ud-et-subj header span{font:900 18px ui-monospace;color:#a7f3d0}.ud-et-target,.ud-et-empty{margin:10px 0;color:#64748b;font:700 11px system-ui}.ud-et-res{border-top:1px solid rgba(148,163,184,.14);padding-top:9px;margin-top:9px}.ud-et-res-head{display:flex;justify-content:space-between;gap:8px}.ud-et-res-head b{display:block;color:#e2e8f0;font:800 12px system-ui}.ud-et-res-head span{display:block;color:#64748b;font:700 10px system-ui}.ud-et-res-head button{border:0;background:#7f1d1d;color:white;border-radius:8px;width:24px;height:24px}.ud-et-bar{height:7px;border-radius:999px;background:#1e293b;overflow:hidden;margin:7px 0}.ud-et-bar i{display:block;height:100%;background:linear-gradient(90deg,#6366f1,#22c55e);border-radius:inherit}.ud-et-meta{display:flex;gap:8px;justify-content:space-between;color:#94a3b8;font:800 10px ui-monospace}.ud-et-actions{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}.ud-et-actions button{padding:6px 8px;font-size:11px}.ud-et-subj footer{margin-top:9px}@media(max-width:760px){.ud-et-grid{grid-template-columns:1fr}.ud-et-head{display:block}.ud-et-head button{margin-top:10px;width:100%}.ud-et-meta{display:block}.ud-et-actions button{flex:1}}';
    document.head.appendChild(style);
  }

  function cleanupOldUi(){
    qsa('#v78-grade-epfc,#v79-grade-epfc').forEach(function(el){ el.style.display = 'none'; });
    qsa('#v79-freeze-badge').forEach(function(el){ el.style.display = 'none'; });
    qsa('[data-v80-step="exam"]').forEach(function(btn){ btn.textContent = btn.textContent.replace(/Mode examen/gi, 'Test blanc'); });
    qsa('[data-tab="trading"]').forEach(function(tab){ tab.textContent = '🔌 Élec/IoT'; });
    var epfc = qs('#p-epfc');
    if (epfc) {
      qsa('.callout,.card,.v80-exam-box,li,div', epfc).forEach(function(el){
        var t = (el.textContent || '').replace(/\s+/g,' ').trim();
        if (t.length < 500 && (/Langue appliqu[eé]e retir[eé]e/i.test(t) || /V79 Freeze Guard actif/i.test(t) || /Assurance/i.test(t))) el.style.display = 'none';
      });
    }
  }

  function bind(){
    if (window.__UDEtudesTrackerBound) return;
    window.__UDEtudesTrackerBound = true;
    document.addEventListener('click', function(e){
      var seed = e.target.closest && e.target.closest('[data-et-seed]');
      if (seed){ e.preventDefault(); seedDefaults(); return; }
      var add = e.target.closest && e.target.closest('[data-et-add]');
      if (add){ e.preventDefault(); addResource(add.getAttribute('data-et-add')); return; }
      var inc = e.target.closest && e.target.closest('[data-et-inc]');
      if (inc){ e.preventDefault(); increment(inc.getAttribute('data-et-inc'), Number(inc.getAttribute('data-et-n') || 0)); return; }
      var custom = e.target.closest && e.target.closest('[data-et-custom]');
      if (custom){ e.preventDefault(); customIncrement(custom.getAttribute('data-et-custom')); return; }
      var del = e.target.closest && e.target.closest('[data-et-del]');
      if (del){ e.preventDefault(); removeResource(del.getAttribute('data-et-del')); return; }
    }, true);
  }

  function boot(){
    css(); bind(); cleanupOldUi(); render();
    setTimeout(function(){ cleanupOldUi(); render(); }, 600);
    document.addEventListener('click', function(e){ if (e.target && e.target.closest && e.target.closest('.tab,[data-tab],[data-go]')) setTimeout(function(){ cleanupOldUi(); render(); }, 150); }, true);
  }

  window.UDEtudesTracker = { version:'epfc-study-v1', render:render, seedDefaults:seedDefaults, read:read, write:write };
  ready(boot);
})();
