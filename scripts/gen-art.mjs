/**
 * scripts/gen-art.mjs  DEV TOOL (not part of the sold package)
 *
 * Generates every demo's VECTOR marks as SVG, drawn in that demo's own palette
 * (see scripts/demos.mjs). Photography is handled separately  the hero,
 * portrait, work and avatar slots are real photographs downloaded by
 * scripts/fetch-photos.mjs. What is left here is the artwork that must stay
 * vector: invented client wordmarks and the favicon.
 *
 * Per demo it writes into demos/<slug>/img/:
 *   logo-1..6.svg   client logo marks for the marquee
 *   favicon.svg     monogram tab icon
 *
 * Run:  node scripts/gen-art.mjs [slug ...]
 * With no arguments it regenerates all demos.
 * Pass --with-placeholders to also emit the old abstract SVG panels, useful
 * when previewing a new palette before the photographs are chosen.
 *
 * Every file is deterministic: the same slug always yields the same art, so
 * regenerating never produces a spurious diff.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { demos } from './demos.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------------------------------------------------------------------------
   Deterministic PRNG (mulberry32) seeded from the demo slug
   --------------------------------------------------------------------------- */

function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------------------
   SVG helpers
   --------------------------------------------------------------------------- */

const svg = (w, h, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ${extra}>\n${body}\n</svg>\n`;

/** Linear gradient definition. */
const grad = (id, from, to, angle = 135) => {
  const rad = (angle * Math.PI) / 180;
  const x1 = (50 - Math.cos(rad) * 50).toFixed(1);
  const y1 = (50 - Math.sin(rad) * 50).toFixed(1);
  const x2 = (50 + Math.cos(rad) * 50).toFixed(1);
  const y2 = (50 + Math.sin(rad) * 50).toFixed(1);
  return `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`;
};

const r = (n, d = 1) => Number(n.toFixed(d));

/* ---------------------------------------------------------------------------
   Compositions
   Each returns a full SVG string for the given palette.
   --------------------------------------------------------------------------- */

/** Hero panel: soft gradient field, orbiting rings and an abstract figure. */
function hero(p, rand) {
  const W = 900;
  const H = 1080;
  const blobs = Array.from({ length: 5 }, () => ({
    cx: r(120 + rand() * 660),
    cy: r(120 + rand() * 840),
    rr: r(90 + rand() * 190),
    o: r(0.06 + rand() * 0.12, 2)
  }));

  return svg(
    W,
    H,
    `  <defs>
    ${grad('bg', p.ink, p.strong, 145)}
    ${grad('fig', p.primary, p.accent, 120)}
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="48"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    ${blobs
      .map((b) => `<circle cx="${b.cx}" cy="${b.cy}" r="${b.rr}" fill="${p.primary}" opacity="${b.o}"/>`)
      .join('\n    ')}
    <circle cx="450" cy="470" r="330" fill="none" stroke="${p.primary}" stroke-width="1.5" opacity=".35"/>
    <circle cx="450" cy="470" r="255" fill="none" stroke="${p.accent}" stroke-width="1.5" opacity=".28"/>

    <!-- Abstract figure: head + shoulders, deliberately non-photographic -->
    <circle cx="450" cy="405" r="150" fill="url(#fig)"/>
    <path d="M200 1080c0-160 112-268 250-268s250 108 250 268z" fill="url(#fig)" opacity=".92"/>
    <path d="M330 640q120 70 240 0" fill="none" stroke="${p.light}" stroke-width="6" stroke-linecap="round" opacity=".25"/>
  </g>`,
    'role="img" aria-label="تصویر انتزاعی پروفایل"'
  );
}

/** Tall about-section panel: stacked translucent cards over a grid. */
function portrait(p, rand) {
  const W = 760;
  const H = 900;
  return svg(
    W,
    H,
    `  <defs>
    ${grad('pc', p.primary, p.accent, 130)}
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="2" fill="${p.primary}" opacity=".22"/>
    </pattern>
    <clipPath id="pf"><rect width="${W}" height="${H}" rx="40"/></clipPath>
  </defs>
  <g clip-path="url(#pf)">
    <!-- Solid surface tone keeps this panel readable on both light and dark themes. -->
    <rect width="${W}" height="${H}" fill="${p.surface}"/>
    <circle cx="${r(150 + rand() * 120)}" cy="${r(140 + rand() * 120)}" r="220" fill="${p.primary}" opacity=".16"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
    <rect x="${r(70 + rand() * 30)}" y="150" width="470" height="640" rx="34" fill="url(#pc)" opacity=".95"/>
    <rect x="200" y="90" width="470" height="640" rx="34" fill="${p.ink}" opacity=".9"/>
    <circle cx="435" cy="300" r="112" fill="${p.primary}"/>
    <path d="M280 730c0-90 70-158 155-158s155 68 155 158z" fill="${p.primary}" opacity=".85"/>
  </g>`,
    'role="img" aria-label="تصویر انتزاعی درباره من"'
  );
}

/** Six distinct project-cover compositions, indexed 0..5. */
function work(p, rand, index) {
  const W = 1200;
  const H = 900;
  const g = `${grad('wg', p.primary, p.accent, 120 + index * 30)}\n    ${grad('wb', p.ink, p.strong, 160)}`;
  const frame = `<clipPath id="wf"><rect width="${W}" height="${H}" rx="0"/></clipPath>`;
  let art = '';

  switch (index % 6) {
    // 0  overlapping discs
    case 0:
      art = `<rect width="${W}" height="${H}" fill="${p.surface}"/>
    <circle cx="470" cy="450" r="300" fill="url(#wg)"/>
    <circle cx="760" cy="450" r="300" fill="${p.ink}" opacity=".82"/>
    <circle cx="615" cy="450" r="120" fill="${p.light}" opacity=".14"/>`;
      break;

    // 1  diagonal band
    case 1:
      art = `<rect width="${W}" height="${H}" fill="url(#wb)"/>
    <path d="M-100 640L520-100h300L200 900z" fill="url(#wg)" opacity=".92"/>
    <path d="M480 900L1100 160h240L820 900z" fill="${p.primary}" opacity=".25"/>
    <rect x="90" y="90" width="1020" height="720" fill="none" stroke="${p.light}" stroke-width="2" opacity=".18"/>`;
      break;

    // 2  modular grid
    case 2: {
      const cells = [];
      for (let x = 0; x < 6; x++) {
        for (let y = 0; y < 4; y++) {
          const fill = rand() > 0.72 ? 'url(#wg)' : rand() > 0.5 ? p.primary : p.ink;
          const op = rand() > 0.6 ? 0.95 : 0.2;
          cells.push(
            `<rect x="${90 + x * 172}" y="${80 + y * 186}" width="152" height="166" rx="18" fill="${fill}" opacity="${r(op, 2)}"/>`
          );
        }
      }
      art = `<rect width="${W}" height="${H}" fill="${p.surface}"/>\n    ${cells.join('\n    ')}`;
      break;
    }

    // 3  flowing waves
    case 3:
      art = `<rect width="${W}" height="${H}" fill="url(#wb)"/>
    ${Array.from({ length: 7 }, (_, i) => {
      const y = 180 + i * 100;
      return `<path d="M-40 ${y}q300 ${r(-140 + rand() * 280)} 620 0t660 0" fill="none" stroke="${
        i % 2 ? p.accent : p.primary
      }" stroke-width="${r(3 + rand() * 7)}" opacity="${r(0.3 + rand() * 0.5, 2)}" stroke-linecap="round"/>`;
    }).join('\n    ')}`;
      break;

    // 4  application / browser window mock
    case 4:
      art = `<rect width="${W}" height="${H}" fill="url(#wb)"/>
    <rect x="140" y="120" width="920" height="660" rx="26" fill="${p.light}" opacity=".97"/>
    <rect x="140" y="120" width="920" height="72" rx="26" fill="${p.primary}"/>
    <rect x="140" y="170" width="920" height="22" fill="${p.primary}"/>
    <circle cx="196" cy="156" r="11" fill="${p.light}" opacity=".9"/>
    <circle cx="234" cy="156" r="11" fill="${p.light}" opacity=".6"/>
    <circle cx="272" cy="156" r="11" fill="${p.light}" opacity=".35"/>
    <rect x="186" y="240" width="330" height="480" rx="18" fill="url(#wg)" opacity=".9"/>
    ${Array.from({ length: 6 }, (_, i) =>
      `<rect x="560" y="${248 + i * 78}" width="${r(200 + rand() * 240)}" height="22" rx="11" fill="${p.ink}" opacity=".22"/>`
    ).join('\n    ')}`;
      break;

    // 5  concentric arcs
    default:
      art = `<rect width="${W}" height="${H}" fill="${p.surface}"/>
    <g transform="translate(600 900)">
      ${Array.from({ length: 6 }, (_, i) => {
        const rad = 760 - i * 120;
        return `<path d="M${-rad} 0a${rad} ${rad} 0 0 1 ${rad * 2} 0z" fill="${
          i % 2 ? p.primary : p.ink
        }" opacity="${r(0.9 - i * 0.12, 2)}"/>`;
      }).join('\n      ')}
    </g>
    <circle cx="600" cy="900" r="90" fill="${p.accent}"/>`;
  }

  return svg(W, H, `  <defs>\n    ${g}\n    ${frame}\n  </defs>\n  <g clip-path="url(#wf)">\n    ${art}\n  </g>`, 'role="img" aria-label="تصویر نمونه‌کار"');
}

/** Round testimonial avatar. */
function avatar(p, rand, index) {
  const S = 200;
  const tones = [p.primary, p.accent, p.strong, p.ink];
  const a = tones[index % tones.length];
  const b = tones[(index + 2) % tones.length];
  return svg(
    S,
    S,
    `  <defs>
    ${grad('ag', a, b, 130)}
    <clipPath id="ac"><circle cx="100" cy="100" r="100"/></clipPath>
  </defs>
  <g clip-path="url(#ac)">
    <rect width="${S}" height="${S}" fill="url(#ag)"/>
    <circle cx="100" cy="${r(78 + rand() * 8)}" r="38" fill="${p.light}" opacity=".92"/>
    <path d="M30 200c0-42 31-70 70-70s70 28 70 70z" fill="${p.light}" opacity=".92"/>
  </g>`,
    'role="img" aria-label="تصویر پروفایل"'
  );
}

/** Client logo mark + abstract wordmark bars. */
function logo(p, rand, index) {
  const W = 180;
  const H = 52;
  const marks = [
    `<circle cx="26" cy="26" r="17" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="26" cy="26" r="6" fill="currentColor"/>`,
    `<rect x="9" y="9" width="34" height="34" rx="10" fill="none" stroke="currentColor" stroke-width="4"/><path d="M18 26h16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
    `<path d="M26 7l19 33H7z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>`,
    `<path d="M10 40V12l16 16 16-16v28" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<circle cx="19" cy="26" r="12" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="34" cy="26" r="12" fill="none" stroke="currentColor" stroke-width="4"/>`,
    `<path d="M12 40l14-28 14 28M18 32h16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
  ];

  const bars = Array.from({ length: 3 }, (_, i) => {
    const w = r(38 + rand() * 46);
    return `<rect x="${58 + i * 0}" y="${14 + i * 13}" width="${w}" height="8" rx="4" fill="currentColor" opacity="${r(
      0.85 - i * 0.28,
      2
    )}"/>`;
  });

  // Logos inherit colour from the page so they work in light and dark mode.
  return svg(
    W,
    H,
    `  <g fill="none" color="${p.primary}">
    ${marks[index % marks.length]}
    ${bars.join('\n    ')}
  </g>`,
    'role="img" aria-label="لوگوی نمونه"'
  );
}

