export const MODALS_COMBAT_HTML = `
  <!-- MODAL: ACCIÓN PERSONALIZADA -->
  <dialog id="customActionDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">REGISTRO DE ACTIVIDADES</span>
      <h2>Nueva acción personalizada</h2>
      <p>Se guardará en la ficha del combatiente visible indicando qué dados físicos tirar.</p>
      <label class="field-label">Nombre<input id="customActionName" placeholder="Ej. Paso sombrío o Aliento de fuego"></label>
      <div class="form-grid">
        <label class="field-label">
          Tipo de recurso
          <select id="customActionKind">
            <option value="action">Acción</option>
            <option value="bonus">Acción adicional</option>
            <option value="reaction">Reacción</option>
            <option value="passive">Rasgo pasivo</option>
          </select>
        </label>
        <label class="field-label">
          Dados físicos (opcional)
          <input id="customActionDice" placeholder="Ej. 2d6+1d4+5">
        </label>
      </div>
      <label class="field-label">Descripción<input id="customActionDesc" placeholder="Qué efecto produce o cuándo se activa"></label>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" data-close-dialog>Cancelar</button>
        <button type="button" class="primary-btn" id="saveCustomAction">Guardar acción <span>＋</span></button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: AJUSTE RÁPIDO DE PG -->
  <dialog id="hpDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">PUNTOS DE GOLPE</span>
      <h2 id="hpDialogTitle">Ajustar PG</h2>
      <p id="hpDialogDesc">Aplica daño o curación exacta. Si tiene Concentración activa, se calculará la CD de Constitución.</p>
      <div class="form-grid">
        <label class="field-label">Cantidad<input id="hpDeltaInput" type="number" min="0" value="5"></label>
        <label class="field-label">
          Tipo
          <select id="hpDeltaType">
            <option value="damage">Daño (restar PG)</option>
            <option value="heal">Curación (sumar PG)</option>
            <option value="set">Establecer PG exactos</option>
          </select>
        </label>
      </div>
      <label class="field-label">Motivo (opcional)<input id="hpDeltaReason" placeholder="Ej. Bola de fuego, Curar heridas, trampa…"></label>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" data-close-dialog>Cancelar</button>
        <button type="button" class="primary-btn" id="applyHpDelta">Aplicar <span>✓</span></button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: CARGA MANUAL DE INICIATIVAS -->
  <dialog id="initiativeDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">ORDEN DE COMBATE</span>
      <h2>Cargar iniciativas de los dados físicos</h2>
      <p>Anota el total de iniciativa que sacó cada combatiente en la mesa. Al guardar se ordenan de mayor a menor; usa ↑/↓ para intercambiar posiciones (ej. dote Alerta).</p>
      <div class="init-edit-list" id="initEditList"></div>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" data-close-dialog>Cancelar</button>
        <button type="button" class="primary-btn" id="saveAllInitiatives">Ordenar de mayor a menor <span>✓</span></button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: NIVEL20 -->
  <dialog id="nivel20Dialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">REFERENCIA · NIVEL20</span>
      <h2>Enlace de campaña en Nivel20</h2>
      <p>Guarda el enlace de tu campaña en Nivel20 para abrir las fichas originales rápidamente junto al Panel DM.</p>
      <label class="field-label">
        Enlace de tu campaña en Nivel20
        <input id="n20UrlInput" type="url" placeholder="https://nivel20.com/games/...">
      </label>
      <div class="n20-actions-grid">
        <button type="button" class="outline-btn" id="openN20SiteBtn">↗ Abrir Nivel20</button>
        <button type="button" class="outline-btn" id="copyInitOrderBtn">📋 Copiar iniciativa</button>
      </div>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" data-close-dialog>Cerrar</button>
        <button type="button" class="primary-btn" id="saveN20Settings">Guardar enlace <span>✓</span></button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: IMPORTAR PERSONAJE -->
  <dialog id="importDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">PERSONAJES EN LA MESA</span>
      <h2>Importar o editar personaje</h2>
      <p>Trae los datos de una hoja JSON o edita el combatiente actual manualmente.</p>
      <label class="field-label">
        Al importar un JSON:
        <select id="importModeSelect">
          <option value="add">Añadir como nuevo personaje al encuentro</option>
          <option value="replace">Actualizar el personaje visible actualmente</option>
        </select>
      </label>
      <div class="import-options">
        <button type="button" id="jsonImport">
          <span>⇧</span>
          <b>Importar archivo JSON</b>
          <small>Acepta nombre, nivel, clase, PG, CA, velocidad, imagen, atributos, rasgos, armas y conjuros.</small>
        </button>
        <button type="button" id="manualEntry">
          <span>✎</span>
          <b>Editar personaje actual a mano</b>
          <small>Modifica nombre, imagen, nivel, clase, PG, CA, velocidad e iniciativa.</small>
        </button>
        <input type="file" id="fileInput" accept=".json,application/json" hidden>
      </div>
    </form>
  </dialog>

`;
