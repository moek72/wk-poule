'use strict';
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const W = 1080, H = 1920;
const FPS = 30;
const DURATION = 55;
const TOTAL = FPS * DURATION; // 1650 frames

const framesDir = path.join(__dirname, 'frames');
const outPath = path.join(__dirname, 'out', 'wk-gazette-v2.mp4');

// Ensure directories exist
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
if (!fs.existsSync(path.join(__dirname, 'out'))) fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });

// Clear old frames
const oldFrames = fs.existsSync(framesDir) ? fs.readdirSync(framesDir).filter(f => f.endsWith('.png')) : [];
for (const f of oldFrames) fs.unlinkSync(path.join(framesDir, f));
console.log(`Cleared ${oldFrames.length} old frames.`);

// ─── PLAYER DATA ─────────────────────────────────────────────────────────────
const PLAYERS = [
  { pos: 1,  naam: 'Pok',              pt: 61, ex: 3, color: '#FFD700', km: '🇲🇽' },
  { pos: 2,  naam: 'Shamma',           pt: 61, ex: 3, color: '#00FFE5', km: '🇫🇷' },
  { pos: 3,  naam: 'Shyam Asarfi',     pt: 59, ex: 5, color: '#4488FF', km: '🇫🇷' },
  { pos: 4,  naam: 'Céline Jaikaran',  pt: 57, ex: 1, color: '#FF6D00', km: '🇫🇷' },
  { pos: 5,  naam: 'Moek',             pt: 55, ex: 3, color: '#FF1493', km: '🇳🇱' },
  { pos: 6,  naam: 'Kawita',           pt: 53, ex: 3, color: '#C84FEE', km: '🇩🇪' },
  { pos: 7,  naam: 'Sunita',           pt: 52, ex: 4, color: '#4ade80', km: '🇳🇱' },
  { pos: 8,  naam: 'Sunaina',          pt: 52, ex: 2, color: '#FF4444', km: '🇫🇷' },
  { pos: 9,  naam: 'Vinay',            pt: 49, ex: 1, color: '#00BCD4' },
  { pos: 10, naam: 'Duup',             pt: 46, ex: 2, color: '#FFA000' },
  { pos: 11, naam: 'Totomaster',       pt: 46, ex: 2, color: '#CDDC39', km: '🇲🇦' },
  { pos: 12, naam: 'Chanine Jaikaran', pt: 45, ex: 1, color: '#9E7BCA', km: '🇲🇦' },
  { pos: 13, naam: 'Geert Wilders',    pt: 45, ex: 1, color: '#29B6F6', km: '🇳🇱' },
  { pos: 14, naam: 'Oetra',            pt: 44, ex: 0, color: '#FF7961' },
  { pos: 15, naam: 'Surya',            pt: 42, ex: 0, color: '#FFB300', km: '🇫🇷' },
  { pos: 16, naam: 'Kandratiki',       pt: 32, ex: 2, color: '#69F0AE' },
  { pos: 17, naam: 'ikke',             pt: 28, ex: 0, color: '#FF6B6B' },
  { pos: 18, naam: 'SeanJay',          pt: 27, ex: 1, color: '#7C4DFF' },
  { pos: 19, naam: 'KOEKIEE',          pt: 20, ex: 2, color: '#FF3D00', km: '🇧🇷' },
  { pos: 20, naam: 'Rinaldo',          pt: 6,  ex: 0, color: '#9E9E9E' },
];

// ─── MATH HELPERS ─────────────────────────────────────────────────────────────
function easeOut(t) { const c = clamp01(t); return 1 - Math.pow(1 - c, 3); }
function easeIn(t)  { const c = clamp01(t); return c * c * c; }
function lerp(a, b, t) { return a + (b - a) * clamp01(t); }
function clamp01(v) { return Math.min(1, Math.max(0, v)); }
function progress(frame, startSec, endSec) {
  return clamp01((frame / FPS - startSec) / (endSec - startSec));
}

