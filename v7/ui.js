import { clamp, euro, num } from './engine.js';

export const esc = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
export const attr = esc;
export const checked = value => value ? 'checked' : '';
export const selected = (value, current) => value === current ? 'selected' : '';
export const formatDate = value => {
  if (!value) return '—';
  try { return new Intl.DateTimeFormat('fr-BE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)); }
  catch { return value; }
};
export const formatTime = seconds => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, '0')}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`;

export function icon(name, label = '') {
  const paths = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    spark: '<path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/>',
    edit: '<path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z"/><path d="m13.5 6.5 3.5 3.5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>',
    download: '<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/>',
    upload: '<path d="M12 16V4m0 0 5 5m-5-5L7 9M5 21h14"/>',
    undo: '<path d="M9 7 4 12l5 5M5 12h8a6 6 0 1 1 0 12"/>'
  };
  return `<svg class="i" viewBox="0 0 24 24" aria-hidden="${label ? 'false' : 'true'}" ${label ? `aria-label="${esc(label)}"` : ''}>${paths[name] || paths.spark}</svg>`;
}

export function button(label, action, variant = '', attrs = '', iconName = '') {
  return `<button type="button" class="button ${variant}" data-action="${attr(action)}" ${attrs}>${iconName ? icon(iconName) : ''}<span>${esc(label)}</span></button>`;
}
export function iconButton(label, action, iconName, attrs = '') {
  return `<button type="button" class="icon-button" data-action="${attr(action)}" aria-label="${attr(label)}" title="${attr(label)}" ${attrs}>${icon(iconName, label)}</button>`;
}
export function routeButton(label, route, variant = '', iconName = '') {
  return button(label, 'navigate', variant, `data-route="${attr(route)}"`, iconName);
}
export function badge(text, tone = '') { return `<span class="badge ${tone}">${esc(text)}</span>`; }
export function panel(title, body, options = {}) {
  const { className = '', eyebrow = '', actions = '', id = '' } = options;
  return `<section class="panel ${className}" ${id ? `id="${attr(id)}"` : ''}><header class="panel-header"><div>${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}<h2>${esc(title)}</h2></div>${actions ? `<div class="panel-actions">${actions}</div>` : ''}</header>${body}</section>`;
}
export function metric(label, value, detail = '', tone = '', iconText = '') {
  return `<article class="metric ${tone}">${iconText ? `<span class="metric-icon">${esc(iconText)}</span>` : ''}<div><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></div></article>`;
}
export function progress(value, label = '', detail = '', tone = '') {
  const score = Math.round(clamp(value));
  return `<div class="progress-block ${tone}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${score}"><div class="progress-label"><span>${esc(label)}</span><b>${score}%</b></div><div class="progress-track"><i style="width:${score}%"></i></div>${detail ? `<small>${esc(detail)}</small>` : ''}</div>`;
}
export function empty(text, action = '') { return `<div class="empty-state"><span>◇</span><p>${esc(text)}</p>${action}</div>`; }
export function formField(label, input, hint = '') { return `<label class="field"><span>${esc(label)}</span>${input}${hint ? `<small>${esc(hint)}</small>` : ''}</label>`; }
export function numberInput(id, value, min = 0, max = 100000, step = 1, attrs = '') { return `<input id="${attr(id)}" type="number" value="${attr(value)}" min="${min}" max="${max}" step="${step}" ${attrs}>`; }
export function textInput(id, value = '', placeholder = '', attrs = '') { return `<input id="${attr(id)}" value="${attr(value)}" placeholder="${attr(placeholder)}" ${attrs}>`; }
export function textarea(id, value = '', placeholder = '', rows = 3) { return `<textarea id="${attr(id)}" rows="${rows}" placeholder="${attr(placeholder)}">${esc(value)}</textarea>`; }
export function selectInput(id, options, current) { return `<select id="${attr(id)}">${options.map(([value, label]) => `<option value="${attr(value)}" ${selected(value, current)}>${esc(label)}</option>`).join('')}</select>`; }
export function moneyValue(value) { return euro(value); }
export function scoreRing(value, label) {
  const score = Math.round(clamp(value));
  return `<div class="score-ring" style="--score:${score}"><div><strong>${score}</strong><span>${esc(label)}</span></div></div>`;
}
export function skeleton(count = 3) { return `<div class="skeleton-stack">${Array.from({ length: count }, () => '<i></i>').join('')}</div>`; }
export function toastHtml(message, tone = '') { return `<div class="toast-content ${tone}">${esc(message)}</div>`; }
export function row(label, value, detail = '', action = '') { return `<div class="data-row"><div><b>${esc(label)}</b>${detail ? `<small>${esc(detail)}</small>` : ''}</div><div class="row-end"><strong>${esc(value)}</strong>${action}</div></div>`; }
export function transactionRow(item, deleteAction = '') {
  const sign = item.type === 'income' ? '+' : '-';
  const tone = item.type === 'income' ? 'positive' : item.type === 'saving' ? 'saving' : 'negative';
  return `<div class="data-row transaction ${tone}"><div><b>${esc(item.category || 'Autre')}</b><small>${esc(item.date || '')}${item.note ? ` · ${esc(item.note)}` : ''}</small></div><div class="row-end"><strong>${sign}${euro(item.amount)}</strong>${deleteAction}</div></div>`;
}
export function fieldGrid(fields, className = '') { return `<div class="field-grid ${className}">${fields.join('')}</div>`; }
export function valueOrDash(value, suffix = '') { return num(value) ? `${num(value)}${suffix}` : '—'; }
