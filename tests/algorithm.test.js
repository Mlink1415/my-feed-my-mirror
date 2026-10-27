// Tests for the teaching model. Run with: node tests/algorithm.test.js
const assert = require('assert');
const M = require('../js/algorithm.js');
const { CONFIG, TOPICS } = M;

// Fake posts just for testing (the real ones come later in content.js).
function makePosts() {
  const posts = [];
  TOPICS.forEach((topic, ti) => {
    for (let i = 0; i < 8; i++) {
      const n = ti * 8 + i;
      posts.push({ id: 'p' + n, topic, creator: 'creator' + (n % 16), veryPopular: n % 5 === 0 });
    }
  });
  return posts;
}
const posts = makePosts();
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('ok  - ' + name); }

test('each action changes the score by the CONFIG value', () => {
  Object.keys(CONFIG.actions).forEach(action => {
    const s = M.createState(posts, { rng: M.seededRandom(1) });
    const post = M.pickNext(s).post;
    const before = s.scores[post.topic];
    M.applyAction(s, action, post);
    assert.strictEqual(s.scores[post.topic] - before, CONFIG.actions[action], action);
  });
});

test('diversity rule holds over 100 picks (any seed)', () => {
  [1, 2, 3, 4, 5].forEach(seed => {
    const rng = M.seededRandom(seed);
    const s = M.createState(posts, { rng });
    const actions = Object.keys(CONFIG.actions);
    for (let i = 0; i < 100; i++) {
      const { post } = M.pickNext(s);
      M.applyAction(s, actions[Math.floor(rng() * actions.length)], post);
    }
    const h = s.history;
    for (let i = 1; i < h.length; i++) {
      assert.notStrictEqual(h[i].creator, h[i - 1].creator, 'same creator in a row at ' + i);
      if (i >= CONFIG.maxTopicRun) {
        const run = h.slice(i - CONFIG.maxTopicRun, i + 1).every(p => p.topic === h[i].topic);
        assert.ok(!run, 'topic run too long at ' + i);
      }
    }
  });
});

test('the explore slot fires on every 5th pick', () => {
  const s = M.createState(posts, { rng: M.seededRandom(7) });
  for (let i = 1; i <= 50; i++) {
    const r = M.pickNext(s);
    assert.strictEqual(r.explore, i % CONFIG.exploreEvery === 0, 'pick ' + i);
    if (r.explore) assert.strictEqual(r.reasons[0].code, 'explore');
  }
});

test('reasons are never empty', () => {
  const s = M.createState(posts, { rng: M.seededRandom(3) });
  for (let i = 0; i < 100; i++) {
    const r = M.pickNext(s);
    assert.ok(r.reasons.length > 0 && r.reasons.every(x => x.text.length > 0));
    M.applyAction(s, i % 2 ? 'like' : 'skip', r.post);
  }
});

test('a post is not repeated until all posts were shown', () => {
  const s = M.createState(posts, { rng: M.seededRandom(9) });
  const seen = new Set();
  for (let i = 0; i < 30; i++) seen.add(M.pickNext(s).post.id);
  assert.ok(seen.size >= 30 - 3, 'too many repeats in the first 30 picks: ' + seen.size);
});

// ---- Rewrite Challenge (run on the fake posts AND on our real 40 posts) ----
const realPosts = require('../js/content.js').POSTS;
const LIMIT = CONFIG.challenge.actionLimit;

// A smart player: "Not interested" on Appearance, "Share" on everything else.
// After every action they peek at the result and stop as soon as they would win.
function playSmart(list, seed) {
  const s = M.startChallenge(list, { rng: M.seededRandom(seed) });
  let result = M.evaluateChallenge(s);
  while (!result.win && s.actionCount < LIMIT) {
    const { post } = M.pickNext(s);
    M.applyAction(s, post.topic === 'appearance' ? 'notInterested' : 'share', post);
    result = M.evaluateChallenge(s);
  }
  return result;
}

