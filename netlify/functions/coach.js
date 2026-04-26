/**
 * Coach Netlify Function — version durcie (audit Apr 2026).
 *
 * Améliorations vs version précédente :
 *  - CORS allowlist (au lieu de '*')
 *  - Shared secret optionnel (si défini en env, requis pour appeler)
 *  - Rate limit in-memory par IP (10 req/min)
 *  - System prompt FORCÉ côté serveur (le client ne peut plus injecter)
 *  - Model FORCÉ côté serveur (le client ne peut plus forcer Opus)
 *  - max_tokens cappé à 1000
 *  - Context cappé à 60 KB (sinon 413)
 *  - Timeout 25s sur l'appel Anthropic via AbortController
 *  - console.error() partout pour avoir des logs Netlify
 *  - Headers de sécurité sur toutes les réponses
 *
 * Variables d'env attendues (Netlify → Site settings → Env vars) :
 *   - ANTHROPIC_API_KEY        (obligatoire)            : ta clé sk-ant-...
 *   - ALLOWED_ORIGINS          (recommandé)             : "https://ultimatedashboard.netlify.app,https://ultimatedashboard.netlify.app"
 *                                                         (Netlify peut aussi déployer sur deploy-preview-X-…netlify.app)
 *                                                         Si non défini, fallback sur l'origin Netlify détectée (moins safe).
 *   - COACH_SHARED_SECRET      (très recommandé)        : une string random partagée entre client et serveur.
 *                                                         Le client doit la passer en header `x-coach-key`.
 *                                                         Si non défini, l'auth secret est désactivée (mode legacy).
 *   - ANTHROPIC_MODEL          (optionnel)              : override server-side du modèle. Default: claude-sonnet-4-6
 *   - COACH_RATE_LIMIT_PER_MIN (optionnel)              : limite par IP/minute. Default: 10
 */

// ─────────────────────────────────────────────────────────────
// Rate limiter in-memory.
// Limite : N requêtes / 60s par IP. Reset à chaque cold start (ok pour un usage perso).
// Pour une vraie persistence multi-instance, migrer vers Netlify Blobs.
// ─────────────────────────────────────────────────────────────
const rateLimitStore = new Map(); // ip -> [timestamps]
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip, limit) {
  const now = Date.now();
  const arr = rateLimitStore.get(ip) || [];
  const recent = arr.filter(t => now - t < RATE_WINDOW_MS);
  recent.push(now);
  rateLimitStore.set(ip, recent);

  // GC périodique : si la map dépasse 10000 IPs, on vide les vieilles entrées
  if (rateLimitStore.size > 10_000) {
    for (const [k, v] of rateLimitStore) {
      const stillRecent = v.filter(t => now - t < RATE_WINDOW_MS);
      if (stillRecent.length === 0) rateLimitStore.delete(k);
      else rateLimitStore.set(k, stillRecent);
    }
  }

  return recent.length > limit;
}

