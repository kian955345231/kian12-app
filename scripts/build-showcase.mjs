/**
 * scripts/build-showcase.mjs  DEV TOOL (not part of the sold package)
 *
 * Generates showcase/demo.html: the preview / sales sheet for the package.
 * Everything comes from scripts/demos.mjs, so the page can never drift from the
 * demos themselves. The output is a single self-contained file  no JavaScript,
 * no external requests, all icons taken from the package's own sprite.
 *
 * Design brief for the page (deliberately not a generic SaaS landing page):
 *   - a specimen-sheet look: warm paper, hairline rules, blueprint grid, corner
 *     ticks, Persian numerals set as catalogue indices
 *   - every icon is a symbol from core/assets/icons/sprite.svg  no emoji
 *   - each demo card is tinted by that demo's own palette
 *   - three CSS-only interactions: theme switch, gallery filter, lightbox tabs
 *
 * Usage: node scripts/build-showcase.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { demos } from './demos.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'showcase', 'demo.html');

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const fa = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[+d]);
const pad = (n) => fa(String(n).padStart(2, '0'));
/** ASCII slug for ids and fragment links  Persian digits stay in the copy. */
const ref = (n) => String(n).padStart(2, '0');

/** The letter in front of "A  هیروی…" is the layout archetype. */
const archLetter = (d) => d.archetype.trim().charAt(0);
const archName = (d) => d.archetype.replace(/^.\s*—\s*/, '');

/** Only the symbols the page actually uses, lifted from the shared sprite. */
const ICONS = [
  'terminal', 'smartphone', 'palette', 'scale', 'stethoscope', 'chart',
  'rocket', 'pen', 'user', 'film', 'layers', 'trending', 'camera', 'activity',
  'moon', 'sun', 'globe',
  'monitor', 'search', 'check', 'close', 'arrow-left', 'arrow-right',
  'external', 'sparkle', 'settings', 'grid', 'download'
];

async function spriteSubset() {
  const src = await readFile(join(ROOT, 'core', 'assets', 'icons', 'sprite.svg'), 'utf8');
  const symbols = [...src.matchAll(/<symbol id="([a-z-]+)"[\s\S]*?<\/symbol>/g)];
  const wanted = symbols.filter((m) => ICONS.includes(m[1])).map((m) => `    ${m[0]}`);
  const missing = ICONS.filter((id) => !symbols.some((m) => m[1] === id));
  if (missing.length) console.warn(`!  sprite is missing: ${missing.join(', ')}`);
  return wanted.join('\n');
}

