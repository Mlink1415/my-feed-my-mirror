// algorithm.js: the "teaching model" of My Feed, My Mirror.
// It is a SIMPLIFIED model made by students. It is NOT the real algorithm of any app.
// Pure functions only: no DOM, no network, no storage. Works in the browser and in Node.
(function (root) {
  'use strict';

  // ---- All the numbers live here. Change a number, and the whole feed changes. ----
  var CONFIG = {
    actions: {                 // how many points a topic gets when the player does this
      watch: 3,                // 👀 stayed a few seconds
      like: 2,                 // ❤️ liked
      share: 3,                // 🔁 shared
      skip: -1,                // ⏭️ scrolled past fast
      notInterested: -4        // 🚫 "Not interested"
    },
    popularBonus: 1,           // extra points for a "very popular" post
    randomMax: 0.5,            // tiny random number (0 to this) only to break ties
    exploreEvery: 5,           // every 5th post is an "Explore pick"
    maxTopicRun: 2,            // at most 2 posts in a row from the same topic (decision (b))
    mixWindow: 10,             // the mix meter looks at the last 10 posts
    challenge: {
      actionLimit: 12,         // the player gets 12 actions
      window: 10,              // then we look at the next 10 posts
      maxAppearancePct: 20,    // Appearance must be 20% or less
      minTopics: 3,            // at least 3 topics ...
      minTopicPct: 15          // ... must have 15% or more each
    },
    driftedStart: {            // the Rewrite Challenge starts from a drifted feed
      appearance: 12, hobbies: 2, learning: 0, friends: 1, fun: 0
    }
  };

  var TOPICS = ['appearance', 'hobbies', 'learning', 'friends', 'fun'];
  var TOPIC_LABEL = {
    appearance: 'Appearance', hobbies: 'Sports, Music & Art',
    learning: 'Science & Learning', friends: 'Friends & Kindness', fun: 'Pets & Funny'
  };
  var ACTION_VERB = {          // used in the plain-English "reasons"
    watch: 'watched {n} {topic} post(s) for a long time',
    like: 'liked {n} {topic} post(s)',
    share: 'shared {n} {topic} post(s)',
    skip: 'skipped {n} {topic} post(s)',
    notInterested: 'said "Not interested" to {n} {topic} post(s)'
  };

  // A small seeded random generator, so tests give the same result every time.
  function seededRandom(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createState(posts, options) {
    options = options || {};
    var scores = {}, log = {};
    TOPICS.forEach(function (t) {
      scores[t] = (options.scores && options.scores[t]) || 0;
      log[t] = {};
    });
    return {
      posts: posts, rng: options.rng || Math.random,
      scores: scores,        // topic -> points
      log: log,              // topic -> action -> how many times (for the reasons)
      history: [],           // posts shown so far, in order
      shownIds: {},          // posts shown in the current round
      pickCount: 0, actionCount: 0
    };
  }

  function createChallengeState(posts, options) {
    options = options || {};
    return createState(posts, { rng: options.rng, scores: CONFIG.driftedStart });
  }

  function cloneState(state) {
    var copy = createState(state.posts, { rng: state.rng, scores: state.scores });
    TOPICS.forEach(function (t) { copy.log[t] = Object.assign({}, state.log[t]); });
    copy.history = state.history.slice();
    copy.shownIds = Object.assign({}, state.shownIds);
    copy.pickCount = state.pickCount;
    copy.actionCount = state.actionCount;
    return copy;
  }

  // The player did something to a post. Its topic gains or loses points.
  function applyAction(state, action, post) {
    if (!(action in CONFIG.actions)) throw new Error('Unknown action: ' + action);
    var delta = CONFIG.actions[action];
    state.scores[post.topic] += delta;
    state.log[post.topic][action] = (state.log[post.topic][action] || 0) + 1;
    state.actionCount += 1;
    return delta;
  }

  function seenCount(state, topic) {
    return state.history.filter(function (p) { return p.topic === topic; }).length;
  }

  // How many posts at the end of the history share the topic of the last post.
  function topicRun(state) {
    var h = state.history, n = 0;
    while (n < h.length && h[h.length - 1 - n].topic === h[h.length - 1].topic) n++;
    return n;
  }

  // Diversity rule: never the same creator twice in a row;
  // never more than CONFIG.maxTopicRun posts of one topic in a row.
  function isAllowed(state, post) {
    var last = state.history[state.history.length - 1];
    if (!last) return true;
    if (post.creator === last.creator) return false;
    if (post.topic === last.topic && topicRun(state) >= CONFIG.maxTopicRun) return false;
    return true;
  }

  function baseScore(state, post) {
    return state.scores[post.topic] + (post.veryPopular ? CONFIG.popularBonus : 0);
  }

  function bestOf(list) {
    return list.reduce(function (a, b) { return b.s > a.s ? b : a; });
  }

  // Build the plain-English reasons for the chosen post.
  function buildReasons(state, post, explored, blocked) {
    var reasons = [];
    if (explored) {
      reasons.push({ code: 'explore', topic: post.topic, points: 0,
        text: "Explore pick: you haven't seen much " + TOPIC_LABEL[post.topic] });
    } else {
      var log = state.log[post.topic];
      Object.keys(CONFIG.actions).forEach(function (a) {
        if (!log[a]) return;
        var pts = log[a] * CONFIG.actions[a];
        reasons.push({ code: a, topic: post.topic, n: log[a], points: pts,
          text: 'You ' + ACTION_VERB[a].replace('{n}', log[a]).replace('{topic}', TOPIC_LABEL[post.topic]) +
                ' (' + (pts > 0 ? '+' : '') + pts + ')' });
      });
      if (post.veryPopular) {
        reasons.push({ code: 'popular', topic: post.topic, points: CONFIG.popularBonus,
          text: 'This post is very popular (+' + CONFIG.popularBonus + ')' });
      }
      if (blocked) {
        reasons.push({ code: 'diversity', topic: blocked.post.topic, kind: blocked.kind,
          text: 'Not shown before: ' + (blocked.kind === 'creator'
            ? 'the last post was by the same creator'
            : 'the last posts were also ' + TOPIC_LABEL[blocked.post.topic]) + ' (diversity rule)' });
      }
    }
    if (reasons.length === 0) {
      reasons.push({ code: 'chance', topic: post.topic, points: 0,
        text: 'Nothing you did points here yet, so it was picked by popularity and a little chance' });
    }
    return reasons;
  }

  // Choose the next post. Returns { post, reasons, explore }.
  function pickNext(state) {
    var last = state.history[state.history.length - 1];
    var pool = state.posts.filter(function (p) { return !state.shownIds[p.id]; });
    var allowed = pool.filter(function (p) { return isAllowed(state, p); });

    if (allowed.length === 0) {   // round finished (or a dead end): start a new round
      state.shownIds = {};
      if (last) state.shownIds[last.id] = true;
      pool = state.posts.filter(function (p) { return !state.shownIds[p.id]; });
      allowed = pool.filter(function (p) { return isAllowed(state, p); });
      if (allowed.length === 0) allowed = pool;   // last resort, should not happen
    }

    var scored = allowed.map(function (p) {
      return { post: p, s: baseScore(state, p) + state.rng() * CONFIG.randomMax };
    });

    var chosen = null, explored = false;
    if ((state.pickCount + 1) % CONFIG.exploreEvery === 0) {
      // Explore slot: the topic the player has seen least (ties: lowest score).
      var order = TOPICS.slice().sort(function (a, b) {
        return seenCount(state, a) - seenCount(state, b) || state.scores[a] - state.scores[b];
      });
      for (var i = 0; i < order.length && !chosen; i++) {
        var cands = scored.filter(function (c) { return c.post.topic === order[i]; });
        if (cands.length) { chosen = bestOf(cands); explored = true; }
      }
    }
    if (!chosen) chosen = bestOf(scored);

    // Did the diversity rule hold back an even better post?
    var blocked = null;
    if (last && !explored) {
      var top = pool.reduce(function (a, b) { return baseScore(state, b) > baseScore(state, a) ? b : a; });
      if (baseScore(state, top) > baseScore(state, chosen.post) && !isAllowed(state, top)) {
        blocked = { post: top, kind: top.creator === last.creator ? 'creator' : 'topic' };
      }
    }

    var reasons = buildReasons(state, chosen.post, explored, blocked);
    state.history.push(chosen.post);
    state.shownIds[chosen.post.id] = true;
    state.pickCount += 1;
    return { post: chosen.post, reasons: reasons, explore: explored };
  }

  // Percent of each topic in a list of posts.
  function mixOf(posts) {
    var out = {};
    TOPICS.forEach(function (t) { out[t] = 0; });
    posts.forEach(function (p) { out[p.topic] += 100 / posts.length; });
    return out;
  }

  // Feed mix meter: the last 10 posts shown.
  function mix(state) {
    return mixOf(state.history.slice(-CONFIG.mixWindow));
  }

  // Mirror Check: the topic with the most points.
  function mirror(state) {
    return TOPICS.reduce(function (a, b) { return state.scores[b] > state.scores[a] ? b : a; });
  }

  // Forget which posts were shown (a fresh round), but never repeat the very last one.
  function freshRound(state) {
    var last = state.history[state.history.length - 1];
    state.shownIds = {};
    if (last) state.shownIds[last.id] = true;
  }

  // Rewrite Challenge start: a feed that has ALREADY drifted. We let it show 10 posts first,
  // so the mix meter starts "drifted", then start a fresh round so those posts can come back.
  function startChallenge(posts, options) {
    var s = createChallengeState(posts, options);
    for (var i = 0; i < CONFIG.mixWindow; i++) pickNext(s);
    freshRound(s);
    s.actionCount = 0;
    return s;
  }

  // Rewrite Challenge: look at the NEXT 10 posts (on a copy, so the real feed is untouched).
  // We judge a fresh round, so only the player's NEW scores matter, not which posts are used up.
  function evaluateChallenge(state) {
    var c = CONFIG.challenge, sim = cloneState(state), picks = [];
    freshRound(sim);
    for (var i = 0; i < c.window; i++) picks.push(pickNext(sim).post);
    var m = mixOf(picks);
    var topicsOk = TOPICS.filter(function (t) { return m[t] >= c.minTopicPct; }).length;
    var win = m.appearance <= c.maxAppearancePct && topicsOk >= c.minTopics &&
              state.actionCount <= c.actionLimit;
    var used = state.actionCount;
    return { win: win, actions: used, mix: m, topicsOk: topicsOk,
             code: (win ? 'WIN-' : 'TRY-') + used };
  }

  var api = {
    CONFIG: CONFIG, TOPICS: TOPICS, TOPIC_LABEL: TOPIC_LABEL,
    seededRandom: seededRandom, createState: createState, startChallenge: startChallenge,
    cloneState: cloneState, applyAction: applyAction, pickNext: pickNext,
    mix: mix, mixOf: mixOf, mirror: mirror, evaluateChallenge: evaluateChallenge
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MFMM = api;
})(typeof window !== 'undefined' ? window : this);
