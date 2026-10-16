import { useEffect } from 'react';
import './CursorEffects.css';

// Independently written spring-chain trail; no React Bits Pro source or license.
export default function CursorEffects() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canvas = document.createElement('canvas');
    canvas.className = 'cursor-effects';
    canvas.dataset.effect = 'smooth-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }
    const color = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#a4a2ff';
    let width = 1, height = 1, raf = 0, last = 0, lastMove = 0, enabled = fine.matches;
    let targetX = 0, targetY = 0, speed = 0, points = [];
    const clear = () => ctx.clearRect(0, 0, width, height);
    const stop = () => {
      cancelAnimationFrame(raf); raf = 0; last = 0; points = []; speed = 0;
      canvas.dataset.active = 'false'; clear();
    };
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); stop();
    };
    const draw = now => {
      raf = 0;
      if (!enabled || document.hidden || !points.length) return;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const rest = now - lastMove;
      const alpha = Math.max(0, 1 - Math.max(0, rest - 120) / (reduced.matches ? 220 : 900));
      clear();
      if (alpha <= 0) { stop(); return; }
      if (reduced.matches) {
        // Keep a visible but short trail without spring overshoot or glow.
        const follow = 1 - Math.exp(-dt * 100);
        points.forEach((point, i) => {
          const target = i ? points[i - 1] : { x: targetX, y: targetY };
          point.x += (target.x - point.x) * follow;
          point.y += (target.y - point.y) * follow;
        });
      } else {
        const steps = Math.max(1, Math.ceil(dt * 120));
        const step = dt * 60 / steps;
        for (let tick = 0; tick < steps; tick++) {
          points.forEach((point, i) => {
            const target = i ? points[i - 1] : { x: targetX, y: targetY };
            point.vx += (target.x - point.x) * .7 * step;
            point.vy += (target.y - point.y) * .7 * step;
            const friction = Math.pow(.42, step);
            point.vx *= friction; point.vy *= friction;
            point.x += point.vx * step; point.y += point.vy * step;
          });
        }
      }
      const path = [{ x: targetX, y: targetY }, ...points];
      const thickness = reduced.matches ? 8 : Math.min(32, 12 + speed * .025);
      // One filled silhouette avoids seams between separately stroked segments.
      const left = [], right = [];
      path.forEach((point, i) => {
        const before = path[Math.max(0, i - 1)], after = path[Math.min(path.length - 1, i + 1)];
        const dx = after.x - before.x, dy = after.y - before.y;
        const length = Math.hypot(dx, dy) || 1;
        const radius = thickness * .5 * (1 - i / (path.length - 1)) ** .8;
        left.push({ x: point.x - dy / length * radius, y: point.y + dx / length * radius });
        right.push({ x: point.x + dy / length * radius, y: point.y - dx / length * radius });
      });
      const edge = [...left, ...right.reverse()];
      ctx.beginPath();
      ctx.moveTo((edge[0].x + edge[edge.length - 1].x) / 2, (edge[0].y + edge[edge.length - 1].y) / 2);
      edge.forEach((point, i) => {
        const next = edge[(i + 1) % edge.length];
        ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
      });
      ctx.closePath(); ctx.fillStyle = color;
      ctx.globalAlpha = alpha * (reduced.matches ? .5 : .42);
      ctx.shadowColor = color; ctx.shadowBlur = reduced.matches ? 0 : 10;
      ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      canvas.dataset.active = 'true'; raf = requestAnimationFrame(draw);
    };
    const wake = () => { if (!raf && enabled && !document.hidden) raf = requestAnimationFrame(draw); };
    const move = event => {
      if (!enabled || event.pointerType === 'touch') return;
      const now = performance.now(), x = event.clientX, y = event.clientY;
      if (!points.length) points = Array.from({ length: reduced.matches ? 12 : 40 }, () => ({ x, y, vx: 0, vy: 0 }));
      const distance = Math.hypot(x - targetX, y - targetY);
      speed = Math.min(800, distance / Math.max(8, now - lastMove) * 1000);
      targetX = x; targetY = y; lastMove = now;
      wake();
    };
    const change = () => { enabled = fine.matches; stop(); };
    const visibility = () => { if (document.hidden) stop(); };
    const layer = () => {
      const host = document.querySelector('dialog[open]') || document.body;
      if (canvas.parentNode !== host) { host.appendChild(canvas); stop(); }
    };
    const observer = new MutationObserver(layer);
    document.querySelectorAll('dialog').forEach(dialog => observer.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
    document.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', stop);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', stop); window.addEventListener('resize', resize);
    fine.addEventListener('change', change); reduced.addEventListener('change', change);
    resize(); layer();
    return () => {
      stop(); observer.disconnect(); canvas.remove();
      document.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', stop);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', stop); window.removeEventListener('resize', resize);
      fine.removeEventListener('change', change); reduced.removeEventListener('change', change);
    };
  }, []);
  return null;
}
