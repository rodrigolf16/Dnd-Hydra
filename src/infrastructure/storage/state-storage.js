import { CAMPAIGN } from '../../data/campaign/index.js';
import { buildDefaultState, hydrateCombatant } from '../../domain/combat/combatant-lifecycle.js';
import { ensureMapState } from '../../domain/map/map-geometry.js';
import { ENCOUNTER_STORAGE_KEY } from './constants.js';

export function loadEncounterState() {
  try {
    const raw = localStorage.getItem(ENCOUNTER_STORAGE_KEY);
    if (!raw) return buildDefaultState();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.combatants) || !parsed.combatants.length) return buildDefaultState();
    parsed.combatants.forEach(hydrateCombatant);
    ensureMapState(parsed);
    if (!parsed.nivel20) parsed.nivel20 = { url: CAMPAIGN.nivel20Url || 'https://nivel20.com' };
    if (!Array.isArray(parsed.logEntries)) parsed.logEntries = [];
    if (!Array.isArray(parsed.enabledManuals)) parsed.enabledManuals = ['Manual del jugador'];
    if (parsed.skipDefeated === undefined) parsed.skipDefeated = true;
    if (!parsed.combatants.some(c => c.id === parsed.activeTurnId)) parsed.activeTurnId = parsed.combatants[0].id;
    if (!parsed.combatants.some(c => c.id === parsed.viewedId)) parsed.viewedId = parsed.activeTurnId;
    return parsed;
  } catch {
    return buildDefaultState();
  }
}

export function readRawEncounterState() {
  try {
    const raw = localStorage.getItem(ENCOUNTER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.combatants)) return null;
    ensureMapState(parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function saveEncounterState(state) {
  try {
    localStorage.setItem(ENCOUNTER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    try {
      const slim = { ...state, map: { ...state.map, bgImage: '' } };
      localStorage.setItem(ENCOUNTER_STORAGE_KEY, JSON.stringify(slim));
    } catch {}
  }
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ rondaLiveState: state }).catch(() => {});
    if (state.map?.bgImage) {
      chrome.storage.local.set({ rondaMapBgImage: state.map.bgImage }).catch(() => {});
    }
  }
}

export function restoreChromeMapBg(onLoaded) {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  chrome.storage.local.get('rondaMapBgImage', data => {
    if (data?.rondaMapBgImage) onLoaded(data.rondaMapBgImage);
  });
}

export function restoreChromeLiveState(onLoaded) {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  chrome.storage.local.get(['rondaLiveState', 'rondaMapBgImage'], data => {
    if (data?.rondaLiveState && Array.isArray(data.rondaLiveState.combatants)) {
      const st = data.rondaLiveState;
      ensureMapState(st);
      if (!st.map.bgImage && data.rondaMapBgImage) st.map.bgImage = data.rondaMapBgImage;
      onLoaded(st);
    }
  });
}
