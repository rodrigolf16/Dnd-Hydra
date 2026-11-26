import { normalizeRoomCode, peerIdForCode } from '../../domain/sync/player-payload.js';
import { PEER_CONFIG } from './peer-config.js';

export class RondaLiveClient {
  constructor({ onSync, onStatusChange, getSelectedCharacter }) {
    this.onSync = onSync || (() => {});
    this.onStatusChange = onStatusChange || (() => {});
    this.getSelectedCharacter = getSelectedCharacter || (() => ({ id: '', name: '' }));
    this.peer = null;
    this.conn = null;
    this.roomCode = '';
    this.status = 'offline';
    this.error = '';
    this.reconnectTimer = null;
    this.manualDisconnect = false;
  }

  emitStatus() {
    this.onStatusChange({ status: this.status, roomCode: this.roomCode, error: this.error });
  }

  connect(code) {
    const clean = normalizeRoomCode(code);
    if (!clean || clean.length < 4) {
      this.status = 'error';
      this.error = 'Escribe un código de sala válido (mín. 4 caracteres).';
      this.emitStatus();
      return;
    }
    if (typeof window.Peer !== 'function') {
      this.status = 'error';
      this.error = 'PeerJS no disponible. Usa el modo offline.';
      this.emitStatus();
      return;
    }

    this.disconnect(true);
    this.manualDisconnect = false;
    this.roomCode = clean;
    this.status = 'connecting';
    this.error = '';
    this.emitStatus();

    const peer = new window.Peer(undefined, PEER_CONFIG);
    this.peer = peer;

    peer.on('open', () => {
      if (this.peer !== peer) return;
      this.openDataConnection(peer, clean);
    });

    peer.on('error', err => {
      if (this.peer !== peer) return;
      const type = err?.type || '';
      this.status = 'error';
      this.error = type === 'peer-unavailable'
        ? `No se encontró la sala «${clean}». Verifica que el DM haya pulsado «Iniciar sala».`
        : 'No se pudo conectar con la mesa del DM. Sigues teniendo tu guía offline.';
      this.emitStatus();
      this.scheduleReconnect(type === 'peer-unavailable' ? 6000 : 5000);
    });

    peer.on('disconnected', () => {
      if (this.peer !== peer || this.manualDisconnect) return;
      this.status = 'reconnecting';
      this.emitStatus();
      this.scheduleReconnect(3000);
    });
  }

  openDataConnection(peer, cleanCode) {
    const conn = peer.connect(peerIdForCode(cleanCode), { reliable: true });
    this.conn = conn;

    const connectTimeout = setTimeout(() => {
      if (this.conn === conn && !conn.open && !this.manualDisconnect) {
        this.status = 'error';
        this.error = `Tiempo agotado buscando la sala «${cleanCode}». Revisa que el DM siga con la sala abierta.`;
        this.emitStatus();
        this.scheduleReconnect(5000);
      }
    }, 9000);

    conn.on('open', () => {
      clearTimeout(connectTimeout);
      if (this.conn !== conn) return;
      this.status = 'connected';
      this.error = '';
      this.emitStatus();
      this.sendHello();
    });

    conn.on('data', msg => {
      if (msg?.type === 'PLAYER_SYNC' && msg.payload) this.onSync(msg.payload);
    });

    conn.on('close', () => {
      clearTimeout(connectTimeout);
      if (this.conn !== conn || this.manualDisconnect) return;
      this.status = 'reconnecting';
      this.error = 'Conexión pausada · reintentando…';
      this.emitStatus();
      this.scheduleReconnect(3500);
    });

    conn.on('error', () => {
      clearTimeout(connectTimeout);
      if (this.conn !== conn || this.manualDisconnect) return;
      this.status = 'reconnecting';
      this.emitStatus();
      this.scheduleReconnect(4000);
    });
  }

  sendHello() {
    if (!this.conn || !this.conn.open) return;
    const sel = this.getSelectedCharacter() || {};
    try {
      this.conn.send({ type: 'HELLO', characterId: sel.id || '', characterName: sel.name || 'Jugador' });
    } catch {}
  }

  requestSync() {
    if (!this.conn || !this.conn.open) return;
    try { this.conn.send({ type: 'REQUEST_SYNC' }); } catch {}
  }

  sendPlayerAction(action) {
    if (!this.conn || !this.conn.open) return false;
    try {
      this.conn.send({ type: 'PLAYER_ACTION', action, sentAt: Date.now() });
      return true;
    } catch {
      return false;
    }
  }

  sendEndTurn(characterId, characterName) {
    if (!this.conn || !this.conn.open) return false;
    try {
      this.conn.send({ type: 'PLAYER_END_TURN', characterId, characterName, sentAt: Date.now() });
      return true;
    } catch {
      return false;
    }
  }

  scheduleReconnect(delayMs) {
    if (this.manualDisconnect || !this.roomCode) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.manualDisconnect && this.roomCode && this.status !== 'connected') {
        this.connect(this.roomCode);
      }
    }, delayMs);
  }

  reconnectIfNeeded() {
    if (!this.manualDisconnect && this.roomCode && this.status !== 'connected' && this.status !== 'connecting') {
      this.connect(this.roomCode);
    }
  }

  disconnect(silent = false) {
    this.manualDisconnect = true;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.conn) { try { this.conn.close(); } catch {} this.conn = null; }
    if (this.peer) { try { this.peer.destroy(); } catch {} this.peer = null; }
    if (!silent) {
      this.roomCode = '';
      this.status = 'offline';
      this.error = '';
      this.emitStatus();
    }
  }
}
