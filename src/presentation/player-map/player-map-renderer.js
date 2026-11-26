import { CAMPAIGN } from '../../data/campaign/index.js';
import { hpClass } from '../../domain/shared/formatters.js';
import { computeVisionSources, isPointVisibleToPlayers } from '../../domain/map/vision-rules.js';
import { collectRealLightSources, isUmbralInvisible } from '../../domain/map/enemy-vision-rules.js';
import { $ } from '../shared/dom.js';
import { applyBgImageRotation, applyGridOverlayStyle } from '../shared/map-render-utils.js';
import { renderFogOfWar } from './fog-renderer.js';
import { LIGHT_LABELS, renderUpcomingTurns } from './turns-sidebar-renderer.js';

export function renderPlayerMap(state, camera, onUpdateTurnsVis) {
  if (!state || !state.map) {
    const emptyEl = $('#playerEmptyMsg');
    if (emptyEl) emptyEl.hidden = false;
    return;
  }
  const m = state.map;
  const gs = m.gridSize || 56;
  const light = m.lighting || 'day';

  $('#playerCampaignName').textContent = CAMPAIGN.name || 'Las Grietas de Aethelgard';
  const act = state.combatants.find(c => c.id === state.activeTurnId);
  const actHiddenEnemy = act && act.type === 'enemy' && (!!m.tokens?.[act.id]?.hidden || !!m.tokens?.[act.id]?.staged);
  $('#playerTurnBanner').textContent = act
    ? `Turno actual: ${act.type === 'enemy' ? (actHiddenEnemy ? 'Adversario' : act.name) : act.name}`
    : 'Encuentro en curso';
  $('#playerLightBadge').textContent = LIGHT_LABELS[light] || LIGHT_LABELS.day;
  $('#playerRoundBadge').textContent = `RONDA ${state.round || 1}`;

  const bgImg = $('#playerBgImg');
  if (m.bgImage) {
    if (bgImg.getAttribute('src') !== m.bgImage) bgImg.src = m.bgImage;
    applyBgImageRotation(bgImg, m);
    bgImg.hidden = false;
    $('#playerEmptyMsg').hidden = true;
  } else {
    bgImg.hidden = true;
    bgImg.removeAttribute('src');
    bgImg.style.transform = '';
    $('#playerEmptyMsg').hidden = false;
  }

  applyGridOverlayStyle($('#playerGridOverlay'), m);

  onUpdateTurnsVis(false);
  if (!camera.isUserMoved()) camera.fitCamera();
  else camera.applyCamera();

  const sources = computeVisionSources(state);
  const lightSources = collectRealLightSources(state);
  const layer = $('#playerTokensLayer');
  layer.replaceChildren();

  state.combatants.forEach(c => {
    const tok = m.tokens?.[c.id];
    if (!tok || tok.hidden || tok.staged) return;
    const isEnemy = c.type === 'enemy';
    if (isEnemy && !isPointVisibleToPlayers(tok.x, tok.y, state, sources)) return;

    const px = Math.max(30, Math.round(gs * (Number(tok.size) || 1) * 0.92));
    const isUmbral = !isEnemy && isUmbralInvisible(c, tok, state, lightSources);
    const el = document.createElement('div');
    el.className = 'map-token player-readonly-token';
    if (isEnemy) el.classList.add('enemy-token');
    if (c.id === state.activeTurnId) el.classList.add('active-token');
    if (c.defeated || c.hp <= 0) el.classList.add('defeated-token');
    if (isUmbral) el.classList.add('umbral-invis-token');
    el.style.left = `${tok.x}px`;
    el.style.top = `${tok.y}px`;
    el.style.setProperty('--token-px', `${px}px`);

    const disc = document.createElement('div');
    disc.className = 'map-token-disc';
    if (c.avatar) {
      const img = document.createElement('img');
      img.src = c.avatar; img.alt = c.name;
      img.onerror = () => { img.remove(); disc.textContent = c.name.slice(0, 1).toUpperCase(); };
      disc.append(img);
    } else {
      disc.textContent = c.name.slice(0, 1).toUpperCase();
    }
    el.append(disc);

    if (!isEnemy) {
      const hpWrap = document.createElement('span');
      hpWrap.className = 'map-token-hp';
      const hpFill = document.createElement('i');
      hpFill.style.width = `${c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0}%`;
      const cls = hpClass(c.hp, c.maxHp);
      if (cls) hpFill.className = cls;
      hpWrap.append(hpFill);
      el.append(hpWrap);
    }

    const label = document.createElement('span');
    label.className = 'map-token-label';
    label.textContent = c.name;
    el.append(label);

    if (isUmbral) {
      const uPill = document.createElement('span');
      uPill.className = 'map-token-umbral-pill';
      uPill.textContent = '👻';
      el.append(uPill);
    }

    const isMarked = state.combatants.some(x => x.markedTargetId === c.id);
    if (isMarked || c.raging || (tok.light && tok.light !== 'none')) {
      const b = document.createElement('span');
      b.className = 'map-token-badge';
      b.textContent = tok.light && tok.light !== 'none' ? '🔥' : c.raging ? '⚡' : '◎';
      el.append(b);
    }
    layer.append(el);
  });

  (m.markers || []).forEach(mk => {
    if (mk.dmOnly) return;
    const isLightMarker = mk.icon === '🔥' || /antorcha|fuego|fogata|luz|linterna/i.test(mk.label || '');
    if (!isLightMarker && !isPointVisibleToPlayers(mk.x, mk.y, state, sources)) return;

    const el = document.createElement('div');
    el.className = 'map-marker-pin player-readonly-token';
    el.style.left = `${mk.x}px`;
    el.style.top = `${mk.y}px`;
    el.style.setProperty('--pin-color', mk.color || '#d3b878');
    el.innerHTML = '<div class="map-marker-head"><span></span></div><span class="map-marker-label"></span>';
    el.querySelector('.map-marker-head span').textContent = mk.icon || '📍';
    el.querySelector('.map-marker-label').textContent = mk.label || 'Pin';
    layer.append(el);
  });

  renderFogOfWar(state, sources);
  renderUpcomingTurns(state, sources);
}
