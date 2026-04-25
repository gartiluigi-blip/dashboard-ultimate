'use strict';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body)
  };
}

function safeJsonParse(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    const err = new Error('Invalid JSON body');
    err.statusCode = 400;
    throw err;
  }
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function limitString(value, max = 2000) {
  const s = String(value ?? '');
  if (s.length <= max) return s;
  return s.slice(0, max) + 'â€¦[truncated]';
}

function compactContext(value, budget = 24000) {
  const seen = new WeakSet();
  const cleaned = JSON.stringify(value ?? {}, (key, val) => {
    if (typeof val === 'string') return limitString(val, 700);
    if (typeof val === 'function' || typeof val === 'undefined') return undefined;
    if (val && typeof val === 'object') {
      if (seen.has(val)) return '[circular]';
      seen.add(val);
    }
    return val;
  });

  if (!cleaned) return '{}';
  if (cleaned.length <= budget) return cleaned;
  return cleaned.slice(0, budget) + 'â€¦[context_truncated]';
}

function extractJsonObject(raw) {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_) {}

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch (_) {}
  }

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch (_) {}
  }

  return null;
}

function normalizePriority(value) {
  const raw = String(value || '').toLowerCase().trim();

  if (['urgent', 'critical', 'critique', 'p0', 'p1', 'haute', 'high'].includes(raw)) {
    return {
      priority: 'high',
      priority_level: raw === 'p0' || raw === 'critical' || raw === 'critique' || raw === 'urgent' ? 'critical' : 'important',
      priority_label: raw === 'p0' || raw === 'critical' || raw === 'critique' || raw === 'urgent' ? 'Critique' : 'Important',
      priority_color: '#f87171',
      priority_rank: raw === 'p0' || raw === 'critical' || raw === 'critique' || raw === 'urgent' ? 1 : 2
    };
  }

  if (['medium', 'normal', 'moyen', 'moyenne', 'p2'].includes(raw)) {
    return {
      priority: 'medium',
      priority_level: 'normal',
      priority_label: 'Normal',
      priority_color: '#6aa5fa',
      priority_rank: 3
    };
  }

  if (['low', 'faible', 'bas', 'p3', 'p4'].includes(raw)) {
    return {
      priority: 'low',
      priority_level: 'low',
      priority_label: 'Faible',
      priority_color: '#34d399',
      priority_rank: 4
    };
  }

  return {
    priority: 'medium',
    priority_level: 'normal',
    priority_label: 'Normal',
    priority_color: '#6aa5fa',
    priority_rank: 3
  };
}

function detectPriorityFromText(text) {
  const t = String(text || '').toLowerCase();
  if (/\b(urgent|critique|p0|p1|prioritÃ© absolue|grave|immÃ©diat|bloquant)\b/.test(t)) return 'urgent';
  if (/\b(important|haute prioritÃ©|prioritaire|p2)\b/.test(t)) return 'high';
  if (/\b(faible|pas urgent|quand tu peux|low|p3|p4)\b/.test(t)) return 'low';
  return 'medium';
}

