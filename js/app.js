// app.js: screens, buttons and drawing. The rules themselves live in algorithm.js.
(function () {
  'use strict';

  var M = window.MFMM, POSTS = window.MFMM_CONTENT.POSTS, I = window.MFMM_I18N, TH = window.MFMM_TH;
  var ACTIONS = [['watch', '👀'], ['like', '❤️'], ['share', '🔁'], ['skip', '⏭️'], ['notInterested', '🚫']];
  var $app = document.getElementById('app'), $top = document.getElementById('topbar');

  // Everything the app remembers lives here, in memory only. Reload = fresh start.
  // screen is one of: home, about1, start, learn, feed, mirror, challenge, result, end, th (Tree Hole)
  var S = { lang: 'en', screen: 'home', game: null, current: null, prevMix: null, result: null, card: 0,
            thView: 'hub',                    // Tree Hole page: hub, qr, filter, wall, buddy, help, safety
            f: { text: '', checked: false },  // the safety-check demo (what was typed, was it checked)
            buddy: null,                      // the AI Buddy question that is open
            mine: {}, reported: {},           // kind reactions and reports on the Wall (this visit only)
            open: {} };                       // which Purpose / How-to-use boxes are open

  // The Tree Hole tiles, in order.
  var TILES = [['qr', '📮'], ['filter', '🛡️'], ['wall', '🌳'], ['buddy', '🐰'], ['help', '🤝'], ['safety', '🔒']];

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
  // L(text) picks the right language from a { en, 'zh-TW' } pair (used by treehole.js content).
  function L(o) { return o[S.lang] || o.en; }
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
  function brandName() {
    return S.screen === 'home' ? t('brand.home') : S.screen === 'th' ? t('th.title') : t('app');
  }

  function renderTopbar() {
    $top.innerHTML =
      '<div class="lhs">' + (S.screen === 'home' ? '' : '<button class="ghost" data-act="home">🏠 ' + t('nav.home') + '</button>') +
      '<span class="brand">' + brandName() + '</span></div><div class="tools">' +
      '<div class="seg" role="group" aria-label="' + t('lang.label') + '">' +
      ['en', 'zh-TW'].map(function (l) {
        return '<button data-act="lang" data-lang="' + l + '" aria-pressed="' + (S.lang === l) + '">' +
               (l === 'en' ? 'EN' : '繁中') + '</button>';
      }).join('') + '</div><button class="ghost" data-act="restart">' + t('btn.restart') + '</button></div>';
  }

  // ---- Home, and the intro of "My Feed, My Mirror" ----
  function renderHome() {
    function card(n, em) {
      var k = 'home.f' + n + '.';
      return '<article class="hcard c' + n + '" data-act="open' + n + '"><span class="tag">' + t(k + 'tag') + '</span>' +
        '<div class="stick" aria-hidden="true">' + em + '</div><h2>' + t(k + 'title') + '</h2><p>' + t(k + 'desc') + '</p>' +
        '<button class="btn" data-act="open' + n + '">' + t('home.open') + ' →</button></article>';
    }
    return '<section class="home"><div class="sparkles" aria-hidden="true">✨ 🌸 ⭐ 🍀 ☁️</div><h1>' + t('home.title') + '</h1>' +
      '<p class="sub">' + t('home.sub') + '</p><div class="home-grid">' + card(1, '📱🪞') + card(2, '🌳💌') + '</div></section>';
  }

  // A Purpose / How-to-use box that opens when clicked. `key` remembers if it was open.
  function dtl(key, label, inner) {
    return '<details class="dtl" data-key="' + key + '"' + (S.open[key] ? ' open' : '') + '><summary>' + label +
           '</summary><div class="dtl-body">' + inner + '</div></details>';
  }
  function olist(keys) {
    return '<ol class="how">' + keys.map(function (k) { return '<li>' + t(k) + '</li>'; }).join('') + '</ol>';
  }

  function renderAbout1() {
    return '<section class="page wide about"><div class="hero" aria-hidden="true">📱🪞</div><h1>' + t('about1.title') + '</h1>' +
      '<p class="lead">' + t('about1.lead') + '</p>' +
      '<div class="goalcard"><h2>🎯 ' + t('about1.goal.title') + '</h2><p>' + t('about1.goal') + '</p></div>' +
      '<div class="panel left"><h2>' + t('about1.you') + '</h2><ul class="clist"><li>' + t('about1.l1') + '</li><li>' + t('about1.l2') +
      '</li><li>' + t('about1.l3') + '</li></ul></div>' +
      '<p class="disclaimer">' + t('about1.src') + ' ' + t('about1.srcline') + '</p>' +
      '<div class="guide">' + dtl('about1:how', t('ui.how'), olist(['about1.how1', 'about1.how2', 'about1.how3'])) + '</div>' +
      '<div class="row"><button class="ghost" data-act="home">' + t('btn.back') + '</button>' +
      '<button class="btn" data-act="go1">' + t('btn.go') + '</button></div></section>';
  }

  // ---- Tree Hole (concept demo) ----
  function renderHub() {
    return '<section class="page wide hub"><div class="hero" aria-hidden="true">🌳💌</div><h1>' + t('th.title') + '</h1>' +
      '<p class="sub">' + t('th.sub') + '</p><p class="demo-badge">🧪 ' + t('th.demo') + '</p><p class="small">' + t('th.hint') + '</p>' +
      '<div class="th-grid">' + TILES.map(function (x) {
        return '<button class="tile tl-' + x[0] + '" data-act="th-open" data-view="' + x[0] + '"><span class="te" aria-hidden="true">' + x[1] +
               '</span><span class="tt">' + t('th.' + x[0] + '.title') + '</span><span class="tb">' + t('th.' + x[0] + '.blurb') + '</span></button>';
      }).join('') + '</div></section>';
  }

  // A picture that LOOKS like a QR code, on purpose NOT a real one (it opens nothing).
  function fakeQr() {
    var n = 25, seed = 7, cells = '';
    function inFinder(x, y) { return (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7); }
    function finderOn(x, y) {   // the big square, white ring, small square in each corner
      var cx = x >= n - 7 ? x - (n - 7) : x, cy = y >= n - 7 ? y - (n - 7) : y;
      var d = Math.max(Math.abs(cx - 3), Math.abs(cy - 3));
      return d === 3 || d <= 1;
    }
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        seed = (seed * 75 + 74) % 65537;   // a tiny fixed pattern, always the same picture
        if (inFinder(x, y) ? finderOn(x, y) : ((seed >> 3) & 1) === 1) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
    }
    return '<svg class="qr" viewBox="-1 -1 27 27" role="img" aria-label="' + t('qr.fake') + '"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/>' +
           '<g fill="#1f1b3a">' + cells + '</g></svg>';
  }

  function bodyQr() {
    var steps = [1, 2, 3, 4, 5].map(function (i) { return '<li style="--i:' + (i - 1) + '">' + t('qr.s' + i) + '</li>'; }).join('');
    return '<div class="two"><div class="poster"><div class="pk">' + t('qr.poster.kicker') + '</div><div class="pt">🌳 ' + t('qr.poster.title') + '</div>' + fakeQr() +
      '<div class="pf">' + t('qr.fake') + '</div><p>' + t('qr.poster.line') + '</p></div>' +
      '<div><h2>' + t('qr.steps.title') + '</h2><ol class="loop once vert">' + steps + '</ol></div></div>' +
      '<div class="panel left"><h2>' + t('qr.rules.title') + '</h2><ul class="clist">' +
      [1, 2, 3, 4].map(function (i) { return '<li>' + t('qr.r' + i) + '</li>'; }).join('') + '</ul></div>';
  }

  function bodyFilter() {
    return '<div class="two"><div class="panel left filt"><label for="fText"><b>' + t('f.label') + '</b></label>' +
      '<textarea id="fText" maxlength="300" rows="3" placeholder="' + t('f.ph') + '"></textarea><div class="small" id="fCount"></div>' +
      '<div class="samples"><span>' + t('f.samples') + '</span>' + TH.SAMPLES.map(function (x) {
        return '<button class="chip" data-act="f-sample" data-id="' + x.id + '">' + t('f.sl.' + x.id) + '</button>';
      }).join('') + '</div><button class="btn" data-act="f-check">' + t('f.check') + '</button></div>' +
      '<div id="fOut" aria-live="polite"></div></div><p class="disclaimer">' + t('f.note') + '</p>';
  }
  function filterPlaceholder() { return '<p class="placeholder">' + t('f.wait') + '</p>'; }

  function filterResult() {
    var r = TH.classify(S.f.text);
    if (r.route === 'empty') return '<div class="result r-empty">' + t('f.r.empty') + '</div>';
    var why = (r.cats.length ? r.cats : ['none']).map(function (c) { return '<li>' + t('f.c.' + c) + '</li>'; }).join('');
    return '<div class="result r-' + r.route + '"><h3>' + t('f.r.' + r.route + '.t') + '</h3><p>' + t('f.r.' + r.route + '.b') + '</p>' +
      '<p class="small">' + t('f.why') + '</p><ul class="clist">' + why + '</ul>' +
      (r.route === 'care' ? '<p class="care-help">' + t('f.care.help') + '</p>' : '') + '</div>';
  }

  // Put back what was typed after a redraw. The text goes in as .value, never as HTML.
  function fillFilter() {
    var ta = document.getElementById('fText');
    if (!ta) return;
    ta.value = S.f.text;
    document.getElementById('fCount').textContent = ta.value.length + ' / 300';
    document.getElementById('fOut').innerHTML = S.f.checked ? filterResult() : filterPlaceholder();
  }

  function wallHtml() {
    var kinds = [['hug', '🤗', 'wall.r.hug'], ['heart', '💛', 'wall.r.heart'], ['strong', '💪', 'wall.r.strong']];
    return TH.WALL.map(function (w) {
      var mine = S.mine[w.id] || {};
      var reacts = kinds.map(function (r) {
        return '<button class="react' + (mine[r[0]] ? ' on' : '') + '" data-act="react" data-post="' + w.id + '" data-kind="' + r[0] +
          '" aria-pressed="' + !!mine[r[0]] + '" aria-label="' + t(r[2]) + '"><span aria-hidden="true">' + r[1] + '</span> ' +
          (w.base[r[0]] + (mine[r[0]] ? 1 : 0)) + '</button>';
      }).join('');
      return '<article class="post"><span class="ptag">' + t('wall.tag.' + w.tag) + '</span><p class="ptext">' + L(w.text) + '</p>' +
        '<div class="reacts">' + reacts + '</div>' +
        (w.reply ? '<div class="reply"><b>👩‍🏫 ' + t('wall.reply') + '</b><p>' + L(w.reply) + '</p></div>' : '') +
        (S.reported[w.id] ? '<p class="small reported">' + t('wall.reported') + '</p>'
                          : '<button class="link" data-act="report" data-post="' + w.id + '">' + t('wall.report') + '</button>') + '</article>';
    }).join('');
  }
  function bodyWall() {
    return '<p class="demo-badge">' + t('wall.note') + '</p><div id="wallList">' + wallHtml() + '</div>';
  }

  function buddyHtml() {
    var b = TH.BUDDY.filter(function (x) { return x.id === S.buddy; })[0];
    if (!b) return '<p class="placeholder">' + t('buddy.wait') + '</p>';
    return '<div class="bubble answer"><span class="mascot" aria-hidden="true">🐰</span><div><p>' + L(b.intro) + '</p><h3>' + t('buddy.try') + '</h3>' +
      '<ul class="clist">' + L(b.tips).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="talkbox"><h3>' + t('buddy.talk') + '</h3><p>' + L(b.talk) + '</p>' +
      '<button class="btn" data-act="th-open" data-view="help">' + t('buddy.helpbtn') + '</button></div>';
  }
  function bodyBuddy() {
    return '<div class="two buddy"><div><div class="bubble"><span class="mascot" aria-hidden="true">🐰</span><p>' + t('buddy.hello') + '</p></div>' +
      '<p class="small">' + t('buddy.pick') + '</p><div class="qlist">' + TH.BUDDY.map(function (b) {
        return '<button class="chip' + (S.buddy === b.id ? ' on' : '') + '" data-act="buddy-q" data-id="' + b.id + '" aria-pressed="' + (S.buddy === b.id) + '">' +
               b.e + ' ' + L(b.q) + '</button>';
      }).join('') + '</div></div><div id="buddyOut" aria-live="polite">' + buddyHtml() + '</div></div><p class="disclaimer">' + t('buddy.disc') + '</p>';
  }

  function bodyHelp() {
    function card(h) {
      return '<div class="hc"><span class="he" aria-hidden="true">' + h.e + '</span><div>' + (h.num ? '<div class="num">' + h.num + '</div>' : '') +
             '<b>' + L(h.name) + '</b>' + (h.desc ? '<p>' + L(h.desc) + '</p>' : '') + '</div></div>';
    }
    return '<h2>' + t('help.school') + '</h2><div class="hgrid">' + TH.HELP.school.map(card).join('') + '</div>' +
      '<h2>' + t('help.hot') + '</h2><div class="hgrid">' + TH.HELP.hotlines.map(card).join('') + '</div>' +
      '<div class="emg"><h2>🚨 ' + t('help.emg') + '</h2><div class="hgrid">' + TH.HELP.emergency.map(card).join('') + '</div></div>' +
      '<p class="disclaimer">' + t('help.note') + '</p>';
  }

  function bodySafety() {
    var em = ['🎭', '🛡️', '💛', '🤗', '🚩', '🧭', '👩‍🏫'];
    return '<h2>' + t('safety.title') + '</h2><div class="sgrid">' + em.map(function (e, i) {
      return '<div class="sc"><span class="se" aria-hidden="true">' + e + '</span><b>' + t('safety.' + (i + 1) + '.t') + '</b><p>' + t('safety.' + (i + 1) + '.d') + '</p></div>';
    }).join('') + '</div><p class="teaser">' + t('safety.honest') + '</p>';
  }

  function renderTH() {
    var v = S.thView;
    if (v === 'hub') return renderHub();
    var k = 'th.' + v + '.', em = TILES.filter(function (x) { return x[0] === v; })[0][1];
    var body = { qr: bodyQr, filter: bodyFilter, wall: bodyWall, buddy: bodyBuddy, help: bodyHelp, safety: bodySafety }[v]();
    return '<section class="page wide th-page tile-' + v + '"><button class="ghost" data-act="th-hub">' + t('th.back') + '</button>' +
      '<h1><span aria-hidden="true">' + em + '</span> ' + t(k + 'title') + '</h1>' +
      '<div class="guide">' + dtl(v + ':purpose', t('ui.purpose'), '<p>' + t(k + 'purpose') + '</p>') +
      dtl(v + ':how', t('ui.how'), olist([k + 'how1', k + 'how2', k + 'how3'])) + '</div>' + body + '</section>';
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
      '<button class="big" data-act="again">' + t('btn.playagain') + '</button></section>';
  }

  function render() {
    document.documentElement.lang = S.lang;
    document.title = brandName();
    renderTopbar();
    if (S.screen === 'feed' || S.screen === 'challenge') {
      var f = renderFeed();
      $app.innerHTML = f.html;
      S.prevMix = f.mix;
    } else {
      $app.innerHTML = { home: renderHome, about1: renderAbout1, th: renderTH, start: renderStart, learn: renderLearn,
                         mirror: renderMirror, result: renderResult, end: renderEnd }[S.screen]();
      if (S.screen === 'th' && S.thView === 'filter') fillFilter();
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
    else if (a === 'restart' || a === 'home') { S.game = null; S.result = null; goto('home'); }
    else if (a === 'again') { S.game = null; S.result = null; goto('start'); }
    else if (a === 'open1') goto('about1');
    else if (a === 'go1') goto('start');
    else if (a === 'open2' || a === 'th-hub') { S.thView = 'hub'; goto('th'); }
    else if (a === 'th-open') { S.thView = el.dataset.view; goto('th'); }
    else if (a === 'f-sample') {
      S.f.text = TH.SAMPLES.filter(function (x) { return x.id === el.dataset.id; })[0].text[S.lang];
      S.f.checked = false;
      fillFilter();
    }
    else if (a === 'f-check') { S.f.checked = true; fillFilter(); }
    else if (a === 'buddy-q') {
      S.buddy = el.dataset.id;
      document.getElementById('buddyOut').innerHTML = buddyHtml();
      document.querySelectorAll('[data-act="buddy-q"]').forEach(function (b) {
        var on = b.dataset.id === S.buddy;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on);
      });
    }
    else if (a === 'react' || a === 'report') {
      var id = el.dataset.post;
      if (a === 'react') { S.mine[id] = S.mine[id] || {}; S.mine[id][el.dataset.kind] = !S.mine[id][el.dataset.kind]; }
      else S.reported[id] = true;
      document.getElementById('wallList').innerHTML = wallHtml();
      var again = document.querySelector(a === 'react' ? '[data-act="react"][data-post="' + id + '"][data-kind="' + el.dataset.kind + '"]' : '.reported');
      if (again && a === 'react') again.focus({ preventScroll: true });
    }
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
  // Keep what is typed in the safety-check box (no redraw, so the cursor stays where it is).
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'fText') return;
    S.f.text = e.target.value;
    S.f.checked = false;
    document.getElementById('fCount').textContent = e.target.value.length + ' / 300';
    document.getElementById('fOut').innerHTML = filterPlaceholder();
  });
  // Remember which Purpose / How-to-use boxes are open (the toggle event does not bubble, so listen while capturing).
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d && d.tagName === 'DETAILS' && d.dataset.key) S.open[d.dataset.key] = d.open;
  }, true);
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
