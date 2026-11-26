import { pointToSegmentDist } from './map-walls.js';

export function getManualFogStateAt(x, y, fogStrokes) {
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
