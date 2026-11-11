// Tests for the Tree Hole demo. Run with: node tests/treehole.test.js
const assert = require('assert');
const TH = require('../js/treehole.js');
const LANGS = ['en', 'zh-TW'];
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('ok  - ' + name); }
const cjk = s => /[一-鿿]/.test(s);

test('every example message gets the expected route, in both languages', () => {
  TH.SAMPLES.forEach(s => LANGS.forEach(l => {
    assert.strictEqual(TH.classify(s.text[l]).route, s.route, s.id + ' (' + l + ')');
  }));
});

test('there is at least one example for every route', () => {
  ['pass', 'reword', 'block', 'care'].forEach(r => assert.ok(TH.SAMPLES.some(s => s.route === r), r));
});

test('everyday kind messages are NOT held back', () => {
  [
    'I love my dog so much', 'Our class won the relay race today!', 'Can anyone help me with fractions?',
    'I felt nervous before the presentation but it went well', 'My friend and I made up after a fight',
    '我今天考試考得很好', '謝謝老師今天的鼓勵', '我家的貓咪好可愛', '下課後我們一起打籃球', '有人可以教我寫作業嗎？'
  ].forEach(m => assert.strictEqual(TH.classify(m).route, 'pass', m));
});

test('empty or blank text is "empty", never an error', () => {
  ['', '   ', null, undefined].forEach(v => assert.strictEqual(TH.classify(v).route, 'empty'));
});

test('weird input never throws and always returns a known route', () => {
  const odd = ['😀😀😀', '<script>alert(1)</script>', 'a'.repeat(5000), '\n\n\t', '0'.repeat(30), '12345', 123456789012, {}];
  odd.forEach(v => assert.ok(['empty', 'pass', 'reword', 'block', 'care'].includes(TH.classify(v).route)));
});

test('the care route beats every other route (a struggling student is never just "blocked")', () => {
  assert.strictEqual(TH.classify('I want to die and I will hit him').route, 'care');
  assert.strictEqual(TH.classify('我撐不下去了，想打他').route, 'care');
});

test('curly quotes from phone keyboards work like plain quotes', () => {
  assert.strictEqual(TH.classify('I can\u2019t hold on anymore').route, 'care');
  assert.strictEqual(TH.classify("I can't hold on anymore").route, 'care');
  assert.strictEqual(TH.classify('I don\u2019t want to be here').route, 'care');
});

test('block beats reword', () => {
  assert.strictEqual(TH.classify('I will hit him, he is stupid').route, 'block');
});

test('privacy: phone numbers, e-mail addresses and links are found', () => {
  ['call 0912-345-678', 'mail me: kid@example.com', 'see www.example.com', 'visit https://example.com'].forEach(m => {
    const r = TH.classify(m);
    assert.strictEqual(r.route, 'reword', m);
    assert.ok(r.cats.includes('privacy'), m);
  });
});

test('the Buddy has 6 complete topics in both languages', () => {
  assert.strictEqual(TH.BUDDY.length, 6);
  const ids = new Set();
  TH.BUDDY.forEach(b => {
    ids.add(b.id);
    LANGS.forEach(l => {
      assert.ok(b.q[l] && b.intro[l] && b.talk[l], b.id + ' ' + l);
      assert.ok(b.tips[l].length >= 3 && b.tips[l].every(x => x.length > 5), b.id + ' tips ' + l);
    });
    assert.ok(cjk(b.q['zh-TW']) && cjk(b.intro['zh-TW']) && cjk(b.talk['zh-TW']) && b.tips['zh-TW'].every(cjk), b.id + ' zh text');
  });
  assert.strictEqual(ids.size, 6);
});

test('the Buddy never gives a diagnosis or medicine advice', () => {
  const all = JSON.stringify(TH.BUDDY).toLowerCase();
  ['diagnos', 'medicine', 'medication', 'pill', 'dose', 'depression disorder', '診斷', '吃藥', '藥物', '劑量'].forEach(w =>
    assert.ok(!all.includes(w), 'found "' + w + '"'));
});

test('every Buddy topic that can be serious points to a trusted adult', () => {
  TH.BUDDY.forEach(b => {
    assert.ok(/(teacher|counsel|nurse|adult|parent|guardian|doctor)/i.test(b.talk.en), b.id + ' en');
    assert.ok(/(老師|輔導|保健|大人|家長|監護人|醫生)/.test(b.talk['zh-TW']), b.id + ' zh');
  });
});

test('Wall messages are complete, anonymous and kind', () => {
  assert.ok(TH.WALL.length >= 4);
  const bad = /(ugly|stupid|hate|kill|醜|笨|討厭|殺)/i;
  TH.WALL.forEach(w => {
    LANGS.forEach(l => { assert.ok(w.text[l], w.id + ' ' + l); assert.ok(!bad.test(w.text[l] + (w.reply ? w.reply[l] : '')), w.id + ' tone ' + l); });
    assert.ok(cjk(w.text['zh-TW']));
    assert.ok(w.base.hug >= 0 && w.base.heart >= 0 && w.base.strong >= 0);
    assert.ok(!/\d{6,}|@/.test(JSON.stringify(w)), w.id + ' has personal info');
  });
});

test('the Wall examples pass our own safety check', () => {
  TH.WALL.forEach(w => LANGS.forEach(l => {
    const r = TH.classify(w.text[l]).route;
    assert.ok(r === 'pass', w.id + ' (' + l + ') -> ' + r);
  }));
});

test('hotline numbers are exactly the ones we verified (MOHW / MOE pages, Nov 2026)', () => {
  const nums = TH.HELP.hotlines.map(h => h.num).concat(TH.HELP.emergency.map(h => h.num)).sort();
  assert.deepStrictEqual(nums, ['110', '113', '119', '1925', '1953', '1995']);
});

test('every number written inside the Buddy answers is one of the verified numbers', () => {
  const ok = new Set(['110', '113', '119', '1925', '1953', '1995']);
  const found = (JSON.stringify(TH.BUDDY).match(/\d{3,4}/g) || []);
  found.forEach(n => assert.ok(ok.has(n), 'unverified number ' + n));
});

test('help entries are complete in both languages', () => {
  TH.HELP.school.concat(TH.HELP.hotlines, TH.HELP.emergency).forEach(h => LANGS.forEach(l => assert.ok(h.name[l], h.name.en)));
  TH.HELP.school.concat(TH.HELP.hotlines).forEach(h => LANGS.forEach(l => assert.ok(h.desc[l], h.name.en)));
});

console.log('\n' + passed + ' tests passed');
