import { CAMPAIGN } from '../../data/campaign/index.js';
import { signed } from '../../domain/shared/formatters.js';
import { emitToast, getState, notify, saveState } from '../store/encounter-store.js';

export function addLog(actor, text, detail = '', symbol = '✦') {
  const state = getState();
  state.logEntries.unshift({
    time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    actor,
    text,
    detail,
    symbol
  });
  if (state.logEntries.length > 100) state.logEntries.length = 100;
  saveState();
  notify('log');
}

export function clearCombatLog() {
  const state = getState();
  state.logEntries = [];
  saveState('log');
  emitToast('Registro limpiado');
}

export function buildLogSummaryText(limit = 25) {
  const state = getState();
  return state.logEntries
    .slice(0, limit)
    .reverse()
    .map(e => `[${e.time}] ${e.actor} ${e.text}${e.detail ? ` — ${e.detail}` : ''}`)
    .join('\n');
}

export function buildInitiativeSummaryText() {
  const state = getState();
  const lines = [`=== ${CAMPAIGN.name} · Ronda ${state.round} ===`];
  state.combatants.forEach((c, idx) => {
    const turnMark = c.id === state.activeTurnId ? ' ◀ TURNO ACTUAL' : '';
    const initTxt = c.initiativeRoll != null ? `Init ${c.initiativeRoll}` : `Mod ${signed(c.initiative || 0)}`;
    lines.push(`${idx + 1}. ${c.name} (${initTxt} · PG ${c.hp}/${c.maxHp})${c.defeated ? ' [DERROTADO]' : ''}${turnMark}`);
  });
  return lines.join('\n');
}
