'use strict';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

function response(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0'
    },
    body: JSON.stringify(body)
  };
}

function safeParseBody(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    const err = new Error('Invalid JSON body');
    err.statusCode = 400;
    throw err;
  }
}

function limitText(value, maxLength) {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...[truncated]';
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function normalizePriority(value) {
  const raw = String(value || '').toLowerCase();

  if (
    raw.includes('urgent') ||
    raw.includes('critique') ||
    raw.includes('critical') ||
    raw.includes('p0') ||
    raw.includes('p1') ||
    raw.includes('grave') ||
    raw.includes('bloquant') ||
    raw.includes('immediat')
  ) {
    return {
      priority: 'high',
      priority_level: 'critical',
      priority_label: 'Critique',
      priority_color: '#f87171',
      priority_rank: 1
    };
  }

  if (
    raw.includes('important') ||
    raw.includes('prioritaire') ||
    raw.includes('haute') ||
    raw.includes('high') ||
    raw.includes('p2')
  ) {
    return {
      priority: 'high',
      priority_level: 'important',
      priority_label: 'Important',
      priority_color: '#fbbf24',
      priority_rank: 2
    };
  }

  if (
    raw.includes('faible') ||
    raw.includes('pas urgent') ||
    raw.includes('low') ||
    raw.includes('p3') ||
    raw.includes('p4')
  ) {
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

function detectDueText(text) {
  const q = String(text || '').toLowerCase();

  if (q.includes('demain')) return 'demain';
  if (q.includes("aujourd'hui")) return "aujourd'hui";
  if (q.includes('ce soir')) return 'ce soir';
  if (q.includes('cet aprem')) return 'cet aprem';

  const relativeMatch = q.match(/dans\s+\d+\s*(min|minute|minutes|h|heure|heures)/);
  if (relativeMatch) return relativeMatch[0];

  const dayMatch = q.match(/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/);
  if (dayMatch) return dayMatch[0];

  return '';
}

function detectIntent(question) {
  const q = String(question || '').toLowerCase();
  const priorityInfo = normalizePriority(q);

  const shouldCreateTask =
    /\b(task|tache|todo|to-do|rappel|rappelle|mets|ajoute|cree|creer|planifie)\b/.test(q);

  const shouldUpdateRoutine =
    /\b(valide|fait|termine|fini|plus tot|avance|recalcule|routine)\b/.test(q);

  const shouldDeleteOrDisable =
    /\b(supprime|efface|retire|delete|remove|desactive|desactiver)\b/.test(q);

  let intent = 'coach_answer';
  if (shouldDeleteOrDisable) intent = 'delete_or_disable';
  else if (shouldCreateTask) intent = 'create_task';
  else if (shouldUpdateRoutine) intent = 'routine_update';

  return {
    intent: intent,
    should_create_task: shouldCreateTask,
    should_update_routine: shouldUpdateRoutine,
    should_delete_or_disable: shouldDeleteOrDisable,
    task: shouldCreateTask
      ? {
          title: limitText(question, 140),
          due_text: detectDueText(question),
          priority: priorityInfo.priority,
          priority_level: priorityInfo.priority_level,
          priority_label: priorityInfo.priority_label,
          priority_color: priorityInfo.priority_color,
          priority_rank: priorityInfo.priority_rank,
          status: 'draft_requires_frontend_confirmation'
        }
      : null,
    routine_update: shouldUpdateRoutine
      ? {
          instruction: limitText(question, 180),
          status: 'draft_requires_frontend_confirmation'
        }
      : null,
    ...priorityInfo
  };
}

function extractJsonObject(rawText) {
  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch (_) {}

  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch (_) {}
  }

  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(rawText.slice(start, end + 1));
    } catch (_) {}
  }

  return null;
}

function normalizeFinalAnswer(parsed, rawText, mode, detected, startedAt) {
  const priorityInfo = normalizePriority(
    parsed && parsed.priority ? parsed.priority : detected.priority
  );

  return {
    ok: true,
    version: 'v38-direct',
    mode: mode,
    answer:
      parsed && typeof parsed.answer === 'string' && parsed.answer.trim()
        ? parsed.answer.trim()
        : rawText || 'Pas de reponse.',
    priority: priorityInfo.priority,
    priority_level:
      parsed && parsed.priority_level ? parsed.priority_level : priorityInfo.priority_level,
    priority_label:
      parsed && parsed.priority_label ? parsed.priority_label : priorityInfo.priority_label,
    priority_color:
      parsed && parsed.priority_color ? parsed.priority_color : priorityInfo.priority_color,
    priority_rank:
      parsed && Number(parsed.priority_rank) ? Number(parsed.priority_rank) : priorityInfo.priority_rank,
    focus_area:
      parsed && typeof parsed.focus_area === 'string' ? parsed.focus_area.trim() : '',
    intent:
      parsed && typeof parsed.intent === 'string' ? parsed.intent.trim() : detected.intent,
    next_action_title:
      parsed && typeof parsed.next_action_title === 'string'
        ? parsed.next_action_title.trim()
        : '',
    next_action_sub:
      parsed && typeof parsed.next_action_sub === 'string'
        ? parsed.next_action_sub.trim()
        : '',
    warning:
      parsed && typeof parsed.warning === 'string' ? parsed.warning.trim() : '',
    should_create_task:
      parsed && typeof parsed.should_create_task === 'boolean'
        ? parsed.should_create_task
        : detected.should_create_task,
    should_update_routine:
      parsed && typeof parsed.should_update_routine === 'boolean'
        ? parsed.should_update_routine
        : detected.should_update_routine,
    should_delete_or_disable:
      parsed && typeof parsed.should_delete_or_disable === 'boolean'
        ? parsed.should_delete_or_disable
        : detected.should_delete_or_disable,
    task:
      parsed && parsed.task && typeof parsed.task === 'object'
        ? { ...detected.task, ...parsed.task }
        : detected.task,
    routine_update:
      parsed && parsed.routine_update && typeof parsed.routine_update === 'object'
        ? { ...detected.routine_update, ...parsed.routine_update }
        : detected.routine_update,
    server_ms: Date.now() - startedAt
  };
}

