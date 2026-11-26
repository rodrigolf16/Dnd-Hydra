export const ENCOUNTER_LEFT_HTML = `
        <div class="battle-layout" id="encounterView">
          <div class="turn-column">
            <div class="section-head">
              <div>
                <span class="section-kicker" id="turnKicker">TURNO ACTUAL</span>
                <h2 id="characterHeading">Khael <span class="level-tag">NV. 5</span></h2>
              </div>
              <div class="head-btn-group">
                <button type="button" class="outline-btn" id="exportPortraitBtn" title="Descargar imagen del personaje">⇩ Retrato</button>
                <button type="button" class="outline-btn" id="sheetDetails">Ver ficha completa</button>
              </div>
            </div>

            <div class="character-card">
              <div class="char-portrait" id="charPortraitBox">
                <img id="charPortraitImg" class="portrait-img" alt="Retrato del personaje" hidden>
                <div class="portrait-overlay"></div>
                <div class="rune" id="charRune">✳</div>
                <div class="portrait-caption" id="portraitCaption">EXPLORADOR 5</div>
                <span class="portrait-level" id="portraitLevel">NV 05</span>
              </div>
              <div class="char-info">
                <div class="char-title">
                  <div>
                    <h3 id="charCardName">Khael</h3>
                    <div class="muted" id="charCardMeta">Elfo de los bosques · Explorador 5</div>
                  </div>
                  <button type="button" class="edit-btn" id="editCharacter" title="Editar combatiente y retrato">✎</button>
                </div>

                <div class="hp-row">
                  <span>PUNTOS DE GOLPE</span>
                  <div class="hp-controls">
                    <b id="hpText">53 <small>/ 63</small></b>
                    <div class="hp-quick-btns" id="cardHpBtns">
                      <button type="button" id="hpMinus5" title="Restar 5 PG">-5</button>
                      <button type="button" id="hpMinus1" title="Restar 1 PG">-1</button>
                      <button type="button" id="hpCustomBtn" title="Aplicar daño o curación exacta">±</button>
                      <button type="button" id="hpPlus1" title="Sumar 1 PG">+1</button>
                      <button type="button" id="hpPlus5" title="Sumar 5 PG">+5</button>
                    </div>
                  </div>
                </div>
                <div class="hp-bar"><i style="width:84%" id="hpBar"></i></div>

                <div class="stat-row">
                  <div><span>CA</span><b id="statAc">17</b></div>
                  <div><span>MOV. REST.</span><b id="statMove">10.5 m</b></div>
                  <div><span>INICIATIVA</span><b id="statInit">+12</b></div>
                  <div><span>PERCEPCIÓN</span><b id="statPerc">+7</b></div>
                </div>
                <div class="ability-row" id="abilityRow"></div>
                <div class="condition-badges" id="conditionBadges"></div>
              </div>
            </div>

            <div class="turn-guide" id="turnGuide">
              <div class="turn-guide-head">
                <span class="section-kicker">RESUMEN DEL TURNO</span>
                <span class="guide-badge" id="turnGuideStatus">Turno disponible</span>
              </div>
              <p id="turnGuideText"></p>
              <div class="guide-chips" id="turnGuideChips"></div>
            </div>

            <div class="resources">
              <div class="resource-label">
                <span>RECURSOS DEL TURNO <small id="resourceSummary">Se marcan automáticamente al registrar cada movimiento</small></span>
                <button type="button" class="mini-link" id="resetTurnResourcesBtn" title="Restaurar recursos de este turno">↺ Restaurar turno</button>
              </div>
              <div class="resource-grid">
                <div class="resource" data-resource="action">
                  <span class="resource-icon">◉</span>
                  <span><b>Acción</b><small>Disponible</small></span>
                  <i></i>
                </div>
                <div class="resource" data-resource="bonus">
                  <span class="resource-icon bonus-icon">◒</span>
                  <span><b>Acción adicional</b><small>Si un rasgo la permite</small></span>
                  <i></i>
                </div>
                <div class="resource" data-resource="movement">
                  <span class="resource-icon move-icon">⌁</span>
                  <span><b>Movimiento</b><small>10.5 m restantes</small></span>
                  <i></i>
                </div>
                <div class="resource" data-resource="reaction">
                  <span class="resource-icon react-icon">ϟ</span>
                  <span><b>Reacción</b><small>Disponible dentro o fuera de tu turno</small></span>
                  <i></i>
                </div>
              </div>
            </div>

            <div class="action-area">
              <div class="action-heading">
                <div>
                  <span class="section-kicker">REGISTRO DE ACTIVIDADES</span>
                  <h2>Registrar movimiento del turno</h2>
                </div>
                <button type="button" class="text-btn" id="customAction">＋ Acción personalizada</button>
              </div>

              <div class="action-categories" id="actionGrid">
                <section class="action-group" data-action-group="movement">
                  <div class="group-heading">
                    <b>Movimiento</b>
                    <small>Puede repartirse antes y después de atacar</small>
                  </div>
                  <div class="action-grid" id="movementActions"></div>
                </section>

                <section class="action-group" data-action-group="action">
                  <div class="group-heading">
                    <b>Acción</b>
                    <small id="mainActionGroupHint">Una por turno</small>
                  </div>
                  <div class="action-grid" id="mainActions"></div>
                  <details class="standard-actions-box">
                    <summary>Acciones estándar de combate D&amp;D 2024 (Correr, Destrabarse, Esquivar, Esconderse, Ayudar, Preparar)</summary>
                    <div class="action-grid standard-grid" id="standardActions"></div>
                  </details>
                </section>

                <section class="action-group" data-action-group="bonus">
                  <div class="group-heading">
                    <b>Acción adicional</b>
                    <small>Solo si un rasgo, arma ligera o conjuro la habilita</small>
                  </div>
                  <div class="action-grid" id="bonusActions"></div>
                </section>

                <section class="action-group" data-action-group="reaction">
                  <div class="group-heading">
                    <b>Reacción</b>
                    <small>Dentro o fuera del turno · se renueva al empezar el siguiente</small>
                  </div>
                  <div class="action-grid" id="reactionActions"></div>
                </section>

                <section class="action-group" data-action-group="other">
                  <div class="group-heading">
                    <b>Conjuros fuera de una acción de combate</b>
                    <small>Rituales o lanzamientos de 1 minuto o más</small>
                  </div>
                  <div class="action-grid" id="otherActions"></div>
                </section>

                <section class="action-group passive-group" data-action-group="passive">
                  <div class="group-heading">
                    <b>Rasgos pasivos y dotes siempre activos</b>
                    <small>Haz clic en cualquiera para ver qué hace</small>
                  </div>
                  <div class="passive-traits" id="passiveTraits"></div>
                </section>
              </div>
            </div>

            <div class="log-panel">
              <div class="log-head">
                <div>
                  <span class="section-kicker">REGISTRO DE COMBATE</span>
                  <b>Historial de tiradas físicas y movimientos</b>
                </div>
                <div class="log-actions">
                  <button type="button" class="text-btn" id="copyLogBtn">Copiar historial</button>
                  <button type="button" class="text-btn" id="clearLog">Limpiar</button>
                </div>
              </div>
              <div class="log-list" id="logList"></div>
            </div>
          </div>

`;
