import { metersToPx } from './map-scale.js';
import { computeVisibilityPolygon, isBlockedByWalls } from './map-walls.js';
import { getLightRadiusMeters, getTokenDarkvision } from './vision-rules.js';

const DARKVISION_MONSTER_RE = /goblin|trasgo|hobgoblin|orco|orc|kobold|drow|elfo oscuro|drag[oó]n|vampiro|esqueleto|zombi|demonio|diablo|ara[ñn]a|oso lechuza|owlbear|trol|ogro|minotauro|g[aá]rgola|gnoll|lich|espectro|fantasma|wraith|m[ií]mico|hidra|medusa|g[oó]lem|gigante de fuego|tiefling|infernal|enano|gnomo/i;

export function hasUmbralInvisibility(c) {
  if (!c) return false;
  const text = [...(c.features || []), ...(c.feats || []), c.className || ''].join(' ');
  return /visi[oó]n en la umbra|acechador en la penumbra|invisib\w*\s+en\s+la\s+oscuridad|umbral sight/i.test(text);
}

export function getDefaultEnemyDarkvisionMeters(c) {
  if (!c) return 0;
  const text = `${c.name || ''} ${c.species || ''} ${c.className || ''} ${(c.features || []).join(' ')}`;
  return DARKVISION_MONSTER_RE.test(text) ? 18 : 0;
}

export function collectRealLightSources(st) {
  const m = st.map || {};
  const lights = [];

  (st.combatants || []).forEach(c => {
    const tok = m.tokens?.[c.id];
    if (!tok || tok.staged || tok.hidden) return;
    const carried = getLightRadiusMeters(tok.light || 'none');
    if (carried.dim <= 0) return;
    lights.push({
      x: tok.x,
      y: tok.y,
      brightPx: metersToPx(carried.bright, m),
      dimPx: metersToPx(carried.dim, m)
    });
  });

  (m.markers || []).forEach(mk => {
    if (mk.dmOnly) return;
    if (mk.icon === '🔥' || /antorcha|fuego|fogata|luz|linterna|lámpara/i.test(mk.label || '')) {
      lights.push({ x: mk.x, y: mk.y, brightPx: metersToPx(6, m), dimPx: metersToPx(12, m) });
    }
  });

  return lights;
}

export function isPointIlluminatedByLight(x, y, st, lightSources) {
  const m = st.map || {};
  const light = m.lighting || 'day';
  if (light === 'day' || light === 'dim') return true;
  const walls = Array.isArray(m.walls) ? m.walls : [];
  for (const src of lightSources) {
    if (Math.hypot(x - src.x, y - src.y) <= src.dimPx) {
      if (!walls.length || !isBlockedByWalls(src.x, src.y, x, y, walls)) return true;
    }
  }
  return false;
}

export function isUmbralInvisible(c, tok, st, lightSources) {
  if (!c || !tok || tok.staged || tok.hidden || c.hp <= 0) return false;
  if (!hasUmbralInvisibility(c)) return false;
  if ((st.map?.lighting || 'day') !== 'darkness') return false;
  return !isPointIlluminatedByLight(tok.x, tok.y, st, lightSources);
}

export function computeEnemyVisionSources(st) {
  const m = st.map || {};
  const light = m.lighting || 'day';
  const walls = Array.isArray(m.walls) ? m.walls : [];
  const maxMapSpanPx = Math.hypot(m.width || 1280, m.height || 840) + 40;
  const sources = [];

  (st.combatants || []).forEach(c => {
    if (c.type !== 'enemy' || c.defeated || c.hp <= 0) return;
    const tok = m.tokens?.[c.id];
    if (!tok || tok.staged) return;

    const dv = typeof tok.darkvision === 'number' && Number.isFinite(tok.darkvision)
      ? Math.max(0, tok.darkvision)
      : getDefaultEnemyDarkvisionMeters(c);
    const carried = getLightRadiusMeters(tok.light || 'none');
    let dimPx = 0;

    if (light === 'day') {
      dimPx = walls.length ? maxMapSpanPx : metersToPx(36, m);
    } else if (light === 'dim') {
      dimPx = metersToPx(Math.max(carried.dim, dv > 0 ? dv : 6), m);
    } else if (light === 'night') {
      dimPx = metersToPx(Math.max(carried.dim, dv > 0 ? dv : 1.5), m);
    } else {
      dimPx = metersToPx(Math.max(carried.dim, dv), m);
    }

    const polygon = (walls.length && dimPx > 0)
      ? computeVisibilityPolygon(tok.x, tok.y, dimPx, walls)
      : null;

    sources.push({
      enemyId: c.id,
      enemyName: c.name,
      x: tok.x,
      y: tok.y,
      dimPx,
      carriedDimPx: metersToPx(carried.dim, m),
      darkvisionMeters: dv,
      polygon,
      hasCarriedLight: carried.bright > 0
    });
  });

  return sources;
}

