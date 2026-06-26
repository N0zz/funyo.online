// Headless tests for Range (aim-trainer).
// Mocks DOM/canvas, runs the inline IIFE in a vm sandbox, drives via window.__test.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const DIR = path.dirname(new URL(import.meta.url).pathname);
let pass = 0, fail = 0;
const fails = [];
function ok(cond, msg) { if (cond) { pass++; } else { fail++; fails.push(msg); console.log('  ✗ ' + msg); } }
function section(t) { console.log('\n=== ' + t + ' ==='); }

function makeCtx2d() {
  return new Proxy({}, {
    get: (_, p) => { if (p === 'canvas') return { width: 1280, height: 800 }; return () => {}; },
    set: () => true,
  });
}

function makeEl(id) {
  const classes = new Set();
  const el = {
    id, textContent: '', value: '', dataset: {}, children: [],
    style: new Proxy({}, { get: (t, p) => t[p] ?? '', set: (t, p, v) => { t[p] = v; return true; } }),
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      toggle: (c, f) => { const has = classes.has(c); const want = f === undefined ? !has : !!f; if (want) classes.add(c); else classes.delete(c); return want; },
      contains: c => classes.has(c),
    },
    _l: {},
    addEventListener: (type, fn) => { (el._l[type] ||= []).push(fn); },
    removeEventListener: () => {},
    fire: (type, ev = {}) => (el._l[type] || []).forEach(fn => fn({ preventDefault() {}, stopPropagation() {}, ...ev })),
    appendChild: (c) => { el.children.push(c); return c; },
    querySelectorAll: () => [], querySelector: () => null,
    getContext: () => makeCtx2d(),
    focus: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 800 }),
  };
  let _html = '';
  Object.defineProperty(el, 'innerHTML', { get: () => _html, set: v => { _html = String(v ?? ''); if (!v) el.children = []; } });
  return el;
}

function runGame(file) {
  const html = fs.readFileSync(path.join(DIR, file), 'utf8');
  const m = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
  if (!m) throw new Error('no inline script found in ' + file);
  const code = m[1];

  const elCache = {};
  const getEl = (id) => (elCache[id] ||= makeEl(id));
  const store = {};
  const handlers = {};

  const win = {
    innerWidth: 1280, innerHeight: 800,
    addEventListener: (type, fn) => { (handlers[type] ||= []).push(fn); },
    removeEventListener: () => {},
    __test: undefined,
  };

  const docMock = {
    getElementById: getEl,
    createElement: (tag) => makeEl('new-' + tag),
    addEventListener: () => {},
    querySelectorAll: () => [],
    body: makeEl('body'),
  };

  const sandbox = {
    window: win, document: docMock,
    location: { search: '' },
    navigator: {},
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setTimeout: (fn, ms) => 0,
    setInterval: () => 0,
    clearInterval: () => {},
    matchMedia: () => ({ matches: false }),
    Math, JSON, String, Number, Array, Object, parseInt, parseFloat, isFinite, isNaN, Date, console,
    URLSearchParams,
  };
  sandbox.globalThis = sandbox;

  const ctx = vm.createContext(sandbox);
  let bootErr = null;
  try { vm.runInContext(code, ctx, { filename: file }); }
  catch (e) { bootErr = e.stack; }

  return { getEl, win, store, bootErr, test: () => win.__test };
}

console.log('Running Range (aim-trainer) headless tests…');

section('boot');
const g = runGame('index.html');
ok(g.bootErr === null, 'boots without error: ' + g.bootErr);
const T = () => g.test();
ok(T() != null, 'exposes window.__test');

section('__test API surface');
ok(typeof T().state === 'string', 'state is a string');
ok(typeof T().score === 'number', 'score is a number');
ok(typeof T().hits === 'number', 'hits is a number');
ok(typeof T().misses === 'number', 'misses is a number');
ok(typeof T().accuracy === 'number', 'accuracy is a number');
ok(typeof T().timeLeft === 'number', 'timeLeft is a number');
ok(Array.isArray(T().targets), 'targets is an array');
ok(typeof T().start === 'function', 'start() exposed');
ok(typeof T().shootAt === 'function', 'shootAt() exposed');
ok(typeof T().step === 'function', 'step() exposed');
ok(typeof T().setSeed === 'function', 'setSeed() exposed');

section('seeded RNG');
{
  // To test determinism: start, set seed, shoot the first target (spawned via Math.random),
  // which triggers spawnTarget() with the seeded RNG. Compare two runs.
  function seededPositions(seed) {
    const gi = runGame('index.html');
    const Ti = () => gi.test();
    Ti().start();
    Ti().setSeed(seed);
    Ti().step(5);
    // shoot first target (position from Math.random, irrelevant for comparison)
    const first = Ti().targets[0];
    if (first) Ti().shootAt(first.x, first.y); // triggers seeded spawn
    Ti().step(1);
    return Ti().targets.map(t => t.x + ',' + t.y);
  }
  const run1 = seededPositions(7);
  const run2 = seededPositions(7);
  ok(JSON.stringify(run1) === JSON.stringify(run2), 'seeded RNG produces deterministic spawns (run1=' + run1 + ')');

  // seededRng must stay in [0, 1) — verify target coords stay within spawn bounds
  // W=1280, H=800, pad=80, HUD_H=48 → x in (80, 1200), y in (128, 720)
  const gBounds = runGame('index.html');
  const Tb = () => gBounds.test();
  Tb().start();
  Tb().setSeed(0xffffffff);
  const firstTgt = Tb().targets[0];
  if (firstTgt) Tb().shootAt(firstTgt.x, firstTgt.y); // trigger seeded spawn
  Tb().step(1);
  const seededTgt = Tb().targets[0];
  if (seededTgt) {
    ok(seededTgt.x <= 1200 && seededTgt.x >= 80, 'seeded target x within spawn bounds (got ' + seededTgt.x + ')');
    ok(seededTgt.y <= 720 && seededTgt.y >= 128, 'seeded target y within spawn bounds (got ' + seededTgt.y + ')');
  }
}

