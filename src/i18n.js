'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');

// Load all supported locale dictionaries once at startup.
const dictionaries = {};
for (const locale of config.supportedLocales) {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  dictionaries[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Resolve a dot-separated key against a locale dictionary.
 * Falls back to the default locale, then to the key itself.
 */
function translate(locale, key) {
  const lookup = (dict) =>
    key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), dict);

  let value = lookup(dictionaries[locale]);
  if (value === undefined && locale !== config.defaultLocale) {
    value = lookup(dictionaries[config.defaultLocale]);
  }
  return value === undefined ? key : value;
}

/**
 * Pick a valid locale from an arbitrary candidate, falling back to default.
 */
function normalizeLocale(candidate) {
  if (candidate && config.supportedLocales.includes(candidate)) {
    return candidate;
  }
  return config.defaultLocale;
}

/**
 * Detect the preferred locale from the Accept-Language header.
 */
function detectFromHeader(acceptLanguage) {
  if (!acceptLanguage) return config.defaultLocale;
  const langs = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase());
  const match = langs.find((lang) => config.supportedLocales.includes(lang));
  return match || config.defaultLocale;
}

/**
 * Express middleware that resolves the active locale and exposes a `t` helper.
 * Resolution order: ?lang query -> lang cookie -> Accept-Language -> default.
 */
function middleware(req, res, next) {
  let locale;
  if (req.query && config.supportedLocales.includes(req.query.lang)) {
    locale = req.query.lang;
    res.cookie('lang', locale, {
      maxAge: 1000 * 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: 'lax'
    });
  } else if (req.cookies && config.supportedLocales.includes(req.cookies.lang)) {
    locale = req.cookies.lang;
  } else {
    locale = detectFromHeader(req.headers['accept-language']);
  }

  req.locale = locale;
  res.locals.locale = locale;
  res.locals.locales = config.supportedLocales;
  res.locals.t = (key) => translate(locale, key);
  res.locals.htmlLang = translate(locale, 'meta.htmlLang');
  next();
}

module.exports = {
  translate,
  normalizeLocale,
  detectFromHeader,
  middleware,
  dictionaries
};
