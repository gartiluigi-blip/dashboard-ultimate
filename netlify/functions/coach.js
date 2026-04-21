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

    const system = payload.systemPrompt || [
      "Tu es le coach personnel de l'utilisateur.",
      "Réponds en français.",
      "Sois direct, concret, actionnable.",
      "Maximum 150 mots.",
      "Utilise les chiffres réels du contexte si disponibles."
    ].join(' ');

    const userPrompt = [
      'Contexte actuel :',
      JSON.stringify(context, null, 2),
      '',
      'Question : ' + question
    ].join('\n');

    const model = payload.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    const maxTokens = Number(payload.max_tokens) > 0 ? Number(payload.max_tokens) : 400;

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

    const answer = Array.isArray(data.content)
      ? data.content
          .filter(block => block && block.type === 'text')
          .map(block => block.text)
          .join('\n\n')
          .trim()
      : '';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ ok: true, answer, raw: data })
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
