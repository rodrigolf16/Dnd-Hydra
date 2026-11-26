import { formatMeters } from '../../domain/shared/formatters.js';
import { pointToSegmentDist } from '../../domain/map/map-walls.js';
import {
  broadcastStateThrottled,
  emitToast,
  getState,
  notify,
  saveState,
  uiState
} from '../../application/store/encounter-store.js';
import { $, $$ } from '../shared/dom.js';
import { renderDmManualFogCanvas } from './dm-map-overlays.js';
import {
  applyStageTransform,
  calcGridDistanceMeters,
  clientToStageCoords,
  zoomMapAroundPoint
} from './dm-map-viewport.js';

function startMeasureDrag(vp, e) {
  const p0 = clientToStageCoords(e.clientX, e.clientY);
  const svg = $('#mapMeasureSvg');
  const line = $('#mapMeasureLine');
  const c1 = $('#mapMeasureStart');
  const c2 = $('#mapMeasureEnd');
  const badge = $('#mapMeasureBadge');
  svg.hidden = false; badge.hidden = false;
  c1.setAttribute('cx', p0.x); c1.setAttribute('cy', p0.y);
  c2.setAttribute('cx', p0.x); c2.setAttribute('cy', p0.y);
  line.setAttribute('x1', p0.x); line.setAttribute('y1', p0.y);
  line.setAttribute('x2', p0.x); line.setAttribute('y2', p0.y);

  const onMove = ev => {
    const p1 = clientToStageCoords(ev.clientX, ev.clientY);
    c2.setAttribute('cx', p1.x); c2.setAttribute('cy', p1.y);
    line.setAttribute('x2', p1.x); line.setAttribute('y2', p1.y);
    const dist = calcGridDistanceMeters(p0.x, p0.y, p1.x, p1.y);
    badge.style.left = `${(p0.x + p1.x) / 2}px`;
    badge.style.top = `${(p0.y + p1.y) / 2}px`;
    badge.textContent = `${formatMeters(dist.meters)} m (${dist.squares} casillas)`;
  };
  const onEnd = ev => {
    vp.releasePointerCapture(ev.pointerId);
    vp.removeEventListener('pointermove', onMove);
    vp.removeEventListener('pointerup', onEnd);
    vp.removeEventListener('pointercancel', onEnd);
    setTimeout(() => { svg.hidden = true; badge.hidden = true; }, 1600);
  };
  vp.addEventListener('pointermove', onMove);
  vp.addEventListener('pointerup', onEnd);
  vp.addEventListener('pointercancel', onEnd);
}

function startWallDrawDrag(vp, e) {
  const m = getState().map;
  const clampWall = p => ({ x: Math.max(0, Math.min(m.width, Math.round(p.x))), y: Math.max(0, Math.min(m.height, Math.round(p.y))) });
  const p0 = clampWall(clientToStageCoords(e.clientX, e.clientY));
  let p1 = { ...p0 };
  const preview = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  preview.setAttribute('x1', String(p0.x)); preview.setAttribute('y1', String(p0.y));
  preview.setAttribute('x2', String(p1.x)); preview.setAttribute('y2', String(p1.y));
  preview.setAttribute('class', 'dm-wall-preview');
  $('#mapWallsSvg')?.append(preview);

  const onMove = ev => {
    p1 = clampWall(clientToStageCoords(ev.clientX, ev.clientY));
    preview.setAttribute('x2', String(p1.x));
    preview.setAttribute('y2', String(p1.y));
  };
  const onEnd = ev => {
    vp.releasePointerCapture(ev.pointerId);
    vp.removeEventListener('pointermove', onMove);
    vp.removeEventListener('pointerup', onEnd);
    vp.removeEventListener('pointercancel', onEnd);
    preview.remove();
    if (Math.hypot(p1.x - p0.x, p1.y - p0.y) >= 10) {
      m.walls.push({ x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y });
      saveState('map');
    }
  };
  vp.addEventListener('pointermove', onMove);
  vp.addEventListener('pointerup', onEnd);
  vp.addEventListener('pointercancel', onEnd);
}

