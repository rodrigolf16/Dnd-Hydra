import { normalizeKey } from '../shared/formatters.js';
import { hydrateCombatant } from '../combat/combatant-lifecycle.js';

export function mergeSyncedNivel20Character(combatants, incoming) {
  if (!incoming || !incoming.name) return null;
  const incomingKey = normalizeKey(incoming.name);
  let target = combatants.find(c => {
    const ck = normalizeKey(c.name);
    return ck === incomingKey || (ck.length >= 4 && incomingKey.includes(ck)) || (incomingKey.length >= 4 && ck.includes(incomingKey));
  });

  const isNew = !target;
  if (!target) {
    target = {
      id: `n20-${Date.now()}`,
      type: 'pc',
      name: incoming.name,
      level: incoming.level || 1,
      className: incoming.className || 'Aventurero',
      species: incoming.species || 'Personaje',
      hp: incoming.hp ?? 20,
      maxHp: incoming.maxHp ?? incoming.hp ?? 20,
      ac: incoming.ac ?? 12,
      initiative: incoming.initiative ?? 0,
      speed: incoming.speed ?? 9,
      stats: incoming.stats || { Fue: '10 (0)', Des: '10 (0)', Con: '10 (0)', Int: '10 (0)', Sab: '10 (0)', Car: '10 (0)' },
      features: [],
      feats: [],
      weapons: []
    };
    combatants.push(target);
  }

  if (incoming.avatar) target.avatar = incoming.avatar;
  if (incoming.level) target.level = incoming.level;
  if (incoming.className) target.className = incoming.className;
  if (incoming.species) target.species = incoming.species;
  if (incoming.hp != null && incoming.maxHp != null) {
    target.hp = incoming.hp;
    target.maxHp = Math.max(1, incoming.maxHp);
  }
  if (incoming.ac != null) target.ac = incoming.ac;
  if (incoming.initiative != null) target.initiative = incoming.initiative;
  if (incoming.speed != null) target.speed = incoming.speed;
  if (incoming.stats && Object.keys(incoming.stats).length >= 3) {
    target.stats = { ...(target.stats || {}), ...incoming.stats };
  }
  if (Array.isArray(incoming.weapons) && incoming.weapons.length) {
    const oldMap = new Map((target.weapons || []).map(w => [normalizeKey(w.name), w]));
    target.weapons = incoming.weapons.map(w => {
      const prev = oldMap.get(normalizeKey(w.name));
      return prev ? { ...prev, ...w, tags: prev.tags, mastery: prev.mastery, range: prev.range, ability: prev.ability } : w;
    });
  }
  if (incoming.spells) {
    target.spells = { ...(target.spells || {}), ...incoming.spells };
  }

  hydrateCombatant(target);
  return { target, isNew };
}

export function buildImportedCharacter(data, baseTarget = null) {
  const base = baseTarget || {
    id: `char-${Date.now()}`,
    type: 'pc',
    name: 'Nuevo personaje',
    level: 1,
    className: 'Aventurero',
    species: 'Personaje',
    hp: 20,
    maxHp: 20,
    ac: 12,
    initiative: 0,
    speed: 9,
    stats: { Fue: '10 (0)', Des: '10 (0)', Con: '10 (0)', Int: '10 (0)', Sab: '10 (0)', Car: '10 (0)' },
    features: [],
    feats: [],
    weapons: []
  };
  const merged = {
    ...base,
    name: data.name || data.nombre || base.name,
    level: Number(data.level ?? data.nivel) || base.level,
    className: data.className || data.clase || base.className,
    species: data.species || data.especie || base.species,
    hp: Number(data.hp ?? data.pg) || base.hp,
    maxHp: Number(data.maxHp ?? data.pgMax ?? data.hp ?? data.pg) || base.maxHp,
    ac: Number(data.ac ?? data.ca) || base.ac,
    speed: Number(data.speed ?? data.velocidad) || base.speed,
    initiative: Number(data.initiative ?? data.iniciativa) || base.initiative,
    avatar: data.avatar || data.imagen || base.avatar,
    stats: data.stats || data.atributos || base.stats,
    features: data.features || data.rasgos || base.features,
    weapons: data.weapons || data.armas || base.weapons,
    spells: data.spells || data.conjuros || base.spells
  };
  return hydrateCombatant(merged);
}