// ─────────────────────────────────────────────────────────────
// CORS / Origin handling
// ─────────────────────────────────────────────────────────────
function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function resolveCorsOrigin(requestOrigin) {
  const allowed = getAllowedOrigins();

  // Si rien de configuré, on autorise UNIQUEMENT le domaine Netlify détecté.
  // C'est moins safe mais évite de tout casser si la var d'env n'est pas encore définie.
  if (allowed.length === 0) {
    if (requestOrigin && /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(requestOrigin)) {
      return requestOrigin;
    }
    return null; // pas d'origin connu → on bloque
  }

  // Match exact OU pattern "https://*.netlify.app" pour deploy previews
  if (allowed.includes(requestOrigin)) return requestOrigin;

  for (const a of allowed) {
    if (a.includes('*')) {
      const re = new RegExp('^' + a.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+') + '$', 'i');
      if (re.test(requestOrigin)) return requestOrigin;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// System prompts — FORCÉS côté serveur (le client ne peut PAS les changer)
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  coach: "Tu es le coach personnel de l'utilisateur. Il a un dashboard qui track : EPFC (études), code, néerlandais, sport, souplesse, lecture, échecs, Vinted, humeur, pomodoros. Il est à Bruxelles, travaille en shifts rotatifs, prépare un bachelor dev pour sept. 2026, a une contrainte C7 (cervicales). Réponds en français, ton direct mais chaleureux, concret. Maximum 150 mots. Utilise les chiffres réels de son contexte. Si tu détectes un problème, dis-le clairement sans édulcorer.",
  analyse: "Tu es un analyste de performance personnelle. Réponds en français. Identifie les faiblesses, dérives et incohérences dans le contexte fourni. Ton direct et factuel.",
  plan: "Tu es un planificateur opérationnel. Réponds en français. Transforme le contexte en plan d'action concret pour aujourd'hui. Maximum 5 actions, ordonnées par priorité.",
  trading: "Tu es un coach trading senior, ex-prop trader. Réponds en français, ton direct, sans complaisance. Focus discipline et risk, pas hype technique."
};

const JSON_SCHEMA_INSTRUCTION = [
  "Tu dois répondre UNIQUEMENT en JSON valide.",
  "Aucune phrase avant ou après le JSON.",
  "Utilise exactement ce schéma :",
  '{"answer":"string","priority":"low|medium|high","focus_area":"string","next_action_title":"string","next_action_sub":"string","warning":"string"}',
  "answer = réponse utile et concrète en français.",
  "priority = low ou medium ou high.",
  "focus_area = domaine principal à cibler.",
  "next_action_title = action courte.",
  "next_action_sub = détail court et concret.",
  "warning = danger principal ou dérive principale. Si rien à signaler, mets une chaîne vide."
].join(' ');

// ─────────────────────────────────────────────────────────────
// Limites
// ─────────────────────────────────────────────────────────────
const MAX_CONTEXT_BYTES = 60 * 1024;       // 60 KB
const MAX_QUESTION_LEN = 4000;             // 4k chars
const MAX_TOKENS_CAP = 1000;
const ANTHROPIC_TIMEOUT_MS = 25_000;       // 25s (Netlify free tier = 10s, pro = 26s)
const FORCED_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

// ─────────────────────────────────────────────────────────────
// Réponse helper
// ─────────────────────────────────────────────────────────────
function jsonResponse(statusCode, body, corsOrigin) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': corsOrigin || 'null',
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer'
    },
    body: JSON.stringify(body)
  };
}

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const requestOrigin = (event.headers?.origin || event.headers?.Origin || '').trim();
  const corsOrigin = resolveCorsOrigin(requestOrigin);

  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    if (!corsOrigin) {
      // Origin pas autorisé → on refuse même le preflight
      return { statusCode: 403, body: '' };
    }
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type, x-coach-key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '600',
        'Vary': 'Origin'
      }
    };
  }

  // Réponse pour origin pas autorisé sur tout autre method
  if (!corsOrigin) {
    console.warn('[coach] Origin refusé :', requestOrigin || '(aucun)');
    return jsonResponse(403, { error: 'Origin not allowed' }, null);
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' }, corsOrigin);
  }

  // Shared secret (si configuré)
  const expectedSecret = process.env.COACH_SHARED_SECRET || '';
  if (expectedSecret) {
    const provided = (event.headers?.['x-coach-key'] || event.headers?.['X-Coach-Key'] || '').trim();
    if (provided !== expectedSecret) {
      console.warn('[coach] Mauvais ou manquant x-coach-key (origin:', requestOrigin, ')');
      return jsonResponse(401, { error: 'Unauthorized' }, corsOrigin);
    }
  }

  // Rate limit par IP
  const ip = (event.headers?.['x-nf-client-connection-ip']
           || event.headers?.['x-forwarded-for']?.split(',')[0]
           || event.headers?.['client-ip']
           || 'unknown').trim();
  const rateLimit = Number(process.env.COACH_RATE_LIMIT_PER_MIN) || 10;
  if (isRateLimited(ip, rateLimit)) {
    console.warn('[coach] Rate limited IP :', ip);
    return jsonResponse(429, {
      error: 'Too many requests. Please wait a minute.'
    }, corsOrigin);
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[coach] ANTHROPIC_API_KEY manquant en env');
      return jsonResponse(500, { error: 'Server misconfigured' }, corsOrigin);
    }

    // Body size check
    if (event.body && event.body.length > 100 * 1024) {
      return jsonResponse(413, { error: 'Body too large' }, corsOrigin);
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (_) {
      return jsonResponse(400, { error: 'Invalid JSON body' }, corsOrigin);
    }

    const question = String(payload.question || '').trim();
    if (!question) {
      return jsonResponse(400, { error: 'Question is required' }, corsOrigin);
    }
    if (question.length > MAX_QUESTION_LEN) {
      return jsonResponse(413, { error: `Question too long (max ${MAX_QUESTION_LEN} chars)` }, corsOrigin);
    }

    const context = (payload.context && typeof payload.context === 'object') ? payload.context : {};
    const contextStr = JSON.stringify(context);
    if (contextStr.length > MAX_CONTEXT_BYTES) {
      return jsonResponse(413, { error: `Context too large (max ${MAX_CONTEXT_BYTES} bytes)` }, corsOrigin);
    }

    // Mode whitelist (le client ne peut PAS injecter un prompt arbitraire)
    const requestedMode = String(payload.mode || 'coach').trim();
    const mode = SYSTEM_PROMPTS[requestedMode] ? requestedMode : 'coach';
    const systemBase = SYSTEM_PROMPTS[mode];
    const system = systemBase + ' ' + JSON_SCHEMA_INSTRUCTION;

    // max_tokens cappé
    const requestedMaxTokens = Number(payload.max_tokens);
    const maxTokens = (requestedMaxTokens > 0 && requestedMaxTokens <= MAX_TOKENS_CAP)
      ? requestedMaxTokens
      : 500;

    const userPrompt = [
      `Mode: ${mode}`,
      '',
      'Contexte actuel :',
      contextStr,
      '',
      'Question : ' + question
    ].join('\n');

    // Appel Anthropic avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

    let res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: FORCED_MODEL,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: userPrompt }]
        }),
        signal: controller.signal
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        console.error('[coach] Anthropic timeout après', ANTHROPIC_TIMEOUT_MS, 'ms');
        return jsonResponse(504, { error: 'Coach timeout — réessaye dans un instant' }, corsOrigin);
      }
      console.error('[coach] Fetch error :', fetchErr);
      return jsonResponse(502, { error: 'Bad gateway' }, corsOrigin);
    }
    clearTimeout(timeoutId);

    let data;
    try {
      data = await res.json();
    } catch (_) {
      console.error('[coach] Anthropic réponse non-JSON, status', res.status);
      return jsonResponse(502, { error: 'Invalid upstream response' }, corsOrigin);
    }

    if (!res.ok) {
      console.error('[coach] Anthropic API error', res.status, data?.error?.message);
      // Ne PAS forwarder le payload Anthropic brut — peut leaker des détails internes
      return jsonResponse(res.status, {
        error: data?.error?.message || 'Anthropic request failed'
      }, corsOrigin);
    }

    const text = Array.isArray(data.content)
      ? data.content
          .filter(block => block && block.type === 'text')
          .map(block => block.text)
          .join('\n\n')
          .trim()
      : '';

    function safeParseJson(raw) {
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (_) {}
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        try { return JSON.parse(raw.slice(start, end + 1)); } catch (_) {}
      }
      return null;
    }

    const parsed = safeParseJson(text) || {};
    const str = (v, fallback = '') =>
      (typeof v === 'string' && v.trim()) ? v.trim() : fallback;

    const normalized = {
      ok: true,
      mode,
      answer: str(parsed.answer, text || 'Pas de réponse.'),
      priority: ['low', 'medium', 'high'].includes(parsed.priority) ? parsed.priority : 'medium',
      focus_area: str(parsed.focus_area),
      next_action_title: str(parsed.next_action_title),
      next_action_sub: str(parsed.next_action_sub),
      warning: typeof parsed.warning === 'string' ? parsed.warning.trim() : ''
    };

    return jsonResponse(200, normalized, corsOrigin);

  } catch (err) {
    console.error('[coach] Unhandled error :', err);
    return jsonResponse(500, { error: 'Internal server error' }, corsOrigin);
  }
};
chore: harden coach function (CORS allowlist)