exports.handler = async function handler(event) {
  const startedAt = Date.now();
  const method = event && event.httpMethod ? event.httpMethod : 'GET';

  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (method === 'GET') {
    return response(200, {
      ok: true,
      service: 'coach',
      version: 'v38-direct',
      method: 'GET',
      has_anthropic_key: Boolean(process.env.ANTHROPIC_API_KEY),
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
      message: 'Function loaded. Use POST for coach requests.'
    });
  }

  if (method !== 'POST') {
    return response(405, {
      ok: false,
      error: 'Method not allowed. Use GET, POST, or OPTIONS.'
    });
  }

  try {
    if (typeof fetch !== 'function') {
      return response(500, {
        ok: false,
        error: 'fetch is not available in this Netlify runtime',
        fix: 'Set NODE_VERSION to 18 or 20 in Netlify environment variables.'
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return response(500, {
        ok: false,
        error: 'ANTHROPIC_API_KEY is missing on the server',
        fix: 'Netlify > Site configuration > Environment variables > add ANTHROPIC_API_KEY > redeploy.'
      });
    }

    const payload = safeParseBody(event.body || '{}');

    const question = limitText(payload.question, 2200);
    const mode = limitText(payload.mode || 'coach', 40) || 'coach';

    if (!question) {
      return response(400, {
        ok: false,
        error: 'Question is required'
      });
    }

    const detected = detectIntent(question);

    const model =
      process.env.ANTHROPIC_MODEL ||
      limitText(payload.model || '', 80) ||
      'claude-3-5-sonnet-latest';

    const maxTokens = clampNumber(payload.max_tokens, 120, 900, 500);
    const temperature = clampNumber(payload.temperature, 0, 1, 0.2);

    const systemPrompt = [
      "Tu es le coach personnel de l'utilisateur.",
      "Reponds en francais.",
      "Ton direct, concret, operationnel.",
      "Tu dois repondre uniquement en JSON valide.",
      "Aucun markdown.",
      "Aucune phrase avant ou apres le JSON.",
      "Schema obligatoire:",
      JSON.stringify({
        answer: 'string',
        priority: 'low|medium|high',
        priority_level: 'critical|important|normal|low',
        priority_label: 'Critique|Important|Normal|Faible',
        priority_color: 'hex',
        priority_rank: 1,
        focus_area: 'string',
        intent: 'coach_answer|create_task|routine_update|delete_or_disable|other',
        should_create_task: false,
        should_update_routine: false,
        should_delete_or_disable: false,
        task: null,
        routine_update: null,
        next_action_title: 'string',
        next_action_sub: 'string',
        warning: 'string'
      }),
      "Si la demande cree une tache, remplis task et should_create_task=true.",
      "Si la demande valide ou recalcule la routine, remplis routine_update et should_update_routine=true.",
      "Si la demande supprime ou desactive, remplis should_delete_or_disable=true et warning."
    ].join(' ');

    const contextRaw = payload.context || {};
    const contextText = JSON.stringify(contextRaw).slice(0, 24000);

    const userPrompt = [
      'Mode: ' + mode,
      'Detected intent: ' + JSON.stringify(detected),
      'Context: ' + contextText,
      'Question: ' + question
    ].join('\n');

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    const data = await anthropicResponse.json().catch(function () {
      return {};
    });

    if (!anthropicResponse.ok) {
      return response(anthropicResponse.status, {
        ok: false,
        error:
          data && data.error && data.error.message
            ? data.error.message
            : 'Anthropic request failed',
        type:
          data && data.error && data.error.type
            ? data.error.type
            : 'anthropic_error',
        model: model,
        server_ms: Date.now() - startedAt
      });
    }

    const rawText = Array.isArray(data.content)
      ? data.content
          .filter(function (block) {
            return block && block.type === 'text';
          })
          .map(function (block) {
            return block.text;
          })
          .join('\n\n')
          .trim()
      : '';

    const parsed = extractJsonObject(rawText) || {};

    return response(
      200,
      normalizeFinalAnswer(parsed, rawText, mode, detected, startedAt)
    );
  } catch (error) {
    return response(error.statusCode || 500, {
      ok: false,
      error: error && error.message ? error.message : 'Unknown server error',
      version: 'v38-direct',
      server_ms: Date.now() - startedAt
    });
  }
};
