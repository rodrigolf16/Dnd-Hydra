export function pointToSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 1e-6) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
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

export function isBlockedByWalls(x1, y1, x2, y2, walls) {
  if (!Array.isArray(walls) || !walls.length) return false;
  for (let i = 0; i < walls.length; i += 1) {
    const w = walls[i];
    if (segmentsIntersect(x1, y1, x2, y2, w.x1, w.y1, w.x2, w.y2)) return true;
  }
  return false;
}

export function raySegmentIntersection(ox, oy, dx, dy, x1, y1, x2, y2) {
  const sX = x2 - x1;
  const sY = y2 - y1;
  const denom = dx * sY - dy * sX;
  if (Math.abs(denom) < 1e-9) return null;
  const qpX = x1 - ox;
  const qpY = y1 - oy;
  const t = (qpX * sY - qpY * sX) / denom;
  const u = (qpX * dy - qpY * dx) / denom;
  return (t >= 0 && u >= -0.0001 && u <= 1.0001) ? t : null;
}

export function computeVisibilityPolygon(ox, oy, radius, walls) {
  if (!Array.isArray(walls) || !walls.length || radius <= 0) return null;
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
