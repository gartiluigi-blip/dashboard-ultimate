(function(){
  'use strict';
  if (window.__userContentFixes) return;
  window.__userContentFixes = true;

  const STUDY_KEY = 'study_resources_v2';
  const DAILY_KEY = 'routine_daily_trackers_v1';

  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function qs(sel, root){
    if (window.UDDom && window.UDDom.qs) return window.UDDom.qs(sel, root);
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root){
    if (window.UDDom && window.UDDom.qsa) return window.UDDom.qsa(sel, root);
    return Array.from((root || document).querySelectorAll(sel));
  }

  function esc(value){
    if (window.UDHtml && window.UDHtml.escape) return window.UDHtml.escape(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function getStore(key, fallback){
    try {
      if (window.UDStore && window.UDStore.get) return window.UDStore.get(key, fallback);
      if (window.safeStorage) return window.safeStorage.getJson('dashv2_' + key, fallback);
    } catch(_) {}
    return fallback;
  }

  function setStore(key, value){
    try {
      if (window.UDStore && window.UDStore.set) return window.UDStore.set(key, value);
      if (window.safeStorage) return window.safeStorage.setJson('dashv2_' + key, value);
    } catch(_) {}
    return false;
  }

  function toast(message){
    try { if (typeof window.showToast === 'function') window.showToast(message); } catch(_) {}
  }

  function remove(el){ if (el && el.parentNode) el.parentNode.removeChild(el); }

  function page(name){
    return qs('#p-' + name) || qs('[data-page="' + name + '"]');
  }

  function smallContainers(root){
    return qsa('article,section,div,li,button', root).filter(el => {
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return txt && txt.length < 600;
    });
  }

  function removeByText(root, patterns){
    if (!root) return;
    smallContainers(root).forEach(el => {
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (patterns.some(re => re.test(txt))) {
        remove(el.closest('.card,.u20-panel,.now-card,.today-prio,article,li') || el);
      }
    });
  }

  function removeNavTargets(){
    ['trading', 'admin', 'job'].forEach(name => {
      qsa('[data-tab="' + name + '"],[data-go-tab="' + name + '"],[data-drawer-tab="' + name + '"]').forEach(remove);
      const sec = page(name);
      if (sec) sec.style.display = 'none';
    });
  }

  function cleanTextNodes(){
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      node.nodeValue = node.nodeValue
        .replace(/lettre\s+mar\s+lettre/gi, 'lettre par lettre')
        .replace(/reprendre trading/gi, 'reprendre électronique / IoT')
        .replace(/split squat\s*[àa]\s*la barre/gi, 'step-up ou fentes haltères légères')
        .replace(/v79\s*freeze\s*guard\s*actif/gi, '');
    });
  }

  function cleanHome(){
    const home = page('home') || page('today');
    removeByText(home, [/trading/i, /repas/i, /compl[eé]ment/i, /suppl[eé]ment du jour/i]);
  }

  function cleanEpfc(){
    const epfc = page('epfc');
    removeByText(epfc, [
      /mode examen/i,
      /assurance/i,
      /15\s*[àa-]\s*17/i,
      /vocal inbox/i,
      /r[eè]gles/i,
      /[ée]tude informatique/i,
      /langue appliqu[eé]e retir[eé]e/i,
      /2GB5/i,
      /freeze guard/i
    ]);
  }

  function cleanFinanceAndIot(){
    removeByText(page('finance'), [/rappel admin be/i, /admin be/i]);
    removeByText(page('iot'), [/reprendre trading/i]);
    removeByText(page('trading'), [/./]);
  }

  function movePrioritiesToRoutine(){
    const routine = page('routine');
    const home = page('home') || page('today');
    if (!routine || qs('#ud-routine-priority-levels', routine)) return;

    const existing = home && qsa('section,div,article', home).find(el => {
      const txt = (el.textContent || '').toLowerCase();
      return txt.includes('priorit') && txt.includes('niveau');
    });

    if (existing && existing.parentNode) {
      existing.id = 'ud-routine-priority-levels';
      routine.insertBefore(existing, routine.firstChild);
      return;
    }

    const block = document.createElement('div');
    block.id = 'ud-routine-priority-levels';
    block.className = 'card u20-panel';
    block.innerHTML = [
      '<h3>Priorités routine</h3>',
      '<p><b style="color:#ef4444">Niveau 1</b> · obligatoire.</p>',
      '<p><b style="color:#f59e0b">Niveau 2</b> · important.</p>',
      '<p><b style="color:#22c55e">Niveau 3</b> · bonus.</p>'
    ].join('');
    routine.insertBefore(block, routine.firstChild);
  }

  function mergeFlexIntoSport(){
    const sport = page('sport');
    if (!sport || qs('#ud-sport-safe-mobility', sport)) return;
    qsa('[data-tab="flex"],[data-go-tab="flex"],[data-drawer-tab="flex"]').forEach(remove);
    const flex = page('flex');
    if (flex) flex.style.display = 'none';

    const block = document.createElement('div');
    block.id = 'ud-sport-safe-mobility';
    block.className = 'card u20-panel';
    block.innerHTML = [
      '<h3>Sport + souplesse intégrée</h3>',
      '<p><b>Cervicales :</b> pas de split squat à la barre, pas de charge qui comprime la nuque.</p>',
      '<ul>',
      '<li>Pull/dos : tractions ou assistées obligatoires.</li>',
      '<li>Jambes : presse, leg curl, extension, step-up, fentes haltères légères.</li>',
      '<li>Mobilité : cou doux, thoracique, hanches, ischios, respiration.</li>',
      '</ul>'
    ].join('');
    sport.appendChild(block);
  }

  function nutritionInRoutine(){
    const routine = page('routine');
    if (!routine || qs('#ud-routine-nutrition-tracker', routine)) return;
    const nutrition = page('nutrition');
    if (nutrition) {
      removeByText(nutrition, [/repas/i, /plan alimentaire/i, /menu/i]);
    }

    const block = document.createElement('div');
    block.id = 'ud-routine-nutrition-tracker';
    block.className = 'card u20-panel';
    block.innerHTML = [
      '<h3>Routine · protéines / eau / suppléments</h3>',
      '<label>Protéines g <input id="ud-protein-today" type="number" min="0"></label>',
      '<label>Eau ml <input id="ud-water-today" type="number" min="0"></label>',
      '<label><input id="ud-supps-today" type="checkbox"> Suppléments pris</label>',
      '<button id="ud-save-nutrition-day" type="button">Sauver</button>',
      '<div id="ud-nutrition-save-status"></div>'
    ].join('');
    routine.appendChild(block);
    bindNutrition(block);
  }

  function todayKey(){ return new Date().toISOString().slice(0, 10); }

  function bindNutrition(root){
    const all = getStore(DAILY_KEY, {});
    const day = all[todayKey()] || {};
    qs('#ud-protein-today', root).value = day.protein || '';
    qs('#ud-water-today', root).value = day.water || '';
    qs('#ud-supps-today', root).checked = Boolean(day.supps);
    qs('#ud-save-nutrition-day', root).addEventListener('click', () => {
      const current = getStore(DAILY_KEY, {});
      current[todayKey()] = {
        protein: Number(qs('#ud-protein-today', root).value || 0),
        water: Number(qs('#ud-water-today', root).value || 0),
        supps: qs('#ud-supps-today', root).checked,
        updatedAt: new Date().toISOString()
      };
      setStore(DAILY_KEY, current);
      qs('#ud-nutrition-save-status', root).textContent = 'Sauvé';
      toast('Routine nutrition sauvée');
    });
  }

  function studyTracker(){
    const host = page('epfc') || page('study');
    if (!host || qs('#ud-study-resource-tracker', host)) return;
    const block = document.createElement('div');
    block.id = 'ud-study-resource-tracker';
    block.className = 'card u20-panel';
    block.innerHTML = [
      '<h3>Études · livres / vidéos / labs</h3>',
      '<p><b>Réparation électronique :</b> How to Diagnose and Fix Everything Electronic — Michael Jay Geier.</p>',
      '<p><b>Similaires O’Reilly :</b> Practical Electronics, Electronics All-in-One, Troubleshooting Electronic Circuits.</p>',
      '<p><b>Sécurité pratique :</b> Hack The Box Academy, PortSwigger Web Security Academy, TryHackMe, PicoCTF, OverTheWire.</p>',
      '<input id="ud-study-title" placeholder="Livre, vidéo ou lab">',
      '<select id="ud-study-type"><option value="pages">Livre/pages</option><option value="minutes">Vidéo/minutes</option><option value="labs">Labs</option></select>',
      '<input id="ud-study-total" type="number" min="1" placeholder="Total pages/min/labs">',
      '<input id="ud-study-done" type="number" min="0" placeholder="Fait pages/min/labs">',
      '<button id="ud-study-save" type="button">Sauver progression</button>',
      '<div id="ud-study-list"></div>'
    ].join('');
    host.insertBefore(block, host.firstChild);
    bindStudy(block);
  }

  function bindStudy(root){
    const render = () => {
      const list = qs('#ud-study-list', root);
      const items = getStore(STUDY_KEY, []);
      if (!items.length) { list.innerHTML = '<p>Aucune progression enregistrée.</p>'; return; }
      list.innerHTML = items.map((it, i) => {
        const total = Math.max(1, Number(it.total || 1));
        const done = Math.min(total, Math.max(0, Number(it.done || 0)));
        const pct = Math.round((done / total) * 100);
        const unit = it.type === 'minutes' ? 'min' : (it.type === 'labs' ? 'labs' : 'pages');
        return '<div class="ud-study-row"><b>' + esc(it.title) + '</b> · ' + pct + '% · reste ' +
          (total - done) + ' ' + unit + ' <button data-study-del="' + i + '">Supprimer</button></div>';
      }).join('');
    };

    qs('#ud-study-save', root).addEventListener('click', () => {
      const title = qs('#ud-study-title', root).value.trim();
      const type = qs('#ud-study-type', root).value;
      const total = Number(qs('#ud-study-total', root).value || 0);
      const done = Number(qs('#ud-study-done', root).value || 0);
      if (!title || total <= 0) { toast('Titre + total obligatoire'); return; }
      const items = getStore(STUDY_KEY, []);
      const old = items.find(x => x.title.toLowerCase() === title.toLowerCase());
      const next = { title, type, total, done, updatedAt: new Date().toISOString() };
      if (old) Object.assign(old, next); else items.unshift(next);
      setStore(STUDY_KEY, items.slice(0, 80));
      qs('#ud-study-title', root).value = '';
      qs('#ud-study-total', root).value = '';
      qs('#ud-study-done', root).value = '';
      render();
      toast('Progression étude sauvée');
    });

    root.addEventListener('click', event => {
      const btn = event.target.closest('[data-study-del]');
      if (!btn) return;
      const items = getStore(STUDY_KEY, []);
      items.splice(Number(btn.dataset.studyDel), 1);
      setStore(STUDY_KEY, items);
      render();
    });
    render();
  }

  function apply(){
    removeNavTargets();
    cleanTextNodes();
    cleanHome();
    cleanEpfc();
    cleanFinanceAndIot();
    movePrioritiesToRoutine();
    mergeFlexIntoSport();
    nutritionInRoutine();
    studyTracker();
  }

  ready(() => {
    apply();
    setTimeout(apply, 800);
    setTimeout(apply, 2400);
  });
})();
