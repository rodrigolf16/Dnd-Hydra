export const ENCOUNTER_RIGHT_HTML = `
          <aside class="right-column">
            <!-- PANEL DE DADOS FÍSICOS: CANTIDADES TOTALES + ANOTAR RESULTADO -->
            <div class="side-card dice-card" id="physicalDiceCard">
              <div class="side-card-head">
                <div>
                  <span class="section-kicker">DADOS FÍSICOS EN MESA</span>
                  <h3>Cantidades y resultado</h3>
                </div>
                <button type="button" class="mini-link" id="clearDicePoolBtn" title="Reiniciar selección de dados">Limpiar</button>
              </div>

              <p class="dice-helper-text">Toca cada dado para sumar la cantidad a tirar en la mesa (clic derecho o − para restar):</p>
              <div class="dice-counter-grid" id="diceCounterGrid">
                <button type="button" class="die-pick" data-die="20"><b>d20</b><span class="die-badge" data-count="20">0</span></button>
                <button type="button" class="die-pick" data-die="12"><b>d12</b><span class="die-badge" data-count="12">0</span></button>
                <button type="button" class="die-pick" data-die="10"><b>d10</b><span class="die-badge" data-count="10">0</span></button>
                <button type="button" class="die-pick" data-die="8"><b>d8</b><span class="die-badge" data-count="8">0</span></button>
                <button type="button" class="die-pick" data-die="6"><b>d6</b><span class="die-badge" data-count="6">0</span></button>
                <button type="button" class="die-pick" data-die="4"><b>d4</b><span class="die-badge" data-count="4">0</span></button>
              </div>

              <div class="modifier-row">
                <label for="modifier">Modificador fijo</label>
                <div>
                  <button type="button" id="minusMod">−</button>
                  <input id="modifier" value="0" inputmode="numeric">
                  <button type="button" id="plusMod">＋</button>
                </div>
              </div>

              <div class="physical-pool-box" id="physicalPoolBox">
                <div class="pool-top">
                  <span>CANTIDADES TOTALES A TIRAR</span>
                  <strong id="poolTotalDiceCount">0 dados</strong>
                </div>
                <div class="pool-formula-row">
                  <code id="poolFormulaDisplay">—</code>
                  <button type="button" class="copy-roll-mini" id="copyPoolFormulaBtn" hidden>📋 Copiar</button>
                </div>
                <small id="poolBreakdownText">Selecciona dados arriba o escribe una fórmula (ej. 2d6+1d4+5).</small>
              </div>

              <div class="custom-roll">
                <input id="customDice" placeholder="Cargar fórmula: ej. 2d6+1d4+5" aria-label="Fórmula de dados">
                <button type="button" id="loadCustomDice">Cargar</button>
              </div>

              <div class="physical-result-entry">
                <label for="physicalResultInput">RESULTADO OBTENIDO EN DADOS FÍSICOS</label>
                <div class="result-input-row">
                  <input id="physicalResultInput" type="number" placeholder="Anota el total sacado">
                  <input id="physicalResultNote" type="text" placeholder="Motivo (ej. Salv. DES)">
                </div>
                <div class="result-action-btns">
                  <button type="button" class="primary-btn" id="recordPhysicalRollBtn">Anotar resultado ✓</button>
                  <button type="button" class="outline-btn" id="applyPhysicalDamageBtn" title="Restar este resultado de los PG del objetivo seleccionado">− Daño objetivo</button>
                  <button type="button" class="outline-btn" id="applyPhysicalHealBtn" title="Sumar este resultado a los PG del objetivo seleccionado">＋ Curar</button>
                </div>
              </div>

              <div class="roll-result" id="rollResult">
                <span>ÚLTIMO RESULTADO ANOTADO</span>
                <b>—</b>
                <small>Aún sin resultados físicos registrados</small>
              </div>
            </div>

            <div class="side-card target-card">
              <div class="side-card-head">
                <div>
                  <span class="section-kicker">COMBATIENTES</span>
                  <h3>Objetivos y PG</h3>
                </div>
                <button type="button" class="more-btn" id="editInitiative" title="Cargar iniciativas">⚙</button>
              </div>
              <div id="targetList"></div>
              <button type="button" class="add-target" id="addTarget">＋ Añadir adversario</button>
            </div>

            <div class="side-card uses-card">
              <div class="side-card-head">
                <div>
                  <span class="section-kicker">RECURSOS DE FICHA</span>
                  <h3>Usos limitados y espacios</h3>
                </div>
                <button type="button" class="more-btn" id="addUseCounter" title="Añadir contador personalizado">＋</button>
              </div>
              <div class="rest-buttons">
                <button type="button" id="shortRest">Descanso corto</button>
                <button type="button" id="longRest">Descanso largo</button>
              </div>
              <div id="limitedUsesList"></div>
            </div>

            <div class="side-card notes-card">
              <div class="side-card-head">
                <div>
                  <span class="section-kicker">HOJA Y REGLAS</span>
                  <h3>Ficha de personaje</h3>
                </div>
              </div>
              <p class="passive-note">Consulta atributos, salvaciones, habilidades, conjuros, armas y rasgos sin salir del combate.</p>
              <button type="button" class="manage-link" id="manageFeatures">Ver ficha, rasgos y dotes <span>→</span></button>
            </div>
          </aside>
        </div>

`;
