export const MAP_TOOLBAR_HTML = `
        <!-- VISTA MAPA TÁCTICO 2D -->
        <section class="map-view" id="mapView" hidden>
          <div class="map-toolbar">
            <div class="map-toolbar-group">
              <button type="button" class="primary-btn" id="mapUploadBtn">⇧ Subir imagen de mapa</button>
              <input type="file" id="mapBgFileInput" accept="image/*" hidden>
              <button type="button" class="outline-btn" id="mapUrlBtn">🔗 URL de fondo</button>
              <button type="button" class="outline-btn" id="mapEditBgBtn" title="Mover o escalar la imagen de fondo directamente sobre la cuadrícula (Esc para salir)">✎ Editar imagen</button>
              <button type="button" class="outline-btn" id="mapRotateLeftBtn" title="Girar imagen del mapa 90° a la izquierda">⟲ -90°</button>
              <button type="button" class="outline-btn" id="mapRotateRightBtn" title="Girar imagen del mapa 90° a la derecha">⟳ +90°</button>
              <button type="button" class="outline-btn" id="mapClearBgBtn" title="Quitar imagen de fondo">✕ Quitar fondo</button>
            </div>

            <div class="map-toolbar-group">
              <button type="button" class="outline-btn" id="mapAddMarkerBtn">📍 Añadir pin libre</button>
              <button type="button" class="outline-btn" id="mapMeasureBtn" title="Medir distancia entre dos puntos en metros">📏 Medir</button>
              <label class="map-check" title="Mostrar cuadrícula táctica">
                <input type="checkbox" id="mapGridToggle" checked>
                <span>Cuadrícula</span>
              </label>
              <label class="map-color-label" title="Cambiar color de las líneas de la cuadrícula (se sincroniza con la pantalla de jugadores)">
                <span>Color</span>
                <input type="color" id="mapGridColor" value="#d2e2ae">
              </label>
              <label class="map-check" title="Ajustar los pines al centro de cada casilla al soltarlos">
                <input type="checkbox" id="mapSnapToggle" checked>
                <span>Imán</span>
              </label>
              <label class="map-check" title="Descontar automáticamente los metros movidos del turno actual al arrastrar un pin">
                <input type="checkbox" id="mapTrackMoveToggle" checked>
                <span>Descontar mov.</span>
              </label>
            </div>

            <div class="map-toolbar-group map-zoom-group">
              <label class="map-scale-input-label" title="Ancho total real del mapa en metros (ajusta la cuadrícula y el alcance de visión)">
                <span>Ancho mapa</span>
                <input type="number" id="mapWidthMetersInput" min="6" max="500" step="1" value="34">
                <small>m</small>
              </label>
              <label class="map-select-label" title="Cuántos metros representa cada casilla de la cuadrícula">
                <span>1 casilla</span>
                <select id="mapMetersPerSqSelect">
                  <option value="1.5">1,5 m (D&amp;D)</option>
                  <option value="3">3 m</option>
                  <option value="4.5">4,5 m</option>
                  <option value="6">6 m</option>
                </select>
              </label>
              <label class="map-slider-label" title="Ajuste fino del tamaño visual de cada casilla en píxeles">
                <span>Casilla</span>
                <input type="range" id="mapGridSize" min="14" max="110" step="1" value="56">
              </label>
              <button type="button" class="icon-btn" id="mapZoomOut" title="Alejar">−</button>
              <span class="map-zoom-val" id="mapZoomLabel">100%</span>
              <button type="button" class="icon-btn" id="mapZoomIn" title="Acercar">＋</button>
              <button type="button" class="outline-btn" id="mapResetViewBtn" title="Centrar y ajustar vista">Centrar</button>
            </div>
          </div>

          <div class="map-toolbar map-bg-edit-bar" id="mapBgEditBar" hidden>
            <div class="map-toolbar-group">
              <span class="bg-edit-hint">✎ Arrastra la imagen o las esquinas doradas para mover, escalar y alinear con la cuadrícula</span>
            </div>
            <div class="map-toolbar-group">
              <button type="button" class="icon-btn" id="mapBgScaleDownBtn" title="Reducir escala de la imagen">−</button>
              <label class="map-slider-label" title="Escala de la imagen de fondo">
                <span>Escala</span>
                <input type="range" id="mapBgScaleSlider" min="20" max="300" step="2" value="100">
                <strong id="mapBgScaleLabel">100%</strong>
              </label>
              <button type="button" class="icon-btn" id="mapBgScaleUpBtn" title="Aumentar escala de la imagen">＋</button>
              <button type="button" class="outline-btn" id="mapBgResetTransformBtn" title="Centrar imagen al 100%">↺ Restablecer</button>
              <button type="button" class="primary-btn" id="mapBgDoneEditBtn">✓ Listo</button>
            </div>
          </div>

          <div class="map-toolbar map-lighting-bar">
            <div class="map-toolbar-group">
              <label class="map-select-label" title="Condición de luz ambiental (afecta visión y niebla en la pantalla de jugadores)">
                <span>Iluminación</span>
                <select id="mapLightingSelect">
                  <option value="day">☀ Día · Luz brillante</option>
                  <option value="dim">🌆 Penumbra · Luz tenue</option>
                  <option value="night">🌙 Noche · Oscuridad exterior</option>
                  <option value="darkness">⬛ Oscuridad total · Mazmorra</option>
                </select>
              </label>
              <label class="map-check" title="Activar Niebla de Guerra en la pantalla de jugadores">
                <input type="checkbox" id="mapFogToggle" checked>
                <span>Niebla jugadores</span>
              </label>
              <label class="map-check" title="Mantener suavemente visible el terreno ya explorado (los enemigos fuera de visión siguen ocultos)">
                <input type="checkbox" id="mapFogMemoryToggle" checked>
                <span>Memoria explorada</span>
              </label>
              <label class="map-check" title="Dibujar los radios de visión y luz de los PJs en tu pantalla DM">
                <input type="checkbox" id="mapShowVisionRingsToggle" checked>
                <span>Visión PJs</span>
              </label>
              <label class="map-check" title="Dibujar el alcance visual de los enemigos colocados en el mapa (solo visible para el DM)">
                <input type="checkbox" id="mapShowEnemyVisionToggle" checked>
                <span>Visión enemigos</span>
              </label>
              <button type="button" class="mini-btn" id="mapResetFogBtn" title="Volver a cubrir toda la memoria explorada">↺ Reiniciar memoria</button>
            </div>

            <div class="map-toolbar-group">
              <button type="button" class="outline-btn" id="syncPlayerCameraBtn" title="Centrar la cámara de la pestaña de jugadores como la del DM">◎ Sincronizar vista</button>
              <button type="button" class="outline-btn" id="openDmMapTabBtn" title="Abrir este Mapa DM en una pestaña aparte">🗺 Mapa DM aparte</button>
              <button type="button" class="primary-btn" id="openPlayerMapBtn" title="Abrir la pantalla compartible para jugadores con Niebla de Guerra">🖥 Pantalla Jugadores</button>
            </div>
          </div>

          <div class="map-toolbar map-walls-bar">
            <div class="map-toolbar-group">
              <span class="toolbar-mini-kicker">PAREDES (BLOQUEAN VISIÓN)</span>
              <button type="button" class="outline-btn" id="mapWallDrawBtn" title="Arrastra en el mapa para trazar paredes de edificios o bosques que bloquean la visión (Esc para salir)">🧱 Dibujar pared</button>
              <button type="button" class="outline-btn" id="mapWallEraseBtn" title="Haz clic sobre una pared para borrarla">🧹 Borrar pared</button>
              <button type="button" class="mini-btn" id="mapWallUndoBtn" title="Deshacer última pared">↩</button>
              <button type="button" class="mini-btn" id="mapWallClearBtn" title="Eliminar todas las paredes">✕ Paredes (<span id="mapWallCount">0</span>)</button>
            </div>

            <div class="map-toolbar-group">
              <span class="toolbar-mini-kicker">NIEBLA MANUAL</span>
              <button type="button" class="outline-btn" id="mapFogCoverBtn" title="Pinta niebla opaca manualmente para cubrir bosques, edificios o salas (oculta enemigos incluso de día)">🌑 Pintar niebla</button>
              <button type="button" class="outline-btn" id="mapFogRevealBtn" title="Borra/revela niebla manualmente en un área">☀ Revelar área</button>
              <label class="map-slider-label" title="Grosor del pincel de niebla manual">
                <span>Pincel</span>
                <input type="range" id="mapFogBrushSize" min="18" max="150" step="2" value="52">
              </label>
              <button type="button" class="mini-btn" id="mapFogStrokeUndoBtn" title="Deshacer último trazo manual">↩</button>
              <button type="button" class="mini-btn" id="mapFogStrokeClearBtn" title="Limpiar toda la niebla manual">✕ Limpiar</button>
            </div>
          </div>

`;
