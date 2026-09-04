import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";

const outDir = path.resolve("./src/assets/puzzles");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Global dimensions
const W = 1024;
const H = 768;

// Common rendering utilities for rich 3D cartoon Pixar style
function createScene() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  return { canvas, ctx };
}

function saveScene(canvas, filename) {
  const buffer = canvas.toBuffer("image/jpeg", 94);
  fs.writeFileSync(path.join(outDir, filename), buffer);
  console.log(`Rendered: ${filename} (${Math.round(buffer.length / 1024)} KB)`);
}

// 3D Lighting and Primitive Helpers
function drawSky(ctx, c1, c2, c3, c4) {
  const grad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
  grad.addColorStop(0, c1);
  if (c2) grad.addColorStop(0.35, c2);
  if (c3) grad.addColorStop(0.7, c3);
  grad.addColorStop(1, c4 || c3 || c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawSun(
  ctx,
  cx,
  cy,
  r,
  glowR,
  color = "#fffbeb",
  glowColor = "rgba(254, 240, 138, 0.45)",
) {
  // Glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, glowR);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(0.5, glowColor.replace(/[\d\.]+\)$/, "0.2)"));
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Core
  const core = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.6, color);
  core.addColorStop(1, "#f59e0b");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawSunbeams(ctx, sx, sy, count = 7, maxLen = 700) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < count; i++) {
    const angle = Math.PI / 4 + (i / count) * (Math.PI / 2.5);
    const grad = ctx.createRadialGradient(
      sx,
      sy,
      50,
      sx + Math.cos(angle) * maxLen,
      sy + Math.sin(angle) * maxLen,
      maxLen,
    );
    grad.addColorStop(0, "rgba(254, 243, 199, 0.25)");
    grad.addColorStop(1, "rgba(254, 243, 199, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle - 0.1) * maxLen, sy + Math.sin(angle - 0.1) * maxLen);
    ctx.lineTo(sx + Math.cos(angle + 0.1) * maxLen, sy + Math.sin(angle + 0.1) * maxLen);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFluffyCloud(ctx, cx, cy, scale = 1, tint = "#ffffff") {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Soft shadow
  ctx.shadowColor = "rgba(15, 23, 42, 0.12)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 12;

  const grad = ctx.createLinearGradient(0, -50, 0, 40);
  grad.addColorStop(0, tint);
  grad.addColorStop(0.7, tint);
  grad.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.arc(-70, 10, 45, 0, Math.PI * 2);
  ctx.arc(-25, -20, 55, 0, Math.PI * 2);
  ctx.arc(35, -25, 60, 0, Math.PI * 2);
  ctx.arc(85, 5, 45, 0, Math.PI * 2);
  ctx.arc(10, 15, 50, 0, Math.PI * 2);
  ctx.fill();

  // Top highlight
  ctx.shadowColor = "transparent";
  const hl = ctx.createLinearGradient(0, -60, 0, -20);
  hl.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  hl.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.arc(35, -25, 45, Math.PI, Math.PI * 2);
  ctx.arc(-25, -20, 42, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function draw3DSphere(
  ctx,
  cx,
  cy,
  r,
  baseColor,
  highlightColor = "#ffffff",
  shadowColor = "#1e293b",
) {
  ctx.save();
  // Under shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = r * 0.4;
  ctx.shadowOffsetY = r * 0.25;

  const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.05, cx, cy, r);
  grad.addColorStop(0, highlightColor);
  grad.addColorStop(0.2, baseColor);
  grad.addColorStop(0.85, baseColor);
  grad.addColorStop(1, shadowColor);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Glossy reflection spot
  ctx.shadowColor = "transparent";
  const gloss = ctx.createRadialGradient(
    cx - r * 0.4,
    cy - r * 0.4,
    0,
    cx - r * 0.4,
    cy - r * 0.4,
    r * 0.3,
  );
  gloss.addColorStop(0, "rgba(255, 255, 255, 0.65)");
  gloss.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.arc(cx - r * 0.4, cy - r * 0.4, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw3DPineTree(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Trunk
  const trunkGrad = ctx.createLinearGradient(-15, 0, 15, 0);
  trunkGrad.addColorStop(0, "#451a03");
  trunkGrad.addColorStop(0.5, "#78350f");
  trunkGrad.addColorStop(1, "#290d02");
  ctx.fillStyle = trunkGrad;
  ctx.fillRect(-12, -40, 24, 60);

  // 3 Tiers of foliage
  const tiers = [
    { cy: -50, w: 90, h: 70, dark: "#14532d", light: "#22c55e" },
    { cy: -95, w: 75, h: 65, dark: "#15803d", light: "#4ade80" },
    { cy: -140, w: 55, h: 60, dark: "#166534", light: "#86efac" },
  ];

  for (const t of tiers) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;

    const folGrad = ctx.createLinearGradient(-t.w, t.cy, t.w, t.cy);
    folGrad.addColorStop(0, t.dark);
    folGrad.addColorStop(0.4, t.light);
    folGrad.addColorStop(1, t.dark);
    ctx.fillStyle = folGrad;

    ctx.beginPath();
    ctx.moveTo(0, t.cy - t.h);
    ctx.lineTo(-t.w / 2, t.cy);
    ctx.quadraticCurveTo(0, t.cy + 15, t.w / 2, t.cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function draw3DMountain(
  ctx,
  x1,
  y1,
  peakX,
  peakY,
  x2,
  y2,
  snowLevel = 0.65,
  rockDark = "#334155",
  rockLight = "#64748b",
) {
  ctx.save();
  // Left side (lit)
  const litGrad = ctx.createLinearGradient(x1, y1, peakX, peakY);
  litGrad.addColorStop(0, rockLight);
  litGrad.addColorStop(1, "#94a3b8");
  ctx.fillStyle = litGrad;
  ctx.beginPath();
  ctx.moveTo(peakX, peakY);
  ctx.lineTo(x1, y1);
  ctx.lineTo(peakX, y1);
  ctx.closePath();
  ctx.fill();

  // Right side (shadowed)
  const shadGrad = ctx.createLinearGradient(peakX, peakY, x2, y2);
  shadGrad.addColorStop(0, rockDark);
  shadGrad.addColorStop(1, "#1e293b");
  ctx.fillStyle = shadGrad;
  ctx.beginPath();
  ctx.moveTo(peakX, peakY);
  ctx.lineTo(peakX, y2);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.fill();

  // Snow cap
  const snowY = peakY + (y1 - peakY) * (1 - snowLevel);
  const snowGrad = ctx.createLinearGradient(peakX, peakY, peakX, snowY);
  snowGrad.addColorStop(0, "#ffffff");
  snowGrad.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = snowGrad;
  ctx.beginPath();
  ctx.moveTo(peakX, peakY);
  ctx.lineTo(x1 + (peakX - x1) * snowLevel, snowY);
  ctx.quadraticCurveTo(peakX - 20, snowY + 20, peakX, snowY - 10);
  ctx.quadraticCurveTo(peakX + 20, snowY + 25, peakX + (x2 - peakX) * (1 - snowLevel), snowY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRollingHill(ctx, yStart, amp, color1, color2) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, yStart - 100, 0, H);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, yStart);
  ctx.bezierCurveTo(W * 0.25, yStart - amp, W * 0.75, yStart + amp, W, yStart);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWater(ctx, yTop, yBottom, cTop = "#38bdf8", cBottom = "#0284c7") {
  ctx.save();
  const grad = ctx.createLinearGradient(0, yTop, 0, yBottom);
  grad.addColorStop(0, cTop);
  grad.addColorStop(1, cBottom);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(W / 2, (yTop + yBottom) / 2, W * 0.65, (yBottom - yTop) / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shimmer highlights
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const wy = yTop + (yBottom - yTop) * (0.2 + i * 0.1);
    const wx = W * 0.25 + Math.sin(i) * 120 + 100;
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + 80 + (i % 3) * 40, wy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCuteFlower(ctx, cx, cy, r, petalColor, centerColor = "#facc15") {
  ctx.save();
  ctx.translate(cx, cy);
  // Petals
  ctx.fillStyle = petalColor;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }
  // Center
  draw3DSphere(ctx, 0, 0, r * 0.55, centerColor, "#fffbeb", "#a16207");
  ctx.restore();
}

function applyFinishingTouches(ctx, warmAmber = true) {
  ctx.save();
  // Warm lighting overlay
  if (warmAmber) {
    const ambient = ctx.createRadialGradient(W / 2, H * 0.35, 100, W / 2, H / 2, W * 0.7);
    ambient.addColorStop(0, "rgba(254, 243, 199, 0.15)");
    ambient.addColorStop(0.7, "rgba(251, 146, 60, 0.08)");
    ambient.addColorStop(1, "rgba(30, 27, 75, 0.18)");
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, W, H);
  }

  // Soft vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.45, W / 2, H / 2, W * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(15, 23, 42, 0.25)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ----------------------------------------------------
// 1. NATURE SCENES (nature-5 to nature-12)
// ----------------------------------------------------
function renderNatureScenes() {
  // nature-5: Kutup Fiyordu (Icy arctic fjord, turquoise water, glaciers)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#0284c7", "#38bdf8", "#e0f2fe", "#f0fdf4");
    drawSun(ctx, 512, 140, 50, 220, "#ffffff", "rgba(224, 242, 254, 0.6)");
    drawSunbeams(ctx, 512, 140, 9, 650);

    // Far Glaciers
    draw3DMountain(ctx, 0, 480, 260, 160, 520, 500, 0.75, "#0284c7", "#7dd3fc");
    draw3DMountain(ctx, 420, 510, 750, 130, 1024, 490, 0.75, "#0369a1", "#bae6fd");

    // Deep Fjord Water
    const waterGrad = ctx.createLinearGradient(0, 450, 0, H);
    waterGrad.addColorStop(0, "#0284c7");
    waterGrad.addColorStop(0.5, "#0f766e");
    waterGrad.addColorStop(1, "#115e59");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 450, W, H - 450);

    // Floating 3D Icebergs
    const drawIceberg = (bx, by, w, h) => {
      ctx.save();
      ctx.shadowColor = "rgba(0, 30, 60, 0.35)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 12;
      const ibGrad = ctx.createLinearGradient(bx, by - h, bx, by);
      ibGrad.addColorStop(0, "#ffffff");
      ibGrad.addColorStop(0.5, "#e0f2fe");
      ibGrad.addColorStop(1, "#38bdf8");
      ctx.fillStyle = ibGrad;
      ctx.beginPath();
      ctx.moveTo(bx - w / 2, by);
      ctx.lineTo(bx - w * 0.3, by - h * 0.7);
      ctx.lineTo(bx, by - h);
      ctx.lineTo(bx + w * 0.25, by - h * 0.85);
      ctx.lineTo(bx + w / 2, by);
      ctx.closePath();
      ctx.fill();
      // Underwater glow
      ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
      ctx.beginPath();
      ctx.ellipse(bx, by + 15, w * 0.45, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawIceberg(240, 560, 240, 160);
    drawIceberg(780, 580, 280, 190);
    drawIceberg(510, 640, 200, 130);

    // Foreground snowy ledge
    ctx.save();
    const ledgeGrad = ctx.createLinearGradient(0, 660, 0, H);
    ledgeGrad.addColorStop(0, "#ffffff");
    ledgeGrad.addColorStop(0.4, "#cbd5e1");
    ledgeGrad.addColorStop(1, "#475569");
    ctx.fillStyle = ledgeGrad;
    ctx.beginPath();
    ctx.moveTo(0, 700);
    ctx.bezierCurveTo(300, 640, 700, 680, W, 670);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawFluffyCloud(ctx, 150, 110, 0.9);
    drawFluffyCloud(ctx, 870, 90, 1.1);
    applyFinishingTouches(ctx, false);
    saveScene(canvas, "nature-5.jpg");
  }

  // nature-6: Çam Ormanı (Lush deep evergreen pine forest, misty sunlight rays)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#0284c7", "#38bdf8", "#fed7aa", "#fef08a");
    drawSun(ctx, 680, 180, 70, 300, "#fffbeb", "rgba(254, 240, 138, 0.6)");
    drawSunbeams(ctx, 680, 180, 12, 850);

    // Far misty hills
    drawRollingHill(ctx, 420, 40, "#15803d", "#14532d");
    drawRollingHill(ctx, 480, 50, "#166534", "#0f3a1f");

    // Background Pine Trees
    for (let x = 40; x <= W; x += 110) {
      draw3DPineTree(ctx, x, 440, 0.65 + (x % 5) * 0.08);
    }
    // Midground Pine Trees
    for (let x = 80; x <= W; x += 130) {
      draw3DPineTree(ctx, x, 530, 0.95 + (x % 3) * 0.1);
    }

    // Foreground Mossy Forest Floor
    drawRollingHill(ctx, 580, 35, "#22c55e", "#14532d");

    // Large Foreground Pines
    draw3DPineTree(ctx, 120, 680, 1.4);
    draw3DPineTree(ctx, 880, 670, 1.35);

    // Cute forest mushrooms & flowers
    for (let i = 0; i < 15; i++) {
      const fx = 200 + i * 42;
      const fy = 660 + Math.sin(i * 1.5) * 40;
      drawCuteFlower(ctx, fx, fy, 14, i % 2 === 0 ? "#ef4444" : "#f59e0b", "#ffffff");
    }

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "nature-6.jpg");
  }

  // nature-7: Çöl Vahası (Golden rolling sand dunes, turquoise oasis pool, date palms)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#0284c7", "#38bdf8", "#fed7aa", "#f97316");
    drawSun(ctx, 750, 160, 65, 280, "#fffbeb", "rgba(251, 146, 60, 0.5)");
    drawSunbeams(ctx, 750, 160, 8, 750);

    // Distant soft sand ridges
    drawRollingHill(ctx, 420, 50, "#fbbf24", "#d97706");
    drawRollingHill(ctx, 490, 60, "#f59e0b", "#b45309");

    // Turquoise Oasis Pool
    drawWater(ctx, 510, 640, "#22d3ee", "#0891b2");

    // Date Palms around oasis
    const drawDatePalm = (px, py, scale = 1) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(scale, scale);
      // Curved trunk
      ctx.lineWidth = 22;
      ctx.strokeStyle = "#78350f";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(25, -100, 15, -190);
      ctx.stroke();

      // Fronds
      ctx.fillStyle = "#15803d";
      for (let a = -2.5; a <= 2.5; a += 0.6) {
        ctx.save();
        ctx.translate(15, -190);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(50, -20, 90, 20);
        ctx.quadraticCurveTo(40, 10, 0, 0);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };

    drawDatePalm(280, 560, 0.9);
    drawDatePalm(360, 540, 0.8);
    drawDatePalm(720, 550, 0.95);
    drawDatePalm(800, 570, 0.75);

    // Warm foreground dune
    drawRollingHill(ctx, 620, 50, "#fde047", "#d97706");

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "nature-7.jpg");
  }

  // nature-8: Kanyon Vadisi (Warm terracotta layered canyon, winding river)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#1e3a8a", "#f43f5e", "#fb923c", "#fef08a");
    drawSun(ctx, 512, 280, 60, 240, "#fef08a", "rgba(251, 146, 60, 0.6)");

    // Canyon cliff plates (Left & Right)
    const drawCanyonWall = (isLeft) => {
      ctx.save();
      const xStart = isLeft ? 0 : W;
      const xEnd = isLeft ? 380 : W - 380;
      const grad = ctx.createLinearGradient(0, 200, 0, H);
      grad.addColorStop(0, "#ea580c");
      grad.addColorStop(0.3, "#c2410c");
      grad.addColorStop(0.6, "#9a3412");
      grad.addColorStop(1, "#7c2d12");
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(xStart, 200);
      if (isLeft) {
        ctx.lineTo(xEnd, 220);
        ctx.lineTo(xEnd - 40, 360);
        ctx.lineTo(xEnd + 20, 480);
        ctx.lineTo(xEnd - 30, 620);
        ctx.lineTo(xEnd + 40, H);
        ctx.lineTo(0, H);
      } else {
        ctx.lineTo(xEnd, 210);
        ctx.lineTo(xEnd + 50, 350);
        ctx.lineTo(xEnd - 30, 490);
        ctx.lineTo(xEnd + 20, 640);
        ctx.lineTo(xEnd - 40, H);
        ctx.lineTo(W, H);
      }
      ctx.closePath();
      ctx.fill();

      // Canyon rock strata lines
      ctx.strokeStyle = "rgba(254, 215, 170, 0.25)";
      ctx.lineWidth = 6;
      for (let y = 260; y < H; y += 45) {
        ctx.beginPath();
        ctx.moveTo(xStart, y);
        ctx.lineTo(isLeft ? xEnd - 20 : xEnd + 20, y + 10);
        ctx.stroke();
      }
      ctx.restore();
    };

    drawCanyonWall(true);
    drawCanyonWall(false);

    // River flowing through canyon
    const river = ctx.createLinearGradient(0, 400, 0, H);
    river.addColorStop(0, "#38bdf8");
    river.addColorStop(1, "#0284c7");
    ctx.fillStyle = river;
    ctx.beginPath();
    ctx.moveTo(490, 400);
    ctx.quadraticCurveTo(450, 550, 360, H);
    ctx.lineTo(660, H);
    ctx.quadraticCurveTo(560, 560, 530, 400);
    ctx.closePath();
    ctx.fill();

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "nature-8.jpg");
  }

  // nature-9: Kapadokya Balonları (Fairytale fairy chimneys, colorful 3D hot air balloons)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#1e1b4b", "#c026d3", "#f97316", "#fde047");
    drawSun(ctx, 780, 240, 55, 260, "#fffbeb", "rgba(251, 146, 60, 0.5)");
    drawSunbeams(ctx, 780, 240, 8, 800);

    // Fairy Chimneys (Kapadokya Peribacaları)
    const drawFairyChimney = (cx, cy, w, h) => {
      ctx.save();
      const grad = ctx.createLinearGradient(cx - w, cy, cx + w, cy);
      grad.addColorStop(0, "#d97706");
      grad.addColorStop(0.5, "#fef3c7");
      grad.addColorStop(1, "#92400e");
      ctx.fillStyle = grad;

      // Body
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.4, cy);
      ctx.lineTo(cx - w * 0.25, cy - h);
      ctx.lineTo(cx + w * 0.25, cy - h);
      ctx.lineTo(cx + w * 0.4, cy);
      ctx.closePath();
      ctx.fill();

      // Rock Hat
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.ellipse(cx, cy - h, w * 0.45, h * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawRollingHill(ctx, 520, 40, "#fde68a", "#d97706");
    drawFairyChimney(160, 680, 160, 300);
    drawFairyChimney(320, 650, 120, 240);
    drawFairyChimney(680, 660, 140, 260);
    drawFairyChimney(860, 690, 180, 320);

    // 3D Hot Air Balloons
    const drawBalloon = (bx, by, r, mainColor, stripeColor) => {
      ctx.save();
      ctx.translate(bx, by);

      // Balloon body
      const bGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      bGrad.addColorStop(0, "#ffffff");
      bGrad.addColorStop(0.3, mainColor);
      bGrad.addColorStop(1, "#451a03");
      ctx.fillStyle = bGrad;

      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.8, Math.PI * 2.2);
      ctx.lineTo(0, r * 1.35);
      ctx.closePath();
      ctx.fill();

      // Colorful stripes
      ctx.fillStyle = stripeColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.45, r * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();

      // Basket
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-r * 0.2, r * 1.5, r * 0.4, r * 0.25);

      // Ropes
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.15, r * 1.35);
      ctx.lineTo(-r * 0.15, r * 1.5);
      ctx.moveTo(r * 0.15, r * 1.35);
      ctx.lineTo(r * 0.15, r * 1.5);
      ctx.stroke();

      ctx.restore();
    };

    drawBalloon(260, 220, 80, "#ef4444", "#fbbf24");
    drawBalloon(540, 180, 95, "#3b82f6", "#ec4899");
    drawBalloon(820, 260, 70, "#10b981", "#f59e0b");
    drawBalloon(400, 320, 50, "#8b5cf6", "#f43f5e");
    drawBalloon(690, 340, 45, "#06b6d4", "#fef08a");

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "nature-9.jpg");
  }

  // nature-10: Alpler ve Çiçekli Çayır (Green rolling alpine meadow, wildflowers, chalet)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#0284c7", "#38bdf8", "#bae6fd", "#fef08a");
    drawSun(ctx, 840, 160, 60, 240, "#fffbeb", "rgba(254, 240, 138, 0.5)");

    // Majestic Alpine Peaks
    draw3DMountain(ctx, 0, 450, 320, 140, 640, 460, 0.8, "#334155", "#94a3b8");
    draw3DMountain(ctx, 420, 460, 760, 120, W, 450, 0.82, "#1e293b", "#cbd5e1");

    // Rolling Green Alpine Meadow
    drawRollingHill(ctx, 440, 40, "#4ade80", "#166534");
    drawRollingHill(ctx, 520, 45, "#22c55e", "#15803d");

    // Alpine Wooden Chalet
    const drawChalet = (cx, cy) => {
      ctx.save();
      ctx.translate(cx, cy);
      // Walls
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-60, -40, 120, 70);
      // Roof
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.moveTo(0, -85);
      ctx.lineTo(-80, -40);
      ctx.lineTo(80, -40);
      ctx.closePath();
      ctx.fill();
      // Windows
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(-45, -25, 25, 25);
      ctx.fillRect(20, -25, 25, 25);
      // Door
      ctx.fillStyle = "#b45309";
      ctx.fillRect(-12, 0, 24, 30);
      ctx.restore();
    };

    drawChalet(720, 490);

    // Foreground Flowery Meadow
    drawRollingHill(ctx, 600, 30, "#86efac", "#15803d");

    // Multi-colored alpine wildflowers
    const colors = ["#ef4444", "#ec4899", "#a855f7", "#3b82f6", "#facc15", "#ffffff"];
    for (let i = 0; i < 45; i++) {
      const fx = 30 + Math.random() * (W - 60);
      const fy = 620 + Math.random() * 120;
      drawCuteFlower(ctx, fx, fy, 12 + Math.random() * 8, colors[i % colors.length]);
    }

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "nature-10.jpg");
  }

  // nature-11: Tropik Palmiyeli Sahil (Pristine beach, turquoise waves, coconut palms)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#0284c7", "#38bdf8", "#bae6fd", "#fed7aa");
    drawSun(ctx, 512, 170, 65, 260, "#ffffff", "rgba(254, 240, 138, 0.5)");
    drawSunbeams(ctx, 512, 170, 9, 750);

    // Distant tropical island
    ctx.fillStyle = "#0f766e";
    ctx.beginPath();
    ctx.ellipse(320, 440, 140, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ocean layers
    const ocean = ctx.createLinearGradient(0, 440, 0, 600);
    ocean.addColorStop(0, "#0284c7");
    ocean.addColorStop(0.5, "#06b6d4");
    ocean.addColorStop(1, "#22d3ee");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 440, W, 160);

    // Foamy waves
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.moveTo(0, 580);
    ctx.bezierCurveTo(W * 0.3, 565, W * 0.7, 595, W, 580);
    ctx.lineTo(W, 605);
    ctx.bezierCurveTo(W * 0.7, 615, W * 0.3, 590, 0, 605);
    ctx.closePath();
    ctx.fill();

    // Golden Sand Beach
    const sand = ctx.createLinearGradient(0, 595, 0, H);
    sand.addColorStop(0, "#fde047");
    sand.addColorStop(0.5, "#f59e0b");
    sand.addColorStop(1, "#d97706");
    ctx.fillStyle = sand;
    ctx.fillRect(0, 595, W, H - 595);

    // Big Curved Palm Trees Left & Right
    const drawBigPalm = (isLeft) => {
      ctx.save();
      const px = isLeft ? 160 : W - 160;
      ctx.translate(px, 720);
      ctx.lineWidth = 36;
      ctx.strokeStyle = "#78350f";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(isLeft ? 80 : -80, -220, isLeft ? 160 : -160, -420);
      ctx.stroke();

      // Leaves
      const lx = isLeft ? 160 : -160;
      const ly = -420;
      ctx.fillStyle = "#15803d";
      for (let a = -3; a <= 3; a += 0.5) {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(70, -30, 140, 30);
        ctx.quadraticCurveTo(60, 20, 0, 0);
        ctx.fill();
        ctx.restore();
      }

      // Coconuts
      draw3DSphere(ctx, lx - 15, ly + 15, 18, "#78350f", "#a16207", "#451a03");
      draw3DSphere(ctx, lx + 15, ly + 15, 18, "#78350f", "#a16207", "#451a03");
      ctx.restore();
    };

    drawBigPalm(true);
    drawBigPalm(false);

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "nature-11.jpg");
  }

  // nature-12: Gizemli Bambu Vadisi (Emerald bamboo forest grove, stone path, serene water lilies)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#065f46", "#10b981", "#a7f3d0", "#fef08a");
    drawSunbeams(ctx, 512, 100, 11, 750);

    // Bamboo stalks (multi-tiered density)
    const drawBamboo = (bx, by, w, h, cLight, cDark) => {
      ctx.save();
      ctx.translate(bx, by);
      const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      grad.addColorStop(0, cDark);
      grad.addColorStop(0.3, cLight);
      grad.addColorStop(1, cDark);
      ctx.fillStyle = grad;
      ctx.fillRect(-w / 2, -h, w, h);

      // Bamboo nodes
      ctx.strokeStyle = "#064e3b";
      ctx.lineWidth = 4;
      for (let y = -h; y < 0; y += 75) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 4, y);
        ctx.lineTo(w / 2 + 4, y);
        ctx.stroke();
      }
      ctx.restore();
    };

    // Far Bamboo
    for (let x = 20; x <= W; x += 40) {
      drawBamboo(x, 560, 18, 500, "#34d399", "#047857");
    }

    // Pond with Lotus Flowers
    drawWater(ctx, 520, 680, "#059669", "#064e3b");

    // Stepping stones
    for (let i = 0; i < 6; i++) {
      const sx = 350 + i * 60;
      const sy = 600 + Math.sin(i) * 35;
      draw3DSphere(ctx, sx, sy, 32, "#64748b", "#cbd5e1", "#334155");
    }

    // Near Bamboo
    for (let x = 60; x <= W; x += 120) {
      drawBamboo(x, H, 36, 650, "#10b981", "#064e3b");
    }

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "nature-12.jpg");
  }
}

