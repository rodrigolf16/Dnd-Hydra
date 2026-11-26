export const MAP_WORKSPACE_HTML = `
          <div class="map-workspace">
            <div class="map-viewport" id="mapViewport">
              <div class="map-stage" id="mapStage">
                <div class="map-bg-box" id="mapBgBox" hidden>
                  <img id="mapBgImg" class="map-bg-img" alt="Mapa táctico 2D" draggable="false">
                  <span class="bg-resize-handle nw" data-resize-corner="nw" title="Arrastra para escalar"></span>
                  <span class="bg-resize-handle ne" data-resize-corner="ne" title="Arrastra para escalar"></span>
                  <span class="bg-resize-handle sw" data-resize-corner="sw" title="Arrastra para escalar"></span>
                  <span class="bg-resize-handle se" data-resize-corner="se" title="Arrastra para escalar"></span>
                </div>
                <div class="map-grid-overlay" id="mapGridOverlay"></div>
                <canvas class="dm-manual-fog-canvas" id="mapManualFogCanvas"></canvas>
                <svg class="map-vision-svg" id="mapVisionSvg"></svg>
                <svg class="map-walls-svg" id="mapWallsSvg"></svg>
                <svg class="map-measure-svg" id="mapMeasureSvg" hidden>
                  <line id="mapMeasureLine" x1="0" y1="0" x2="0" y2="0"></line>
                  <circle id="mapMeasureStart" cx="0" cy="0" r="5"></circle>
                  <circle id="mapMeasureEnd" cx="0" cy="0" r="5"></circle>
                </svg>
                <div class="map-measure-badge" id="mapMeasureBadge" hidden>0 m</div>
                <div class="map-tokens-layer" id="mapTokensLayer"></div>
              </div>
              <div class="map-drag-distance" id="mapDragDistance" hidden>0 m</div>
              <div class="map-scale-bar" id="dmScaleBar" title="Escala real del mapa según el zoom actual">
                <div class="scale-bar-top">
                  <span class="scale-bar-line"></span>
                  <b class="scale-bar-label">9 m</b>
                </div>
                <small class="scale-bar-meta">6 casillas · Mapa 34×22,5 m</small>
              </div>
              <div class="map-empty-hint" id="mapEmptyHint">
                <b>Tablero táctico 2D listo</b>
                <span>Sube una imagen de mapa o arrastra directamente los pines de tus personajes y enemigos sobre la cuadrícula.</span>
              </div>
            </div>

            <aside class="map-sidepanel">
              <div class="side-card reserve-card" id="mapReserveCard">
                <div class="side-card-head">
                  <div>
                    <span class="section-kicker">SOLO DM · FUERA DEL MAPA</span>
                    <h3>Reserva de enemigos <span class="reserve-count-badge" id="mapReserveCount">0</span></h3>
                  </div>
                  <button type="button" class="more-btn" id="mapAddEnemySideBtn" title="Añadir uno o varios enemigos a la reserva">＋</button>
                </div>
                <label class="reserve-reveal-toggle">
                  <input type="checkbox" id="mapRevealOnDropCheck" checked>
                  <span>Revelar a jugadores al soltar en el mapa</span>
                </label>
                <div class="map-reserve-list" id="mapReserveList"></div>
              </div>

              <div class="side-card">
                <div class="side-card-head">
                  <div>
                    <span class="section-kicker">FIGURAS EN EL MAPA</span>
                    <h3>Pines de combatientes</h3>
                  </div>
                  <button type="button" class="mini-link" id="mapResetPinsBtn" title="Reordenar los pines ubicados en el mapa">Alinear</button>
                </div>
                <div class="map-roster-list" id="mapRosterList"></div>
              </div>

              <div class="side-card">
                <div class="side-card-head">
                  <div>
                    <span class="section-kicker">MARCADORES DEL DM</span>
                    <h3>Pines libres</h3>
                  </div>
                  <button type="button" class="more-btn" id="mapAddMarkerSideBtn" title="Nuevo pin libre">＋</button>
                </div>
                <div class="map-markers-list" id="mapMarkersList"></div>
              </div>
            </aside>
          </div>
        </section>
      </section>
    </main>
  </div>

`;
