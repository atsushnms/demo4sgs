'use strict';

const path = require('path');
const express = require('express');

const config = require('./config');
const i18n = require('./i18n');
const challenges = require('./challenges');
const game = require('./game');
const llm = require('./services/llm');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Minimal cookie parser (avoids an extra dependency for this prototype).
app.use((req, res, next) => {
  const header = req.headers.cookie;
  req.cookies = {};
  if (header) {
    for (const pair of header.split(';')) {
      const idx = pair.indexOf('=');
      if (idx === -1) continue;
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      req.cookies[key] = decodeURIComponent(val);
    }
  }
  next();
});

app.use(i18n.middleware);

// Resolve (or create) the anonymous player from a cookie on every request.
app.use((req, res, next) => {
  const player = game.getOrCreate(req.cookies.pid);
  if (player.id !== req.cookies.pid) {
    res.cookie('pid', player.id, {
      maxAge: 1000 * 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: 'lax'
    });
  }
  req.player = player;
  res.locals.profile = game.publicProfile(player);
  res.locals.site = { name: 'PromptQuest' };
  res.locals.currentPath = req.path;
  next();
});

// ---- Pages ----

app.get('/', (req, res) => {
  const all = challenges.getAll(req.locale);
  res.render('home', {
    page: 'home',
    featured: all.slice(0, 3)
  });
});

app.get('/quests', (req, res) => {
  res.render('quests', {
    page: 'quests',
    challenges: challenges.getAll(req.locale)
  });
});

app.get('/quests/:id', (req, res, next) => {
  const challenge = challenges.getById(req.params.id, req.locale);
  if (!challenge) return next();
  res.render('quest', { page: 'quests', challenge });
});

app.get('/ranking', (req, res) => {
  res.render('ranking', {
    page: 'ranking',
    ranking: game.ranking(20)
  });
});

app.get('/mypage', (req, res) => {
  const historyView = req.player.history.map((h) => ({
    ...h,
    quest: challenges.getById(h.questId, req.locale)
  }));
  res.render('mypage', { page: 'mypage', historyView });
});

// ---- API ----

app.post('/api/evaluate', async (req, res) => {
  const { questId, prompt } = req.body || {};
  const raw = challenges.getRaw(questId);

  if (!raw) {
    return res.status(404).json({ error: 'quest_not_found' });
  }
  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: 'empty_prompt' });
  }

  try {
    const result = await llm.evaluatePrompt(
      raw,
      String(prompt).slice(0, 4000),
      req.locale
    );
    const { xpEarned, newBadges } = game.recordAttempt(
      req.player,
      raw,
      result.score
    );
    const profile = game.publicProfile(req.player);
    return res.json({
      ...result,
      xpEarned,
      newBadges: newBadges.map((id) => ({
        id,
        name: res.locals.t(`badges.${id}.name`),
        desc: res.locals.t(`badges.${id}.desc`)
      })),
      profile: {
        xp: profile.xp,
        level: profile.level,
        xpIntoLevel: profile.xpIntoLevel,
        xpForNextLevel: profile.xpForNextLevel
      }
    });
  } catch (err) {
    const status = err.code === 'NO_TOKEN' ? 503 : 502;
    // Log server-side; never leak token or raw error details to the client.
    console.error('[evaluate] failed:', err.code || err.message);
    return res.status(status).json({ error: 'evaluation_failed', code: err.code || 'API_ERROR' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    page: '',
    status: 404,
    message: 'Not Found'
  });
});

if (require.main === module) {
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`PromptQuest running on http://localhost:${config.port}`);
    if (!config.githubModels.token) {
      console.warn(
        '[warn] GITHUB_TOKEN is not set. Prompt evaluation will fail until you configure .env.'
      );
    }
  });
}

module.exports = app;
