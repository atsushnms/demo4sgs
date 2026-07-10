'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

const game = require('../src/game');

const sampleChallenge = { id: 'q1', category: 'coding', maxScore: 100 };

test('new player starts at level 1 with no xp', () => {
  const p = game.getOrCreate('test-player-1');
  const profile = game.publicProfile(p);
  assert.strictEqual(profile.level, 1);
  assert.strictEqual(profile.xp, 0);
  assert.strictEqual(profile.badges.length, 0);
});

test('recordAttempt awards xp and earns first_quest badge', () => {
  const p = game.getOrCreate('test-player-2');
  const { xpEarned, newBadges } = game.recordAttempt(p, sampleChallenge, 80);
  assert.strictEqual(xpEarned, 80);
  assert.strictEqual(p.xp, 80);
  assert.ok(newBadges.includes('first_quest'));
  assert.ok(p.badges.includes('first_quest'));
});

test('high score earns high_scorer badge', () => {
  const p = game.getOrCreate('test-player-3');
  game.recordAttempt(p, sampleChallenge, 95);
  assert.ok(p.badges.includes('high_scorer'));
});

test('level increases with accumulated xp', () => {
  const p = game.getOrCreate('test-player-4');
  game.recordAttempt(p, { id: 'a', category: 'x', maxScore: 100 }, 100);
  game.recordAttempt(p, { id: 'b', category: 'y', maxScore: 100 }, 100);
  game.recordAttempt(p, { id: 'c', category: 'z', maxScore: 100 }, 50);
  // 250 xp -> level 2 (200 per level), and 3 categories -> explorer badge
  assert.strictEqual(game.levelForXp(p.xp), 2);
  assert.ok(p.badges.includes('explorer'));
});

test('completedQuests keeps the best score per quest', () => {
  const p = game.getOrCreate('test-player-5');
  game.recordAttempt(p, sampleChallenge, 40);
  game.recordAttempt(p, sampleChallenge, 70);
  game.recordAttempt(p, sampleChallenge, 55);
  assert.strictEqual(p.completedQuests[sampleChallenge.id], 70);
});

test('ranking is sorted by xp descending', () => {
  const board = game.ranking(50);
  for (let i = 1; i < board.length; i += 1) {
    assert.ok(board[i - 1].xp >= board[i].xp);
  }
});
