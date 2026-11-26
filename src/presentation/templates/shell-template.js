export const SHELL_HTML = `
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#top" id="brandHome">
        <span class="brand-mark">R</span>
        <span>ronda<small>PANEL DEL DIRECTOR (DM)</small></span>
      </a>
      <div class="nav-label">MESA DM</div>
      <button type="button" class="nav-item active" id="encounterNav" title="Ir al encuentro (tecla 1)">
        <span>⚔</span> <span class="nav-text">Encuentro</span> <kbd>1</kbd>
      </button>
      <button type="button" class="nav-item" id="mapNav" title="Abrir Mapa 2D con pines (tecla 2)">
        <span>🗺</span> <span class="nav-text">Mapa 2D</span> <kbd>2</kbd>
      </button>
      <button type="button" class="nav-item" id="charactersNav" title="Importar o editar personajes">
        <span>♙</span> <span class="nav-text">Personajes</span>
      </button>
      <button type="button" class="nav-item" id="nivel20Nav" title="Enlace rápido a Nivel20">
        <span>⇶</span> <span class="nav-text">Nivel20</span> <span class="nav-dot"></span>
      </button>
      <button type="button" class="nav-item" id="manualsNav" title="Manuales y contenido JSON">
        <span>▤</span> <span class="nav-text">Manuales</span>
      </button>

      <div class="sidebar-bottom">
        <button type="button" class="campaign" id="campaignBtn" title="Ajustes de campaña y reinicio">
          <div class="campaign-icon">✧</div>
          <div>
            <small>CAMPAÑA</small>
            <b id="campaignSidebarName">Las Grietas de Aethelgard</b>
          </div>
          <span>⚙</span>
        </button>
        <div class="user-row">
          <div class="avatar">DM</div>
          <span>
            <strong>Director de mesa</strong>
            <small>Registro de turnos y dados físicos</small>
          </span>
          <button type="button" id="userOptionsBtn" aria-label="Ajustes de mesa" title="Ajustes de mesa">···</button>
        </div>
      </div>
    </aside>

    <main class="main" id="top">
      <header class="topbar">
        <div class="breadcrumb">
          Panel DM <span>/</span> <b id="breadcrumbName">Las Grietas de Aethelgard</b>
          <i class="live-dot" id="liveDot"></i>
        </div>
        <div class="top-actions">
          <span class="dm-mode-badge">⚔ Modo Director (DM) · Dados físicos</span>
          <button type="button" class="outline-btn mobile-sync-pill" id="mobileSyncTopBtn" title="Conectar celulares de jugadores (QR y código en vivo)">
            📱 <span>Celulares</span>
          </button>
          <button type="button" class="outline-btn n20-pill" id="syncNivel20TabBtn" hidden title="Leer y actualizar el personaje abierto en tu pestaña de Nivel20">
            ⟳ <span>Sincronizar Nivel20</span>
          </button>
          <button type="button" class="outline-btn n20-pill" id="nivel20TopBtn" title="Abrir campaña en Nivel20">
            ⇶ <span>Nivel20</span>
          </button>
          <button type="button" class="icon-btn" id="helpBtn" title="Guía rápida">?</button>
          <button type="button" class="icon-btn" id="settingsBtnTop" title="Ajustes y reinicio del encuentro">⚙</button>
          <button type="button" class="invite-btn" id="shareBtn" title="Copiar orden de iniciativa y estado">↗ <span>Copiar estado</span></button>
        </div>
      </header>

      <section class="content">
        <div class="page-heading">
          <div>
            <div class="eyebrow">
              <span class="live-dot"></span>
              <span id="encounterStatusLabel">ENCUENTRO EN CURSO</span>
              <span class="sep">·</span>
              <span id="eyebrowRound">RONDA 1</span>
            </div>
            <h1 id="campaignTitle">Las Grietas de Aethelgard</h1>
            <p id="campaignSubtitle">Registro del DM · Turnos, cantidades de dados físicos, resultados y PG</p>
          </div>
          <div class="heading-actions">
            <button type="button" class="outline-btn" id="finishBtn">Ⅱ <span>Pausar encuentro</span></button>
          </div>
        </div>

        <div class="initiative-strip">
          <div class="strip-title">
            ORDEN DE INICIATIVA
            <span id="roundLabel">RONDA 1</span>
          </div>
          <div class="initiative-list" id="initiativeList"></div>
          <div class="initiative-controls">
            <button type="button" class="add-combatant" id="addCombatant" title="Añadir adversario">＋</button>
            <button type="button" class="roll-initiative" id="editInitiativeBtn" title="Cargar iniciativas físicas manualmente y ordenar de mayor a menor">✎ Cargar iniciativas</button>
            <button type="button" class="roll-initiative" id="swapInitiativeBtn" title="Intercambiar lugar entre dos combatientes (ej. dote Alerta)">⇄ Intercambiar</button>
            <button type="button" class="next-turn" id="nextTurn" title="Avanzar al siguiente combatiente en iniciativa">Siguiente turno <span>→</span></button>
          </div>
        </div>

        <div class="swap-banner" id="swapBanner" hidden>
          <div>
            <b>⇄ Modo intercambio de iniciativa (dote Alerta)</b>
            <span id="swapBannerText">Haz clic en el primer combatiente en la barra de iniciativa y luego en el segundo para intercambiar sus puestos.</span>
          </div>
          <button type="button" class="outline-btn" id="cancelSwapBtn">Cancelar</button>
        </div>

        <div class="inspect-banner" id="inspectBanner" hidden>
          <div class="inspect-banner-text">
            <b>Modo inspección</b>
            <span id="inspectBannerDetail">Estás viendo otra ficha sin cambiar el orden de iniciativa. Puedes registrar su Reacción o ajustar sus PG.</span>
          </div>
          <div class="inspect-banner-actions">
            <button type="button" class="outline-btn" id="returnToActiveTurn">Volver al turno actual</button>
            <button type="button" class="primary-btn" id="setAsActiveTurn">Pasar turno aquí</button>
          </div>
        </div>

        <div class="mobile-action-banner" id="mobileActionBanner" hidden>
          <div class="mobile-action-banner-text">
            <b id="mobileActionBannerTitle">📱 Jugador eligió un movimiento</b>
            <span id="mobileActionBannerDetail">Toca «Anotar resultado» para cargar lo que sacó en los dados físicos.</span>
          </div>
          <div class="mobile-action-banner-actions">
            <button type="button" class="primary-btn" id="mobileActionOpenBtn">🎲 Anotar resultado</button>
            <button type="button" class="outline-btn" id="mobileActionDismissBtn">Descartar</button>
          </div>
        </div>

`;
