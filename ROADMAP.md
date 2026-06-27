# Arcade Roadmap

Working notes for what to build / improve next. Not a promise of order.

## Known bugs (from mobile playtest) — ✅ all fixed (this session)

> Keep Defender resize-reflow, Stack mode indicator, Meadow Flyer tap/click restart, portrait
> HUD clearance (all games), Asteroids landscape nav, Bubble Pop indicator, Brick Breaker touch
> (relative drag) — all fixed; share-row text + Copy-button styling standardized across games.


- **Keep Defender (`games/tower-defense/`)** — on **orientation change** the background/canvas
  repositions but **towers and enemies stay at their old coordinates** (resize handler resizes the
  canvas but doesn't rescale/reposition entities). Recompute entity positions on resize.
- **Stack (`games/stacker/`)** — the **3 modes have no selected-state indicator**; you can't tell
  which mode you're about to play. Same bug class we already fixed in Snake's option picker — give
  the active mode a clear selected style.
- **Meadow Flyer (`games/flappy/`)** — after you fail, **restart only works with Spacebar**;
  **tap (mobile) and mouse click (PC) don't restart**. Restart should accept tap/click too.
- **HUD overlap in portrait (mobile, vertical)** — the **score/points sits behind the `‹ Menu` /
  `funyo ›` nav buttons**. HUD needs to clear the nav bar in portrait too (we did this for
  landscape — portrait still overlaps). Check across all games, not just one.
- **Asteroids (`games/asteroids/`)** — in **landscape on mobile** the `funyo ›` (back) button
  **overlaps the game name/logo**. Reposition so the nav clears the title in landscape.
- **Bubble Pop (`games/bubbles/`)** — the **special-shot indicator / message box is in the wrong
  place** (mispositioned relative to the playfield). Reposition it to sit correctly with the HUD.
- **Brick Breaker mobile control (`games/breakout/`)** — controlling the paddle by touch means
  **your finger covers the screen**, making it harder to see. Figure out a better scheme — e.g.
  control from a touch zone *below* the playfield, relative/drag-anywhere control, or offset the
  paddle from the finger. Needs a design decision, not just a tweak.

## Depth pass on the current games (from PC playtest, landscape)

These play but feel POC, not MVP — the base loop needs more juice + game modes.
Mobile not yet tested, so expect more issues there.

### Stack (`games/stacker/`)

- **Problem:** too slow, especially on wide/landscape screens; boring.
- Speed up the base loop; on landscape, narrow/center the play column so the
  block doesn't crawl across the full width (responsive field width).
- Modes: Classic (endless), Time Attack (most blocks in 60s), Zen (relaxed,
  forgiving tolerance).

### Brick Breaker (`games/breakout/`)

- **Problem:** only fun once you have several balls.
- Smaller / denser bricks, livelier base ball, earlier/more frequent power-ups.
- Modes: Classic, **Endless** (rows keep descending), **Survival / Wall Drop**
  (wall slowly descends toward the paddle — lose if it reaches you).

### Meadow Flyer (`games/flappy/`)

- **Problem:** too hard (flappy-hard); we want simpler, more fun.
- Easier defaults: bigger gaps, slower scroll, gentler gravity, forgiving hitbox.
- **Speed up over time** — start gentle, gradually increase scroll speed (and/or tighten gaps) the
  longer you survive, so a run builds tension and has a natural difficulty curve.
- Modes: Day / Night (visual + optional difficulty tweak).

### Range (`games/aim-trainer/`)

- **Problem:** no obvious time limit / structure.
- Explicit timed modes: 10s / 20s / 30s / 60s (clicks/score in the window).
- Sprint mode: time to reach 100 points.
- Clear visible countdown + end summary per mode.

### Neon Snake (`games/snake/`)

- Roughly fine. Add modes: wall-wrap toggle, speed-up mode, board size S/M/L.

### Keep Defender (`games/tower-defense/`)

- **Problem:** features were added but not *improved* — still looks raw and is
  too easy (spam a few random towers and everything dies).
- Balance: tougher/scaling enemies, armor/resistances so tower choice matters,
  tighter economy, harsher leak penalty — placement should matter.
- **Several maps to choose from** (different paths/layouts).
- Visual polish: nicer terrain/road/towers/enemies (still shapes), range rings,
  enemy health bars, clearer feedback.

## Local multiplayer (single-screen) — pick later

Same constraint: one self-contained file, shared input on one device.
Desktop = split keyboard (WASD vs arrows); mobile/tablet = each player owns a
screen half. 2P works everywhere; 3–4P is a desktop-keyboard thing.

**User favorites: Tron / Light Cycles, Air Hockey, Slime Volleyball.**

| Idea | Players | Effort | Notes |
| --- | --- | --- | --- |
| **Light Cycles / Tron** ★ | 2 (party variant 2–6) | low | reuses Snake trail tech; neon; party = Achtung-style curving trails + pickups |
| **Air Hockey / Pong** ★ | 2 | low | best two-thumb mobile game; W/S vs ↑/↓ on desktop |
| **Slime Volleyball** ★ | 2 | med | two blobs + ball + net; huge fun-per-byte |
| Sumo Arena | 2 | med | bump opponent out of a ring; momentum physics |
| Spacewar Duel | 2 | med | reuses Asteroids movement; central gravity well |
| Joust-lite | 2 | med | reuses Meadow Flyer flap; be above opponent on contact |
| Snake Battle | 2 | low | extends Neon Snake; shared board, last alive wins |
| Button-Mash Race | 2–4 | trivial | everyone grabs a key; fill the bar |

Catalogue idea: add a small **players badge** (`2P`, `1–4P`) on tiles + maybe a
filter so local-multiplayer games are obvious.

## Single-player still queued (coming-soon tiles)

Effort tiers match the multiplayer table (trivial / low / med / high) — a "decent
MVP + 2–3 polish passes," self-contained single file with a `__test` hook.

| Idea | Effort | Workload notes |
| --- | --- | --- |
| **Sudoku** | **med** | Grid render + cell select + number pad + keyboard + pencil notes + conflict highlight + hint/undo + timer & best-time per difficulty are all **low**. The real work is the **generator**: a backtracking **solver** to build a full board, then dig out cells while verifying the puzzle keeps a **unique solution**. MVP difficulty = givens count (easy/med/hard); proper technique-based grading would push it to **high** (skip for v1). Suggested tile: 🔢 · tag `LOGIC` · accent `#7aa2ff`. |
| Dino Jump | low | Chrome's offline T-Rex runner, in its minimalist Chrome style (mono line-art, day→night invert, cacti + pterodactyls, one-button jump/duck, speed ramp). Self-contained, easy crowd-pleaser. |
| Invaders | med | formation movement, descending rows, shields, escalating waves |
| Road Hop (crossy) | med | lane spawns, log-riding, endless scroll |
| Trap the Cat | med | hex grid + cat BFS pathfinding to the nearest edge |
| Arcane (spellcaster) | med–high | scope-dependent: spell variety + wave AI |
| Icy Tower | high | momentum + variable jump + wall-bounce + combos + rising floor (lots of feel-tuning) |
| Pulse Dash (rhythm) | high | obstacles authored to a beat + generate/sync a track (priciest) |

See `games.js` for tags/accents.

## Product & growth (not more games — the return loop)

Past ~10 games the marginal game adds little; the leverage is in retention +
sharing + discovery. Ranked by impact.

### Growth levers (do these before more games)

1. **Daily Challenge** 🏆 — one seeded run per day (same seed/board for everyone),
   personal best saved locally. The *Wordle effect*: a reason to come back daily.
   Highest-impact retention lever. Start with one game (Bubble Pop or Range), then
   a shared "daily" across several.
2. **Shareable score cards** — on game-over, generate "I scored 4,210 on Bubble Pop 🫧
   — funyo.online" (canvas→image, or text+emoji at minimum). Wordle's grid is *why* it
   spread; per-game share-with-score >> the generic share button. Pairs with the OG meta
   we already have.
3. **Personal bests on the tiles** — `your best: 42` under each playable tile
   (localStorage, zero infra). Turns the catalogue into a trophy shelf → stickiness.
4. **Mascot / face for funyo** — cheap personality; use it on social, stickers, the 404
   page, the newsletter header, empty states. "funyo" wants a little character.

### Navigation / catalogue UX

- **Genre filter chips** — single row `All · Arcade · Puzzle · Reflex · Logic…` that
  filters the grid (not a dropdown). ~low effort, looks polished. Worth it now-ish.
- **Search box** — defer until ~20 games; solves a problem we don't have yet.
- **Hamburger menu** — fine for *secondary* links (about, feedback, social), but keep
  **Subscribe** a visible button — burying the one retention asset tanks signups.
  Reconsider after friends-and-family testing tells us what people actually reach for.
- **"New" badge** on recently-added tiles — tiny, makes the site feel alive.
- **Players badge** (`2P`, `1–4P`) once local-multiplayer lands.
- **Main-page sections** — ✅ done: catalogue splits into **Single player** / **Multiplayer**
  sections (centered horizontal dividers); within each, favorites → available → coming-soon
  (greyed). MP tiles carry a 👥 player-count pill + genre tag. (Still pairs with future genre
  filter chips: sections = structure, chips = filter within.)

### Consistent game schema (all games follow the same shape) — ✅ done this session

Every game should follow the same three-screen flow so the catalogue feels like one product:

1. **Menu screen** — title + options / mode selection (the start screen).
2. **Game screen(s)** — the actual play.
3. **Scoreboard / end screen** — score + **always a share row** (shareable score card ties into the
   growth levers above; the end screen is the natural place to prompt a share).

Audit the existing games against this and bring stragglers into line (some end states currently jump
straight back to play or lack share buttons).

### Site chrome (header & footer) — ✅ done this session

- **Mascot in the heading** — ✅ placeholder added beside the wordmark. NOTE: real art still
  needed — direction is a **chibi fox-girl (Holo-ish, red/orange hair, fox ears)**, NOT a robot.
- **Footer: dropped GitHub Sponsors** — ✅ removed from the footer (still a README badge).
- **Footer: GitHub icon + repo link** — ✅ added (inline GitHub SVG → `N0zz/funyo.online`).

### Badges (tile) — ✅ system shipped this session

- One shimmer+sparkle engine, color per type via the `BADGES` map in `index.html`. Live:
  **`new`** (gold, on Bubble Pop), **`pick`** (purple "POPULAR", on Asteroids). Add a type = one
  map entry + a color rule; a tile can stack several via `badges: [...]`. (Label text is just the
  map value — e.g. rename `pick` to "PLAYERS' PICK" / "MOST PLAYED" anytime.) The `pick` badge is
  a manual marker for now; could later be driven by the parked GA4-popularity data.

### Tooling / distribution (product-marketing, not dev tooling)

- **"What's new" / changelog page** — doubles as newsletter content. New game = one post
  = one email = one social card. Ties the whole loop together.
- **Embeddable games (iframe snippet)** — "embed this game on your blog" → backlinks +
  free traffic. Classic browser-game growth channel.
- **List on game portals** — itch.io, free-to-play indexes; free distribution.
- **Vote-on-next-game** — let visitors pick from the coming-soon tiles → engagement +
  newsletter fuel + build what people actually want. **No DB needed** — use an external poll
  (Tally/StrawPoll) or, better, a **Discord / GitHub Discussions native poll**; or the zero-infra
  proxy: track coming-soon tile clicks in GA4 as implicit demand. Avoid an on-site live-count
  widget (that *does* need a datastore — same trap as the play-counter).
- **funyo Discord server** — community hub: announce new games, run vote-on-next-game polls, gather
  feedback, share scores, hand out plushie/sticker giveaways. Pairs with the newsletter (two return
  channels). Low cost to stand up; main cost is moderation/keeping it alive — only worth it once
  there's a small audience to fill it.

**If picking two things next instead of a new game: shareable score cards + personal
bests on tiles.** They compound — every play becomes a potential share, every visit a
reason to return.

## Marketing experiments

- **Mascot QR stickers (local / guerrilla)** — a funyo mascot sticker with a QR code, dropped in
  high-boredom-with-phone spots (bus stops, café tables, waiting rooms, laundromats, uni campuses,
  queues) — the exact "bored, got my phone, 3 free minutes" moment funyo serves. Stickers > flyers
  (cheaper, persist for months, cooler; ties into the mascot idea above). **Rules:** (1) always use a
  **tracked URL** (`funyo.online/?ref=qr-cafe` / UTM) so GA4 can measure it; (2) give the scan a
  **reason in the moment** — pair with the **Daily Challenge** ("scan → beat today's high score"); a
  bare "cool games" QR converts terribly, a dare converts. Treat as a small, fun, *measurable*
  side-experiment — not a primary channel (digital loops — score-sharing, communities, SEO — scale
  for free; physical doesn't). Worth doing mostly if it's fun to do.

- **Merch** — funyo mascot on stickers / tees / mugs / pins, via a print-on-demand shop (no
  inventory, no upfront cost — e.g. a POD provider that handles print + ship). Realistically **not a
  revenue play** at this scale; it's **brand + fun**: turns fans into walking ads and gives the
  mascot a life beyond the screen. Gate it behind the mascot existing and *some* audience (don't
  open a store nobody visits). Cheapest first step is the sticker (already in the QR idea above);
  expand only if people actually ask. Keep it optional-monetization-only, same spirit as
  Buy Me a Coffee / Sponsors.
- **Hand-made funyo plushie** — a real, hand-made mascot plushie (one-off / small-batch, not POD).
  Pure passion/brand object, not a revenue play; a great giveaway / milestone reward / hero photo
  for socials. Depends entirely on the mascot design existing first.

## Parked ideas (someday)

- **Sort tiles by popularity (most-played first), driven by GA4.** No new database —
  reuse GA4: a scheduled GitHub Action reads the GA4 Data API (service-account key in
  a repo secret), writes a static `stats.json` (`{slug: plays}`), and `render()` sorts
  playable tiles by it (favorites still pinned on top; missing/zero → current order).
  Caveats: refresh is daily, not live; GA4 is **consent-sampled** (only counts visitors
  who accepted the banner), so sort by it but don't show raw counts. A live counter was
  rejected — it needs a datastore (DB / serverless KV / flaky free hit-API), so it isn't
  actually "lightweight"; reusing GA4 adds zero new infra.
