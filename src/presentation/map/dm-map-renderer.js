import { hpClass } from '../../domain/shared/formatters.js';
import { getMapWidthMeters, getMetersPerSquare } from '../../domain/map/map-scale.js';
import { computeVisionSources, isPointVisibleToPlayers } from '../../domain/map/vision-rules.js';
import {
  collectRealLightSources,
  computeEnemyVisionSources,
  summarizeBattleSight
} from '../../domain/map/enemy-vision-rules.js';
import { getState, uiState } from '../../application/store/encounter-store.js';
import { ensureTokenPositions } from '../../application/use-cases/map-actions.js';
import { $ } from '../shared/dom.js';
import { applyGridOverlayStyle } from '../shared/map-render-utils.js';
import { attachMarkerDrag, attachTokenDrag } from './dm-map-drag.js';
import { renderDmManualFogCanvas, renderDmVisionRingsSvg, renderDmWallsSvg } from './dm-map-overlays.js';
import { renderReserveTray } from './dm-map-reserve-renderer.js';
import { renderMapMarkersList, renderMapRoster } from './dm-map-roster-renderer.js';
import { applyStageTransform, syncBgTransformVisual } from './dm-map-viewport.js';

function syncToolbarControls(m) {
  $('#mapGridToggle').checked = !!m.showGrid;
  const gridColorEl = $('#mapGridColor');
  if (gridColorEl) gridColorEl.value = m.gridColor || '#d2e2ae';
  $('#mapSnapToggle').checked = !!m.snap;
  $('#mapTrackMoveToggle').checked = !!m.trackMove;
  $('#mapGridSize').value = String(Math.round(m.gridSize || 56));
  const mpsSel = $('#mapMetersPerSqSelect');
  if (mpsSel) {
    const mps = String(getMetersPerSquare(m));
    if ([...mpsSel.options].some(o => o.value === mps)) mpsSel.value = mps;
  }
  const widthInp = $('#mapWidthMetersInput');
  if (widthInp && document.activeElement !== widthInp) {
    widthInp.value = String(Math.round(getMapWidthMeters(m)));
  }
  $('#mapLightingSelect').value = m.lighting || 'day';
  $('#mapFogToggle').checked = m.fogEnabled !== false;
  $('#mapFogMemoryToggle').checked = m.fogMemory !== false;
  $('#mapShowVisionRingsToggle').checked = m.showVisionRings !== false;
  const enemyVisEl = $('#mapShowEnemyVisionToggle');
  if (enemyVisEl) enemyVisEl.checked = m.showEnemyVisionRings !== false;

  if (!m.bgImage && uiState.mapTool === 'edit-bg') uiState.mapTool = 'pan';

  const tool = uiState.mapTool;
  $('#mapEditBgBtn')?.classList.toggle('tool-active', tool === 'edit-bg');
  if ($('#mapBgEditBar')) $('#mapBgEditBar').hidden = tool !== 'edit-bg';
  $('#mapMeasureBtn').classList.toggle('tool-active', tool === 'measure');
  $('#mapWallDrawBtn')?.classList.toggle('tool-active', tool === 'wall');
  $('#mapWallEraseBtn')?.classList.toggle('tool-active', tool === 'wall-erase');
  $('#mapFogCoverBtn')?.classList.toggle('tool-active', tool === 'fog-cover');
  $('#mapFogRevealBtn')?.classList.toggle('tool-active', tool === 'fog-reveal');

  const vpEl = $('#mapViewport');
  vpEl.classList.toggle('measuring', tool !== 'pan' && tool !== 'edit-bg');
  vpEl.dataset.tool = tool;
}