// ─── DRAW HELPERS ─────────────────────────────────────────────────────────────

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
  // Radial dark green/black background
  const grad = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, H * 0.8);
  grad.addColorStop(0, '#0d1f0d');
  grad.addColorStop(0.4, '#070f07');
  grad.addColorStop(1, '#010301');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawParticles(ctx, frame) {
  const count = 30;
  for (let i = 0; i < count; i++) {
    const seed = i * 137.508;
    const x = ((seed * 0.618033) % 1) * W;
    // Particles drift upward; wrap around
    const baseY = ((seed * 50 + frame * (0.4 + (i % 5) * 0.12)) % H);
    const y = H - baseY;
    const size = 1 + (i % 4) * 0.7;
    const alpha = 0.08 + 0.18 * Math.abs(Math.sin(frame * 0.04 + i * 0.7));
    const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.08 + i * 1.3);
    ctx.beginPath();
    ctx.arc(x, y, size * twinkle, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,215,0,${alpha})`;
    ctx.fill();
  }
}

function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawGoldBorder(ctx, frame) {
  const inset = 8;
  const r = 28;
  const alpha = 0.3 + 0.2 * Math.sin(frame * 0.05);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 18 + 8 * Math.sin(frame * 0.07);
  roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, r);
  ctx.stroke();
  ctx.restore();
}

function drawRays(ctx, cx, cy, numRays, rotation, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2;
    const grad = ctx.createLinearGradient(0, 0, Math.cos(angle) * H, Math.sin(angle) * H);
    grad.addColorStop(0, 'rgba(255,215,0,0.25)');
    grad.addColorStop(0.3, 'rgba(255,215,0,0.08)');
    grad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const spread = Math.PI / numRays * 0.55;
    ctx.arc(0, 0, H, angle - spread, angle + spread);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();
}

function drawAvatar(ctx, x, y, r, initials, color) {
  // Glow ring
  const glowGrad = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 1.4);
  glowGrad.addColorStop(0, color + '55');
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Circle background
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const bgGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  bgGrad.addColorStop(0, shiftColor(color, 60));
  bgGrad.addColorStop(1, shiftColor(color, -40));
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Gold outline
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Initials
  const fontSize = Math.max(16, Math.floor(r * 0.55));
  ctx.fillStyle = '#000000bb';
  ctx.font = `bold ${fontSize + 2}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, x + 2, y + 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px serif`;
  ctx.fillText(initials, x, y);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

// Lighten or darken a hex color by amount (-255 to 255)
function shiftColor(hex, amount) {
  const c = hex.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(c.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(c.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(c.slice(4, 6), 16) + amount));
  return `rgb(${r},${g},${b})`;
}

function getInitials(naam) {
  return naam.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Confetti: 50 colorful pieces falling from above, triggered at startFrame
function drawConfetti(ctx, frame, startFrame) {
  const elapsed = frame - startFrame;
  if (elapsed < 0) return;
  const confettiColors = ['#FFD700','#FF1493','#00FFE5','#FF6D00','#4488FF','#4ade80','#C84FEE','#FF4444'];
  for (let i = 0; i < 50; i++) {
    const seed = i * 53.7 + 1;
    const cx = ((seed * 0.618) % 1) * W;
    const speed = 4 + (i % 5) * 1.5;
    const cy = -40 + elapsed * speed + ((seed * 31.4) % 80);
    const size = 8 + (i % 6) * 3;
    const rot = elapsed * 0.06 + i * 0.9;
    const colorIdx = i % confettiColors.length;
    const alpha = clamp01(1 - elapsed / (FPS * 2));
    if (cy > H + 20) continue;

    ctx.save();
    ctx.globalAlpha = alpha * 0.9;
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.fillStyle = confettiColors[colorIdx];
    // Alternate between rect and circle
    if (i % 3 === 0) {
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);
    } else if (i % 3 === 1) {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawTrophy(ctx, cx, cy, scale, glow) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  if (glow > 0) {
    ctx.shadowColor = `rgba(255,215,0,${glow})`;
    ctx.shadowBlur = 80;
  }

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

  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 40, -255 + Math.sin(angle) * 40, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, -255, 18, 0, Math.PI * 2);
  ctx.stroke();

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

function drawGoldLine(ctx, y) {
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.15, '#FFD700');
  grad.addColorStop(0.85, '#FFD700');
  grad.addColorStop(1, 'transparent');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
}

// Draw scene-transition fade overlay
function drawTransitionFade(ctx, frame) {
  const sceneBoundaries = [9, 16, 30, 42, 49];
  const fadeDuration = 0.4; // seconds
  for (const ss of sceneBoundaries) {
    const sec = frame / FPS;
    const td = sec - ss;
    if (td >= -fadeDuration && td <= fadeDuration) {
      // Fade out before boundary, fade in after
      let blackAlpha;
      if (td < 0) {
        // Approaching boundary: fade to black
        blackAlpha = easeIn((td + fadeDuration) / fadeDuration); // 0→1
        blackAlpha = 1 - blackAlpha;
      } else {
        // After boundary: fade from black
        blackAlpha = 1 - easeOut(td / fadeDuration);
      }
      ctx.fillStyle = `rgba(0,0,0,${clamp01(blackAlpha)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

// ─── GLOBAL ELEMENTS ─────────────────────────────────────────────────────────
function drawGlobalElements(ctx, frame) {
  drawGradientBg(ctx);
  drawParticles(ctx, frame);
}

function drawGlobalOverlays(ctx, frame) {
  drawVignette(ctx);
  drawGoldBorder(ctx, frame);
}

// ─── SCENE 1: EPIC INTRO (0–9s) ──────────────────────────────────────────────
function sceneIntro(ctx, frame) {
  drawGlobalElements(ctx, frame);

  const cx = W / 2;
  const cy = H * 0.35;

  // Rotating light rays from center
  drawRays(ctx, cx, cy, 12, frame * 0.008, 0.15);

  // Trophy: scale 0.2→1.1→1.0 over 0-2.5s
  const tEnter = progress(frame, 0, 2.0);
  let tScale;
  if (frame / FPS < 2.0) {
    tScale = lerp(0.2, 1.1, easeOut(tEnter));
  } else {
    tScale = lerp(1.1, 1.0, easeOut(progress(frame, 2.0, 2.5)));
  }
  const trophyGlow = lerp(0, 0.8, progress(frame, 0.5, 2.5)) * (0.7 + 0.3 * Math.sin(frame * 0.12));

  drawTrophy(ctx, cx, cy, tScale, trophyGlow);

  // Title reveal at y=780
  const titleP = progress(frame, 1.0, 2.8);
  const subP   = progress(frame, 2.5, 3.8);
  const edP    = progress(frame, 3.0, 4.2);

  ctx.save();
  ctx.textAlign = 'center';

  // "JAIKARAN FAMILY"
  ctx.globalAlpha = easeOut(titleP);
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 25;
  ctx.font = 'bold 78px serif';
  ctx.fillText('JAIKARAN FAMILY', cx, 780);

  // "WK GAZETTE"
  ctx.font = 'bold 60px serif';
  ctx.fillText('WK GAZETTE', cx, 862);

  ctx.shadowBlur = 0;

  // Edition
  if (edP > 0) {
    ctx.globalAlpha = easeOut(edP);
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px sans-serif';
    ctx.fillText('EDITIE #2  ·  22 JUNI 2026', cx, 940);
    ctx.fillStyle = '#888888';
    ctx.font = '26px sans-serif';
    ctx.fillText('20 deelnemers  ·  40 wedstrijden', cx, 988);
  }

  ctx.restore();

  drawGlobalOverlays(ctx, frame);
}

// ─── SCENE 2: STATS OVERVIEW (9–16s) ─────────────────────────────────────────
function sceneStats(ctx, frame) {
  drawGlobalElements(ctx, frame);
  drawRays(ctx, W / 2, H * 0.15, 8, frame * 0.005, 0.07);

  const headerP = easeOut(progress(frame, 9.4, 10.6));
  ctx.save();
  ctx.textAlign = 'center';
  ctx.globalAlpha = headerP;
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 18;
  ctx.font = 'bold 54px serif';
  ctx.fillText('DE CIJFERS', W / 2, 160);
  ctx.restore();
  drawGoldLine(ctx, 190);

  const cards = [
    { value: '880',  label: 'PUNTEN TOTAAL',  delay: 10.0 },
    { value: '36',   label: 'EXACTE SCORES',  delay: 10.8 },
    { value: '40',   label: 'WEDSTRIJDEN',    delay: 11.6 },
    { value: '20',   label: 'DEELNEMERS',     delay: 12.4 },
  ];

  const cardW = 900;
  const cardH = 220;
  const cardX = (W - cardW) / 2;
  const startY = 240;
  const gap = 250;

  cards.forEach((card, i) => {
    const p = easeOut(progress(frame, card.delay, card.delay + 0.7));
    if (p <= 0) return;

    const y = startY + i * gap;
    ctx.save();
    ctx.globalAlpha = p;

    // Card bg
    ctx.fillStyle = 'rgba(255,215,0,0.06)';
    roundRect(ctx, cardX, y, cardW, cardH, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.35)';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, y, cardW, cardH, 22);
    ctx.stroke();

    // Big value
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 22;
    ctx.font = 'bold 120px serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.value, W / 2, y + 138);

    // Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px sans-serif';
    ctx.fillText(card.label, W / 2, y + 185);

    ctx.restore();
  });

  drawGlobalOverlays(ctx, frame);
}

// ─── SCENE 3: TOP 3 SPOTLIGHT (16–30s) ───────────────────────────────────────
const TOP3 = [
  {
    startSec: 16.0, endSec: 20.5,
    naam: 'POK', color: '#FFD700',
    pts: '61 PUNTEN', exact: '3× exacte score',
    km: '🇲🇽 Kampioen: Mexico',
    badge: '👑 GEDEELDE LEIDING',
  },
  {
    startSec: 20.5, endSec: 25.0,
    naam: 'SHAMMA', color: '#00FFE5',
    pts: '61 PUNTEN', exact: '3× exacte score',
    km: '🇫🇷 Kampioen: Frankrijk',
    badge: '👑 GEDEELDE LEIDING',
  },
  {
    startSec: 25.0, endSec: 30.0,
    naam: 'SHYAM ASARFI', color: '#4488FF',
    pts: '59 PUNTEN', exact: '5× exacte score ⭐',
    km: '🇫🇷 Kampioen: Frankrijk',
    badge: null,
  },
];

function sceneTop3(ctx, frame) {
  drawGlobalElements(ctx, frame);

  const sec = frame / FPS;

  TOP3.forEach((player, idx) => {
    if (sec < player.startSec || sec >= player.endSec) return;

    const localSec = sec - player.startSec;
    const localProgress = localSec / (player.endSec - player.startSec);
    const enterP = easeOut(clamp01(localSec / 0.8));

    // Confetti burst at start
    if (localSec < 2.5) {
      drawConfetti(ctx, frame, Math.round(player.startSec * FPS));
    }

    // Rays behind avatar
    drawRays(ctx, W / 2, H * 0.38, 16, frame * 0.006 + idx * 1.2, 0.18 * enterP);

    // Avatar scale animation
    const avatarScale = lerp(0.4, 1.0, easeOut(clamp01(localSec / 0.8)));
    const avatarY = H * 0.38;
    const avatarR = 140;

    ctx.save();
    ctx.translate(W / 2, avatarY);
    ctx.scale(avatarScale, avatarScale);
    ctx.translate(-W / 2, -avatarY);

    const initials = getInitials(player.naam);
    drawAvatar(ctx, W / 2, avatarY, avatarR, initials, player.color);
    ctx.restore();

    // Position badge (top left above avatar)
    const posLabels = ['#1', '#2', '#3'];
    ctx.save();
    ctx.globalAlpha = enterP;
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    ctx.font = 'bold 64px serif';
    ctx.textAlign = 'left';
    ctx.fillText(posLabels[idx], 80, avatarY - avatarR + 30);
    ctx.restore();

    // Crown / badge
    if (player.badge) {
      const badgeP = easeOut(clamp01((localSec - 0.5) / 0.5));
      ctx.save();
      ctx.globalAlpha = badgeP;
      ctx.fillStyle = 'rgba(255,215,0,0.15)';
      roundRect(ctx, W / 2 - 280, avatarY + avatarR + 20, 560, 66, 16);
      ctx.fill();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      roundRect(ctx, W / 2 - 280, avatarY + avatarR + 20, 560, 66, 16);
      ctx.stroke();
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.badge, W / 2, avatarY + avatarR + 66);
      ctx.restore();
    }

    const textBaseY = player.badge
      ? avatarY + avatarR + 120
      : avatarY + avatarR + 60;

    // Name
    const nameP = easeOut(clamp01((localSec - 0.4) / 0.6));
    ctx.save();
    ctx.globalAlpha = nameP;
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 28;
    ctx.font = `bold ${player.naam.length > 8 ? 72 : 80}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(player.naam, W / 2, textBaseY + 80);
    ctx.restore();

    // Points
    const ptsP = easeOut(clamp01((localSec - 0.7) / 0.5));
    ctx.save();
    ctx.globalAlpha = ptsP;
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 16;
    ctx.font = 'bold 56px serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.pts, W / 2, textBaseY + 160);
    ctx.restore();

    // Exact score
    const exP = easeOut(clamp01((localSec - 1.0) / 0.5));
    ctx.save();
    ctx.globalAlpha = exP;
    ctx.fillStyle = '#ffffff';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.exact, W / 2, textBaseY + 230);
    ctx.restore();

    // Kampioen country
    const kmP = easeOut(clamp01((localSec - 1.3) / 0.5));
    ctx.save();
    ctx.globalAlpha = kmP;
    ctx.fillStyle = '#cccccc';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.km, W / 2, textBaseY + 290);
    ctx.restore();
  });

  drawGlobalOverlays(ctx, frame);
}

// ─── SCENE 4: FULL LEADERBOARD (30–42s) ──────────────────────────────────────
function sceneLeaderboard(ctx, frame) {
  drawGlobalElements(ctx, frame);

  const headerP = easeOut(progress(frame, 30.3, 31.2));
  ctx.save();
  ctx.globalAlpha = headerP;
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 16;
  ctx.font = 'bold 52px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 RANGLIJST', W / 2, 108);
  ctx.restore();
  drawGoldLine(ctx, 130);

  const maxPt = 65;
  const rowH = 76;
  const startY = 155;

  PLAYERS.forEach((player, i) => {
    const delay = 30.6 + i * 0.25;
    const p = easeOut(progress(frame, delay, delay + 0.4));
    if (p <= 0) return;

    const y = startY + i * rowH;
    const slideX = lerp(120, 0, p);

    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(slideX, 0);

    // Row background
    const isMedal = player.pos <= 3;
    ctx.fillStyle = isMedal
      ? (player.pos === 1 ? 'rgba(255,215,0,0.1)' : player.pos === 2 ? 'rgba(0,255,229,0.07)' : 'rgba(68,136,255,0.07)')
      : 'rgba(255,255,255,0.025)';
    roundRect(ctx, 24, y + 2, W - 48, rowH - 4, 12);
    ctx.fill();

    if (isMedal) {
      ctx.strokeStyle = player.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = p * 0.5;
      roundRect(ctx, 24, y + 2, W - 48, rowH - 4, 12);
      ctx.stroke();
      ctx.globalAlpha = p;
    }

    // Avatar
    drawAvatar(ctx, 72, y + rowH / 2, 28, getInitials(player.naam), player.color);

    // Position
    ctx.fillStyle = isMedal ? player.color : '#888888';
    ctx.font = `bold 26px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`${player.pos}.`, 110, y + rowH / 2 + 9);

    // Name (with km flag if present)
    const nameDisplay = player.km ? `${player.naam} ${player.km}` : player.naam;
    ctx.fillStyle = isMedal ? '#FFD700' : '#f0f0f0';
    ctx.font = `${isMedal ? 'bold ' : ''}${isMedal ? 26 : 24}px sans-serif`;
    ctx.fillText(nameDisplay, 155, y + rowH / 2 + 9);

    // Progress bar
    const barW = W - 480;
    const barX = W - 240 - barW;
    const barY = y + rowH / 2 - 6;
    // Animate bar fill over 0.3s after row appears
    const barFill = clamp01((frame / FPS - delay) / 0.35);

    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    roundRect(ctx, barX, barY, barW, 12, 6);
    ctx.fill();

    const fillW = (player.pt / maxPt) * barW * barFill;
    if (fillW > 0) {
      const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      barGrad.addColorStop(0, player.color + 'bb');
      barGrad.addColorStop(1, player.color);
      ctx.fillStyle = barGrad;
      roundRect(ctx, barX, barY, fillW, 12, 6);
      ctx.fill();
    }

    // Points
    ctx.fillStyle = isMedal ? '#FFD700' : '#ffffff';
    ctx.font = `bold 26px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`${player.pt}pt`, W - 30, y + rowH / 2 + 9);

    ctx.restore();
  });

  drawGlobalOverlays(ctx, frame);
}

// ─── SCENE 5: PRIJZEN (42–49s) ────────────────────────────────────────────────
function scenePrijzen(ctx, frame) {
  drawGlobalElements(ctx, frame);
  drawRays(ctx, W / 2, H * 0.12, 6, frame * 0.004, 0.06);

  const headerP = easeOut(progress(frame, 42.4, 43.3));
  ctx.save();
  ctx.globalAlpha = headerP;
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 16;
  ctx.font = 'bold 52px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎁 DE INZET', W / 2, 150);
  ctx.restore();
  drawGoldLine(ctx, 178);

  const prizes = [
    {
      delay: 43.0, emoji: '🏆',
      title: 'BEKER',
      sub: 'De Jaikaran Family Beker 2026',
      desc: 'Eeuwige roem',
      color: '#FFD700', cardColor: 'rgba(255,215,0,0.10)', y: 210,
    },
    {
      delay: 44.2, emoji: '🍖',
      title: 'BBQ-FEEST',
      sub: 'Winnaar kiest de datum',
      desc: 'Iedereen uitgenodigd',
      color: '#FF6D00', cardColor: 'rgba(255,109,0,0.10)', y: 550,
    },
    {
      delay: 45.4, emoji: '🃏',
      title: 'POEDELPRIJS',
      sub: 'Laagste punten = eeuwige schande',
      desc: 'De loser van het jaar draagt de titel!',
      color: '#FF2244', cardColor: 'rgba(255,34,68,0.10)', y: 890,
    },
  ];

  prizes.forEach(prize => {
    const p = easeOut(progress(frame, prize.delay, prize.delay + 0.7));
    if (p <= 0) return;

    const cardH = 280;
    ctx.save();
    ctx.globalAlpha = p;

    // Card
    ctx.fillStyle = prize.cardColor;
    roundRect(ctx, 60, prize.y, W - 120, cardH, 24);
    ctx.fill();
    ctx.strokeStyle = prize.color;
    ctx.lineWidth = 2.5;
    roundRect(ctx, 60, prize.y, W - 120, cardH, 24);
    ctx.stroke();

    // Emoji
    ctx.font = '90px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(prize.emoji, 100, prize.y + 115);

    // Title
    ctx.fillStyle = prize.color;
    ctx.shadowColor = prize.color;
    ctx.shadowBlur = 14;
    ctx.font = 'bold 48px serif';
    ctx.fillText(prize.title, 230, prize.y + 88);

    // Sub
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '30px sans-serif';
    ctx.fillText(prize.sub, 230, prize.y + 140);

    // Desc
    ctx.fillStyle = '#888888';
    ctx.font = '26px sans-serif';
    ctx.fillText(prize.desc, 230, prize.y + 185);

    ctx.restore();
  });

  // Teaser text
  const teaserP = easeOut(progress(frame, 47.0, 48.0));
  ctx.save();
  ctx.globalAlpha = teaserP;
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Alles staat nog op het spel!', W / 2, 1250);
  ctx.fillStyle = '#888888';
  ctx.font = '26px sans-serif';
  ctx.fillText('Wie pakt de beker? Wie draagt de schande?', W / 2, 1298);
  ctx.restore();

  drawGlobalOverlays(ctx, frame);
}

// ─── SCENE 6: OUTRO (49–55s) ─────────────────────────────────────────────────
function sceneOutro(ctx, frame) {
  drawGlobalElements(ctx, frame);
  drawRays(ctx, W / 2, H * 0.38, 14, frame * 0.01, 0.12 + 0.06 * Math.sin(frame * 0.08));

  const trophyGlow = 0.5 + 0.35 * Math.sin(frame * 0.12);
  drawTrophy(ctx, W / 2, H * 0.38, 0.9, trophyGlow);

  drawGoldLine(ctx, 795);

  const textBaseY = 870;

  const q1P = easeOut(progress(frame, 49.5, 50.8));
  ctx.save();
  ctx.globalAlpha = q1P;
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 22;
  ctx.font = 'bold 64px serif';
  ctx.textAlign = 'center';
  ctx.fillText('WIE WINT DE BEKER?', W / 2, textBaseY);
  ctx.restore();

  const q2P = easeOut(progress(frame, 50.5, 51.5));
  ctx.save();
  ctx.globalAlpha = q2P;
  ctx.fillStyle = '#ffffff';
  ctx.font = '36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Nog alles mogelijk!', W / 2, textBaseY + 68);
  ctx.restore();

  const urlP = easeOut(progress(frame, 51.2, 52.2));
  ctx.save();
  ctx.globalAlpha = urlP;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('moek72.github.io/wk-poule/wkpoule.html', W / 2, textBaseY + 148);
  ctx.restore();

  const footP = easeOut(progress(frame, 52.0, 53.2));
  ctx.save();
  ctx.globalAlpha = footP;
  ctx.fillStyle = '#888888';
  ctx.font = '28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Tot de volgende editie! ⚽', W / 2, textBaseY + 210);
  ctx.restore();

  drawGlobalOverlays(ctx, frame);
}

// ─── MAIN RENDER LOOP ─────────────────────────────────────────────────────────
console.log(`Rendering ${TOTAL} frames at ${FPS}fps (${DURATION}s)...`);
console.log(`Canvas: ${W}×${H}, output: ${outPath}`);

for (let f = 0; f < TOTAL; f++) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const sec = f / FPS;

  if (sec < 9) {
    sceneIntro(ctx, f);
  } else if (sec < 16) {
    sceneStats(ctx, f);
  } else if (sec < 30) {
    sceneTop3(ctx, f);
  } else if (sec < 42) {
    sceneLeaderboard(ctx, f);
  } else if (sec < 49) {
    scenePrijzen(ctx, f);
  } else {
    sceneOutro(ctx, f);
  }

  // Scene transition fades (on top of everything)
  drawTransitionFade(ctx, f);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(framesDir, `frame${String(f).padStart(5, '0')}.png`), buf);

  if (f % 150 === 0 || f === TOTAL - 1) {
    const pct = Math.round((f + 1) / TOTAL * 100);
    process.stdout.write(`  ${pct}% (frame ${f + 1}/${TOTAL})\r`);
  }
}

console.log('\nAll frames rendered. Stitching with ffmpeg...');

const bgmPath = path.join(__dirname, 'bgm.wav');
const hasBgm = fs.existsSync(bgmPath);
const audioArg = hasBgm
  ? `-i "${bgmPath}" -c:a aac -b:a 192k -shortest`
  : '-an';

if (hasBgm) {
  console.log('BGM found — adding audio track.');
} else {
  console.log('No bgm.wav found — rendering video only.');
}

execSync(
  `ffmpeg -y -framerate ${FPS} -i "${framesDir}/frame%05d.png" ${audioArg} -c:v libx264 -pix_fmt yuv420p -crf 22 -preset fast "${outPath}"`,
  { stdio: 'inherit' }
);

console.log(`\nVideo: ${outPath}`);
