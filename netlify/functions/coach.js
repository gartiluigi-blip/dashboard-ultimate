exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'ANTHROPIC_API_KEY is missing on the server' })
      };
    }

    const payload = JSON.parse(event.body || '{}');
    const question = String(payload.question || '').trim();
    const context = payload.context || {};
    const mode = String(payload.mode || 'coach').trim();

    if (!question) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Question is required' })
      };
    }

    const fallbackPrompts = {
      coach: "Tu es le coach personnel de l'utilisateur. Réponds en français. Ton direct, concret, utile.",
      analyse: "Tu es un analyste de performance personnelle. Réponds en français. Identifie les faiblesses, dérives et incohérences.",
      plan: "Tu es un planificateur opérationnel. Réponds en français. Transforme le contexte en plan d'action concret pour aujourd'hui."
    };

    const systemBase =
      payload.systemPrompt ||
      fallbackPrompts[mode] ||
      fallbackPrompts.coach;

    const system = [
      systemBase,
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

    const userPrompt = [
      `Mode: ${mode}`,
      '',
      'Contexte actuel :',
      JSON.stringify(context, null, 2),
      '',
      'Question : ' + question
    ].join('\n');

    const model =
      payload.model ||
      process.env.ANTHROPIC_MODEL ||
      'claude-sonnet-4-6';

    const maxTokens =
      Number(payload.max_tokens) > 0 ? Number(payload.max_tokens) : 500;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: data?.error?.message || 'Anthropic request failed',
          details: data
        })
      };
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

      try {
        return JSON.parse(raw);
      } catch (_) {}

      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const sliced = raw.slice(start, end + 1);
        try {
          return JSON.parse(sliced);
        } catch (_) {}
      }

      return null;
    }

    const parsed = safeParseJson(text) || {};

    const normalized = {
      ok: true,
      mode,
      answer:
        typeof parsed.answer === 'string' && parsed.answer.trim()
          ? parsed.answer.trim()
          : text || 'Pas de réponse.',
      priority:
        typeof parsed.priority === 'string' && parsed.priority.trim()
          ? parsed.priority.trim()
          : 'medium',
      focus_area:
        typeof parsed.focus_area === 'string' && parsed.focus_area.trim()
          ? parsed.focus_area.trim()
          : '',
      next_action_title:
        typeof parsed.next_action_title === 'string' && parsed.next_action_title.trim()
          ? parsed.next_action_title.trim()
          : '',
      next_action_sub:
        typeof parsed.next_action_sub === 'string' && parsed.next_action_sub.trim()
          ? parsed.next_action_sub.trim()
          : '',
      warning:
        typeof parsed.warning === 'string'
          ? parsed.warning.trim()
          : ''
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(normalized)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: err.message || 'Unknown server error' })
    };
  }
};