function detectIntent(question) {
  const q = String(question || '').toLowerCase().trim();
  const priority = normalizePriority(detectPriorityFromText(q));

  const wantsTask = /\b(task|tÃ¢che|todo|to-do|rappel|rappelle|mets|ajoute|crÃ©e|cree|planifie)\b/.test(q);
  const wantsRoutineUpdate = /\b(valide|fait|terminÃ©|termine|j'ai fini|plus tÃ´t|plus tot|avance|recalcule|routine)\b/.test(q);
  const wantsDelete = /\b(supprime|efface|retire|delete|remove|dÃ©sactive|desactive)\b/.test(q);

  let due_text = '';
  if (/demain/.test(q)) due_text = 'demain';
  else if (/aujourd'hui|ce soir|cet aprem|cette aprÃ¨s-midi/.test(q)) due_text = "aujourd'hui";
  else if (/dans\s+\d+\s*(min|minute|minutes|h|heure|heures)/.test(q)) {
    due_text = q.match(/dans\s+\d+\s*(?:min|minute|minutes|h|heure|heures)/)?.[0] || '';
  } else if (/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/.test(q)) {
    due_text = q.match(/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/)?.[0] || '';
  }

  return {
    intent: wantsDelete ? 'delete_or_disable' : wantsTask ? 'create_task' : wantsRoutineUpdate ? 'routine_update' : 'coach_answer',
    should_create_task: wantsTask,
    should_update_routine: wantsRoutineUpdate,
    should_delete_or_disable: wantsDelete,
    task: wantsTask ? {
      title: limitString(question, 120),
      due_text,
      priority: priority.priority,
      priority_level: priority.priority_level,
      status: 'draft_requires_frontend_confirmation'
    } : null,
    routine_update: wantsRoutineUpdate ? {
      status: 'draft_requires_frontend_confirmation',
      instruction: limitString(question, 160)
    } : null,
    ...priority
  };
}

function normalizeResponse(parsed, rawText, mode, detected, startedAt) {
  const priorityInfo = normalizePriority(parsed?.priority || detected.priority);

  return {
    ok: true,
    mode,
    answer: typeof parsed?.answer === 'string' && parsed.answer.trim()
      ? parsed.answer.trim()
      : rawText || 'Pas de rÃ©ponse.',
    priority: priorityInfo.priority,
    priority_level: parsed?.priority_level || priorityInfo.priority_level,
    priority_label: parsed?.priority_label || priorityInfo.priority_label,
    priority_color: parsed?.priority_color || priorityInfo.priority_color,
    priority_rank: Number(parsed?.priority_rank) || priorityInfo.priority_rank,
    focus_area: typeof parsed?.focus_area === 'string' ? parsed.focus_area.trim() : '',
    intent: typeof parsed?.intent === 'string' ? parsed.intent.trim() : detected.intent,
    next_action_title: typeof parsed?.next_action_title === 'string' ? parsed.next_action_title.trim() : '',
    next_action_sub: typeof parsed?.next_action_sub === 'string' ? parsed.next_action_sub.trim() : '',
    warning: typeof parsed?.warning === 'string' ? parsed.warning.trim() : '',
    should_create_task: Boolean(parsed?.should_create_task ?? detected.should_create_task),
    should_update_routine: Boolean(parsed?.should_update_routine ?? detected.should_update_routine),
    should_delete_or_disable: Boolean(parsed?.should_delete_or_disable ?? detected.should_delete_or_disable),
    task: parsed?.task && typeof parsed.task === 'object' ? { ...detected.task, ...parsed.task } : detected.task,
    routine_update: parsed?.routine_update && typeof parsed.routine_update === 'object'
      ? { ...detected.routine_update, ...parsed.routine_update }
      : detected.routine_update,
    server_ms: Date.now() - startedAt
  };
}

exports.handler = async (event) => {
  const startedAt = Date.now();

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return json(500, {
        ok: false,
        error: 'ANTHROPIC_API_KEY is missing on the server',
        action_required: 'Netlify > Site configuration > Environment variables > add ANTHROPIC_API_KEY > redeploy.'
      });
    }

    const payload = safeJsonParse(event.body || '{}');
    const question = limitString(payload.question, 2200).trim();
    const context = payload.context || {};
    const mode = limitString(payload.mode || 'coach', 40).trim() || 'coach';

    if (!question) {
      return json(400, { ok: false, error: 'Question is required' });
    }

    const detected = detectIntent(question);

    const fallbackPrompts = {
      coach: "Tu es le coach personnel de l'utilisateur. RÃ©ponds en franÃ§ais. Ton direct, concret, utile. Tu transformes les demandes floues en actions simples.",
      analyse: "Tu es un analyste de performance personnelle. RÃ©ponds en franÃ§ais. Identifie les faiblesses, dÃ©rives, blocages, incohÃ©rences et prioritÃ©s.",
      plan: "Tu es un planificateur opÃ©rationnel. RÃ©ponds en franÃ§ais. Transforme le contexte en plan d'action concret pour aujourd'hui.",
      command: "Tu es un parseur de commandes pour dashboard personnel. Tu extrais intention, prioritÃ©, tÃ¢che, date relative et action Ã  confirmer."
    };

    const systemBase = limitString(
      payload.systemPrompt || fallbackPrompts[mode] || fallbackPrompts.coach,
      5000
    );

    const schema = {
      answer: 'string',
      priority: 'low|medium|high',
      priority_level: 'critical|important|normal|low',
      priority_label: 'Critique|Important|Normal|Faible',
      priority_color: 'hex color string',
      priority_rank: '1|2|3|4',
      focus_area: 'string',
      intent: 'coach_answer|create_task|routine_update|delete_or_disable|other',
      should_create_task: 'boolean',
      should_update_routine: 'boolean',
      should_delete_or_disable: 'boolean',
      task: {
        title: 'string',
        due_text: 'string',
        priority: 'low|medium|high',
        priority_level: 'critical|important|normal|low',
        status: 'draft_requires_frontend_confirmation|none'
      },
      routine_update: {
        instruction: 'string',
        status: 'draft_requires_frontend_confirmation|none'
      },
      next_action_title: 'string',
      next_action_sub: 'string',
      warning: 'string'
    };

    const system = [
      systemBase,
      'RÃ©ponds UNIQUEMENT en JSON valide. Aucune phrase avant. Aucune phrase aprÃ¨s.',
      'Respecte ce schÃ©ma, sans markdown :',
      JSON.stringify(schema),
      'RÃ¨gles prioritÃ© : high pour critique/important, medium pour normal, low pour faible.',
      'Si la demande implique crÃ©er une tÃ¢che, remplis should_create_task=true et task, mais indique que confirmation frontend est requise.',
      'Si la demande implique valider/avancer/recalculer la routine, remplis should_update_routine=true et routine_update.',
      'Si la demande implique suppression/dÃ©sactivation, remplis should_delete_or_disable=true et warning.',
      'RÃ©ponse franÃ§aise, directe, opÃ©rationnelle. Pas de blabla.'
    ].join(' ');

    const userPrompt = [
      `Mode: ${mode}`,
      `Intentions dÃ©tectÃ©es cÃ´tÃ© serveur: ${JSON.stringify(detected)}`,
      '',
      'Contexte actuel compact:',
      compactContext(context),
      '',
      'Question utilisateur:',
      question
    ].join('\n');

    const model =
      process.env.ANTHROPIC_MODEL ||
      (payload.allow_model_override ? payload.model : '') ||
      'claude-sonnet-4-6';

    const maxTokens = clampNumber(payload.max_tokens, 120, 900, 500);
    const temperature = clampNumber(payload.temperature, 0, 1, 0.2);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);

    let res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return json(res.status, {
        ok: false,
        error: data?.error?.message || 'Anthropic request failed',
        type: data?.error?.type || 'anthropic_error',
        model,
        server_ms: Date.now() - startedAt
      });
    }

    const text = Array.isArray(data.content)
      ? data.content
          .filter(block => block && block.type === 'text')
          .map(block => block.text)
          .join('\n\n')
          .trim()
      : '';

    const parsed = extractJsonObject(text) || {};
    return json(200, normalizeResponse(parsed, text, mode, detected, startedAt));
  } catch (err) {
    const isAbort = err && err.name === 'AbortError';
    const statusCode = err.statusCode || (isAbort ? 504 : 500);
    return json(statusCode, {
      ok: false,
      error: isAbort ? 'Anthropic timeout after 28s' : (err.message || 'Unknown server error'),
      server_ms: Date.now() - startedAt
    });
  }
};
