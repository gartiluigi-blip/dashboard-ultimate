export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'style') n.setAttribute('style', v);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).filter(x => x !== null && x !== undefined).forEach(c => n.append(c?.nodeType ? c : document.createTextNode(c)));
  return n;
}
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}
export function card(title, body = '', cls = '') {
  const c = el('section', { class: 'card ' + cls });
  c.append(el('h2', {}, title));
  if (body) c.append(el('div', { class: 'muted' }, body));
  return c;
}
export function subTabs(items, active, onClick) {
  const w = el('div', { class: 'subtabs' });
  items.forEach(it => w.append(el('button', { class: 'subtab ' + (it.id === active ? 'active' : ''), onclick: () => onClick(it.id) }, it.label)));
  return w;
}
