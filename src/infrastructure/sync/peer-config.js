import {
  DEFAULT_PLAYER_BASE_URL,
  generateRoomCode,
  normalizeRoomCode
} from '../../domain/sync/player-payload.js';
import {
  PLAYER_BASE_URL_STORAGE_KEY,
  ROOM_CODE_STORAGE_KEY
} from '../storage/constants.js';

export const PEER_CONFIG = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' }
    ]
  }
};

export function getSavedRoomCode() {
  try {
    const saved = normalizeRoomCode(localStorage.getItem(ROOM_CODE_STORAGE_KEY));
    if (saved && saved.length >= 4) return saved;
  } catch {}
  const fresh = generateRoomCode();
  try { localStorage.setItem(ROOM_CODE_STORAGE_KEY, fresh); } catch {}
  return fresh;
}

export function saveRoomCode(code) {
  const clean = normalizeRoomCode(code);
  if (!clean) return '';
  try { localStorage.setItem(ROOM_CODE_STORAGE_KEY, clean); } catch {}
  return clean;
}

export function getSavedPlayerBaseUrl() {
  try {
    const saved = String(localStorage.getItem(PLAYER_BASE_URL_STORAGE_KEY) || '').trim();
    if (saved) return saved;
  } catch {}
  return DEFAULT_PLAYER_BASE_URL;
}

export function savePlayerBaseUrl(url) {
  const clean = String(url || '').trim() || DEFAULT_PLAYER_BASE_URL;
  try { localStorage.setItem(PLAYER_BASE_URL_STORAGE_KEY, clean); } catch {}
  return clean;
}
