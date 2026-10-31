/**
 * scripts/inject-sprite.mjs  DEV TOOL (not part of the sold package)
 *
 * Browsers refuse external <use href="sprite.svg#id"> references over the
 * file:// protocol, and buyers do open templates by double-clicking
 * index.html. So the canonical sprite at core/assets/icons/sprite.svg is
 * INLINED into every demo, between these two markers in the <body>:
 *
 *   <!-- rp:sprite:start -->
 *   <!-- rp:sprite:end -->
 *
 * Edit the sprite in core/, then run:  node scripts/inject-sprite.mjs
 *
 * Usage: node scripts/inject-sprite.mjs [--check]
 *   --check  exit 1 if any demo is out of date (no files written)
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPRITE = join(ROOT, 'core', 'assets', 'icons', 'sprite.svg');
const START = '<!-- rp:sprite:start -->';
const END = '<!-- rp:sprite:end -->';
const checkOnly = process.argv.includes('--check');

/** Strip the XML prolog and leading comment; keep only the <svg> element.
    Anchored on `<svg xmlns` because the file's doc comment also mentions
    `<svg class="rp-icon">` and a plain indexOf('<svg') would match that. */
function spriteBody(raw) {
  const open = raw.search(/<svg\s+xmlns/);
  const close = raw.lastIndexOf('</svg>') + '</svg>'.length;
  if (open === -1) throw new Error('sprite.svg: could not find the root <svg xmlns …> element');
  return raw
    .slice(open, close)
    .replace(' style="display:none"', ' class="rp-sprite" aria-hidden="true" hidden');
}

const sprite = spriteBody(await readFile(SPRITE, 'utf8'));
const block = `${START}\n  ${sprite.replace(/\n/g, '\n  ')}\n  ${END}`;

const demosDir = join(ROOT, 'demos');
const demos = (await readdir(demosDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let changed = 0;
let missing = 0;

for (const demo of demos) {
  const file = join(demosDir, demo, 'index.html');
  let html;
  try {
    html = await readFile(file, 'utf8');
  } catch {
    continue; // demo not built yet
  }

  const s = html.indexOf(START);
  const e = html.indexOf(END);
  if (s === -1 || e === -1) {
    console.warn(`!  ${demo}: sprite markers not found  skipped`);
    missing++;
    continue;
  }

  const next = html.slice(0, s) + block + html.slice(e + END.length);
  if (next === html) {
    console.log(`=  ${demo}: up to date`);
    continue;
  }

  changed++;
  if (checkOnly) {
    console.log(`!  ${demo}: OUT OF DATE`);
  } else {
    await writeFile(file, next, 'utf8');
    console.log(`+  ${demo}: sprite injected`);
  }
}

console.log(`\n${demos.length} demos · ${changed} ${checkOnly ? 'out of date' : 'updated'} · ${missing} missing markers`);
if (checkOnly && changed > 0) process.exit(1);
