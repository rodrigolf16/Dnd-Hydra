import { clampBgScale, computeStageDimensionsForImage, rotateMap90 } from '../../domain/map/map-rotation.js';
import { clampAllPlacedItemsToStage, clampToStage, ensureMapState } from '../../domain/map/map-geometry.js';
import { getDefaultDarkvisionMeters } from '../../domain/map/vision-rules.js';
import { getDefaultEnemyDarkvisionMeters } from '../../domain/map/enemy-vision-rules.js';
import { emitToast, getState, postVttMessage, saveState } from '../store/encounter-store.js';

export function ensureTokenPositions() {
  const state = getState();
  ensureMapState(state);
  const m = state.map;
  const gs = m.gridSize || 56;
  const validIds = new Set(state.combatants.map(c => c.id));
  Object.keys(m.tokens).forEach(id => { if (!validIds.has(id)) delete m.tokens[id]; });

  let pcIdx = 0;
  state.combatants.forEach(c => {
    const defDv = c.type === 'enemy' ? getDefaultEnemyDarkvisionMeters(c) : getDefaultDarkvisionMeters(c);
    if (m.tokens[c.id]) {
      if (m.tokens[c.id].darkvision === undefined) {
        m.tokens[c.id].darkvision = defDv;
      } else if (c.type !== 'enemy' && m.tokens[c.id].darkvision === 27 && defDv === 36) {
        m.tokens[c.id].darkvision = 36;
      }
      if (!m.tokens[c.id].light) m.tokens[c.id].light = 'none';
      return;
    }
    if (c.type === 'enemy') {
      m.tokens[c.id] = { x: 0, y: 0, size: 1, hidden: true, staged: true, darkvision: defDv, light: 'none' };
    } else {
      const col = 2 + Math.floor(pcIdx / 4);
      const row = 2 + (pcIdx % 4);
      m.tokens[c.id] = { x: col * gs + gs / 2, y: row * gs + gs / 2, size: 1, hidden: false, staged: false, darkvision: defDv, light: 'none' };
      pcIdx += 1;
    }
  });
}

export function applyNewMapBackground(url, natW, natH) {
  const m = getState().map;
  const dims = computeStageDimensionsForImage(natW, natH);
  m.bgImage = url;
  m.bgScale = 1;
  m.bgOffsetX = 0;
  m.bgOffsetY = 0;
  m.rotation = 0;
  m.width = dims.width;
  m.height = dims.height;
  m.natWidth = dims.width;
  m.natHeight = dims.height;
  m.fogResetStamp = Date.now();
  clampAllPlacedItemsToStage(m);
  saveState('map');
}

export function clearMapBackground() {
  const m = getState().map;
  m.bgImage = '';
  m.bgScale = 1;
  m.bgOffsetX = 0;
  m.bgOffsetY = 0;
  m.rotation = 0;
  m.width = 1280;
  m.height = 840;
  m.natWidth = 1280;
  m.natHeight = 840;
  m.fogResetStamp = Date.now();
  clampAllPlacedItemsToStage(m);
  saveState('map');
  emitToast('Imagen de fondo quitada');
}

export function rotateMap(clockwise = true) {
  const m = getState().map;
  rotateMap90(m, clockwise);
  saveState('map');
  emitToast(`Mapa rotado ${clockwise ? '+90°' : '-90°'} (${m.rotation}°)`);
}

export function setMapBgScale(scaleVal) {
  const m = getState().map;
  m.bgScale = clampBgScale(scaleVal);
  saveState('mapBg');
}

export function resetMapBgTransform() {
  const m = getState().map;
  m.bgScale = 1;
  m.bgOffsetX = 0;
  m.bgOffsetY = 0;
  saveState('mapBg');
  emitToast('Imagen centrada al 100%');
}

export function realignPlacedTokens() {
  const state = getState();
  const m = state.map;
  const gs = m.gridSize || 56;
  let pcIdx = 0;
  let placedEnemyIdx = 0;
  state.combatants.forEach(c => {
    const tok = m.tokens[c.id];
    if (c.type === 'enemy') {
      if (!tok || tok.staged) return;
      const col = Math.max(2, Math.floor(m.width / gs) - 2 - Math.floor(placedEnemyIdx / 5));
      const row = 2 + (placedEnemyIdx % 5);
      tok.x = col * gs + gs / 2;
      tok.y = row * gs + gs / 2;
      placedEnemyIdx += 1;
    } else {
      const col = 2 + Math.floor(pcIdx / 4);
      const row = 2 + (pcIdx % 4);
      m.tokens[c.id] = {
        ...(tok || {}),
        x: col * gs + gs / 2,
        y: row * gs + gs / 2,
        size: tok?.size || 1,
        hidden: !!tok?.hidden,
        staged: false,
        darkvision: tok?.darkvision ?? getDefaultDarkvisionMeters(c),
        light: tok?.light || 'none'
      };
      pcIdx += 1;
    }
  });
  saveState('map');
  emitToast('Pines en el mapa realineados (la reserva no se modificó)');
}

export function addMapMarker({ label, icon, color, dmOnly, x, y }) {
  const m = getState().map;
  const pos = clampToStage(x, y, m);
  m.markers.push({ id: `mk-${Date.now()}`, label, icon, color, dmOnly, x: pos.x, y: pos.y });
  saveState('map');
  emitToast(`Pin «${label}» colocado en el mapa`);
}

export function syncPlayerCamera() {
  const m = getState().map;
  postVttMessage({ type: 'SYNC_CAMERA', camera: { zoom: m.zoom, panX: m.panX, panY: m.panY } });
  emitToast('Cámara sincronizada con la Pantalla de Jugadores');
}