// ----------------------------------------------------
// 2. HOME & ROOMS SCENES (home-5 to home-12)
// ----------------------------------------------------
function renderHomeScenes() {
  // Common cozy room background helper
  const drawCozyRoomBg = (ctx, wallColor1, wallColor2, floorColor1, floorColor2) => {
    // Back wall
    const wall = ctx.createLinearGradient(0, 0, 0, 480);
    wall.addColorStop(0, wallColor1);
    wall.addColorStop(1, wallColor2);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, 480);

    // Hardwood floor
    const floor = ctx.createLinearGradient(0, 480, 0, H);
    floor.addColorStop(0, floorColor1);
    floor.addColorStop(1, floorColor2);
    ctx.fillStyle = floor;
    ctx.fillRect(0, 480, W, H - 480);

    // Baseboard
    ctx.fillStyle = "#78350f";
    ctx.fillRect(0, 470, W, 18);

    // Planks
    ctx.strokeStyle = "rgba(69, 26, 3, 0.25)";
    ctx.lineWidth = 3;
    for (let x = 0; x < W; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 488);
      ctx.lineTo(x - 60, H);
      ctx.stroke();
    }
  };

  // home-5: Masalsı Kitaplık Odası (Fairytale library, curved bookshelves, plush armchair, reading lamp)
  {
    const { canvas, ctx } = createScene();
    drawCozyRoomBg(ctx, "#451a03", "#78350f", "#b45309", "#78350f");

    // Big Wooden Bookshelves
    const drawBookshelf = (bx, by, bw, bh) => {
      ctx.save();
      ctx.fillStyle = "#451a03";
      ctx.fillRect(bx, by, bw, bh);
      // Shelves with books
      for (let sy = by + 20; sy < by + bh - 20; sy += 85) {
        ctx.fillStyle = "#78350f";
        ctx.fillRect(bx, sy + 65, bw, 14);

        const colors = ["#dc2626", "#2563eb", "#16a34a", "#eab308", "#9333ea", "#ea580c"];
        let curX = bx + 10;
        while (curX < bx + bw - 20) {
          const bookW = 16 + Math.random() * 12;
          const bookH = 45 + Math.random() * 18;
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(curX, sy + 65 - bookH, bookW, bookH);
          curX += bookW + 3;
        }
      }
      ctx.restore();
    };

    drawBookshelf(60, 40, 360, 430);
    drawBookshelf(600, 40, 360, 430);

    // Arched Center Window showing starry sky
    ctx.save();
    ctx.fillStyle = "#1e1b4b";
    ctx.beginPath();
    ctx.arc(512, 220, 75, Math.PI, 0);
    ctx.rect(437, 220, 150, 160);
    ctx.fill();
    drawSun(ctx, 512, 190, 25, 60, "#fef08a", "rgba(254, 240, 138, 0.4)");
    ctx.restore();

    // Comfy Velvet Armchair in center
    ctx.save();
    ctx.translate(512, 580);
    // Backrest
    draw3DSphere(ctx, 0, -60, 95, "#991b1b", "#ef4444", "#450a0a");
    // Seat cushion
    draw3DSphere(ctx, 0, 10, 85, "#b91c1c", "#f87171", "#7f1d1d");
    // Armrests
    draw3DSphere(ctx, -90, 0, 40, "#7f1d1d", "#dc2626", "#450a0a");
    draw3DSphere(ctx, 90, 0, 40, "#7f1d1d", "#dc2626", "#450a0a");
    ctx.restore();

    // Warm Reading Floor Lamp
    const drawLamp = (lx, ly) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -220);
      ctx.stroke();
      // Shade
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.moveTo(-45, -200);
      ctx.lineTo(45, -200);
      ctx.lineTo(65, -150);
      ctx.lineTo(-65, -150);
      ctx.closePath();
      ctx.fill();
      // Warm glow
      const lampGlow = ctx.createRadialGradient(0, -150, 10, 0, -150, 200);
      lampGlow.addColorStop(0, "rgba(254, 240, 138, 0.6)");
      lampGlow.addColorStop(1, "rgba(254, 240, 138, 0)");
      ctx.fillStyle = lampGlow;
      ctx.beginPath();
      ctx.arc(0, -150, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawLamp(280, 560);
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "home-5.jpg");
  }

  // home-6: Çatı Katı Resim Atölyesi (Sunlit attic artist studio, easel, canvas, paints)
  {
    const { canvas, ctx } = createScene();
    drawCozyRoomBg(ctx, "#fef3c7", "#fed7aa", "#d97706", "#92400e");

    // Slanted Attic Beams
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(512, 240);
    ctx.lineTo(W, 0);
    ctx.stroke();

    // Big Skylight Window
    ctx.save();
    ctx.fillStyle = "#bae6fd";
    ctx.fillRect(360, 40, 304, 180);
    drawSun(ctx, 512, 130, 40, 140, "#ffffff", "rgba(254, 240, 138, 0.5)");
    drawSunbeams(ctx, 512, 130, 8, 550);
    ctx.restore();

    // Wooden Easel with Colorful Painting
    ctx.save();
    ctx.translate(512, 500);
    // Legs
    ctx.strokeStyle = "#a16207";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, -160);
    ctx.lineTo(-120, 180);
    ctx.moveTo(0, -160);
    ctx.lineTo(120, 180);
    ctx.moveTo(0, -160);
    ctx.lineTo(0, 190);
    ctx.stroke();

    // Canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-100, -110, 200, 150);
    // Rainbow artwork on canvas
    const rColors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
    for (let r = 0; r < rColors.length; r++) {
      ctx.strokeStyle = rColors[r];
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 20, 80 - r * 12, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();

    // Paint jars & wooden stool
    draw3DSphere(ctx, 320, 620, 35, "#3b82f6", "#93c5fd", "#1e3a8a");
    draw3DSphere(ctx, 380, 635, 30, "#ef4444", "#fca5a5", "#991b1b");
    draw3DSphere(ctx, 700, 630, 32, "#eab308", "#fef08a", "#854d0e");

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "home-6.jpg");
  }

  // home-7: Camlı Çiçek Verandası (Glass sunroom greenhouse patio, terracotta pots, sunny floor)
  {
    const { canvas, ctx } = createScene();
    drawCozyRoomBg(ctx, "#ccfbf1", "#99f6e4", "#fed7aa", "#f97316");

    // Glass French arched windows showing garden outside
    ctx.save();
    for (let x = 60; x < W - 100; x += 300) {
      ctx.fillStyle = "#86efac";
      ctx.fillRect(x, 40, 240, 420);
      drawFluffyCloud(ctx, x + 120, 100, 0.6);
      drawCuteFlower(ctx, x + 80, 380, 20, "#ec4899");
      drawCuteFlower(ctx, x + 160, 390, 18, "#f59e0b");

      // White window frames
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 14;
      ctx.strokeRect(x, 40, 240, 420);
    }
    ctx.restore();

    // Terracotta Flower Pots on Veranda
    const drawFlowerPot = (px, py, flowerColor) => {
      ctx.save();
      ctx.translate(px, py);
      // Pot
      const potGrad = ctx.createLinearGradient(-40, 0, 40, 0);
      potGrad.addColorStop(0, "#c2410c");
      potGrad.addColorStop(0.5, "#fb923c");
      potGrad.addColorStop(1, "#7c2d12");
      ctx.fillStyle = potGrad;
      ctx.beginPath();
      ctx.moveTo(-45, -70);
      ctx.lineTo(45, -70);
      ctx.lineTo(32, 20);
      ctx.lineTo(-32, 20);
      ctx.closePath();
      ctx.fill();
      // Lush Plant
      drawCuteFlower(ctx, -20, -100, 22, flowerColor);
      drawCuteFlower(ctx, 20, -110, 24, flowerColor);
      drawCuteFlower(ctx, 0, -135, 26, "#facc15");
      ctx.restore();
    };

    drawFlowerPot(180, 600, "#f43f5e");
    drawFlowerPot(360, 620, "#a855f7");
    drawFlowerPot(660, 615, "#ec4899");
    drawFlowerPot(840, 595, "#3b82f6");

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "home-7.jpg");
  }

  // home-8: Ahşap Masal Ağaç Ev (Treehouse in oak tree, rope ladder, lanterns)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#0284c7", "#38bdf8", "#fed7aa", "#fef08a");
    drawSun(ctx, 800, 160, 60, 240, "#fffbeb", "rgba(254, 240, 138, 0.5)");

    // Giant Oak Tree Trunk
    ctx.save();
    const oakGrad = ctx.createLinearGradient(380, 0, 640, 0);
    oakGrad.addColorStop(0, "#451a03");
    oakGrad.addColorStop(0.5, "#78350f");
    oakGrad.addColorStop(1, "#290d02");
    ctx.fillStyle = oakGrad;
    ctx.beginPath();
    ctx.moveTo(420, H);
    ctx.quadraticCurveTo(450, 450, 420, 200);
    ctx.lineTo(600, 200);
    ctx.quadraticCurveTo(580, 450, 620, H);
    ctx.closePath();
    ctx.fill();

    // Lush Tree Foliage Canopy
    ctx.fillStyle = "#15803d";
    ctx.beginPath();
    ctx.arc(512, 160, 320, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(360, 140, 180, 0, Math.PI * 2);
    ctx.arc(660, 150, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Wooden Treehouse Structure
    ctx.save();
    ctx.translate(512, 380);
    // House
    ctx.fillStyle = "#92400e";
    ctx.fillRect(-150, -120, 300, 160);
    // Roof
    ctx.fillStyle = "#b91c1c";
    ctx.beginPath();
    ctx.moveTo(0, -200);
    ctx.lineTo(-180, -120);
    ctx.lineTo(180, -120);
    ctx.closePath();
    ctx.fill();
    // Warm window
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(-90, -80, 60, 60);
    ctx.fillRect(30, -80, 60, 60);
    // Balcony & Railing
    ctx.fillStyle = "#78350f";
    ctx.fillRect(-160, 30, 320, 20);
    for (let rx = -150; rx <= 150; rx += 30) {
      ctx.fillRect(rx, 10, 8, 25);
    }
    // Rope ladder hanging down
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-100, 50);
    ctx.lineTo(-90, 280);
    ctx.moveTo(-60, 50);
    ctx.lineTo(-50, 280);
    ctx.stroke();
    for (let ry = 70; ry < 270; ry += 35) {
      ctx.beginPath();
      ctx.moveTo(-100, ry);
      ctx.lineTo(-60, ry);
      ctx.stroke();
    }
    ctx.restore();

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "home-8.jpg");
  }

  // home-9: Köpüklü Masal Banyosu (Luxury clawfoot tub, bubbly foam, pastel tiles)
  {
    const { canvas, ctx } = createScene();
    drawCozyRoomBg(ctx, "#e0f2fe", "#bae6fd", "#f8fafc", "#e2e8f0");

    // Pastel tile wall grid
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 3;
    for (let x = 0; x < W; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 0; y < 480; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Classic Clawfoot Bathtub
    ctx.save();
    ctx.translate(512, 540);
    // Golden Tub feet
    draw3DSphere(ctx, -180, 70, 25, "#eab308", "#fef08a", "#a16207");
    draw3DSphere(ctx, 180, 70, 25, "#eab308", "#fef08a", "#a16207");

    // Tub Body
    const tubGrad = ctx.createLinearGradient(0, -60, 0, 70);
    tubGrad.addColorStop(0, "#ffffff");
    tubGrad.addColorStop(0.6, "#f1f5f9");
    tubGrad.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = tubGrad;
    ctx.beginPath();
    ctx.moveTo(-240, -40);
    ctx.quadraticCurveTo(-260, 60, -180, 70);
    ctx.lineTo(180, 70);
    ctx.quadraticCurveTo(260, 60, 240, -40);
    ctx.closePath();
    ctx.fill();

    // Bubbly white foam
    for (let i = 0; i < 28; i++) {
      const bx = -190 + Math.random() * 380;
      const by = -60 + Math.random() * 40;
      const br = 20 + Math.random() * 25;
      draw3DSphere(ctx, bx, by, br, "#ffffff", "#ffffff", "#e2e8f0");
    }

    // Cute Rubber Duck
    draw3DSphere(ctx, 40, -90, 25, "#facc15", "#fef08a", "#ca8a04");
    // Duck bill
    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.ellipse(65, -88, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "home-9.jpg");
  }

  // home-10: Şömineli Sıcak Salon (Fireplace, warm hearth, plush sofa)
  {
    const { canvas, ctx } = createScene();
    drawCozyRoomBg(ctx, "#451a03", "#78350f", "#92400e", "#451a03");

    // Big Brick Fireplace in center
    ctx.save();
    ctx.translate(512, 360);
    // Outer stone mantel
    ctx.fillStyle = "#78350f";
    ctx.fillRect(-180, -140, 360, 260);
    ctx.fillStyle = "#b45309";
    ctx.fillRect(-210, -160, 420, 26);

    // Hearth cavity
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(0, 40, 95, Math.PI, 0);
    ctx.rect(-95, 40, 190, 80);
    ctx.fill();

    // Glowing fire flames
    const fireGrad = ctx.createRadialGradient(0, 80, 10, 0, 80, 100);
    fireGrad.addColorStop(0, "#fffbeb");
    fireGrad.addColorStop(0.3, "#facc15");
    fireGrad.addColorStop(0.7, "#ea580c");
    fireGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(0, 80, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Cozy Plush Sofa
    ctx.save();
    ctx.translate(512, 620);
    draw3DSphere(ctx, -140, 0, 60, "#b91c1c", "#f87171", "#7f1d1d");
    draw3DSphere(ctx, 140, 0, 60, "#b91c1c", "#f87171", "#7f1d1d");
    draw3DSphere(ctx, 0, -20, 90, "#991b1b", "#ef4444", "#450a0a");
    ctx.restore();

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "home-10.jpg");
  }

  // home-11: Güneşli Yemek Odası (Family dining table, fruit bowl, fresh flowers)
  {
    const { canvas, ctx } = createScene();
    drawCozyRoomBg(ctx, "#fef3c7", "#fed7aa", "#ca8a04", "#78350f");

    // Large Sunny French Window
    ctx.save();
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(360, 40, 304, 260);
    drawSun(ctx, 512, 130, 45, 160, "#ffffff", "rgba(254, 240, 138, 0.5)");
    drawSunbeams(ctx, 512, 130, 8, 600);
    ctx.restore();

    // Dining Table
    ctx.save();
    ctx.translate(512, 530);
    // Tabletop
    const table = ctx.createLinearGradient(0, -20, 0, 30);
    table.addColorStop(0, "#b45309");
    table.addColorStop(1, "#78350f");
    ctx.fillStyle = table;
    ctx.beginPath();
    ctx.ellipse(0, 0, 340, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fruit Bowl in Center
    draw3DSphere(ctx, 0, -20, 50, "#ffffff", "#ffffff", "#cbd5e1");
    // Fruits (Apples, Oranges)
    draw3DSphere(ctx, -20, -45, 22, "#ef4444", "#fca5a5", "#991b1b");
    draw3DSphere(ctx, 20, -45, 24, "#f97316", "#fed7aa", "#c2410c");
    draw3DSphere(ctx, 0, -60, 20, "#eab308", "#fef08a", "#a16207");

    ctx.restore();
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "home-11.jpg");
  }

  // home-12: Renkli Oyun Çadırı (Play tent, string fairy lights, cushions)
  {
    const { canvas, ctx } = createScene();
    drawCozyRoomBg(ctx, "#ede9fe", "#ddd6fe", "#fbbf24", "#d97706");

    // Play Teepee Tent in Center
    ctx.save();
    ctx.translate(512, 450);
    // Wooden poles
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(-160, 180);
    ctx.lineTo(20, -260);
    ctx.moveTo(160, 180);
    ctx.lineTo(-20, -260);
    ctx.stroke();

    // Canvas fabric
    const tent = ctx.createLinearGradient(-180, 0, 180, 0);
    tent.addColorStop(0, "#f472b6");
    tent.addColorStop(0.5, "#fbcfe8");
    tent.addColorStop(1, "#ec4899");
    ctx.fillStyle = tent;
    ctx.beginPath();
    ctx.moveTo(0, -230);
    ctx.lineTo(-200, 180);
    ctx.lineTo(200, 180);
    ctx.closePath();
    ctx.fill();

    // Tent door opening
    ctx.fillStyle = "#831843";
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(-90, 180);
    ctx.lineTo(90, 180);
    ctx.closePath();
    ctx.fill();

    // Glowing fairy lights string
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-180, 60);
    ctx.quadraticCurveTo(0, 140, 180, 60);
    ctx.stroke();

    for (let i = 0; i < 9; i++) {
      const lx = -150 + i * 38;
      const ly = 75 + Math.sin((i / 8) * Math.PI) * 45;
      draw3DSphere(ctx, lx, ly, 10, "#fef08a", "#ffffff", "#eab308");
    }

    ctx.restore();
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "home-12.jpg");
  }
}

