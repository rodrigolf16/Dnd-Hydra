import { SPELL_META } from '../../data/rules/spells.js';
import { getAbilityMod } from './combatant-stats.js';

export function getSpellMeta(name) {
  return SPELL_META[String(name || '').toLowerCase()] || {
    level: 1,
    type: 'action',
    desc: `Conjuro de ficha (${name}).`
  };
}

export function spellActionType(name, c) {
  const customTime = c?.spells?.castingTimes?.[name];
  if (customTime && /minuto|hora|ritual/i.test(customTime)) return 'other';
  return getSpellMeta(name).type;
}

export function getSpellcastingMod(c) {
  const cls = String(c?.className || '').toLowerCase();
  if (/mago|art[ií]fice/.test(cls)) return getAbilityMod(c, 'Int');
  if (/bardo|hechicero|brujo|palad[ií]n/.test(cls)) return getAbilityMod(c, 'Car');
  return getAbilityMod(c, 'Sab');
}

export function getSpellSlotEntries(c) {
  const slots = [];
  Object.entries(c?.spells || {}).forEach(([key, value]) => {
    const match = key.match(/^level(\d+)Slots$/);
    if (match && Number(value) > 0) {
      slots.push({ level: Number(match[1]), max: Number(value), key: `spell-slot-${match[1]}` });
    }
  });
  return slots.sort((a, b) => a.level - b.level);
}
