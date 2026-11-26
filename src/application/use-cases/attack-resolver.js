import { signed } from '../../domain/shared/formatters.js';
import { analyzeDiceExpressions } from '../../domain/dice/dice-analyzer.js';
import {
  getRageDamageBonus,
  getSneakDiceCount,
  hasMellarAccess,
  isMeleeStrengthWeapon,
  isSneakEligibleWeapon
} from '../../domain/combat/combatant-features.js';
import { emitToast, saveState } from '../store/encounter-store.js';
import { addLog } from './combat-log.js';
import { useCounter } from './class-actions.js';

export function buildDamageSpec(c, weapon, target, flags) {
  const terms = [weapon.damage];
  const tags = [`${weapon.name} (${weapon.damage})`];
  const markExtra = target && c.markedTargetId === target.id;
  const dreadExtra = !c.turnDreadUsed && flags.dread && (useCounter('dreadful-strike', c)?.remaining || 0) > 0;
  const sneakExtra = !c.turnSneakUsed && flags.sneak && isSneakEligibleWeapon(weapon);
  const rageExtra = flags.rage && isMeleeStrengthWeapon(weapon);
  const frenzyExtra = !c.turnFrenzyUsed && flags.frenzy && c.raging && (flags.reckless || c.turnRecklessActive) && isMeleeStrengthWeapon(weapon);
  const critical = !!flags.critical;

  if (markExtra) { terms.push('1d6'); tags.push('Marca +1d6'); }
  if (dreadExtra) { terms.push('2d6'); tags.push('Emboscador +2d6'); }
  if (sneakExtra) { const n = getSneakDiceCount(c); terms.push(`${n}d6`); tags.push(`Furtivo +${n}d6`); }
  if (rageExtra) { const r = getRageDamageBonus(c); terms.push(String(r)); tags.push(`Furia +${r}`); }
  if (frenzyExtra) { terms.push('2d6'); tags.push('Frenesí +2d6'); }

  const info = analyzeDiceExpressions(terms, critical);
  return { ...info, tags, markExtra, dreadExtra, sneakExtra, rageExtra, frenzyExtra, critical };
}

export function resolveAttackAction({ c, actionName, attackMode, weapon, target, flags, d20Raw, dmgRaw, atkFormulaLabel }) {
  if (!weapon) {
    emitToast('Selecciona un arma');
    return false;
  }

  if (attackMode === 'opportunity') c.turnState.reaction = false;
  else if (attackMode === 'offhand') c.turnState.bonus = false;
  else if (attackMode === 'nick') c.turnNickUsed = true;
  else {
    c.turnState.action = false;
    c.attackSequenceOpen = true;
    c.turnAttacksRemaining = Math.max(0, c.turnAttacksRemaining - 1);
    c.turnBaseAttackMade = true;
  }

  if (c.turnAttacksRemaining <= 0 && (!hasMellarAccess(c) || c.turnNickUsed)) {
    c.attackSequenceOpen = false;
  }

  if (flags.recklessActive && !c.turnRecklessActive) {
    c.turnRecklessActive = true;
    c.recklessUntilTurn = true;
  }
  if (c.steadyAimActive) c.steadyAimActive = false;

  const dmgSpec = buildDamageSpec(c, weapon, target, flags);
  const hasD20 = d20Raw !== '' && Number.isFinite(Number(d20Raw));
  const hasDmg = dmgRaw !== '' && Number.isFinite(Number(dmgRaw));
  const d20Val = hasD20 ? Number(d20Raw) : null;
  const dmgVal = hasDmg ? Math.max(0, Number(dmgRaw)) : null;

  const targetAc = target?.ac ?? 10;
  const didHit = (hasDmg && dmgVal > 0)
    ? true
    : (hasD20 ? (d20Val === 20 || (d20Val !== 1 && d20Val + weapon.attack >= targetAc)) : false);

  if (didHit) {
    if (dmgSpec.dreadExtra) {
      c.turnDreadUsed = true;
      const counter = useCounter('dreadful-strike', c);
      if (counter && counter.remaining > 0) counter.remaining -= 1;
    }
    if (dmgSpec.sneakExtra) c.turnSneakUsed = true;
    if (dmgSpec.frenzyExtra) c.turnFrenzyUsed = true;
  }

  const atkPart = hasD20
    ? `d20 (${d20Val}) ${signed(weapon.attack)} = ${d20Val + weapon.attack} vs CA ${targetAc}`
    : atkFormulaLabel;
  const dmgPart = hasDmg ? `Daño físico: ${dmgVal} (${dmgSpec.formula})` : `Dados: ${dmgSpec.formula}`;

  if (hasDmg && dmgVal > 0 && target) {
    target.hp = Math.max(0, target.hp - dmgVal);
    let concNote = '';
    if (target.type === 'enemy' && target.hp <= 0) target.defeated = true;
    if (target.concentration) {
      const dc = Math.max(10, Math.floor(dmgVal / 2));
      concNote = ` · ¡Salv. CON CD ${dc} (${target.concentration.spell})!`;
      if (target.hp <= 0) {
        target.concentration = null;
        target.markedTargetId = null;
      }
    }
    addLog(c.name, `impacta a ${target.name} con ${weapon.name}`, `${atkPart} · ${dmgPart} · ${target.name}: ${target.hp}/${target.maxHp} PG${concNote}`, '⚔');
    emitToast(`${dmgVal} de daño aplicado a ${target.name}${concNote}`);
  } else if (hasD20 && !didHit) {
    addLog(c.name, `falla el ataque con ${weapon.name}`, `${target ? `${target.name} · ` : ''}${atkPart}`, '◌');
    emitToast(`Fallo registrado (${atkPart})`);
  } else {
    addLog(c.name, `realiza ${actionName} (${weapon.name}${target ? ` → ${target.name}` : ''})`, `${atkPart} · ${dmgPart}`, '⚔');
    emitToast(`Ataque registrado (${weapon.name})`);
  }

  saveState('all');
  return true;
}