section('initial state');
ok(T().state === 'ready', 'initial state is "ready" (got ' + T().state + ')');
ok(T().score === 0, 'initial score is 0');
ok(T().hits === 0, 'initial hits is 0');
ok(T().misses === 0, 'initial misses is 0');

section('start → playing with target');
T().start();
ok(T().state === 'playing', 'start() → state is "playing"');
ok(T().targets.length >= 1, 'at least one target present after start');
const tgt = T().targets[0];
ok(typeof tgt.x === 'number' && typeof tgt.y === 'number' && tgt.r > 0, 'target has x,y,r fields');

section('hit: shootAt center of target');
T().start();
const t0 = T().targets[0];
T().step(10); // advance a few frames so life > 0
const scoreBefore = T().score;
const hitsBefore = T().hits;
T().shootAt(t0.x, t0.y);
ok(T().hits > hitsBefore, 'hits incremented after shootAt target center');
ok(T().score > scoreBefore, 'score increased after hit');

section('miss: shootAt empty space');
T().start();
T().step(5);
const missesBefore = T().misses;
// shoot far from all targets
T().shootAt(1, 1);
ok(T().misses > missesBefore, 'misses incremented after shooting empty space');

section('accuracy calculation');
T().start();
T().step(5);
const t1 = T().targets[0];
T().shootAt(t1.x, t1.y);  // hit
T().step(5);
T().shootAt(0, 0);          // miss (top-left corner, no target)
const acc = T().accuracy;
// 1 hit, 1 miss → 0.5
ok(Math.abs(acc - 0.5) < 0.01, 'accuracy = hits/(hits+misses) = 0.5 (got ' + acc + ')');

section('accuracy stays 0 with no shots');
T().start();
ok(T().accuracy === 0, 'accuracy 0 when no shots fired');

section('step past session → game over');
T().start();
const fps = 60;
const sessionFrames = 30 * fps + 5;
T().step(sessionFrames);
ok(T().state === 'over', 'state becomes "over" after stepping past session (got ' + T().state + ')');
ok(T().timeLeft <= 0, 'timeLeft ≤ 0 at game over (got ' + T().timeLeft + ')');

section('best score persists');
const g2 = runGame('index.html');
const T2 = () => g2.test();
T2().start();
T2().step(5);
const tgt2 = T2().targets[0];
// hit many times to rack up a score
for (let i = 0; i < 10; i++) {
  T2().step(3);
  const tt = T2().targets[0];
  if (tt) T2().shootAt(tt.x, tt.y);
}
const scoreAfterHits = T2().score;
T2().step(30 * 60 + 5); // end session
ok(T2().state === 'over', 'game over in fresh instance');
const savedBest = parseInt(g2.store['aim-trainer_best'] || '0', 10);
ok(savedBest >= scoreAfterHits, 'best score written to localStorage (saved=' + savedBest + ', score=' + scoreAfterHits + ')');

section('new session loads saved best');
const g3 = runGame('index.html');
// seed the store before boot is already past, so pre-populate via the existing store
// Instead test that if we set localStorage before game init, best loads correctly.
// We test via a fresh game that already has a best saved from g2.
// Since each runGame is independent, check the in-session bestScore getter.
// Pre-populate a best via a helper approach: run, set best manually via direct store injection.
const g4 = (() => {
  const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  const m = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
  const elCache = {};
  const getEl = (id) => (elCache[id] ||= makeEl(id));
  const store = { 'aim-trainer_best': '9999' };
  const win = { innerWidth: 1280, innerHeight: 800, addEventListener: () => {}, removeEventListener: () => {} };
  const sandbox = {
    window: win, document: { getElementById: getEl, createElement: t => makeEl(t), addEventListener: () => {}, querySelectorAll: () => [], body: makeEl('body') },
    location: { search: '' }, navigator: {},
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, setTimeout: () => 0, setInterval: () => 0, clearInterval: () => {},
    matchMedia: () => ({ matches: false }),
    Math, JSON, String, Number, Array, Object, parseInt, parseFloat, isFinite, isNaN, Date, console, URLSearchParams,
  };
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  try { vm.runInContext(m[1], ctx, { filename: 'index.html' }); } catch (e) {}
  return { test: () => win.__test };
})();
ok(g4.test().bestScore === 9999, 'best score loaded from localStorage on boot (got ' + g4.test().bestScore + ')');

console.log('\n----------------------------------------');
console.log('PASS: ' + pass + '   FAIL: ' + fail);
if (fail > 0) { console.log('\nFailures:'); fails.forEach(f => console.log(' - ' + f)); process.exit(1); }
else console.log('All tests passed ✓');
