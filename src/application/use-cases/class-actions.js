import { formatMeters } from '../../domain/shared/formatters.js';
import { getRageDamageBonus, limitedUseKeyFor } from '../../domain/combat/combatant-features.js';
import { ensureUseCounters } from '../../domain/combat/combatant-lifecycle.js';
import { emitToast, saveState, viewed } from '../store/encounter-store.js';
import { addLog } from './combat-log.js';

export function useCounter(key, c = viewed()) {
  if (!c) return null;
  ensureUseCounters(c);
  return c.limitedUses.find(item => item.key === key) || null;
}

export function spendFeatureUse(name, c = viewed()) {
  const key = limitedUseKeyFor(name);
  if (!key) return true;
  const counter = useCounter(key, c);
  if (!counter) return true;
  if (counter.remaining <= 0) return false;
  counter.remaining -= 1;
  saveState('uses');
  return true;
}

export function toggleRage(c = viewed()) {
  if (c.raging) {
    c.raging = false;
    addLog(c.name, 'termina su Furia', 'Bonificador desactivado', '◌');
    saveState('all');
    emitToast(`${c.name} termina su Furia`);
    return;
  }
  if (!c.turnState.bonus) {
    emitToast('Ya gastó su Acción adicional este turno');
    return;
  }
  const counter = useCounter('rage', c);
  if (counter && counter.remaining <= 0) {
    emitToast('No quedan usos de Furia');
    return;
  }
  if (counter) counter.remaining -= 1;
  c.raging = true;
  c.turnState.bonus = false;
  addLog(c.name, 'entra en Furia', `+${getRageDamageBonus(c)} daño cuerpo a cuerpo con Fuerza y resistencia física`, '🔥');
  saveState('all');
  emitToast(`${c.name} entra en Furia (+${getRageDamageBonus(c)} daño)`);
}

export function activateSteadyAim(c = viewed()) {
  if (!c.turnState.bonus) {
    emitToast('Ya gastó su Acción adicional este turno');
    return;
  }
  if (c.turnMoved) {
    emitToast('Puntería certera requiere no haberse movido este turno');
    return;
  }
  c.turnState.bonus = false;
  c.turnMovement = 0;
  c.turnState.movement = false;
  c.steadyAimActive = true;
  addLog(c.name, 'usa Puntería certera', 'Velocidad 0 m este turno · ventaja en su próximo ataque', '◎');
  saveState('all');
  emitToast('Puntería certera activa');
}

export function resolveStandardAction(act, onOpenHideModal) {
  const c = viewed();
  if (!c.turnState.action) {
    emitToast('Ya gastó su Acción este turno');
    return;
  }
  if (act.id === 'std-hide') {
    onOpenHideModal({ name: 'Esconderse (Hide)', kind: 'action', isHide: true });
    return;
  }
  c.turnState.action = false;
  const speed = Number(c.speed) || 9;
  if (act.id === 'std-dash') {
    c.turnMovement = Math.round((c.turnMovement + speed) * 10) / 10;
    c.turnState.movement = c.turnMovement > 0;
    addLog(c.name, 'usa Correr (Dash)', `Suma +${formatMeters(speed)} m · quedan ${formatMeters(c.turnMovement)} m`, '⚡');
    emitToast(`Correr: +${formatMeters(speed)} m`);
  } else if (act.id === 'std-disengage') {
    if (!c.conditions.includes('Destrabado')) c.conditions.push('Destrabado');
    addLog(c.name, 'usa Destrabarse', 'Sin ataques de oportunidad este turno', '↺');
    emitToast(`${c.name} se destraba`);
  } else if (act.id === 'std-dodge') {
    if (!c.conditions.includes('Esquivando')) c.conditions.push('Esquivando');
    addLog(c.name, 'usa Esquivar', 'Desventaja en ataques contra él hasta su próximo turno', '⛨');
    emitToast(`${c.name} está Esquivando`);
  } else if (act.id === 'std-ready') {
    if (!c.conditions.includes('Preparando acción')) c.conditions.push('Preparando acción');
    addLog(c.name, 'prepara una acción (Ready)', 'Usará su Reacción al cumplirse el desencadenante', '⧗');
    emitToast(`${c.name} prepara una acción`);
  } else {
    addLog(c.name, act.name, act.short, act.icon);
    emitToast(`${act.name} registrada`);
  }
  saveState('all');
}

export function cancelHuntersMark(c = viewed()) {
  c.markedTargetId = null;
  if (c.concentration && /marca del cazador/i.test(c.concentration.spell)) c.concentration = null;
  addLog(c.name, 'suelta Marca del cazador', 'Concentración finalizada', '◌');
  saveState('all');
  emitToast('Marca del cazador retirada');
}

export function addCustomAction({ name, kind, dice, description }) {
  const c = viewed();
  c.customActions.push({ id: `custom-${Date.now()}`, name, kind, dice, description });
  saveState('actions');
  emitToast(`Acción «${name}» guardada`);
}

export function addLimitedUseCounter({ name, max, reset }) {
  const c = viewed();
  ensureUseCounters(c);
  c.limitedUses.push({ key: `custom-${Date.now()}`, name, max, remaining: max, reset, custom: true });
  saveState('uses');
  emitToast(`Contador «${name}» añadido`);
}
