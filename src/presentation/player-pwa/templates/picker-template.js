export const PICKER_HTML = `
  <!-- PANTALLA 1: SELECTOR DE PERSONAJE -->
  <section class="picker-screen" id="pickerScreen" hidden>
    <header class="picker-header">
      <div class="picker-brand">
        <span class="brand-mark">R</span>
        <div>
          <span class="kicker">D&amp;D 2024 · DADOS FÍSICOS</span>
          <h1 id="pickerCampaignName">Las Grietas de Aethelgard</h1>
        </div>
      </div>
      <button type="button" class="sync-pill" id="pickerSyncBtn" title="Conectar con la mesa del DM">
        <i class="dot"></i><span>Offline</span>
      </button>
    </header>

    <p class="picker-lead">
      Elige tu personaje para ver tus <b>movimientos disponibles</b> y <b>qué dados físicos tirar</b> en tu turno. El mapa y el daño los lleva el DM.
    </p>

    <div class="picker-grid" id="pickerGrid"></div>

    <footer class="picker-foot">
      <small>Funciona sin internet. Si el DM abre una sala, escanea su QR o toca el botón superior para recibir tu turno y PG en vivo.</small>
    </footer>
  </section>

`;