[['fake posts', posts], ['real posts', realPosts]].forEach(([label, list]) => {
  test('[' + label + '] the challenge starts drifted: about 50-70% Appearance', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = M.startChallenge(list, { rng: M.seededRandom(seed) });
      const a = M.mix(s).appearance;
      assert.ok(a >= 50 && a <= 70, 'seed ' + seed + ': appearance ' + a + '%');
    }
  });

  test('[' + label + '] a smart sequence wins within 12 actions (30 seeds)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const r = playSmart(list, seed);
      assert.ok(r.win, 'seed ' + seed + ' lost: ' + JSON.stringify(r.mix));
      assert.ok(r.actions <= LIMIT && new RegExp('^WIN-' + r.actions + '$').test(r.code));
    }
  });

  test('[' + label + '] doing nothing does not win, even if you check at once (30 seeds)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = M.startChallenge(list, { rng: M.seededRandom(seed) });
      assert.ok(!M.evaluateChallenge(s).win, 'seed ' + seed + ' won with 0 actions');
      for (let i = 0; i < LIMIT; i++) M.pickNext(s);          // 12 posts go by, no actions
      const r = M.evaluateChallenge(s);
      assert.ok(!r.win, 'seed ' + seed + ' won by doing nothing');
      assert.ok(/^TRY-/.test(r.code));
    }
  });
});

test('a real player (no peeking) wins by using all 12 actions well: 🚫 Appearance, 🔁 the rest', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const s = M.startChallenge(realPosts, { rng: M.seededRandom(seed) });
    for (let i = 0; i < LIMIT; i++) {
      const { post } = M.pickNext(s);
      M.applyAction(s, post.topic === 'appearance' ? 'notInterested' : 'share', post);
    }
    const r = M.evaluateChallenge(s);
    assert.ok(r.win, 'seed ' + seed + ' lost: ' + JSON.stringify(r.mix));
    assert.strictEqual(r.code, 'WIN-' + LIMIT);
  }
});

test('using more than 12 actions can never win', () => {
  const s = M.startChallenge(posts, { rng: M.seededRandom(5) });
  for (let i = 0; i < LIMIT + 1; i++) {
    const { post } = M.pickNext(s);
    M.applyAction(s, post.topic === 'appearance' ? 'notInterested' : 'share', post);
  }
  assert.ok(!M.evaluateChallenge(s).win);
});

test('evaluating the challenge does not change the real feed', () => {
  const s = M.startChallenge(posts, { rng: M.seededRandom(8) });
  const before = JSON.stringify([s.history.map(p => p.id), s.scores, s.pickCount, s.shownIds]);
  M.evaluateChallenge(s);
  assert.strictEqual(JSON.stringify([s.history.map(p => p.id), s.scores, s.pickCount, s.shownIds]), before);
});

// ---- RULES.md must stay readable and in sync with CONFIG ----
test('RULES.md is under 250 words and quotes the CONFIG numbers', () => {
  const text = require('fs').readFileSync(__dirname + '/../RULES.md', 'utf8');
  const words = text.split(/\s+/).filter(Boolean).length;
  assert.ok(words < 250, 'RULES.md has ' + words + ' words');
  const a = CONFIG.actions, sign = n => (n > 0 ? '+' : '\u2212') + Math.abs(n);
  [sign(a.watch), sign(a.like), sign(a.share), sign(a.skip), sign(a.notInterested)].forEach(x =>
    assert.ok(text.includes(x), 'RULES.md is missing ' + x));
  assert.ok(text.includes('Every ' + CONFIG.exploreEvery + 'th'), 'explore number');
  assert.ok(text.includes(CONFIG.challenge.actionLimit + ' actions'), 'challenge limit');
  assert.ok(text.includes(CONFIG.challenge.maxAppearancePct + '%'), 'appearance limit');
});

console.log('\n' + passed + ' tests passed');
