/**
 * scripts/fetch-photos.mjs  DEV TOOL (not part of the sold package)
 *
 * Downloads the real photographs listed in scripts/photos.mjs into each demo's
 * img/ folder and writes docs/photo-credits.md.
 *
 * The photos come from Lorem Picsum, which redistributes a fixed set of
 * Unsplash-licensed photographs (free for commercial use, attribution not
 * required). Files land in the repository, so the package works offline and
 * ships without any external requests.
 *
 * Usage:
 *   node scripts/fetch-photos.mjs                  all demos, skip existing
 *   node scripts/fetch-photos.mjs 10-actor         one demo
 *   node scripts/fetch-photos.mjs --force          re-download everything
 *   node scripts/fetch-photos.mjs --check          report missing files only
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { photos } from './photos.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://picsum.photos';
const CONCURRENCY = 6;
const RETRIES = 3;

const args = process.argv.slice(2);
const force = args.includes('--force');
const checkOnly = args.includes('--check');
const only = args.filter((a) => !a.startsWith('--'));

const slugs = Object.keys(photos).filter((s) => !only.length || only.includes(s));
if (!slugs.length) {
  console.error(`No matching demo. Known: ${Object.keys(photos).join(', ')}`);
  process.exit(1);
}

/* --------------------------------------------------------------------------
   Build the work list
   -------------------------------------------------------------------------- */

const jobs = [];
for (const slug of slugs) {
  for (const [slot, [id, w, h]] of Object.entries(photos[slug])) {
    const file = join(ROOT, 'demos', slug, 'img', `${slot}.jpg`);
    jobs.push({ slug, slot, id, w, h, file });
  }
}

if (checkOnly) {
  const missing = jobs.filter((j) => !existsSync(j.file));
  missing.forEach((j) => console.log(`missing  ${j.slug}/img/${j.slot}.jpg`));
  console.log(`\n${jobs.length - missing.length}/${jobs.length} photos present`);
  process.exit(missing.length ? 1 : 0);
}

/* --------------------------------------------------------------------------
   Download
   -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function grab(url) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      if (res.status < 500 && res.status !== 429) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === RETRIES) throw err;
    }
    await sleep(attempt * 700);
  }
  throw new Error('unreachable');
}

const info = new Map();   // picsum id -> { author, url }
let done = 0;
let skipped = 0;
const failures = [];

async function worker(queue) {
  while (queue.length) {
    const job = queue.pop();
    if (!force && existsSync(job.file) && statSync(job.file).size > 1024) {
      skipped++;
      continue;
    }
    try {
      const buf = await grab(`${BASE}/id/${job.id}/${job.w}/${job.h}`);
      await mkdir(dirname(job.file), { recursive: true });
      await writeFile(job.file, buf);
      done++;
      console.log(`+  ${job.slug}/img/${job.slot}.jpg  ${job.w}x${job.h}  (${Math.round(buf.length / 1024)} KB)`);
    } catch (err) {
      failures.push(`${job.slug}/${job.slot}: ${err.message}`);
      console.warn(`!  ${job.slug}/img/${job.slot}.jpg  ${err.message}`);
    }
  }
}

const queue = jobs.slice();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

/* --------------------------------------------------------------------------
   Credits  one line per photograph actually used
   -------------------------------------------------------------------------- */

const ids = [...new Set(jobs.map((j) => j.id))].sort((a, b) => a - b);
for (const id of ids) {
  try {
    const res = await fetch(`${BASE}/id/${id}/info`);
    if (res.ok) {
      const j = await res.json();
      info.set(id, { author: j.author, url: j.url });
    }
  } catch {
    /* credits are best-effort; a missing entry is not fatal */
  }
}

const usage = new Map();  // id -> ["10-actor/hero", ...]
for (const j of jobs) {
  if (!usage.has(j.id)) usage.set(j.id, []);
  usage.get(j.id).push(`${j.slug}/${j.slot}`);
}

const lines = [
  '# اعتبار تصاویر  Photo credits',
  '',
  'همه‌ی عکس‌های این پکیج عکس واقعی و با مجوز Unsplash هستند (استفاده‌ی تجاری آزاد،',
  'ذکر نام الزامی نیست). فایل‌ها از سرویس [Lorem Picsum](https://picsum.photos) دریافت',
  'و داخل پوشه‌ی `img/` هر دمو ذخیره شده‌اند، بنابراین قالب هیچ درخواست خارجی نمی‌فرستد.',
  '',
  'برای جایگزینی، فایل هم‌نام را در `demos/<demo>/img/` عوض کنید؛ نسبت ابعاد را نگه',
  'دارید تا چیدمان دست‌نخورده بماند (کارت‌ها ۴:۳، پرتره‌ها ۳:۴، آواتارها ۱:۱).',
  '',
  '| # | عکاس / Photographer | منبع | استفاده |',
  '|---|---------------------|------|---------|'
];

for (const id of ids) {
  const meta = info.get(id);
  const author = meta ? meta.author : '—';
  const link = meta ? `[Unsplash](${meta.url})` : `[picsum #${id}](${BASE}/id/${id})`;
  lines.push(`| ${id} | ${author} | ${link} | ${usage.get(id).join('، ')} |`);
}

lines.push('', `_تولیدشده با \`node scripts/fetch-photos.mjs\`  ${ids.length} عکس، ${jobs.length} فایل._`, '');

await mkdir(join(ROOT, 'docs'), { recursive: true });
await writeFile(join(ROOT, 'docs', 'photo-credits.md'), lines.join('\n'), 'utf8');

console.log(`\n${done} downloaded · ${skipped} already present · ${failures.length} failed`);
console.log(`credits → docs/photo-credits.md (${ids.length} photographs)`);
if (failures.length) process.exit(1);
