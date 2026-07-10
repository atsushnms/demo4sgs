'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const i18n = require('../src/i18n');

test('translate returns Japanese by default', () => {
  assert.strictEqual(i18n.translate('ja', 'nav.home'), 'ホーム');
});

test('translate returns English strings', () => {
  assert.strictEqual(i18n.translate('en', 'nav.home'), 'Home');
});

test('translate resolves nested badge keys', () => {
  assert.strictEqual(i18n.translate('en', 'badges.first_quest.name'), 'First Step');
});

test('translate returns the key itself for missing paths', () => {
  assert.strictEqual(i18n.translate('ja', 'nonexistent.key'), 'nonexistent.key');
});

test('normalizeLocale rejects unsupported locales', () => {
  assert.strictEqual(i18n.normalizeLocale('fr'), 'ja');
  assert.strictEqual(i18n.normalizeLocale('en'), 'en');
  assert.strictEqual(i18n.normalizeLocale(undefined), 'ja');
});

test('detectFromHeader picks supported language', () => {
  assert.strictEqual(i18n.detectFromHeader('en-US,en;q=0.9'), 'en');
  assert.strictEqual(i18n.detectFromHeader('ja,en;q=0.8'), 'ja');
  assert.strictEqual(i18n.detectFromHeader('fr-FR'), 'ja');
  assert.strictEqual(i18n.detectFromHeader(''), 'ja');
});

test('both locale dictionaries share the same key structure', () => {
  const collect = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([k, v]) =>
      v && typeof v === 'object'
        ? collect(v, `${prefix}${k}.`)
        : [`${prefix}${k}`]
    );
  const jaKeys = collect(i18n.dictionaries.ja).sort();
  const enKeys = collect(i18n.dictionaries.en).sort();
  assert.deepStrictEqual(enKeys, jaKeys);
});
