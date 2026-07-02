#!/usr/bin/env node
// Generate a game's PWA icons: render a 512×512 color-emoji PNG via Chrome headless,
// then downscale to 192 via sips (macOS). Scripts the flow described in CLAUDE.md.
//
// Usage: node scripts/gen-icon.mjs <emoji> <background> <outDir>
//   e.g. node scripts/gen-icon.mjs 🏰 '#e8c87a' games/tower-defense
//        node scripts/gen-icon.mjs 🫧 'linear-gradient(160deg,#2be3c0,#19c8a8)' games/bubbles
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [emoji, bg, outDir] = process.argv.slice(2);
if (!emoji || !bg || !outDir) {
  console.error('usage: node scripts/gen-icon.mjs <emoji> <background-css> <outDir>');
  process.exit(1);
}

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!fs.existsSync(CHROME)) { console.error('Chrome not found at ' + CHROME); process.exit(1); }

const html = `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;width:512px;height:512px;overflow:hidden}
  body{background:${bg};display:flex;align-items:center;justify-content:center}
  span{font-size:340px;line-height:1}
</style><body><span>${emoji}</span>`;

const tmp = path.join(os.tmpdir(), 'komyo-icon-' + Date.now() + '.html');
fs.writeFileSync(tmp, html);
const out512 = path.join(outDir, 'icon-512.png');
const out192 = path.join(outDir, 'icon-192.png');
execFileSync(CHROME, ['--headless', '--disable-gpu', '--force-device-scale-factor=1',
  '--window-size=512,512', '--screenshot=' + out512, 'file://' + tmp], { stdio: 'inherit' });
fs.copyFileSync(out512, out192);
execFileSync('sips', ['-Z', '192', out192], { stdio: 'ignore' });
fs.unlinkSync(tmp);
console.log('wrote', out512, 'and', out192);
