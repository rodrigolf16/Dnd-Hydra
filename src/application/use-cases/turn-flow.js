import { formatMeters } from '../../domain/shared/formatters.js';
import { getAbilityMod } from '../../domain/combat/combatant-stats.js';
import { ensureUseCounters, freshTurn } from '../../domain/combat/combatant-lifecycle.js';
import { byId, emitToast, getState, saveState, uiState, viewed } from '../store/encounter-store.js';
import { addLog } from './combat-log.js';

function ensureValidTarget(state, selfId) {
  if (!state.currentTargetId || state.currentTargetId === selfId || !byId(state.currentTargetId)) {
    state.currentTargetId = state.combatants.find(x => x.id !== selfId && !x.defeated)?.id
      || state.combatants.find(x => x.id !== selfId)?.id
      || null;
  }
}

export function inspectCombatant(id) {
  if (!byId(id)) return;
  const state = getState();
  state.viewedId = id;
  ensureValidTarget(state, id);
  saveState('all');
}

export function advanceToTurn(id, { log = true, restore = true } = {}) {
  const c = byId(id);
  if (!c) return;
  const state = getState();
  state.activeTurnId = id;
  state.viewedId = id;
  if (restore || !c.turnState) freshTurn(c);
  ensureValidTarget(state, id);
  saveState('all');
  if (log) {
    addLog(c.name, 'comienza su turno', `Ronda ${state.round} · recursos y movimiento (${formatMeters(c.speed)} m) restaurados`, '✦');
  }
  emitToast(`Turno de ${c.name} (Ronda ${state.round})`);
}

export function nextTurn() {
  const state = getState();
  if (!state.combatants.length) return;
  const currentIdx = state.combatants.findIndex(c => c.id === state.activeTurnId);
  const total = state.combatants.length;
  let nextIdx = currentIdx;
  let wrapped = false;

  for (let step = 1; step <= total; step += 1) {
    const candidate = (currentIdx + step) % total;
    if (candidate === 0) wrapped = true;
    if (!state.skipDefeated || !state.combatants[candidate].defeated) {
      nextIdx = candidate;
      break;
    }
  }
  if (wrapped) state.round += 1;
  advanceToTurn(state.combatants[nextIdx].id, { log: true, restore: true });
}

export function swapInitiativePositions(idA, idB) {
  const state = getState();
  const idxA = state.combatants.findIndex(c => c.id === idA);
  const idxB = state.combatants.findIndex(c => c.id === idB);
  if (idxA < 0 || idxB < 0 || idxA === idxB) return;
  const a = state.combatants[idxA];
  const b = state.combatants[idxB];
  [state.combatants[idxA], state.combatants[idxB]] = [b, a];
  const tmpRoll = a.initiativeRoll;
  a.initiativeRoll = b.initiativeRoll;
  b.initiativeRoll = tmpRoll;
  addLog('DM', `intercambia iniciativa: ${a.name} ⇄ ${b.name}`, 'Dote Alerta / ajuste de orden', '⇄');
  uiState.swapMode = false;
  uiState.swapFirstId = null;
  saveState('all');
  emitToast(`Intercambiados: ${a.name} ⇄ ${b.name}`);
}

export function applyAllInitiatives() {
  const state = getState();
  state.initiativeRolled = true;
  state.combatants.sort((a, b) => {
    const av = a.initiativeRoll ?? -999;
    const bv = b.initiativeRoll ?? -999;
    if (bv !== av) return bv - av;
    if ((b.initiative || 0) !== (a.initiative || 0)) return (b.initiative || 0) - (a.initiative || 0);
    return getAbilityMod(b, 'Des') - getAbilityMod(a, 'Des');
  });
  state.round = 1;
  state.combatants.forEach(c => freshTurn(c));
  const first = state.combatants.find(c => !state.skipDefeated || !c.defeated) || state.combatants[0];
  if (first) {
    state.activeTurnId = first.id;
    state.viewedId = first.id;
  }
  addLog('DM', 'carga y ordena las iniciativas físicas', state.combatants.map(c => `${c.name} (${c.initiativeRoll ?? '—'})`).join(' · '), '✎');
  saveState('all');
  emitToast('Iniciativas ordenadas de mayor a menor');
}

export function recoverUses(rest) {
  const c = viewed();
  ensureUseCounters(c);
  let recovered = 0;
  c.limitedUses.forEach(counter => {
    if (counter.reset === 'never') return;
    if (rest === 'long') {
      if (counter.remaining < counter.max) { counter.remaining = counter.max; recovered += 1; }
    } else if (counter.reset === 'short' || counter.reset === 'either') {
      if (counter.remaining < counter.max) {
        counter.remaining = counter.shortRestore ? Math.min(counter.max, counter.remaining + counter.shortRestore) : counter.max;
        recovered += 1;
      }
    }
  });
  let hpMsg = '';
  if (rest === 'long') {
    if (c.hp < c.maxHp) { c.hp = c.maxHp; hpMsg = ` · PG restaurados (${c.hp}/${c.maxHp})`; }
    c.raging = false;
    c.concentration = null;
    c.markedTargetId = null;
    c.conditions = [];
    freshTurn(c);
  }
  addLog(c.name, rest === 'long' ? 'completa un Descanso largo' : 'completa un Descanso corto', `${recovered} contador${recovered === 1 ? '' : 'es'} recuperado${recovered === 1 ? '' : 's'}${hpMsg}`, '☾');
  saveState('all');
  emitToast(`${rest === 'long' ? 'Descanso largo' : 'Descanso corto'}: ${recovered} recuperados${hpMsg}`);
}

export function restoreTurnResources() {
  const c = viewed();
  freshTurn(c);
  saveState('all');
  emitToast(`Recursos del turno restaurados para ${c.name}`);
}

export function recordMovement(distance, note = '') {
  const c = viewed();
  if (distance > 0) {
    c.turnMovement = Math.max(0, Math.round((c.turnMovement - distance) * 10) / 10);
    c.turnMoved = true;
    c.turnState.movement = c.turnMovement > 0;
    addLog(c.name, `se desplaza ${formatMeters(distance)} m`, `${formatMeters(c.turnMovement)} m restantes${note ? ` · ${note}` : ''}`, '⌁');
    emitToast(`Movimiento registrado · quedan ${formatMeters(c.turnMovement)} m`);
  }
  saveState('all');
}

export function resetMovement() {
  const c = viewed();
  c.turnMovement = Number(c.speed) || 0;
  c.turnState.movement = c.turnMovement > 0;
  c.turnMoved = false;
  saveState('character');
  emitToast(`Movimiento restaurado a ${formatMeters(c.turnMovement)} m`);
}

export function toggleEncounterPause() {
  const state = getState();
  state.paused = !state.paused;
  saveState('header');
  emitToast(state.paused ? 'Encuentro pausado' : 'Encuentro reanudado');
}
