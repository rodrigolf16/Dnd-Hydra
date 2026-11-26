import {
  PLAYER_CHAR_PREF_KEY,
  PLAYER_ROOM_PREF_KEY,
  PLAYER_CACHE_SYNC_KEY,
  PLAYER_LOCAL_TRACKERS_KEY
} from './constants.js';

export function loadSelectedCharId() {
  try { return localStorage.getItem(PLAYER_CHAR_PREF_KEY) || ''; } catch { return ''; }
}

export function saveSelectedCharId(id) {
  try { localStorage.setItem(PLAYER_CHAR_PREF_KEY, id || ''); } catch {}
}

export function loadLastRoomCode() {
  try { return localStorage.getItem(PLAYER_ROOM_PREF_KEY) || ''; } catch { return ''; }
}

export function saveLastRoomCode(code) {
  try {
    if (code) localStorage.setItem(PLAYER_ROOM_PREF_KEY, code);
    else localStorage.removeItem(PLAYER_ROOM_PREF_KEY);
  } catch {}
}

export function loadCachedSyncPayload() {
  try {
    const raw = localStorage.getItem(PLAYER_CACHE_SYNC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCachedSyncPayload(payload) {
  try { localStorage.setItem(PLAYER_CACHE_SYNC_KEY, JSON.stringify(payload)); } catch {}
}

export function loadLocalTrackers() {
  try {
    const raw = localStorage.getItem(PLAYER_LOCAL_TRACKERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalTrackers(trackers) {
  try { localStorage.setItem(PLAYER_LOCAL_TRACKERS_KEY, JSON.stringify(trackers)); } catch {}
}