export function canEnemySeeTarget(enemySrc, target, targetTok, st, lightSources) {
  if (!enemySrc || !target || !targetTok || targetTok.staged || targetTok.hidden) return false;
  const walls = Array.isArray(st.map?.walls) ? st.map.walls : [];
  if (walls.length && isBlockedByWalls(enemySrc.x, enemySrc.y, targetTok.x, targetTok.y, walls)) {
    return false;
  }

  // Umbral Sight (D&D 2024): invisible in darkness to creatures relying on darkvision!
  if (isUmbralInvisible(target, targetTok, st, lightSources)) {
    return false;
  }

  // If the target is standing in real light (e.g. a torch/campfire), an enemy with clear LoS can see them!
  if (isPointIlluminatedByLight(targetTok.x, targetTok.y, st, lightSources)) {
    const light = st.map?.lighting || 'day';
    const maxSightPx = light === 'day'
      ? Math.max(enemySrc.dimPx, metersToPx(36, st.map))
      : Math.max(enemySrc.dimPx, metersToPx(30, st.map));
    return Math.hypot(targetTok.x - enemySrc.x, targetTok.y - enemySrc.y) <= maxSightPx;
  }

  return enemySrc.dimPx > 0 && Math.hypot(targetTok.x - enemySrc.x, targetTok.y - enemySrc.y) <= enemySrc.dimPx;
}

export function summarizeBattleSight(st, enemySources, lightSources) {
  const m = st.map || {};
  const pcSight = {};
  const enemySight = {};
  const pcs = (st.combatants || []).filter(c => c.type !== 'enemy');

  pcs.forEach(pc => {
    const tok = m.tokens?.[pc.id];
    pcSight[pc.id] = {
      hasUmbral: hasUmbralInvisibility(pc, tok),
      isUmbralInvis: isUmbralInvisible(pc, tok, st, lightSources),
      seenBy: []
    };
  });

  const walls = Array.isArray(m.walls) ? m.walls : [];
  enemySources.forEach(es => {
    const seen = [];
    const missedUmbral = [];
    pcs.forEach(pc => {
      const tok = m.tokens?.[pc.id];
      if (!tok || tok.staged || tok.hidden) return;
      if (canEnemySeeTarget(es, pc, tok, st, lightSources)) {
        seen.push(pc.name);
        pcSight[pc.id].seenBy.push(es.enemyName);
      } else if (
        pcSight[pc.id].isUmbralInvis &&
        es.dimPx > 0 &&
        Math.hypot(tok.x - es.x, tok.y - es.y) <= es.dimPx &&
        (!walls.length || !isBlockedByWalls(es.x, es.y, tok.x, tok.y, walls))
      ) {
        missedUmbral.push(pc.name);
      }
    });
    enemySight[es.enemyId] = { seen, missedUmbral };
  });

  return { pcSight, enemySight };
}

export function getEnemyTokenDarkvision(c, tok) {
  if (tok && typeof tok.darkvision === 'number' && Number.isFinite(tok.darkvision)) {
    return Math.max(0, tok.darkvision);
  }
  return getDefaultEnemyDarkvisionMeters(c);
}

export { getTokenDarkvision };
