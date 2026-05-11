#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

async function main() {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  process.env.ALLOWED_ORIGINS = 'https://ultimatedashboard.netlify.app';
  process.env.COACH_RATE_LIMIT_PER_MIN = '999';

  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            action: 'log_session',
            module: 'epfc',
            duration: 45,
            title: '',
            note: 'PRM3 exercices boucles',
            priority: 'medium',
            question: '',
            confidence: 0.91,
            summary: '45 minutes EPFC journalisées.'
          })
        }]
      };
    }
  });

  const { handler } = require('../netlify/functions/coach.js');
  const res = await handler({
    httpMethod: 'POST',
    headers: { origin: 'https://ultimatedashboard.netlify.app' },
    body: JSON.stringify({
      mode: 'voice',
      question: "j'ai fait 45 minutes d'EPFC sur PRM3",
      context: {}
    })
  });

  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.ok, true);
  assert.equal(body.mode, 'voice');
  assert.equal(body.action, 'log_session');
  assert.equal(body.module, 'epfc');
  assert.equal(body.duration, 45);
  assert.equal(body.priority, 'medium');
  assert.equal(body.confidence, 0.91);
  assert.equal(typeof body.summary, 'string');

  console.log('coach voice smoke test OK');
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });
