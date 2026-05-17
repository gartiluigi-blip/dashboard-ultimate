/**
 * Coach Netlify Function — version durcie + voice intent fix.
 */
const rateLimitStore = new Map();
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip, limit) {
  const now = Date.now();
  const arr = rateLimitStore.get(ip) || [];
  const recent = arr.filter(t => now - t < RATE_WINDOW_MS);
  recent.push(now);
  rateLimitStore.set(ip, recent);
  if (rateLimitStore.size > 10_000) {
    for (const [k, v] of rateLimitStore) {
      const stillRecent = v.filter(t => now - t < RATE_WINDOW_MS);
      if (stillRecent.length === 0) rateLimitStore.delete(k);
      else rateLimitStore.set(k, stillRecent);
    }
  }
  return recent.length > limit;
}

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function resolveCorsOrigin(requestOrigin) {
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) {
    if (requestOrigin && /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(requestOrigin)) return requestOrigin;
    return null;
  }
  if (allowed.includes(requestOrigin)) return requestOrigin;
  for (const a of allowed) {
    if (a.includes('*')) {
      const re = new RegExp('^' + a.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+') + '$', 'i');
      if (re.test(requestOrigin)) return requestOrigin;
    }
  }
  return null;
}

const SYSTEM_PROMPTS = {
  coach: "Tu es le coach personnel de l'utilisateur. Il a un dashboard qui track : EPFC (études), code, néerlandais, sport, souplesse, lecture, échecs, Vinted, humeur, pomodoros. Il est à Bruxelles, travaille en shifts rotatifs, prépare un bachelor dev pour sept. 2026, a une contrainte C7 (cervicales). Réponds en français, ton direct mais chaleureux, concret. Maximum 150 mots. Utilise les chiffres réels de son contexte. Si tu détectes un problème, dis-le clairement sans édulcorer.",
  analyse: "Tu es un analyste de performance personnelle. Réponds en français. Identifie les faiblesses, dérives et incohérences dans le contexte fourni. Ton direct et factuel.",
  plan: "Tu es un planificateur opérationnel. Réponds en français. Transforme le contexte en plan d'action concret pour aujourd'hui. Maximum 5 actions, ordonnées par priorité.",
  trading: "Tu es un coach trading senior, ex-prop trader. Réponds en français, ton direct, sans complaisance. Focus discipline et risk, pas hype technique.",
  voice: "Tu reçois une dictée vocale brute (transcription du navigateur, parfois imparfaite). L'utilisateur parle à son dashboard personnel. Tu dois identifier l'INTENTION et extraire les paramètres pour que le client agisse automatiquement. Modules disponibles : epfc, code, nl, ia, sport, flex, lecture, vinted, trading, chess, finance. Actions possibles : log_session, add_task, add_note, add_bookmark, question. Sois indulgent avec les fautes de transcription. Si l'intention est ambiguë, choisis l'interprétation la plus probable et mets confidence < 0.7."
};

const JSON_SCHEMA_INSTRUCTION = [
  "Tu dois répondre UNIQUEMENT en JSON valide.",
  "Aucune phrase avant ou après le JSON.",
  "Utilise exactement ce schéma :",
  '{"answer":"string","priority":"low|medium|high","focus_area":"string","next_action_title":"string","next_action_sub":"string","warning":"string"}'
].join(' ');

const VOICE_JSON_SCHEMA_INSTRUCTION = [
  "Tu dois répondre UNIQUEMENT en JSON valide.",
  "Aucune phrase avant ou après le JSON.",
  "Schéma exact :",
  '{"action":"log_session|add_task|add_note|add_bookmark|question","module":"string","duration":0,"title":"string","note":"string","priority":"low|medium|high","question":"string","confidence":0.0,"summary":"string"}'
].join(' ');

const MAX_CONTEXT_BYTES = 60 * 1024;
const MAX_QUESTION_LEN = 4000;
const MAX_TOKENS_CAP = 1000;
const ANTHROPIC_TIMEOUT_MS = 25_000;
const FORCED_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

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

const str = (v, fallback = '') => (typeof v === 'string' && v.trim()) ? v.trim() : fallback;
const clamp01 = v => Math.max(0, Math.min(1, Number(v) || 0));

function normalizeStandard(parsed, text, mode) {
  return {
    ok: true,
    mode,
    answer: str(parsed.answer, text || 'Pas de réponse.'),
    priority: ['low', 'medium', 'high'].includes(parsed.priority) ? parsed.priority : 'medium',
    focus_area: str(parsed.focus_area),
    next_action_title: str(parsed.next_action_title),
    next_action_sub: str(parsed.next_action_sub),
    warning: typeof parsed.warning === 'string' ? parsed.warning.trim() : ''
  };
}

