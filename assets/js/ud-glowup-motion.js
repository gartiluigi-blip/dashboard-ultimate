/**
 * ud-glowup-motion.js
 * Isolated motion layer — no logic, no handlers modified.
 * Additive: aurora, grain, SVG logo, tab transition, scroll reveal,
 *           count-up, button press. All transform+opacity, 60fps.
 */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 1. Atmosphere: Aurora + Grain ─────────────────────────── */
function injectAtmosphere() {
  if (document.getElementById('ud-aurora')) return;

  const aurora = document.createElement('div');
  aurora.id = 'ud-aurora';
  document.body.prepend(aurora);

  const grain = document.createElement('div');
  grain.id = 'ud-grain';
  document.body.prepend(grain);
}

/* ── 2. SVG Logo ────────────────────────────────────────────── */
function injectLogo() {
  if (document.querySelector('.ud-logo')) return;

  const topbarLeft = document.querySelector('.topbar > div:first-child');
  if (!topbarLeft) return;

  // Create inner text-group wrapper (kicker + h1 stacked)
  const textGroup = document.createElement('div');
  textGroup.className = 'ud-text-group';

  // Move existing nodes (kicker + h1) into textGroup
  while (topbarLeft.firstChild) {
    textGroup.appendChild(topbarLeft.firstChild);
  }

  // Build SVG logo in ns
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ud-logo');
  svg.setAttribute('viewBox', '0 0 60 44');
  svg.setAttribute('width', '52');
  svg.setAttribute('height', '38');
  svg.setAttribute('aria-label', 'UD');
  svg.setAttribute('role', 'img');

  svg.innerHTML = /* svg */`
<defs>
  <linearGradient id="ud-ember-grad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%"   stop-color="#FF6B2C">
      <animate attributeName="stop-color"
        values="#FF6B2C;#FFB066;#FFD166;#FF8C42;#FF6B2C" dur="6s" repeatCount="indefinite"/>
    </stop>
    <stop offset="50%"  stop-color="#FF9040">
      <animate attributeName="stop-color"
        values="#FF9040;#FFD166;#FF6B2C;#FFB066;#FF9040" dur="6s" repeatCount="indefinite"/>
    </stop>
    <stop offset="100%" stop-color="#FFB066">
      <animate attributeName="stop-color"
        values="#FFB066;#FF6B2C;#FFB066;#FFD166;#FFB066" dur="6s" repeatCount="indefinite"/>
    </stop>
  </linearGradient>
  <filter id="ud-ember-glow" x="-28%" y="-28%" width="156%" height="156%">
    <feGaussianBlur stdDeviation="2.2" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<g fill="none" stroke="url(#ud-ember-grad)" stroke-width="3.2"
   stroke-linecap="round" stroke-linejoin="round"
   filter="url(#ud-ember-glow)">
  <path d="M4 5 L4 28 Q4 39 13.5 39 Q23 39 23 28 L23 5"/>
  <path d="M31 5 L31 39 M31 5 Q56 5 56 22 Q56 39 31 39"/>
</g>`;

  if (REDUCED) {
    // Static version — no SVG SMIL animations
    svg.querySelectorAll('animate').forEach(a => a.remove());
  }

  topbarLeft.classList.add('ud-brand');
  topbarLeft.appendChild(svg);
  topbarLeft.appendChild(textGroup);
}

/* ── 3. Scroll Reveal ───────────────────────────────────────── */
let revealIO = null;
let revealTimer = null;

function initScrollReveal() {
  if (REDUCED) return;

  revealIO = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('glow-visible');
        revealIO.unobserve(entry.target);
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -20px 0px' }
  );
}

function processReveal() {
  if (REDUCED || !revealIO) return;
  const vh = window.innerHeight;

  document.querySelectorAll('.card:not(.glow-seen)').forEach((card, i) => {
    card.classList.add('glow-seen');
    const rect = card.getBoundingClientRect();

    if (rect.top >= vh) {
      // Strictly below fold — hide and observe
      card.classList.add('glow-hidden');
      revealIO.observe(card);
    }
    // Cards in/above viewport: already visible, no class needed
  });
}

/* ── 4. Count-Up on Metrics ─────────────────────────────────── */
function countUp(el) {
  if (REDUCED || el.dataset.glowCounted) return;

  const raw = el.textContent.trim();
  // Match a leading integer/decimal, then a non-numeric suffix
  // Skip fractions (contain /) and time strings (contain :)
  const m = raw.match(/^(\d+(?:\.\d+)?)([^/:\d][\s\S]*)?$/);
  if (!m) return;

  const target = parseFloat(m[1]);
  const suffix = m[2] || '';
  if (isNaN(target) || target === 0 || target > 99999) return;

  // Skip if value looks like a fraction suffix (e.g. "8/10")
  if (raw.includes('/')) return;

  el.dataset.glowCounted = '1';
  const isInt = Number.isInteger(target);
  const duration = Math.min(1100, Math.max(360, target * 1.7));
  const t0 = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - t0) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = target * ease;
    el.textContent = (isInt ? Math.round(val) : val.toFixed(1)) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function processMetrics() {
  if (REDUCED) return;
  const vh = window.innerHeight;
  document.querySelectorAll('.metric:not([data-glow-counted])').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh && rect.bottom > 0) countUp(el);
  });
}

/* ── 5. Tab Transition ──────────────────────────────────────── */
function initTabTransition() {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  let pending = false;

  const mo = new MutationObserver(mutations => {
    // Only react to direct children being added to #app
    const added = mutations.some(m => m.addedNodes.length > 0 && m.target === appEl);
    if (!added || pending) return;

    pending = true;

    if (!REDUCED) {
      requestAnimationFrame(() => {
        appEl.classList.remove('glow-tab-in');
        requestAnimationFrame(() => {
          appEl.classList.add('glow-tab-in');
          pending = false;
        });
      });
    } else {
      pending = false;
    }

    // After animation (260ms) + buffer (60ms) — process reveals + count-ups
    if (revealTimer) clearTimeout(revealTimer);
    revealTimer = setTimeout(() => {
      // Reset glow-seen so new cards can be classified
      document.querySelectorAll('.glow-seen').forEach(c => {
        c.classList.remove('glow-seen', 'glow-hidden', 'glow-visible');
      });
      processReveal();
      processMetrics();
    }, 320);
  });

  mo.observe(appEl, { childList: true });
}

/* ── 6. Button Press ────────────────────────────────────────── */
function initButtonPress() {
  if (REDUCED) return;

  document.addEventListener('pointerdown', e => {
    const btn = e.target.closest('.btn, button.btn, .fuel-chip, .fuel-pill, .tab, .subtab');
    if (!btn) return;
    btn.classList.add('glow-pressed');
    const up = () => btn.classList.remove('glow-pressed');
    btn.addEventListener('pointerup',     up, { once: true });
    btn.addEventListener('pointercancel', up, { once: true });
    btn.addEventListener('pointerleave',  up, { once: true });
  }, { passive: true });
}

/* ── Boot ───────────────────────────────────────────────────── */
function boot() {
  injectAtmosphere();
  injectLogo();
  initScrollReveal();
  initTabTransition();
  initButtonPress();

  // Initial metrics pass after app.js first render settles
  setTimeout(() => {
    processReveal();
    processMetrics();
  }, 200);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
