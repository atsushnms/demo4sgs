'use strict';

const config = require('../config');

/**
 * Build the system + user messages that ask the model to grade a user's prompt
 * against a challenge, and to answer strictly as JSON so we can parse it.
 */
function buildMessages(challenge, userPrompt, locale) {
  const loc = challenge[locale] || challenge.ja;
  const lang = locale === 'en' ? 'English' : 'Japanese (日本語)';

  const system = [
    'You are an expert prompt-engineering coach for software engineers.',
    'You grade a learner\'s prompt against a given challenge.',
    'Be encouraging but honest. Judge clarity, specificity, context, output-format control, and how well the prompt would achieve the challenge goal.',
    `Write all human-readable text (feedback, strengths, improvements) in ${lang}.`,
    'Respond with ONLY a valid minified JSON object, no markdown, no code fences.',
    'JSON schema: {"score": <integer 0-100>, "feedback": "<1-3 sentence overall assessment>", "strengths": ["<short bullet>", ...], "improvements": ["<short actionable bullet>", ...]}',
    'Provide 1-3 items each for strengths and improvements.'
  ].join(' ');

  const user = [
    `# Challenge title\n${loc.title}`,
    `# Scenario\n${loc.scenario}`,
    `# Goal\n${loc.goal}`,
    `# Learner's prompt\n${userPrompt}`,
    'Grade the learner\'s prompt now.'
  ].join('\n\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
}

/**
 * Extract a JSON object from a model response that may contain extra text
 * or code fences.
 */
function parseModelJson(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Empty model response');
  }
  let text = content.trim();
  // Strip markdown code fences if present.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  // Fall back to the first {...} block.
  if (!text.startsWith('{')) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      text = text.slice(start, end + 1);
    }
  }
  return JSON.parse(text);
}

/**
 * Normalize/clamp the parsed result into a safe, predictable shape.
 */
function normalizeResult(parsed, maxScore) {
  let score = Number(parsed.score);
  if (!Number.isFinite(score)) score = 0;
  score = Math.max(0, Math.min(maxScore, Math.round(score)));

  const toArray = (v) =>
    Array.isArray(v)
      ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, 5)
      : [];

  return {
    score,
    feedback: typeof parsed.feedback === 'string' ? parsed.feedback.trim() : '',
    strengths: toArray(parsed.strengths),
    improvements: toArray(parsed.improvements)
  };
}

/**
 * Evaluate a user's prompt for a challenge using GitHub Models.
 * Throws when the token is missing or the API/parse fails.
 */
async function evaluatePrompt(challenge, userPrompt, locale) {
  if (!config.githubModels.token) {
    const err = new Error('GITHUB_TOKEN is not configured');
    err.code = 'NO_TOKEN';
    throw err;
  }

  const messages = buildMessages(challenge, userPrompt, locale);

  const authScheme = 'Bearer';
  const response = await fetch(config.githubModels.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${authScheme} ${config.githubModels.token}`
    },
    body: JSON.stringify({
      model: config.githubModels.model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const err = new Error(
      `GitHub Models request failed: ${response.status} ${response.statusText} ${detail}`
    );
    err.code = 'API_ERROR';
    throw err;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const parsed = parseModelJson(content);
  return normalizeResult(parsed, challenge.maxScore || 100);
}

module.exports = {
  evaluatePrompt,
  buildMessages,
  parseModelJson,
  normalizeResult
};
