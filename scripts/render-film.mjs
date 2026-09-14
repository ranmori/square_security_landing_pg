#!/usr/bin/env node
/**
 * Renders the hero film from the dev-only page /film/guard/ into video files.
 *
 *   npm run film:render                      full 18s loop -> public/video/guard-film.{mp4,webm} + poster
 *   npm run film:render -- --frames 1,6,10   PNG stills -> .film/stills/
 *   npm run film:render -- --from 4 --to 8   test clip  -> .film/clip.mp4
 *
 * Requires the dev server (npm run dev). Options: --url, --fps. Env: EDGE_PATH, FFMPEG_PATH.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import ffmpegStatic from 'ffmpeg-static';

const WIDTH = 960;
const HEIGHT = 1128;
const POSTER_TIME = 6;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1] ?? true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const url = args.url ?? 'http://localhost:4321/film/guard/';
const ffmpegPath = process.env.FFMPEG_PATH ?? ffmpegStatic;
const edgePath = [
  process.env.EDGE_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].find((candidate) => candidate && existsSync(candidate));

if (!edgePath) throw new Error('Microsoft Edge not found. Set EDGE_PATH.');
if (!ffmpegPath || !existsSync(ffmpegPath)) throw new Error('ffmpeg not found. Set FFMPEG_PATH.');

const browser = await puppeteer.launch({
  executablePath: edgePath,
  headless: true,
  defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars'],
});

try {
  const page = await browser.newPage();
  // ?t= stops the real-time preview loop; frames are rendered explicitly below.
  await page.goto(`${url}?t=0`, { waitUntil: 'networkidle0', timeout: 180_000 });
  await page.waitForFunction('window.__film && window.__film.ready', { timeout: 60_000 });
  const { duration, fps: filmFps } = await page.evaluate(() => window.__film);
  const fps = Number(args.fps ?? filmFps);

  const capture = async (time, type = 'png') => {
    await page.evaluate((t) => window.__film.render(t), time);
    return page.screenshot({
      type,
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
      ...(type === 'jpeg' ? { quality: 88 } : {}),
    });
  };

  if (args.frames) {
    const dir = path.resolve('.film/stills');
    await mkdir(dir, { recursive: true });
    for (const time of String(args.frames).split(',').map(Number)) {
      const file = path.join(dir, `t-${time}.png`);
      await writeFile(file, await capture(time));
      console.log('still', file);
    }
  } else {
    const from = Number(args.from ?? 0);
    const to = Number(args.to ?? duration);
    const isClip = args.from !== undefined || args.to !== undefined;
    const outDir = path.resolve(isClip ? '.film' : 'public/video');
    await mkdir(outDir, { recursive: true });

    const outputs = isClip
      ? [['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', path.join(outDir, 'clip.mp4')]]
      : [
          // Main@4.0 with the avc1 tag decodes in hardware on every iPhone and Android phone.
          ['-c:v', 'libx264', '-preset', 'slow', '-crf', String(args.crf ?? 24), '-profile:v', 'main', '-level:v', '4.0', '-tag:v', 'avc1', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(outDir, 'guard-film.mp4')],
          ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', path.join(outDir, 'guard-film.webm')],
        ];

    const ffmpeg = spawn(ffmpegPath, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', ...outputs.flat()], {
      stdio: ['pipe', 'inherit', 'inherit'],
    });

    const total = Math.round((to - from) * fps);
    const started = Date.now();
    for (let i = 0; i < total; i++) {
      const frame = await capture(from + i / fps);
      if (!ffmpeg.stdin.write(frame)) await once(ffmpeg.stdin, 'drain');
      if (i % fps === 0) console.log(`frame ${i}/${total} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
    }
    ffmpeg.stdin.end();
    const [code] = await once(ffmpeg, 'close');
    if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`);
    outputs.forEach((output) => console.log('video', output.at(-1)));

    if (!isClip) {
      const poster = path.join(outDir, 'guard-film-poster.jpg');
      await writeFile(poster, await capture(POSTER_TIME, 'jpeg'));
      console.log('poster', poster);
    }
  }
} finally {
  await browser.close();
}
