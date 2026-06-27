# CLAUDE.md — funyo

Guidance for working in this repo. Read before editing.

## What this is

**funyo** — a small catalogue of **self-contained** browser games. Live at
**https://funyo.online** (GitHub Pages, repo `N0zz/funyo.online`, cloned at `~/arcade`).
`index.html` is the catalogue; each game is one folder under `games/`. No build step.

## Layout

```text
index.html      catalogue (renders tiles from games.js) + PWA install + share + feedback + newsletter
games.js        catalogue manifest — window.GAMES = [{slug,title,blurb,icon,accent,tag,soon?}]
analytics.js    GA4 loader, consent-gated (see "Analytics")
test.mjs        top-level harness: catalogue wiring + Keep Defender logic + live-games boot loop
manifest.json sw.js favicon.svg og-image.png logo-*.png   CNAME .nojekyll
games/<slug>/   each game: index.html (+ test.mjs, manifest.json, sw.js, icon-192/512.png)
```

## Game conventions (the rules that matter)

- **Self-contained single `index.html`.** No build, no dependencies, **no external assets**
  (no CDNs/fonts/images). Everything inline; visuals are canvas vector + system fonts +
  emoji-as-text. (The *catalogue* page is the only exception — it loads `analytics.js`/gtag.)
- **One inline `<script>` (IIFE) before `</body>`** that sets `window.__test`.
- **`window.__test` hook** — getters for state + a `step(n)` that drives the core `update()`
  **directly** (never relies on `requestAnimationFrame`, which is a no-op in tests). Must be
  deterministic so the headless harness can drive it. Harmless in normal play.
- **Headless-safe:** guard `AudioContext` (lazy, inert if absent), `navigator.vibrate` (only
  if present), `matchMedia`; `ctx.roundRect` fallback. Must boot in a mocked DOM without throwing.
- **Nav:** top-left `‹ Menu` button (reloads → back to the game's own start screen) + a
  `funyo ›` link to `../../`. HUD must clear the nav in **both portrait and landscape**
  (centered in the bar; in portrait the HUD drops to its own row below the nav).
- **Three-screen schema (every game):** (1) MENU — title + mode/options selection with a
  CLEAR selected-state indicator on the active choice; (2) GAME; (3) SCOREBOARD/END — final
  score + best (persisted in `localStorage`) + a "Play again" action + a **share row**.
- **End-screen share row:** reuse the catalogue footer's four icon buttons (Native/X/Reddit/
  Copy) as a clickable DOM overlay. The message is a complete standalone sentence with NO
  trailing preposition and NO url in it (e.g. `I scored <n> in Neon Snake 🐍`); the url is
  `https://funyo.online/games/<slug>/`, passed separately. X uses `?text=<msg>&url=<url>`,
  Reddit `?url=<url>&title=<msg>`, Native `share({text:msg,url})`, Copy writes `msg + '\n' + url`
  and flashes `.ok`. Compute the score at click time; guard `navigator.share`/`clipboard`.
- **Each game is its own installable PWA:** `manifest.json` + `sw.js` + `icon-192/512.png`
  (distinct color-emoji icon) + apple/theme meta in `<head>`.
- **Distinct visual theme per game.** (asteroids=space, keep-defender=castle/parchment,
  bubbles=candy/aqua, snake=neon, breakout=synthwave, flappy=meadow, stacker=pastel, range=tactical.)
- **Responsive:** size the playfield from the viewport (don't hardcode px) so it fits narrow /
  zoomed screens — see the Bubble Pop fit fix.

## Adding / changing a game

1. `games/<slug>/index.html` — self-contained, with the `__test` hook + nav.
2. `games/<slug>/test.mjs` — dependency-free headless harness (mock DOM/canvas, drive via `__test`).
3. Icon: render a 512 color-emoji PNG via Chrome headless, downscale to 192 (`sips`).
4. `manifest.json` + `sw.js` (network-first, cache the one HTML + icons).
5. Add an entry to `games.js` (`soon: true` = greyed "coming soon" tile).
6. Run **all** the suites and keep them green.

## Testing

- `node test.mjs` — top-level (catalogue + Keep Defender + boots every live game, checks `__test`).
- `node games/<slug>/test.mjs` — each game's own suite. `node games/asteroids/test.mjs` too.
- The inline-script extractor grabs the **last attribute-less `<script>` before `</body>`**, so
  external `<script src=...>` (analytics.js, gtag) in `<head>` don't confuse it. Keep that pattern.
- No browser automation here — the harness is the regression net. Always run after changes.

## Git & deploy

- **Per-game commits** for clean history. End commit messages with the
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` line.
- **Batch pushes.** GitHub Pages soft-limits builds (~10/hr) and every push triggers a build +
  Action run, so commit per topic locally but **push several commits together**, not after each one.
- Hosting: **GitHub Pages from `main`** (built-in Fastly CDN — no Cloudflare). Custom domain
  `funyo.online` via the root `CNAME` file + **OVH DNS** (4 GitHub A records on the apex) + Enforce HTTPS.
  Don't delete `CNAME` (Pages would reset the domain). Edge cache can serve stale for ~minutes
  after deploy → version changed assets (e.g. `og-image.png?v=2`).

## Catalogue specifics

- **GA4** (`G-FCZMM2CQLW`) is **consent-gated**: `analytics.js` loads gtag only after the cookie
  banner's *Accept* (stored in `localStorage.funyo_consent`, shared across the origin so per-game
  pages track too). Footer says **"no ads · no payments · plays offline."**
- **OG/Twitter** meta + `og-image.png` (1200×630, a letterboxed page screenshot). Regenerate it on
  rebrands and bump `?v=` so scrapers refetch; re-scrape via the FB Sharing Debugger.
- **Newsletter:** Kit. The inline Subscribe modal POSTs to Kit form **9615603**; sending domain
  `funyo.online` is DKIM/DMARC-verified (records in OVH), default from `news@funyo.online`.
- **Catalogue layout:** tiles render from `games.js` into two sections — **Single player** and
  **Multiplayer** (`mp: true`) — split by centered horizontal dividers; within each, order is
  favorites → available → coming-soon (`soon: true`, greyed). MP tiles show a `players` pill
  (👥 2P / 2–4P) and keep their genre tag. **Badges** come from the `BADGES` map in `index.html`
  (`badges: ["new"]` gold, `["pick"]` purple) rendered as a shimmer+sparkle mark, top-left —
  add a type by adding one map entry + a color rule. Header carries a **mascot placeholder**
  (chibi fox-girl inline SVG — swap for real art later).
- Monetization is optional only: **Buy Me a Coffee** (footer) + GitHub Sponsors (README badge
  only — the footer Sponsor link was removed; footer = coffee + a GitHub-icon repo link).

## Asteroids is special

`games/asteroids/` is a **launcher** (`index.html`) + `levels/*.html`. The roguelite trio is
**generated** from `roguelite-levelup.html`. See `games/asteroids/CLAUDE.md` before touching it.
