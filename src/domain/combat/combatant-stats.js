import { normalizeText } from '../shared/formatters.js';

export function getAbilityMod(c, key) {
  const raw = String(c?.stats?.[key] || '');
  const explicit = raw.match(/\(([+-]?\d+)\)/)?.[1];
  if (explicit !== undefined) return Number(explicit);
  const score = Number(raw.match(/\d+/)?.[0]);
  return Number.isFinite(score) ? Math.floor((score - 10) / 2) : 0;
}

export function getLevel(c) {
  const explicit = Number(c?.level);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const match = String(c?.className || '').match(/\d+/);
  return match ? Number(match[0]) : 1;
}

export function getProficiencyBonus(c) {
  return Math.ceil(getLevel(c) / 4) + 1;
}

export function getSkillBonus(c, skillName) {
  if (!c?.skills) return null;
  const target = normalizeText(skillName);
  for (const [k, v] of Object.entries(c.skills)) {
    if (normalizeText(k) === target) return Number(v);
  }
  return null;
}

export function getPerception(c) {
  const fromSkills = getSkillBonus(c, 'Percepción');
  return fromSkills !== null ? fromSkills : (c?.perception ?? getAbilityMod(c, 'Sab'));
}