export function renderMapView() {
  ensureTokenPositions();
  const state = getState();
  const m = state.map;

  syncToolbarControls(m);

  const bgBox = $('#mapBgBox');
  const bgImg = $('#mapBgImg');
  if (m.bgImage) {
    if (bgImg.getAttribute('src') !== m.bgImage) bgImg.src = m.bgImage;
    if (bgBox) bgBox.hidden = false;
    syncBgTransformVisual();
    $('#mapEmptyHint').hidden = true;
  } else {
    if (bgBox) bgBox.hidden = true;
    bgImg.removeAttribute('src');
    $('#mapEmptyHint').hidden = false;
  }

  applyGridOverlayStyle($('#mapGridOverlay'), m);
  applyStageTransform();
  renderDmManualFogCanvas(m);
  renderDmWallsSvg(m);

  const visionSources = computeVisionSources(state);
  const lightSources = collectRealLightSources(state);
  const enemySources = computeEnemyVisionSources(state);
  const sightSummary = summarizeBattleSight(state, enemySources, lightSources);
  renderDmVisionRingsSvg(m, visionSources, enemySources);

  const layer = $('#mapTokensLayer');
  layer.replaceChildren();

  state.combatants.forEach(c => {
    const tok = m.tokens[c.id];
    if (!tok || tok.staged) return;
    const px = Math.max(30, Math.round(m.gridSize * (Number(tok.size) || 1) * 0.92));
    const hiddenInDark = c.type === 'enemy' && (tok.hidden || !isPointVisibleToPlayers(tok.x, tok.y, state, visionSources));
    const pcInfo = c.type !== 'enemy' ? sightSummary.pcSight[c.id] : null;
    const isUmbral = !!pcInfo?.isUmbralInvis;

    const el = document.createElement('div');
    el.className = 'map-token';
    if (c.type === 'enemy') el.classList.add('enemy-token');
    if (c.id === state.activeTurnId) el.classList.add('active-token');
    if (c.defeated || c.hp <= 0) el.classList.add('defeated-token');
    if (tok.hidden || hiddenInDark) el.classList.add('in-darkness-dm');
    if (isUmbral) el.classList.add('umbral-invis-token');
    if (tok.hidden) el.style.opacity = '0.5';
    el.dataset.tokenId = c.id;
    el.style.left = `${tok.x}px`;
    el.style.top = `${tok.y}px`;
    el.style.setProperty('--token-px', `${px}px`);

    const statusTip = tok.hidden
      ? ' · Oculto manualmente (solo DM)'
      : hiddenInDark
        ? ' · En oscuridad (invisible para jugadores)'
        : isUmbral
          ? ' · 👻 Invisible en oscuridad (Visión en la umbra)'
          : pcInfo?.seenBy?.length
            ? ` · 👁 Visto por: ${pcInfo.seenBy.join(', ')}`
            : '';
    el.title = `${c.name} · PG ${c.hp}/${c.maxHp} · CA ${c.ac ?? '—'}${statusTip}`;

    const disc = document.createElement('div');
    disc.className = 'map-token-disc';
    if (c.avatar) {
      const img = document.createElement('img');
      img.src = c.avatar;
      img.alt = c.name;
      img.onerror = () => { img.remove(); disc.textContent = c.name.slice(0, 1).toUpperCase(); };
      disc.append(img);
    } else {
      disc.textContent = c.name.slice(0, 1).toUpperCase();
    }

    const hpWrap = document.createElement('span');
    hpWrap.className = 'map-token-hp';
    const hpFill = document.createElement('i');
    hpFill.style.width = `${c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0}%`;
    const cls = hpClass(c.hp, c.maxHp);
    if (cls) hpFill.className = cls;
    hpWrap.append(hpFill);

    const label = document.createElement('span');
    label.className = 'map-token-label';
    label.textContent = c.name;
    el.append(disc, hpWrap, label);

    if (tok.hidden || hiddenInDark) {
      const darkPill = document.createElement('span');
      darkPill.className = 'map-token-dark-pill';
      darkPill.textContent = tok.hidden ? '◌' : '🌑';
      el.append(darkPill);
    } else if (isUmbral) {
      const umbralPill = document.createElement('span');
      umbralPill.className = 'map-token-umbral-pill';
      umbralPill.textContent = '👻';
      el.append(umbralPill);
    }

    const isMarked = state.combatants.some(x => x.markedTargetId === c.id);
    if (isMarked || c.raging || (tok.light && tok.light !== 'none')) {
      const b = document.createElement('span');
      b.className = 'map-token-badge';
      b.textContent = tok.light && tok.light !== 'none' ? '🔥' : c.raging ? '⚡' : '◎';
      el.append(b);
    }

    attachTokenDrag(el, c, tok);
    layer.append(el);
  });

  m.markers.forEach(mk => {
    const el = document.createElement('div');
    el.className = `map-marker-pin${mk.dmOnly ? ' dm-only-pin' : ''}`;
    el.style.left = `${mk.x}px`;
    el.style.top = `${mk.y}px`;
    el.style.setProperty('--pin-color', mk.color || '#d3b878');
    el.innerHTML = '<div class="map-marker-head"><span></span></div><span class="map-marker-label"></span>';
    el.querySelector('.map-marker-head span').textContent = mk.icon || '📍';
    el.querySelector('.map-marker-label').textContent = `${mk.dmOnly ? '🔒 ' : ''}${mk.label || 'Pin'}`;
    attachMarkerDrag(el, mk);
    layer.append(el);
  });

  renderReserveTray();
  renderMapRoster(visionSources, sightSummary);
  renderMapMarkersList();
}
