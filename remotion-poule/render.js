const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1080, H = 1920;
const FPS = 30;
const DURATION = 36; // seconds
const TOTAL = FPS * DURATION;

// Colors
const C = {
  bg: '#0a1a0a',
  gold: '#FFD700',
  goldDeep: '#B8860B',
  green: '#1a4a1a',
  green2: '#2d7a2d',
  white: '#f0f0f0',
  dim: '#888',
  red: '#E8003D',
  orange: '#FF6D00',
  dark: '#060f06',
};

const RANGLIJST = [
  { pos: 1, naam: 'Pok', pt: 61, ex: 3, medal: '👑' },
  { pos: 2, naam: 'Shamma', pt: 61, ex: 3, medal: '👑' },
  { pos: 3, naam: 'Shyam Asarfi', pt: 59, ex: 5, medal: '🔮' },
  { pos: 4, naam: 'Céline Jaikaran', pt: 57, ex: 1, medal: '🎲' },
  { pos: 5, naam: 'Moek', pt: 55, ex: 3, medal: '' },
  { pos: 6, naam: 'Kawita', pt: 53, ex: 3, medal: '' },
  { pos: 7, naam: 'Sunita', pt: 52, ex: 4, medal: '' },
  { pos: 8, naam: 'Sunaina', pt: 52, ex: 2, medal: '' },
  { pos: 9, naam: 'Vinay', pt: 49, ex: 1, medal: '' },
  { pos: 10, naam: 'Duup', pt: 46, ex: 2, medal: '' },
  { pos: 20, naam: 'Rinaldo Jaikaran', pt: 6, ex: 0, medal: '😴' },
];

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t) { return t * t * t; }
function lerp(a, b, t) { return a + (b - a) * Math.min(1, Math.max(0, t)); }
function clamp01(v) { return Math.min(1, Math.max(0, v)); }
function progress(frame, startSec, endSec) {
  return clamp01((frame / FPS - startSec) / (endSec - startSec));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGradientBg(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#050f05');
  grad.addColorStop(0.4, '#0a1a0a');
  grad.addColorStop(1, '#020802');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawParticles(ctx, frame) {
  const count = 25;
  for (let i = 0; i < count; i++) {
    const seed = i * 137.508;
    const x = ((seed * 0.618) % 1) * W;
    const y = ((frame * 0.3 + seed * 50) % H);
    const size = 1 + (i % 3);
    const alpha = 0.1 + 0.15 * Math.sin(frame * 0.05 + i);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,215,0,${alpha})`;
    ctx.fill();
  }
}

function drawGoldLine(ctx, y) {
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.2, C.gold);
  grad.addColorStop(0.8, C.gold);
  grad.addColorStop(1, 'transparent');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
}

function drawTrophy(ctx, cx, cy, scale, glow) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Glow effect
  if (glow > 0) {
    ctx.shadowColor = `rgba(255,215,0,${glow})`;
    ctx.shadowBlur = 60;
  }

  // Cup body
  const cupGrad = ctx.createLinearGradient(-120, -200, 120, 200);
  cupGrad.addColorStop(0, '#8B6914');
  cupGrad.addColorStop(0.3, '#FFD700');
  cupGrad.addColorStop(0.5, '#FFF176');
  cupGrad.addColorStop(0.7, '#FFD700');
  cupGrad.addColorStop(1, '#8B6914');

  ctx.fillStyle = cupGrad;
  ctx.beginPath();
  ctx.moveTo(-90, -180);
  ctx.bezierCurveTo(-110, -180, -130, -100, -100, 20);
  ctx.lineTo(-40, 80);
  ctx.lineTo(-40, 120);
  ctx.lineTo(-70, 140);
  ctx.lineTo(-70, 160);
  ctx.lineTo(70, 160);
  ctx.lineTo(70, 140);
  ctx.lineTo(40, 120);
  ctx.lineTo(40, 80);
  ctx.lineTo(100, 20);
  ctx.bezierCurveTo(130, -100, 110, -180, 90, -180);
  ctx.closePath();
  ctx.fill();

  // Handles
  ctx.strokeStyle = cupGrad;
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-90, -120);
  ctx.bezierCurveTo(-170, -120, -170, -20, -100, -20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(90, -120);
  ctx.bezierCurveTo(170, -120, 170, -20, 100, -20);
  ctx.stroke();

  // Ball on top
  ctx.shadowBlur = 0;
  const ballGrad = ctx.createRadialGradient(-20, -230, 10, 0, -210, 75);
  ballGrad.addColorStop(0, '#ffffff');
  ballGrad.addColorStop(0.3, '#a8d5a2');
  ballGrad.addColorStop(0.7, '#2d7a2d');
  ballGrad.addColorStop(1, '#0a2a0a');
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(0, -255, 75, 0, Math.PI * 2);
  ctx.fill();

  // Ball pattern (pentagon)
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const r = 40;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * r, -255 + Math.sin(angle) * r, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, -255, 18, 0, Math.PI * 2);
  ctx.stroke();

  // Text on ball
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 22px serif';
  ctx.textAlign = 'center';
  ctx.fillText('2026', 0, -268);
  ctx.font = 'bold 14px serif';
  ctx.fillText('JAIKARAN', 0, -250);
  ctx.font = 'bold 11px serif';
  ctx.fillText('WK POULE', 0, -235);

  ctx.restore();
}

// SCENE 1: Intro (0-7s)
function sceneIntro(ctx, frame) {
  const p = progress(frame, 0, 1.5);
  const titleP = progress(frame, 1, 3.5);
  const subP = progress(frame, 2.5, 4.5);

  drawGradientBg(ctx);
  drawParticles(ctx, frame);

  // Trophy with entrance animation
  const tScale = lerp(0.3, 1.1, easeOut(p));
  const tY = lerp(H * 0.3, H * 0.36, easeOut(p));
  const glow = lerp(0, 0.7, progress(frame, 1, 3)) * (0.7 + 0.3 * Math.sin(frame * 0.15));
  drawTrophy(ctx, W / 2, tY, tScale, glow);

  // Gold lines
  if (titleP > 0) {
    drawGoldLine(ctx, 700);
    drawGoldLine(ctx, 720);
  }

  // Title
  const titleAlpha = easeOut(titleP);
  const titleY = lerp(800, 780, easeOut(titleP));
  ctx.save();
  ctx.globalAlpha = titleAlpha;
  ctx.shadowColor = C.gold;
  ctx.shadowBlur = 20;
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 72px serif';
  ctx.textAlign = 'center';
  ctx.fillText('JAIKARAN FAMILY', W / 2, titleY);
  ctx.font = 'bold 56px serif';
  ctx.fillText('WK GAZETTE', W / 2, titleY + 80);
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.white;
  ctx.font = '32px sans-serif';
  if (subP > 0) {
    ctx.globalAlpha = easeOut(subP);
    ctx.fillText('EDITIE #2  ·  22 JUNI 2026', W / 2, titleY + 150);
    ctx.font = '26px sans-serif';
    ctx.fillStyle = C.dim;
    ctx.fillText('40 wedstrijden  ·  20 deelnemers', W / 2, titleY + 200);
  }
  ctx.restore();
}

// SCENE 2: Verhaal (7-18s)
function sceneVerhaal(ctx, frame) {
  drawGradientBg(ctx);
  drawParticles(ctx, frame);

  const headerP = progress(frame, 7, 8.5);
  ctx.save();
  ctx.globalAlpha = easeOut(headerP);
  ctx.fillStyle = C.gold;
  ctx.shadowColor = C.gold;
  ctx.shadowBlur = 15;
  ctx.font = 'bold 48px serif';
  ctx.textAlign = 'center';
  ctx.fillText('HET VERHAAL', W / 2, 140);
  ctx.shadowBlur = 0;
  ctx.restore();
  drawGoldLine(ctx, 165);

  const verhaalLines = [
    { t: 8.0, text: 'Na 40 wedstrijden is de strijd', color: C.white, size: 40, bold: false },
    { t: 8.5, text: 'op het scherpst van de snede.', color: C.white, size: 40, bold: false },
    { t: 9.5, text: '', color: C.white, size: 20, bold: false },
    { t: 9.5, text: '👑 POK & SHAMMA', color: C.gold, size: 52, bold: true },
    { t: 10.2, text: 'delen de leiding — 61 punten elk.', color: C.white, size: 38, bold: false },
    { t: 11.0, text: 'Precies gelijk. Geen millimeter verschil.', color: C.dim, size: 34, bold: false },
    { t: 12.0, text: '', color: C.white, size: 20, bold: false },
    { t: 12.0, text: '🔮 SHYAM ASARFI', color: '#00C8FF', size: 48, bold: true },
    { t: 12.8, text: 'lonkt van plek 3 met 59 punten —', color: C.white, size: 36, bold: false },
    { t: 13.5, text: 'en de meeste exacte scores: 5×', color: C.gold, size: 36, bold: false },
    { t: 14.3, text: 'Het orakel van de familie.', color: C.dim, size: 32, bold: false },
    { t: 15.2, text: '', color: C.white, size: 20, bold: false },
    { t: 15.2, text: '🎲 CÉLINE', color: '#FF6D00', size: 48, bold: true },
    { t: 15.8, text: '51% gewaagde voorspellingen.', color: C.white, size: 36, bold: false },
    { t: 16.5, text: 'Risico loont — ze staat 4e.', color: C.dim, size: 32, bold: false },
    { t: 17.2, text: '😴 RINALDO: 4 voorsp. · 6 punten.', color: C.dim, size: 30, bold: false },
  ];

  let y = 220;
  verhaalLines.forEach(line => {
    const lp = easeOut(progress(frame, line.t, line.t + 0.6));
    if (lp > 0) {
      ctx.save();
      ctx.globalAlpha = lp;
      ctx.fillStyle = line.color;
      ctx.font = `${line.bold ? 'bold ' : ''}${line.size}px ${line.bold ? 'serif' : 'sans-serif'}`;
      ctx.textAlign = 'center';
      if (line.bold) { ctx.shadowColor = line.color; ctx.shadowBlur = 10; }
      ctx.fillText(line.text, W / 2, y);
      ctx.restore();
    }
    y += line.size + 12;
  });
}

// SCENE 3: Ranglijst (18-28s)
function sceneRanglijst(ctx, frame) {
  drawGradientBg(ctx);
  drawParticles(ctx, frame);

  const headerP = easeOut(progress(frame, 18, 19));
  ctx.save();
  ctx.globalAlpha = headerP;
  ctx.fillStyle = C.gold;
  ctx.shadowColor = C.gold;
  ctx.shadowBlur = 15;
  ctx.font = 'bold 52px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 RANGLIJST', W / 2, 110);
  ctx.restore();
  drawGoldLine(ctx, 135);

  const maxPt = 65;
  RANGLIJST.forEach((s, i) => {
    const delay = 18.5 + i * 0.45;
    const p = easeOut(progress(frame, delay, delay + 0.5));
    if (p <= 0) return;

    const rowH = 130;
    const y = 170 + i * rowH;
    const slideX = lerp(W, 0, p);

    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(slideX, 0);

    // Row bg
    const isMedal = s.pos <= 3;
    const bgColors = ['rgba(255,215,0,0.12)', 'rgba(200,200,200,0.08)', 'rgba(184,115,11,0.08)'];
    const bg = isMedal ? bgColors[s.pos - 1] : 'rgba(255,255,255,0.03)';
    ctx.fillStyle = bg;
    roundRect(ctx, 30, y, W - 60, rowH - 10, 16);
    ctx.fill();

    // Border for top 3
    if (isMedal) {
      const borderColors = [C.gold, '#C0C0C0', '#CD7F32'];
      ctx.strokeStyle = borderColors[s.pos - 1];
      ctx.lineWidth = 2;
      roundRect(ctx, 30, y, W - 60, rowH - 10, 16);
      ctx.stroke();
    }

    // Position number
    ctx.fillStyle = isMedal ? C.gold : C.dim;
    ctx.font = `bold 36px serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`${s.pos}.`, 55, y + 55);

    // Name
    ctx.fillStyle = isMedal ? C.gold : C.white;
    ctx.font = `${isMedal ? 'bold ' : ''}${isMedal ? 42 : 36}px sans-serif`;
    ctx.fillText(s.naam, 120, y + 55);

    // Points bar
    const barW = W - 380;
    const barX = 120;
    const barY = y + 70;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, barX, barY, barW, 16, 8);
    ctx.fill();

    const fillW = (s.pt / maxPt) * barW;
    const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    barGrad.addColorStop(0, isMedal ? C.gold : C.green2);
    barGrad.addColorStop(1, isMedal ? '#FFF176' : '#4ade80');
    ctx.fillStyle = barGrad;
    roundRect(ctx, barX, barY, fillW, 16, 8);
    ctx.fill();

    // Points
    ctx.fillStyle = isMedal ? C.gold : C.white;
    ctx.font = `bold 38px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`${s.pt} pt`, W - 50, y + 55);

    // Exact scores badge
    if (s.ex >= 3) {
      ctx.fillStyle = isMedal ? C.gold : '#4ade80';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`⭐${s.ex}×`, W - 50, y + 88);
    }

    ctx.restore();
  });
}

// SCENE 4: Prijzen (28-33s)
function scenePrijzen(ctx, frame) {
  drawGradientBg(ctx);
  drawParticles(ctx, frame);

  const headerP = easeOut(progress(frame, 28, 29));
  ctx.save();
  ctx.globalAlpha = headerP;
  ctx.fillStyle = C.gold;
  ctx.shadowColor = C.gold;
  ctx.shadowBlur = 15;
  ctx.font = 'bold 52px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎁 DE PRIJZEN', W / 2, 120);
  ctx.restore();
  drawGoldLine(ctx, 145);

  const prizes = [
    { t: 28.8, emoji: '🏆', title: 'WINNAAR', sub: 'De Jaikaran Family Beker', desc: '+ BBQ-FEEST voor de hele familie!', color: C.gold, y: 280 },
    { t: 30.0, emoji: '🍖', title: 'BBQ-PRIJS', sub: 'Winnaar kiest de datum', desc: 'Iedereen te gast bij de kampioen', color: '#FF6D00', y: 600 },
    { t: 31.2, emoji: '🃏', title: 'POEDELPRIJS', sub: 'Minste punten = eeuwige oneer', desc: 'De poedel-trofee wacht...', color: C.red, y: 920 },
    { t: 32.0, emoji: '🎯', title: 'ALLES STAAT OP HET SPEL', sub: 'Nog wedstrijden te gaan', desc: 'Wie wint de Jaikaran Family Beker 2026?', color: '#4ade80', y: 1240 },
  ];

  prizes.forEach(prize => {
    const p = easeOut(progress(frame, prize.t, prize.t + 0.7));
    if (p <= 0) return;

    ctx.save();
    ctx.globalAlpha = p;

    // Card bg
    ctx.fillStyle = `rgba(255,255,255,0.04)`;
    roundRect(ctx, 50, prize.y, W - 100, 240, 24);
    ctx.fill();
    ctx.strokeStyle = prize.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = p * 0.6;
    roundRect(ctx, 50, prize.y, W - 100, 240, 24);
    ctx.stroke();
    ctx.globalAlpha = p;

    ctx.font = '80px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(prize.emoji, 90, prize.y + 100);

    ctx.fillStyle = prize.color;
    ctx.font = 'bold 44px serif';
    ctx.fillText(prize.title, 200, prize.y + 75);

    ctx.fillStyle = C.white;
    ctx.font = '32px sans-serif';
    ctx.fillText(prize.sub, 200, prize.y + 125);

    ctx.fillStyle = C.dim;
    ctx.font = '28px sans-serif';
    ctx.fillText(prize.desc, 200, prize.y + 165);

    ctx.restore();
  });
}

// SCENE 5: Outro (33-36s)
function sceneOutro(ctx, frame) {
  drawGradientBg(ctx);
  drawParticles(ctx, frame);

  const p = progress(frame, 33, 35);
  const glow = 0.5 + 0.3 * Math.sin(frame * 0.1);
  drawTrophy(ctx, W / 2, H * 0.38, 0.85, glow);
  drawGoldLine(ctx, 760);
  drawGoldLine(ctx, 780);

  ctx.save();
  ctx.globalAlpha = easeOut(progress(frame, 33.5, 35));
  ctx.fillStyle = C.gold;
  ctx.shadowColor = C.gold;
  ctx.shadowBlur = 20;
  ctx.font = 'bold 58px serif';
  ctx.textAlign = 'center';
  ctx.fillText('WIE WINT DE BEKER?', W / 2, 870);
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.white;
  ctx.font = '32px sans-serif';
  ctx.fillText('Speel mee & bekijk de stand:', W / 2, 950);
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('moek72.github.io/wk-poule/wkpoule.html', W / 2, 1010);
  ctx.fillStyle = C.dim;
  ctx.font = '26px sans-serif';
  ctx.fillText('Tot de volgende editie! ⚽', W / 2, 1080);
  ctx.restore();

  // Hofhouse shoutout
  ctx.save();
  ctx.globalAlpha = easeOut(progress(frame, 34.5, 36));
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📍 Bekeken bij: Hofhouse Bar, Den Haag', W / 2, 1200);
  ctx.fillStyle = C.dim;
  ctx.font = '26px sans-serif';
  ctx.fillText('Dank Roshni voor de organisatie! 🧡', W / 2, 1250);
  ctx.restore();
}

// Main render loop
console.log(`Rendering ${TOTAL} frames at ${FPS}fps (${DURATION}s)...`);
const framesDir = path.join(__dirname, 'frames');

for (let f = 0; f < TOTAL; f++) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const sec = f / FPS;

  if (sec < 7) {
    sceneIntro(ctx, f);
  } else if (sec < 18) {
    sceneVerhaal(ctx, f);
  } else if (sec < 28) {
    sceneRanglijst(ctx, f);
  } else if (sec < 33) {
    scenePrijzen(ctx, f);
  } else {
    sceneOutro(ctx, f);
  }

  // Scene transition fade
  const sceneStarts = [7, 18, 28, 33];
  for (const ss of sceneStarts) {
    const td = Math.abs(sec - ss);
    if (td < 0.4) {
      const fade = td < 0.2 ? td / 0.2 : 1 - (td - 0.2) / 0.2;
      ctx.fillStyle = `rgba(0,0,0,${(1 - fade) * 0.8})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(framesDir, `frame${String(f).padStart(5, '0')}.png`), buf);

  if (f % 90 === 0) process.stdout.write(`  ${Math.round(f / TOTAL * 100)}%\r`);
}
console.log('\nFrames done! Stitching with ffmpeg...');
