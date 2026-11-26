import { CAMPAIGN } from '../../data/campaign/index.js';
import { hasFeature } from '../../domain/combat/combatant-features.js';
import {
  loadLocalTrackers,
  saveLocalTrackers
} from '../../infrastructure/storage/player-pwa-storage.js';

export { createGuideCard, getDefaultLimitedUses, renderDicePills } from './pwa-ui-helpers.js';

export const pwaState = {
  livePayload: null,
  liveClient: null,
  selectedCharId: '',
  activeTab: 'turn',
  rollMode: 'normal',
  critMode: false,
  selectedMove: null,
  waitingForDm: false,
  showSpentOptions: false,
  classMods: {
    huntersMark: false,
    dreadfulStrike: false,
    rage: false,
    reckless: false,
    frenzy: false,
    sneakAttack: false,
    steadyAim: false
  },
  spellFilter: 'all',
  checkMode: 'normal',
  selectedCheck: { label: 'Percepción', bonus: 0, kind: 'Habilidad' },
  lastNotifiedTurnKey: '',
  localTrackers: loadLocalTrackers()
};

export function persistLocalTrackers() {
  saveLocalTrackers(pwaState.localTrackers);
}

export function getLocalTracker(c) {
  const maxAtks = hasFeature(c, /ataque adicional|ataque extra/i) ? 2 : 1;
  const speed = Number(c.speed) || 9;
  if (!pwaState.localTrackers[c.id]) {
    pwaState.localTrackers[c.id] = {
      action: true,
      bonus: true,
      movement: true,
      movementMeters: speed,
      reaction: true,
      attacksRemaining: maxAtks,
      maxAttacks: maxAtks,
      baseAttackMade: false,
      nickUsed: false,
      uses: {}
    };
  }
  const loc = pwaState.localTrackers[c.id];
  if (loc.attacksRemaining === undefined) loc.attacksRemaining = loc.action ? maxAtks : 0;
  if (loc.maxAttacks === undefined) loc.maxAttacks = maxAtks;
  if (loc.movementMeters === undefined) loc.movementMeters = loc.movement ? speed : 0;
  return loc;
}

export function resetLocalTurnTracker(c) {
  const maxAtks = hasFeature(c, /ataque adicional|ataque extra/i) ? 2 : 1;
  const speed = Number(c.speed) || 9;
  const loc = getLocalTracker(c);
  loc.action = true;
  loc.bonus = true;
  loc.movement = true;
  loc.movementMeters = speed;
  loc.reaction = true;
  loc.attacksRemaining = maxAtks;
  loc.maxAttacks = maxAtks;
  loc.baseAttackMade = false;
  loc.nickUsed = false;
  persistLocalTrackers();
}

export function consumeLocalMove(c, move) {
  const loc = getLocalTracker(c);
  if (move.kind === 'attack') {
    if (move.attackMode === 'opportunity') loc.reaction = false;
    else if (move.attackMode === 'offhand') loc.bonus = false;
    else if (move.attackMode === 'nick') loc.nickUsed = true;
    else {
      loc.action = false;
      loc.baseAttackMade = true;
      loc.attacksRemaining = Math.max(0, (loc.attacksRemaining || 1) - 1);
    }
  } else if (move.kind === 'movement') {
    const dist = Number(move.distanceMeters) || Number(c.speed) || 9;
    loc.movementMeters = Math.max(0, Math.round((loc.movementMeters - dist) * 10) / 10);
    loc.movement = loc.movementMeters > 0;
  } else if (move.resourceKind === 'bonus' || ['mark', 'rage', 'cunning', 'steadyAim', 'potion'].includes(move.kind)) {
    loc.bonus = false;
    if (move.kind === 'steadyAim') { loc.movementMeters = 0; loc.movement = false; }
  } else if (move.resourceKind === 'reaction') {
    loc.reaction = false;
  } else if (move.resourceKind === 'action' || move.kind === 'standard' || move.kind === 'spell') {
    loc.action = false;
    loc.attacksRemaining = 0;
    if (move.standardId === 'std-dash') {
      loc.movementMeters = Math.round((loc.movementMeters + (Number(c.speed) || 9)) * 10) / 10;
      loc.movement = loc.movementMeters > 0;
    }
  }
  persistLocalTrackers();
}

export function getAllCharacters() {
  if (pwaState.livePayload && Array.isArray(pwaState.livePayload.characters) && pwaState.livePayload.characters.length) {
    return pwaState.livePayload.characters;
  }
  return CAMPAIGN.characters || [];
}

export function getSelectedCharacter() {
  if (!pwaState.selectedCharId) return null;
  return getAllCharacters().find(c => c.id === pwaState.selectedCharId) || null;
}

export function isLiveConnected() {
  return !!(pwaState.liveClient && pwaState.liveClient.status === 'connected' && pwaState.livePayload);
}

export function getTurnResources(c) {
  const maxAtks = hasFeature(c, /ataque adicional|ataque extra/i) ? 2 : 1;
  if (isLiveConnected() && c.turnState) {
    return {
      action: !!c.turnState.action,
      bonus: !!c.turnState.bonus,
      movement: (c.turnMovement ?? c.speed ?? 9) > 0,
      movementMeters: c.turnMovement ?? c.speed ?? 9,
      reaction: !!c.turnState.reaction,
      maxAttacks: c.turnMaxAttacks ?? maxAtks,
      attacksRemaining: c.turnAttacksRemaining ?? (c.turnState.action ? maxAtks : 0),
      attackSequenceOpen: !!c.attackSequenceOpen,
      baseAttackMade: !!c.turnBaseAttackMade,
      nickUsed: !!c.turnNickUsed,
      synced: true
    };
  }
  const loc = getLocalTracker(c);
  return {
    action: loc.action,
    bonus: loc.bonus,
    movement: loc.movement && loc.movementMeters > 0,
    movementMeters: loc.movement ? loc.movementMeters : 0,
    reaction: loc.reaction,
    maxAttacks: loc.maxAttacks || maxAtks,
    attacksRemaining: loc.attacksRemaining,
    attackSequenceOpen: loc.baseAttackMade && loc.attacksRemaining > 0,
    baseAttackMade: !!loc.baseAttackMade,
    nickUsed: !!loc.nickUsed,
    synced: false
  };
}
