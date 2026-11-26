import { getGridSizePx, pxToMeters } from './map-scale.js';

export function defaultMapState() {
  return {
    bgImage: '',
    bgScale: 1,
    bgOffsetX: 0,
    bgOffsetY: 0,
    width: 1280,
    height: 840,
    natWidth: 1280,
    natHeight: 840,
    rotation: 0,
    gridSize: 56,
    gridColor: '#d2e2ae',
    metersPerSquare: 1.5,
    showGrid: true,
    snap: true,
    trackMove: true,
    lighting: 'day',
    fogEnabled: true,
    fogMemory: true,
    showVisionRings: true,
    showEnemyVisionRings: true,
    fogResetStamp: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    tokens: {},
    markers: [],
    walls: [],
    fogStrokes: []
  };
}

export function ensureMapState(obj) {
  if (!obj.map || typeof obj.map !== 'object') obj.map = defaultMapState();
  const def = defaultMapState();
  Object.keys(def).forEach(k => {
    if (obj.map[k] === undefined) obj.map[k] = def[k];
  });
  if (!obj.map.tokens || typeof obj.map.tokens !== 'object') obj.map.tokens = {};
  if (!Array.isArray(obj.map.markers)) obj.map.markers = [];
  if (!Array.isArray(obj.map.walls)) obj.map.walls = [];
  if (!Array.isArray(obj.map.fogStrokes)) obj.map.fogStrokes = [];
}

export function clampToStage(x, y, map) {
  return {
    x: Math.max(20, Math.min((map?.width || 1280) - 20, x)),
    y: Math.max(20, Math.min((map?.height || 840) - 20, y))
  };
}

export function clampAllPlacedItemsToStage(map) {
  if (!map) return;
  Object.values(map.tokens || {}).forEach(tok => {
    if (!tok || tok.staged) return;
    const p = clampToStage(tok.x, tok.y, map);
    tok.x = p.x;
    tok.y = p.y;
  });
  (map.markers || []).forEach(mk => {
    const p = clampToStage(mk.x, mk.y, map);
    mk.x = p.x;
    mk.y = p.y;
  });
}

export function snapCoords(x, y, map) {
  if (!map?.snap) return clampToStage(x, y, map);
  const gs = getGridSizePx(map);
  const sx = Math.floor(x / gs) * gs + gs / 2;
  const sy = Math.floor(y / gs) * gs + gs / 2;
  return clampToStage(sx, sy, map);
}

export function computeDistanceMeters(x1, y1, x2, y2, map) {
  const pxDist = Math.hypot(x2 - x1, y2 - y1);
  return Math.round(pxToMeters(pxDist, map) * 10) / 10;
}
