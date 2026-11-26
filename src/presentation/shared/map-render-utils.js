import { computeScaleBar } from '../../domain/map/map-scale.js';
import { computeBgTransformStyle } from '../../domain/map/map-rotation.js';

export function renderScaleBar(containerEl, map, zoom) {
  if (!containerEl || !map) return;
  const info = computeScaleBar(map, zoom);
  const line = containerEl.querySelector('.scale-bar-line');
  const lbl = containerEl.querySelector('.scale-bar-label');
  const meta = containerEl.querySelector('.scale-bar-meta');
  if (line) line.style.width = `${info.barPx}px`;
  if (lbl) lbl.textContent = info.label;
  if (meta) meta.textContent = info.detail;
}

export function applyBgImageRotation(targetEl, map) {
  if (!targetEl || !map) return;
  const style = computeBgTransformStyle(map);
  Object.assign(targetEl.style, style);
}

export function hexToGridRgba(hex, alpha = 0.42) {
  const clean = String(hex || '').trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(clean)) return 'rgba(210, 226, 174, 0.22)';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function applyGridOverlayStyle(gridEl, map) {
  if (!gridEl || !map) return;
  const color = map.gridColor || '#d2e2ae';
  const alpha = color.toLowerCase() === '#d2e2ae' ? 0.22 : 0.46;
  gridEl.hidden = !map.showGrid;
  gridEl.style.setProperty('--grid-size', `${map.gridSize || 56}px`);
  gridEl.style.setProperty('--grid-line-color', hexToGridRgba(color, alpha));
}

export function drawFogStrokePath(ctx, st) {
  const pts = st.points;
  if (!Array.isArray(pts) || !pts.length) return;
  const r = Number(st.radius) || 40;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = r * 2;
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i += 1) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
  }
}
