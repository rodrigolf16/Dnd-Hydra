import { FEATURE_DESCRIPTIONS } from '../../data/rules/features.js';
import { SPELL_META } from '../../data/rules/spells.js';
import { getLevel } from './combatant-stats.js';

export function hasFeature(c, regex) {
  return [...(c?.features || []), ...(c?.feats || [])].some(f => regex.test(String(f)));
}

export function hasWeaponMasteryAccess(c) {
  return hasFeature(c, /maestr[ií]a con armas|maestro de armas/i);
}

export function hasMellarAccess(c) {
  if (!hasWeaponMasteryAccess(c)) return false;
  return (c?.masteries || []).some(m => /mellar/i.test(m)) &&
    (c?.weapons || []).some(w => /mellar/i.test(w.mastery || ''));
}

export function hasLightWeapons(c) {
  return (c?.weapons || []).some(w => w.attack != null && (w.tags || []).some(t => /ligera/i.test(t)));
}

export function hasHealingPotion(c) {
  return (c?.weapons || []).some(w => /poci[oó]n de curaci[oó]n/i.test(w.name)) ||
    (c?.equipment || []).some(e => /poci[oó]n de curaci[oó]n/i.test(e));
}

export function hasHuntersMark(c) {
  return hasFeature(c, /enemigo predilecto/i) ||
    (c?.spells?.names || []).some(s => /marca del cazador/i.test(s));
}

export function hasSneakAttack(c) {
  return hasFeature(c, /ataque furtivo/i);
}

export function getSneakDiceCount(c) {
  return Math.max(1, Math.ceil(getLevel(c) / 2));
}

export function getRageDamageBonus(c) {
  const lvl = getLevel(c);
  return lvl >= 16 ? 4 : lvl >= 9 ? 3 : 2;
}

export function isMeleeStrengthWeapon(w) {
  if (!w || w.range) return false;
  if (w.ability === 'Fue') return true;
  return !(w.tags || []).map(t => t.toLowerCase()).includes('distancia');
}

export function isSneakEligibleWeapon(w) {
  if (!w) return false;
  if (w.range) return true;
  const tags = (w.tags || []).map(t => t.toLowerCase());
  return tags.includes('sutil') || tags.includes('distancia');
}

export function limitedUseKeyFor(name) {
  const n = String(name || '').toLowerCase();
  if (/^furia$/.test(n)) return 'rage';
  if (/inspiración bárdica/.test(n)) return 'bardic-inspiration';
  if (/^forma salvaje$/.test(n)) return 'wild-shape';
  if (/cambio crónico/.test(n)) return 'chronal-shift';
  if (/recuperación arcana/.test(n)) return 'arcane-recovery';
  return null;
}

export function featureActivity(name) {
  const n = String(name || '').toLowerCase();
  if (/^furia$|inspiración bárdica|acción astuta|puntería certera|^forma salvaje$/.test(n)) return 'bonus';
  if (/cambio crónico|esquiva asombrosa/.test(n)) return 'reaction';
  if (/compañero salvaje/.test(n)) return 'action';
  return 'passive';
}

export function featureDescription(name, c) {
  const n = String(name || '').toLowerCase();
  if (FEATURE_DESCRIPTIONS[n]) return FEATURE_DESCRIPTIONS[n];
  if (/marca del cazador/.test(n)) return SPELL_META['marca del cazador'].desc;
  return `Rasgo o dote de ${c?.name || 'la ficha'}.`;
}

export function featureHint(name) {
  const n = String(name || '').toLowerCase();
  if (/inspiración bárdica/.test(n)) return 'Otorga un dado d8 de inspiración a un aliado como acción adicional.';
  if (/^forma salvaje$/.test(n)) return 'Adopta forma de bestia como acción adicional.';
  if (/cambio crónico/.test(n)) return 'Reacción: obliga a repetir una tirada a 9 m (gasta 1 uso).';
  if (/esquiva asombrosa/.test(n)) return 'Reacción: reduce a la mitad el daño de un ataque que impactó.';
  if (/compañero salvaje/.test(n)) return 'Acción: gasta 1 uso de Forma salvaje para invocar un familiar.';
  return 'Opción activable de ficha.';
}