/** Monogram favicon. */
function favicon(p, letter) {
  return svg(
    64,
    64,
    `  <defs>${grad('fg', p.primary, p.accent, 130)}</defs>
  <rect width="64" height="64" rx="16" fill="url(#fg)"/>
  <text x="32" y="43" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" font-weight="800" fill="${p.ink}">${letter}</text>`
  );
}

/* ---------------------------------------------------------------------------
   Runner
   --------------------------------------------------------------------------- */

const args = process.argv.slice(2);
const withPlaceholders = args.includes('--with-placeholders');
const only = args.filter((a) => !a.startsWith('--'));
const targets = only.length ? demos.filter((d) => only.includes(d.slug)) : demos;

let written = 0;

for (const demo of targets) {
  const dir = join(ROOT, 'demos', demo.slug, 'img');
  await mkdir(dir, { recursive: true });

  const p = demo.palette;
  const rand = rng(seedFrom(demo.slug));
  const files = {
    'favicon.svg': favicon(p, demo.en.charAt(0))
  };

  for (let i = 0; i < 6; i++) files[`logo-${i + 1}.svg`] = logo(p, rand, i);

  // Opt-in only: these slots are filled by real photographs in the shipped
  // package, so writing them by default would resurrect dead files.
  if (withPlaceholders) {
    files['hero.svg'] = hero(p, rand);
    files['portrait.svg'] = portrait(p, rand);
    for (let i = 0; i < 6; i++) files[`work-${i + 1}.svg`] = work(p, rand, i);
    for (let i = 0; i < 4; i++) files[`avatar-${i + 1}.svg`] = avatar(p, rand, i);
  }

  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(dir, name), content, 'utf8');
    written++;
  }

  console.log(`+  ${demo.slug}: ${Object.keys(files).length} files`);
}

console.log(`\n${targets.length} demos · ${written} SVG files written`);
