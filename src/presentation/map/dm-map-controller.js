import { formatMeters } from '../../domain/shared/formatters.js';
import { getMapHeightMeters, getMapWidthMeters, setMapWidthMeters } from '../../domain/map/map-scale.js';
import { rotateMap90 } from '../../domain/map/map-rotation.js';
import { clampToStage } from '../../domain/map/map-geometry.js';
import { openDmMapTab, openPlayerMapTab } from '../../infrastructure/extension/chrome-bridge.js';
import { broadcastStateThrottled, emitToast, getState, notify, saveState, uiState } from '../../application/store/encounter-store.js';
import { addMapMarker, realignPlacedTokens, syncPlayerCamera } from '../../application/use-cases/map-actions.js';
import { $, closeDialog, openDialog } from '../shared/dom.js';
import { applyGridOverlayStyle } from '../shared/map-render-utils.js';
import { wireBgBoxDragAndResize, wireBgImageUploadAndControls } from './dm-map-bg-editor.js';
import { wireViewportPointerAndWheel } from './dm-map-pointer-tools.js';
import { fitMapToViewport, setMapTool, zoomMapAroundCenter } from './dm-map-viewport.js';

export function initDmMapController() {
  wireBgBoxDragAndResize();
  wireBgImageUploadAndControls();
  wireViewportPointerAndWheel();

  const handleRotate = clockwise => {
    const m = getState().map;
    rotateMap90(m, clockwise);
    saveState('map');
    requestAnimationFrame(() => fitMapToViewport());
    emitToast(`Mapa girado a ${m.rotation}°`);
  };
  $('#mapRotateLeftBtn')?.addEventListener('click', () => handleRotate(false));
  $('#mapRotateRightBtn')?.addEventListener('click', () => handleRotate(true));

  $('#mapClearBgBtn').addEventListener('click', () => {
    const m = getState().map;
    m.bgImage = ''; m.bgScale = 1; m.bgOffsetX = 0; m.bgOffsetY = 0;
    m.width = 1280; m.height = 840; m.natWidth = 1280; m.natHeight = 840; m.rotation = 0;
    if (uiState.mapTool === 'edit-bg') uiState.mapTool = 'pan';
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove('rondaMapBgImage').catch(() => {});
    }
    saveState('map');
    fitMapToViewport();
    saveState();
    emitToast('Fondo del mapa eliminado');
  });

  $('#mapGridToggle').addEventListener('change', e => { getState().map.showGrid = e.target.checked; saveState('map'); });
  $('#mapGridColor')?.addEventListener('input', e => {
    const m = getState().map;
    m.gridColor = e.target.value || '#d2e2ae';
    applyGridOverlayStyle($('#mapGridOverlay'), m);
    broadcastStateThrottled();
  });
  $('#mapGridColor')?.addEventListener('change', () => saveState());
  $('#mapSnapToggle').addEventListener('change', e => { getState().map.snap = e.target.checked; saveState(); });
  $('#mapTrackMoveToggle').addEventListener('change', e => { getState().map.trackMove = e.target.checked; saveState(); });

  $('#mapWidthMetersInput')?.addEventListener('change', e => {
    const targetM = parseFloat(e.target.value);
    if (!Number.isFinite(targetM) || targetM < 6) return;
    const m = getState().map;
    setMapWidthMeters(m, targetM);
    saveState('map');
    emitToast(`Escala ajustada: mapa de ${getMapWidthMeters(m)} × ${getMapHeightMeters(m)} m`);
  });

  $('#mapMetersPerSqSelect')?.addEventListener('change', e => {
    const m = getState().map;
    m.metersPerSquare = parseFloat(e.target.value) || 1.5;
    saveState('map');
    emitToast(`Escala: 1 casilla = ${formatMeters(m.metersPerSquare)} m`);
  });

  $('#mapGridSize').addEventListener('input', e => { getState().map.gridSize = Number(e.target.value) || 56; notify('map'); });
  $('#mapGridSize').addEventListener('change', () => saveState());
  $('#mapZoomIn').addEventListener('click', () => { zoomMapAroundCenter(1.15); saveState(); });
  $('#mapZoomOut').addEventListener('click', () => { zoomMapAroundCenter(1 / 1.15); saveState(); });
  $('#mapResetViewBtn').addEventListener('click', () => { fitMapToViewport(); saveState(); });
  $('#mapMeasureBtn').addEventListener('click', () => setMapTool('measure'));

  $('#mapWallDrawBtn')?.addEventListener('click', () => setMapTool('wall'));
  $('#mapWallEraseBtn')?.addEventListener('click', () => setMapTool('wall-erase'));
  $('#mapWallUndoBtn')?.addEventListener('click', () => {
    const m = getState().map;
    if (!m.walls?.length) { emitToast('No hay paredes para deshacer'); return; }
    m.walls.pop();
    saveState('map');
    emitToast('Última pared eliminada');
  });
  $('#mapWallClearBtn')?.addEventListener('click', () => {
    const m = getState().map;
    if (!m.walls?.length) return;
    if (!confirm(`¿Eliminar las ${m.walls.length} paredes del mapa?`)) return;
    m.walls = [];
    saveState('map');
    emitToast('Todas las paredes eliminadas');
  });

  $('#mapFogCoverBtn')?.addEventListener('click', () => setMapTool('fog-cover'));
  $('#mapFogRevealBtn')?.addEventListener('click', () => setMapTool('fog-reveal'));
  $('#mapFogBrushSize')?.addEventListener('input', e => { uiState.mapFogBrushRadius = Number(e.target.value) || 52; });
  $('#mapFogStrokeUndoBtn')?.addEventListener('click', () => {
    const m = getState().map;
    if (!m.fogStrokes?.length) { emitToast('No hay trazos manuales para deshacer'); return; }
    m.fogStrokes.pop();
    saveState('map');
    emitToast('Último trazo de niebla deshecho');
  });
  $('#mapFogStrokeClearBtn')?.addEventListener('click', () => {
    const m = getState().map;
    if (!m.fogStrokes?.length) { emitToast('No hay niebla manual pintada'); return; }
    if (!confirm('¿Limpiar toda la niebla manual dibujada?')) return;
    m.fogStrokes = [];
    saveState('map');
    emitToast('Niebla manual limpiada');
  });

  $('#mapResetPinsBtn').addEventListener('click', realignPlacedTokens);

  const openNewMarker = () => {
    $('#markerLabelInput').value = '';
    $('#markerIconSelect').value = '📍';
    $('#markerColorSelect').value = '#d3b878';
    $('#markerDmOnlyCheck').checked = false;
    openDialog($('#mapMarkerDialog'));
  };
  $('#mapAddMarkerBtn').addEventListener('click', openNewMarker);
  $('#mapAddMarkerSideBtn').addEventListener('click', openNewMarker);
  $('#saveMapMarkerBtn').addEventListener('click', () => {
    const m = getState().map;
    const vp = $('#mapViewport');
    const center = vp && vp.clientWidth
      ? clampToStage((vp.clientWidth / 2 - m.panX) / m.zoom, (vp.clientHeight / 2 - m.panY) / m.zoom, m)
      : { x: m.width / 2, y: m.height / 2 };
    addMapMarker({
      label: $('#markerLabelInput').value.trim() || 'Punto de interés',
      icon: $('#markerIconSelect').value,
      color: $('#markerColorSelect').value,
      dmOnly: $('#markerDmOnlyCheck').checked,
      x: center.x,
      y: center.y
    });
    closeDialog($('#mapMarkerDialog'));
  });

  $('#mapLightingSelect').addEventListener('change', e => {
    getState().map.lighting = e.target.value;
    saveState('map');
    emitToast(`Iluminación cambiada: ${e.target.selectedOptions[0]?.textContent || e.target.value}`);
  });
  $('#mapFogToggle').addEventListener('change', e => { getState().map.fogEnabled = e.target.checked; saveState('map'); });
  $('#mapFogMemoryToggle').addEventListener('change', e => { getState().map.fogMemory = e.target.checked; saveState(); });
  $('#mapShowVisionRingsToggle').addEventListener('change', e => { getState().map.showVisionRings = e.target.checked; saveState('map'); });
  $('#mapShowEnemyVisionToggle')?.addEventListener('change', e => { getState().map.showEnemyVisionRings = e.target.checked; saveState('map'); });
  $('#mapResetFogBtn').addEventListener('click', () => {
    getState().map.fogResetStamp = Date.now();
    saveState();
    emitToast('Niebla de guerra reiniciada en la pantalla de jugadores');
  });

  $('#syncPlayerCameraBtn').addEventListener('click', syncPlayerCamera);
  $('#openPlayerMapBtn').addEventListener('click', () => {
    saveState();
    openPlayerMapTab();
    emitToast('Abriendo Pantalla de Jugadores (con Niebla de Guerra)…');
  });
  $('#openDmMapTabBtn').addEventListener('click', () => {
    saveState();
    openDmMapTab();
  });
}
