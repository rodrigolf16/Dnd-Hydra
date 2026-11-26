export const MODALS_ACTION_HTML = `
  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <!-- MODAL: REGISTRAR MOVIMIENTO / ATAQUE / CONJURO CON DADOS FÍSICOS -->
  <dialog id="actionDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker" id="dialogKicker">REGISTRAR ACTIVIDAD</span>
      <h2 id="dialogTitle">Ataque</h2>
      <p id="dialogDesc">Elige arma y objetivo, tira los dados físicos en la mesa y anota los resultados aquí.</p>

      <label class="field-label" id="weaponField">
        Arma
        <select id="weaponSelect"></select>
      </label>

      <label class="field-label" id="targetField">
        Objetivo
        <select id="targetSelect"></select>
      </label>

      <div class="roll-mode-row" id="rollModeField" hidden>
        <span class="field-caption">Condición de tirada d20</span>
        <div class="segmented" id="rollModeGroup">
          <button type="button" data-roll-mode="normal" class="active">Normal (1×d20)</button>
          <button type="button" data-roll-mode="advantage">Ventaja (2×d20)</button>
          <button type="button" data-roll-mode="disadvantage">Desventaja (2×d20)</button>
        </div>
      </div>

      <label class="field-label" id="spellSlotField" hidden>
        Espacio de conjuro / opción
        <select id="spellSlotSelect"></select>
      </label>

      <!-- Modificadores de clase -->
      <label class="dread-toggle" id="recklessToggle" hidden>
        <input type="checkbox" id="recklessAttack">
        <span>
          <b>Ataque temerario</b>
          <small>Ventaja en todos los ataques cuerpo a cuerpo con Fuerza este turno; los ataques contra él tendrán ventaja hasta su próximo turno.</small>
        </span>
      </label>

      <label class="dread-toggle" id="rageDamageToggle" hidden>
        <input type="checkbox" id="rageDamageCheck">
        <span>
          <b>Furia activa (+2 daño)</b>
          <small>Bonificador de daño por Furia en ataques cuerpo a cuerpo con Fuerza.</small>
        </span>
      </label>

      <label class="dread-toggle" id="frenzyToggle" hidden>
        <input type="checkbox" id="frenzyCheck">
        <span>
          <b>Frenesí (+2d6 daño · 1/turno)</b>
          <small>Mientras está en Furia y usa Ataque temerario, su primer impacto del turno suma +2d6.</small>
        </span>
      </label>

      <label class="dread-toggle" id="dreadToggle" hidden>
        <input type="checkbox" id="dreadDamage">
        <span>
          <b>Emboscador pavoroso (+2d6 psíquico · 1/turno)</b>
          <small>+2d6 psíquico · usos restantes</small>
        </span>
      </label>

      <label class="dread-toggle" id="sneakToggle" hidden>
        <input type="checkbox" id="sneakDamage">
        <span>
          <b>Ataque furtivo (+3d6 · 1/turno)</b>
          <small>Con arma sutil o a distancia si tiene ventaja o un aliado a 1,5 m.</small>
        </span>
      </label>

      <label class="dread-toggle" id="critToggle" hidden>
        <input type="checkbox" id="critDamageCheck">
        <span>
          <b>Impacto crítico (duplicar cantidad de dados físicos)</b>
          <small>Se marca solo si sacó 20 en el d20 físico; duplica todos los dados de daño.</small>
        </span>
      </label>

      <!-- CANTIDADES DE DADOS FÍSICOS + CAMPOS PARA ANOTAR RESULTADOS -->
      <div class="n20-cards-stack" id="physicalActionCards" hidden>
        <div class="n20-roll-card vertical" id="physicalAttackCard" hidden>
          <div class="n20-card-top">
            <div>
              <small id="n20AttackLabel">DADOS FÍSICOS DE ATAQUE</small>
              <div class="dice-qty-line">
                <code id="n20AttackFormula">1d20+8</code>
                <span class="qty-pill" id="n20AttackQty">1 dado físico</span>
              </div>
              <span class="n20-card-sub" id="n20AttackSub">Tira 1×d20 y suma +8</span>
            </div>
            <button type="button" class="copy-clip-btn" id="copyAttackFormulaBtn" title="Copiar fórmula">📋</button>
          </div>
          <div class="physical-inline-input">
            <label for="physicalAtkInput" id="physicalAtkInputLabel">Anota el resultado del d20 físico (1–20):</label>
            <input id="physicalAtkInput" type="number" min="1" max="20" placeholder="Ej. 14">
            <span class="hit-verdict" id="attackVerdictBadge">Sin anotar</span>
          </div>
        </div>

        <div class="n20-roll-card accent vertical" id="physicalDamageCard" hidden>
          <div class="n20-card-top">
            <div>
              <small id="n20DamageLabel">DADOS FÍSICOS DE DAÑO (CANTIDADES TOTALES)</small>
              <div class="dice-qty-line">
                <code id="n20DamageFormula">2d6+1d4+5</code>
                <span class="qty-pill" id="n20DamageQty">3 dados físicos</span>
              </div>
              <span class="n20-card-sub" id="n20DamageSub">Desglose de dados físicos a tirar</span>
            </div>
            <button type="button" class="copy-clip-btn" id="copyDamageFormulaBtn" title="Copiar fórmula">📋</button>
          </div>
          <div class="physical-inline-input">
            <label for="physicalDmgInput" id="physicalDmgInputLabel">Anota el total obtenido (con modificador incluido):</label>
            <input id="physicalDmgInput" type="number" min="0" placeholder="Ej. 16 (se aplica a los PG)">
          </div>
        </div>
      </div>

      <div class="dialog-buttons">
        <button type="button" class="outline-btn" id="cancelMarkBtn" hidden>Soltar marca</button>
        <button type="button" class="outline-btn" data-close-dialog>Cerrar</button>
        <button type="button" class="primary-btn" id="resolveAction">Registrar resultado <span>✓</span></button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: SELECTOR DE CONJUROS -->
  <dialog id="spellPickerDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">FICHA DEL PERSONAJE</span>
      <h2 id="spellPickerTitle">Elegir conjuro</h2>
      <p id="spellPickerSubtitle">Selecciona un conjuro para ver cuántos dados físicos tirar, descontar espacio y anotar el resultado.</p>
      <div class="spell-picker-list" id="spellPickerList"></div>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" data-close-dialog>Cerrar</button>
      </div>
    </form>
  </dialog>

  <!-- MODAL: AÑADIR CONTADOR DE USOS LIMITADOS -->
  <dialog id="usesDialog">
    <form method="dialog">
      <button type="button" class="dialog-close" data-close-dialog aria-label="Cerrar">×</button>
      <span class="section-kicker">RECURSOS DE FICHA</span>
      <h2>Añadir contador</h2>
      <p>Para un conjuro, objeto mágico, dote o rasgo con usos limitados.</p>
      <label class="field-label">Nombre<input id="useName" placeholder="Ej. Inspiración bárdica"></label>
      <div class="form-grid">
        <label class="field-label">Usos máximos<input id="useMax" type="number" min="1" value="3"></label>
        <label class="field-label">
          Se recupera con
          <select id="useReset">
            <option value="long">Descanso largo</option>
            <option value="short">Descanso corto</option>
            <option value="either">Corto o largo</option>
            <option value="never">No se restablece automáticamente</option>
          </select>
        </label>
      </div>
      <div class="dialog-buttons">
        <button type="button" class="outline-btn" data-close-dialog>Cancelar</button>
        <button type="button" class="primary-btn" id="saveUseCounter">Añadir <span>＋</span></button>
      </div>
    </form>
  </dialog>

`;
