export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function signed(n) {
  const num = Number(n) || 0;
  return `${num >= 0 ? '+' : ''}${num}`;
}

export function formatMeters(val, comma = false) {
  const str = String(Math.max(0, Math.round((Number(val) || 0) * 10) / 10));
  return comma ? str.replace('.', ',') : str;
}

export function hpClass(hp, maxHp) {
  if (!maxHp || maxHp <= 0) return '';
  const pct = (hp / maxHp) * 100;
  return pct <= 25 ? 'hp-low' : pct <= 55 ? 'hp-mid' : '';
}

export function normalizeText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeKey(str) {
  return normalizeText(str).replace(/[^a-z0-9]/g, '');
}

export function ownerLabel(c) {
  return c.owner || (c.type === 'enemy' ? 'Adversario' : c.species || 'Combatiente');
}
