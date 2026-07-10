'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const challenges = require('../src/challenges');

test('getAll returns localized challenges', () => {
  const ja = challenges.getAll('ja');
  const en = challenges.getAll('en');
  assert.ok(ja.length >= 1);
  assert.strictEqual(ja.length, en.length);
  assert.notStrictEqual(ja[0].title, en[0].title);
});

test('every challenge has both locales and required fields', () => {
  for (const c of challenges.getAll('ja')) {
    const raw = challenges.getRaw(c.id);
    assert.ok(raw.ja && raw.en, `challenge ${c.id} missing a locale`);
    for (const loc of ['ja', 'en']) {
      assert.ok(raw[loc].title, `${c.id}.${loc}.title`);
      assert.ok(raw[loc].scenario, `${c.id}.${loc}.scenario`);
      assert.ok(raw[loc].goal, `${c.id}.${loc}.goal`);
    }
    assert.ok(['beginner', 'intermediate', 'advanced'].includes(c.difficulty));
    assert.strictEqual(typeof c.maxScore, 'number');
  }
});

test('getById returns null for unknown id', () => {
  assert.strictEqual(challenges.getById('does-not-exist', 'ja'), null);
});

test('getById falls back to ja when locale missing', () => {
  const c = challenges.getById('log-summary', 'fr');
  assert.ok(c);
  assert.strictEqual(c.title, challenges.getById('log-summary', 'ja').title);
});
