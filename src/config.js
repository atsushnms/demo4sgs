'use strict';

require('dotenv').config();

const SUPPORTED_LOCALES = ['ja', 'en'];

const rawDefault = (process.env.DEFAULT_LOCALE || 'ja').toLowerCase();
const defaultLocale = SUPPORTED_LOCALES.includes(rawDefault) ? rawDefault : 'ja';

const config = {
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  supportedLocales: SUPPORTED_LOCALES,
  defaultLocale,
  githubModels: {
    token: process.env.GITHUB_TOKEN || '',
    endpoint:
      process.env.GITHUB_MODELS_ENDPOINT ||
      'https://models.github.ai/inference/chat/completions',
    model: process.env.GITHUB_MODELS_MODEL || 'openai/gpt-4o-mini'
  }
};

module.exports = config;
