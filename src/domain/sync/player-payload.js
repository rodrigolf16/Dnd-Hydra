import { collectRealLightSources, isUmbralInvisible } from '../map/enemy-vision-rules.js';

export const PEER_PREFIX = 'ronda-hydra-dm-';
export const DEFAULT_PLAYER_BASE_URL = 'https://rodrigolf16.github.io/Dnd-Hydra/player.html';

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function normalizeRoomCode(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
}

export function peerIdForCode(code) {
  return `${PEER_PREFIX}${normalizeRoomCode(code).toLowerCase()}`;
}

export function buildJoinUrl(code, baseUrl = DEFAULT_PLAYER_BASE_URL) {
  const base = String(baseUrl || DEFAULT_PLAYER_BASE_URL).trim() || DEFAULT_PLAYER_BASE_URL;
  const clean = normalizeRoomCode(code);
  try {
    const u = new URL(base);
    if (clean) u.searchParams.set('room', clean);
    return u.toString();
  } catch {
    const sep = base.includes('?') ? '&' : '?';
    return clean ? `${base}${sep}room=${encodeURIComponent(clean)}` : base;
  }
}

export function buildPlayerPayload(state, campaignName = 'Las Grietas de Aethelgard') {
  if (!state || !Array.isArray(state.combatants)) return null;

  const mapTokens = state.map?.tokens || {};
  const lightSources = state.map ? collectRealLightSources(state) : [];
  const byId = id => state.combatants.find(c => c.id === id) || null;
  const isHiddenEnemy = c => c.type === 'enemy' && (!!mapTokens[c.id]?.hidden || !!mapTokens[c.id]?.staged);

  const active = byId(state.activeTurnId);
  const activeTurnName = !active ? '' : isHiddenEnemy(active) ? 'Adversario' : active.name;

  const initiativeOrder = state.combatants
    .filter(c => !isHiddenEnemy(c))
    .map(c => ({
      id: c.id,
      name: c.name,
      type: c.type === 'enemy' ? 'enemy' : 'pc',
      initRoll: c.initiativeRoll ?? c.initRoll ?? null,
      active: c.id === state.activeTurnId,
      defeated: !!(c.defeated || c.hp <= 0)
    }));

  const characters = state.combatants
    .filter(c => c.type !== 'enemy')
    .map(c => {
      const marked = c.markedTargetId ? byId(c.markedTargetId) : null;
      const safeAvatar = (typeof c.avatar === 'string' && c.avatar.length < 180000) ? c.avatar : '';
      return {
        id: c.id,
        name: c.name,
        avatar: safeAvatar,
        owner: c.owner || '',
        species: c.species || '',
        level: c.level || 1,
        className: c.className || '',
        hp: c.hp ?? 0,
        maxHp: c.maxHp ?? 1,
        ac: c.ac ?? 10,
        initiative: c.initiative ?? 0,
        initRoll: c.initiativeRoll ?? c.initRoll ?? null,
        speed: c.speed ?? 9,
        turnMovement: c.turnMovement ?? c.speed ?? 9,
        perception: c.perception ?? null,
        stats: c.stats || {},
        saves: c.saves || {},
        skills: c.skills || {},
        masteries: Array.isArray(c.masteries) ? c.masteries : [],
        feats: Array.isArray(c.feats) ? c.feats : [],
        features: Array.isArray(c.features) ? c.features : [],
        spells: c.spells || null,
        weapons: Array.isArray(c.weapons) ? c.weapons : [],
        equipment: Array.isArray(c.equipment) ? c.equipment : [],
        companion: c.companion || '',
        languages: Array.isArray(c.languages) ? c.languages : [],
        proficiencies: Array.isArray(c.proficiencies) ? c.proficiencies : [],
        background: c.background || '',
        details: Array.isArray(c.details) ? c.details : [],
        limitedUses: Array.isArray(c.limitedUses) ? c.limitedUses : [],
        customActions: Array.isArray(c.customActions) ? c.customActions : [],
        turnState: c.turnState || { action: true, bonus: true, reaction: true },
        turnMaxAttacks: c.turnMaxAttacks ?? 1,
        turnAttacksRemaining: c.turnAttacksRemaining ?? 1,
        attackSequenceOpen: !!c.attackSequenceOpen,
        turnBaseAttackMade: !!c.turnBaseAttackMade,
        turnNickUsed: !!c.turnNickUsed,
        turnRecklessActive: !!c.turnRecklessActive,
        turnFrenzyUsed: !!c.turnFrenzyUsed,
        turnDreadUsed: !!c.turnDreadUsed,
        turnSneakUsed: !!c.turnSneakUsed,
        turnMoved: !!c.turnMoved,
        raging: !!c.raging,
        steadyAimActive: !!c.steadyAimActive,
        markedTargetName: marked && !isHiddenEnemy(marked) ? marked.name : (marked ? 'Objetivo marcado' : ''),
        concentration: c.concentration || null,
        conditions: (() => {
          const base = Array.isArray(c.conditions) ? [...c.conditions] : [];
          if (state.map && isUmbralInvisible(c, mapTokens[c.id], state, lightSources)) {
            if (!base.some(x => /invisible/i.test(x))) base.unshift('👻 Invisible (oscuridad total)');
          }
          return base;
        })(),
        defeated: !!(c.defeated || c.hp <= 0)
      };
    });

  return {
    version: 1,
    campaignName,
    round: state.round || 1,
    paused: !!state.paused,
    activeTurnId: state.activeTurnId || '',
    activeTurnType: active?.type === 'enemy' ? 'enemy' : 'pc',
    activeTurnName,
    initiativeOrder,
    characters,
    sentAt: Date.now()
  };
}
