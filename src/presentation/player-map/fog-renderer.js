import { $ } from '../shared/dom.js';
import { drawFogStrokePath } from '../shared/map-render-utils.js';

let exploredCanvas = null;
let exploredMapKey = '';

function ensureExploredCanvas(w, h, mapKey) {
  if (!exploredCanvas || exploredCanvas.width !== w || exploredCanvas.height !== h || exploredMapKey !== mapKey) {
    exploredCanvas = document.createElement('canvas');
    exploredCanvas.width = w;
    exploredCanvas.height = h;
    exploredMapKey = mapKey;
  }
}

function clipSourcePolygon(ctx, s) {
  if (!s.polygon || s.polygon.length < 3) return false;
  ctx.beginPath();
  ctx.moveTo(s.polygon[0].x, s.polygon[0].y);
  for (let i = 1; i < s.polygon.length; i += 1) {
    ctx.lineTo(s.polygon[i].x, s.polygon[i].y);
  }
  ctx.closePath();
  ctx.clip();
  return true;
}

export function renderFogOfWar(st, sources) {
  const canvas = $('#playerFogCanvas');
  const m = st.map;
  const w = m.width || 1280;
  const h = m.height || 840;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  if (m.fogEnabled === false) return;

  const light = m.lighting || 'day';
  const walls = Array.isArray(m.walls) ? m.walls : [];
  const fogStrokes = Array.isArray(m.fogStrokes) ? m.fogStrokes : [];
  const hasAutoFog = light !== 'day' || !!m.fogInDaylight || walls.length > 0;

  if (!hasAutoFog && !fogStrokes.length) return;

  if (hasAutoFog) {
    const mapKey = `${w}x${h}:${m.rotation || 0}:${(m.bgImage || '').slice(0, 40)}:${m.fogResetStamp || 0}`;
    ensureExploredCanvas(w, h, mapKey);

    if (m.fogMemory) {
      const ectx = exploredCanvas.getContext('2d');
      ectx.fillStyle = '#ffffff';
      sources.forEach(s => {
        if (s.dimPx <= 0) return;
        ectx.save();
        clipSourcePolygon(ectx, s);
        ectx.beginPath();
        ectx.arc(s.x, s.y, s.dimPx, 0, Math.PI * 2);
        ectx.fill();
        ectx.restore();
      });
    }

    const fogAlpha = light === 'day' ? 0.9 : light === 'dim' ? 0.66 : light === 'night' ? 0.94 : 0.985;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(6, 8, 7, ${fogAlpha})`;
    ctx.fillRect(0, 0, w, h);

    if (m.fogMemory) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = light === 'darkness' ? 0.25 : 0.36;
      ctx.drawImage(exploredCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = 'destination-out';
    const gs = m.gridSize || 56;
    sources.forEach(s => {
      if (s.dimPx <= 0) {
        if (s.selfOnly) {
          // 0m darkvision in total darkness: keep only the token's own disc faintly visible (never a 3x3 area!)
          const selfR = Math.max(14, Math.round(gs * (s.tokenSize || 1) * 0.44));
          ctx.save();
          const grad = ctx.createRadialGradient(s.x, s.y, selfR * 0.45, s.x, s.y, selfR);
          grad.addColorStop(0, 'rgba(0,0,0,0.68)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, selfR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        return;
      }
      ctx.save();
      clipSourcePolygon(ctx, s);
      if (light === 'day' && walls.length) {
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillRect(0, 0, w, h);
      } else {
        const innerR = Math.max(4, Math.min(s.brightPx || s.dimPx * 0.35, s.dimPx * 0.92));
        const grad = ctx.createRadialGradient(s.x, s.y, innerR * 0.72, s.x, s.y, s.dimPx);
        grad.addColorStop(0, s.isDarkvisionOnly ? 'rgba(0,0,0,0.86)' : 'rgba(0,0,0,1)');
        grad.addColorStop(0.68, s.isDarkvisionOnly ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.92)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.dimPx, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    ctx.globalCompositeOperation = 'source-over';
    if (light === 'night' || light === 'darkness') {
      sources.forEach(s => {
        if (!s.hasCarriedLight) return;
        ctx.save();
        clipSourcePolygon(ctx, s);
        const warm = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.dimPx);
        warm.addColorStop(0, 'rgba(255, 200, 115, 0.14)');
        warm.addColorStop(0.6, 'rgba(255, 175, 85, 0.06)');
        warm.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = warm;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.dimPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
  }

  fogStrokes.forEach(stStroke => {
    ctx.save();
    if (stStroke.mode === 'reveal') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(6, 8, 7, 0.985)';
      ctx.strokeStyle = 'rgba(6, 8, 7, 0.985)';
    }
    drawFogStrokePath(ctx, stStroke);
    ctx.restore();
  });
}
