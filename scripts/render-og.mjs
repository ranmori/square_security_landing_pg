#!/usr/bin/env node
/**
 * Renders social share images from the dev-only page /og/<slug>/ into public/og/<slug>.<png|jpg>.
 *
 *   npm run og:render                 all share images (dev server must be running)
 *   npm run og:render -- --only home-de,careers-en
 *
 * Options: --url (default http://localhost:4321), --format png|jpeg. Env: EDGE_PATH.
 */
import { existsSync } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

// Keep in sync with serviceKeys in src/i18n/ui.ts.
const SERVICE_KEYS = ['event', 'property', 'refugee', 'patrol', 'personal'];
const PAGES = ['home', 'services', 'contact', 'careers'];
const LANGS = ['de', 'en'];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1] ?? true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const base = args.url ?? 'http://localhost:4321';
const format = args.format === 'jpeg' ? 'jpeg' : 'png';
const allSlugs = LANGS.flatMap((lang) => [
  ...PAGES.map((page) => `${page}-${lang}`),
  ...SERVICE_KEYS.map((key) => `service-${key}-${lang}`),
]);
const slugs = args.only ? String(args.only).split(',') : allSlugs;

const edgePath = [
  process.env.EDGE_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((candidate) => candidate && existsSync(candidate));
if (!edgePath) throw new Error('Microsoft Edge not found. Set EDGE_PATH.');

const outDir = path.resolve('public/og');
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: edgePath,
  headless: true,
  defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
});

try {
  const page = await browser.newPage();
  for (const slug of slugs) {
    await page.goto(`${base}/og/${slug}/`, { waitUntil: 'networkidle0', timeout: 180_000 });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(outDir, `${slug}.${format === 'jpeg' ? 'jpg' : 'png'}`);
    await page.screenshot({
      path: file,
      type: format,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
      ...(format === 'jpeg' ? { quality: 88 } : {}),
    });
    console.log(`og ${slug} -> ${path.relative(process.cwd(), file)} (${Math.round((await stat(file)).size / 1024)} KB)`);
  }
} finally {
  await browser.close();
}