// ----------------------------------------------------
// 3. SCHOOL SCENES (school-4 to school-12)
// ----------------------------------------------------
function renderSchoolScenes() {
  const drawClassroomBg = (
    ctx,
    wall1 = "#fef3c7",
    wall2 = "#fed7aa",
    floor1 = "#e2e8f0",
    floor2 = "#94a3b8",
  ) => {
    const wall = ctx.createLinearGradient(0, 0, 0, 480);
    wall.addColorStop(0, wall1);
    wall.addColorStop(1, wall2);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, 480);

    const floor = ctx.createLinearGradient(0, 480, 0, H);
    floor.addColorStop(0, floor1);
    floor.addColorStop(1, floor2);
    ctx.fillStyle = floor;
    ctx.fillRect(0, 480, W, H - 480);
  };

  // school-4: Büyük Okul Kütüphanesi (Grand school library, arched windows, globe)
  {
    const { canvas, ctx } = createScene();
    drawClassroomBg(ctx, "#451a03", "#78350f", "#b45309", "#78350f");

    // Arched Windows
    for (let x = 120; x < W - 100; x += 320) {
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(x + 100, 160, 80, Math.PI, 0);
      ctx.rect(x + 20, 160, 160, 240);
      ctx.fill();
      drawSun(ctx, x + 100, 140, 25, 60, "#fef08a", "rgba(254, 240, 138, 0.4)");
    }

    // Giant Globe on Stand
    ctx.save();
    ctx.translate(512, 530);
    draw3DSphere(ctx, 0, -80, 85, "#0284c7", "#38bdf8", "#0f172a");
    // Brass stand
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, -80, 105, -Math.PI * 0.4, Math.PI * 0.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 25);
    ctx.lineTo(0, 95);
    ctx.stroke();
    ctx.restore();

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "school-4.jpg");
  }

  // school-5: Fen ve Deney Laboratuvarı (Science lab, bubbling colorful flasks, microscope)
  {
    const { canvas, ctx } = createScene();
    drawClassroomBg(ctx, "#e0f2fe", "#bae6fd", "#475569", "#1e293b");

    // Lab Table
    ctx.fillStyle = "#334155";
    ctx.fillRect(100, 480, 824, 60);

    // Beakers & Flasks with colorful chemicals
    const drawFlask = (fx, fy, liquidColor) => {
      ctx.save();
      ctx.translate(fx, fy);
      // Flask shape
      ctx.fillStyle = liquidColor;
      ctx.beginPath();
      ctx.moveTo(-15, -90);
      ctx.lineTo(15, -90);
      ctx.lineTo(15, -50);
      ctx.lineTo(55, 30);
      ctx.lineTo(-55, 30);
      ctx.lineTo(-15, -50);
      ctx.closePath();
      ctx.fill();
      // Bubbles
      draw3DSphere(ctx, -10, -10, 12, "#ffffff", "#ffffff", liquidColor);
      draw3DSphere(ctx, 15, -30, 8, "#ffffff", "#ffffff", liquidColor);
      ctx.restore();
    };

    drawFlask(320, 450, "#10b981");
    drawFlask(480, 450, "#ec4899");
    drawFlask(640, 450, "#3b82f6");

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "school-5.jpg");
  }

  // school-6: Anaokulu Blok Sınıfı (Building blocks, alphabet rug, colorful toys)
  {
    const { canvas, ctx } = createScene();
    drawClassroomBg(ctx, "#fef3c7", "#fef08a", "#fed7aa", "#f97316");

    // Colorful 3D Wooden Blocks
    const drawBlock = (bx, by, size, color) => {
      draw3DSphere(ctx, bx, by, size, color, "#ffffff", "#1e293b");
    };

    drawBlock(420, 560, 55, "#ef4444");
    drawBlock(520, 550, 60, "#3b82f6");
    drawBlock(620, 565, 50, "#10b981");
    drawBlock(470, 460, 55, "#f59e0b");
    drawBlock(570, 455, 50, "#8b5cf6");
    drawBlock(520, 360, 45, "#ec4899");

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "school-6.jpg");
  }

  // school-7: Okul Spor Salonu (Basketball gym, polished floor, hoops, colorful balls)
  {
    const { canvas, ctx } = createScene();
    drawClassroomBg(ctx, "#1e3a8a", "#2563eb", "#ca8a04", "#78350f");

    // Basketball Hoop
    ctx.save();
    ctx.translate(512, 280);
    // Backboard
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-120, -90, 240, 160);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 10;
    ctx.strokeRect(-120, -90, 240, 160);
    // Rim & Net
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 70, 50, 0, Math.PI);
    ctx.stroke();
    ctx.restore();

    // Basketball on floor
    draw3DSphere(ctx, 420, 620, 45, "#ea580c", "#fed7aa", "#7c2d12");
    // Soccer ball
    draw3DSphere(ctx, 600, 625, 42, "#ffffff", "#ffffff", "#0f172a");

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "school-7.jpg");
  }

  // school-8: Renkli Okul Koridoru (Lockers, bulletin boards, checkered floor)
  {
    const { canvas, ctx } = createScene();
    drawClassroomBg(ctx, "#f1f5f9", "#cbd5e1", "#334155", "#0f172a");

    // Rows of colorful lockers
    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
    for (let i = 0; i < 10; i++) {
      const lx = 60 + i * 90;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(lx, 140, 80, 320);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(lx + 15, 200, 50, 12);
      draw3DSphere(ctx, lx + 65, 300, 8, "#ca8a04");
    }

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "school-8.jpg");
  }

  // school-9: Güneşli Okul Yemekhanesi (Cafeteria, lunch tables, trays, apples)
  {
    const { canvas, ctx } = createScene();
    drawClassroomBg(ctx, "#fef3c7", "#fed7aa", "#f8fafc", "#cbd5e1");

    // Cafeteria Table
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(150, 480, 724, 50);

    // Lunch Trays with apples and milk cartons
    for (let i = 0; i < 3; i++) {
      const tx = 280 + i * 220;
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(tx - 60, 430, 120, 45);
      draw3DSphere(ctx, tx - 25, 420, 22, "#ef4444", "#fca5a5", "#991b1b");
      // Milk carton
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(tx + 15, 395, 30, 50);
    }

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "school-9.jpg");
  }

  // school-10: Tiyatro ve Gösteri Sahnesi (Auditorium stage, velvet red curtains, spotlights)
  {
    const { canvas, ctx } = createScene();
    drawClassroomBg(ctx, "#0f172a", "#1e1b4b", "#78350f", "#451a03");

    // Spotlights
    drawSunbeams(ctx, 200, 40, 5, 750);
    drawSunbeams(ctx, 824, 40, 5, 750);

    // Red Velvet Curtains
    const drawCurtain = (isLeft) => {
      ctx.save();
      const cx = isLeft ? 0 : W;
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#dc2626");
      grad.addColorStop(1, "#7f1d1d");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      if (isLeft) {
        ctx.lineTo(240, 0);
        ctx.quadraticCurveTo(120, 300, 200, H);
        ctx.lineTo(0, H);
      } else {
        ctx.lineTo(W - 240, 0);
        ctx.quadraticCurveTo(W - 120, 300, W - 200, H);
        ctx.lineTo(W, H);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawCurtain(true);
    drawCurtain(false);

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "school-10.jpg");
  }

  // school-11: Okul Bahçesi ve Çan Kulesi (Courtyard, clock tower, bell, lawns)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#0284c7", "#38bdf8", "#bae6fd", "#fef08a");
    drawSun(ctx, 240, 160, 60, 220, "#fffbeb", "rgba(254, 240, 138, 0.5)");

    // Brick Clock/Bell Tower
    ctx.save();
    ctx.translate(680, 200);
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(-80, 0, 160, 450);
    // Roof
    ctx.fillStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.moveTo(0, -90);
    ctx.lineTo(-100, 0);
    ctx.lineTo(100, 0);
    ctx.closePath();
    ctx.fill();
    // Clock
    draw3DSphere(ctx, 0, 80, 40, "#ffffff", "#ffffff", "#e2e8f0");
    ctx.restore();

    // Lawn
    drawRollingHill(ctx, 580, 30, "#4ade80", "#15803d");

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "school-11.jpg");
  }

  // school-12: Matematik ve Yazı Tahtası (Chalkboard with math, formulas, ruler, books)
  {
    const { canvas, ctx } = createScene();
    drawClassroomBg(ctx, "#fef3c7", "#fed7aa", "#b45309", "#78350f");

    // Giant Green Chalkboard in center
    ctx.save();
    ctx.translate(512, 320);
    // Wooden frame
    ctx.fillStyle = "#78350f";
    ctx.fillRect(-380, -180, 760, 360);
    // Green board
    ctx.fillStyle = "#14532d";
    ctx.fillRect(-360, -160, 720, 320);

    // Chalk writings: A B C, 1 2 3, geometry
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("1 + 2 = 3", -180, -60);
    ctx.fillText("A  B  C", 180, -60);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("⭐ 2 × 2 = 4 ⭐", 0, 40);

    ctx.restore();
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "school-12.jpg");
  }
}

