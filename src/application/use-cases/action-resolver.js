import { formatMeters, signed } from '../../domain/shared/formatters.js';
import { getAbilityMod, getSkillBonus } from '../../domain/combat/combatant-stats.js';
import { getSpellMeta, spellActionType } from '../../domain/combat/spell-rules.js';
import { byId, emitToast, saveState } from '../store/encounter-store.js';
import { addLog } from './combat-log.js';
import { adjustHp } from './hp-actions.js';
import { spendFeatureUse, useCounter } from './class-actions.js';

export function resolveHuntersMarkAction({ c, target, slotKey }) {
  if (!target) {
    emitToast('Selecciona un objetivo');
    return false;
  }
  const oldTarget = c.markedTargetId ? byId(c.markedTargetId) : null;
  const isFree = oldTarget && oldTarget.hp <= 0;
  if (!isFree && slotKey && !['none', 'ritual', 'cantrip'].includes(slotKey)) {
    const counter = useCounter(slotKey, c);
    if (counter && counter.remaining > 0) counter.remaining -= 1;
  }
  c.markedTargetId = target.id;
  c.concentration = { spell: 'Marca del cazador', targetId: target.id };
  c.turnState.bonus = false;
  addLog(c.name, isFree ? 'traslada Marca del cazador' : 'lanza Marca del cazador', `${target.name} marcado (+1d6 sumado a los dados físicos)`, '◎');
  saveState('all');
  emitToast(`${target.name} marcado (+1d6)`);
  return true;
}

export function resolveHealingPotionAction({ c, target, healRaw }) {
  c.turnState.bonus = false;
  const recipient = target || c;
  const healVal = healRaw !== '' && Number.isFinite(Number(healRaw)) ? Math.max(0, Number(healRaw)) : null;
  if (healVal !== null && healVal > 0) {
    adjustHp(recipient, healVal, `Poción de curación (${c.name} · 2d4+2 físico)`);
  } else {
    addLog(c.name, 'usa Poción de curación', `${recipient.name} · 2d4+2 (sin resultado anotado)`, '✚');
    saveState('all');
    emitToast('Poción registrada');
  }
  return true;
}

export function resolveHideAction({ c, d20Raw }) {
  c.turnState.action = false;
  const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
  if (d20Raw !== '' && Number.isFinite(Number(d20Raw))) {
    const d20 = Number(d20Raw);
    const total = d20 + stealth;
    if (total >= 15 && !c.conditions.includes('Oculto')) c.conditions.push('Oculto');
    addLog(c.name, 'intenta Esconderse', `d20 físico (${d20}) ${signed(stealth)} = ${total} vs CD 15 (${total >= 15 ? 'Oculto' : 'Falla'})`, '◐');
    emitToast(`Sigilo ${total} (${total >= 15 ? 'Oculto' : 'No oculto'})`);
  } else {
    addLog(c.name, 'intenta Esconderse', `1d20${signed(stealth)} vs CD 15`, '◐');
    emitToast('Esconderse registrado');
  }
  saveState('all');
  return true;
}

export function resolveCunningAction({ c, choice, d20Raw }) {
  c.turnState.bonus = false;
  const speed = Number(c.speed) || 9;
  if (choice === 'dash') {
    c.turnMovement = Math.round((c.turnMovement + speed) * 10) / 10;
    c.turnState.movement = c.turnMovement > 0;
    addLog(c.name, 'usa Acción astuta: Correr', `+${formatMeters(speed)} m (${formatMeters(c.turnMovement)} m restantes)`, '⚡');
    emitToast(`Correr: +${formatMeters(speed)} m`);
  } else if (choice === 'disengage') {
    if (!c.conditions.includes('Destrabado')) c.conditions.push('Destrabado');
    addLog(c.name, 'usa Acción astuta: Destrabarse', 'Sin ataques de oportunidad este turno', '↺');
    emitToast(`${c.name} se destraba`);
  } else {
    const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
    if (d20Raw !== '' && Number.isFinite(Number(d20Raw))) {
      const d20 = Number(d20Raw);
      const total = d20 + stealth;
      if (total >= 15 && !c.conditions.includes('Oculto')) c.conditions.push('Oculto');
      addLog(c.name, 'usa Acción astuta: Esconderse', `d20 físico (${d20}) ${signed(stealth)} = ${total} vs CD 15`, '◐');
    } else {
      addLog(c.name, 'usa Acción astuta: Esconderse', `1d20${signed(stealth)}`, '◐');
    }
    emitToast('Acción astuta registrada');
  }
  saveState('all');
  return true;
}

export function resolveSpellAction({ c, name, target, slotKey, d20Raw, valRaw }) {
  const meta = getSpellMeta(name);
  const actType = spellActionType(name, c);
  let slotText = meta.level === 0 ? 'Truco' : 'Sin espacio';
  if (slotKey && !['cantrip', 'ritual', 'none'].includes(slotKey)) {
    const counter = useCounter(slotKey, c);
    if (counter && counter.remaining > 0) {
      counter.remaining -= 1;
      slotText = counter.name;
    }
  } else if (slotKey === 'ritual') {
    slotText = 'Ritual';
  }

  if (['action', 'bonus', 'reaction'].includes(actType)) c.turnState[actType] = false;
  if (meta.concentration) {
    if (c.concentration && /marca del cazador/i.test(c.concentration.spell)) c.markedTargetId = null;
    c.concentration = { spell: name, targetId: target?.id || null };
  }

  const bits = [target ? target.name : null, slotText, meta.concentration ? 'Concentración' : null];
  if (d20Raw !== '' && Number.isFinite(Number(d20Raw))) {
    const d20 = Number(d20Raw);
    bits.push(`Ataque d20 (${d20})${signed(c.spells?.attack || 0)} = ${d20 + (c.spells?.attack || 0)}`);
  }
  if (valRaw !== '' && Number.isFinite(Number(valRaw))) {
    const val = Math.max(0, Number(valRaw));
    if (meta.heal) {
      adjustHp(target || c, val, `${name} (${c.name})`);
      return true;
    }
    if (meta.damage && target && val > 0) {
      bits.push(`Daño físico: ${val}`);
      addLog(c.name, `lanza ${name}`, bits.filter(Boolean).join(' · '), '✧');
      adjustHp(target, -val, `${name} (${c.name})`);
      return true;
    }
    bits.push(`Resultado físico: ${val}`);
  }

  addLog(c.name, `lanza ${name}`, bits.filter(Boolean).join(' · '), '✧');
  saveState('all');
  emitToast(`${name} registrado`);
  return true;
}

export function resolveGenericAction({ c, name, kind, customDice, resRaw }) {
  spendFeatureUse(name, c);
  if (['action', 'bonus', 'reaction'].includes(kind)) c.turnState[kind] = false;
  const detail = resRaw !== ''
    ? `Resultado físico: ${resRaw}${customDice ? ` (${customDice})` : ''}`
    : (customDice ? `Dados físicos: ${customDice}` : 'Actividad registrada');
  addLog(c.name, name, detail, '✦');
  saveState('all');
  emitToast(`${name} registrada`);
  return true;
}
