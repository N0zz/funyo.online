// Headless tests for Keep Defender (games/tower-defense).
// Mocks DOM/canvas, runs the inline script in a vm sandbox, drives via window.__test.
// Focus: the 3-screen flow, the END-screen share row, and the resize/orientation
// reflow fix (towers + enemies must track the grid when the canvas is re-sized).
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const DIR = path.dirname(new URL(import.meta.url).pathname);
let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m); console.log('  ✗ ' + m); } };
const section = t => console.log('\n=== ' + t + ' ===');

function ctx2d() { return new Proxy({}, { get: (_, p) => (p === 'canvas' ? { width: 1280, height: 800 } : () => {}), set: () => true }); }
function makeEl() {
  const cl = new Set(); const el = {
    textContent: '', value: '', dataset: {}, children: [],
    style: new Proxy({}, { get: (t, p) => p === 'setProperty' ? ((k, v) => { t[k] = v; }) : (t[p] ?? ''), set: (t, p, v) => (t[p] = v, true) }),
    classList: { add:(...c)=>c.forEach(x=>cl.add(x)), remove:(...c)=>c.forEach(x=>cl.delete(x)), toggle:(c,f)=>{const w=f===undefined?!cl.has(c):!!f; w?cl.add(c):cl.delete(c); return w;}, contains:c=>cl.has(c) },
    _l: {}, addEventListener:(t,fn)=>{(el._l[t]||=[]).push(fn);}, removeEventListener(){}, fire:(t,e={})=>(el._l[t]||[]).forEach(fn=>fn({preventDefault(){},stopPropagation(){},...e})),
    appendChild:c=>{el.children.push(c); return c;}, querySelectorAll:()=>[], querySelector:()=>null, getContext:()=>ctx2d(), focus(){}, setAttribute(){}, getAttribute(){return null;}, getBoundingClientRect:()=>({left:0,top:0,width:1280,height:800}),
  };
  let h=''; Object.defineProperty(el,'innerHTML',{get:()=>h,set:v=>{h=String(v??''); if(!v) el.children=[];}});
  return el;
}

function runInline(file) {
  const html = fs.readFileSync(path.join(DIR, file), 'utf8');
  const m = html.match(/[\s\S]*<script>([\s\S]*?)<\/script>\s*<\/body>/);
  if (!m) throw new Error('no inline script in ' + file);
  const cache = {}; const getEl = id => (cache[id] ||= makeEl());
  const handlers = {}; const store = {};
  const win = { innerWidth: 1280, innerHeight: 800, addEventListener:(t,fn)=>{(handlers[t]||=[]).push(fn);}, removeEventListener(){}, matchMedia:()=>({matches:false}) };
  const doc = { getElementById:getEl, createElement:()=>makeEl(), addEventListener(){}, querySelectorAll:()=>[], body:makeEl() };
  const sandbox = {
    window: win, document: doc, location: { search: '' }, navigator: {},
    localStorage: { getItem:k=>k in store?store[k]:null, setItem:(k,v)=>{store[k]=String(v);}, removeItem:k=>{delete store[k];} },
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, setTimeout: () => 0, setInterval: () => 0, clearInterval: () => {},
    encodeURIComponent, matchMedia: () => ({ matches: false }), URLSearchParams, Math, JSON, String, Number, Array, Object, parseInt, parseFloat, isFinite, isNaN, Date, console,
  };
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  let bootErr = null;
  try { vm.runInContext(m[1], ctx, { filename: file }); } catch (e) { bootErr = e.stack; }
  return { getEl, win, store, bootErr, test: () => win.__test };
}

function freeCell(T) {
  for (let c = 0; c < T.cols; c++) for (let r = 0; r < T.rows; r++) if (!T.roadAt(c, r)) return { c, r };
  return null;
}