// ----------------------------------------------------
// 4. PARK SCENES (park-4 to park-12)
// ----------------------------------------------------
function renderParkScenes() {
  const drawParkBg = (ctx, sky1 = "#0284c7", sky2 = "#38bdf8", sunX = 750, sunY = 160) => {
    drawSky(ctx, sky1, sky2, "#bae6fd", "#fef08a");
    drawSun(ctx, sunX, sunY, 60, 240, "#fffbeb", "rgba(254, 240, 138, 0.5)");
    drawSunbeams(ctx, sunX, sunY, 8, 750);
    drawRollingHill(ctx, 480, 40, "#4ade80", "#166534");
    drawRollingHill(ctx, 560, 45, "#22c55e", "#15803d");
  };

  // park-4: Dev Sarmal Kaydırak Kulesi (Spiral tube slide, tower, playground)
  {
    const { canvas, ctx } = createScene();
    drawParkBg(ctx);

    // Playground Slide Tower
    ctx.save();
    ctx.translate(512, 450);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-80, -220, 160, 260);
    // Conical Roof
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.moveTo(0, -320);
    ctx.lineTo(-100, -220);
    ctx.lineTo(100, -220);
    ctx.closePath();
    ctx.fill();

    // Spiral Tube Slide (Yellow/Orange curves)
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 42;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(60, -140);
    ctx.bezierCurveTo(180, -60, -180, 40, 140, 160);
    ctx.stroke();

    ctx.restore();
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "park-4.jpg");
  }

  // park-5: Ahşap Park Salıncakları (Wooden swing set, green lawn, flowers)
  {
    const { canvas, ctx } = createScene();
    drawParkBg(ctx);

    // Wooden A-Frame Swing Set
    ctx.save();
    ctx.translate(512, 480);
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 22;
    // Left A
    ctx.beginPath();
    ctx.moveTo(-220, 160);
    ctx.lineTo(-140, -140);
    ctx.lineTo(-60, 160);
    ctx.stroke();
    // Right A
    ctx.beginPath();
    ctx.moveTo(60, 160);
    ctx.lineTo(140, -140);
    ctx.lineTo(220, 160);
    ctx.stroke();
    // Top Beam
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(-200, -140);
    ctx.lineTo(200, -140);
    ctx.stroke();

    // Swings
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-40, -140);
    ctx.lineTo(-40, 40);
    ctx.moveTo(20, -140);
    ctx.lineTo(20, 40);
    ctx.stroke();
    // Swing Seat
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-50, 40, 80, 14);

    ctx.restore();
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "park-5.jpg");
  }

  // park-6: Kum Havuzu ve Kale (Sandbox, sandcastle, plastic buckets and shovels)
  {
    const { canvas, ctx } = createScene();
    drawParkBg(ctx);

    // Wooden Sandbox
    ctx.save();
    ctx.translate(512, 560);
    ctx.fillStyle = "#b45309";
    ctx.fillRect(-320, -70, 640, 160);
    // Sand
    ctx.fillStyle = "#fde047";
    ctx.fillRect(-300, -50, 600, 120);

    // Sandcastle in Center
    ctx.fillStyle = "#eab308";
    ctx.fillRect(-70, -110, 140, 70);
    // Towers
    ctx.fillRect(-90, -150, 40, 90);
    ctx.fillRect(50, -150, 40, 90);
    // Flags
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(-70, -165);
    ctx.lineTo(-40, -155);
    ctx.lineTo(-70, -145);
    ctx.fill();

    // Colorful buckets & shovels
    draw3DSphere(ctx, -180, -10, 30, "#3b82f6", "#93c5fd", "#1e3a8a");
    draw3DSphere(ctx, 190, 0, 32, "#ec4899", "#fbcfe8", "#9d174d");

    ctx.restore();
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "park-6.jpg");
  }

  // park-7: Çarpışan Arabalar Pisti (Bumper cars, colorful glossy arena)
  {
    const { canvas, ctx } = createScene();
    drawParkBg(ctx, "#1e1b4b", "#4338ca", 512, 140);

    // Glossy Track Floor
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(100, 420, 824, 280);

    // Bumper Cars
    const drawBumperCar = (bx, by, carColor) => {
      ctx.save();
      ctx.translate(bx, by);
      // Rubber bumper
      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.ellipse(0, 20, 75, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      // Car body
      draw3DSphere(ctx, 0, 0, 50, carColor);
      // Pole to ceiling
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -220);
      ctx.stroke();
      ctx.restore();
    };

    drawBumperCar(300, 560, "#ef4444");
    drawBumperCar(512, 540, "#3b82f6");
    drawBumperCar(720, 570, "#eab308");

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "park-7.jpg");
  }

  // park-8: Macera Halat Parkuru (Treetop adventure, suspension bridge)
  {
    const { canvas, ctx } = createScene();
    drawParkBg(ctx);

    // Trees & Rope Suspension Bridge
    ctx.save();
    ctx.translate(512, 380);
    // Wooden planks hanging on ropes
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-380, -40);
    ctx.quadraticCurveTo(0, 80, 380, -40);
    ctx.stroke();
    // Planks
    for (let x = -320; x <= 320; x += 35) {
      const py = (x * x) / 2400;
      ctx.fillStyle = "#b45309";
      ctx.fillRect(x - 12, py, 24, 12);
    }
    ctx.restore();

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "park-8.jpg");
  }

  // park-9: Zıplama Trambolini (Bouncy trampoline with safety net, park trees)
  {
    const { canvas, ctx } = createScene();
    drawParkBg(ctx);

    // Trampoline
    ctx.save();
    ctx.translate(512, 520);
    // Net
    ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
    ctx.fillRect(-220, -180, 440, 180);
    // Poles
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 8;
    for (let x = -220; x <= 220; x += 110) {
      ctx.beginPath();
      ctx.moveTo(x, -180);
      ctx.lineTo(x, 40);
      ctx.stroke();
    }
    // Bouncy mat
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 240, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "park-9.jpg");
  }

  // park-10: Dondurma ve Pamuk Şeker Arabası (Vintage striped cart, waffle cones)
  {
    const { canvas, ctx } = createScene();
    drawParkBg(ctx);

    // Cute Ice Cream Cart
    ctx.save();
    ctx.translate(512, 500);
    // Body
    ctx.fillStyle = "#f472b6";
    ctx.fillRect(-160, -80, 320, 140);
    // Striped Canopy
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-180, -180, 360, 45);
    // Big Wheels
    draw3DSphere(ctx, -120, 70, 38, "#ca8a04");
    draw3DSphere(ctx, 120, 70, 38, "#ca8a04");

    // Big Giant Ice Cream Cone on Top
    draw3DSphere(ctx, 0, -220, 40, "#f43f5e", "#fecdd3", "#9f1239");
    draw3DSphere(ctx, 0, -265, 34, "#38bdf8", "#bae6fd", "#0369a1");

    ctx.restore();
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "park-10.jpg");
  }

  // park-11: Lunapark Mini Treni (Cartoon locomotive, passenger cars)
  {
    const { canvas, ctx } = createScene();
    drawParkBg(ctx);

    // Cute Train on tracks
    ctx.save();
    ctx.translate(512, 540);
    // Engine
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-220, -100, 180, 120);
    // Cabin
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(-90, -140, 100, 160);
    // Wheels
    for (let x = -200; x <= 0; x += 60) {
      draw3DSphere(ctx, x, 30, 24, "#eab308");
    }
    // Passenger wagon
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(40, -90, 160, 110);
    draw3DSphere(ctx, 80, 30, 24, "#eab308");
    draw3DSphere(ctx, 160, 30, 24, "#eab308");

    ctx.restore();
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "park-11.jpg");
  }

  // park-12: Uçurtma Tepesi (Grassy hilltop, flying colorful kites in blue sky)
  {
    const { canvas, ctx } = createScene();
    drawParkBg(ctx, "#0284c7", "#38bdf8", 780, 140);

    // Colorful Kites Soaring
    const drawKite = (kx, ky, color) => {
      ctx.save();
      ctx.translate(kx, ky);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(45, 0);
      ctx.lineTo(0, 60);
      ctx.lineTo(-45, 0);
      ctx.closePath();
      ctx.fill();
      // String
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 60);
      ctx.quadraticCurveTo(30, 140, 0, 220);
      ctx.stroke();
      ctx.restore();
    };

    drawKite(280, 200, "#ef4444");
    drawKite(520, 140, "#f59e0b");
    drawKite(760, 240, "#8b5cf6");

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "park-12.jpg");
  }
}

