# CLAUDE.md — Asteroids project

Guidance for working in this repo. Read before editing.

## What this is

A set of **self-contained** HTML5 Canvas games + a launcher. No build step, no
dependencies, no external assets — every game is one `.html` file with inline CSS/JS.
Open `index.html` to play; run `node test.mjs` to test.

## Core conventions

- **Versions are living, not frozen.** We fix and improve existing version files in
  place — there's no freeze. **Git history is the record of iterations**, so we do
  *not* keep every past iteration as a separate file in the menu. The menu lists the
  current set of *distinct* versions/modes, each kept in good shape.
- **Add a new file only for a genuinely distinct version/mode** (a new concept worth
  its own menu entry) — not for an iteration of an existing one. To trace how a
  version evolved, read the commit history, not extra files.
- **`levels.js` is the single source of truth** for the launcher menu. Each entry is
  `{ file, params, key, title, desc, tag, goal }`: `file` is the engine HTML, `params`
  are the knobs appended as the query (`{}`, `{enh:1}`, `{prog:'shop'}`…), and `key` is
  the localStorage suffix for that variant's bests (independent of filename, so engines
  can be shared across cards). `tag` is `CLASSIC` or `ROGUELITE` and decides the menu row.
- **Always run `node test.mjs` after changes and keep it green** — it's the safety net
  that lets us edit versions in place with confidence.
- **No external resources.** Keep everything inline and offline. No CDNs, fonts, or
  image assets — the retro look is all canvas vector drawing + CSS.

## One engine file, knob-driven (no codegen)

This game is now **Classic only** (Classic + Classic-Enhanced). The roguelite progressions
moved to their own catalogue game — **`games/asteroids-plus/`** (a de-iframed single-page
game; its `index.html` is the roguelite engine with an in-page mode picker). Keep them in sync
where the shared engine bits overlap (audio, touch, starfield).

The launcher (`index.html`) iframes the one engine file and lists its cards from `levels.js`:

- **`levels/classic.html`** — Classic + Classic-Enhanced. `?enh=1` turns on the Enhanced
  extras (weapon tiers, Space-to-start); bare (no param) stays Weapon I and uses the original
  Classic menu copy. The `ENHANCED` flag near the top gates the deltas. There is **no codegen**.

Edit the engine file directly — both variants are the same code behind a flag. When you add or
change a variant, adjust its `levels.js` entry (`params` + `key`) and its test call site (the
test passes the knob as a query on the file token, e.g. `'classic.html?enh=1'`).

## Testing

- `node test.mjs` — headless harness (mocks DOM/canvas, steps the game loop, simulates
  input, asserts state transitions). It must stay green; add assertions for new behavior.
- Each game exposes a small `window.__test` hook (getters + helpers like `start`,
  `gotoWave`, `forcePick`, `giveUpgrade`, `clearEnemies`). It's harmless in normal play
  and exists only so the harness can drive state. Keep it in sync when adding mechanics.
- There is no browser automation available here; the harness is the regression net.
  Always run it after changes, and syntax-check inline scripts if unsure.

## Conventions that matter

- The game loop reschedules `requestAnimationFrame` **first**, then runs update/render
  in a `try/catch` — a single bad frame must never permanently freeze the game.
- Speedrun is opt-in via `?speedrun=1` (the launcher appends it). The timer advances
  only while `state === 'playing'`.
- The in-game **Quit to menu** button posts `window.parent.postMessage('asteroids:menu')`;
  the launcher listens and returns to version select.
- **Audio engine (`SND`) is inlined** in each game (full version) and in the launcher
  (music-only, for menu music). It's procedural Web Audio — no asset files — and is
  inert when `AudioContext` is absent (so the harness is unaffected). When you change
  it, update `classic.html`, the launcher, and (kept in sync) `games/asteroids-plus/index.html`.
- **WASD mirrors the arrow keys** for steering *and* menu navigation: keydown maps
  `w/a/s/d → Arrow Up/Left/Down/Right` and the picker/shop branches use the mapped key.
- **`localStorage` keys** (suffixed with the variant **`key`** from `levels.js` —
  `classic`, `classic-enhanced`; the `roguelite-*` keys belong to asteroids-plus now):
  `asteroids_best_<key>` (speedrun time), `asteroids_score_<key>` / `asteroids_wave_<key>`
  (normal-mode bests), plus the kit-owned `asteroids_sfx` / `asteroids_music` (on/off) and
  `asteroids_sfxvol` / `asteroids_musvol` (0–1). The launcher reads these for the card
  "BEST …" lines; the kit sound-menu Reset clears all `asteroids_*` keys.
- **Mobile/touch** controls are inlined per game, shown only on `pointer: coarse`
  devices, and never touch desktop. The move joystick is *aim-and-go*: it sets
  `ship.angle` to the stick direction every frame (instant aim) and only thrusts past
  a ~0.45 deflection. `resize()` scales the canvas up on small screens (min dim < 640)
  so the world zooms out instead of looking cramped.
- **PWA:** `manifest.json` + `sw.js` (registered from the launcher) make it installable
  and offline-capable. The service worker is **network-first** (updates show up when
  online, cache is the offline fallback) — so no cache-version bump is needed on deploy.
  If you add a new file that must work offline, add it to `ASSETS` in `sw.js`.
- `.nojekyll` (repo root) disables GitHub Pages' Jekyll build so files serve as-is.
- Match the existing terse, single-line code style in the game files. Comment sparingly.
