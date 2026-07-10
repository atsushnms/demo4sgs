'use strict';

const crypto = require('crypto');

// In-memory store. This is a prototype without authentication or a database,
// so progress lives in process memory keyed by an anonymous player id (cookie).
const players = new Map();

const XP_PER_LEVEL = 200;

const BADGE_IDS = ['first_quest', 'high_scorer', 'level_5', 'explorer'];

function newPlayer(id) {
  return {
    id,
    name: `Player-${id.slice(0, 4)}`,
    xp: 0,
    completedQuests: {}, // questId -> best score
    categories: {}, // category -> count
    badges: [],
    history: [] // { questId, score, xp, at }
  };
}

function getOrCreate(id) {
  const playerId = id || crypto.randomUUID();
  if (!players.has(playerId)) {
    players.set(playerId, newPlayer(playerId));
  }
  return players.get(playerId);
}

function levelForXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function xpIntoLevel(xp) {
  return xp % XP_PER_LEVEL;
}

function xpForNextLevel() {
  return XP_PER_LEVEL;
}

function evaluateBadges(player) {
  const earned = new Set(player.badges);
  if (Object.keys(player.completedQuests).length >= 1) earned.add('first_quest');
  if (player.history.some((h) => h.score >= 90)) earned.add('high_scorer');
  if (levelForXp(player.xp) >= 5) earned.add('level_5');
  if (Object.keys(player.categories).length >= 3) earned.add('explorer');
  const newlyEarned = [...earned].filter((b) => !player.badges.includes(b));
  player.badges = BADGE_IDS.filter((b) => earned.has(b));
  return newlyEarned;
}

/**
 * Record an attempt. XP is awarded only for improvement over the player's
 * previous best score on that quest (so `xpEarned` equals how many points the
 * best score went up). This discourages grinding the same quest, while every
 * attempt is still logged in the history.
 */
function recordAttempt(player, challenge, score) {
  const roundedScore = Math.round(score);
  const prevBest = player.completedQuests[challenge.id] || 0;
  const xpEarned = Math.max(0, roundedScore - prevBest);

  player.xp += xpEarned;
  if (roundedScore > prevBest) {
    player.completedQuests[challenge.id] = roundedScore;
  }
  player.categories[challenge.category] =
    (player.categories[challenge.category] || 0) + 1;
  player.history.unshift({
    questId: challenge.id,
    score: roundedScore,
    xp: xpEarned,
    at: new Date().toISOString()
  });
  if (player.history.length > 50) player.history.length = 50;

  const newBadges = evaluateBadges(player);
  return { xpEarned, newBadges };
}

function publicProfile(player) {
  return {
    id: player.id,
    name: player.name,
    xp: player.xp,
    level: levelForXp(player.xp),
    xpIntoLevel: xpIntoLevel(player.xp),
    xpForNextLevel: xpForNextLevel(),
    completedQuests: player.completedQuests,
    completedCount: Object.keys(player.completedQuests).length,
    categories: player.categories,
    badges: player.badges,
    history: player.history
  };
}

function ranking(limit = 20) {
  return [...players.values()]
    .map((p) => ({
      id: p.id,
      name: p.name,
      xp: p.xp,
      level: levelForXp(p.xp),
      badges: p.badges.length
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

module.exports = {
  players,
  getOrCreate,
  recordAttempt,
  publicProfile,
  ranking,
  levelForXp,
  xpIntoLevel,
  xpForNextLevel,
  BADGE_IDS,
  XP_PER_LEVEL
};
