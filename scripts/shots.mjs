/**
 * scripts/shots.mjs  DEV TOOL (not part of the sold package)
 *
 * Captures the screenshots used by the showcase page. Drives headless Chrome
 * over the DevTools Protocol using Node's built-in WebSocket  no npm install,
 * no puppeteer, no node_modules.
 *
 * Per demo it writes into showcase/img/:
 *   <slug>-desktop.png   full page, 1440 wide
 *   <slug>-card.png      864x540 hero crop (1440x900 at 0.6 scale)  the card
 *                        thumbnail on the showcase, small enough that twenty of
 *                        them still load fast
 *   <slug>-mobile.png    full page, 390 wide
 *   <slug>-phone.png     390x844 viewport only  the phone thumbnail on the
 *                        showcase cards. A full-page mobile shot is ~26000px
 *                        tall, which browsers will not decode as a thumbnail.
 *   <slug>-dark.png      1440x900 hero crop in the opposite theme
 *
 * Usage:
 *   node scripts/shots.mjs                 all demos
 *   node scripts/shots.mjs 01-web-developer 04-lawyer
 *   node scripts/shots.mjs --chrome "C:\path\to\chrome.exe"
 */

import { spawn } from 'node:child_process';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { demos } from './demos.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'showcase', 'img');
const PORT = 9333;

/* --------------------------------------------------------------------------
   Locate Chrome
   -------------------------------------------------------------------------- */

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
];

const args = process.argv.slice(2);
const chromeFlag = args.indexOf('--chrome');
const chromePath =
  chromeFlag !== -1 ? args[chromeFlag + 1] : CHROME_CANDIDATES.find((p) => existsSync(p));

if (!chromePath) {
  console.error('Chrome not found. Pass one explicitly:  node scripts/shots.mjs --chrome "<path>"');
  process.exit(1);
}

const slugs = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--chrome');
const targets = slugs.length ? demos.filter((d) => slugs.includes(d.slug)) : demos;

/* --------------------------------------------------------------------------
   Minimal CDP client
   -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: res, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method) {
        this.listeners.forEach((fn) => fn(msg));
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((res, reject) => this.pending.set(id, { resolve: res, reject }));
  }

  /** Resolve when `method` arrives on `sessionId`, or reject after `timeout`. */
  once(method, sessionId, timeout = 20000) {
    return new Promise((res, reject) => {
      const timer = setTimeout(() => {
        this.listeners = this.listeners.filter((l) => l !== handler);
        reject(new Error(`timed out waiting for ${method}`));
      }, timeout);

      const handler = (msg) => {
        if (msg.method !== method || (sessionId && msg.sessionId !== sessionId)) return;
        clearTimeout(timer);
        this.listeners = this.listeners.filter((l) => l !== handler);
        res(msg.params);
      };

      this.listeners.push(handler);
    });
  }
}

/** Poll the DevTools endpoint until Chrome is ready to accept connections. */
async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error('Chrome did not expose its DevTools endpoint in time');
}

/* --------------------------------------------------------------------------
   Capture
   -------------------------------------------------------------------------- */

const profileDir = join(tmpdir(), 'rp-shots-profile');

const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--allow-file-access-from-files',
    'about:blank'
  ],
  { stdio: 'ignore' }
);

const browserWsUrl = await waitForChrome();
const browserWs = new WebSocket(browserWsUrl);
await new Promise((res, rej) => {
  browserWs.addEventListener('open', res, { once: true });
  browserWs.addEventListener('error', rej, { once: true });
});

const cdp = new CDP(browserWs);
await mkdir(OUT, { recursive: true });

/**
 * Screenshot one page state.
 * @param {string} url       file:// URL of the demo
 * @param {object} opts      { width, height, mobile, fullPage, theme }
 */
async function capture(url, opts) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  try {
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: opts.width,
      height: opts.height,
      deviceScaleFactor: opts.scale || 1,
      mobile: Boolean(opts.mobile)
    }, sessionId);

    // Seed the theme before the page's bootstrap script reads localStorage.
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try { localStorage.setItem('rp-theme', ${JSON.stringify(opts.theme)}); } catch (e) {}`
    }, sessionId);

    const loaded = cdp.once('Page.loadEventFired', sessionId);
    await cdp.send('Page.navigate', { url }, sessionId);
    await loaded;

    // Let fonts settle and reveal animations finish, then force every
    // scroll-triggered element visible so the full-page shot is complete.
    // Lazy images below the fold are opted back in to eager loading and
    // awaited: a full-page capture paints them in place, but never waits
    // for the fetch, so without this every photograph past the first
    // screen comes out blank.
    await sleep(900);
    await cdp.send('Runtime.evaluate', {
      expression: `
        document.querySelectorAll('img[loading="lazy"]').forEach(el => { el.loading = 'eager'; });
        document.querySelectorAll('[data-rp-reveal]').forEach(el => el.classList.add('is-revealed'));
        document.querySelectorAll('[data-rp-skill]').forEach(el => {
          el.style.setProperty('--rp-skill-value', el.getAttribute('data-rp-skill') + '%');
          el.classList.add('is-filled');
        });
        Promise.all([
          document.fonts ? document.fonts.ready : Promise.resolve(),
          ...[...document.images].filter(im => !im.complete).map(im => new Promise(res => {
            im.addEventListener('load', res, { once: true });
            im.addEventListener('error', res, { once: true });
          }))
        ]).then(() => true);
      `,
      awaitPromise: true
    }, sessionId);
    await sleep(500);

    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: Boolean(opts.fullPage),
      optimizeForSpeed: false
    }, sessionId);

    return Buffer.from(data, 'base64');
  } finally {
    await cdp.send('Target.closeTarget', { targetId });
  }
}

let count = 0;

for (const demo of targets) {
  const file = join(ROOT, 'demos', demo.slug, 'index.html');
  if (!existsSync(file)) {
    console.warn(`!  ${demo.slug}: index.html not found  skipped`);
    continue;
  }

  const url = pathToFileURL(resolve(file)).href;
  const dark = demo.palette.surface.startsWith('#0') || demo.palette.surface.startsWith('#1');
  const primary = dark ? 'dark' : 'light';
  const opposite = dark ? 'light' : 'dark';

  const shots = [
    ['card', { width: 1440, height: 900, scale: 0.6, theme: primary }],
    ['desktop', { width: 1440, height: 900, fullPage: true, theme: primary }],
    ['mobile', { width: 390, height: 844, mobile: true, fullPage: true, theme: primary }],
    ['phone', { width: 390, height: 844, mobile: true, theme: primary }],
    ['dark', { width: 1440, height: 900, theme: opposite }]
  ];

  for (const [name, opts] of shots) {
    const png = await capture(url, opts);
    await writeFile(join(OUT, `${demo.slug}-${name}.png`), png);
    count++;
    console.log(`+  ${demo.slug}-${name}.png  (${Math.round(png.length / 1024)} KB)`);
  }
}

console.log(`\n${targets.length} demos · ${count} screenshots → showcase/img/`);

browserWs.close();
chrome.kill();
await rm(profileDir, { recursive: true, force: true }).catch(() => {});
process.exit(0);
