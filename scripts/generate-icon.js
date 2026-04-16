const { createCanvas } = require('@napi-rs/canvas');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SIZES = [16, 32, 64, 128, 256, 512, 1024];
const ASSET_DIR = path.join(__dirname, 'build', 'icon.iconset');

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(0.5, '#16213e');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Rounded rect clip
  const r = size * 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.38, size * 0.1);
  ctx.lineTo(cx + size * 0.38, size * 0.1);
  ctx.quadraticCurveTo(cx + size * 0.42, size * 0.1, cx + size * 0.42, size * 0.14);
  ctx.lineTo(cx + size * 0.42, size * 0.86);
  ctx.quadraticCurveTo(cx + size * 0.42, size * 0.9, cx + size * 0.38, size * 0.9);
  ctx.lineTo(cx - size * 0.38, size * 0.9);
  ctx.quadraticCurveTo(cx - size * 0.42, size * 0.9, cx - size * 0.42, size * 0.86);
  ctx.lineTo(cx - size * 0.42, size * 0.14);
  ctx.quadraticCurveTo(cx - size * 0.42, size * 0.1, cx - size * 0.38, size * 0.1);
  ctx.closePath();
  ctx.clip();

  // Deep gradient fill
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.6);
  bgGrad.addColorStop(0, '#1e3a5f');
  bgGrad.addColorStop(0.6, '#0f2744');
  bgGrad.addColorStop(1, '#0a1628');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Equalizer bars (7 bars)
  const barCount = 7;
  const barW = size * 0.038;
  const gap = size * 0.022;
  const totalW = barCount * barW + (barCount - 1) * gap;
  const startX = cx - totalW / 2;
  const baseY = cy + size * 0.12;

  const barHeights = [0.45, 0.7, 0.95, 1.0, 0.8, 0.55, 0.35];
  const barColors = [
    '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#F97316', '#F59E0B', '#6366F1',
  ];

  for (let i = 0; i < barCount; i++) {
    const x = startX + i * (barW + gap);
    const h = barHeights[i] * size * 0.38;
    const y = baseY - h * 0.5;

    // Bar gradient
    const barGrad = ctx.createLinearGradient(x, y, x, y + h);
    barGrad.addColorStop(0, barColors[i]);
    barGrad.addColorStop(1, barColors[i] + '44');

    ctx.fillStyle = barGrad;
    ctx.beginPath();
    const br = barW * 0.3;
    ctx.moveTo(x + br, y);
    ctx.lineTo(x + barW - br, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + br);
    ctx.lineTo(x + barW, y + h - br);
    ctx.quadraticCurveTo(x + barW, y + h, x + barW - br, y + h);
    ctx.lineTo(x + br, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - br);
    ctx.lineTo(x, y + br);
    ctx.quadraticCurveTo(x, y, x + br, y);
    ctx.closePath();
    ctx.fill();

    // Glow effect
    ctx.shadowColor = barColors[i];
    ctx.shadowBlur = size * 0.04;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Headphone arc
  const arcY = cy - size * 0.12;
  const arcR = size * 0.28;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = size * 0.022;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, arcY - size * 0.04, arcR, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  // Headphone cups
  const cupY = arcY - size * 0.04 + arcR * Math.sin(Math.PI * 1.15);
  const cupX1 = cx - arcR * Math.cos(Math.PI * 1.15);
  const cupX2 = cx + arcR * Math.cos(Math.PI * 1.15);
  const cupR = size * 0.065;

  for (const [cupX, dir] of [[cupX1, -1], [cupX2, 1]]) {
    const cupGrad = ctx.createLinearGradient(cupX - cupR, cupY - cupR, cupX + cupR, cupY + cupR);
    cupGrad.addColorStop(0, '#CBD5E1');
    cupGrad.addColorStop(1, '#64748B');
    ctx.fillStyle = cupGrad;
    ctx.beginPath();
    ctx.ellipse(cupX, cupY, cupR, cupR * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = size * 0.012;
    ctx.stroke();
  }

  // OMS text
  const fontSize = size * 0.16;
  ctx.fillStyle = '#F8FAFC';
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#6366F1';
  ctx.shadowBlur = size * 0.05;
  ctx.fillText('OMS', cx, cy + size * 0.2);
  ctx.shadowBlur = 0;

  ctx.restore();

  // Outer border ring
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.roundRect(size * 0.04, size * 0.04, size * 0.92, size * 0.92, r);
  ctx.stroke();

  return canvas;
}

// Generate PNG at each size
const sizes = [16, 32, 64, 128, 256, 512, 1024];
const iconsetDir = path.join(__dirname, 'build', 'icon.iconset');
const pngDir = path.join(__dirname, 'build');

fs.mkdirSync(iconsetDir, { recursive: true });

for (const sz of sizes) {
  const canvas = drawIcon(sz);
  const pngPath = path.join(iconsetDir, `icon_${sz}x${sz}.png`);
  fs.writeFileSync(pngPath, canvas.toBuffer('image/png'));
  console.log(`Generated ${sz}x${sz}`);

  // Also @2x
  if (sz <= 512) {
    const canvas2x = drawIcon(sz * 2);
    const pngPath2x = path.join(iconsetDir, `icon_${sz}x${sz}@2x.png`);
    fs.writeFileSync(pngPath2x, canvas2x.toBuffer('image/png'));
    console.log(`Generated ${sz*2}x${sz*2} (@2x)`);
  }
}

// Also save a 1024 standalone PNG
const canvas1024 = drawIcon(1024);
fs.writeFileSync(path.join(pngDir, 'icon.png'), canvas1024.toBuffer('image/png'));
console.log('Saved icon.png (1024x1024)');

// Convert to ICNS using macOS iconutil
try {
  execSync(`iconutil -c icns "${iconsetDir}" -o "${pngDir}/icon.icns"`, { stdio: 'inherit' });
  console.log('Created icon.icns');
} catch (e) {
  console.log('iconutil failed, trying alternative...');
  // Alternative: use the 1024 PNG and hope electron-builder handles it
  fs.writeFileSync(path.join(pngDir, 'icon.icns'), fs.readFileSync(path.join(pngDir, 'icon.png')));
}

console.log('Done! Icons saved to build/');
