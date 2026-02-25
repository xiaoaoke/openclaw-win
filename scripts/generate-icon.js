// Generate a simple 256x256 PNG icon for electron-builder
// This creates a minimal valid PNG with OpenClaw branding colors

const fs = require('fs');
const { createCanvas } = (() => {
    try { return require('canvas'); } catch { return { createCanvas: null }; }
})();

if (!createCanvas) {
    // Fallback: create a minimal 1x1 PNG as placeholder
    // electron-builder will still work, just with default icon
    const png1x1 = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, // 256x256
        0x08, 0x02, 0x00, 0x00, 0x00, 0xD3, 0x10, 0x3F,
        0x31, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND
        0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    console.log('No canvas available. Skipping icon generation.');
    console.log('You can add a 256x256 icon.png to build/ manually.');
    process.exit(0);
}

const size = 256;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background
const bg = ctx.createLinearGradient(0, 0, size, size);
bg.addColorStop(0, '#1a1a2e');
bg.addColorStop(1, '#0a0a1a');
ctx.fillStyle = bg;
roundRect(ctx, 0, 0, size, size, 48);
ctx.fill();

// Lobster body
ctx.fillStyle = '#FF4500';
ctx.beginPath();
ctx.ellipse(128, 150, 30, 40, 0, 0, Math.PI * 2);
ctx.fill();

// Claws
ctx.strokeStyle = '#FF6B35';
ctx.lineWidth = 10;
ctx.lineCap = 'round';
// Left claw
ctx.beginPath();
ctx.moveTo(98, 100);
ctx.bezierCurveTo(60, 85, 50, 110, 65, 130);
ctx.stroke();
// Right claw
ctx.beginPath();
ctx.moveTo(158, 100);
ctx.bezierCurveTo(196, 85, 206, 110, 191, 130);
ctx.stroke();

// Eyes
ctx.fillStyle = '#fff';
ctx.beginPath();
ctx.arc(115, 138, 6, 0, Math.PI * 2);
ctx.arc(141, 138, 6, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#0a0a1a';
ctx.beginPath();
ctx.arc(116, 139, 3, 0, Math.PI * 2);
ctx.arc(142, 139, 3, 0, Math.PI * 2);
ctx.fill();

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('build/icon.png', buffer);
console.log('Icon generated: build/icon.png');

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
