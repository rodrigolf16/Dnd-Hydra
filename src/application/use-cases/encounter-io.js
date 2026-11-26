import { buildDefaultState, hydrateCombatant } from '../../domain/combat/combatant-lifecycle.js';
import { ensureMapState } from '../../domain/map/map-geometry.js';
import { mergeSyncedNivel20Character } from '../../domain/sync/character-mapper.js';
import { emitToast, getState, saveState, setState, viewed } from '../store/encounter-store.js';
import { addLog } from './combat-log.js';
import { parseSpeedValue } from './combatant-crud.js';

export function applySyncedNivel20Characters(list) {
  const state = getState();
  list.forEach(incoming => {
    const res = mergeSyncedNivel20Character(state.combatants, incoming);
    if (!res) return;
    state.viewedId = res.target.id;
    addLog(
      'Nivel20',
      res.isNew ? `importa nuevo personaje: ${res.target.name}` : `sincroniza ficha de ${res.target.name}`,
      `PG ${res.target.hp}/${res.target.maxHp} · CA ${res.target.ac}${incoming.avatar ? ' · Retrato actualizado' : ''}`,
      '⟳'
    );
  });
  saveState('all');
  if (list.length > 1) {
    const withImgs = list.filter(c => c.avatar).length;
    emitToast(`✓ ${list.length} personajes actualizados desde Nivel20 (${withImgs} retratos reales)`);
  } else if (list.length === 1 && list[0]?.name) {
    emitToast(`✓ ${list[0].name} actualizado desde Nivel20`);
  }
}

export function importCharacterJsonData(d, mode) {
  const state = getState();
  const base = mode === 'replace' ? viewed() : {
    id: `char-${Date.now()}`, type: 'pc', name: 'Personaje importado', level: 1, className: 'Aventurero 1',
    hp: 20, maxHp: 20, ac: 12, initiative: 0, speed: 9,
    stats: { Fue: '10 (0)', Des: '10 (0)', Con: '10 (0)', Int: '10 (0)', Sab: '10 (0)', Car: '10 (0)' },
    features: [], feats: [], weapons: []
  };
  base.name = d.name || d.nombre || base.name;
  if (d.avatar || d.image || d.imagen) base.avatar = d.avatar || d.image || d.imagen;
  base.level = Number(d.level ?? d.nivel ?? base.level) || 1;
  base.className = d.class || d.clase || d.className || base.className;
  base.species = d.species || d.especie || base.species;
  base.hp = Number(d.hp?.current ?? d.hp?.actual ?? d.currentHp ?? (typeof d.hp === 'number' ? d.hp : base.hp));
  base.maxHp = Number(d.hp?.max ?? d.hp?.maximo ?? d.maxHp ?? base.maxHp ?? base.hp);
  base.ac = Number(d.ac ?? d.ca ?? base.ac);
  base.initiative = Number(d.initiative ?? d.iniciativa ?? base.initiative) || 0;
  base.speed = parseSpeedValue(d.speed ?? d.velocidad, base.speed || 9);
  if (d.stats || d.atributos) base.stats = d.stats || d.atributos;
  if (d.saves || d.salvaciones) base.saves = d.saves || d.salvaciones;
  if (d.skills || d.habilidades) base.skills = d.skills || d.habilidades;
  if (Array.isArray(d.weapons || d.armas)) base.weapons = d.weapons || d.armas;
  if (Array.isArray(d.features || d.rasgos)) base.features = d.features || d.rasgos;
  if (Array.isArray(d.feats || d.dotes)) base.feats = d.feats || d.dotes;
  if (d.spells || d.conjuros) base.spells = d.spells || d.conjuros;
  hydrateCombatant(base);
  if (mode === 'add') {
    state.combatants.push(base);
    state.viewedId = base.id;
  }
  addLog(base.name, mode === 'add' ? 'se une desde JSON' : 'actualiza ficha desde JSON', `${base.className} · PG ${base.hp}/${base.maxHp}`, '⇧');
  saveState('all');
  emitToast(`Ficha de ${base.name} importada`);
}

export function importEncounterData(loaded) {
  if (!Array.isArray(loaded?.combatants) || !loaded.combatants.length) {
    throw new Error('invalid');
  }
  loaded.combatants.forEach(hydrateCombatant);
  ensureMapState(loaded);
  setState(loaded);
  saveState('all');
  emitToast('Encuentro cargado');
}

export function resetEncounter() {
  setState(buildDefaultState());
  saveState('all');
  emitToast('Encuentro reiniciado');
}