function startFogBrushDrag(vp, e, mode) {
  const m = getState().map;
  const p0 = clientToStageCoords(e.clientX, e.clientY);
  const stroke = { mode, radius: uiState.mapFogBrushRadius, points: [{ x: Math.round(p0.x), y: Math.round(p0.y) }] };
  m.fogStrokes.push(stroke);
  renderDmManualFogCanvas(m);

  const onMove = ev => {
    const p = clientToStageCoords(ev.clientX, ev.clientY);
    const last = stroke.points[stroke.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) >= 8) {
      stroke.points.push({ x: Math.round(p.x), y: Math.round(p.y) });
      renderDmManualFogCanvas(m);
      broadcastStateThrottled();
    }
  };
  const onEnd = ev => {
    vp.releasePointerCapture(ev.pointerId);
    vp.removeEventListener('pointermove', onMove);
    vp.removeEventListener('pointerup', onEnd);
    vp.removeEventListener('pointercancel', onEnd);
    saveState('map');
  };
  vp.addEventListener('pointermove', onMove);
  vp.addEventListener('pointerup', onEnd);
  vp.addEventListener('pointercancel', onEnd);
}

export function wireViewportPointerAndWheel() {
  const vp = $('#mapViewport');
  vp.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (uiState.mapTool === 'pan' && e.target.closest('.map-token, .map-marker-pin')) return;
    if (uiState.mapTool === 'edit-bg' && e.target.closest('#mapBgBox')) return;
    vp.setPointerCapture(e.pointerId);

    if (uiState.mapTool === 'measure') { startMeasureDrag(vp, e); return; }
    if (uiState.mapTool === 'wall') { startWallDrawDrag(vp, e); return; }
    if (uiState.mapTool === 'wall-erase') {
      vp.releasePointerCapture(e.pointerId);
      const m = getState().map;
      const pt = clientToStageCoords(e.clientX, e.clientY);
      const threshold = Math.max(12, 16 / (m.zoom || 1));
      let bestIdx = -1; let bestDist = Infinity;
      (m.walls || []).forEach((w, idx) => {
        const d = pointToSegmentDist(pt.x, pt.y, w.x1, w.y1, w.x2, w.y2);
        if (d < bestDist) { bestDist = d; bestIdx = idx; }
      });
      if (bestIdx >= 0 && bestDist <= threshold) {
        m.walls.splice(bestIdx, 1);
        saveState('map');
        emitToast('Pared eliminada');
      }
      return;
    }
    if (uiState.mapTool === 'fog-cover' || uiState.mapTool === 'fog-reveal') {
      startFogBrushDrag(vp, e, uiState.mapTool === 'fog-reveal' ? 'reveal' : 'cover');
      return;
    }

    vp.classList.add('panning');
    const startX = e.clientX; const startY = e.clientY;
    const m = getState().map;
    const origPanX = m.panX; const origPanY = m.panY;

    const onPan = ev => {
      m.panX = origPanX + (ev.clientX - startX);
      m.panY = origPanY + (ev.clientY - startY);
      applyStageTransform();
    };
    const endPan = ev => {
      vp.classList.remove('panning');
      vp.releasePointerCapture(ev.pointerId);
      vp.removeEventListener('pointermove', onPan);
      vp.removeEventListener('pointerup', endPan);
      vp.removeEventListener('pointercancel', endPan);
      saveState();
    };
    vp.addEventListener('pointermove', onPan);
    vp.addEventListener('pointerup', endPan);
    vp.addEventListener('pointercancel', endPan);
  });

  vp.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = vp.getBoundingClientRect();
    zoomMapAroundPoint(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && uiState.currentMainView === 'map' && uiState.mapTool !== 'pan' && !$$('dialog[open]').length) {
      uiState.mapTool = 'pan';
      notify('map');
      emitToast('Modo normal activado');
    }
  });
}
