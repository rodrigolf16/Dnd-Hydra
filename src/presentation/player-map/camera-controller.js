import { $ } from '../shared/dom.js';
import { renderScaleBar } from '../shared/map-render-utils.js';

export function createPlayerCamera(getState, onTurnsVisibilityUpdate) {
  let viewZoom = 1;
  let viewPanX = 0;
  let viewPanY = 0;
  let userMovedCamera = false;
  let hudRevealTimer = null;

  function applyCamera() {
    const state = getState();
    if (!state?.map) return;
    const m = state.map;
    const stage = $('#playerStage');
    stage.style.width = `${m.width || 1280}px`;
    stage.style.height = `${m.height || 840}px`;
    stage.style.transform = `translate(${viewPanX}px, ${viewPanY}px) scale(${viewZoom})`;
    $('#pZoomLabel').textContent = `${Math.round(viewZoom * 100)}%`;
    renderScaleBar($('#playerScaleBar'), m, viewZoom);
  }

  function fitCamera() {
    const state = getState();
    const vp = $('#playerViewport');
    if (!vp || !state?.map || vp.clientWidth === 0 || vp.clientHeight === 0) return;
    const m = state.map;
    const w = m.width || 1280;
    const h = m.height || 840;
    const isFs = !!document.fullscreenElement;
    const pad = isFs ? 6 : 16;
    const maxFitZoom = isFs ? 3.5 : 2.4;
    viewZoom = Math.max(0.2, Math.min(maxFitZoom, Math.min((vp.clientWidth - pad * 2) / w, (vp.clientHeight - pad * 2) / h)));
    viewPanX = Math.round((vp.clientWidth - w * viewZoom) / 2);
    viewPanY = Math.round((vp.clientHeight - h * viewZoom) / 2);
    applyCamera();
  }

  function zoomAroundCenter(factor) {
    const vpEl = $('#playerViewport');
    if (!vpEl || vpEl.clientWidth === 0) return;
    userMovedCamera = true;
    const cx = vpEl.clientWidth / 2;
    const cy = vpEl.clientHeight / 2;
    const prev = viewZoom;
    viewZoom = Math.max(0.2, Math.min(3.5, Math.round(prev * factor * 1000) / 1000));
    viewPanX = Math.round(cx - ((cx - viewPanX) / prev) * viewZoom);
    viewPanY = Math.round(cy - ((cy - viewPanY) / prev) * viewZoom);
    applyCamera();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  }

  function revealFullscreenHudTemporarily() {
    if (!document.fullscreenElement) return;
    document.body.classList.add('hud-reveal');
    clearTimeout(hudRevealTimer);
    hudRevealTimer = setTimeout(() => {
      const hud = $('#playerMapHud');
      if (hud && !hud.matches(':hover')) document.body.classList.remove('hud-reveal');
    }, 2400);
  }

  function syncFullscreenState() {
    const isFs = !!document.fullscreenElement;
    document.body.classList.toggle('is-fullscreen', isFs);
    document.body.classList.remove('hud-reveal');
    const btn = $('#pFullscreenBtn');
    if (btn) {
      btn.textContent = isFs ? '✕ Salir' : '⛶ Pantalla completa';
      btn.title = isFs ? 'Salir de pantalla completa (Esc / F)' : 'Pantalla completa (tecla F)';
    }
    userMovedCamera = false;
    requestAnimationFrame(() => {
      onTurnsVisibilityUpdate(false);
      fitCamera();
    });
  }

  function wireControls(onCycleTurns) {
    const vp = $('#playerViewport');
    vp.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      vp.setPointerCapture(e.pointerId);
      vp.classList.add('panning');
      userMovedCamera = true;
      const sx = e.clientX; const sy = e.clientY;
      const ox = viewPanX; const oy = viewPanY;
      const onMove = ev => { viewPanX = ox + (ev.clientX - sx); viewPanY = oy + (ev.clientY - sy); applyCamera(); };
      const onUp = ev => {
        vp.classList.remove('panning');
        vp.releasePointerCapture(ev.pointerId);
        vp.removeEventListener('pointermove', onMove);
        vp.removeEventListener('pointerup', onUp);
        vp.removeEventListener('pointercancel', onUp);
      };
      vp.addEventListener('pointermove', onMove);
      vp.addEventListener('pointerup', onUp);
      vp.addEventListener('pointercancel', onUp);
    });

    vp.addEventListener('wheel', e => {
      e.preventDefault();
      userMovedCamera = true;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const rect = vp.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prev = viewZoom;
      viewZoom = Math.max(0.2, Math.min(3.5, prev * factor));
      viewPanX = mx - ((mx - viewPanX) / prev) * viewZoom;
      viewPanY = my - ((my - viewPanY) / prev) * viewZoom;
      applyCamera();
    }, { passive: false });

    $('#pZoomIn').addEventListener('click', () => zoomAroundCenter(1.15));
    $('#pZoomOut').addEventListener('click', () => zoomAroundCenter(1 / 1.15));
    $('#pFitBtn').addEventListener('click', () => { userMovedCamera = false; fitCamera(); });
    $('#pFullscreenBtn').addEventListener('click', toggleFullscreen);
    $('#pToggleTurnsBtn')?.addEventListener('click', onCycleTurns);
    $('#fsHoverZone')?.addEventListener('mouseenter', revealFullscreenHudTemporarily);
    $('#playerMapHud')?.addEventListener('mouseenter', () => clearTimeout(hudRevealTimer));
    $('#playerMapHud')?.addEventListener('mouseleave', () => {
      if (document.fullscreenElement) hudRevealTimer = setTimeout(() => document.body.classList.remove('hud-reveal'), 900);
    });
    document.addEventListener('fullscreenchange', syncFullscreenState);
    document.addEventListener('keydown', e => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); }
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); onCycleTurns(); }
    });
    window.addEventListener('resize', () => {
      onTurnsVisibilityUpdate(false);
      if (!userMovedCamera) fitCamera();
    });
  }

  return {
    applyCamera,
    fitCamera,
    wireControls,
    isUserMoved: () => userMovedCamera,
    syncFromDm(cam) {
      userMovedCamera = true;
      viewZoom = cam.zoom || 1;
      viewPanX = cam.panX || 0;
      viewPanY = cam.panY || 0;
      applyCamera();
    },
    resetFit() {
      userMovedCamera = false;
      fitCamera();
    }
  };
}
