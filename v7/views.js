import { renderToday } from './views/today.js';
import { renderHealth } from './views/health.js';
import { renderLearn } from './views/learn.js';
import { renderCulture } from './views/culture.js';
import { renderBody } from './views/body.js';
import { renderMoney } from './views/money.js';
import { renderTrading } from './views/trading.js';
import { renderReview } from './views/review.js';
import { renderSettings } from './views/settings.js';
export { renderNav, renderQuickSheet, renderCommand, renderCheckinModal, renderQuickDialog } from './views/overlays.js';

export function renderRoute(route, state) {
  const views = { today: renderToday, health: renderHealth, learn: renderLearn, culture: renderCulture, body: renderBody, money: renderMoney, trading: renderTrading, review: renderReview, settings: renderSettings };
  return (views[route] || views.today)(state);
}
