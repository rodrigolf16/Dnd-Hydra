// Ronda — Motor compartido de Escala, Rotación, Paredes (Raycast 2D) y Niebla Manual
// Usado tanto por el Mapa DM (app.js) como por la Pantalla de Jugadores (player-map.js).
(() => {
  'use strict';

  const NICE_METER_STEPS = [1.5, 3, 4.5, 6, 9, 12, 15, 18, 24, 30, 45, 60, 75, 90, 120, 150];

  // =========================================================================
  // 1. DISTANCE SCALE HELPERS
  // =========================================================================
  function getMetersPerSquare(map) {
    const val = Number(map?.metersPerSquare);
    return Number.isFinite(val) && val > 0 ? val : 1.5;
  }

  function getGridSizePx(map) {
    const gs = Number(map?.gridSize);
    return Number.isFinite(gs) && gs >= 8 ? gs : 56;
  }

  function getPxPerMeter(map) {
    return getGridSizePx(map) / getMetersPerSquare(map);
  }

  function metersToPx(meters, map) {
    return (Number(meters) || 0) * getPxPerMeter(map);
  }

  function pxToMeters(px, map) {
    const ppm = getPxPerMeter(map);
    return ppm > 0 ? (Number(px) || 0) / ppm : 0;
  }

  function getMapWidthMeters(map) {
    const w = Number(map?.width) || 1280;
    return Math.round(pxToMeters(w, map) * 10) / 10;
  }

  function getMapHeightMeters(map) {
    const h = Number(map?.height) || 840;
    return Math.round(pxToMeters(h, map) * 10) / 10;
  }

  // Updates gridSize so the map stage width matches targetWidthMeters cleanly
  function setMapWidthMeters(map, targetWidthMeters) {
    const cleanM = Math.max(6, Math.min(500, Number(targetWidthMeters) || 35));
    const mps = getMetersPerSquare(map);
    const w = Number(map?.width) || 1280;
    const rawGs = (w / cleanM) * mps;
    map.gridSize = Math.max(12, Math.min(180, Math.round(rawGs * 10) / 10));
    return map.gridSize;
  }

  // Computes a crisp Google-Maps-style visual scale bar for the current zoom
  function computeScaleBar(map, zoom = 1) {
    const ppm = getPxPerMeter(map);
    const screenPxPerMeter = ppm * Math.max(0.1, Number(zoom) || 1);
    const mps = getMetersPerSquare(map);

    let chosenMeters = NICE_METER_STEPS[0];
    for (const step of NICE_METER_STEPS) {
      const px = step * screenPxPerMeter;
      chosenMeters = step;
      if (px >= 78 && px <= 175) break;
      if (px > 175) break;
    }

    const barPx = Math.max(44, Math.min(200, Math.round(chosenMeters * screenPxPerMeter)));
    const squares = Math.round((chosenMeters / mps) * 10) / 10;
    const fmt = v => String(Math.round(v * 10) / 10).replace('.', ',');

    return {
      barPx,
      meters: chosenMeters,
      squares,
      label: `${fmt(chosenMeters)} m`,
      detail: `${fmt(squares)} ${squares === 1 ? 'casilla' : 'casillas'} · Mapa ${fmt(getMapWidthMeters(map))}×${fmt(getMapHeightMeters(map))} m`
    };
  }

  function renderScaleBar(containerEl, map, zoom) {
    if (!containerEl || !map) return;
    const info = computeScaleBar(map, zoom);
    const line = containerEl.querySelector('.scale-bar-line');
    const lbl = containerEl.querySelector('.scale-bar-label');
    const meta = containerEl.querySelector('.scale-bar-meta');
    if (line) line.style.width = `${info.barPx}px`;
    if (lbl) lbl.textContent = info.label;
    if (meta) meta.textContent = info.detail;
  }

  // =========================================================================
  // 2. LOSSLESS IMAGE ROTATION HELPERS (0 / 90 / 180 / 270)
  // =========================================================================
  function applyBgImageRotation(imgEl, map) {
    if (!imgEl || !map) return;
    const rot = ((Number(map.rotation) || 0) % 360 + 360) % 360;
    const swapped = rot === 90 || rot === 270;
    const natW = Number(map.natWidth) || (swapped ? (map.height || 840) : (map.width || 1280));
    const natH = Number(map.natHeight) || (swapped ? (map.width || 1280) : (map.height || 840));
    imgEl.style.width = `${natW}px`;
    imgEl.style.height = `${natH}px`;
    imgEl.style.left = '50%';
    imgEl.style.top = '50%';
    imgEl.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
  }

  function rotatePoint90(x, y, oldW, oldH, clockwise) {
    return clockwise
      ? { x: oldH - y, y: x }
      : { x: y, y: oldW - x };
  }

  function rotateMap90(map, clockwise = true) {
    if (!map) return;
    const oldW = Number(map.width) || 1280;
    const oldH = Number(map.height) || 840;
    const prevRot = ((Number(map.rotation) || 0) % 360 + 360) % 360;
    const wasSwapped = prevRot === 90 || prevRot === 270;

    if (!map.natWidth || !map.natHeight) {
      map.natWidth = wasSwapped ? oldH : oldW;
      map.natHeight = wasSwapped ? oldW : oldH;
    }

    const nextRot = (prevRot + (clockwise ? 90 : 270)) % 360;
    map.rotation = nextRot;
    map.width = oldH;
    map.height = oldW;

    // Rotate placed tokens
    Object.values(map.tokens || {}).forEach(tok => {
      if (!tok || tok.staged) return;
      const pt = rotatePoint90(tok.x, tok.y, oldW, oldH, clockwise);
      tok.x = pt.x;
      tok.y = pt.y;
    });

    // Rotate free markers
    (map.markers || []).forEach(mk => {
      const pt = rotatePoint90(mk.x, mk.y, oldW, oldH, clockwise);
      mk.x = pt.x;
      mk.y = pt.y;
    });

    // Rotate walls
    (map.walls || []).forEach(w => {
      const p1 = rotatePoint90(w.x1, w.y1, oldW, oldH, clockwise);
      const p2 = rotatePoint90(w.x2, w.y2, oldW, oldH, clockwise);
      w.x1 = p1.x; w.y1 = p1.y; w.x2 = p2.x; w.y2 = p2.y;
    });

    // Rotate manual fog strokes
    (map.fogStrokes || []).forEach(st => {
      (st.points || []).forEach(p => {
        const np = rotatePoint90(p.x, p.y, oldW, oldH, clockwise);
        p.x = np.x; p.y = np.y;
      });
    });

    map.fogResetStamp = Date.now();
  }

  // =========================================================================
  // 3. 2D WALLS & RAYCAST VISIBILITY POLYGON (LINE OF SIGHT)
  // =========================================================================
  function pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 1e-6) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const rX = bx - ax;
    const rY = by - ay;
    const sX = dx - cx;
    const sY = dy - cy;
    const denom = rX * sY - rY * sX;
    if (Math.abs(denom) < 1e-8) return false;
    const qpX = cx - ax;
    const qpY = cy - ay;
    const t = (qpX * sY - qpY * sX) / denom;
    const u = (qpX * rY - qpY * rX) / denom;
    return t > 0.0005 && t < 0.9995 && u >= -0.0005 && u <= 1.0005;
  }

  function isBlockedByWalls(x1, y1, x2, y2, walls) {
    if (!Array.isArray(walls) || !walls.length) return false;
    for (let i = 0; i < walls.length; i += 1) {
      const w = walls[i];
      if (segmentsIntersect(x1, y1, x2, y2, w.x1, w.y1, w.x2, w.y2)) return true;
    }
    return false;
  }

  function raySegmentIntersection(ox, oy, dx, dy, x1, y1, x2, y2) {
    const sX = x2 - x1;
    const sY = y2 - y1;
    const denom = dx * sY - dy * sX;
    if (Math.abs(denom) < 1e-9) return null;
    const qpX = x1 - ox;
    const qpY = y1 - oy;
    const t = (qpX * sY - qpY * sX) / denom;
    const u = (qpX * dy - qpY * dx) / denom;
    if (t >= 0 && u >= -0.0001 && u <= 1.0001) return t;
    return null;
  }

  // Returns an ordered polygon [{x, y}, ...] representing everything visible from (ox, oy) within radius
  function computeVisibilityPolygon(ox, oy, radius, walls) {
    if (!Array.isArray(walls) || !walls.length || radius <= 0) return null;

    // Collect relevant angles: regular 72-point ring + wall endpoints (+/- tiny epsilon)
    const angles = [];
    const ringCount = 72;
    for (let i = 0; i < ringCount; i += 1) {
      angles.push((i / ringCount) * Math.PI * 2 - Math.PI);
    }

    const eps = 0.00025;
    for (let i = 0; i < walls.length; i += 1) {
      const w = walls[i];
      const a1 = Math.atan2(w.y1 - oy, w.x1 - ox);
      const a2 = Math.atan2(w.y2 - oy, w.x2 - ox);
      angles.push(a1 - eps, a1, a1 + eps, a2 - eps, a2, a2 + eps);
    }

    angles.sort((a, b) => a - b);

    const pts = [];
    for (let i = 0; i < angles.length; i += 1) {
      const ang = angles[i];
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);
      let closest = radius;
      for (let j = 0; j < walls.length; j += 1) {
        const w = walls[j];
        const t = raySegmentIntersection(ox, oy, dx, dy, w.x1, w.y1, w.x2, w.y2);
        if (t !== null && t < closest) closest = t;
      }
      pts.push({ x: ox + dx * closest, y: oy + dy * closest });
    }
    return pts;
  }

  // =========================================================================
  // 4. MANUAL FOG BRUSH HELPERS (COVER / REVEAL STROKES)
  // =========================================================================
  // Evaluates chronological manual fog strokes at (x, y). Returns 'cover' | 'reveal' | null
  function getManualFogStateAt(x, y, fogStrokes) {
    if (!Array.isArray(fogStrokes) || !fogStrokes.length) return null;
    let status = null;
    for (let i = 0; i < fogStrokes.length; i += 1) {
      const st = fogStrokes[i];
      const pts = st.points;
      const r = Number(st.radius) || 40;
      if (!Array.isArray(pts) || !pts.length) continue;
      let hit = false;
      if (pts.length === 1) {
        hit = Math.hypot(x - pts[0].x, y - pts[0].y) <= r;
      } else {
        for (let j = 0; j < pts.length - 1; j += 1) {
          if (pointToSegmentDist(x, y, pts[j].x, pts[j].y, pts[j + 1].x, pts[j + 1].y) <= r) {
            hit = true;
            break;
          }
        }
      }
      if (hit) status = st.mode === 'reveal' ? 'reveal' : 'cover';
    }
    return status;
  }

  function drawFogStrokePath(ctx, st) {
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

  window.RondaMapEngine = {
    getMetersPerSquare,
    getGridSizePx,
    getPxPerMeter,
    metersToPx,
    pxToMeters,
    getMapWidthMeters,
    getMapHeightMeters,
    setMapWidthMeters,
    computeScaleBar,
    renderScaleBar,
    applyBgImageRotation,
    rotateMap90,
    pointToSegmentDist,
    isBlockedByWalls,
    computeVisibilityPolygon,
    getManualFogStateAt,
    drawFogStrokePath
  };
})();
