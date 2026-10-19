import { useEffect } from 'react';
import './CursorEffects.css';

// 与帧率无关的流线拖尾；不依赖任何外部光标库。
const TRAIL_POINTS = 28;
const REDUCED_TRAIL_POINTS = 12;
const MAX_DT = 0.05;
const MIN_MOVE_MS = 8;
const FADE_DELAY_MS = 120;
const FADE_MS = 900;
const REDUCED_FADE_MS = 220;
const BASE_THICKNESS = 8;
const MAX_THICKNESS = 20;
const REDUCED_THICKNESS = 6;
const SPEED_THICKNESS_GAIN = 0.015;
const MAX_SPEED = 800;
const MIN_STEP_DISTANCE = 0.25;
const ALPHA_NORMAL = 0.42;
const ALPHA_REDUCED = 0.5;
const GLOW_BLUR = 10;
const SPEED_DECAY_HZ = 10;
const FOLLOW_HZ = 110;
const STEP_HZ = 240;
const REDUCED_FOLLOW_HZ = 100;
const FALLBACK_COLOR = '#a4a2ff';

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

    const color = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || FALLBACK_COLOR;

    let width = 1;
    let height = 1;
    let raf = 0;
    let last = 0;
    let lastMove = 0;
    let enabled = fine.matches;
    let targetX = 0;
    let targetY = 0;
    let speed = 0;
    let points = [];

    const clear = () => ctx.clearRect(0, 0, width, height);

    // 清空画布并停止循环，用于失焦、隐藏或尺寸变化时。
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      points = [];
      speed = 0;
      canvas.dataset.active = 'false';
      clear();
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stop();
    };

    // 让每个跟随点朝前一个点靠近。
    const advanceTrail = (dt, isReduced) => {
      if (isReduced) {
        const follow = 1 - Math.exp(-dt * REDUCED_FOLLOW_HZ);
      points.forEach((point, i) => {
        const target = i ? points[i - 1] : { x: targetX, y: targetY };
        point.x += (target.x - point.x) * follow;
        point.y += (target.y - point.y) * follow;
      });
        return;
      }
      // 拆成小步长、无过冲的跟随，避免转向时来回抖动。
      const steps = Math.max(1, Math.ceil(dt * STEP_HZ));
      const follow = 1 - Math.exp((-dt / steps) * FOLLOW_HZ);
      for (let tick = 0; tick < steps; tick++) {
        points.forEach((point, i) => {
          const target = i ? points[i - 1] : { x: targetX, y: targetY };
          point.x += (target.x - point.x) * follow;
        point.y += (target.y - point.y) * follow;
      });
      }
    };

    // 由中心路径向两侧推出轮廓，得到一条从粗到细的封闭带状图形。
    const ribbon = thickness => {
      const path = [{ x: targetX, y: targetY }, ...points].filter((point, i, all) =>
        !i || Math.hypot(point.x - all[i - 1].x, point.y - all[i - 1].y) > MIN_STEP_DISTANCE);
      if (path.length < 2) return null;

      const left = [];
      const right = [];
      path.forEach((point, i) => {
        const before = path[Math.max(0, i - 1)];
        const after = path[Math.min(path.length - 1, i + 1)];
        const dx = after.x - before.x;
        const dy = after.y - before.y;
        const length = Math.hypot(dx, dy) || 1;
        const radius = thickness * 0.5 * (1 - i / (path.length - 1)) ** 0.8;
        left.push({ x: point.x - (dy / length) * radius, y: point.y + (dx / length) * radius });
        right.push({ x: point.x + (dy / length) * radius, y: point.y - (dx / length) * radius });
      });

      return [...left, ...right.reverse()];
    };

    const draw = now => {
      raf = 0;
      if (!enabled || document.hidden || !points.length) return;

      // 限制单帧步长，避免切回标签页时拖尾瞬移。
      const dt = last ? Math.min(MAX_DT, (now - last) / 1000) : 1 / 60;
      last = now;

      // 停止移动后延迟淡出，速度随时间指数衰减。
      const rest = now - lastMove;
      speed *= Math.exp(-dt * SPEED_DECAY_HZ);
      const fade = reduced.matches ? REDUCED_FADE_MS : FADE_MS;
      const alpha = Math.max(0, 1 - Math.max(0, rest - FADE_DELAY_MS) / fade);

      clear();
      if (alpha <= 0) { stop(); return; }

      advanceTrail(dt, reduced.matches);

      // 速度越快拖尾越粗，上限由 MAX_THICKNESS 约束。
      const thickness = reduced.matches
        ? REDUCED_THICKNESS
        : Math.min(MAX_THICKNESS, BASE_THICKNESS + speed * SPEED_THICKNESS_GAIN);
      const edge = ribbon(thickness);
      if (!edge) { stop(); return; }

      // 一次性填充整条轮廓，避免分段描边之间出现接缝。
      ctx.beginPath();
      ctx.moveTo((edge[0].x + edge[edge.length - 1].x) / 2, (edge[0].y + edge[edge.length - 1].y) / 2);
      edge.forEach((point, i) => {
        const next = edge[(i + 1) % edge.length];
        ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
      });
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * (reduced.matches ? ALPHA_REDUCED : ALPHA_NORMAL);
      ctx.shadowColor = color;
      ctx.shadowBlur = reduced.matches ? 0 : GLOW_BLUR;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      canvas.dataset.active = 'true';
      raf = requestAnimationFrame(draw);
    };

    // 唤醒渲染循环；已在运行、不可见或已销毁时不重复申请 rAF。
    const wake = () => { if (!raf && enabled && !document.hidden) raf = requestAnimationFrame(draw); };

    const move = event => {
      if (!enabled || event.pointerType === 'touch') return;
      const now = performance.now(), x = event.clientX, y = event.clientY;
      if (!points.length) {
        targetX = x; targetY = y; lastMove = now;
      points = Array.from({ length: reduced.matches ? REDUCED_TRAIL_POINTS : TRAIL_POINTS }, () => ({ x, y }));
    }
      const distance = Math.hypot(x - targetX, y - targetY);
      speed = Math.min(MAX_SPEED, distance / Math.max(MIN_MOVE_MS, now - lastMove) * 1000);
      targetX = x; targetY = y; lastMove = now;
      wake();
    };
    const change = () => { enabled = fine.matches; stop(); };
    const visibility = () => { if (document.hidden) stop(); };
    const leave = event => { if (!event.relatedTarget) stop(); };

    // 弹窗打开时把画布挪进 dialog，保证拖尾盖在遮罩之上。
    const layer = () => {
      const host = document.querySelector('dialog[open]') || document.body;
      if (canvas.parentNode !== host) { host.appendChild(canvas); stop(); }
    };

    const observer = new MutationObserver(layer);
    document.querySelectorAll('dialog').forEach(dialog => observer.observe(dialog, { attributes: true, attributeFilter: ['open'] }));

    document.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', stop);
    document.addEventListener('pointerout', leave);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', stop);
    window.addEventListener('resize', resize);
    fine.addEventListener('change', change);
    reduced.addEventListener('change', change);

    resize();
    layer();

    // 卸载：停止循环、解绑监听、移除画布。
    return () => {
      stop();
      observer.disconnect();
      canvas.remove();
      document.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', stop);
      document.removeEventListener('pointerout', leave);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', stop);
      window.removeEventListener('resize', resize);
      fine.removeEventListener('change', change);
      reduced.removeEventListener('change', change);
    };
  }, []);
  return null;
}
