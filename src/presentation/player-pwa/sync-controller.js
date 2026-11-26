import { normalizeRoomCode } from '../../domain/sync/player-payload.js';
import {
  loadLastRoomCode,
  saveCachedSyncPayload,
  saveLastRoomCode
} from '../../infrastructure/storage/player-pwa-storage.js';
import { RondaLiveClient } from '../../infrastructure/sync/live-client.js';
import { $, $$, showToast } from '../shared/dom.js';
import { getSelectedCharacter, pwaState } from './pwa-state.js';

export function updateSyncBadges(info) {
  const pills = [$('#pickerSyncBtn'), $('#liveSyncBtn')];
  const map = {
    offline: { text: 'Offline', title: 'Modo Offline', detail: 'Usando fichas guardadas en tu celular.' },
    connecting: { text: 'Conectando…', title: `Conectando a ${info.roomCode}…`, detail: 'Buscando la extensión del DM…' },
    connected: { text: 'En vivo', title: `Conectado · Sala ${info.roomCode}`, detail: 'Recibiendo turnos, PG y fichas de Nivel20 en tiempo real.' },
    reconnecting: { text: 'Reconectando…', title: 'Reconectando…', detail: info.error || 'Esperando señal de la mesa del DM.' },
    error: { text: 'Sin sala', title: 'No conectado', detail: info.error || 'Sigues teniendo tu guía completa offline.' }
  };
  const meta = map[info.status] || map.offline;

  pills.forEach(p => {
    if (!p) return;
    p.className = `sync-pill ${info.status}`;
    const span = p.querySelector('span');
    if (span) span.textContent = meta.text;
  });

  const box = $('#syncStatusBox');
  if (box) box.className = `sync-status-box ${info.status}`;
  $('#syncModalTitle').textContent = meta.title;
  $('#syncModalDetail').textContent = meta.detail;
  $('#disconnectRoomBtn').hidden = info.status === 'offline';
  $('#connectRoomBtn').innerHTML = info.status === 'connected' ? 'Reconectar <span>⟳</span>' : 'Conectar en vivo <span>→</span>';
}

function getResourceSignature(payload, charId) {
  const ch = payload?.characters?.find(x => x.id === charId);
  if (!ch) return '';
  return JSON.stringify([
    payload.round,
    payload.activeTurnId,
    ch.turnState,
    ch.turnAttacksRemaining,
    ch.turnNickUsed,
    ch.turnMovement,
    ch.raging,
    ch.markedTargetName
  ]);
}

export function initPlayerSyncController({ onRenderApp, onRenderPicker }) {
  const client = new RondaLiveClient({
    getSelectedCharacter: () => {
      const c = getSelectedCharacter();
      return c ? { id: c.id, name: c.name } : { id: '', name: 'Eligiendo personaje…' };
    },
    onStatusChange: info => {
      updateSyncBadges(info);
      if (info.status === 'connected') {
        showToast(`✓ Conectado en vivo a la sala ${info.roomCode}`, '#playerToast', 2800);
        if ($('#connectDialog').open) $('#connectDialog').close();
      }
      if (getSelectedCharacter()) onRenderApp();
    },
    onSync: payload => {
      const prevSig = getResourceSignature(pwaState.livePayload, pwaState.selectedCharId);
      const nextSig = getResourceSignature(payload, pwaState.selectedCharId);
      pwaState.livePayload = payload;
      saveCachedSyncPayload(payload);
      const c = getSelectedCharacter();
      if (c) {
        if (c.raging) pwaState.classMods.rage = true;
        if (c.markedTargetName) pwaState.classMods.huntersMark = true;
        if (pwaState.waitingForDm && prevSig && prevSig !== nextSig) {
          pwaState.waitingForDm = false;
          pwaState.selectedMove = null;
          showToast('✓ Resultado registrado por el DM — elegí cómo seguir tu turno', '#playerToast', 3000);
        }
        onRenderApp();
      } else {
        onRenderPicker();
      }
    }
  });
  pwaState.liveClient = client;

  const connectDialog = $('#connectDialog');
  const openConnectModal = () => {
    const saved = loadLastRoomCode();
    if (!$('#roomCodeInput').value && saved) $('#roomCodeInput').value = saved;
    if (!connectDialog.open) connectDialog.showModal();
  };
  $('#pickerSyncBtn').addEventListener('click', openConnectModal);
  $('#liveSyncBtn').addEventListener('click', openConnectModal);
  $$('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => connectDialog.close()));

  $('#connectRoomBtn').addEventListener('click', () => {
    const code = normalizeRoomCode($('#roomCodeInput').value);
    if (!code || code.length < 4) {
      showToast('Escribe el código de sala del DM (mín. 4 caracteres)', '#playerToast', 2800);
      return;
    }
    $('#roomCodeInput').value = code;
    saveLastRoomCode(code);
    client.connect(code);
  });

  $('#disconnectRoomBtn').addEventListener('click', () => {
    client.disconnect();
    pwaState.livePayload = null;
    pwaState.waitingForDm = false;
    saveLastRoomCode('');
    showToast('Volviste al modo offline', '#playerToast', 2800);
    onRenderApp();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      client.reconnectIfNeeded();
      client.requestSync();
    }
  });
  window.addEventListener('online', () => client.reconnectIfNeeded());

  return client;
}
