'use strict';

// Mobile navigation toggle.
(function () {
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
})();

// Prompt evaluation flow on the quest detail page.
(function () {
  var root = document.querySelector('.quest-detail');
  var form = document.querySelector('[data-prompt-form]');
  if (!root || !form) return;

  var questId = root.getAttribute('data-quest-id');
  var strings = document.querySelector('.i18n-strings');
  var msgEmpty = strings ? strings.getAttribute('data-str-empty') : 'Please enter a prompt.';
  var msgError = strings ? strings.getAttribute('data-str-error') : 'Evaluation failed.';
  var lang = strings ? strings.getAttribute('data-lang') : 'ja';

  var input = form.querySelector('[name="prompt"]');
  var submitBtn = form.querySelector('[data-submit-btn]');
  var spinner = form.querySelector('[data-spinner]');
  var formError = form.querySelector('[data-form-error]');

  var result = document.querySelector('[data-result]');
  var scoreEl = result.querySelector('[data-score]');
  var scoreRing = result.querySelector('[data-score-ring]');
  var feedbackEl = result.querySelector('[data-feedback]');
  var strengthsEl = result.querySelector('[data-strengths]');
  var improvementsEl = result.querySelector('[data-improvements]');
  var xpLine = result.querySelector('[data-xp-line]');
  var earnedXpEl = result.querySelector('[data-earned-xp]');
  var tryAgainBtn = result.querySelector('[data-try-again]');

  function setLoading(loading) {
    submitBtn.disabled = loading;
    if (spinner) spinner.hidden = !loading;
  }

  function showError(msg) {
    if (!formError) return;
    formError.textContent = msg;
    formError.hidden = false;
  }

  function clearError() {
    if (formError) formError.hidden = true;
  }

  function renderList(el, items) {
    el.innerHTML = '';
    (items || []).forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      el.appendChild(li);
    });
  }

  function updateHud(profile) {
    if (!profile) return;
    var level = document.querySelector('.hud-item .hud-value');
    var fill = document.querySelector('.hud-xpbar-fill');
    var xptext = document.querySelector('.hud-xptext');
    if (level) level.textContent = profile.level;
    if (fill && profile.xpForNextLevel) {
      fill.style.width =
        Math.round((profile.xpIntoLevel / profile.xpForNextLevel) * 100) + '%';
    }
    if (xptext) xptext.textContent = profile.xp + ' XP';
  }

  function renderResult(data) {
    var target = Number(data.score) || 0;
    scoreEl.textContent = '0';
    if (scoreRing) {
      scoreRing.style.setProperty('--score', target);
    }
    // Animate the score number.
    var current = 0;
    var step = Math.max(1, Math.round(target / 30));
    var timer = setInterval(function () {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      scoreEl.textContent = String(current);
    }, 20);

    feedbackEl.textContent = data.feedback || '';
    renderList(strengthsEl, data.strengths);
    renderList(improvementsEl, data.improvements);

    if (typeof data.xpEarned === 'number') {
      earnedXpEl.textContent = data.xpEarned;
      xpLine.hidden = false;
    }
    updateHud(data.profile);

    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();
    var prompt = (input.value || '').trim();
    if (!prompt) {
      showError(msgEmpty);
      input.focus();
      return;
    }

    setLoading(true);
    fetch('/api/evaluate?lang=' + encodeURIComponent(lang), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId: questId, prompt: prompt })
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (payload) {
        if (!payload.ok) {
          throw new Error(payload.body && payload.body.error ? payload.body.error : 'error');
        }
        renderResult(payload.body);
      })
      .catch(function () {
        showError(msgError);
      })
      .finally(function () {
        setLoading(false);
      });
  });

  if (tryAgainBtn) {
    tryAgainBtn.addEventListener('click', function () {
      result.hidden = true;
      xpLine.hidden = true;
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
})();
