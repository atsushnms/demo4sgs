'use strict';

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'challenges.json');
const { challenges } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

/**
 * Return a challenge localized for the given locale, or null if not found.
 */
function localize(challenge, locale) {
  if (!challenge) return null;
  const loc = challenge[locale] || challenge.ja;
  return {
    id: challenge.id,
    category: challenge.category,
    difficulty: challenge.difficulty,
    maxScore: challenge.maxScore,
    title: loc.title,
    scenario: loc.scenario,
    goal: loc.goal,
    tips: loc.tips || []
  };
}

function getAll(locale) {
  return challenges.map((c) => localize(c, locale));
}

function getRaw(id) {
  return challenges.find((c) => c.id === id) || null;
}

function getById(id, locale) {
  return localize(getRaw(id), locale);
}

module.exports = { getAll, getById, getRaw, localize };
