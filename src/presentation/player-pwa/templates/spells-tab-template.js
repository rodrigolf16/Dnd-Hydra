export const SPELLS_TAB_HTML = `
      <!-- TAB 2: CONJUROS Y USOS LIMITADOS -->
      <section class="tab-pane" id="paneSpells" data-pane="spells">
        <div id="usesBlockWrap">
          <div class="block-head">
            <h2>✦ Usos limitados y espacios</h2>
            <span class="block-hint" id="usesHint">Toca para llevar la cuenta</span>
          </div>
          <div class="uses-grid" id="playerUsesList"></div>
        </div>

        <div id="spellsBlockWrap">
          <div class="spell-hero" id="spellHero">
            <div>
              <span>CD DE SALVACIÓN</span>
              <b id="spellSaveDc">15</b>
            </div>
            <div>
              <span>ATAQUE CONJURO</span>
              <b id="spellAtkBonus">1×d20 + 7</b>
            </div>
            <div>
              <span>PREPARADOS</span>
              <b id="spellPreparedCount">6</b>
            </div>
          </div>

          <div class="filter-chips" id="spellFilters">
            <button type="button" class="filter-chip active" data-spell-filter="all">Todos</button>
            <button type="button" class="filter-chip" data-spell-filter="0">Trucos</button>
            <button type="button" class="filter-chip" data-spell-filter="1">Nv. 1</button>
            <button type="button" class="filter-chip" data-spell-filter="2">Nv. 2+</button>
            <button type="button" class="filter-chip" data-spell-filter="bonus">Adicional</button>
            <button type="button" class="filter-chip" data-spell-filter="reaction">Reacción</button>
          </div>

          <div class="card-stack" id="spellCards"></div>
        </div>

        <div class="empty-card" id="noSpellsCard" hidden>
          <b>Personaje marcial</b>
          <p>Este personaje no tiene conjuros cargados. Usa la pestaña <b>⚔ Turno</b> para ver tus armas, maestrías y rasgos de combate.</p>
        </div>
      </section>
`;