// ----------------------------------------------------
// 5. GARDEN SCENES (garden-4 to garden-12)
// ----------------------------------------------------
function renderGardenScenes() {
  const drawGardenBg = (ctx, sunX = 750, sunY = 160) => {
    drawSky(ctx, "#0284c7", "#38bdf8", "#bae6fd", "#fef08a");
    drawSun(ctx, sunX, sunY, 60, 240, "#fffbeb", "rgba(254, 240, 138, 0.5)");
    drawSunbeams(ctx, sunX, sunY, 8, 750);
    drawRollingHill(ctx, 480, 40, "#4ade80", "#166534");
    drawRollingHill(ctx, 560, 45, "#22c55e", "#15803d");
  };

  // garden-4: Cam Çiçek Serası (Victorian glass greenhouse, blooming exotic plants)
  {
    const { canvas, ctx } = createScene();
    drawGardenBg(ctx);

    // Glass Greenhouse
    ctx.save();
    ctx.translate(512, 420);
    ctx.fillStyle = "rgba(186, 230, 253, 0.75)";
    ctx.fillRect(-260, -120, 520, 220);
    // Glass Dome Roof
    ctx.beginPath();
    ctx.arc(0, -120, 260, Math.PI, 0);
    ctx.fill();
    // Iron ribs
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 10;
    ctx.strokeRect(-260, -120, 520, 220);
    ctx.beginPath();
    ctx.arc(0, -120, 260, Math.PI, 0);
    ctx.stroke();

    ctx.restore();
    applyFinishingTouches(ctx, true);
    saveScene(canvas, "garden-4.jpg");
  }

  // garden-5: Gül Kemeri ve Çardak (Arched trellis with roses, white gazebo)
  {
    const { canvas, ctx } = createScene();
    drawGardenBg(ctx);

    // Arch Trellis covered with red roses
    ctx.save();
    ctx.translate(512, 460);
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 36;
    ctx.beginPath();
    ctx.arc(0, 0, 220, Math.PI, 0);
    ctx.stroke();

    // Red and pink blooming roses on arch
    for (let a = Math.PI; a <= Math.PI * 2; a += 0.25) {
      const rx = Math.cos(a) * 220;
      const ry = Math.sin(a) * 220;
      draw3DSphere(ctx, rx, ry, 22, a % 0.5 === 0 ? "#ef4444" : "#ec4899");
    }
    ctx.restore();

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "garden-5.jpg");
  }

  // garden-6: Çiçekli Taş Yürüyüş Yolu (Winding stone path, lavender borders)
  {
    const { canvas, ctx } = createScene();
    drawGardenBg(ctx);

    // Winding Flagstone Path
    ctx.save();
    const pathGrad = ctx.createLinearGradient(0, 480, 0, H);
    pathGrad.addColorStop(0, "#94a3b8");
    pathGrad.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = pathGrad;

    ctx.beginPath();
    ctx.moveTo(480, 480);
    ctx.quadraticCurveTo(420, 600, 240, H);
    ctx.lineTo(680, H);
    ctx.quadraticCurveTo(560, 600, 540, 480);
    ctx.closePath();
    ctx.fill();

    // Lavender bushes flanking path
    for (let i = 0; i < 30; i++) {
      const lx = 60 + Math.random() * 220;
      const ly = 540 + Math.random() * 180;
      draw3DSphere(ctx, lx, ly, 18 + Math.random() * 12, "#a855f7", "#e9d5ff", "#6b21a8");
    }
    for (let i = 0; i < 30; i++) {
      const rx = 740 + Math.random() * 220;
      const ry = 540 + Math.random() * 180;
      draw3DSphere(ctx, rx, ry, 18 + Math.random() * 12, "#a855f7", "#e9d5ff", "#6b21a8");
    }
    ctx.restore();

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "garden-6.jpg");
  }

  // garden-7: Kırmızı Elma Bahçesi (Apple orchard, trees heavy with red apples, crates)
  {
    const { canvas, ctx } = createScene();
    drawGardenBg(ctx);

    // Apple Trees
    const drawAppleTree = (tx, ty) => {
      ctx.save();
      ctx.translate(tx, ty);
      // Trunk
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-25, -60, 50, 160);
      // Foliage
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.arc(0, -120, 130, 0, Math.PI * 2);
      ctx.fill();
      // Ripe Red Apples
      for (let i = 0; i < 14; i++) {
        const ax = -80 + Math.random() * 160;
        const ay = -190 + Math.random() * 130;
        draw3DSphere(ctx, ax, ay, 15, "#ef4444", "#fca5a5", "#991b1b");
      }
      ctx.restore();
    };

    drawAppleTree(260, 480);
    drawAppleTree(760, 490);

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "garden-7.jpg");
  }

  // garden-8: Mor Lavanta Tarlası (Endless neat rows of lavender, sunset)
  {
    const { canvas, ctx } = createScene();
    drawSky(ctx, "#581c87", "#c026d3", "#f97316", "#fde047");
    drawSun(ctx, 512, 280, 55, 240, "#fffbeb", "rgba(251, 146, 60, 0.5)");

    // Perspective rows of purple lavender bushes
    ctx.save();
    for (let x = -200; x <= W + 200; x += 120) {
      const grad = ctx.createLinearGradient(x, 420, x, H);
      grad.addColorStop(0, "#9333ea");
      grad.addColorStop(1, "#581c87");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(512, 380);
      ctx.lineTo(x, H);
      ctx.lineTo(x + 70, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "garden-8.jpg");
  }

  // garden-9: Nilüferli Su Bahçesi (Lotus pond, lily pads, arched footbridge)
  {
    const { canvas, ctx } = createScene();
    drawGardenBg(ctx);

    // Pond
    drawWater(ctx, 480, 720, "#0284c7", "#065f46");

    // Arched Wooden Bridge
    ctx.save();
    ctx.translate(512, 500);
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.arc(0, 0, 320, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.restore();

    // Floating Lotus Flowers
    for (let i = 0; i < 12; i++) {
      const lx = 200 + Math.random() * 624;
      const ly = 540 + Math.random() * 140;
      // Lily pad
      ctx.fillStyle = "#16a34a";
      ctx.beginPath();
      ctx.ellipse(lx, ly, 35, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Lotus
      draw3DSphere(ctx, lx, ly - 10, 16, "#ec4899", "#fbcfe8", "#9d174d");
    }

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "garden-9.jpg");
  }

  // garden-10: Balkabağı Bostanı (Plump orange pumpkins, vines, sunflowers)
  {
    const { canvas, ctx } = createScene();
    drawGardenBg(ctx, 750, 180);

    // Plump 3D Pumpkins in patch
    const drawPumpkin = (px, py, r) => {
      ctx.save();
      ctx.translate(px, py);
      // Body segments
      draw3DSphere(ctx, -r * 0.45, 0, r * 0.7, "#f97316", "#fdba74", "#c2410c");
      draw3DSphere(ctx, r * 0.45, 0, r * 0.7, "#f97316", "#fdba74", "#c2410c");
      draw3DSphere(ctx, 0, 0, r * 0.85, "#ea580c", "#fed7aa", "#9a3412");
      // Green stem
      ctx.fillStyle = "#15803d";
      ctx.fillRect(-8, -r * 0.95, 16, 24);
      ctx.restore();
    };

    drawPumpkin(280, 620, 55);
    drawPumpkin(512, 635, 75);
    drawPumpkin(740, 610, 60);

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "garden-10.jpg");
  }

  // garden-11: Ahşap Bahçe Kulübesi (Rustic potting shed, ivy, clay pots)
  {
    const { canvas, ctx } = createScene();
    drawGardenBg(ctx);

    // Rustic Shed in Center
    ctx.save();
    ctx.translate(512, 460);
    ctx.fillStyle = "#78350f";
    ctx.fillRect(-180, -120, 360, 200);
    // Roof
    ctx.fillStyle = "#15803d";
    ctx.beginPath();
    ctx.moveTo(0, -210);
    ctx.lineTo(-210, -120);
    ctx.lineTo(210, -120);
    ctx.closePath();
    ctx.fill();
    // Warm Window
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(-120, -70, 70, 70);
    ctx.fillRect(50, -70, 70, 70);
    ctx.restore();

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "garden-11.jpg");
  }

  // garden-12: Rengarenk Lale Bahçesi (Stripes of yellow, red, pink, orange tulips)
  {
    const { canvas, ctx } = createScene();
    drawGardenBg(ctx);

    // Colorful Rows of Tulips
    const tColors = ["#ef4444", "#f59e0b", "#ec4899", "#8b5cf6", "#facc15"];
    for (let row = 0; row < 5; row++) {
      const ry = 510 + row * 45;
      const col = tColors[row % tColors.length];
      for (let x = 40; x <= W - 40; x += 35) {
        draw3DSphere(ctx, x + (row % 2) * 15, ry, 14, col, "#ffffff", "#451a03");
      }
    }

    applyFinishingTouches(ctx, true);
    saveScene(canvas, "garden-12.jpg");
  }
}

// ----------------------------------------------------
// RUN ALL GENERATORS
// ----------------------------------------------------
console.log("Starting 3D Pixar-style scene generation...");
renderNatureScenes();
renderHomeScenes();
renderSchoolScenes();
renderParkScenes();
renderGardenScenes();
console.log("All 43 scenes rendered successfully!");
