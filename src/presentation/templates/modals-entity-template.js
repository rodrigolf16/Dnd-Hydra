export const MODALS_ENTITY_HTML = `
  <!-- MODAL: EDITAR PERSONAJE -->
  <dialog id="editDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">HOJA DE PERSONAJE</span>
      <h2>Editar combatiente</h2>
      <div class="form-grid">
        <label class="field-label">Nombre<input id="nameInput"></label>
        <label class="field-label">Nivel<input id="levelInput" type="number" min="1" max="20"></label>
        <label class="field-label span-2">Clase y subclase<input id="classInput"></label>
        <label class="field-label">PG actuales / máximos<input id="hpInput" placeholder="53/63"></label>
        <label class="field-label">Clase de armadura<input id="acInput" type="number" min="1"></label>
        <label class="field-label">Velocidad (m)<input id="speedInput" placeholder="10.5 m"></label>
        <label class="field-label">Bonificador de iniciativa<input id="initModInput" type="number"></label>
        <label class="field-label span-2">
          Imagen / Retrato (URL o ruta)
          <input id="avatarUrlInput" placeholder="Pega una URL de Nivel20 / Google o sube un archivo">
        </label>
      </div>
      <div class="n20-actions-grid">
        <button type="button" class="outline-btn" id="uploadAvatarBtn">⇧ Subir imagen local</button>
        <button type="button" class="outline-btn" id="searchGoogleEditBtn">🔍 Buscar en Google</button>
        <input type="file" id="avatarFileInput" accept="image/*" hidden>
      </div>
      <div class="dialog-buttons edit-dialog-footer">
        <button type="button" class="danger-btn" id="deleteCharacterBtn" title="Eliminar este personaje del encuentro">🗑 Eliminar</button>
        <div class="dialog-buttons-right">
          <button type="button" class="outline-btn" data-close-dialog>Cancelar</button>
          <button type="button" class="primary-btn" id="saveCharacter">Guardar <span>✓</span></button>
        </div>
      </div>
    </form>
  </dialog>

  <!-- MODAL: MANUALES Y CONTENIDO PROPIO -->
  <dialog id="manualDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">BIBLIOTECA</span>
      <h2>Manuales y reglas</h2>
      <p>Organiza tus fuentes de campaña o importa acciones y rasgos propios desde JSON.</p>
      <div class="manual-list">
        <div>
          <span class="book-cover">PHB</span>
          <span><b>Manual del jugador</b><small>Reglas básicas · D&amp;D 2024</small></span>
          <button type="button" class="manual-add" data-manual="Manual del jugador">＋ Activar</button>
        </div>
        <div>
          <span class="book-cover red">DMG</span>
          <span><b>Guía del Dungeon Master</b><small>Reglas de referencia</small></span>
          <button type="button" class="manual-add" data-manual="Guía del Dungeon Master">＋ Activar</button>
        </div>
        <div>
          <span class="book-cover blue">JSON</span>
          <span><b>Contenido propio</b><small>Importa acciones y rasgos JSON al personaje visible</small></span>
          <button type="button" class="manual-add" id="customManual">⇧ Importar</button>
        </div>
      </div>
      <input type="file" id="manualFile" accept=".json,application/json" hidden>
    </form>
  </dialog>

  <!-- MODAL: MOVIMIENTO DEL TURNO -->
  <dialog id="movementDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">MOVIMIENTO DEL TURNO</span>
      <h2>Registrar desplazamiento</h2>
      <p id="movementDesc">Anota cuántos metros se movió el personaje. Al confirmar se descontará automáticamente del recurso Movimiento.</p>
      <div class="quick-dist-row">
        <button type="button" class="mini-btn" data-dist="1.5">1.5 m (1 casilla)</button>
        <button type="button" class="mini-btn" data-dist="3">3 m</button>
        <button type="button" class="mini-btn" data-dist="4.5">4.5 m</button>
        <button type="button" class="mini-btn" data-dist="9">9 m</button>
        <button type="button" class="mini-btn" id="moveAllBtn">Todo</button>
      </div>
      <label class="field-label">Distancia recorrida (m)<input id="movementInput" type="number" min="0" step="0.5" value="3"></label>
      <label class="field-label">Nota de posición<input id="positionInput" placeholder="Hacia la puerta, junto a la columna…"></label>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" id="resetMovementBtn">Restaurar mov.</button>
        <button type="button" class="outline-btn" data-close-dialog>Cancelar</button>
        <button type="button" class="primary-btn" id="saveMovement">Registrar <span>→</span></button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: AÑADIR ADVERSARIO -->
  <dialog id="combatantDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">ENCUENTRO</span>
      <h2>Añadir adversario</h2>
      <div class="form-grid">
        <label class="field-label">Nombre<input id="enemyName" placeholder="Ej. Hobgoblin, Dragón rojo, Lobo"></label>
        <label class="field-label">Cantidad<input id="enemyCount" type="number" min="1" max="20" value="1"></label>
        <label class="field-label">PG actuales / máximos<input id="enemyHp" value="25/25"></label>
        <label class="field-label">Clase de armadura<input id="enemyAc" type="number" value="15"></label>
        <label class="field-label">Velocidad (m)<input id="enemySpeed" value="9 m"></label>
        <label class="field-label">Iniciativa física (opcional)<input id="enemyInitRoll" type="number" placeholder="Resultado (ej. 14)"></label>
        <label class="field-label">Mod. iniciativa<input id="enemyInit" type="number" value="1"></label>
        <label class="field-label">Bonificador ataque<input id="enemyAtk" type="number" value="5"></label>
        <label class="field-label span-2">Daño del ataque<input id="enemyDmg" value="1d8+3"></label>
        <label class="field-label span-2">
          Imagen (URL opcional — si lo dejas vacío se busca automáticamente por nombre)
          <input id="enemyImageUrl" placeholder="Vacío = búsqueda automática por nombre">
        </label>
      </div>
      <label class="dread-toggle">
        <input type="checkbox" id="enemyStageCheck" checked>
        <span>
          <b>Enviar a la Reserva del DM (fuera del mapa)</b>
          <small>No aparecen a los jugadores hasta que los arrastres al mapa táctico para ubicarlos.</small>
        </span>
      </label>
      <div class="n20-actions-grid">
        <button type="button" class="outline-btn" id="uploadEnemyImgBtn">⇧ Subir imagen</button>
        <button type="button" class="outline-btn" id="searchEnemyGoogleBtn">🔍 Ver en Google Imágenes</button>
        <input type="file" id="enemyImageFile" accept="image/*" hidden>
      </div>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" data-close-dialog>Cancelar</button>
        <button type="button" class="primary-btn" id="saveEnemy">Añadir adversario <span>＋</span></button>
      </div>
    </form>
  </dialog>

`;