function run() {
  section('boot + 3-screen flow');
  const g = runInline('index.html');
  ok(g.bootErr === null, 'boots headless: ' + g.bootErr);
  const T = () => g.test();
  ok(T() != null, 'exposes __test');
  ok(T().state === 'menu', 'starts on the MENU screen (got ' + T().state + ')');

  // map selection on the menu
  T().selectMap(2);
  ok(T().mapIdx === 2, 'menu map selection sticks (got ' + T().mapIdx + ')');
  T().selectMap(0);

  T().start();
  ok(T().state === 'build' && T().gold === 110 && T().hp === 20, 'start → GAME (build, 110g, 20hp)');

  section('resize / orientation reflow (the bug)');
  const cell = freeCell(T());
  T().place('archer', cell.c, cell.r);
  ok(T().towers === 1, 'placed a tower');

  // tower pixel position must match its grid cell under the current geometry
  let tp = T().towerPx(0), cp = T().cellPx(cell.c, cell.r);
  ok(Math.abs(tp.x - cp.x) < 0.5 && Math.abs(tp.y - cp.y) < 0.5, 'tower aligned to grid before resize');

  // spawn enemies, advance, capture an enemy + the geometry
  T().startWave();
  T().step(60);
  ok(T().enemies > 0, 'enemies spawned (got ' + T().enemies + ')');
  const e0 = T().enemyPx(0);
  const geomBefore = T().geom;

  // rotate to portrait — canvas resizes, geometry changes
  T().resizeTo(420, 900);
  const geomAfter = T().geom;
  ok(geomAfter.W === 420 && geomAfter.H === 900, 'canvas resized to portrait');
  ok(geomAfter.ts !== geomBefore.ts || geomAfter.ox !== geomBefore.ox || geomAfter.oy !== geomBefore.oy, 'grid geometry recomputed on resize');

  // tower must STILL sit on its grid cell after the resize (this was the bug)
  tp = T().towerPx(0); cp = T().cellPx(cell.c, cell.r);
  ok(Math.abs(tp.x - cp.x) < 0.5 && Math.abs(tp.y - cp.y) < 0.5, 'tower tracks the grid after resize');

  // enemy must have moved to NEW pixel coords matching the new geometry (not stuck on old px)
  const e1 = T().enemyPx(0);
  ok(e1 && (e1.x !== e0.x || e1.y !== e0.y), 'enemy repositioned to new geometry after resize');
  // and it must be inside the new playfield bounds
  const inX = e1.x >= geomAfter.ox - geomAfter.ts && e1.x <= geomAfter.ox + T().cols * geomAfter.ts + geomAfter.ts;
  ok(inX, 'enemy stays within the resized board');

  // rotate back to landscape — towers realign again
  T().resizeTo(1280, 800);
  tp = T().towerPx(0); cp = T().cellPx(cell.c, cell.r);
  ok(Math.abs(tp.x - cp.x) < 0.5 && Math.abs(tp.y - cp.y) < 0.5, 'tower realigns after rotating back');

  section('END screen + share row');
  const g2 = runInline('index.html'); const U = () => g2.test();
  U().start();
  let guard = 0; while (U().hp > 0 && guard++ < 60000) { if (U().state === 'build') U().startWave(); U().step(1); }
  ok(U().hp <= 0 && U().state === 'over', 'undefended waves end the run (END screen)');
  const ov = g2.getEl('overlay');
  ok(/Play again/.test(ov.innerHTML), 'END screen has a Play again action');
  ok(/Waves survived/.test(ov.innerHTML), 'END screen reports waves survived');
  ok(/class="share"/.test(ov.innerHTML), 'END screen has a share row');
  ok(/id="shareX"/.test(ov.innerHTML) && /id="shareReddit"/.test(ov.innerHTML) && /id="shareCopy"/.test(ov.innerHTML), 'share row has X / Reddit / Copy buttons');
  ok(/funyo\.online(%2F|\/)games(%2F|\/)tower-defense/.test(ov.innerHTML), 'share links point at the game URL');

  console.log('\n----------------------------------------');
  console.log('PASS: ' + pass + '   FAIL: ' + fail);
  if (fail) { console.log('FAILURES:'); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
  else console.log('All tests passed ✓');
}

run();
