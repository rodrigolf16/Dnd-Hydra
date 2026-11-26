import {
  buildClonedEnemy,
  hydrateCombatant,
  nextNumberedEnemyName
} from '../../domain/combat/combatant-lifecycle.js';
import { ensureMapState } from '../../domain/map/map-geometry.js';
import { getDefaultEnemyDarkvisionMeters } from '../../domain/map/enemy-vision-rules.js';
import { findAutoEnemyImageUrl } from '../../infrastructure/browser/enemy-image-search.js';
import { byId, emitToast, getState, saveState, viewed } from '../store/encounter-store.js';
import { addLog } from './combat-log.js';

export function parseSpeedValue(raw, fallback = 9) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = parseFloat(String(raw ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function fetchAutoEnemyImages(batch) {
  const first = batch[0];
  if (!first) return;
  const found = await findAutoEnemyImageUrl(first.name);
  if (!found) return;
  let updated = 0;
  batch.forEach(item => {
    const target = byId(item.id);
    if (target && !target.avatar) {
      target.avatar = found;
      updated += 1;
    }
  });
  if (updated > 0) {
    saveState('all');
    emitToast(updated > 1
      ? `Imagen encontrada para ${updated} adversarios`
      : `Imagen encontrada automáticamente para ${first.name}`);
  }
}

export function createEnemies(spec) {
  const state = getState();
  ensureMapState(state);
  const usedNames = new Set(state.combatants.map(x => String(x.name || '').trim().toLowerCase()));
  const created = [];
  const stamp = Date.now();
  const baseName = spec.rawName || 'Adversario';

  for (let i = 0; i < spec.count; i += 1) {
    let enemyName = baseName;
    if (spec.count > 1 || !spec.rawName || usedNames.has(baseName.toLowerCase())) {
      enemyName = nextNumberedEnemyName(baseName, state.combatants, usedNames);
    } else {
      usedNames.add(enemyName.toLowerCase());
    }

    const enemy = hydrateCombatant({
      id: `enemy-${stamp}-${i}`,
      name: enemyName,
      avatar: spec.avatar,
      owner: 'Adversario',
      type: 'enemy',
      species: 'Enemigo',
      level: 1,
      className: 'Adversario',
      hp: spec.hp,
      maxHp: spec.maxHp,
      ac: spec.ac,
      initiative: spec.initMod,
      initiativeRoll: spec.initRoll,
      speed: spec.speed,
      weapons: [{ name: 'Ataque principal', attack: spec.atk, damage: spec.dmg, type: 'daño' }]
    });

    const defaultDv = getDefaultEnemyDarkvisionMeters(enemy);
    state.combatants.push(enemy);
    if (spec.stageInReserve) {
      state.map.tokens[enemy.id] = { x: 0, y: 0, size: 1, hidden: true, staged: true, darkvision: defaultDv, light: 'none' };
    } else {
      const gs = state.map.gridSize || 56;
      const col = Math.max(2, Math.floor((state.map.width || 1280) / gs) - 2 - Math.floor(i / 5));
      const row = 2 + (i % 5);
      state.map.tokens[enemy.id] = { x: col * gs + gs / 2, y: row * gs + gs / 2, size: 1, hidden: false, staged: false, darkvision: defaultDv, light: 'none' };
    }
    created.push(enemy);
  }

  if (spec.initRoll !== null) {
    state.initiativeRolled = true;
    state.combatants.sort((a, b) => (b.initiativeRoll ?? -999) - (a.initiativeRoll ?? -999));
  }
  state.currentTargetId = created[0].id;

  const labelSummary = spec.count > 1 ? `${spec.count} × ${baseName}` : created[0].name;
  addLog('DM', `añade ${labelSummary}`, `${spec.hp} PG · CA ${spec.ac}${spec.initRoll !== null ? ` · Iniciativa ${spec.initRoll}` : ''}${spec.stageInReserve ? ' · En reserva del mapa' : ''}`, '＋');
  saveState('all');
  const suffix = spec.stageInReserve ? ' en la Reserva del DM (arrástralos al mapa)' : '';
  emitToast(spec.avatar ? `${labelSummary} añadido${spec.count > 1 ? 's' : ''}${suffix}` : `${labelSummary} añadido${spec.count > 1 ? 's' : ''}${suffix} · buscando imagen…`);
  if (!spec.avatar) fetchAutoEnemyImages(created);
}

export function cloneEnemy(id) {
  const state = getState();
  const src = byId(id);
  if (!src || src.type !== 'enemy') return null;
  ensureMapState(state);
  const copy = buildClonedEnemy(src, state.combatants);
  state.combatants.push(copy);
  if (copy.initiativeRoll !== null && copy.initiativeRoll !== undefined) {
    state.combatants.sort((a, b) => (b.initiativeRoll ?? -999) - (a.initiativeRoll ?? -999));
  }
  const srcTok = state.map.tokens[src.id];
  state.map.tokens[copy.id] = {
    x: 0, y: 0, size: srcTok?.size || 1, hidden: true, staged: true, darkvision: srcTok?.darkvision ?? 0, light: 'none'
  };
  addLog('DM', `clona a ${src.name} → ${copy.name}`, `${copy.hp} PG · CA ${copy.ac} · En reserva del mapa`, '⧉');
  saveState('all');
  emitToast(`${copy.name} clonado en la Reserva del DM (arrástralo al mapa)`);
  return copy;
}

export function removeCombatant(id, confirmFn) {
  const state = getState();
  const c = byId(id);
  if (!c) return false;
  if (state.combatants.length <= 1) {
    emitToast('Debe quedar al menos un combatiente en el encuentro');
    return false;
  }
  const isPc = c.type !== 'enemy';
  const msg = isPc
    ? `¿Eliminar al personaje «${c.name}» del encuentro?\n\n(Si lo necesitas de vuelta más adelante, puedes restaurar el grupo desde ⚙ Ajustes → Reiniciar encuentro o sincronizarlo desde Nivel20).`
    : `¿Eliminar a «${c.name}» del encuentro?`;
  if (confirmFn && !confirmFn(msg)) return false;

  state.combatants = state.combatants.filter(x => x.id !== id);
  state.combatants.forEach(x => { if (x.markedTargetId === id) x.markedTargetId = null; });
  if (state.map?.tokens?.[id]) delete state.map.tokens[id];
  if (state.activeTurnId === id) state.activeTurnId = state.combatants[0]?.id || null;
  if (state.viewedId === id) state.viewedId = state.activeTurnId;
  if (state.currentTargetId === id) state.currentTargetId = state.combatants.find(x => x.id !== state.viewedId)?.id || null;
  addLog('DM', `retira a ${c.name}`, isPc ? 'Personaje eliminado del encuentro' : 'Adversario eliminado del encuentro', '−');
  saveState('all');
  emitToast(`${c.name} eliminado`);
  return true;
}

export function updateCombatantFromForm(form) {
  const c = viewed();
  const prevSpeed = Number(c.speed) || 9;
  c.name = form.name || c.name;
  c.level = Math.max(1, Math.min(20, form.level || 1));
  c.className = form.className || c.className;
  c.maxHp = Math.max(1, form.maxHp || c.maxHp || 1);
  c.hp = Math.max(0, Math.min(c.maxHp, form.hp));
  if (c.type === 'enemy') c.defeated = c.hp <= 0;
  c.ac = Math.max(1, form.ac || 10);
  c.speed = parseSpeedValue(form.speed, prevSpeed);
  c.initiative = form.initiative || 0;
  if (form.avatar) c.avatar = form.avatar;
  if (c.speed !== prevSpeed) {
    c.turnMovement = Math.min(c.speed, c.turnMovement + Math.max(0, c.speed - prevSpeed));
    c.turnState.movement = c.turnMovement > 0;
  }
  saveState('all');
  emitToast(`Ficha de ${c.name} actualizada`);
}
