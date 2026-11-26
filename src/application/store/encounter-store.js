import { hydrateCombatant } from '../../domain/combat/combatant-lifecycle.js';
import { ensureMapState } from '../../domain/map/map-geometry.js';
import { loadEncounterState, restoreChromeMapBg, saveEncounterState } from '../../infrastructure/storage/state-storage.js';
import { createVttChannel } from '../../infrastructure/storage/vtt-channel.js';

const vttChannel = createVttChannel();
const listeners = new Set();
const toastListeners = new Set();

let state = loadEncounterState();
let broadcastTimer = null;
let mobileHost = null;

export const uiState = {
  currentMainView: 'encounter',
  mapTool: 'pan',
  mapFogBrushRadius: 52,
  mapInitializedView: false,
  swapMode: false,
  swapFirstId: null,
  currentAction: null,
  currentWeaponOptions: [],
  rollMode: 'normal',
  hpDialogTargetId: null,
  dicePool: { 20: 0, 12: 0, 10: 0, 8: 0, 6: 0, 4: 0 },
  poolModifier: 0
};

export function getState() {
  return state;
}

export function setState(nextState) {
  state = nextState;
}

export function byId(id) {
  return state.combatants.find(c => c.id === id) || null;
}

export function activeTurnCombatant() {
  return byId(state.activeTurnId) || state.combatants[0] || null;
}

export function viewed() {
  return byId(state.viewedId) || activeTurnCombatant();
}

export function isViewingActiveTurn() {
  return state.viewedId === state.activeTurnId;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(scope = 'all') {
  listeners.forEach(fn => fn(scope));
}

export function subscribeToast(fn) {
  toastListeners.add(fn);
  return () => toastListeners.delete(fn);
}

export function emitToast(msg) {
  toastListeners.forEach(fn => fn(msg));
}

export function setMobileHost(host) {
  mobileHost = host;
}

export function getMobileHost() {
  return mobileHost;
}

export function postVttMessage(msg) {
  vttChannel.post(msg);
}

export function broadcastStateNow() {
  if (!state) return;
  vttChannel.post({ type: 'STATE_UPDATE', state });
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ rondaLiveState: state }).catch(() => {});
  }
  if (mobileHost) mobileHost.broadcastThrottled();
}

export function broadcastStateThrottled() {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    broadcastStateNow();
  }, 45);
}

export function saveState(notifyScope = null) {
  saveEncounterState(state);
  broadcastStateNow();
  if (notifyScope) notify(notifyScope);
}

export function initStoreSync() {
  vttChannel.subscribe(msg => {
    if (!msg) return;
    if (msg.type === 'REQUEST_STATE') {
      broadcastStateNow();
    } else if (msg.type === 'STATE_UPDATE' && msg.state && Array.isArray(msg.state.combatants)) {
      msg.state.combatants.forEach(hydrateCombatant);
      ensureMapState(msg.state);
      state = msg.state;
      notify('all');
    }
  });

  if (!state.map.bgImage) {
    restoreChromeMapBg(bgImage => {
      state.map.bgImage = bgImage;
      notify('map');
    });
  }
}
