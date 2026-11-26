import { generateRoomCode, peerIdForCode } from '../../domain/sync/player-payload.js';
import { getSavedRoomCode, PEER_CONFIG, saveRoomCode } from './peer-config.js';

export class RondaLiveHost {
  constructor({ getPayload, onStatusChange, onClientMessage }) {
    this.getPayload = getPayload;
    this.onStatusChange = onStatusChange || (() => {});
    this.onClientMessage = onClientMessage || (() => {});
    this.peer = null;
    this.code = getSavedRoomCode();
    this.status = 'idle';
    this.error = '';
    this.clients = new Map();
    this.pushTimer = null;
  }

  isActive() {
    return this.status === 'open' || this.status === 'connecting';
  }

  getConnectedClients() {
    return [...this.clients.values()].map(c => ({
      peerId: c.conn.peer,
      characterId: c.characterId || '',
      characterName: c.characterName || 'Jugador conectando…'
    }));
  }

  emitStatus() {
    this.onStatusChange({
      status: this.status,
      code: this.code,
      error: this.error,
      clients: this.getConnectedClients()
    });
  }

  start(explicitCode) {
    if (typeof window.Peer !== 'function') {
      this.status = 'error';
      this.error = 'No se cargó PeerJS localmente (lib/peerjs.min.js).';
      this.emitStatus();
      return;
    }

    this.code = explicitCode ? (saveRoomCode(explicitCode) || getSavedRoomCode()) : getSavedRoomCode();
    this.stop(true);
    this.status = 'connecting';
    this.error = '';
    this.emitStatus();

    const peer = new window.Peer(peerIdForCode(this.code), PEER_CONFIG);
    this.peer = peer;

    peer.on('open', () => {
      if (this.peer !== peer) return;
      this.status = 'open';
      this.error = '';
      this.emitStatus();
    });

    peer.on('connection', conn => {
      if (this.peer !== peer) return;
      this.handleConnection(conn);
    });

    peer.on('disconnected', () => {
      if (this.peer !== peer || peer.destroyed) return;
      setTimeout(() => {
        if (this.peer === peer && !peer.destroyed && peer.disconnected) {
          try { peer.reconnect(); } catch {}
        }
      }, 1500);
    });

    peer.on('error', err => {
      if (this.peer !== peer) return;
      const type = err?.type || '';
      if (type === 'unavailable-id') {
        this.code = saveRoomCode(generateRoomCode());
        this.error = 'Ese código estaba en uso; generando un código nuevo…';
        this.emitStatus();
        setTimeout(() => this.start(this.code), 350);
        return;
      }
      this.status = 'error';
      this.error = (type === 'network' || type === 'server-error')
        ? 'Sin conexión con el servidor de enlace P2P. Revisa tu internet y reintenta.'
        : (err?.message || 'Error en la conexión P2P.');
      this.emitStatus();
    });
  }

  handleConnection(conn) {
    const entry = { conn, characterId: '', characterName: 'Celular conectado', connectedAt: Date.now() };
    this.clients.set(conn.peer, entry);
    this.emitStatus();

    const sendSnapshot = () => {
      const payload = this.getPayload();
      if (payload && conn.open) {
        try { conn.send({ type: 'PLAYER_SYNC', payload }); } catch {}
      }
    };

    conn.on('open', () => { sendSnapshot(); this.emitStatus(); });
    conn.on('data', msg => {
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'HELLO') {
        entry.characterId = String(msg.characterId || '');
        entry.characterName = String(msg.characterName || 'Celular conectado');
        this.emitStatus();
        sendSnapshot();
      } else if (msg.type === 'REQUEST_SYNC') {
        sendSnapshot();
      } else if (msg.type === 'PLAYER_ACTION' || msg.type === 'PLAYER_END_TURN') {
        this.onClientMessage(msg, {
          peerId: conn.peer,
          characterId: entry.characterId,
          characterName: entry.characterName
        });
      }
    });

    const cleanup = () => { this.clients.delete(conn.peer); this.emitStatus(); };
    conn.on('close', cleanup);
    conn.on('error', cleanup);
  }

  broadcastNow() {
    if (this.status !== 'open' || this.clients.size === 0) return;
    const payload = this.getPayload();
    if (!payload) return;
    this.clients.forEach(({ conn }) => {
      if (conn.open) {
        try { conn.send({ type: 'PLAYER_SYNC', payload }); } catch {}
      }
    });
  }

  broadcastThrottled() {
    if (this.status !== 'open' || this.clients.size === 0 || this.pushTimer) return;
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null;
      this.broadcastNow();
    }, 150);
  }

  regenerateCode() {
    const next = saveRoomCode(generateRoomCode());
    this.code = next;
    if (this.isActive()) this.start(next);
    else this.emitStatus();
    return next;
  }

  stop(silent = false) {
    clearTimeout(this.pushTimer);
    this.pushTimer = null;
    this.clients.forEach(({ conn }) => { try { conn.close(); } catch {} });
    this.clients.clear();
    if (this.peer) {
      const old = this.peer;
      this.peer = null;
      try { old.destroy(); } catch {}
    }
    this.status = 'idle';
    this.error = '';
    if (!silent) this.emitStatus();
  }
}
