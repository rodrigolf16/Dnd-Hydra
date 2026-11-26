import { clampBgScale, computeStageDimensionsForImage } from '../../domain/map/map-rotation.js';
import { clampAllPlacedItemsToStage } from '../../domain/map/map-geometry.js';
import {
  broadcastStateThrottled,
  emitToast,
  getState,
  saveState,
  uiState
} from '../../application/store/encounter-store.js';
import { $, closeDialog, openDialog } from '../shared/dom.js';
import {
  clientToStageCoords,
  fitMapToViewport,
  setMapTool,
  syncBgTransformVisual
} from './dm-map-viewport.js';

export function wireBgBoxDragAndResize() {
  const bgBox = $('#mapBgBox');
  if (!bgBox) return;

  bgBox.addEventListener('pointerdown', e => {
    if (uiState.mapTool !== 'edit-bg' || e.button !== 0) return;
    e.stopPropagation();
    const corner = e.target.closest('.bg-resize-handle')?.dataset.resizeCorner || null;
    const m = getState().map;
    const startPt = clientToStageCoords(e.clientX, e.clientY);

    if (corner) {
      bgBox.setPointerCapture(e.pointerId);
      const centerX = (m.width / 2) + (Number(m.bgOffsetX) || 0);
      const centerY = (m.height / 2) + (Number(m.bgOffsetY) || 0);
      const startDist = Math.max(24, Math.hypot(startPt.x - centerX, startPt.y - centerY));
      const origScale = clampBgScale(m.bgScale ?? 1);

      const onResize = ev => {
        const cur = clientToStageCoords(ev.clientX, ev.clientY);
        const curDist = Math.max(12, Math.hypot(cur.x - centerX, cur.y - centerY));
        m.bgScale = clampBgScale(origScale * (curDist / startDist));
        syncBgTransformVisual();
        broadcastStateThrottled();
      };
      const endResize = ev => {
        bgBox.releasePointerCapture(ev.pointerId);
        bgBox.removeEventListener('pointermove', onResize);
        bgBox.removeEventListener('pointerup', endResize);
        bgBox.removeEventListener('pointercancel', endResize);
        saveState();
      };
      bgBox.addEventListener('pointermove', onResize);
      bgBox.addEventListener('pointerup', endResize);
      bgBox.addEventListener('pointercancel', endResize);
      return;
    }

    bgBox.setPointerCapture(e.pointerId);
    bgBox.classList.add('dragging-bg');
    const origX = Number(m.bgOffsetX) || 0;
    const origY = Number(m.bgOffsetY) || 0;

    const onBgMove = ev => {
      const cur = clientToStageCoords(ev.clientX, ev.clientY);
      m.bgOffsetX = Math.round(origX + (cur.x - startPt.x));
      m.bgOffsetY = Math.round(origY + (cur.y - startPt.y));
      syncBgTransformVisual();
      broadcastStateThrottled();
    };
    const endBgMove = ev => {
      bgBox.classList.remove('dragging-bg');
      bgBox.releasePointerCapture(ev.pointerId);
      bgBox.removeEventListener('pointermove', onBgMove);
      bgBox.removeEventListener('pointerup', endBgMove);
      bgBox.removeEventListener('pointercancel', endBgMove);
      saveState('map');
    };
    bgBox.addEventListener('pointermove', onBgMove);
    bgBox.addEventListener('pointerup', endBgMove);
    bgBox.addEventListener('pointercancel', endBgMove);
  });
}

function applyLoadedMapImage(url, natW, natH, successToast) {
  const m = getState().map;
  const stage = computeStageDimensionsForImage(natW, natH, 1600, 720);
  m.width = stage.width;
  m.height = stage.height;
  m.natWidth = stage.width;
  m.natHeight = stage.height;
  m.bgScale = 1;
  m.bgOffsetX = 0;
  m.bgOffsetY = 0;
  m.rotation = 0;
  m.bgImage = url;
  clampAllPlacedItemsToStage(m);
  saveState('map');
  requestAnimationFrame(() => { fitMapToViewport(); saveState(); });
  emitToast(successToast(stage));
}

export function wireBgImageUploadAndControls() {
  $('#mapUploadBtn').addEventListener('click', () => $('#mapBgFileInput').click());
  $('#mapBgFileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const natW = img.naturalWidth || img.width || 1280;
        const natH = img.naturalHeight || img.height || 840;
        const drawScale = Math.min(1, 1600 / Math.max(natW, natH));
        const drawW = Math.max(1, Math.round(natW * drawScale));
        const drawH = Math.max(1, Math.round(natH * drawScale));
        const canvas = document.createElement('canvas');
        canvas.width = drawW;
        canvas.height = drawH;
        canvas.getContext('2d').drawImage(img, 0, 0, drawW, drawH);
        applyLoadedMapImage(
          canvas.toDataURL('image/jpeg', 0.86),
          natW,
          natH,
          s => `Mapa cargado (${s.width}×${s.height}px) · Usa «✎ Editar imagen» para moverlo o escalarlo`
        );
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  $('#mapUrlBtn').addEventListener('click', () => {
    const bg = getState().map.bgImage;
    $('#mapBgUrlInput').value = bg && !bg.startsWith('data:') ? bg : '';
    openDialog($('#mapUrlDialog'));
  });

  $('#applyMapUrlBtn').addEventListener('click', () => {
    const url = $('#mapBgUrlInput').value.trim();
    if (!url) { emitToast('Escribe una URL de imagen válida'); return; }
    const img = new Image();
    img.onload = () => {
      applyLoadedMapImage(
        url,
        img.naturalWidth || img.width || 1280,
        img.naturalHeight || img.height || 840,
        () => 'Imagen aplicada · Usa «✎ Editar imagen» para moverla o escalarla'
      );
      closeDialog($('#mapUrlDialog'));
    };
    img.onerror = () => {
      const m = getState().map;
      m.bgImage = url;
      m.bgScale = 1;
      m.bgOffsetX = 0;
      m.bgOffsetY = 0;
      m.rotation = 0;
      saveState('map');
      closeDialog($('#mapUrlDialog'));
      emitToast('URL aplicada (si no carga, revisa que sea un enlace directo a imagen)');
    };
    img.src = url;
  });

  $('#mapEditBgBtn')?.addEventListener('click', () => setMapTool('edit-bg'));
  $('#mapBgDoneEditBtn')?.addEventListener('click', () => {
    uiState.mapTool = 'pan';
    saveState('map');
    emitToast('Cambios en la imagen guardados y bloqueados');
  });
  $('#mapBgScaleSlider')?.addEventListener('input', e => {
    getState().map.bgScale = clampBgScale(Number(e.target.value) / 100);
    syncBgTransformVisual();
    broadcastStateThrottled();
  });
  $('#mapBgScaleSlider')?.addEventListener('change', () => saveState());
  $('#mapBgScaleUpBtn')?.addEventListener('click', () => {
    const m = getState().map;
    m.bgScale = clampBgScale((Number(m.bgScale) || 1) + 0.1);
    saveState('map');
  });
  $('#mapBgScaleDownBtn')?.addEventListener('click', () => {
    const m = getState().map;
    m.bgScale = clampBgScale((Number(m.bgScale) || 1) - 0.1);
    saveState('map');
  });
  $('#mapBgResetTransformBtn')?.addEventListener('click', () => {
    const m = getState().map;
    m.bgScale = 1;
    m.bgOffsetX = 0;
    m.bgOffsetY = 0;
    saveState('map');
    emitToast('Imagen del mapa centrada al 100%');
  });
}
