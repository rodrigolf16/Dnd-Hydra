import { CAMPAIGN } from '../../data/campaign/index.js';
import { buildJoinUrl, buildPlayerPayload } from '../../domain/sync/player-payload.js';
import { copyToClipboard } from '../../infrastructure/browser/clipboard.js';
import { openMobileGuidePreview } from '../../infrastructure/extension/chrome-bridge.js';
import { RondaLiveHost } from '../../infrastructure/sync/live-host.js';
import {
  getSavedPlayerBaseUrl,
  getSavedRoomCode,
  savePlayerBaseUrl
} from '../../infrastructure/sync/peer-config.js';
import { emitToast, getState, setMobileHost } from '../../application/store/encounter-store.js';
import { $, openDialog } from '../shared/dom.js';
import { handleIncomingMobileMessage, initMobileActionBanner } from './mobile-action-handler.js';

function renderMobileQrCode(joinUrl) {
  const box = $('#msQrBox');
  if (!box) return;
  if (typeof window.qrcode !== 'function') {
    box.textContent = 'QR no disponible';
    return;
  }
  try {
    const qr = window.qrcode(0, 'M');
    qr.addData(joinUrl);
    qr.make();
    box.innerHTML = qr.createSvgTag({ scalable: true, margin: 2 });
  } catch {
    box.textContent = 'URL demasiado larga para QR';
  }
}

export function initMobileSyncController() {
  const baseInput = $('#msBaseUrlInput');
  const codeEl = $('#msRoomCode');
  const topBtn = $('#mobileSyncTopBtn');

  const defaultUrl = /^https?:$/i.test(location.protocol)
    ? new URL('player.html', location.href).toString()
    : getSavedPlayerBaseUrl();
  if (baseInput) baseInput.value = defaultUrl;

  const refreshJoinTargets = code => {
    const cleanCode = code || getSavedRoomCode();
    if (codeEl) codeEl.textContent = cleanCode;
    const base = (baseInput?.value || defaultUrl).trim();
    const joinUrl = buildJoinUrl(cleanCode, base);
    renderMobileQrCode(joinUrl);
    return joinUrl;
  };

  const renderHostStatus = info => {
    const dot = $('#msStatusDot');
    const title = $('#msStatusTitle');
    const sub = $('#msStatusSub');
    const toggleBtn = $('#msToggleHostBtn');
    const countEl = $('#msClientsCount');
    const listEl = $('#msClientsList');
    const count = info.clients?.length || 0;

    if (dot) dot.className = `ms-dot ${info.status}`;
    if (topBtn) {
      topBtn.classList.toggle('live', info.status === 'open');
      const span = topBtn.querySelector('span');
      if (span) {
        span.textContent = info.status === 'open'
          ? (count > 0 ? `Celulares · ${count}` : 'Celulares · En vivo')
          : 'Celulares';
      }
    }

    if (info.status === 'open') {
      if (title) title.textContent = `Sala activa · Código ${info.code}`;
      if (sub) sub.textContent = 'Cualquier cambio de turno, PG o ficha de Nivel20 se envía al instante.';
      if (toggleBtn) toggleBtn.textContent = 'Detener sala';
    } else if (info.status === 'connecting') {
      if (title) title.textContent = 'Abriendo sala en vivo…';
      if (sub) sub.textContent = 'Conectando con el enlace P2P…';
      if (toggleBtn) toggleBtn.textContent = 'Cancelar';
    } else if (info.status === 'error') {
      if (title) title.textContent = 'Error de conexión';
      if (sub) sub.textContent = info.error || 'No se pudo abrir la sala P2P.';
      if (toggleBtn) toggleBtn.textContent = 'Reintentar sala';
    } else {
      if (title) title.textContent = 'Sala apagada';
      if (sub) sub.textContent = 'Los celulares igual pueden usar la guía offline con las fichas base.';
      if (toggleBtn) toggleBtn.textContent = 'Iniciar sala en vivo';
    }

    if (countEl) countEl.textContent = `${count} ${count === 1 ? 'conectado' : 'conectados'}`;
    if (listEl) {
      listEl.replaceChildren();
      if (!count) {
        const empty = document.createElement('small');
        empty.className = 'muted';
        empty.textContent = info.status === 'open'
          ? 'Esperando que los jugadores escaneen el QR o ingresen el código…'
          : 'Aún no hay celulares conectados. Activa la sala para recibir jugadores en vivo.';
        listEl.append(empty);
      } else {
        info.clients.forEach(cl => {
          const chip = document.createElement('span');
          chip.className = 'ms-client-chip';
          chip.textContent = `✓ ${cl.characterName}`;
          listEl.append(chip);
        });
      }
    }

    refreshJoinTargets(info.code);
  };

  const host = new RondaLiveHost({
    getPayload: () => buildPlayerPayload(getState(), CAMPAIGN.name),
    onStatusChange: renderHostStatus,
    onClientMessage: handleIncomingMobileMessage
  });
  setMobileHost(host);
  initMobileActionBanner();
  renderHostStatus({ status: 'idle', code: host.code, error: '', clients: [] });

  topBtn?.addEventListener('click', () => {
    refreshJoinTargets(host.code);
    openDialog($('#mobileSyncDialog'));
  });
  $('#msToggleHostBtn')?.addEventListener('click', () => {
    if (host.isActive()) {
      host.stop();
      emitToast('Sala móvil detenida');
    } else {
      host.start(host.code);
    }
  });
  $('#msCopyCodeBtn')?.addEventListener('click', () => copyToClipboard(host.code).then(ok => ok && emitToast(`Código ${host.code} copiado`)));
  $('#msRegenCodeBtn')?.addEventListener('click', () => {
    const next = host.regenerateCode();
    refreshJoinTargets(next);
    emitToast(`Nuevo código de sala: ${next}`);
  });
  baseInput?.addEventListener('input', () => {
    savePlayerBaseUrl(baseInput.value);
    refreshJoinTargets(host.code);
  });
  $('#msCopyLinkBtn')?.addEventListener('click', () => {
    const url = refreshJoinTargets(host.code);
    copyToClipboard(url).then(ok => ok && emitToast('Enlace con código de sala copiado'));
  });
  $('#msPreviewBtn')?.addEventListener('click', () => {
    if (!host.isActive()) host.start(host.code);
    openMobileGuidePreview(host.code);
  });
}
