#!/usr/bin/env node
// Renders wk-gazette-presentatie.html → MP4 via puppeteer screenshots + ffmpeg
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HTML_PATH   = path.resolve(__dirname, '../wk-gazette-presentatie.html');
const FRAMES_DIR  = path.join(__dirname, 'frames');
const OUT_DIR     = path.join(__dirname, 'out');
const COVER_IMG   = path.join(__dirname, 'cover.png');   // drop image here to auto-use as cover
const BGM_WAV     = path.join(__dirname, 'bgm.wav');
const MUSIC_MP3   = path.join(__dirname, 'music.mp3');   // drop André Hazes MP3 here
const OUT_MP4     = path.join(__dirname, 'out', 'wk-gazette-final.mp4');

const SLIDE_DUR   = 7;    // seconds per slide
const COVER_DUR   = 5;    // seconds for cover image (if present)
const FADE        = 0.5;  // crossfade duration in seconds
const W = 1080, H = 1920;

async function captureSlides() {
  console.log('Launching Chromium...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  await page.goto(`file://${HTML_PATH}`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));

  // Disable auto-advance + keyboard shortcuts
  await page.evaluate(() => {
    if (typeof window.autoTimer !== 'undefined') clearTimeout(window.autoTimer);
    window.resetAuto = () => {};
  });

  const slideCount = await page.evaluate(() =>
    document.querySelectorAll('.slide').length
  );
  console.log(`Found ${slideCount} slides`);

  const slideFiles = [];

  for (let s = 0; s < slideCount; s++) {
    await page.evaluate((idx) => {
      if (typeof window.go === 'function') window.go(idx);
    }, s);

    // Wait for fade-up animations to complete (~1.4s max delay + 0.6s duration)
    await new Promise(r => setTimeout(r, 2200));

    const imgPath = path.join(FRAMES_DIR, `slide${String(s).padStart(2, '0')}.png`);
    await page.screenshot({ path: imgPath });
    slideFiles.push(imgPath);
    process.stdout.write(`  Slide ${s + 1}/${slideCount} ✓\r`);
  }

  console.log(`\nAll ${slideCount} slides captured.`);
  await browser.close();
  return slideFiles;
}

function buildVideo(slideFiles) {
  // Determine music source
  const musicSrc = fs.existsSync(MUSIC_MP3) ? MUSIC_MP3
                 : fs.existsSync(BGM_WAV)   ? BGM_WAV
                 : null;

  // Build input list: optional cover + slides
  const allImages = [];
  const allDurations = [];

  if (fs.existsSync(COVER_IMG)) {
    console.log('Cover image found — adding as first clip.');
    allImages.push(COVER_IMG);
    allDurations.push(COVER_DUR);
  }

  slideFiles.forEach(f => {
    allImages.push(f);
    allDurations.push(SLIDE_DUR);
  });

  const N = allImages.length;
  const inputArgs = allImages.map(f => `-loop 1 -t ${SLIDE_DUR} -i "${f}"`).join(' ');

  // Fix: use actual duration per clip for -t
  const inputArgsFixed = allImages.map((f, i) =>
    `-loop 1 -t ${allDurations[i]} -i "${f}"`
  ).join(' ');

  // Build xfade filter chain
  let filterStr = '';
  let cumOffset = 0;
  for (let i = 1; i < N; i++) {
    const inp = i === 1 ? '[0:v]' : `[xf${i - 1}]`;
    const out = i === N - 1 ? '[vout]' : `[xf${i}]`;
    cumOffset += allDurations[i - 1] - FADE;
    filterStr += `${inp}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${cumOffset.toFixed(2)}${out};`;
  }
  // If only 1 image, just use it directly
  const filterMap = N === 1
    ? `-vf "scale=${W}:${H}" -map "[0:v]"`
    : `-filter_complex "${filterStr.replace(/;$/, '')}" -map "[vout]"`;

  const audioIn  = musicSrc ? `-i "${musicSrc}"` : '';
  const audioOut = musicSrc ? `-c:a aac -b:a 192k -shortest` : '-an';

  const cmd = [
    'ffmpeg -y',
    inputArgsFixed,
    audioIn,
    filterMap,
    `-c:v libx264 -pix_fmt yuv420p -crf 22 -preset fast`,
    audioOut,
    `"${OUT_MP4}"`
  ].filter(Boolean).join(' ');

  console.log('\nBuilding video with ffmpeg...');
  execSync(cmd, { stdio: 'inherit' });

  const size = (fs.statSync(OUT_MP4).size / 1e6).toFixed(1);
  console.log(`\nDone! ${OUT_MP4} (${size} MB)`);
}

async function main() {
  [FRAMES_DIR, OUT_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
  fs.readdirSync(FRAMES_DIR)
    .filter(f => f.startsWith('slide') && f.endsWith('.png'))
    .forEach(f => fs.unlinkSync(path.join(FRAMES_DIR, f)));

  const slideFiles = await captureSlides();
  buildVideo(slideFiles);
}

main().catch(err => { console.error(err); process.exit(1); });
