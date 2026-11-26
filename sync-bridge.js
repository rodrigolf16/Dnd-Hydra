// Ronda — Puente de sincronización en vivo (WebRTC P2P con PeerJS)
// Conecta la Extensión Chrome del DM con la Guía Móvil (PWA) de los jugadores.
// Solo transmite datos públicos de personajes y turnos (sin mapa ni PG/secretos de enemigos).
(() => {
  'use strict';

  const PEER_PREFIX = 'ronda-hydra-dm-';
  const ROOM_CODE_KEY = 'ronda-mobile-room-code';
  const PLAYER_BASE_URL_KEY = 'ronda-mobile-base-url';
  const DEFAULT_PLAYER_BASE_URL = 'https://rodrigolf16.github.io/Dnd-Hydra/player.html';

  const PEER_CONFIG = {
    debug: 0,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ]
    }
  };

  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  function normalizeRoomCode(raw) {
    return String(raw || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 12);
  }

  function peerIdForCode(code) {
    return `${PEER_PREFIX}${normalizeRoomCode(code).toLowerCase()}`;
  }

  function getSavedRoomCode() {
    try {
      const saved = normalizeRoomCode(localStorage.getItem(ROOM_CODE_KEY));
      if (saved && saved.length >= 4) return saved;
    } catch {}
    const fresh = generateRoomCode();
    try { localStorage.setItem(ROOM_CODE_KEY, fresh); } catch {}
    return fresh;
  }

  function saveRoomCode(code) {
    const clean = normalizeRoomCode(code);
    if (!clean) return '';
    try { localStorage.setItem(ROOM_CODE_KEY, clean); } catch {}
    return clean;
  }

  function getSavedPlayerBaseUrl() {
    try {
      const saved = String(localStorage.getItem(PLAYER_BASE_URL_KEY) || '').trim();
      if (saved) return saved;
    } catch {}
    return DEFAULT_PLAYER_BASE_URL;
  }

  function savePlayerBaseUrl(url) {
    const clean = String(url || '').trim() || DEFAULT_PLAYER_BASE_URL;
    try { localStorage.setItem(PLAYER_BASE_URL_KEY, clean); } catch {}
    return clean;
  }

  function buildJoinUrl(code, baseUrl) {
    const base = (baseUrl || getSavedPlayerBaseUrl()).trim() || DEFAULT_PLAYER_BASE_URL;
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

  // Sanitizes DM state so players only receive PC sheets, turn order (no hidden enemies or enemy HP)
  function buildPlayerPayload(state, campaignName = 'Las Grietas de Aethelgard') {
    if (!state || !Array.isArray(state.combatants)) return null;

    const mapTokens = state.map?.tokens || {};
    const byId = id => state.combatants.find(c => c.id === id) || null;
    const isHiddenEnemy = c => c.type === 'enemy' && !!mapTokens[c.id]?.hidden;

    const active = byId(state.activeTurnId);
    const activeTurnName = !active
      ? ''
      : isHiddenEnemy(active)
        ? 'Adversario'
        : active.name;

    const initiativeOrder = state.combatants
      .filter(c => !isHiddenEnemy(c))
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type === 'enemy' ? 'enemy' : 'pc',
        initRoll: c.initRoll ?? null,
        active: c.id === state.activeTurnId,
        defeated: !!(c.defeated || c.hp <= 0)
      }));

    const characters = state.combatants
      .filter(c => c.type !== 'enemy')
      .map(c => {
        const marked = c.markedTargetId ? byId(c.markedTargetId) : null;
        // Avoid pushing massive multi-hundred KB base64 portraits over mobile connections
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
          initRoll: c.initRoll ?? null,
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
          conditions: Array.isArray(c.conditions) ? c.conditions : [],
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

  // =========================================================================
  // DM HOST (runs inside the Chrome Extension)
  // =========================================================================
  class RondaLiveHost {
    constructor({ getPayload, onStatusChange }) {
      this.getPayload = getPayload;
      this.onStatusChange = onStatusChange || (() => {});
      this.peer = null;
      this.code = getSavedRoomCode();
      this.status = 'idle'; // idle | connecting | open | error
      this.error = '';
      this.clients = new Map(); // peerId -> { conn, characterId, characterName, connectedAt }
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

      if (explicitCode) {
        this.code = saveRoomCode(explicitCode) || getSavedRoomCode();
      } else {
        this.code = getSavedRoomCode();
      }

      this.stop(true);
      this.status = 'connecting';
      this.error = '';
      this.emitStatus();

      const peerId = peerIdForCode(this.code);
      const peer = new window.Peer(peerId, PEER_CONFIG);
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
        // Try silent reconnect to PeerJS signaling server
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
          // Room ID is still held by an old tab or stale session; generate a fresh code automatically
          this.code = saveRoomCode(generateRoomCode());
          this.error = 'Ese código estaba en uso; generando un código nuevo…';
          this.emitStatus();
          setTimeout(() => this.start(this.code), 350);
          return;
        }
        this.status = 'error';
        this.error = type === 'network' || type === 'server-error'
          ? 'Sin conexión con el servidor de enlace P2P. Revisa tu internet y reintenta.'
          : (err?.message || 'Error en la conexión P2P.');
        this.emitStatus();
      });
    }

    handleConnection(conn) {
      const entry = {
        conn,
        characterId: '',
        characterName: 'Celular conectado',
        connectedAt: Date.now()
      };
      this.clients.set(conn.peer, entry);
      this.emitStatus();

      const sendSnapshot = () => {
        const payload = this.getPayload();
        if (payload && conn.open) {
          try { conn.send({ type: 'PLAYER_SYNC', payload }); } catch {}
        }
      };

      conn.on('open', () => {
        sendSnapshot();
        this.emitStatus();
      });

      conn.on('data', msg => {
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'HELLO') {
          entry.characterId = String(msg.characterId || '');
          entry.characterName = String(msg.characterName || 'Celular conectado');
          this.emitStatus();
          sendSnapshot();
        } else if (msg.type === 'REQUEST_SYNC') {
          sendSnapshot();
        }
      });

      const cleanup = () => {
        this.clients.delete(conn.peer);
        this.emitStatus();
      };
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
      if (this.status !== 'open' || this.clients.size === 0) return;
      if (this.pushTimer) return;
      this.pushTimer = setTimeout(() => {
        this.pushTimer = null;
        this.broadcastNow();
      }, 150);
    }

    regenerateCode() {
      const next = saveRoomCode(generateRoomCode());
      this.code = next;
      if (this.isActive()) {
        this.start(next);
      } else {
        this.emitStatus();
      }
      return next;
    }

    stop(silent = false) {
      clearTimeout(this.pushTimer);
      this.pushTimer = null;
      this.clients.forEach(({ conn }) => {
        try { conn.close(); } catch {}
      });
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

  // =========================================================================
  // PLAYER CLIENT (runs inside player.html on players' phones)
  // =========================================================================
  class RondaLiveClient {
    constructor({ onSync, onStatusChange, getSelectedCharacter }) {
      this.onSync = onSync || (() => {});
      this.onStatusChange = onStatusChange || (() => {});
      this.getSelectedCharacter = getSelectedCharacter || (() => ({ id: '', name: '' }));
      this.peer = null;
      this.conn = null;
      this.roomCode = '';
      this.status = 'offline'; // offline | connecting | connected | reconnecting | error
      this.error = '';
      this.reconnectTimer = null;
      this.manualDisconnect = false;
    }

    emitStatus() {
      this.onStatusChange({
        status: this.status,
        roomCode: this.roomCode,
        error: this.error
      });
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
        if (type === 'peer-unavailable') {
          this.status = 'error';
          this.error = `No se encontró la sala «${clean}». Verifica que el DM haya pulsado «Iniciar sala».`;
          this.emitStatus();
          this.scheduleReconnect(6000);
          return;
        }
        this.status = 'error';
        this.error = 'No se pudo conectar con la mesa del DM. Sigues teniendo tu guía offline.';
        this.emitStatus();
        this.scheduleReconnect(5000);
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
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'PLAYER_SYNC' && msg.payload) {
          this.onSync(msg.payload);
        }
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
        this.conn.send({
          type: 'HELLO',
          characterId: sel.id || '',
          characterName: sel.name || 'Jugador'
        });
      } catch {}
    }

    requestSync() {
      if (!this.conn || !this.conn.open) return;
      try { this.conn.send({ type: 'REQUEST_SYNC' }); } catch {}
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
      if (this.conn) {
        try { this.conn.close(); } catch {}
        this.conn = null;
      }
      if (this.peer) {
        try { this.peer.destroy(); } catch {}
        this.peer = null;
      }
      if (!silent) {
        this.roomCode = '';
        this.status = 'offline';
        this.error = '';
        this.emitStatus();
      }
    }
  }

  window.RondaSync = {
    DEFAULT_PLAYER_BASE_URL,
    generateRoomCode,
    normalizeRoomCode,
    getSavedRoomCode,
    saveRoomCode,
    getSavedPlayerBaseUrl,
    savePlayerBaseUrl,
    buildJoinUrl,
    buildPlayerPayload,
    RondaLiveHost,
    RondaLiveClient
  };
})();
