export const SHELL_HEADER_HTML = `
  <!-- PANTALLA 2: GUÍA DEL JUGADOR -->
  <div class="player-shell" id="playerShell" hidden>
    <!-- HEADER COMPACTO -->
    <header class="top-bar">
      <button type="button" class="char-switcher" id="switchCharBtn" title="Cambiar personaje">
        <div class="mini-avatar" id="topAvatarBox">
          <img id="topAvatarImg" alt="" hidden>
          <span id="topAvatarFallback">K</span>
        </div>
        <div class="char-id">
          <b id="topCharName">Khael</b>
          <small id="topCharSub">Explorador 5 · Nv. 5</small>
        </div>
        <span class="switch-caret">⇄</span>
      </button>

      <button type="button" class="sync-pill" id="liveSyncBtn" title="Estado de conexión con el DM">
        <i class="dot"></i><span id="liveSyncLabel">Offline</span>
      </button>
    </header>

    <!-- BANNER DE TURNO EN VIVO -->
    <div class="turn-banner" id="turnBanner" hidden>
      <div class="turn-banner-main">
        <span class="turn-banner-badge" id="turnBannerBadge">RONDA 1</span>
        <b id="turnBannerTitle">Turno de Khael</b>
      </div>
      <small id="turnBannerSub">Tu reacción está lista</small>
    </div>

    <!-- RESUMEN VITAL + RECURSOS DEL TURNO -->
    <section class="vitals-panel">
      <div class="vitals-row">
        <div class="hp-pill">
          <div class="hp-pill-top">
            <span>PG</span>
            <b id="pHpText">53 <small>/ 63</small></b>
          </div>
          <div class="hp-track"><div class="hp-fill" id="pHpBar" style="width: 84%"></div></div>
        </div>
        <div class="stat-chip"><span>CA</span><b id="pStatAc">17</b></div>
        <div class="stat-chip"><span>VEL</span><b id="pStatSpeed">10,5 m</b></div>
        <div class="stat-chip"><span>INIC</span><b id="pStatInit">+12</b></div>
      </div>

      <div class="status-pills" id="pConditionPills" hidden></div>

      <div class="resources-bar">
        <button type="button" class="res-chip" data-res="action" id="resAction">
          <span>Acción</span><i class="res-mark">✓</i>
        </button>
        <button type="button" class="res-chip" data-res="bonus" id="resBonus">
          <span>Adicional</span><i class="res-mark">✓</i>
        </button>
        <button type="button" class="res-chip" data-res="movement" id="resMovement">
          <span id="resMoveLabel">10,5 m</span><i class="res-mark">✓</i>
        </button>
        <button type="button" class="res-chip" data-res="reaction" id="resReaction">
          <span>Reacción</span><i class="res-mark">✓</i>
        </button>
        <button type="button" class="res-reset" id="resetLocalTurnBtn" title="Restaurar recursos para un nuevo turno">↻</button>
      </div>
    </section>

    <!-- CONTENIDO PRINCIPAL POR PESTAÑAS -->
    <main class="tab-content" id="tabContent">
`;
