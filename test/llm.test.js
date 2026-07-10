'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const llm = require('../src/services/llm');

test('parseModelJson parses plain JSON', () => {
  const r = llm.parseModelJson('{"score":50,"feedback":"ok"}');
  assert.strictEqual(r.score, 50);
});

test('parseModelJson strips markdown code fences', () => {
  const r = llm.parseModelJson('```json\n{"score":73}\n```');
  assert.strictEqual(r.score, 73);
});

test('parseModelJson extracts JSON embedded in text', () => {
  const r = llm.parseModelJson('Here is the result: {"score":42} thanks');
  assert.strictEqual(r.score, 42);
});

test('normalizeResult clamps score into range', () => {
  assert.strictEqual(llm.normalizeResult({ score: 150 }, 100).score, 100);
  assert.strictEqual(llm.normalizeResult({ score: -20 }, 100).score, 0);
  assert.strictEqual(llm.normalizeResult({ score: 'abc' }, 100).score, 0);
});

test('normalizeResult coerces arrays and trims strings', () => {
  const r = llm.normalizeResult(
    { score: 60, feedback: '  good  ', strengths: ['a', 2, ''], improvements: 'nope' },
    100
  );
  assert.strictEqual(r.feedback, 'good');
  assert.deepStrictEqual(r.strengths, ['a']);
  assert.deepStrictEqual(r.improvements, []);
});

test('buildMessages includes challenge content and language instruction', () => {
  const challenge = {
    ja: { title: 'T', scenario: 'S', goal: 'G' },
    en: { title: 'Ten', scenario: 'Sen', goal: 'Gen' }
  };
  const msgs = llm.buildMessages(challenge, 'my prompt', 'en');
  assert.strictEqual(msgs.length, 2);
  assert.match(msgs[0].content, /English/);
  assert.match(msgs[1].content, /Ten/);
  assert.match(msgs[1].content, /my prompt/);
});

test('evaluatePrompt calls GitHub Models and returns normalized result', async () => {
  const originalFetch = global.fetch;
  let captured;
  global.fetch = async (url, opts) => {
    captured = { url, opts };
    return {
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: '{"score":88,"feedback":"nice","strengths":["clear"],"improvements":["add format"]}' } }
        ]
      })
    };
  };
  try {
    const challenge = { maxScore: 100, ja: { title: 't', scenario: 's', goal: 'g' }, en: { title: 't', scenario: 's', goal: 'g' } };
    const result = await llm.evaluatePrompt(challenge, 'p', 'ja');
    assert.strictEqual(result.score, 88);
    assert.deepStrictEqual(result.strengths, ['clear']);
    const body = JSON.parse(captured.opts.body);
    assert.ok(body.model);
    assert.ok(Array.isArray(body.messages));
    const auth = captured.opts.headers.Authorization;
    assert.strictEqual(typeof auth, 'string', 'Authorization header should be a string');
    assert.strictEqual(auth.split(' ')[0], 'Bearer', 'Authorization header should start with the auth scheme');
  } finally {
    global.fetch = originalFetch;
  }
});