function normalizeVoice(parsed) {
  return {
    ok: true,
    mode: 'voice',
    action: ['log_session', 'add_task', 'add_note', 'add_bookmark', 'question'].includes(parsed.action) ? parsed.action : 'question',
    module: str(parsed.module),
    duration: Math.max(0, Math.round(Number(parsed.duration) || 0)),
    title: str(parsed.title),
    note: str(parsed.note),
    priority: ['low', 'medium', 'high'].includes(parsed.priority) ? parsed.priority : 'medium',
    question: str(parsed.question),
    confidence: clamp01(parsed.confidence),
    summary: str(parsed.summary)
  };
}

exports.handler = async (event) => {
  const requestOrigin = (event.headers?.origin || event.headers?.Origin || '').trim();
  const corsOrigin = resolveCorsOrigin(requestOrigin);

  if (event.httpMethod === 'OPTIONS') {
    if (!corsOrigin) return { statusCode: 403, body: '' };
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

  if (!corsOrigin) {
    console.warn('[coach] Origin refusé :', requestOrigin || '(aucun)');
    return jsonResponse(403, { error: 'Origin not allowed' }, null);
  }
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' }, corsOrigin);

  const expectedSecret = process.env.COACH_SHARED_SECRET || '';
  if (expectedSecret) {
    const provided = (event.headers?.['x-coach-key'] || event.headers?.['X-Coach-Key'] || '').trim();
    if (provided !== expectedSecret) return jsonResponse(401, { error: 'Unauthorized' }, corsOrigin);
  }

  const ip = (event.headers?.['x-nf-client-connection-ip'] || event.headers?.['x-forwarded-for']?.split(',')[0] || event.headers?.['client-ip'] || 'unknown').trim();
  const rateLimit = Number(process.env.COACH_RATE_LIMIT_PER_MIN) || 10;
  if (isRateLimited(ip, rateLimit)) return jsonResponse(429, { error: 'Too many requests. Please wait a minute.' }, corsOrigin);

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return jsonResponse(500, { error: 'Server misconfigured' }, corsOrigin);
    if (event.body && event.body.length > 100 * 1024) return jsonResponse(413, { error: 'Body too large' }, corsOrigin);

    let payload;
    try { payload = JSON.parse(event.body || '{}'); }
    catch (_) { return jsonResponse(400, { error: 'Invalid JSON body' }, corsOrigin); }

    const question = String(payload.question || '').trim();
    if (!question) return jsonResponse(400, { error: 'Question is required' }, corsOrigin);
    if (question.length > MAX_QUESTION_LEN) return jsonResponse(413, { error: `Question too long (max ${MAX_QUESTION_LEN} chars)` }, corsOrigin);

    const context = (payload.context && typeof payload.context === 'object') ? payload.context : {};
    const contextStr = JSON.stringify(context);
    if (contextStr.length > MAX_CONTEXT_BYTES) return jsonResponse(413, { error: `Context too large (max ${MAX_CONTEXT_BYTES} bytes)` }, corsOrigin);

    const requestedMode = String(payload.mode || 'coach').trim();
    const mode = SYSTEM_PROMPTS[requestedMode] ? requestedMode : 'coach';
    const schemaInstruction = mode === 'voice' ? VOICE_JSON_SCHEMA_INSTRUCTION : JSON_SCHEMA_INSTRUCTION;
    const system = SYSTEM_PROMPTS[mode] + ' ' + schemaInstruction;
    const requestedMaxTokens = Number(payload.max_tokens);
    const maxTokens = requestedMaxTokens > 0 && requestedMaxTokens <= MAX_TOKENS_CAP ? requestedMaxTokens : 500;

    const userPrompt = [`Mode: ${mode}`, '', 'Contexte actuel :', contextStr, '', 'Question : ' + question].join('\n');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

    let res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: FORCED_MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: userPrompt }] }),
        signal: controller.signal
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') return jsonResponse(504, { error: 'Coach timeout — réessaye dans un instant' }, corsOrigin);
      console.error('[coach] Fetch error :', fetchErr);
      return jsonResponse(502, { error: 'Bad gateway' }, corsOrigin);
    }
    clearTimeout(timeoutId);

    let data;
    try { data = await res.json(); }
    catch (_) { return jsonResponse(502, { error: 'Invalid upstream response' }, corsOrigin); }

    if (!res.ok) {
      console.error('[coach] Anthropic API error', res.status, data?.error?.message);
      return jsonResponse(res.status, { error: data?.error?.message || 'Anthropic request failed' }, corsOrigin);
    }

    const text = Array.isArray(data.content)
      ? data.content.filter(block => block && block.type === 'text').map(block => block.text).join('\n\n').trim()
      : '';
    const parsed = safeParseJson(text) || {};
    const normalized = mode === 'voice' ? normalizeVoice(parsed) : normalizeStandard(parsed, text, mode);
    return jsonResponse(200, normalized, corsOrigin);
  } catch (err) {
    console.error('[coach] Unhandled error :', err);
    return jsonResponse(500, { error: 'Internal server error' }, corsOrigin);
  }
};
