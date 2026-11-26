import { analyzeDiceExpressions } from '../../domain/dice/dice-analyzer.js';
import { byId, emitToast, getState, notify, uiState, viewed } from '../store/encounter-store.js';
import { addLog } from './combat-log.js';
import { adjustHp } from './hp-actions.js';

export function incrementPoolDie(sides) {
  uiState.dicePool[sides] = (uiState.dicePool[sides] || 0) + 1;
  notify('dicePool');
}

export function decrementPoolDie(sides) {
  uiState.dicePool[sides] = Math.max(0, (uiState.dicePool[sides] || 0) - 1);
  notify('dicePool');
}

export function setPoolModifier(value) {
  uiState.poolModifier = Number.isFinite(value) ? value : 0;
  notify('dicePool');
}

export function clearPhysicalDicePool() {
  Object.keys(uiState.dicePool).forEach(k => { uiState.dicePool[k] = 0; });
  uiState.poolModifier = 0;
  notify('dicePool');
}

export function loadFormulaIntoPool(formula) {
  const clean = String(formula || '').trim();
  if (!clean) return false;
  const info = analyzeDiceExpressions([clean], false);
  Object.keys(uiState.dicePool).forEach(k => { uiState.dicePool[k] = 0; });
  info.diceMap.forEach((count, sides) => {
    if (uiState.dicePool[sides] !== undefined) uiState.dicePool[sides] = Math.max(0, count);
  });
  uiState.poolModifier = info.flatBonus;
  notify('dicePool');
  emitToast(`Cargado en el contador: ${info.formula}`);
  return true;
}

export function getDicePoolSummary() {
  const exprs = [];
  [20, 12, 10, 8, 6, 4].forEach(sides => {
    const count = uiState.dicePool[sides] || 0;
    if (count > 0) exprs.push(`${count}d${sides}`);
  });
  if (uiState.poolModifier !== 0) exprs.push(String(uiState.poolModifier));
  return analyzeDiceExpressions(exprs, false);
}

export function recordPhysicalPoolRoll(rawValue, applyMode = 'log', note = '') {
  const raw = String(rawValue ?? '').trim();
  const val = parseInt(raw, 10);
  if (!Number.isFinite(val)) {
    emitToast('Escribe el total numérico obtenido en tus dados físicos');
    return false;
  }
  const c = viewed();
  const state = getState();
  const summary = getDicePoolSummary();
  const formulaTxt = summary.formula !== '0' ? ` (${summary.formula})` : '';
  const noteSuffix = note ? ` · ${note}` : '';

  if (applyMode === 'damage') {
    const tgt = byId(state.currentTargetId) || c;
    adjustHp(tgt, -Math.abs(val), `${note || 'Dados físicos'}${formulaTxt}`);
  } else if (applyMode === 'heal') {
    const tgt = c;
    adjustHp(tgt, Math.abs(val), `${note || 'Curación física'}${formulaTxt}`);
  } else {
    const baseDetail = summary.formula !== '0' ? `${summary.breakdown} · Fórmula ${summary.formula}` : 'Tirada física libre';
    addLog(c.name, `obtiene ${val} en dados físicos`, `${baseDetail}${noteSuffix}`, '🎲');
    emitToast(`Resultado físico ${val} registrado`);
  }
  return true;
}
