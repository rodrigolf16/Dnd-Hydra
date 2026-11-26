export const MODALS_MOBILE_SYNC_HTML = `
  <!-- MODAL: CONECTAR CELULARES (GUÍA MÓVIL DE JUGADORES) -->
  <dialog id="mobileSyncDialog" class="mobile-sync-dialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">GUÍA MÓVIL PARA JUGADORES · MODO HÍBRIDO</span>
      <h2>Conectar celulares a la mesa</h2>
      <p>
        Los jugadores ven en su celular <b>qué movimientos pueden hacer y qué dados físicos tirar</b> (sin mapa ni PG/secretos de enemigos). Al activar la sala reciben en vivo el turno actual, sus PG y cualquier ficha sincronizada desde Nivel20.
      </p>

      <div class="ms-status-row">
        <div class="ms-status-info">
          <i class="ms-dot" id="msStatusDot"></i>
          <div>
            <b id="msStatusTitle">Sala apagada</b>
            <small id="msStatusSub">Los celulares igual pueden usar la guía offline con las fichas base.</small>
          </div>
        </div>
        <button type="button" class="primary-btn" id="msToggleHostBtn">Iniciar sala en vivo</button>
      </div>

      <div class="ms-grid">
        <div class="ms-qr-card">
          <div class="ms-qr-box" id="msQrBox" aria-label="Código QR para celulares"></div>
          <small>Escanea con la cámara del celular</small>
        </div>

        <div class="ms-code-col">
          <div class="ms-code-box">
            <span>CÓDIGO DE SALA</span>
            <div class="ms-code-line">
              <b id="msRoomCode">HYDRA1</b>
              <button type="button" class="outline-btn" id="msCopyCodeBtn" title="Copiar código">Copiar</button>
              <button type="button" class="outline-btn" id="msRegenCodeBtn" title="Generar código nuevo">↻</button>
            </div>
          </div>

          <label class="field-label">
            URL pública de la Guía Móvil (GitHub Pages)
            <input id="msBaseUrlInput" type="url" placeholder="https://rodrigolf16.github.io/Dnd-Hydra/player.html">
          </label>

          <div class="ms-link-actions">
            <button type="button" class="outline-btn" id="msCopyLinkBtn">↗ Copiar enlace</button>
            <button type="button" class="outline-btn" id="msPreviewBtn">📱 Probar vista móvil</button>
          </div>
        </div>
      </div>

      <div class="ms-clients-box">
        <div class="ms-clients-head">
          <span>CELULARES CONECTADOS</span>
          <b id="msClientsCount">0 conectados</b>
        </div>
        <div class="ms-clients-list" id="msClientsList">
          <small class="muted">Aún no hay celulares conectados. Cuando un jugador escanee el QR o ingrese el código aparecerá aquí.</small>
        </div>
      </div>

      <div class="dialog-buttons">
        <button type="button" class="primary-btn" data-close-dialog>Cerrar <span>✓</span></button>
      </div>
    </form>
  </dialog>

`;
