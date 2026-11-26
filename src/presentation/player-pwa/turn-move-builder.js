import { STANDARD_ACTIONS } from '../../data/rules/actions.js';
import { signed } from '../../domain/shared/formatters.js';
import { getAbilityMod, getSkillBonus } from '../../domain/combat/combatant-stats.js';
import { hasMellarAccess } from '../../domain/combat/combatant-features.js';
import { getSpellMeta, spellActionType } from '../../domain/combat/spell-rules.js';
import { buildBonusMoves, buildReactionMoves } from './turn-bonus-builder.js';

export function buildTurnMoveCatalog(c, res) {
  const canAttack = res.action || (res.attackSequenceOpen && res.attacksRemaining > 0);
  const hasMellar = hasMellarAccess(c);
  const canNick = hasMellar && !res.nickUsed && res.baseAttackMade;
  const attackWeapons = (c.weapons || []).filter(w => !w.consumable && w.attack != null);

  const weapons = attackWeapons.map(w => ({
    id: `atk-${w.name}`,
    kind: 'attack',
    attackMode: 'normal',
    resourceKind: 'action',
    icon: '⚔',
    title: w.name,
    weaponName: w.name,
    weapon: w,
    costLabel: res.maxAttacks > 1 ? `Acción (${res.attacksRemaining}/${res.maxAttacks} atq.)` : '1 Acción',
    preview: `1×d20 ${signed(w.attack)} · ${w.damage}`,
    desc: `${w.type || 'Ataque con arma'}${w.mastery ? ` · ★ ${w.mastery}` : ''}`,
    available: canAttack
  }));

  if (hasMellar) {
    const nickWeapon = attackWeapons.find(w => /mellar/i.test(w.mastery || '')) || attackWeapons[0];
    if (nickWeapon) {
      weapons.push({
        id: 'atk-nick',
        kind: 'attack',
        attackMode: 'nick',
        resourceKind: 'action',
        icon: '⚔',
        title: `Mellar · ${nickWeapon.name}`,
        weaponName: nickWeapon.name,
        weapon: nickWeapon,
        costLabel: 'Gratis (Mellar)',
        preview: `1×d20 ${signed(nickWeapon.attack)} · ${nickWeapon.damage}`,
        desc: res.baseAttackMade ? 'Ataque extra con arma ligera sin gastar Acción adicional.' : 'Primero hacé un ataque normal para habilitar Mellar.',
        available: canNick
      });
    }
  }

  const spells = (c.spells?.names || [])
    .filter(name => ['action', 'bonus'].includes(spellActionType(name, c)) && !/marca del cazador/i.test(name))
    .map(name => {
      const meta = getSpellMeta(name);
      const actType = spellActionType(name, c);
      return {
        id: `spell-${name}`,
        kind: 'spell',
        spellName: name,
        resourceKind: actType,
        icon: '✧',
        title: name,
        costLabel: actType === 'bonus' ? 'Adicional' : '1 Acción',
        preview: meta.damage ? `${meta.damage}` : meta.heal ? `Cura ${meta.heal}` : (meta.level === 0 ? 'Truco' : `Nv.${meta.level}`),
        desc: meta.desc,
        available: actType === 'bonus' ? res.bonus : res.action
      };
    });

  const bonus = buildBonusMoves(c, res, attackWeapons);
  const reactions = buildReactionMoves(c, res, attackWeapons);

  const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
  const standard = STANDARD_ACTIONS.map(act => ({
    id: act.id,
    kind: 'standard',
    standardId: act.id,
    resourceKind: 'action',
    icon: act.icon,
    title: act.name,
    costLabel: '1 Acción',
    preview: act.diceKind === 'stealth' ? `1×d20 ${signed(stealth)}` : 'Sin dados',
    desc: act.short,
    available: res.action
  }));

  return { weapons, spells, bonus, reactions, standard };
}
