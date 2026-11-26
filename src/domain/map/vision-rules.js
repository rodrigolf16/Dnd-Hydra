import { metersToPx } from './map-scale.js';
import { computeVisibilityPolygon, isBlockedByWalls } from './map-walls.js';
import { getManualFogStateAt } from './map-fog-strokes.js';

export function getDefaultDarkvisionMeters(c) {
  if (!c) return 0;
  const feats = [...(c.features || []), ...(c.feats || [])].join(' ').toLowerCase();
  const sp = String(c.species || '').toLowerCase();
  const cls = String(c.className || '').toLowerCase();
  if (/visi[oó]n en la umbra|acechador en la penumbra/i.test(`${feats} ${cls}`)) {
    const hasBaseDv = /visi[oó]n en la oscuridad/i.test(feats) || /elfo|semielfo|enano|gnomo|infernal|tiefling|orco|aasimar|drow/i.test(sp);
    return hasBaseDv ? 36 : 18;
  }
  if (/visi[oó]n en la oscuridad/i.test(feats)) return 18;
  if (/elfo|semielfo|enano|gnomo|infernal|tiefling|orco|aasimar|drow/i.test(sp)) return 18;
  return 0;
}

export function getTokenDarkvision(c, tok) {
  if (tok && typeof tok.darkvision === 'number' && Number.isFinite(tok.darkvision)) {
    return Math.max(0, tok.darkvision);
  }
  return getDefaultDarkvisionMeters(c);
}

export function getLightRadiusMeters(lightType) {
  switch (lightType) {
    case 'torch': return { bright: 6, dim: 12 };
    case 'lantern': return { bright: 9, dim: 18 };
    case 'candle': return { bright: 1.5, dim: 3 };
    case 'daylight': return { bright: 18, dim: 36 };
    default: return { bright: 0, dim: 0 };
  }
}

export function computeVisionSources(st) {
  const m = st.map;
  const light = m.lighting || 'day';
  const walls = Array.isArray(m.walls) ? m.walls : [];
  const maxMapSpanPx = Math.hypot(m.width || 1280, m.height || 840) + 40;
  const sources = [];

  (st.combatants || []).forEach(c => {
    if (c.type === 'enemy') return;
    const tok = m.tokens?.[c.id];
    if (!tok || tok.hidden || tok.staged || c.hp <= 0) return;

    const dv = getTokenDarkvision(c, tok);
    const carried = getLightRadiusMeters(tok.light || 'none');
    let brightPx = 0;
    let dimPx = 0;
    let selfOnly = false;

    if (light === 'day') {
      brightPx = walls.length ? maxMapSpanPx : Math.max(metersToPx(36, m), metersToPx(dv, m), metersToPx(carried.bright, m));
      dimPx = walls.length ? maxMapSpanPx : Math.max(metersToPx(48, m), metersToPx(carried.dim, m));
    } else if (light === 'dim') {
      brightPx = metersToPx(Math.max(carried.bright, dv > 0 ? dv * 0.75 : 0), m);
      dimPx = metersToPx(Math.max(carried.dim, dv > 0 ? dv : 6), m);
    } else if (light === 'night') {
      brightPx = metersToPx(carried.bright, m);
      dimPx = metersToPx(Math.max(carried.dim, dv > 0 ? dv : 1.5), m);
    } else {
      // Total darkness (dungeon/cave): strictly darkvision or carried light; 0m darkvision sees 0m!
      brightPx = metersToPx(carried.bright, m);
      dimPx = metersToPx(Math.max(carried.dim, dv), m);
      if (dimPx <= 0) selfOnly = true;
    }

    const polygon = (walls.length && dimPx > 0)
      ? computeVisibilityPolygon(tok.x, tok.y, dimPx, walls)
      : null;

    sources.push({
      x: tok.x,
      y: tok.y,
      brightPx,
      dimPx,
      selfOnly,
      tokenSize: Number(tok.size) || 1,
      polygon,
      isDarkvisionOnly: carried.bright === 0 && dv > 0 && (light === 'night' || light === 'darkness'),
      hasCarriedLight: carried.bright > 0
    });
  });

  (st.combatants || []).forEach(c => {
    if (c.type !== 'enemy') return;
    const tok = m.tokens?.[c.id];
    if (!tok || tok.hidden || tok.staged) return;
    const carried = getLightRadiusMeters(tok.light || 'none');
    if (carried.dim <= 0) return;
    const brightPx = metersToPx(carried.bright, m);
    const dimPx = metersToPx(carried.dim, m);
    const polygon = (walls.length && dimPx > 0) ? computeVisibilityPolygon(tok.x, tok.y, dimPx, walls) : null;
    sources.push({ x: tok.x, y: tok.y, brightPx, dimPx, selfOnly: false, polygon, isDarkvisionOnly: false, hasCarriedLight: true });
  });

  (m.markers || []).forEach(mk => {
    if (mk.dmOnly) return;
    const isLightMarker = mk.icon === '🔥' || /antorcha|fuego|fogata|luz|linterna|lámpara/i.test(mk.label || '');
    if (!isLightMarker) return;
    const brightPx = metersToPx(6, m);
    const dimPx = metersToPx(12, m);
    const polygon = (walls.length && dimPx > 0)
      ? computeVisibilityPolygon(mk.x, mk.y, dimPx, walls)
      : null;
    sources.push({ x: mk.x, y: mk.y, brightPx, dimPx, selfOnly: false, polygon, isDarkvisionOnly: false, hasCarriedLight: true });
  });

  return sources;
}

export function isPointVisibleToPlayers(x, y, st, sources) {
  const m = st.map;
  const fogOn = m.fogEnabled !== false;
  const light = m.lighting || 'day';
  const walls = Array.isArray(m.walls) ? m.walls : [];
  const fogStrokes = Array.isArray(m.fogStrokes) ? m.fogStrokes : [];

  if (fogOn && fogStrokes.length) {
    const manual = getManualFogStateAt(x, y, fogStrokes);
    if (manual === 'reveal') return true;
    if (manual === 'cover') return false;
  }

  if (!fogOn) return true;
  if (light === 'day' && !m.fogInDaylight && !walls.length) return true;

  for (const s of sources) {
    if (s.dimPx <= 0) continue;
    if (Math.hypot(x - s.x, y - s.y) <= s.dimPx) {
      if (!walls.length || !isBlockedByWalls(s.x, s.y, x, y, walls)) return true;
    }
  }
  return false;
}
