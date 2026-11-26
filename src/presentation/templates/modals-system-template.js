export const MODALS_SYSTEM_HTML = `
  <!-- MODAL: AYUDA -->
  <dialog id="helpDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">GUÍA DEL DM</span>
      <h2>Cómo dirigir la mesa con dados físicos</h2>
      <div class="help-list">
        <div>
          <b>1. Carga las iniciativas físicas</b>
          <p>Pulsa <b>✎ Cargar iniciativas</b>, escribe lo que sacó cada jugador y enemigo en la mesa y ordénalos de mayor a menor. Usa <b>⇄ Intercambiar</b> si alguien activa la dote <i>Alerta</i>.</p>
        </div>
        <div>
          <b>2. Registra cada movimiento y anota los dados físicos</b>
          <p>Al abrir un ataque, conjuro o acción, Ronda indica exactamente <b>cuántos dados físicos tirar</b> (ej. <code>2d6+1d4+5 · 3 dados</code>). Anota el d20 físico para comprobar si impacta la CA y luego anota el daño físico para descontarlo automáticamente de la barra de vida.</p>
        </div>
        <div>
          <b>3. Panel de Dados Físicos libre (derecha)</b>
          <p>Para salvaciones, trampas o pruebas sueltas, toca <code>d20..d4</code> para sumar cantidades, anota el total obtenido en la mesa y regístralo o aplícalo directo como daño o curación.</p>
        </div>
      </div>
      <div class="dialog-buttons">
        <button type="button" class="primary-btn" data-close-dialog>Entendido <span>✓</span></button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: AJUSTES DE ENCUENTRO -->
  <dialog id="settingsDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">MESA Y PERSISTENCIA</span>
      <h2>Ajustes del encuentro</h2>

      <label class="dread-toggle">
        <input type="checkbox" id="skipDefeatedCheck" checked>
        <span>
          <b>Saltar adversarios fuera de combate</b>
          <small>Al pulsar «Siguiente turno», omite automáticamente enemigos con 0 PG o derrotados.</small>
        </span>
      </label>

      <div class="n20-actions-grid">
        <button type="button" class="outline-btn" id="exportEncounterBtn">⇩ Exportar encuentro JSON</button>
        <button type="button" class="outline-btn" id="importEncounterBtn">⇧ Cargar encuentro JSON</button>
        <input type="file" id="encounterFileInput" accept=".json,application/json" hidden>
      </div>

      <div class="danger-zone">
        <div>
          <b>Reiniciar encuentro</b>
          <small>Restaura las 6 fichas originales de Las Grietas de Aethelgard, ronda 1 y elimina enemigos añadidos.</small>
        </div>
        <button type="button" class="danger-btn" id="resetEncounterBtn">Reiniciar todo</button>
      </div>

      <div class="dialog-buttons">
        <button type="button" class="primary-btn" data-close-dialog>Cerrar <span>✓</span></button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: FICHA COMPLETA -->
  <dialog id="sheetDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">FICHA DE PERSONAJE · NIVEL20</span>
      <h2 id="sheetTitle">Ficha</h2>
      <div id="sheetContent" class="sheet-content"></div>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" id="exportPortraitFromSheetBtn">⇩ Exportar imagen</button>
        <button type="button" class="primary-btn" data-close-dialog>Cerrar <span>✓</span></button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: AÑADIR PIN LIBRE AL MAPA 2D -->
  <dialog id="mapMarkerDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">MAPA 2D · MARCADOR</span>
      <h2>Nuevo pin en el mapa</h2>
      <p>Coloca puntos de interés, trampas, puertas, tesoros o zonas de conjuro.</p>
      <label class="field-label">Etiqueta<input id="markerLabelInput" placeholder="Ej. Trampa, Cofre, Fogata, NPC…"></label>
      <div class="form-grid">
        <label class="field-label">
          Icono
          <select id="markerIconSelect">
            <option value="📍">📍 Pin</option>
            <option value="⚠">⚠ Trampa / Peligro</option>
            <option value="💎">💎 Tesoro / Cofre</option>
            <option value="🚪">🚪 Puerta / Entrada</option>
            <option value="🔥">🔥 Fuego / Luz</option>
            <option value="✧">✧ Zona de conjuro</option>
            <option value="☠">☠ Calavera</option>
            <option value="⚑">⚑ Objetivo</option>
          </select>
        </label>
        <label class="field-label">
          Color
          <select id="markerColorSelect">
            <option value="#d3b878">Dorado</option>
            <option value="#df8d7f">Rojo</option>
            <option value="#bad28b">Verde</option>
            <option value="#88b8cc">Azul</option>
            <option value="#c49be0">Violeta</option>
          </select>
        </label>
      </div>
      <label class="dread-toggle">
        <input type="checkbox" id="markerDmOnlyCheck">
        <span>
          <b>Solo visible para el DM</b>
          <small>Oculta este pin en la Pantalla de Jugadores (ideal para trampas ocultas o notas secretas).</small>
        </span>
      </label>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" data-close-dialog>Cancelar</button>
        <button type="button" class="primary-btn" id="saveMapMarkerBtn">Colocar pin <span>＋</span></button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: URL DE IMAGEN DE MAPA -->
  <dialog id="mapUrlDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">MAPA 2D · FONDO</span>
      <h2>Cargar mapa desde URL</h2>
      <p>Pega el enlace directo de una imagen de mapa (PNG, JPG o WebP).</p>
      <label class="field-label">URL de la imagen<input id="mapBgUrlInput" type="url" placeholder="https://.../mapa-mazmorra.jpg"></label>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" data-close-dialog>Cancelar</button>
        <button type="button" class="primary-btn" id="applyMapUrlBtn">Cargar fondo <span>✓</span></button>
      </div>
    </form>
  </dialog>

`;