const icon = (id, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#${id}"></use></svg>`;

/* --------------------------------------------------------------------------
   Page copy that is not derived from demos.mjs
   -------------------------------------------------------------------------- */

const SPEC = [
  ['دموی کامل و مستقل', demos.length, 'grid'],
  ['معماری چیدمان', 5, 'layers'],
  ['عکس واقعی و لایسنس‌دار', demos.length * 12, 'monitor'],
  ['وابستگی خارجی و CDN', 0, 'globe']
];

const CRAFT = [
  ['layers', 'معماری ماژولار',
   'هسته‌ی مشترک برای فونت، اجزا و رفتار؛ هر دمو فقط توکن‌ها و محتوای خودش را دارد. افزودن دمو یعنی کپی یک پوشه.'],
  ['palette', 'پانزده پالت مجزا',
   'هر حرفه رنگ، تایپوگرافی و چیدمان اختصاصی دارد  نه صرفاً تعویض یک رنگ روی یک قالب.'],
  ['moon', 'تاریک و روشن',
   'سوییچ تم با ذخیره‌سازی در localStorage و اسکریپت ضدپرش، بدون پرش رنگ هنگام بارگذاری.'],
  ['smartphone', 'ریسپانسیو واقعی',
   'از ۳۲۰ تا ۲۵۶۰ پیکسل آزمایش شده؛ بدون اسکرول افقی، بدون shrink-to-fit، با منوی کشویی و تله‌ی فوکوس.'],
  ['globe', 'راست‌به‌چپ اصولی',
   'فقط ویژگی‌های منطقی CSS؛ هیچ left/right فیزیکی در استایل‌ها نیست. فونت‌های دانا و رخ به‌صورت محلی.'],
  ['settings', 'بدون وابستگی',
   'جاوااسکریپت خالص و ماژولار مبتنی بر data-attribute؛ بدون jQuery، بدون بیلد اجباری.']
];

const TREE = [
  [0, 'core/', 'هسته‌ی مشترک  بدون کد اختصاصی هیچ دمویی'],
  [1, 'assets/fonts/', 'دانا · رخ · Plus Jakarta (متغیر)'],
  [1, 'assets/icons/sprite.svg', 'اسپرایت آیکون  منبع حقیقت'],
  [1, 'css/reset.css', 'ریست پایه و راست‌به‌چپ'],
  [1, 'css/core.css', 'قرارداد توکن‌ها، چیدمان، تایپوگرافی'],
  [1, 'css/components.css', 'دکمه · کارت · فرم · اسلایدر · آکاردئون'],
  [1, 'js/core.js', 'رفتار مشترک مبتنی بر data-attribute'],
  [0, 'demos/01-web-developer/', 'یکی از ده پوشه‌ی هم‌ساختار'],
  [1, 'index.html', 'محتوای همین دمو'],
  [1, 'css/theme.css', 'فقط توکن‌ها و استایل همین دمو'],
  [1, 'js/demo.js', 'رفتار اختصاصی (اختیاری)'],
  [1, 'img/', 'عکس‌های واقعی و لوگوهای همین دمو'],
  [0, 'showcase/demo.html', 'همین صفحه‌ی پیش‌نمایش'],
  [0, 'docs/', 'راهنمای سبک و اعتبار تصاویر']
];


const TOKENS = `:root {
  --rp-primary:        #3ddc84;
  --rp-primary-strong: #2bc46f;
  --rp-accent:         #22d3ee;

  --rp-bg:             #070a12;
  --rp-surface:        #10141f;
  --rp-text:           #f4f7fb;
  --rp-muted:          #8b95a8;
  --rp-border:         #1e2534;

  --rp-radius:         16px;
  --rp-container:      1200px;
}`;

const LICENSE = [
  [true, 'استفاده در یک پروژه (تک‌دامنه) با لایسنس استاندارد'],
  [true, 'ویرایش و شخصی‌سازی نامحدود کد و محتوا'],
  [true, 'حذف کامل حق امتیاز از فوتر، بدون محدودیت'],
  [true, 'همه‌ی عکس‌ها با لایسنس Unsplash  تجاری و بدون نیاز به ذکر نام'],
  [true, 'فایل‌های سازمان‌یافته با کامنت انگلیسی و مستندات فارسی'],
  [false, 'فروش مجدد به‌صورت قالب آماده، بدون مجوز Extended']
];

/* --------------------------------------------------------------------------
   Fragments
   -------------------------------------------------------------------------- */

function specSheet() {
  return SPEC.map(([label, value, ic]) => `
        <div class="spec-row">
          <span class="spec-ic">${icon(ic)}</span>
          <span class="spec-label">${label}</span>
          <span class="spec-rule" aria-hidden="true"></span>
          <span class="spec-value">${fa(value)}</span>
        </div>`).join('');
}

function craftGrid() {
  return CRAFT.map(([ic, title, body], i) => `
          <article class="craft">
            <span class="craft-idx" aria-hidden="true">${pad(i + 1)}</span>
            <span class="craft-ic">${icon(ic)}</span>
            <h3>${title}</h3>
            <p>${body}</p>
          </article>`).join('');
}

function treeRows() {
  return TREE.map(([depth, path, note]) => `
            <li class="tree-row tree-d${depth}">
              <code>${path}</code>
              <span class="tree-note">${note}</span>
            </li>`).join('');
}

function card(d, i) {
  const n = i + 1;
  const p = d.palette;
  const swatches = [
    [p.primary, 'رنگ اصلی'],
    [p.accent, 'رنگ تاکید'],
    [d.mood === 'dark' ? p.ink : p.surface, 'سطح']
  ].map(([hex, name]) => `<i style="background:${hex}" title="${name} ${hex}"></i>`).join('');

  return `
          <article class="card" data-mood="${d.mood}"
            style="--c-primary:${p.primary};--c-accent:${p.accent};--c-ink:${p.ink}">

            <div class="card-stage">
              <a class="card-shot" href="#lb-${ref(n)}" aria-label="بزرگ‌نمایی دموی ${d.fa}">
                <img src="img/${d.slug}-card.png" alt="نمای دسکتاپ دموی ${d.fa}"
                  width="864" height="540" loading="lazy" decoding="async">
                <span class="card-zoom">${icon('search')}<span>بزرگ‌نمایی</span></span>
              </a>

              <div class="card-phone" aria-hidden="true">
                <img src="img/${d.slug}-phone.png" alt="" width="390" height="844" loading="lazy" decoding="async">
              </div>

              <span class="card-idx"><b>${pad(n)}</b><span>/ ${fa(demos.length)}</span></span>
              <span class="card-arch" title="معماری چیدمان ${archLetter(d)}  ${archName(d)}">${archLetter(d)}</span>
            </div>

            <div class="card-body">
              <div class="card-head">
                <span class="card-ic">${icon(d.icon)}</span>
                <h3>${d.fa}</h3>
                <span class="card-en">${d.en}</span>
              </div>

              <p class="card-desc">${d.desc}</p>

              <ul class="card-chips">${d.chips.map((c) => `<li>${c}</li>`).join('')}</ul>

              <div class="card-meta">
                <span class="card-person">${d.person} · ${d.role}</span>
                <span class="card-sw">${swatches}</span>
              </div>

              <div class="card-links">
                <a class="btn btn-line" href="#lb-${ref(n)}">${icon('search')} پیش‌نمایش</a>
                <a class="btn btn-fill" href="../demos/${d.slug}/index.html">${icon('external')} دموی زنده</a>
              </div>
            </div>
          </article>`;
}

function lightboxes(d, i) {
  const n = i + 1;
  const id = ref(n);
  const label = pad(n);
  const prev = ref(n === 1 ? demos.length : n - 1);
  const next = ref(n === demos.length ? 1 : n + 1);
  const views = [
    ['', 'desktop', 'دسکتاپ', 'monitor', `نمای کامل دسکتاپ دموی ${d.fa}`],
    ['-m', 'mobile', 'موبایل', 'smartphone', `نمای کامل موبایل دموی ${d.fa}`],
    ['-d', 'dark', d.mood === 'dark' ? 'حالت روشن' : 'حالت تاریک', 'moon', `نمای دموی ${d.fa} در حالت مقابل`]
  ];

  return views.map(([sfx, file, label, ic, alt]) => `
  <div class="lb" id="lb-${id}${sfx}" role="dialog" aria-modal="true" aria-label="پیش‌نمایش دموی ${d.fa}">
    <a class="lb-dismiss" href="#demos" aria-label="بستن پیش‌نمایش"></a>
    <div class="lb-bar">
      <span class="lb-title"><b>${label}</b> ${d.fa} <span class="lb-en">${d.en}</span></span>
      <div class="lb-tabs">${views.map(([s2, , l2, i2]) => s2 === sfx
        ? `<span class="lb-tab is-on">${icon(i2)} ${l2}</span>`
        : `<a class="lb-tab" href="#lb-${id}${s2}">${icon(i2)} ${l2}</a>`).join('')}</div>
      <div class="lb-nav">
        <a class="lb-btn" href="#lb-${prev}" aria-label="دموی قبلی">${icon('arrow-right')}</a>
        <a class="lb-btn" href="#lb-${next}" aria-label="دموی بعدی">${icon('arrow-left')}</a>
        <a class="lb-btn lb-close" href="#demos" aria-label="بستن">${icon('close')}</a>
      </div>
    </div>
    <div class="lb-stage lb-stage--${file}">
      <img src="img/${d.slug}-${file}.png" alt="${alt}" loading="lazy" decoding="async">
    </div>
    <p class="lb-foot">
      <a href="../demos/${d.slug}/index.html">${icon('external')} باز کردن دموی زنده در مرورگر</a>
    </p>
  </div>`).join('');
}

/* --------------------------------------------------------------------------
   The page
   -------------------------------------------------------------------------- */

const sprite = await spriteSubset();

const html = `<!DOCTYPE html>
<!--
  پورتفولیو باورسا  صفحه‌ی پیش‌نمایش / Showcase sheet
  GENERATED FILE  do not edit by hand.
  Source: scripts/build-showcase.mjs + scripts/demos.mjs
  Rebuild:  node scripts/build-showcase.mjs

  Self-contained: no JavaScript, no external requests. Fonts come from
  ../core/assets/fonts, icons from the package's own sprite, and the three
  interactions (theme switch, gallery filter, lightbox) are pure CSS.
-->
<html lang="fa" dir="rtl">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>قالب پورتفولیو باورسا  پیش‌نمایش ۱۵ دمو</title>
  <meta name="description" content="قالب HTML پورتفولیو راست‌به‌چپ با ۱۵ دموی حرفه‌ای برای مشاغل مختلف؛ معماری ماژولار، حالت تاریک و روشن، عکس‌های واقعی و بدون هیچ وابستگی خارجی.">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#12141a">

  <style>
    /* ======================================================================
       0. Fonts  the same three files the demos use
       ====================================================================== */
    @font-face {
      font-family: 'Dana';
      src: url('../core/assets/fonts/DanaVF.ttf') format('truetype-variations');
      font-weight: 100 900;
      font-display: swap;
    }
    @font-face {
      font-family: 'Rokh';
      src: url('../core/assets/fonts/RokhVFGX.ttf') format('truetype-variations');
      font-weight: 100 900;
      font-display: swap;
    }
    @font-face {
      font-family: 'PlusJakartaSans';
      src: url('../core/assets/fonts/PlusJakartaSans-VF.ttf') format('truetype-variations');
      font-weight: 200 800;
      font-display: swap;
    }

    /* ======================================================================
       1. Tokens  a warm "specimen sheet" identity of its own, deliberately
          unlike any of the ten demos: paper, ink, lacquer red, verdigris.
       ====================================================================== */
    :root {
      --paper: #f6f3ee;
      --paper-2: #efeae2;
      --card: #fffefb;
      --ink: #16181d;
      --ink-soft: #3b4048;
      --ink-mute: #6d7480;
      --rule: #ddd6ca;
      --rule-soft: #e8e2d8;
      --lacquer: #c8412c;
      --lacquer-soft: rgba(200, 65, 44, 0.1);
      --verdigris: #1c6b63;
      --gold: #b4893a;

      --grid-line: rgba(22, 24, 29, 0.045);
      --shadow-sm: 0 1px 2px rgba(22, 24, 29, 0.06);
      --shadow: 0 18px 40px -22px rgba(22, 24, 29, 0.35);
      --shadow-lg: 0 40px 80px -30px rgba(22, 24, 29, 0.5);

      --w: 1240px;
      --r: 14px;
      --r-lg: 22px;

      --f-body: 'Dana', system-ui, sans-serif;
      --f-display: 'Rokh', 'Dana', system-ui, sans-serif;
      --f-meta: 'PlusJakartaSans', ui-monospace, monospace;

      color-scheme: light;
    }

    /* Dark: same identity after dusk  ink paper, warmer lacquer. */
    :root:has(#t-dark:checked),
    :root:has(#t-auto:checked) {
      color-scheme: light;
    }

    @media (prefers-color-scheme: dark) {
      :root:has(#t-auto:checked) {
        --paper: #101216;
        --paper-2: #15181d;
        --card: #191c22;
        --ink: #f2efe9;
        --ink-soft: #cfcbc3;
        --ink-mute: #8e939c;
        --rule: #2a2e36;
        --rule-soft: #23272e;
        --lacquer: #ff6a52;
        --lacquer-soft: rgba(255, 106, 82, 0.14);
        --verdigris: #4fc3b6;
        --gold: #d9ab5c;
        --grid-line: rgba(242, 239, 233, 0.05);
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
        --shadow: 0 18px 40px -20px rgba(0, 0, 0, 0.7);
        --shadow-lg: 0 40px 90px -30px rgba(0, 0, 0, 0.85);
        color-scheme: dark;
      }
    }

    :root:has(#t-dark:checked) {
      --paper: #101216;
      --paper-2: #15181d;
      --card: #191c22;
      --ink: #f2efe9;
      --ink-soft: #cfcbc3;
      --ink-mute: #8e939c;
      --rule: #2a2e36;
      --rule-soft: #23272e;
      --lacquer: #ff6a52;
      --lacquer-soft: rgba(255, 106, 82, 0.14);
      --verdigris: #4fc3b6;
      --gold: #d9ab5c;
      --grid-line: rgba(242, 239, 233, 0.05);
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
      --shadow: 0 18px 40px -20px rgba(0, 0, 0, 0.7);
      --shadow-lg: 0 40px 90px -30px rgba(0, 0, 0, 0.85);
      color-scheme: dark;
    }

    /* ======================================================================
       2. Base
       ====================================================================== */
    *, *::before, *::after { box-sizing: border-box; margin: 0; }

    html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; scroll-padding-block-start: 90px; }

    body {
      font-family: var(--f-body);
      background-color: var(--paper);
      /* Blueprint grid + a hairline baseline rhythm, drawn in CSS only. */
      background-image:
        linear-gradient(var(--grid-line) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
      background-size: 28px 28px, 28px 28px;
      color: var(--ink);
      line-height: 1.8;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    img { display: block; max-inline-size: 100%; block-size: auto; }
    a { color: inherit; text-decoration: none; }
    ul, ol { list-style: none; padding: 0; }
    button, input { font: inherit; color: inherit; }

    :focus-visible {
      outline: 2px solid var(--lacquer);
      outline-offset: 3px;
      border-radius: 4px;
    }

    .ic {
      inline-size: 1.15em;
      block-size: 1.15em;
      flex: none;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .wrap {
      inline-size: 100%;
      max-inline-size: var(--w);
      margin-inline: auto;
      padding-inline: clamp(1rem, 0.5rem + 2vw, 2.5rem);
    }

    .meta {
      font-family: var(--f-meta);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ink-mute);
    }

    /* Visually hidden until focused  the skip link must be reachable. */
    .sr:focus-visible {
      position: static;
      inline-size: auto;
      block-size: auto;
      clip-path: none;
      display: inline-block;
      padding: 0.5em 1em;
      background: var(--ink);
      color: var(--paper);
    }

    .sr {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    /* A hairline with a tick at each end  the sheet's signature divider. */
    .rule {
      position: relative;
      block-size: 1px;
      background: var(--rule);
      margin-block: clamp(2.5rem, 1.5rem + 3vw, 4.5rem);
    }
    .rule::before, .rule::after {
      content: '';
      position: absolute;
      inset-block-start: -4px;
      inline-size: 1px;
      block-size: 9px;
      background: var(--rule);
    }
    .rule::before { inset-inline-start: 0; }
    .rule::after { inset-inline-end: 0; }

    /* ======================================================================
       3. Header
       ====================================================================== */
    .hd {
      position: sticky;
      inset-block-start: 0;
      z-index: 60;
      background: color-mix(in srgb, var(--paper) 88%, transparent);
      backdrop-filter: blur(12px);
      border-block-end: 1px solid var(--rule);
    }

    .hd-in {
      display: flex;
      align-items: center;
      gap: clamp(0.75rem, 0.5rem + 1vw, 2rem);
      min-block-size: 72px;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.7rem;
      margin-inline-end: auto;
    }

    /* Monogram: the Persian letter "ر" in the display face, in a ruled box. */
    .brand-mark {
      position: relative;
      display: grid;
      place-items: center;
      inline-size: 42px;
      block-size: 42px;
      border-radius: 12px;
      background: var(--ink);
      color: var(--paper);
      font-family: var(--f-display);
      font-size: 1.5rem;
      font-weight: 800;
      line-height: 1;
      padding-block-end: 0.12em;
    }
    .brand-mark::after {
      content: '';
      position: absolute;
      inset: 4px;
      border: 1px solid color-mix(in srgb, var(--paper) 35%, transparent);
      border-radius: 8px;
    }

    .brand-txt { display: grid; line-height: 1.25; }
    .brand-name { font-family: var(--f-display); font-weight: 800; font-size: 1.05rem; }
    .brand-sub { font-family: var(--f-meta); font-size: 0.68rem; letter-spacing: 0.14em; color: var(--ink-mute); }

    .hd-nav { display: flex; gap: 1.4rem; }
    .hd-nav a {
      position: relative;
      font-size: 0.92rem;
      color: var(--ink-soft);
      padding-block: 0.4rem;
    }
    .hd-nav a::after {
      content: '';
      position: absolute;
      inset-block-end: 0;
      inset-inline: 50%;
      block-size: 2px;
      background: var(--lacquer);
      transition: inset-inline 0.3s ease;
    }
    .hd-nav a:hover { color: var(--ink); }
    .hd-nav a:hover::after { inset-inline: 0; }

    @media (max-width: 860px) { .hd-nav { display: none; } }

    /* --- CSS-only theme switch (three radios, no script) ------------------ */
    .themer { display: flex; align-items: center; gap: 2px; padding: 3px; border: 1px solid var(--rule); border-radius: 999px; background: var(--card); }
    .themer input { position: absolute; opacity: 0; pointer-events: none; }
    .themer label {
      display: grid;
      place-items: center;
      inline-size: 32px;
      block-size: 30px;
      border-radius: 999px;
      color: var(--ink-mute);
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;
    }
    .themer label:hover { color: var(--ink); }
    .themer input:checked + label { background: var(--ink); color: var(--paper); }
    .themer .ic { inline-size: 1.05em; block-size: 1.05em; }

    /* ======================================================================
       4. Buttons
       ====================================================================== */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.62em 1.25em;
      border-radius: 999px;
      border: 1px solid transparent;
      font-size: 0.9rem;
      font-weight: 700;
      white-space: nowrap;
      transition: transform 0.22s ease, background-color 0.22s ease, color 0.22s ease, border-color 0.22s ease;
    }
    .btn:hover { transform: translateY(-2px); }
    .btn-fill { background: var(--ink); color: var(--paper); }
    .btn-fill:hover { background: var(--lacquer); color: #fff; }
    .btn-line { border-color: var(--rule); color: var(--ink); background: var(--card); }
    .btn-line:hover { border-color: var(--ink); }
    .btn-lac { background: var(--lacquer); color: #fff; }
    .btn-lg { padding: 0.8em 1.7em; font-size: 1rem; }

    /* ======================================================================
       5. Hero  copy on one side, a live spec sheet on the other
       ====================================================================== */
    .hero { padding-block: clamp(2.5rem, 1.5rem + 4vw, 5rem) 0; }

    .hero-in {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
      gap: clamp(2rem, 1rem + 4vw, 4.5rem);
      align-items: center;
    }
    @media (max-width: 900px) { .hero-in { grid-template-columns: 1fr; } }

    .kicker {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-block-end: 1.4rem;
    }
    .kicker .dot {
      inline-size: 7px;
      block-size: 7px;
      border-radius: 50%;
      background: var(--lacquer);
      box-shadow: 0 0 0 4px var(--lacquer-soft);
    }

    .hero h1 {
      font-family: var(--f-display);
      font-size: clamp(2.3rem, 1.4rem + 3.6vw, 4.2rem);
      font-weight: 800;
      line-height: 1.16;
      letter-spacing: -0.02em;
    }

    /* Highlighter: painted as the span's own background, so the glyphs always
       sit on top of it  no stacking-context surprises. */
    .mark-word {
      white-space: nowrap;
      padding-inline: 0.12em;
      background-image: linear-gradient(var(--lacquer-soft), var(--lacquer-soft));
      background-repeat: no-repeat;
      background-size: 100% 0.3em;
      /* Sits across the baseline of the Persian glyphs, not under the line box. */
      background-position: 0 72%;
      box-decoration-break: clone;
    }

    .hero-lead {
      margin-block-start: 1.5rem;
      max-inline-size: 52ch;
      color: var(--ink-soft);
      font-size: clamp(1rem, 0.95rem + 0.25vw, 1.12rem);
    }

    .hero-cta { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-block-start: 2rem; }

    .hero-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-block-start: 1.5rem;
      font-size: 0.85rem;
      color: var(--ink-mute);
    }
    .hero-note .ic { color: var(--verdigris); }

    /* --- The spec sheet -------------------------------------------------- */
    .spec {
      position: relative;
      padding: clamp(1.25rem, 1rem + 1vw, 2rem);
      background: var(--card);
      border: 1px solid var(--rule);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow);
    }
    /* Corner ticks  a drafting-sheet detail used on cards too. */
    .spec::before, .spec::after {
      content: '';
      position: absolute;
      inline-size: 14px;
      block-size: 14px;
      border: 1px solid var(--lacquer);
      opacity: 0.55;
    }
    .spec::before {
      inset-block-start: 10px;
      inset-inline-start: 10px;
      border-width: 1px 0 0 1px;
    }
    .spec::after {
      inset-block-end: 10px;
      inset-inline-end: 10px;
      border-width: 0 1px 1px 0;
    }

    .spec-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      padding-block-end: 0.9rem;
      margin-block-end: 0.4rem;
      border-block-end: 1px solid var(--rule);
    }
    .spec-head h2 { font-family: var(--f-display); font-size: 1.05rem; font-weight: 700; }

    .spec-row {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding-block: 0.7rem;
    }
    .spec-row + .spec-row { border-block-start: 1px dashed var(--rule-soft); }
    .spec-ic { display: grid; place-items: center; color: var(--ink-mute); }
    .spec-label { font-size: 0.9rem; color: var(--ink-soft); }
    .spec-rule { flex: 1; block-size: 1px; background: repeating-linear-gradient(90deg, var(--rule) 0 3px, transparent 3px 7px); }
    .spec-value {
      font-family: var(--f-display);
      font-size: 1.7rem;
      font-weight: 800;
      line-height: 1;
      color: var(--lacquer);
    }

    /* ======================================================================
       6. Section heads
       ====================================================================== */
    .sec { padding-block: clamp(2rem, 1rem + 3vw, 3.5rem); }

    .sec-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-block-end: clamp(1.5rem, 1rem + 2vw, 2.75rem);
    }
    .sec-head h2 {
      font-family: var(--f-display);
      font-size: clamp(1.6rem, 1.2rem + 1.6vw, 2.5rem);
      font-weight: 800;
      line-height: 1.2;
      margin-block-start: 0.5rem;
    }
    .sec-head p { color: var(--ink-mute); max-inline-size: 46ch; font-size: 0.95rem; }

    /* ======================================================================
       7. Craft grid
       ====================================================================== */
    .crafts {
      display: grid;
      /* Fixed column counts (6 items = 3x2 = 2x3 = 6x1) so the hairline grid
         never shows a half-empty row. */
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1px;
      background: var(--rule);
      border: 1px solid var(--rule);
      border-radius: var(--r-lg);
      overflow: hidden;
    }

    .craft {
      position: relative;
      padding: clamp(1.4rem, 1rem + 1vw, 2rem);
      background: var(--card);
      transition: background-color 0.25s ease;
    }
    .craft:hover { background: var(--paper-2); }

    @media (max-width: 1000px) { .crafts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 620px) { .crafts { grid-template-columns: minmax(0, 1fr); } }
    .craft-idx {
      font-family: var(--f-meta);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--ink-mute);
    }
    .craft-ic {
      display: grid;
      place-items: center;
      inline-size: 40px;
      block-size: 40px;
      margin-block: 0.9rem 1rem;
      border-radius: 11px;
      background: var(--lacquer-soft);
      color: var(--lacquer);
    }
    .craft-ic .ic { inline-size: 1.35em; block-size: 1.35em; }
    .craft h3 { font-family: var(--f-display); font-size: 1.1rem; font-weight: 700; margin-block-end: 0.4rem; }
    .craft p { color: var(--ink-mute); font-size: 0.9rem; }

    /* ======================================================================
       8. Gallery  CSS-only filter
       ====================================================================== */
    .gal > input { position: absolute; opacity: 0; pointer-events: none; }

    .filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-block-end: clamp(1.25rem, 1rem + 1vw, 2rem);
    }
    .filter label {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45em 1.1em;
      border: 1px solid var(--rule);
      border-radius: 999px;
      background: var(--card);
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ink-soft);
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s, border-color 0.2s;
    }
    .filter label:hover { border-color: var(--ink-mute); }

    /* The three radios sit before the filter row and the grid, so plain sibling
       selectors drive both the active pill and the filtering. No script. */
    #f-all:checked ~ .filter label[for='f-all'],
    #f-light:checked ~ .filter label[for='f-light'],
    #f-dark:checked ~ .filter label[for='f-dark'] {
      background: var(--ink);
      border-color: var(--ink);
      color: var(--paper);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(380px, 100%), 1fr));
      gap: clamp(1.25rem, 1rem + 1vw, 2rem);
    }

    /* The filter radios sit right before the grid, so a sibling selector is
       enough  no :has(), no script. */
    #f-light:checked ~ .grid .card[data-mood='dark'],
    #f-dark:checked ~ .grid .card[data-mood='light'] { display: none; }

    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      background: var(--card);
      border: 1px solid var(--rule);
      border-radius: var(--r-lg);
      overflow: hidden;
      transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: color-mix(in srgb, var(--c-primary) 55%, var(--rule));
      box-shadow: var(--shadow);
    }

    /* --- Stage: desktop shot + a phone leaning on it --------------------- */
    .card-stage {
      position: relative;
      background:
        radial-gradient(120% 120% at 70% 0%, color-mix(in srgb, var(--c-primary) 18%, transparent), transparent 60%),
        var(--paper-2);
      padding: clamp(1rem, 0.75rem + 1vw, 1.5rem);
      padding-block-end: clamp(1.75rem, 1.25rem + 1.5vw, 2.5rem);
      border-block-end: 1px solid var(--rule);
    }

    .card-shot {
      position: relative;
      display: block;
      aspect-ratio: 16 / 10;
      overflow: hidden;
      border-radius: 10px;
      border: 1px solid color-mix(in srgb, var(--c-ink) 18%, var(--rule));
      box-shadow: var(--shadow-sm);
      background: var(--c-ink);
    }
    .card-shot img {
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
      object-position: top center;
      transition: transform 0.7s ease;
    }
    .card:hover .card-shot img { transform: scale(1.03); }

    .card-zoom {
      position: absolute;
      inset-block-end: 0.6rem;
      inset-inline-start: 0.6rem;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35em 0.8em;
      border-radius: 999px;
      background: rgba(12, 14, 18, 0.7);
      backdrop-filter: blur(4px);
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .card:hover .card-zoom, .card-shot:focus-visible .card-zoom { opacity: 1; transform: none; }

    /* The phone: a real mobile capture, framed, overlapping the desktop shot. */
    .card-phone {
      position: absolute;
      inset-block-end: -0.5rem;
      inset-inline-end: clamp(1rem, 0.75rem + 1vw, 1.6rem);
      inline-size: clamp(58px, 5vw + 40px, 76px);
      aspect-ratio: 9 / 18;
      padding: 3px;
      border-radius: 12px;
      background: linear-gradient(160deg, #4a4f59, #22262d);
      box-shadow: var(--shadow);
      transition: transform 0.4s ease;
    }
    .card:hover .card-phone { transform: translateY(-4px) rotate(-2deg); }
    .card-phone img {
      inline-size: 100%;
      block-size: 100%;
      border-radius: 9px;
      object-fit: cover;
      object-position: top center;
    }

    .card-idx {
      position: absolute;
      inset-block-start: clamp(1rem, 0.75rem + 1vw, 1.5rem);
      inset-inline-start: clamp(1rem, 0.75rem + 1vw, 1.5rem);
      display: inline-flex;
      align-items: baseline;
      gap: 0.2rem;
      padding: 0.2em 0.6em;
      border-radius: 8px;
      background: rgba(12, 14, 18, 0.72);
      backdrop-filter: blur(4px);
      color: #fff;
      font-family: var(--f-display);
      line-height: 1.4;
    }
    .card-idx b { font-size: 0.95rem; font-weight: 800; }
    .card-idx span { font-size: 0.7rem; opacity: 0.65; }

    .card-arch {
      position: absolute;
      inset-block-start: clamp(1rem, 0.75rem + 1vw, 1.5rem);
      inset-inline-end: clamp(1rem, 0.75rem + 1vw, 1.5rem);
      display: grid;
      place-items: center;
      inline-size: 28px;
      block-size: 28px;
      border-radius: 50%;
      background: var(--c-primary);
      color: var(--c-ink);
      font-family: var(--f-meta);
      font-size: 0.78rem;
      font-weight: 800;
    }

    /* --- Body ------------------------------------------------------------ */
    .card-body {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      padding: clamp(1.1rem, 0.9rem + 0.6vw, 1.5rem);
      flex: 1;
    }

    .card-head { display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; }
    .card-ic {
      display: grid;
      place-items: center;
      inline-size: 30px;
      block-size: 30px;
      border-radius: 9px;
      background: color-mix(in srgb, var(--c-primary) 16%, transparent);
      color: color-mix(in srgb, var(--c-primary) 78%, var(--ink));
    }
    .card-head h3 { font-family: var(--f-display); font-size: 1.22rem; font-weight: 700; }
    .card-en {
      font-family: var(--f-meta);
      font-size: 0.68rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ink-mute);
      margin-inline-start: auto;
      direction: ltr;
    }

    .card-desc { color: var(--ink-mute); font-size: 0.88rem; flex: 1; }

    .card-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .card-chips li {
      padding: 0.2em 0.65em;
      border-radius: 6px;
      background: var(--paper-2);
      border: 1px solid var(--rule-soft);
      font-size: 0.74rem;
      color: var(--ink-soft);
    }

    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding-block-start: 0.85rem;
      border-block-start: 1px solid var(--rule-soft);
    }
    .card-person { font-size: 0.76rem; color: var(--ink-mute); }
    .card-sw { display: inline-flex; gap: 0.3rem; flex: none; }
    .card-sw i {
      inline-size: 18px;
      block-size: 18px;
      border-radius: 50%;
      border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
    }

    .card-links { display: flex; gap: 0.5rem; }
    .card-links .btn { flex: 1; font-size: 0.82rem; padding-inline: 0.8em; }

    /* ======================================================================
       9. Anatomy  the file tree and the token contract, set as code
       ====================================================================== */
    .anatomy {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
      gap: clamp(1rem, 0.75rem + 1vw, 1.75rem);
      align-items: start;
    }

    .code {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--rule);
      border-radius: var(--r-lg);
      background: var(--card);
      overflow: hidden;
    }
    .code-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.7rem 1rem;
      border-block-end: 1px solid var(--rule);
      background: var(--paper-2);
    }
    .code-bar .ic { color: var(--ink-mute); }
    .code-bar span { font-family: var(--f-meta); font-size: 0.72rem; letter-spacing: 0.08em; color: var(--ink-soft); }
    .code pre {
      margin: 0;
      padding: 1.1rem 1.2rem;
      overflow-x: auto;
      font-family: var(--f-meta);
      font-size: 0.78rem;
      line-height: 1.9;
      color: var(--ink-soft);
      direction: ltr;
      text-align: start;
    }
    /* File tree: rows instead of ASCII art, so it survives bidi mixing. */
    .tree { padding: 0.9rem 1.1rem; display: grid; gap: 0.1rem; }
    .tree-row {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      padding-block: 0.28rem;
      font-size: 0.82rem;
    }
    .tree-row code {
      font-family: var(--f-meta);
      font-size: 0.78rem;
      color: var(--ink);
      direction: ltr;
      unicode-bidi: isolate;
      white-space: nowrap;
    }
    .tree-note { color: var(--ink-mute); font-size: 0.78rem; }
    .tree-d0 { margin-block-start: 0.5rem; }
    .tree-d0 code { font-weight: 700; color: var(--lacquer); }
    .tree-d0:first-child { margin-block-start: 0; }
    .tree-d1 {
      margin-inline-start: 0.65rem;
      padding-inline-start: 0.85rem;
      border-inline-start: 1px solid var(--rule);
    }

    /* ======================================================================
       10. Buy
       ====================================================================== */
    .buy {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
      gap: clamp(1.5rem, 1rem + 2vw, 3rem);
      align-items: center;
      padding: clamp(1.5rem, 1rem + 2.5vw, 3rem);
      border-radius: var(--r-lg);
      border: 1px solid var(--rule);
      background:
        radial-gradient(90% 140% at 90% 0%, var(--lacquer-soft), transparent 55%),
        var(--card);
    }
    @media (max-width: 860px) { .buy { grid-template-columns: 1fr; } }

    .buy h2 {
      font-family: var(--f-display);
      font-size: clamp(1.6rem, 1.2rem + 1.8vw, 2.6rem);
      font-weight: 800;
      line-height: 1.2;
      max-inline-size: 24ch;
    }
    .buy p { color: var(--ink-mute); margin-block: 1rem 1.75rem; max-inline-size: 48ch; }

    .lic { display: grid; gap: 0.6rem; }
    .lic li { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.9rem; color: var(--ink-soft); }
    .lic .ic { margin-block-start: 0.35em; }
    .lic .yes .ic { color: var(--verdigris); }
    .lic .no { color: var(--ink-mute); }
    .lic .no .ic { color: var(--lacquer); }

    /* ======================================================================
       11. Footer
       ====================================================================== */
    .ft { border-block-start: 1px solid var(--rule); margin-block-start: clamp(2.5rem, 2rem + 2vw, 4rem); padding-block: 2.5rem; }
    .ft-in { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
    .ft-in p { font-size: 0.84rem; color: var(--ink-mute); }
    .ft-in a { color: var(--ink-soft); border-block-end: 1px solid var(--rule); }
    .ft-in a:hover { color: var(--lacquer); border-color: currentColor; }

    /* ======================================================================
       12. Lightbox  :target, with view tabs and demo-to-demo navigation
       ====================================================================== */
    .lb {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: clamp(0.75rem, 0.5rem + 1.5vw, 1.75rem);
      background: color-mix(in srgb, #0a0b0e 92%, transparent);
      backdrop-filter: blur(8px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .lb:target { opacity: 1; visibility: visible; }

    /* Click anywhere on the backdrop to close. */
    .lb-dismiss { position: absolute; inset: 0; cursor: zoom-out; }

    .lb-bar, .lb-stage, .lb-foot { position: relative; }

    .lb-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      color: #fff;
    }
    .lb-title { font-family: var(--f-display); font-size: 1.05rem; font-weight: 700; margin-inline-end: auto; }
    .lb-title b { color: #ff8a75; margin-inline-end: 0.3rem; }
    .lb-en { font-family: var(--f-meta); font-size: 0.68rem; letter-spacing: 0.1em; opacity: 0.6; direction: ltr; }

    .lb-tabs { display: flex; gap: 3px; padding: 3px; border-radius: 999px; background: rgba(255, 255, 255, 0.1); }
    .lb-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35em 0.9em;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
      transition: background-color 0.2s, color 0.2s;
    }
    .lb-tab:hover { color: #fff; background: rgba(255, 255, 255, 0.12); }
    .lb-tab.is-on { background: #fff; color: #16181d; }

    .lb-nav { display: flex; gap: 0.4rem; }
    .lb-btn {
      display: grid;
      place-items: center;
      inline-size: 38px;
      block-size: 38px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      transition: background-color 0.2s, border-color 0.2s;
    }
    .lb-btn:hover { background: rgba(255, 255, 255, 0.14); }
    .lb-close:hover { background: var(--lacquer); border-color: var(--lacquer); }

    .lb-stage {
      flex: 1;
      min-block-size: 0;
      overflow: auto;
      border-radius: var(--r);
      background: #05060a;
      overscroll-behavior: contain;
    }
    .lb-stage img { inline-size: 100%; }

    /* The mobile capture is a tall, narrow full-page shot: centre it. */
    .lb-stage--mobile img { max-inline-size: 420px; margin-inline: auto; }

    .lb-foot { text-align: center; }
    .lb-foot a {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.72);
    }
    .lb-foot a:hover { color: #fff; }

    @media (max-width: 620px) {
      .lb-title { inline-size: 100%; }
      .lb-tabs { order: 3; inline-size: 100%; justify-content: center; }
    }

    /* ======================================================================
       13. Motion & print
       ====================================================================== */
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
    }

    @media print {
      .hd, .hero-cta, .card-links, .filter, .lb, .buy { display: none !important; }
      body { background: #fff; }
      .card { break-inside: avoid; }
    }
  </style>
</head>

<body>

  <!-- The package's own icon set  no emoji anywhere on this page. -->
  <svg xmlns="http://www.w3.org/2000/svg" hidden aria-hidden="true">
${sprite}
  </svg>

  <a class="sr" href="#demos">پرش به گالری دموها</a>

  <!-- ====================================================================
       Header
       ==================================================================== -->
  <header class="hd">
    <div class="wrap hd-in">
      <a class="brand" href="#top">
        <span class="brand-mark" aria-hidden="true">ر</span>
        <span class="brand-txt">
          <span class="brand-name">پورتفولیو باورسا</span>
          <span class="brand-sub">BAVARSA · RTL TEMPLATE</span>
        </span>
      </a>

      <nav class="hd-nav" aria-label="ناوبری صفحه">
        <a href="#craft">ساخت</a>
        <a href="#demos">۱۵ دمو</a>
        <a href="#anatomy">ساختار فایل‌ها</a>
        <a href="#buy">لایسنس</a>
      </nav>

      <fieldset class="themer">
        <legend class="sr">حالت نمایش این صفحه</legend>
        <input type="radio" name="theme" id="t-auto" checked>
        <label for="t-auto" title="خودکار (طبق تنظیم سیستم)">${icon('settings')}<span class="sr">خودکار</span></label>
        <input type="radio" name="theme" id="t-light">
        <label for="t-light" title="حالت روشن">${icon('sun')}<span class="sr">روشن</span></label>
        <input type="radio" name="theme" id="t-dark">
        <label for="t-dark" title="حالت تاریک">${icon('moon')}<span class="sr">تاریک</span></label>
      </fieldset>
    </div>
  </header>

  <main id="top">

    <!-- ==================================================================
         Hero
         ================================================================== -->
    <section class="hero">
      <div class="wrap hero-in">

        <div>
          <span class="kicker meta"><span class="dot"></span> قالب HTML · راست‌به‌چپ · نسخه ۱.۰</span>

          <h1>
            یک هسته، <span class="mark-word">پانزده حرفه</span>،<br>
            پانزده پورتفولیوی متفاوت.
          </h1>

          <p class="hero-lead">
            باورسا یک قالب چندمنظوره‌ی راست‌به‌چپ است که پانزده دموی کاملاً مستقل را روی یک
            هسته‌ی مشترک می‌سازد. هر دمو پالت، تایپوگرافی، چیدمان و عکس‌های خودش را دارد؛
            تغییر یکی هیچ اثری روی بقیه ندارد.
          </p>

          <div class="hero-cta">
            <a class="btn btn-lac btn-lg" href="#demos">${icon('grid')} گالری پانزده دمو</a>
            <a class="btn btn-line btn-lg" href="../demos/01-web-developer/index.html">${icon('external')} یک دمو را زنده ببینید</a>
          </div>

          <p class="hero-note">${icon('check')} تمام عکس‌ها واقعی و با لایسنس تجاری Unsplash  بدون تصویر تولیدشده با هوش مصنوعی.</p>
        </div>

        <aside class="spec" aria-label="مشخصات پکیج">
          <div class="spec-head">
            <h2>شناسنامه‌ی پکیج</h2>
            <span class="meta">SPEC</span>
          </div>
          ${specSheet()}
        </aside>

      </div>
    </section>

    <div class="wrap"><div class="rule"></div></div>

    <!-- ==================================================================
         Craft
         ================================================================== -->
    <section class="sec" id="craft">
      <div class="wrap">
        <div class="sec-head">
          <div>
            <span class="meta">۰۱  ساخت</span>
            <h2>چیزهایی که پشت این پانزده دمو گذاشته شده</h2>
          </div>
          <p>معماری‌ای که اضافه‌کردن دموی شانزدهم را به کپی یک پوشه تبدیل می‌کند.</p>
        </div>

        <div class="crafts">${craftGrid()}</div>
      </div>
    </section>

    <!-- ==================================================================
         Gallery
         ================================================================== -->
    <section class="sec" id="demos">
      <div class="wrap">
        <div class="sec-head">
          <div>
            <span class="meta">۰۲  گالری</span>
            <h2>پانزده دمو برای پانزده حرفه</h2>
          </div>
          <p>روی هر تصویر بزنید تا پیش‌نمایش کامل دسکتاپ، موبایل و حالت مقابل باز شود.</p>
        </div>

        <div class="gal">
          <input type="radio" name="mood" id="f-all" checked>
          <input type="radio" name="mood" id="f-light">
          <input type="radio" name="mood" id="f-dark">

          <div class="filter" role="group" aria-label="فیلتر دموها بر اساس حالت طراحی">
            <label for="f-all">${icon('grid')} همه (${fa(demos.length)})</label>
            <label for="f-light">${icon('sun')} روشن‌محور (${fa(demos.filter((d) => d.mood === 'light').length)})</label>
            <label for="f-dark">${icon('moon')} تیره‌محور (${fa(demos.filter((d) => d.mood === 'dark').length)})</label>
          </div>

          <div class="grid">${demos.map(card).join('')}
          </div>
        </div>
      </div>
    </section>

    <div class="wrap"><div class="rule"></div></div>

    <!-- ==================================================================
         Anatomy
         ================================================================== -->
    <section class="sec" id="anatomy">
      <div class="wrap">
        <div class="sec-head">
          <div>
            <span class="meta">۰۳  ساختار</span>
            <h2>چه چیزی تحویل می‌گیرید</h2>
          </div>
          <p>ساختار پوشه‌ها و قرارداد توکن‌ها؛ همان چیزی که شخصی‌سازی را کوتاه می‌کند.</p>
        </div>

        <div class="anatomy">
          <div class="code">
            <div class="code-bar">${icon('layers')}<span>FILE TREE</span></div>
            <ul class="tree">${treeRows()}
            </ul>
          </div>
          <div class="code">
            <div class="code-bar">${icon('palette')}<span>demos/01-web-developer/css/theme.css</span></div>
            <pre>${TOKENS}</pre>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================================================================
         Buy
         ================================================================== -->
    <section class="sec" id="buy">
      <div class="wrap">
        <div class="buy">
          <div>
            <span class="meta">۰۴  لایسنس</span>
            <h2>پورتفولیوی حرفه‌ای‌تان، همین امروز.</h2>
            <p>
              پس از خرید، کل پکیج در اختیار شماست: هسته‌ی مشترک، پانزده دمو، ۱۸۰ عکس واقعی،
              مستندات فارسی و راهنمای گام‌به‌گام افزودن دموی جدید.
            </p>
            <a class="btn btn-lac btn-lg" href="#buy">${icon('download')} دریافت پکیج</a>
          </div>

          <ul class="lic">
            ${LICENSE.map(([ok, text]) => `<li class="${ok ? 'yes' : 'no'}">${icon(ok ? 'check' : 'close')}<span>${text}</span></li>`).join('\n            ')}
          </ul>
        </div>
      </div>
    </section>

  </main>

  <!-- ====================================================================
       Footer
       ==================================================================== -->
  <footer class="ft">
    <div class="wrap ft-in">
      <p><strong>پورتفولیو باورسا</strong>  صفحه‌ی پیش‌نمایش، ساخته‌شده با همان هسته و همان اسپرایت آیکون.</p>
      <p>${fa(demos.length)} دمو · راست‌به‌چپ · بدون وابستگی · <a href="../docs/photo-credits.md">اعتبار تصاویر</a></p>
    </div>
  </footer>

  <!-- ====================================================================
       Lightboxes  three views per demo
       ==================================================================== -->
${demos.map(lightboxes).join('\n')}

</body>

</html>
`;

await writeFile(OUT, html, 'utf8');
console.log(`showcase/demo.html written  ${demos.length} demos, ${demos.length * 3} lightboxes, ${(html.length / 1024).toFixed(1)} KB`);
