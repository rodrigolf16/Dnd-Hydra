import { $ } from '../shared/dom.js';
import { drawFogStrokePath } from '../shared/map-render-utils.js';

export function renderDmManualFogCanvas(m) {
  const canvas = $('#mapManualFogCanvas');
  if (!canvas) return;
  const w = m.width || 1280;
  const h = m.height || 840;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  if (!Array.isArray(m.fogStrokes) || !m.fogStrokes.length) return;

  m.fogStrokes.forEach(st => {
    ctx.save();
    if (st.mode === 'reveal') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(26, 18, 42, 0.52)';
      ctx.strokeStyle = 'rgba(26, 18, 42, 0.52)';
    }
    drawFogStrokePath(ctx, st);
    ctx.restore();
  });
}

export function renderDmWallsSvg(m) {
  const svg = $('#mapWallsSvg');
  if (!svg) return;
  svg.replaceChildren();
  const walls = Array.isArray(m.walls) ? m.walls : [];
  const countEl = $('#mapWallCount');
  if (countEl) countEl.textContent = String(walls.length);

  walls.forEach((w, idx) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(w.x1));
    line.setAttribute('y1', String(w.y1));
    line.setAttribute('x2', String(w.x2));
    line.setAttribute('y2', String(w.y2));
    line.setAttribute('class', 'dm-wall-seg');
    line.dataset.wallIdx = String(idx);
    svg.append(line);

    const c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c1.setAttribute('cx', String(w.x1)); c1.setAttribute('cy', String(w.y1)); c1.setAttribute('r', '4');
    c1.setAttribute('class', 'dm-wall-node');
    const c2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c2.setAttribute('cx', String(w.x2)); c2.setAttribute('cy', String(w.y2)); c2.setAttribute('r', '4');
    c2.setAttribute('class', 'dm-wall-node');
    svg.append(c1, c2);
  });
}

function appendVisionShape(svg, s, cls) {
  if (s.dimPx <= 0) return;
  if (s.polygon && s.polygon.length >= 3) {
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', s.polygon.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
    poly.setAttribute('class', cls);
    svg.append(poly);
  } else {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(s.x));
    circle.setAttribute('cy', String(s.y));
    circle.setAttribute('r', String(s.dimPx));
    circle.setAttribute('class', cls);
    svg.append(circle);
  }
}

export function renderDmVisionRingsSvg(m, visionSources, enemySources = []) {
  const visionSvg = $('#mapVisionSvg');
  visionSvg.replaceChildren();
  const hasWalls = Array.isArray(m.walls) && m.walls.length > 0;
  const shouldDraw = (m.lighting || 'day') !== 'day' || hasWalls;
  if (!shouldDraw) return;

  if (m.showVisionRings !== false) {
    visionSources.forEach(s => appendVisionShape(visionSvg, s, s.hasCarriedLight ? 'vision-ring-light' : 'vision-ring-dv'));
  }
  if (m.showEnemyVisionRings !== false) {
    enemySources.forEach(es => appendVisionShape(visionSvg, es, es.hasCarriedLight ? 'vision-ring-enemy-light' : 'vision-ring-enemy'));
  }
}
