export const TURN_TAB_HTML = `
      <!-- TAB 1: TURNO GUIADO Y DADOS FÍSICOS -->
      <section class="tab-pane active" id="paneTurn" data-pane="turn">
        <div class="guide-callout" id="turnGuideBox">
          <div class="guide-callout-head">
            <span class="kicker">TU TURNO PASO A PASO</span>
            <span class="guide-tag" id="turnGuideBadge">Disponible</span>
          </div>
          <p id="turnGuideText"></p>
        </div>

        <section class="active-move-panel" id="activeMovePanel" hidden>
          <div class="active-move-top">
            <button type="button" class="back-move-btn" id="backToChoicesBtn">← Cambiar movimiento</button>
            <span class="mini-tag mastery" id="activeMoveCostBadge">1 Acción</span>
          </div>
          <div class="active-move-head">
            <span class="kicker" id="activeMoveKicker">MOVIMIENTO ELEGIDO</span>
            <h2 id="activeMoveTitle">Atacar con arma</h2>
            <p id="activeMoveDesc"></p>
          </div>

          <div class="mods-card" id="activeMoveModsWrap">
            <div class="mods-row">
              <div class="seg-control" role="group" aria-label="Modo de tirada d20">
                <button type="button" class="seg-btn active" data-roll-mode="normal">Normal</button>
                <button type="button" class="seg-btn" data-roll-mode="advantage">Ventaja <small>2×d20↑</small></button>
                <button type="button" class="seg-btn" data-roll-mode="disadvantage">Desvent. <small>2×d20↓</small></button>
              </div>
              <button type="button" class="crit-toggle" id="critToggleBtn">💥 Crítico ×2</button>
            </div>
            <div class="class-mods" id="classModsBar" hidden></div>
          </div>

          <div class="active-move-dice" id="activeMoveDiceBox"></div>
          <div class="mastery-note" id="activeMoveNote" hidden></div>

          <div class="waiting-dm-box" id="activeMoveWaitingBox" hidden>
            <span class="waiting-dot"></span>
            <div>
              <b>Enviado a la pantalla del DM</b>
              <small>Tirá estos dados físicos en la mesa y decile el resultado al DM. En cuanto lo cargue verás tus opciones para seguir.</small>
            </div>
          </div>

          <div class="active-move-actions">
            <button type="button" class="btn-primary move-confirm-btn" id="sendMoveBtn">📤 Enviar al DM (el DM anota el resultado)</button>
            <button type="button" class="btn-outline" id="continueTurnBtn" hidden>Elegir otro movimiento</button>
          </div>
        </section>

        <div class="turn-choices-panel" id="turnChoicesPanel">
          <div class="turn-done-callout" id="turnDoneCallout" hidden>
            <b>✓ Acciones principales completadas</b>
            <p>Ya usaste tu acción, adicional y movimiento de este turno. Tocá <b>Fin de turno</b> abajo cuando termines.</p>
          </div>

          <div id="weaponChoicesWrap">
            <div class="block-head">
              <h2>⚔ Atacar con arma</h2>
              <span class="block-hint" id="attackBlockHint">1 acción</span>
            </div>
            <div class="choice-grid" id="weaponCards"></div>
          </div>

          <div id="turnSpellsWrap" hidden>
            <div class="block-head">
              <h2>✧ Lanzar conjuro</h2>
              <span class="block-hint" id="turnSpellsHint">Disponibles ahora</span>
            </div>
            <div class="choice-grid" id="turnSpellCards"></div>
          </div>

          <div id="bonusChoicesWrap">
            <div class="block-head">
              <h2>⚡ Acción adicional</h2>
              <span class="block-hint">1 por turno</span>
            </div>
            <div class="choice-grid" id="bonusCards"></div>
          </div>

          <div id="moveChoicesWrap">
            <div class="block-head">
              <h2>⌁ Desplazarse</h2>
              <span class="block-hint" id="moveBlockHint">Movimiento</span>
            </div>
            <div class="move-quick-row" id="moveCards"></div>
          </div>

          <div id="stdChoicesWrap">
            <details class="std-details">
              <summary>
                <span>📖 Acciones estándar (Correr, Esquivar, Esconderse, Ayudar…)</span>
                <i>▾</i>
              </summary>
              <div class="choice-grid std-stack" id="standardCards"></div>
            </details>
          </div>

          <div id="reactionChoicesWrap">
            <div class="block-head">
              <h2>🛡 Reacciones</h2>
              <span class="block-hint">Dentro o fuera de tu turno</span>
            </div>
            <div class="choice-grid" id="reactionCards"></div>
          </div>

          <button type="button" class="spent-toggle-btn" id="toggleSpentMovesBtn" hidden>Ver movimientos ya gastados</button>
        </div>

        <div class="end-turn-bar" id="endTurnBar">
          <button type="button" class="end-turn-btn" id="endTurnBtn">✓ Fin de turno</button>
          <small id="endTurnHint">Pasa al siguiente combatiente al terminar tus movimientos.</small>
        </div>
      </section>
`;
