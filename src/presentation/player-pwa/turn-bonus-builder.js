import { signed } from '../../domain/shared/formatters.js';
import {
  getRageDamageBonus,
  hasFeature,
  hasHealingPotion,
  hasHuntersMark,
  hasLightWeapons
} from '../../domain/combat/combatant-features.js';
import { getSpellMeta, spellActionType } from '../../domain/combat/spell-rules.js';

export function buildBonusMoves(c, res, attackWeapons) {
  const bonus = [];
  if (hasHuntersMark(c)) {
    bonus.push({
      id: 'bonus-mark',
      kind: 'mark',
      resourceKind: 'bonus',
      icon: '◎',
      title: c.markedTargetName ? `Cambiar Marca (${c.markedTargetName})` : 'Marca del cazador',
      costLabel: 'Adicional',
      preview: '+1d6 daño por golpe',
      desc: 'Marca a un enemigo (o trasládala gratis si cayó a 0 PG). Suma +1d6 a tus ataques.',
      available: res.bonus
    });
  }
  if (hasFeature(c, /^furia$/i)) {
    bonus.push({
      id: 'bonus-rage',
      kind: 'rage',
      resourceKind: 'bonus',
      icon: '🔥',
      title: c.raging ? 'Terminar Furia' : 'Entrar en Furia',
      costLabel: 'Adicional',
      preview: `+${getRageDamageBonus(c)} daño FUE`,
      desc: c.raging ? 'Desactiva tu Furia actual.' : `+${getRageDamageBonus(c)} daño cuerpo a cuerpo con Fuerza y resistencia física.`,
      available: c.raging || res.bonus
    });
  }
  if (hasFeature(c, /acción astuta/i)) {
    bonus.push({
      id: 'bonus-cunning',
      kind: 'cunning',
      resourceKind: 'bonus',
      icon: '◈',
      title: 'Acción astuta',
      costLabel: 'Adicional',
      preview: 'Correr / Destrabarse / Esconderse',
      desc: 'Usa tu acción adicional para Correr, Destrabarse o Esconderte (Sigilo).',
      available: res.bonus
    });
  }
  if (hasFeature(c, /punter[ií]a certera/i)) {
    bonus.push({
      id: 'bonus-steady',
      kind: 'steadyAim',
      resourceKind: 'bonus',
      icon: '🎯',
      title: 'Puntería certera',
      costLabel: 'Adicional',
      preview: 'Ventaja (Vel 0 m)',
      desc: 'Si no te moviste este turno, ganás Ventaja en tu próximo ataque.',
      available: res.bonus && !c.turnMoved
    });
  }
  if (hasFeature(c, /^forma salvaje$/i)) {
    bonus.push({
      id: 'bonus-wildshape',
      kind: 'feature',
      resourceKind: 'bonus',
      icon: '🐾',
      title: 'Forma salvaje',
      costLabel: 'Adicional',
      preview: 'Transformación',
      desc: 'Adopta forma de bestia como acción adicional (Círculo de la Luna).',
      available: res.bonus
    });
  }
  if (hasFeature(c, /inspiraci[oó]n b[aá]rdica/i)) {
    bonus.push({
      id: 'bonus-bardic',
      kind: 'feature',
      resourceKind: 'bonus',
      icon: '♪',
      title: 'Inspiración bárdica',
      costLabel: 'Adicional',
      preview: '1×d8 a un aliado',
      desc: 'Otorgás 1 dado d8 a un aliado a 18 m para sumar a una prueba, ataque o salvación.',
      available: res.bonus
    });
  }
  if (hasHealingPotion(c)) {
    bonus.push({
      id: 'bonus-potion',
      kind: 'potion',
      resourceKind: 'bonus',
      icon: '✚',
      title: 'Poción de curación',
      costLabel: 'Adicional',
      preview: '2×d4 + 2 PG',
      desc: 'Tirá 2×d4 + 2 en la mesa para recuperar PG.',
      available: res.bonus
    });
  }
  if (hasLightWeapons(c)) {
    const offWeapon = attackWeapons.find(w => (w.tags || []).some(t => /ligera/i.test(t))) || attackWeapons[0];
    if (offWeapon) {
      bonus.push({
        id: 'bonus-offhand',
        kind: 'attack',
        attackMode: 'offhand',
        resourceKind: 'bonus',
        icon: '⚔',
        title: `Mano secundaria · ${offWeapon.name}`,
        weaponName: offWeapon.name,
        weapon: offWeapon,
        costLabel: 'Adicional',
        preview: `1×d20 ${signed(offWeapon.attack)} · ${offWeapon.damage}`,
        desc: 'Ataque adicional con arma ligera usando tu Acción adicional.',
        available: res.bonus
      });
    }
  }
  return bonus;
}

export function buildReactionMoves(c, res, attackWeapons) {
  const meleeWeapon = attackWeapons.find(w => !w.range) || attackWeapons[0];
  const reactions = [
    {
      id: 'react-opp',
      kind: 'attack',
      attackMode: 'opportunity',
      resourceKind: 'reaction',
      icon: '↺',
      title: 'Ataque de oportunidad',
      weaponName: meleeWeapon?.name || '',
      weapon: meleeWeapon || null,
      costLabel: 'Reacción',
      preview: meleeWeapon ? `1×d20 ${signed(meleeWeapon.attack)}` : '1 ataque',
      desc: 'Cuando un enemigo sale de tu alcance sin Destrabarse.',
      available: res.reaction && !!meleeWeapon
    }
  ];
  if (hasFeature(c, /esquiva asombrosa/i)) {
    reactions.push({ id: 'react-uncanny', kind: 'feature', resourceKind: 'reaction', icon: '🛡', title: 'Esquiva asombrosa', costLabel: 'Reacción', preview: 'Mitad de daño', desc: 'Reduce a la mitad el daño de un ataque que te impacte.', available: res.reaction });
  }
  if (hasFeature(c, /cambio cr[oó]nico/i)) {
    reactions.push({ id: 'react-chronal', kind: 'feature', resourceKind: 'reaction', icon: '⏳', title: 'Cambio crónico', costLabel: 'Reacción', preview: 'Repetir 1×d20', desc: 'Obliga a repetir una tirada a 9 m.', available: res.reaction });
  }
  (c.spells?.names || []).forEach(name => {
    if (spellActionType(name, c) !== 'reaction') return;
    const meta = getSpellMeta(name);
    reactions.push({ id: `react-spell-${name}`, kind: 'spell', spellName: name, resourceKind: 'reaction', icon: '✧', title: name, costLabel: 'Reacción', preview: meta.damage || `Nv.${meta.level}`, desc: meta.desc, available: res.reaction });
  });
  return reactions;
}
