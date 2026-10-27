// app.js: screens, buttons and drawing. The rules themselves live in algorithm.js.
(function () {
  'use strict';

  var M = window.MFMM, POSTS = window.MFMM_CONTENT.POSTS, I = window.MFMM_I18N;
  var ACTIONS = [['watch', '👀'], ['like', '❤️'], ['share', '🔁'], ['skip', '⏭️'], ['notInterested', '🚫']];
  var $app = document.getElementById('app'), $top = document.getElementById('topbar');

  // Everything the app remembers lives here, in memory only. Reload = fresh start.
  // screen is one of: start, learn, feed, mirror, challenge, result, end
  var S = { lang: 'en', screen: 'start', game: null, current: null, prevMix: null, result: null, card: 0 };

  // The Learn cards. Facts come ONLY from the sources below (names stay in English).
  var SRC = {
    ig: 'Instagram, “Instagram Ranking Explained” (May 2023)',
    tt: 'TikTok Newsroom, “How TikTok recommends videos #ForYou” (June 2020)',
    yt: 'YouTube Help, “How YouTube recommendations work”',
    moe: 'Taiwan Ministry of Education, K-12 Education Administration news, 26 Oct 2026, 「走進學生生活日常 深耕媒體素養教育」'
  };
  var LEARN = [
    { e: '📡', src: ['ig', 'tt', 'yt'] },
    { e: '🔮', src: ['ig'] },
    { e: '🔁', src: ['moe'], loop: true },
    { e: '🌈', src: ['ig', 'tt'] },
    { e: '🎛️', src: ['ig', 'tt', 'yt'], list: 5 },
    { e: '🕵️', src: ['moe'], detective: true }
  ];

  if (/[?&]presenter=1/.test(location.search)) document.documentElement.classList.add('presenter');

  // t('key', {x: 1}) gives the text in the chosen language.
  function t(key, p) {
    var s = (I[S.lang] && I[S.lang][key]) || I.en[key] || key;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return p && k in p ? p[k] : m; });
  }
  function formatLikes(n) {
    if (S.lang === 'zh-TW') return n >= 10000 ? (Math.round(n / 1000) / 10) + ' 萬' : String(n);
    return n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(n);
  }
  var topicName = function (id) { return t('topic.' + id); };

  // Turn one reason from algorithm.js into a sentence in the chosen language.
  function reasonText(r) {
    var pts = (r.points > 0 ? '+' : '') + r.points;
    if (r.code === 'explore') return t('r.explore', { topic: topicName(r.topic) });
    if (r.code === 'popular') return t('r.popular', { pts: pts });
    if (r.code === 'chance') return t('r.chance');
    if (r.code === 'diversity') return t('r.div.' + r.kind, { topic: topicName(r.topic) });
    return t('r.' + r.code, { n: r.n, posts: r.n === 1 ? 'post' : 'posts', topic: topicName(r.topic), pts: pts });
  }

  // ---- drawing ----
  function renderTopbar() {
    $top.innerHTML =
      '<span class="brand">' + t('app') + '</span><div class="tools">' +
      '<div class="seg" role="group" aria-label="' + t('lang.label') + '">' +
      ['en', 'zh-TW'].map(function (l) {
        return '<button data-act="lang" data-lang="' + l + '" aria-pressed="' + (S.lang === l) + '">' +
               (l === 'en' ? 'EN' : '繁中') + '</button>';
      }).join('') + '</div><button class="ghost" data-act="restart">' + t('btn.restart') + '</button></div>';
  }

  function renderStart() {
    return '<section class="start"><div class="hero" aria-hidden="true">📱🪞</div><h1>' + t('app') + '</h1>' +
      '<p class="sub">' + t('subtitle') + '</p><p>' + t('start.line1') + '</p><p>' + t('start.line2') + '</p>' +
      '<div class="row"><button class="big alt" data-act="learn">' + t('btn.learn') + '</button>' +
      '<button class="big" data-act="play">' + t('btn.play') + '</button></div></section>';
  }

  function renderLearn() {
    var n = S.card + 1, c = LEARN[S.card], k = 'learn.' + n + '.', last = n === LEARN.length, a = M.CONFIG.actions, body;
    if (c.loop) {
      body = '<p>' + t(k + 'body') + '</p><ol class="loop">' + [1, 2, 3, 4, 5].map(function (i) {
        return '<li style="--i:' + (i - 1) + '">' + t('loop.' + i) + '</li>';
      }).join('') + '</ol>';
    } else if (c.list) {
      body = '<p>' + t(k + 'intro') + '</p><ul class="clist">' + [1, 2, 3, 4, 5].map(function (i) {
        return '<li>' + t(k + 'i' + i) + '</li>';
      }).join('') + '</ul>';
    } else if (c.detective) {
      body = '<p>' + t(k + 'intro') + '</p><ul class="qs bigq"><li>' + t('mirror.q1') + '</li><li>' + t('mirror.q2') + '</li></ul>' +
        '<p class="habit">' + t(k + 'habit') + '</p><p>' + t(k + 'habit.body') + '</p>';
    } else {
      body = '<p>' + t(k + 'body') + '</p>';
    }
    if ((k + 'ours') in I.en) {
      body += '<p class="ours">' + t(k + 'ours', { w: a.watch, l: a.like, s: a.share, k: a.skip, x: a.notInterested }) + '</p>';
    }
    return '<section class="page learn"><p class="step">' + t('learn.title') + ' · ' + t('learn.step', { n: n, total: LEARN.length }) + '</p>' +
      '<div class="learn-card"><div class="lemoji" aria-hidden="true">' + c.e + '</div><h1>' + t(k + 'title') + '</h1>' + body +
      '<p class="src">' + t('source.label') + ' ' + c.src.map(function (id) { return SRC[id]; }).join('; ') + '</p></div>' +
      '<div class="dots" aria-hidden="true">' + LEARN.map(function (x, i) { return '<span class="dot' + (i === S.card ? ' on' : '') + '"></span>'; }).join('') + '</div>' +
      '<div class="row">' + (S.card > 0 ? '<button class="ghost" data-act="back">' + t('btn.back') + '</button>' : '') +
      (last ? '<button class="btn" data-act="toplay">' + t('btn.toplay') + '</button>'
            : '<button class="btn" data-act="next">' + t('btn.next') + '</button>') + '</div>' +
      '<p class="disclaimer">' + t('disclaimer') + '</p><p class="disclaimer">' + t('learn.note') + '</p></section>';
  }

  function renderBehind(p) {
    var inner = p.behind.length
      ? '<p>' + t('behind.intro') + '</p><ul>' + p.behind.map(function (b) { return '<li>' + b[S.lang] + '</li>'; }).join('') + '</ul>'
      : '<p>' + t('behind.nothing') + '</p>';
    return '<h3>' + t('link.behind') + '</h3>' + inner +
           '<button class="ghost" data-act="flipback">' + t('behind.back') + '</button>';
  }

  // The bars slide from `from` (default: the last drawn mix) to `mix`.
  function renderMeter(mix, from) {
    var prev = from || S.prevMix || {};
    return M.TOPICS.map(function (id) {
      var pct = Math.round(mix[id]);
      return '<div class="mrow"><span>' + topicName(id) + '</span><span class="mpct">' + pct + '%</span>' +
        '<div class="track"><div class="fill tp-' + id + '" data-w="' + pct + '" style="width:' + Math.round(prev[id] || 0) + '%"></div></div></div>';
    }).join('');
  }

  function renderFeed() {
    var p = S.current.post, mix = M.mix(S.game);
    var html =
      '<div class="stage"><section class="phone"><div class="flip" id="flip"><div class="flip-inner">' +
      '<div class="face front" id="front" aria-live="polite">' +
        '<div class="head"><span class="avatar" aria-hidden="true">' + p.avatarEmoji + '</span>' + p.creator + '</div>' +
        '<div class="visual tp-' + p.topic + '" aria-hidden="true">' + p.visual + '</div>' +
        '<div class="caption">' + p.caption[S.lang] + '</div>' +
        '<div class="likes">❤️ ' + t('likes', { n: formatLikes(p.likes) }) + '</div>' +
        '<div class="links"><button class="link" data-act="why">' + t('link.why') + '</button>' +
        '<button class="link" data-act="behind">' + t('link.behind') + '</button></div></div>' +
      '<div class="face back" id="back" inert>' + renderBehind(p) + '</div></div></div>' +
      '<div class="actions">' + ACTIONS.map(function (a) {
        return '<button class="act" data-act="action" data-action="' + a[0] + '"><span class="em" aria-hidden="true">' + a[1] +
               '</span><span class="lb">' + t('act.' + a[0]) + '</span></button>';
      }).join('') + '</div></section>' +
      renderSide(mix) + '</div>';
    return { html: html, mix: mix };
  }

  // Right-hand panel: meter, counter, and the button that leads to the next screen.
  function renderSide(mix) {
    var n = S.game.actionCount, ch = S.screen === 'challenge', c = M.CONFIG.challenge;
    return '<aside class="side">' +
      (ch ? '<div class="panel goal"><h2>' + t('ch.title') + '</h2><p>' +
            t('ch.goal', { n: c.actionLimit, a: c.maxAppearancePct, k: c.minTopics, m: c.minTopicPct }) + '</p></div>' : '') +
      '<div class="panel"><h2>' + t('meter.title') + '</h2>' + renderMeter(mix) + '</div>' +
      '<p class="counter">' + (ch ? t('ch.counter', { n: n, max: c.actionLimit }) : t('counter', { n: n })) + '</p>' +
      (ch && n > 0 ? '<button class="btn" data-act="check">' + t('ch.check') + '</button>' : '') +
      (!ch && n >= 10 ? '<button class="btn" data-act="mirror">' + t('btn.mirror') + '</button>' : '') +
      '<p class="disclaimer">' + t('disclaimer') + '</p></aside>';
  }

  function renderMirror() {
    var g = S.game, mix = M.mix(g), top = M.mirror(g), known = g.scores[top] > 0;
    return '<section class="page wide"><h1>' + t('mirror.title') + '</h1><div class="mirror-grid"><div>' +
      '<div class="mirror-frame' + (known ? ' tint-' + top : '') + '"><p>' + (known ? t('mirror.care') : t('mirror.unknown')) + '</p>' +
      (known ? '<p class="mirror-topic">' + topicName(top) + '</p>' : '') + '</div>' +
      '<p class="question">' + t('mirror.question') + '</p>' +
      '<ul class="qs"><li>' + t('mirror.q1') + '</li><li>' + t('mirror.q2') + '</li></ul>' +
      '<div class="row"><button class="btn" data-act="challenge">' + t('btn.challenge') + '</button>' +
      '<button class="ghost" data-act="keep">' + t('btn.keep') + '</button></div></div>' +
      '<div class="panel"><h2>' + t('meter.title') + '</h2>' + renderMeter(mix, mix) + '</div></div>' +
      '<p class="disclaimer">' + t('mirror.source') + '</p></section>';
  }

  function renderResult() {
    var r = S.result;
    return '<section class="page"><h1>' + (r.win ? t('res.win', { n: r.actions }) : t('res.try')) + '</h1>' +
      '<p class="result-label">' + t('res.code') + '</p><p class="result-code">' + r.code + '</p>' +
      '<div class="panel"><h2>' + t('res.next') + '</h2>' + renderMeter(r.mix, r.mix) + '</div>' +
      '<div class="row"><button class="btn" data-act="challenge">' + t('btn.again') + '</button>' +
      '<button class="ghost" data-act="finish">' + t('btn.finish') + '</button></div></section>';
  }

  function renderEnd() {
    return '<section class="page"><div class="hero" aria-hidden="true">🪞</div><h1>' + t('end.line') + '</h1>' +
      '<p class="teaser">' + t('end.teaser') + '</p>' +
      '<button class="big" data-act="restart">' + t('btn.playagain') + '</button></section>';
  }

  function render() {
    document.documentElement.lang = S.lang;
    document.title = t('app');
    renderTopbar();
    if (S.screen === 'feed' || S.screen === 'challenge') {
      var f = renderFeed();
      $app.innerHTML = f.html;
      S.prevMix = f.mix;
    } else {
      $app.innerHTML = { start: renderStart, learn: renderLearn, mirror: renderMirror, result: renderResult, end: renderEnd }[S.screen]();
    }
    requestAnimationFrame(function () {   // let the bars slide to their new size
      $app.querySelectorAll('.fill').forEach(function (el) { el.style.width = el.dataset.w + '%'; });
    });
  }

  // ---- doing things ----
  function goto(screen) {
    S.screen = screen;
    render();
    var h = $app.querySelector('h1');   // screen readers and keyboards land on the new title
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }

  function learnMove(d) {
    var next = Math.max(0, Math.min(LEARN.length - 1, S.card + d));
    if (next !== S.card) { S.card = next; goto('learn'); }
  }

  function startGame() {
    S.game = M.createState(POSTS);
    S.current = M.pickNext(S.game);
    S.prevMix = null;
    goto('feed');
  }

  // Rewrite Challenge: a feed that already drifted toward Appearance.
  function startChallenge() {
    S.game = M.startChallenge(POSTS);
    S.current = M.pickNext(S.game);
    S.prevMix = null;
    goto('challenge');
  }

  function finishChallenge() {
    S.result = M.evaluateChallenge(S.game);
    goto('result');
  }

  function doAction(action) {
    M.applyAction(S.game, action, S.current.post);   // 1. the topic gains or loses points
    if (S.screen === 'challenge' && S.game.actionCount >= M.CONFIG.challenge.actionLimit) return finishChallenge();
    S.current = M.pickNext(S.game);                   // 2. the model picks the next post
    render();
    $app.querySelector('.act').focus({ preventScroll: true });
  }

  function flip(on) {
    document.getElementById('flip').classList.toggle('flipped', on);
    document.getElementById('front').inert = on;
    document.getElementById('back').inert = !on;
  }

  function showWhy(opener) {
    var wrap = document.createElement('div');
    wrap.className = 'backdrop';
    wrap.innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="whyTitle">' +
      '<h2 id="whyTitle">' + t('why.title') + '</h2><ul>' +
      S.current.reasons.map(function (r) { return '<li>' + reasonText(r) + '</li>'; }).join('') +
      '</ul><p class="note">' + t('why.note') + '</p><button class="ghost" data-act="closewhy">' + t('btn.close') + '</button></div>';
    document.body.appendChild(wrap);
    wrap.querySelector('button').focus();
    showWhy.opener = opener;
  }
  function closeWhy() {
    var w = document.querySelector('.backdrop');
    if (w) w.remove();
    if (showWhy.opener && document.contains(showWhy.opener)) showWhy.opener.focus();
  }

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('backdrop')) return closeWhy();
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var a = el.dataset.act;
    if (a === 'play') startGame();
    else if (a === 'restart') { S.game = null; S.result = null; goto('start'); }
    else if (a === 'learn') { S.card = 0; goto('learn'); }
    else if (a === 'next') learnMove(1);
    else if (a === 'back') learnMove(-1);
    else if (a === 'toplay') startGame();
    else if (a === 'mirror') goto('mirror');
    else if (a === 'keep') goto('feed');
    else if (a === 'challenge') startChallenge();
    else if (a === 'check') finishChallenge();
    else if (a === 'finish') goto('end');
    else if (a === 'lang') { S.lang = el.dataset.lang; render(); }
    else if (a === 'action') doAction(el.dataset.action);
    else if (a === 'why') showWhy(el);
    else if (a === 'closewhy') closeWhy();
    else if (a === 'behind') { flip(true); document.querySelector('[data-act="flipback"]').focus(); }
    else if (a === 'flipback') { flip(false); document.querySelector('[data-act="behind"]').focus(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeWhy();
    if (S.screen === 'learn' && !document.querySelector('.backdrop')) {
      if (e.key === 'ArrowRight') learnMove(1);
      if (e.key === 'ArrowLeft') learnMove(-1);
    }
  });

  // Swipe a Learn card: drag left for next, right for back.
  var swipeX = null;
  document.addEventListener('pointerdown', function (e) { swipeX = e.target.closest('.learn-card') ? e.clientX : null; });
  document.addEventListener('pointerup', function (e) {
    if (swipeX === null || S.screen !== 'learn') return;
    var dx = e.clientX - swipeX;
    swipeX = null;
    if (dx < -50) learnMove(1); else if (dx > 50) learnMove(-1);
  });

  render();
})();
