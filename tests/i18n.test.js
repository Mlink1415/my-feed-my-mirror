// Tests for the words in the app. Run with: node tests/i18n.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const TH = require('../js/treehole.js');

// i18n.js attaches to `window`; give it a fake one.
const root = {};
new Function('window', fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8').replace("})(typeof window !== 'undefined' ? window : this);", '})(window);'))(root);
const EN = root.MFMM_I18N.en, ZH = root.MFMM_I18N['zh-TW'];
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('ok  - ' + name); }
// {posts} is the English plural (post / posts). Chinese does not need it, so it is the one allowed difference.
const placeholders = s => (String(s).match(/\{\w+\}/g) || []).filter(p => p !== '{posts}').filter((p, i, a) => a.indexOf(p) === i).sort().join(',');

test('English and Traditional Chinese have exactly the same keys', () => {
  const e = Object.keys(EN), z = Object.keys(ZH);
  assert.deepStrictEqual(e.filter(k => !(k in ZH)), [], 'missing in zh-TW');
  assert.deepStrictEqual(z.filter(k => !(k in EN)), [], 'missing in en');
});

test('no text is empty', () => {
  Object.keys(EN).forEach(k => { assert.ok(String(EN[k]).trim(), 'en ' + k); assert.ok(String(ZH[k]).trim(), 'zh ' + k); });
});

test('both languages use the same {placeholders}', () => {
  Object.keys(EN).forEach(k => assert.strictEqual(placeholders(EN[k]), placeholders(ZH[k]), k));
});

test('the Chinese text really is Chinese (except short labels, brand and numbers)', () => {
  const allowSame = new Set(['brand.home', 'btn.mirror']);
  Object.keys(ZH).forEach(k => {
    if (allowSame.has(k)) return;
    assert.ok(/[一-鿿]/.test(ZH[k]) || ZH[k] === '{n} / {max}', 'zh text without Chinese: ' + k + ' = ' + ZH[k]);
  });
});

// Every key the code can ask for must exist. Static t('...') calls are read from app.js;
// keys built from a prefix (t('th.' + view + '.title')) are generated from the data they come from.
test('every key used by app.js exists', () => {
  const src = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8').replace(/\/\/.*$/gm, '');   // ignore comments
  const used = new Set();
  // only complete keys: t('a.b') or t('a.b', {...}); skip t('a.' + x) which are built from a prefix
  (src.match(/\bt\('([\w.]+)'\s*[,)]/g) || []).forEach(m => used.add(m.match(/'([\w.]+)'/)[1]));
  const tiles = ['qr', 'filter', 'wall', 'buddy', 'help', 'safety'];
  tiles.forEach(v => ['title', 'blurb', 'purpose', 'how1', 'how2', 'how3'].forEach(s => used.add('th.' + v + '.' + s)));
  [1, 2].forEach(n => ['title', 'tag', 'desc'].forEach(s => used.add('home.f' + n + '.' + s)));
  [1, 2, 3, 4, 5].forEach(i => { used.add('qr.s' + i); used.add('loop.' + i); });
  [1, 2, 3, 4].forEach(i => used.add('qr.r' + i));
  [1, 2, 3, 4, 5, 6, 7].forEach(i => { used.add('safety.' + i + '.t'); used.add('safety.' + i + '.d'); });
  TH.SAMPLES.forEach(s => used.add('f.sl.' + s.id));
  ['pass', 'reword', 'block', 'care'].forEach(r => { used.add('f.r.' + r + '.t'); used.add('f.r.' + r + '.b'); });
  ['none', 'care', 'violence', 'explicit', 'insult', 'privacy'].forEach(c => used.add('f.c.' + c));
  TH.WALL.forEach(w => used.add('wall.tag.' + w.tag));
  ['hug', 'heart', 'strong'].forEach(k => used.add('wall.r.' + k));
  ['watch', 'like', 'share', 'skip', 'notInterested'].forEach(a => { used.add('act.' + a); used.add('r.' + a); });
  const missing = [...used].filter(k => !(k in EN));
  assert.deepStrictEqual(missing, []);
});

test('the hotline numbers in the screens match the verified list', () => {
  const ok = new Set(['110', '113', '119', '1925', '1953', '1995']);
  const all = JSON.stringify(EN) + JSON.stringify(ZH);
  (all.match(/\b\d{3,4}\b/g) || []).filter(n => /^(110|113|119|19\d\d)$/.test(n)).forEach(n => assert.ok(ok.has(n), 'unverified number ' + n));
});

console.log('\n' + passed + ' tests passed');
