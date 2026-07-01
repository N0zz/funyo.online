// Daily & weekly challenge catalogue (window.CHALLENGES). Same-for-everyone selection is
// UTC-date-driven (see index.html). Targets are PROVISIONAL — tune once real results flow.
//   goal: { id, title, slug?, metric, op?, target, scope?:'cross'|'random', range?:'day'|'week' }
//   - single-game goal: checked vs gamekit.lastResult(slug) — metric 'score'|'time'|<stats key>
//   - scope:'cross' goal: checked vs the per-day activity log (range 'day') or this week's
//     aggregate (range 'week') — metric 'distinctGames'|'totalGames'|'totalScore'|'distinctGenres'
//   - scope:'random' goal: "play today's / this-week's pick" — the slug + title are resolved at
//     render time from ALL playable games via CHALLENGES.randomSlug(idx, playable) (same for
//     everyone, day/week-driven); done = that game was played in the period. Based on ALL games
//     (never "unplayed", which would be impossible for a player who's tried everything).
window.CHALLENGES = {
  goals: {
    // ---- single game (no mode required → any mode counts) ----
    'snake-20':   { slug: 'snake',         title: 'Score 100 in Neon Snake',       metric: 'score', target: 100 },
    'snake-50':   { slug: 'snake',         title: 'Score 250 in Neon Snake',       metric: 'score', target: 250 },
    'bub-1k':     { slug: 'bubbles',       title: 'Score 1,000 in Bubble Pop',     metric: 'score', target: 1000 },
    'bub-3k':     { slug: 'bubbles',       title: 'Score 3,000 in Bubble Pop',     metric: 'score', target: 3000 },
    'brk-500':    { slug: 'breakout',      title: 'Score 500 in Brick Breaker',    metric: 'score', target: 500 },
    'brk-1500':   { slug: 'breakout',      title: 'Score 1,500 in Brick Breaker',  metric: 'score', target: 1500 },
    'stk-10':     { slug: 'stacker',       title: 'Stack 12 high in Stack',        metric: 'score', target: 12 },
    'stk-20':     { slug: 'stacker',       title: 'Stack 25 high in Stack',        metric: 'score', target: 25 },
    'fly-5':      { slug: 'flappy',        title: 'Pass 8 in Meadow Flyer',        metric: 'score', target: 8 },
    'fly-15':     { slug: 'flappy',        title: 'Pass 20 in Meadow Flyer',       metric: 'score', target: 20 },
    'aim-250':    { slug: 'aim-trainer',   title: 'Score 250 in Range',            metric: 'score', target: 250 },
    'aim-600':    { slug: 'aim-trainer',   title: 'Score 600 in Range',            metric: 'score', target: 600 },
    'td-wave5':   { slug: 'tower-defense', title: 'Reach wave 5 in Keep Defender', metric: 'wave',  target: 5 },
    'td-700':     { slug: 'tower-defense', title: 'Score 700 in Keep Defender',    metric: 'score', target: 700 },
    'ast-4k':     { slug: 'asteroids',      title: 'Score 4,000 in Asteroids',      metric: 'score', target: 4000 },
    'astp-50k':   { slug: 'asteroids-plus', title: 'Score 50,000 in Asteroids+',    metric: 'score', target: 50000 },
    'astp-150k':  { slug: 'asteroids-plus', title: 'Score 150,000 in Asteroids+',   metric: 'score', target: 150000 },
    // ---- cross-game / meta (today) ----
    'play2':      { title: 'Play 2 different games today',  scope: 'cross', range: 'day', metric: 'distinctGames',  target: 2 },
    'play3':      { title: 'Play 3 different games today',  scope: 'cross', range: 'day', metric: 'distinctGames',  target: 3 },
    'genres2':    { title: 'Play 2 different genres today', scope: 'cross', range: 'day', metric: 'distinctGenres', target: 2 },
    'good3':      { title: 'Have 3 good runs today',         scope: 'cross', range: 'day', metric: 'goodRuns',       target: 3 },
    // ---- random pick (slug + title resolved at render time; drives discovery) ----
    'rand-daily':  { scope: 'random', range: 'day',  title: "Play today's random pick" },
    'rand-weekly': { scope: 'random', range: 'week', title: "Play this week's random pick" },
    // ---- weekly = more WORK, not harder (volume / variety over the week) ----
    'wk-distinct5': { title: 'Play 5 different games this week', scope: 'cross', range: 'week', metric: 'distinctGames',  target: 5 },
    'wk-play12':    { title: 'Play 12 games this week',          scope: 'cross', range: 'week', metric: 'totalGames',     target: 12 },
    'wk-genres3':   { title: 'Play 3 different genres this week', scope: 'cross', range: 'week', metric: 'distinctGenres', target: 3 },
    'wk-good10':    { title: 'Have 10 good runs this week',       scope: 'cross', range: 'week', metric: 'goodRuns',       target: 10 },
  },
  // curated daily rotation — mixes single-game + cross-game and avoids repeating the same game back-to-back
  daily: [
    'snake-20', 'play2', 'bub-1k', 'td-wave5', 'fly-5', 'good3', 'aim-250', 'brk-500',
    'play3', 'stk-10', 'astp-50k', 'genres2', 'rand-daily', 'snake-50', 'bub-3k', 'aim-600',
    'brk-1500', 'fly-15', 'stk-20', 'td-700', 'astp-150k', 'ast-4k',
  ],
  weekly: ['wk-distinct5', 'wk-play12', 'rand-weekly', 'wk-genres3', 'wk-good10'],
};

// Deterministic, same-for-everyone pick for scope:'random' goals — chosen from ALL playable
// slugs by the day (daily) or week index. Pure so the catalogue's evalGoal and the tile-badge
// resolver agree. `playable` = window.GAMES filtered to non-soon, in catalogue order.
window.CHALLENGES.randomSlug = function (idx, playable) {
  if (!playable || !playable.length) return '';
  var n = playable.length;
  return playable[((((idx | 0) * 5 + 2) % n) + n) % n];
};

// Cosmetic titles earned by LIFETIME challenge points (points never reset). The profile picks the
// highest title whose `min` you've passed and renders it with an escalating shine (tier 0→8): plain →
// bronze → steel blade → arcane glow → gradient → shimmer → holographic → gold + sparkles. Client-only
// cosmetic (forgeable, but only shown on your own profile → zero stakes). Times ≈ ~4 pts/week casual.
window.CHALLENGES.titles = [
  { min: 0,    tier: 0, emoji: '👺', title: 'Goblin of the Gutter' },
  { min: 10,   tier: 1, emoji: '🌾', title: 'Peasant of the Fields' },
  { min: 25,   tier: 2, emoji: '🛡️', title: 'Squire of the Keep' },
  { min: 50,   tier: 3, emoji: '⚔️', title: 'Knight of the Realm' },
  { min: 100,  tier: 4, emoji: '🔮', title: 'Sorcerer of the Spire' },
  { min: 200,  tier: 5, emoji: '🧙', title: 'Archmage of the Arcane' },
  { min: 400,  tier: 6, emoji: '👁️', title: 'Oracle of the Grid' },
  { min: 650,  tier: 7, emoji: '🌟', title: 'Ascendant of the Stars' },
  { min: 1000, tier: 8, emoji: '👑', title: 'Emperor of Eternity' },
];
// highest title earned at `pts` lifetime challenge points
window.CHALLENGES.titleFor = function (pts) {
  var list = this.titles, out = list[0];
  for (var i = 0; i < list.length; i++) if ((pts | 0) >= list[i].min) out = list[i];
  return out;
};
