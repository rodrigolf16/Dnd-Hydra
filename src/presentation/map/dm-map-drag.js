import { formatMeters } from '../../domain/shared/formatters.js';
import { clampToStage } from '../../domain/map/map-geometry.js';
import {
  broadcastStateThrottled,
  emitToast,
  getState,
  saveState,
  uiState
} from '../../application/store/encounter-store.js';
import { addLog } from '../../application/use-cases/combat-log.js';
import { inspectCombatant } from '../../application/use-cases/turn-flow.js';
import { $ } from '../shared/dom.js';
import { calcGridDistanceMeters, clientToStageCoords, snapCoord } from './dm-map-viewport.js';

export function attachReserveDrag(el, combatant, tok) {
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('button')) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging-reserve');

    const vp = $('#mapViewport');
    const ghost = document.createElement('div');
    ghost.className = 'reserve-drag-ghost';
    if (combatant.avatar) {
      const img = document.createElement('img');
      img.src = combatant.avatar;
      img.alt = combatant.name;
      img.onerror = () => { img.remove(); ghost.textContent = combatant.name.slice(0, 1).toUpperCase(); };
      ghost.append(img);
    } else {
      ghost.textContent = combatant.name.slice(0, 1).toUpperCase();
    }
    const lbl = document.createElement('span');
    lbl.textContent = combatant.name;
    ghost.append(lbl);
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    document.body.append(ghost);

    const isOverViewport = (cx, cy) => {
      if (!vp) return false;
      const r = vp.getBoundingClientRect();
      return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    };

    const onMove = ev => {
      ghost.style.left = `${ev.clientX}px`;
      ghost.style.top = `${ev.clientY}px`;
      vp?.classList.toggle('drop-ready', isOverViewport(ev.clientX, ev.clientY));
    };

    const onUp = ev => {
      el.classList.remove('dragging-reserve');
      vp?.classList.remove('drop-ready');
      try { el.releasePointerCapture(ev.pointerId); } catch {}
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      ghost.remove();

      if (isOverViewport(ev.clientX, ev.clientY) && tok) {
        const m = getState().map;
        const raw = clientToStageCoords(ev.clientX, ev.clientY);
        let pt = clampToStage(raw.x, raw.y, m);
        if (m.snap) {
          pt = clampToStage(snapCoord(pt.x, m.gridSize, tok.size || 1), snapCoord(pt.y, m.gridSize, tok.size || 1), m);
        }
        const reveal = $('#mapRevealOnDropCheck') ? $('#mapRevealOnDropCheck').checked : true;
        tok.x = pt.x;
        tok.y = pt.y;
        tok.staged = false;
        tok.hidden = !reveal;
        saveState('all');
        emitToast(reveal
          ? `${combatant.name} ubicado en el mapa (visible si está en visión)`
          : `${combatant.name} ubicado en el mapa (oculto · solo DM)`);
      }
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  });
}

export function attachTokenDrag(el, combatant, tok) {
  el.addEventListener('pointerdown', e => {
    if (uiState.mapTool !== 'pan' || e.button !== 0) return;
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    const startPt = clientToStageCoords(e.clientX, e.clientY);
    const origX = tok.x;
    const origY = tok.y;
    let movedPx = 0;

    const onMove = ev => {
      const m = getState().map;
      const cur = clientToStageCoords(ev.clientX, ev.clientY);
      const dx = cur.x - startPt.x;
      const dy = cur.y - startPt.y;
      movedPx = Math.hypot(dx, dy);
      const clamped = clampToStage(origX + dx, origY + dy, m);
      tok.x = clamped.x;
      tok.y = clamped.y;
      el.style.left = `${tok.x}px`;
      el.style.top = `${tok.y}px`;
      const dist = calcGridDistanceMeters(origX, origY, tok.x, tok.y);
      const badge = $('#mapDragDistance');
      badge.hidden = false;
      badge.textContent = `${combatant.name}: ${formatMeters(dist.meters)} m (${dist.squares} casillas)`;
      broadcastStateThrottled();
    };

    const onUp = ev => {
      el.classList.remove('dragging');
      el.releasePointerCapture(ev.pointerId);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      $('#mapDragDistance').hidden = true;

      if (movedPx < 4) {
        inspectCombatant(combatant.id);
        return;
      }

      const state = getState();
      const m = state.map;
      if (m.snap) {
        const snapped = clampToStage(snapCoord(tok.x, m.gridSize, tok.size || 1), snapCoord(tok.y, m.gridSize, tok.size || 1), m);
        tok.x = snapped.x;
        tok.y = snapped.y;
      }

      const dist = calcGridDistanceMeters(origX, origY, tok.x, tok.y);
      if (m.trackMove && dist.meters > 0 && combatant.id === state.activeTurnId) {
        combatant.turnMovement = Math.max(0, Math.round((combatant.turnMovement - dist.meters) * 10) / 10);
        combatant.turnMoved = true;
        combatant.turnState.movement = combatant.turnMovement > 0;
        addLog(combatant.name, `se mueve ${formatMeters(dist.meters)} m en el Mapa 2D`, `${formatMeters(combatant.turnMovement)} m restantes`, '⌁');
        emitToast(`${combatant.name} movido ${formatMeters(dist.meters)} m (quedan ${formatMeters(combatant.turnMovement)} m)`);
      }
      saveState('all');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  });
}

export function attachMarkerDrag(el, mk) {
  el.addEventListener('pointerdown', e => {
    if (uiState.mapTool !== 'pan' || e.button !== 0) return;
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    const startPt = clientToStageCoords(e.clientX, e.clientY);
    const origX = mk.x;
    const origY = mk.y;

    const onMove = ev => {
      const cur = clientToStageCoords(ev.clientX, ev.clientY);
      const clamped = clampToStage(origX + (cur.x - startPt.x), origY + (cur.y - startPt.y), getState().map);
      mk.x = clamped.x;
      mk.y = clamped.y;
      el.style.left = `${mk.x}px`;
      el.style.top = `${mk.y}px`;
    };

    const onUp = ev => {
      el.classList.remove('dragging');
      el.releasePointerCapture(ev.pointerId);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      saveState();
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
  });
}
