export const CHECKS_SHEET_MODALS_HTML = `
      <!-- TAB 3: PRUEBAS, SALVACIONES Y HABILIDADES -->
      <section class="tab-pane" id="paneChecks" data-pane="checks">
        <div class="check-spotlight" id="checkSpotlight">
          <div class="spotlight-top">
            <span class="kicker" id="spotlightKicker">TIRA EN LA MESA</span>
            <div class="mini-seg">
              <button type="button" class="mini-seg-btn active" data-check-mode="normal">1×d20</button>
              <button type="button" class="mini-seg-btn" data-check-mode="advantage">Vent.</button>
              <button type="button" class="mini-seg-btn" data-check-mode="disadvantage">Desv.</button>
            </div>
          </div>
          <div class="spotlight-body">
            <b id="spotlightName">Percepción</b>
            <div class="spotlight-dice" id="spotlightDice">1 × d20 + 7</div>
          </div>
          <small id="spotlightHint">Toca cualquier atributo, salvación o habilidad abajo para ver qué dado físico tirar.</small>
        </div>

        <div class="block-head">
          <h2>Atributos</h2>
          <span class="block-hint">Toca para ver tirada</span>
        </div>
        <div class="abilities-grid" id="abilitiesGrid"></div>

        <div class="block-head">
          <h2>Tiradas de salvación</h2>
          <span class="block-hint">1 × d20 + bono</span>
        </div>
        <div class="saves-grid" id="savesGrid"></div>

        <div class="block-head">
          <h2>Habilidades</h2>
          <input type="search" id="skillSearch" class="skill-search" placeholder="Filtrar (ej. Sigilo)…">
        </div>
        <div class="skills-list" id="skillsList"></div>
      </section>

      <!-- TAB 4: FICHA, RASGOS E INICIATIVA -->
      <section class="tab-pane" id="paneSheet" data-pane="sheet">
        <div id="liveInitSection" hidden>
          <div class="block-head">
            <h2>Orden de iniciativa (en vivo)</h2>
            <span class="block-hint" id="liveInitRound">Ronda 1</span>
          </div>
          <div class="init-order-list" id="liveInitList"></div>
        </div>

        <div class="block-head">
          <h2>Maestrías con armas</h2>
          <span class="block-hint">D&amp;D 2024</span>
        </div>
        <div class="card-stack" id="masteriesList"></div>

        <div class="block-head">
          <h2>Rasgos y dotes</h2>
          <span class="block-hint">Tu personaje</span>
        </div>
        <div class="card-stack" id="featuresList"></div>

        <div class="block-head">
          <h2>Equipo y perfil</h2>
        </div>
        <div class="info-card" id="sheetProfileCard"></div>
      </section>
    </main>

    <!-- NAVEGACIÓN INFERIOR MÓVIL -->
    <nav class="bottom-nav" aria-label="Navegación principal">
      <button type="button" class="nav-tab active" data-tab="turn">
        <span class="nav-ico">⚔</span>
        <span>Turno</span>
      </button>
      <button type="button" class="nav-tab" data-tab="spells" id="spellsNavTab">
        <span class="nav-ico">✧</span>
        <span id="spellsNavLabel">Conjuros</span>
      </button>
      <button type="button" class="nav-tab" data-tab="checks">
        <span class="nav-ico">🎲</span>
        <span>Tiradas</span>
      </button>
      <button type="button" class="nav-tab" data-tab="sheet">
        <span class="nav-ico">📜</span>
        <span>Ficha</span>
      </button>
    </nav>
  </div>

  <!-- MODAL: CONEXIÓN EN VIVO CON EL DM -->
  <dialog id="connectDialog" class="mobile-dialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="kicker">MODO HÍBRIDO · EN VIVO CON EL DM</span>
      <h2>Conectar a la mesa del DM</h2>
      <p class="dialog-copy">
        Tu guía funciona siempre <b>offline</b>. Si el DM inicia una sala en su extensión de Chrome, escribe el código o escanea su QR para recibir <b>turnos, PG y fichas de Nivel20 en vivo</b>.
      </p>

      <div class="sync-status-box" id="syncStatusBox">
        <i class="dot"></i>
        <div>
          <b id="syncModalTitle">Modo Offline</b>
          <small id="syncModalDetail">Usando fichas guardadas en tu celular.</small>
        </div>
      </div>

      <label class="field-label">
        Código de sala del DM
        <input id="roomCodeInput" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" placeholder="Ej. A7K9M2" maxlength="12">
      </label>

      <div class="dialog-actions">
        <button type="button" class="btn-outline" id="disconnectRoomBtn" hidden>Volver a offline</button>
        <button type="button" class="btn-primary" id="connectRoomBtn">Conectar en vivo <span>→</span></button>
      </div>
    </form>
  </dialog>

  <div class="toast" id="playerToast" role="status" aria-live="polite"></div>
`;
