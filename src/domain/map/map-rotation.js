export function clampBgScale(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 1;
  return Math.round(Math.max(0.2, Math.min(4, n)) * 100) / 100;
}

export function computeStageDimensionsForImage(natW, natH, maxDim = 1600, minDim = 720) {
  const w0 = Math.max(1, Number(natW) || 1280);
  const h0 = Math.max(1, Number(natH) || 840);
  const largest = Math.max(w0, h0);
  let scale = 1;
  if (largest > maxDim) scale = maxDim / largest;
  else if (largest < minDim) scale = minDim / largest;
  return {
    width: Math.max(480, Math.round(w0 * scale)),
    height: Math.max(360, Math.round(h0 * scale))
  };
}

export function computeBgTransformStyle(map) {
  const rot = ((Number(map?.rotation) || 0) % 360 + 360) % 360;
  const swapped = rot === 90 || rot === 270;
  const natW = Number(map?.natWidth) || (swapped ? (map?.height || 840) : (map?.width || 1280));
  const natH = Number(map?.natHeight) || (swapped ? (map?.width || 1280) : (map?.height || 840));
  const bgScale = clampBgScale(map?.bgScale ?? 1);
  const offX = Math.round(Number(map?.bgOffsetX) || 0);
  const offY = Math.round(Number(map?.bgOffsetY) || 0);
  return {
    width: `${natW}px`,
    height: `${natH}px`,
    left: '50%',
    top: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: `translate(-50%, -50%) translate(${offX}px, ${offY}px) scale(${bgScale}) rotate(${rot}deg)`
  };
}

export function rotatePoint90(x, y, oldW, oldH, clockwise) {
  return clockwise ? { x: oldH - y, y: x } : { x: y, y: oldW - x };
}

export function rotateMap90(map, clockwise = true) {
  if (!map) return;
  const oldW = Number(map.width) || 1280;
  const oldH = Number(map.height) || 840;
  const prevRot = ((Number(map.rotation) || 0) % 360 + 360) % 360;
  const wasSwapped = prevRot === 90 || prevRot === 270;

  if (!map.natWidth || !map.natHeight) {
    map.natWidth = wasSwapped ? oldH : oldW;
    map.natHeight = wasSwapped ? oldW : oldH;
  }

  map.rotation = (prevRot + (clockwise ? 90 : 270)) % 360;
  map.width = oldH;
  map.height = oldW;

  const oldOffX = Number(map.bgOffsetX) || 0;
  const oldOffY = Number(map.bgOffsetY) || 0;
  map.bgOffsetX = clockwise ? -oldOffY : oldOffY;
  map.bgOffsetY = clockwise ? oldOffX : -oldOffX;

  Object.values(map.tokens || {}).forEach(tok => {
    if (!tok || tok.staged) return;
    const pt = rotatePoint90(tok.x, tok.y, oldW, oldH, clockwise);
    tok.x = pt.x;
    tok.y = pt.y;
  });

  (map.markers || []).forEach(mk => {
    const pt = rotatePoint90(mk.x, mk.y, oldW, oldH, clockwise);
    mk.x = pt.x;
    mk.y = pt.y;
  });

  (map.walls || []).forEach(w => {
    const p1 = rotatePoint90(w.x1, w.y1, oldW, oldH, clockwise);
    const p2 = rotatePoint90(w.x2, w.y2, oldW, oldH, clockwise);
    w.x1 = p1.x; w.y1 = p1.y; w.x2 = p2.x; w.y2 = p2.y;
  });

  (map.fogStrokes || []).forEach(st => {
    (st.points || []).forEach(p => {
      const np = rotatePoint90(p.x, p.y, oldW, oldH, clockwise);
      p.x = np.x; p.y = np.y;
    });
  });

  map.fogResetStamp = Date.now();
}
