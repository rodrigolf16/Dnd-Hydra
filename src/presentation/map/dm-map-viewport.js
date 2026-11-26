import { getMetersPerSquare } from '../../domain/map/map-scale.js';
import { clampBgScale } from '../../domain/map/map-rotation.js';
import { emitToast, getState, notify, uiState } from '../../application/store/encounter-store.js';
import { $ } from '../shared/dom.js';
import { applyBgImageRotation, renderScaleBar } from '../shared/map-render-utils.js';

export function snapCoord(val, gridSize, tokenSize = 1) {
  if (tokenSize % 2 === 0) return Math.round(val / gridSize) * gridSize;
  return Math.floor(val / gridSize) * gridSize + gridSize / 2;
}

export function clientToStageCoords(clientX, clientY) {
  const vp = $('#mapViewport');
  const rect = vp.getBoundingClientRect();
  const m = getState().map;
  return {
    x: (clientX - rect.left - m.panX) / m.zoom,
    y: (clientY - rect.top - m.panY) / m.zoom
  };
}

export function calcGridDistanceMeters(x1, y1, x2, y2) {
  const m = getState().map;
  const gs = m.gridSize || 56;
  const mps = getMetersPerSquare(m);
  const dx = Math.abs(x2 - x1) / gs;
  const dy = Math.abs(y2 - y1) / gs;
  const squares = Math.round(Math.max(dx, dy) * 2) / 2;
  const meters = Math.round(squares * mps * 10) / 10;
  return { squares, meters };
}

export function applyStageTransform() {
  const m = getState().map;
  const stage = $('#mapStage');
  stage.style.width = `${m.width}px`;
  stage.style.height = `${m.height}px`;
  stage.style.transform = `translate(${m.panX}px, ${m.panY}px) scale(${m.zoom})`;
  $('#mapZoomLabel').textContent = `${Math.round(m.zoom * 100)}%`;
  renderScaleBar($('#dmScaleBar'), m, m.zoom);
}

export function fitMapToViewport() {
  const vp = $('#mapViewport');
  if (!vp || vp.clientWidth === 0) return;
  const m = getState().map;
  const pad = 20;
  const zx = (vp.clientWidth - pad * 2) / m.width;
  const zy = (vp.clientHeight - pad * 2) / m.height;
  m.zoom = Math.max(0.25, Math.min(1.6, Math.min(zx, zy)));
  m.panX = Math.round((vp.clientWidth - m.width * m.zoom) / 2);
  m.panY = Math.round((vp.clientHeight - m.height * m.zoom) / 2);
  applyStageTransform();
}

export function centerMapOnPoint(stageX, stageY) {
  const vp = $('#mapViewport');
  if (!vp || vp.clientWidth === 0) return;
  const m = getState().map;
  m.panX = Math.round(vp.clientWidth / 2 - stageX * m.zoom);
  m.panY = Math.round(vp.clientHeight / 2 - stageY * m.zoom);
  applyStageTransform();
}

export function zoomMapAroundPoint(factor, viewportX, viewportY) {
  const m = getState().map;
  const prevZoom = m.zoom || 1;
  const nextZoom = Math.max(0.25, Math.min(3.2, Math.round(prevZoom * factor * 1000) / 1000));
  m.panX = Math.round(viewportX - ((viewportX - m.panX) / prevZoom) * nextZoom);
  m.panY = Math.round(viewportY - ((viewportY - m.panY) / prevZoom) * nextZoom);
  m.zoom = nextZoom;
  applyStageTransform();
}

export function zoomMapAroundCenter(factor) {
  const vp = $('#mapViewport');
  if (!vp || vp.clientWidth === 0) return;
  zoomMapAroundPoint(factor, vp.clientWidth / 2, vp.clientHeight / 2);
}

export function syncBgTransformVisual() {
  const m = getState().map;
  const box = $('#mapBgBox');
  if (box) applyBgImageRotation(box, m);
  const pct = Math.round(clampBgScale(m.bgScale ?? 1) * 100);
  const slider = $('#mapBgScaleSlider');
  const label = $('#mapBgScaleLabel');
  if (slider) slider.value = String(pct);
  if (label) label.textContent = `${pct}%`;
}

export function setMapTool(nextTool) {
  if (nextTool === 'edit-bg' && !getState().map.bgImage) {
    emitToast('Sube o pega primero una imagen de mapa para poder editarla');
    return;
  }
  uiState.mapTool = uiState.mapTool === nextTool ? 'pan' : nextTool;
  notify('map');
  const hints = {
    pan: 'Modo normal: arrastra pines o mueve el mapa',
    'edit-bg': 'Modo edición de imagen: arrastra el mapa o las esquinas doradas para escalar y alinear (Esc para salir)',
    measure: 'Regla activa: arrastra sobre el mapa para medir distancia en metros',
    wall: 'Paredes activo: arrastra para trazar paredes que bloquean la visión (Esc para salir)',
    'wall-erase': 'Borrador de paredes: haz clic sobre cualquier pared para quitarla',
    'fog-cover': 'Pincel de niebla: arrastra sobre bosques o edificios para ocultarlos a los jugadores',
    'fog-reveal': 'Revelar área: arrastra para despejar niebla manualmente'
  };
  emitToast(hints[uiState.mapTool] || '');
}
