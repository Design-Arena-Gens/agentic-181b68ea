'use client';

import { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function choose<T>(arr: T[]): T {
  return arr[(Math.random() * arr.length) | 0];
}

function setCanvasSize(canvas: HTMLCanvasElement) {
  const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawMountain(ctx: CanvasRenderingContext2D, baseY: number, color: string, jagged = 0.6) {
  const { width } = ctx.canvas;
  const step = 60;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  let x = 0;
  while (x <= width) {
    const peak = baseY - rand(60, 180) * jagged;
    ctx.lineTo(x + rand(20, step), peak);
    x += step;
  }
  ctx.lineTo(width + 40, baseY + 40);
  ctx.lineTo(-40, baseY + 40);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawFog(ctx: CanvasRenderingContext2D, y: number, opacity: number) {
  const g = ctx.createLinearGradient(0, y - 60, 0, y + 100);
  g.addColorStop(0, `rgba(200,220,255,${opacity * 0.0})`);
  g.addColorStop(1, `rgba(200,220,255,${opacity})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 60, ctx.canvas.width, 180);
}

function drawTreeBeautiful(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  height: number,
  hue: number
) {
  // Trunk
  ctx.fillStyle = `hsl(${hue}, 25%, 25%)`;
  ctx.fillRect(x - height * 0.03, baseY - height * 0.2, height * 0.06, height * 0.2);

  // Foliage (layered triangles)
  const layers = 4 + (Math.random() * 3) | 0;
  for (let i = 0; i < layers; i++) {
    const layerH = height * (0.18 + i * 0.2);
    const layerW = height * (0.12 + i * 0.18);
    ctx.beginPath();
    ctx.moveTo(x, baseY - layerH);
    ctx.lineTo(x - layerW, baseY - layerH * 0.2);
    ctx.lineTo(x + layerW, baseY - layerH * 0.2);
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue}, 45%, ${clamp(22 + i * 8, 20, 55)}%)`;
    ctx.fill();
  }
}

function drawTreeUgly(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  height: number
) {
  // Intentional visual clash: skewed polygon, odd colors
  ctx.save();
  ctx.translate(x, baseY);
  ctx.rotate(rand(-0.15, 0.15));
  ctx.beginPath();
  const spikes = 5 + ((Math.random() * 5) | 0);
  for (let i = 0; i < spikes; i++) {
    const ang = (i / spikes) * TAU;
    const r = height * (0.08 + Math.sin(i * 2.2) * 0.07 + Math.random() * 0.1);
    const px = Math.cos(ang) * r * (i % 2 === 0 ? 1.6 : 0.9);
    const py = -height * 0.4 - Math.sin(ang) * r * 0.6;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = choose([
    'hsl(320,85%,60%)', // too pink
    'hsl(190,85%,60%)', // too cyan
    'hsl(60,90%,60%)',  // too lemon
    'hsl(0,90%,60%)',   // too red
  ]);
  ctx.shadowColor = 'rgba(255,255,255,0.35)';
  ctx.shadowBlur = 8;
  ctx.fill();

  // Off-color trunk
  ctx.shadowBlur = 0;
  ctx.fillStyle = choose(['#6a2c70', '#264653', '#c44536']);
  ctx.fillRect(-height * 0.03, -height * 0.2, height * 0.06, height * 0.22);
  ctx.restore();
}

export default function ForestCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = setCanvasSize(canvas);

    function onResize() {
      setCanvasSize(canvas);
      draw(0);
    }

    let raf = 0;
    let t0 = performance.now();

    // Pre-generate tree positions for consistency across frames
    const niceTreeCount = 160;
    const uglyTreeCount = 10 + ((Math.random() * 6) | 0);
    const niceTrees: { x: number; y: number; h: number; hue: number; sway: number }[] = [];
    const uglyTrees: { x: number; y: number; h: number; sway: number }[] = [];

    function regenerate() {
      niceTrees.length = 0;
      uglyTrees.length = 0;
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;

      // Distribute trees with depth-based y
      for (let i = 0; i < niceTreeCount; i++) {
        const depth = Math.random();
        const baseY = h * (0.45 + depth * 0.5) + rand(-6, 6);
        const height = 40 + depth * 90 + rand(-6, 10);
        const hue = 130 + depth * 30 + rand(-6, 6); // greens
        const sway = rand(0.2, 0.6);
        niceTrees.push({ x: rand(-40, w + 40), y: baseY, h: height, hue, sway });
      }

      for (let i = 0; i < uglyTreeCount; i++) {
        const depth = Math.random();
        const baseY = h * (0.5 + depth * 0.48) + rand(-8, 8);
        const height = 60 + depth * 110 + rand(-10, 14);
        const sway = rand(0.1, 0.5);
        uglyTrees.push({ x: rand(-40, w + 40), y: baseY, h: height, sway });
      }
    }

    regenerate();

    function draw(time: number) {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#0b1020');
      sky.addColorStop(0.4, '#111a2e');
      sky.addColorStop(1, '#0a120f');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 73.7) % width) + (i % 2 ? 0.5 : -0.5);
        const sy = (i * 91.3) % (height * 0.4);
        ctx.globalAlpha = (Math.sin(time * 0.0015 + i) + 1.5) / 3.5;
        ctx.fillRect(sx, sy, 1, 1);
      }
      ctx.globalAlpha = 1;

      // Mountains
      drawMountain(ctx, height * 0.62, '#0e1a2d', 0.55);
      drawMountain(ctx, height * 0.70, '#0b1526', 0.8);

      // Ground gradient
      const ground = ctx.createLinearGradient(0, height * 0.55, 0, height);
      ground.addColorStop(0, '#0b1714');
      ground.addColorStop(1, '#0a0f0d');
      ctx.fillStyle = ground;
      ctx.fillRect(0, height * 0.55, width, height * 0.45);

      // Fog layers
      drawFog(ctx, height * 0.62, 0.08);
      drawFog(ctx, height * 0.72, 0.12);
      drawFog(ctx, height * 0.82, 0.16);

      // Parallax sway
      const elapsed = (time - t0) * 0.001;

      // Draw nice trees (back to front by y)
      niceTrees.sort((a, b) => a.y - b.y);
      for (const tr of niceTrees) {
        const dx = Math.sin(elapsed * tr.sway + tr.x * 0.01) * 2;
        drawTreeBeautiful(ctx, tr.x + dx, tr.y, tr.h, tr.hue);
      }

      // Draw ugly trees sparse and slightly foregrounded
      uglyTrees.sort((a, b) => a.y - b.y);
      for (const tr of uglyTrees) {
        const dx = Math.sin(elapsed * tr.sway + tr.x * 0.02) * 3;
        drawTreeUgly(ctx, tr.x + dx, tr.y, tr.h);
      }

      raf = requestAnimationFrame(draw);
    }

    function handleResize() {
      onResize();
      regenerate();
    }

    window.addEventListener('resize', handleResize);
    onResize();
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 72px)' }}>
      <canvas
        ref={ref}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          imageRendering: 'crisp-edges',
        }}
      />
    </div>
  );
}
