(() => {
  'use strict';

  const STORAGE_KEY = 'ronda-dm-physical-v4';
  const SYNC_CHANNEL = 'ronda-vtt-sync';
  const $ = sel => document.querySelector(sel);

  let state = null;
  let viewZoom = 1;
  let viewPanX = 0;
  let viewPanY = 0;
  let userMovedCamera = false;
  let exploredCanvas = null; // Offscreen explored-terrain memory canvas
  let exploredMapKey = '';
  let turnsMode = 'auto'; // 'auto' | 'show' | 'hide'
  let hudRevealTimer = null;

  const LIGHT_LABELS = {
    day: '☀ Día · Luz brillante',
    dim: '🌆 Penumbra · Luz tenue',
    night: '🌙 Noche · Oscuridad exterior',
    darkness: '⬛ Oscuridad total · Mazmorra'
  };

  // =========================================================================
  // D&D 2024 VISION & LIGHTING RULES
  // =========================================================================
  function getDefaultDarkvisionMeters(c) {
    if (!c) return 0;
    const feats = [...(c.features || []), ...(c.feats || [])].join(' ').toLowerCase();
    const sp = String(c.species || '').toLowerCase();
    const cls = String(c.className || '').toLowerCase();
    // Gloom Stalker (Visión en la umbra): +9 m (+30 ft) over 18 m Elfo = 27 m (90 ft)
    if (/visi[oó]n en la umbra|acechador en la penumbra/i.test(feats + ' ' + cls)) {
      return /elfo|enano|gnomo|infernal|tiefling|orco|semielfo|aasimar/i.test(sp) ? 27 : 18;
    }
    if (/visi[oó]n en la oscuridad/i.test(feats)) return 18;
    if (/elfo|semielfo|enano|gnomo|infernal|tiefling|orco|aasimar|drow/i.test(sp)) return 18;
    return 0;
  }

  function getTokenDarkvision(c, tok) {
    if (tok && typeof tok.darkvision === 'number' && Number.isFinite(tok.darkvision)) {
      return Math.max(0, tok.darkvision);
    }
    return getDefaultDarkvisionMeters(c);
  }

  function getLightRadiusMeters(lightType) {
    switch (lightType) {
      case 'torch': return { bright: 6, dim: 12 };     // Antorcha / Luz: 6m brillante + 6m tenue
      case 'lantern': return { bright: 9, dim: 18 };   // Linterna: 9m brillante + 9m tenue
      case 'candle': return { bright: 1.5, dim: 3 };   // Vela: 1.5m + 1.5m
      case 'daylight': return { bright: 18, dim: 36 }; // Luz del día: 18m + 18m
      default: return { bright: 0, dim: 0 };
    }
  }

  function metersToPx(meters, gridSize) {
    return (meters / 1.5) * (gridSize || 56);
  }

  function computeVisionSources(st) {
    const m = st.map;
    const gs = m.gridSize || 56;
    const light = m.lighting || 'day';
    const sources = [];

    // 1. Player Characters (PCs) emit their personal vision + any carried light source
    st.combatants.forEach(c => {
      if (c.type === 'enemy') return;
      const tok = m.tokens?.[c.id];
      if (!tok || tok.hidden) return;
      if (c.hp <= 0) return; // Unconscious PC cannot see

      const dv = getTokenDarkvision(c, tok);
      const carried = getLightRadiusMeters(tok.light || 'none');

      // Personal vision radius depending on ambient lighting (D&D 2024)
      let brightM = 0;
      let dimM = 0;

      if (light === 'day') {
        brightM = Math.max(36, dv, carried.bright);
        dimM = Math.max(48, carried.dim);
      } else if (light === 'dim') {
        // Dim light: darkvision treats dim light as bright light; normal vision sees dimly up to 18m (crisp close 6m)
        brightM = Math.max(dv, carried.bright, 4.5);
        dimM = Math.max(dv + 6, carried.dim, 18);
      } else if (light === 'night') {
        // Night outdoors: darkvision sees within its full range (dimly), normal vision only 2.2m unless carrying light
        brightM = Math.max(carried.bright, dv > 0 ? dv * 0.75 : 1.5);
        dimM = Math.max(carried.dim, dv > 0 ? dv : 3);
      } else {
        // Total darkness (dungeon/cave): ONLY darkvision or carried light!
        brightM = Math.max(carried.bright, dv > 0 ? dv * 0.65 : 1.2);
        dimM = Math.max(carried.dim, dv > 0 ? dv : 1.8);
      }

      sources.push({
        x: tok.x,
        y: tok.y,
        brightPx: metersToPx(brightM, gs),
        dimPx: metersToPx(dimM, gs),
        isDarkvisionOnly: carried.bright === 0 && dv > 0 && (light === 'night' || light === 'darkness'),
        hasCarriedLight: carried.bright > 0
      });
    });

    // 2. Light-emitting map markers (🔥 fire/torch/campfires)
    (m.markers || []).forEach(mk => {
      if (mk.dmOnly) return;
      const isLightMarker = mk.icon === '🔥' || /antorcha|fuego|fogata|luz|linterna|lámpara/i.test(mk.label || '');
      if (!isLightMarker) return;
      sources.push({
        x: mk.x,
        y: mk.y,
        brightPx: metersToPx(6, gs),
        dimPx: metersToPx(12, gs),
        isDarkvisionOnly: false,
        hasCarriedLight: true
      });
    });

    return sources;
  }

  function isPointVisibleToPlayers(x, y, st, sources) {
    const m = st.map;
    const fogOn = m.fogEnabled !== false;
    const light = m.lighting || 'day';
    if (!fogOn && light === 'day') return true;
    if (light === 'day' && !m.fogInDaylight) return true;

    for (const s of sources) {
      const dist = Math.hypot(x - s.x, y - s.y);
      if (dist <= s.dimPx) return true;
    }
    return false;
  }

  // =========================================================================
  // FOG OF WAR CANVAS RENDERER
  // =========================================================================
  function ensureExploredCanvas(w, h, mapKey) {
    if (!exploredCanvas || exploredCanvas.width !== w || exploredCanvas.height !== h || exploredMapKey !== mapKey) {
      exploredCanvas = document.createElement('canvas');
      exploredCanvas.width = w;
      exploredCanvas.height = h;
      exploredMapKey = mapKey;
    }
  }

  function renderFogOfWar(st, sources) {
    const canvas = $('#playerFogCanvas');
    const m = st.map;
    const w = m.width || 1280;
    const h = m.height || 840;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    const fogOn = m.fogEnabled !== false;
    const light = m.lighting || 'day';

    // In bright daytime with fog disabled (or daylight clear), no fog overlay needed
    if (!fogOn) return;
    if (light === 'day' && !m.fogInDaylight) return;

    const mapKey = `${w}x${h}:${(m.bgImage || '').slice(0, 40)}:${m.fogResetStamp || 0}`;
    ensureExploredCanvas(w, h, mapKey);

    // Record explored zones if explored memory is enabled
    if (m.fogMemory) {
      const ectx = exploredCanvas.getContext('2d');
      ectx.fillStyle = '#ffffff';
      sources.forEach(s => {
        ectx.beginPath();
        ectx.arc(s.x, s.y, s.dimPx, 0, Math.PI * 2);
        ectx.fill();
      });
    }

    // 1. Base darkness/fog opacity depending on lighting condition
    const fogAlpha = light === 'day' ? 0.85 : light === 'dim' ? 0.62 : light === 'night' ? 0.94 : 0.985;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(6, 8, 7, ${fogAlpha})`;
    ctx.fillRect(0, 0, w, h);

    // 2. If memory is ON, soften explored areas slightly (terrain visible, enemies still hidden!)
    if (m.fogMemory) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = light === 'darkness' ? 0.25 : 0.35;
      ctx.drawImage(exploredCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    // 3. Punch out active vision circles smoothly using radial gradients
    ctx.globalCompositeOperation = 'destination-out';
    sources.forEach(s => {
      if (s.dimPx <= 0) return;
      const innerR = Math.max(4, Math.min(s.brightPx, s.dimPx * 0.92));
      const grad = ctx.createRadialGradient(s.x, s.y, innerR * 0.72, s.x, s.y, s.dimPx);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.68, s.isDarkvisionOnly ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0.92)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.dimPx, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Subtle atmospheric tint in Dim Light / Night Darkvision
    ctx.globalCompositeOperation = 'source-over';
    if (light === 'night' || light === 'darkness') {
      sources.forEach(s => {
        if (s.hasCarriedLight) {
          const warm = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.dimPx);
          warm.addColorStop(0, 'rgba(255, 200, 115, 0.14)');
          warm.addColorStop(0.6, 'rgba(255, 175, 85, 0.06)');
          warm.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = warm;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.dimPx, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }

  // =========================================================================
  // RENDER PLAYER MAP
  // =========================================================================
  function applyCamera() {
    if (!state?.map) return;
    const m = state.map;
    const stage = $('#playerStage');
    stage.style.width = `${m.width || 1280}px`;
    stage.style.height = `${m.height || 840}px`;
    stage.style.transform = `translate(${viewPanX}px, ${viewPanY}px) scale(${viewZoom})`;
    $('#pZoomLabel').textContent = `${Math.round(viewZoom * 100)}%`;
  }

  function fitCamera() {
    const vp = $('#playerViewport');
    if (!vp || !state?.map || vp.clientWidth === 0 || vp.clientHeight === 0) return;
    const m = state.map;
    const w = m.width || 1280;
    const h = m.height || 840;
    const isFs = !!document.fullscreenElement;
    const pad = isFs ? 6 : 16;
    const maxFitZoom = isFs ? 3.5 : 2.4;
    viewZoom = Math.max(0.2, Math.min(maxFitZoom, Math.min((vp.clientWidth - pad * 2) / w, (vp.clientHeight - pad * 2) / h)));
    viewPanX = Math.round((vp.clientWidth - w * viewZoom) / 2);
    viewPanY = Math.round((vp.clientHeight - h * viewZoom) / 2);
    applyCamera();
  }

  function hpClass(hp, maxHp) {
    if (!maxHp || maxHp <= 0) return '';
    const pct = (hp / maxHp) * 100;
    return pct <= 25 ? 'hp-low' : pct <= 55 ? 'hp-mid' : '';
  }

  // Decides whether to display the Next Turns sidebar automatically when map resolution leaves horizontal room
  function updateTurnsPanelVisibility(refit = true) {
    const aside = $('#playerTurnsAside');
    const ws = $('#playerWorkspace');
    const btn = $('#pToggleTurnsBtn');
    if (!aside || !ws) return;

    let shouldShow = false;
    if (turnsMode === 'show') {
      shouldShow = true;
    } else if (turnsMode === 'hide') {
      shouldShow = false;
    } else {
      // Auto mode: show when there's unused horizontal space left over by the image aspect ratio (or no map yet)
      const W = ws.clientWidth || window.innerWidth;
      const H = ws.clientHeight || window.innerHeight;
      if (W >= 820 && H > 0) {
        const m = state?.map;
        if (!m || !m.bgImage) {
          shouldShow = true;
        } else {
          const mapRatio = (m.width || 1280) / Math.max(1, m.height || 840);
          const fittedMapW = H * mapRatio;
          const spareHorizontalPx = W - fittedMapW;
          shouldShow = spareHorizontalPx >= 140;
        }
      }
    }

    const changed = aside.hidden === shouldShow;
    aside.hidden = !shouldShow;

    if (btn) {
      const labelMap = {
        auto: shouldShow ? '☰ Turnos: Auto (ON)' : '☰ Turnos: Auto',
        show: '☰ Turnos: Fijo',
        hide: '☰ Turnos: Oculto'
      };
      btn.textContent = labelMap[turnsMode] || '☰ Turnos';
      btn.classList.toggle('active-toggle', shouldShow);
    }

    if (changed && refit && !userMovedCamera) {
      requestAnimationFrame(() => fitCamera());
    }
  }

  function renderUpcomingTurns(st, sources) {
    const list = $('#playerTurnsList');
    if (!list || !st || !Array.isArray(st.combatants)) return;

    const m = st.map || {};
    const light = m.lighting || 'day';
    const roundNum = st.round || 1;
    const asideRound = $('#asideRoundBadge');
    const asideLight = $('#asideLightFooter');
    if (asideRound) asideRound.textContent = `RONDA ${roundNum}`;
    if (asideLight) asideLight.textContent = LIGHT_LABELS[light] || LIGHT_LABELS.day;

    // Filter out hidden/staged enemies (never spoil!) and defeated enemies if skipDefeated is on
    const visibleCombatants = st.combatants.filter(c => {
      const isEnemy = c.type === 'enemy';
      if (!isEnemy) return true;
      const tok = m.tokens?.[c.id];
      if (tok?.hidden || tok?.staged) return false;
      if (tok && !isPointVisibleToPlayers(tok.x, tok.y, st, sources)) return false;
      if (st.skipDefeated !== false && (c.defeated || c.hp <= 0)) return false;
      return true;
    });

    list.replaceChildren();
    if (!visibleCombatants.length) {
      const empty = document.createElement('div');
      empty.className = 'pturn-empty';
      empty.textContent = 'Sin combatientes visibles en iniciativa.';
      list.append(empty);
      return;
    }

    // Rotate order so the active combatant is first, followed by the upcoming turns in cycle order
    let startIdx = visibleCombatants.findIndex(c => c.id === st.activeTurnId);
    if (startIdx < 0) {
      // Active turn might be a hidden enemy; find the next visible combatant after it in full combatants list
      const rawIdx = st.combatants.findIndex(c => c.id === st.activeTurnId);
      if (rawIdx >= 0) {
        for (let step = 1; step <= st.combatants.length; step += 1) {
          const cand = st.combatants[(rawIdx + step) % st.combatants.length];
          const found = visibleCombatants.findIndex(v => v.id === cand.id);
          if (found >= 0) { startIdx = found; break; }
        }
      }
      if (startIdx < 0) startIdx = 0;
    }

    const ordered = [
      ...visibleCombatants.slice(startIdx),
      ...visibleCombatants.slice(0, startIdx)
    ];

    ordered.forEach((c, idx) => {
      const isEnemy = c.type === 'enemy';
      const isCurrent = c.id === st.activeTurnId;
      const isNext = (idx === 1 && ordered[0]?.id === st.activeTurnId) || (idx === 0 && !isCurrent);
      const isDown = !!(c.defeated || c.hp <= 0);

      const card = document.createElement('div');
      card.className = 'pturn-card';
      if (isCurrent) card.classList.add('is-current');
      else if (isNext) card.classList.add('is-next');
      if (isEnemy) card.classList.add('is-enemy');
      if (isDown) card.classList.add('is-down');

      const avatar = document.createElement('div');
      avatar.className = 'pturn-avatar';
      if (c.avatar) {
        const img = document.createElement('img');
        img.src = c.avatar;
        img.alt = c.name;
        img.onerror = () => { img.remove(); avatar.textContent = isEnemy ? '⚔' : c.name.slice(0, 1).toUpperCase(); };
        avatar.append(img);
      } else {
        avatar.textContent = isEnemy ? '⚔' : c.name.slice(0, 1).toUpperCase();
      }

      const body = document.createElement('div');
      body.className = 'pturn-body';

      const topRow = document.createElement('div');
      topRow.className = 'pturn-top';
      const nameEl = document.createElement('b');
      nameEl.textContent = c.name;

      const badge = document.createElement('span');
      badge.className = 'pturn-badge';
      if (isCurrent) {
        badge.classList.add('now');
        badge.textContent = 'AHORA';
      } else if (isNext) {
        badge.classList.add('next');
        badge.textContent = 'SIGUIENTE';
      } else {
        badge.textContent = `#${idx + 1}`;
      }

      topRow.append(nameEl, badge);
      body.append(topRow);

      if (!isEnemy) {
        // PCs: show HP bar + exact HP so teammates can coordinate heals & actions
        const hpLine = document.createElement('div');
        hpLine.className = 'pturn-hp-row';
        const hpLabel = document.createElement('span');
        hpLabel.textContent = isDown ? `0 / ${c.maxHp} PG · Caído` : `${c.hp} / ${c.maxHp} PG`;
        const hpTrack = document.createElement('div');
        hpTrack.className = 'pturn-hp-track';
        const hpFill = document.createElement('i');
        const pct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
        hpFill.style.width = `${pct}%`;
        const cls = hpClass(c.hp, c.maxHp);
        if (cls) hpFill.className = cls;
        hpTrack.append(hpFill);
        hpLine.append(hpTrack, hpLabel);
        body.append(hpLine);

        const effects = [];
        if (c.raging) effects.push('🔥 Furia');
        if (c.concentration?.spell) effects.push(`✦ ${c.concentration.spell}`);
        (c.conditions || []).slice(0, 2).forEach(cond => effects.push(cond));
        if (effects.length) {
          const fx = document.createElement('div');
          fx.className = 'pturn-fx';
          fx.textContent = effects.join(' · ');
          body.append(fx);
        }
      } else {
        // Enemies: intentionally NO HP, NO AC, NO stats!
        const sub = document.createElement('span');
        sub.className = 'pturn-enemy-sub';
        sub.textContent = isDown ? 'Adversario · Fuera de combate' : 'Adversario';
        body.append(sub);
      }

      card.append(avatar, body);
      list.append(card);
    });
  }

  function renderPlayerMap() {
    if (!state || !state.map) return;
    const m = state.map;
    const gs = m.gridSize || 56;
    const light = m.lighting || 'day';

    // Top HUD
    $('#playerCampaignName').textContent = window.CAMPAIGN?.name || 'Las Grietas de Aethelgard';
    const act = state.combatants.find(c => c.id === state.activeTurnId);
    const actHiddenEnemy = act && act.type === 'enemy' && (!!m.tokens?.[act.id]?.hidden || !!m.tokens?.[act.id]?.staged);
    $('#playerTurnBanner').textContent = act
      ? `Turno actual: ${act.type === 'enemy' ? (actHiddenEnemy ? 'Adversario' : act.name) : act.name}`
      : 'Encuentro en curso';
    $('#playerLightBadge').textContent = LIGHT_LABELS[light] || LIGHT_LABELS.day;
    $('#playerRoundBadge').textContent = `RONDA ${state.round || 1}`;

    // Background & Grid
    const bgImg = $('#playerBgImg');
    if (m.bgImage) {
      if (bgImg.src !== m.bgImage) bgImg.src = m.bgImage;
      bgImg.hidden = false;
      $('#playerEmptyMsg').hidden = true;
    } else {
      bgImg.hidden = true;
      bgImg.removeAttribute('src');
      $('#playerEmptyMsg').hidden = false;
    }
    const gridEl = $('#playerGridOverlay');
    gridEl.hidden = !m.showGrid;
    gridEl.style.setProperty('--grid-size', `${gs}px`);

    updateTurnsPanelVisibility(false);

    if (!userMovedCamera) fitCamera();
    else applyCamera();

    const sources = computeVisionSources(state);

    // Render Tokens (ONLY visible PCs + enemies inside active vision & not hidden/staged by DM!)
    const layer = $('#playerTokensLayer');
    layer.replaceChildren();

    state.combatants.forEach(c => {
      const tok = m.tokens?.[c.id];
      if (!tok || tok.hidden || tok.staged) return;

      const isEnemy = c.type === 'enemy';
      if (isEnemy && !isPointVisibleToPlayers(tok.x, tok.y, state, sources)) {
        return; // Hidden in darkness / fog of war!
      }

      const sizeMult = Number(tok.size) || 1;
      const px = Math.max(30, Math.round(gs * sizeMult * 0.92));

      const el = document.createElement('div');
      el.className = 'map-token player-readonly-token';
      if (isEnemy) el.classList.add('enemy-token');
      if (c.id === state.activeTurnId) el.classList.add('active-token');
      if (c.defeated || c.hp <= 0) el.classList.add('defeated-token');
      el.style.left = `${tok.x}px`;
      el.style.top = `${tok.y}px`;
      el.style.setProperty('--token-px', `${px}px`);

      const disc = document.createElement('div');
      disc.className = 'map-token-disc';
      if (c.avatar) {
        const img = document.createElement('img');
        img.src = c.avatar;
        img.alt = c.name;
        img.onerror = () => { img.remove(); disc.textContent = c.name.slice(0, 1).toUpperCase(); };
        disc.append(img);
      } else {
        disc.textContent = c.name.slice(0, 1).toUpperCase();
      }
      el.append(disc);

      // Show HP bar ONLY for PCs (never spoil exact enemy HP!)
      if (!isEnemy) {
        const hpWrap = document.createElement('span');
        hpWrap.className = 'map-token-hp';
        const hpFill = document.createElement('i');
        const pct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
        hpFill.style.width = `${pct}%`;
        const cls = hpClass(c.hp, c.maxHp);
        if (cls) hpFill.className = cls;
        hpWrap.append(hpFill);
        el.append(hpWrap);
      }

      const label = document.createElement('span');
      label.className = 'map-token-label';
      label.textContent = c.name;
      el.append(label);

      const isMarked = state.combatants.some(x => x.markedTargetId === c.id);
      if (isMarked || c.raging || (tok.light && tok.light !== 'none')) {
        const b = document.createElement('span');
        b.className = 'map-token-badge';
        b.textContent = tok.light && tok.light !== 'none' ? '🔥' : c.raging ? '⚡' : '◎';
        el.append(b);
      }

      layer.append(el);
    });

    // Render public markers that are within player vision
    (m.markers || []).forEach(mk => {
      if (mk.dmOnly) return;
      const isLightMarker = mk.icon === '🔥' || /antorcha|fuego|fogata|luz|linterna/i.test(mk.label || '');
      if (!isLightMarker && !isPointVisibleToPlayers(mk.x, mk.y, state, sources)) return;

      const el = document.createElement('div');
      el.className = 'map-marker-pin player-readonly-token';
      el.style.left = `${mk.x}px`;
      el.style.top = `${mk.y}px`;
      el.style.setProperty('--pin-color', mk.color || '#d3b878');
      el.innerHTML = '<div class="map-marker-head"><span></span></div><span class="map-marker-label"></span>';
      el.querySelector('.map-marker-head span').textContent = mk.icon || '📍';
      el.querySelector('.map-marker-label').textContent = mk.label || 'Pin';
      layer.append(el);
    });

    renderFogOfWar(state, sources);
    renderUpcomingTurns(state, sources);
  }

  // =========================================================================
  // REAL-TIME CROSS-TAB SYNCHRONIZATION
  // =========================================================================
  function loadStateFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = JSON.parse(raw);
    } catch {}

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['rondaMapBgImage', 'rondaLiveState'], data => {
        if (data?.rondaLiveState) state = data.rondaLiveState;
        if (state?.map && !state.map.bgImage && data?.rondaMapBgImage) {
          state.map.bgImage = data.rondaMapBgImage;
        }
        renderPlayerMap();
      });
    } else {
      renderPlayerMap();
    }
  }

  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(SYNC_CHANNEL) : null;
  if (channel) {
    channel.addEventListener('message', ev => {
      const msg = ev.data;
      if (!msg) return;
      if (msg.type === 'STATE_UPDATE' && msg.state) {
        state = msg.state;
        renderPlayerMap();
      } else if (msg.type === 'SYNC_CAMERA' && msg.camera) {
        userMovedCamera = true;
        viewZoom = msg.camera.zoom || 1;
        viewPanX = msg.camera.panX || 0;
        viewPanY = msg.camera.panY || 0;
        applyCamera();
      } else if (msg.type === 'FIT_CAMERA') {
        userMovedCamera = false;
        fitCamera();
      }
    });
    channel.postMessage({ type: 'REQUEST_STATE' });
  }

  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) loadStateFromStorage();
  });

  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.rondaLiveState?.newValue) {
        state = changes.rondaLiveState.newValue;
        renderPlayerMap();
      } else if (changes.rondaMapBgImage && state?.map) {
        state.map.bgImage = changes.rondaMapBgImage.newValue || '';
        renderPlayerMap();
      }
    });
  }

  // Camera Pan & Zoom on Player Map
  const vp = $('#playerViewport');
  vp.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    vp.setPointerCapture(e.pointerId);
    vp.classList.add('panning');
    userMovedCamera = true;
    const sx = e.clientX, sy = e.clientY, ox = viewPanX, oy = viewPanY;
    const onMove = ev => { viewPanX = ox + (ev.clientX - sx); viewPanY = oy + (ev.clientY - sy); applyCamera(); };
    const onUp = ev => {
      vp.classList.remove('panning');
      vp.releasePointerCapture(ev.pointerId);
      vp.removeEventListener('pointermove', onMove);
      vp.removeEventListener('pointerup', onUp);
      vp.removeEventListener('pointercancel', onUp);
    };
    vp.addEventListener('pointermove', onMove);
    vp.addEventListener('pointerup', onUp);
    vp.addEventListener('pointercancel', onUp);
  });

  vp.addEventListener('wheel', e => {
    e.preventDefault();
    userMovedCamera = true;
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const rect = vp.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const prev = viewZoom;
    viewZoom = Math.max(0.2, Math.min(3.5, prev * factor));
    viewPanX = mx - ((mx - viewPanX) / prev) * viewZoom;
    viewPanY = my - ((my - viewPanY) / prev) * viewZoom;
    applyCamera();
  }, { passive: false });

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function revealFullscreenHudTemporarily() {
    if (!document.fullscreenElement) return;
    document.body.classList.add('hud-reveal');
    clearTimeout(hudRevealTimer);
    hudRevealTimer = setTimeout(() => {
      const hud = $('#playerMapHud');
      if (hud && !hud.matches(':hover')) {
        document.body.classList.remove('hud-reveal');
      }
    }, 2400);
  }

  function syncFullscreenState() {
    const isFs = !!document.fullscreenElement;
    document.body.classList.toggle('is-fullscreen', isFs);
    document.body.classList.remove('hud-reveal');
    const btn = $('#pFullscreenBtn');
    if (btn) {
      btn.textContent = isFs ? '✕ Salir' : '⛶ Pantalla completa';
      btn.title = isFs ? 'Salir de pantalla completa (Esc / F)' : 'Pantalla completa (tecla F)';
    }
    userMovedCamera = false;
    requestAnimationFrame(() => {
      updateTurnsPanelVisibility(false);
      fitCamera();
    });
  }

  function cycleTurnsMode() {
    turnsMode = turnsMode === 'auto' ? 'show' : turnsMode === 'show' ? 'hide' : 'auto';
    updateTurnsPanelVisibility(true);
  }

  $('#pZoomIn').addEventListener('click', () => { userMovedCamera = true; viewZoom = Math.min(3.5, viewZoom * 1.18); applyCamera(); });
  $('#pZoomOut').addEventListener('click', () => { userMovedCamera = true; viewZoom = Math.max(0.2, viewZoom * 0.85); applyCamera(); });
  $('#pFitBtn').addEventListener('click', () => { userMovedCamera = false; fitCamera(); });
  $('#pFullscreenBtn').addEventListener('click', toggleFullscreen);
  $('#pToggleTurnsBtn')?.addEventListener('click', cycleTurnsMode);

  $('#fsHoverZone')?.addEventListener('mouseenter', revealFullscreenHudTemporarily);
  $('#playerMapHud')?.addEventListener('mouseenter', () => clearTimeout(hudRevealTimer));
  $('#playerMapHud')?.addEventListener('mouseleave', () => {
    if (document.fullscreenElement) {
      hudRevealTimer = setTimeout(() => document.body.classList.remove('hud-reveal'), 900);
    }
  });

  document.addEventListener('fullscreenchange', syncFullscreenState);
  document.addEventListener('keydown', e => {
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); }
    if (e.key === 't' || e.key === 'T') { e.preventDefault(); cycleTurnsMode(); }
  });

  window.addEventListener('resize', () => {
    updateTurnsPanelVisibility(false);
    if (!userMovedCamera) fitCamera();
  });

  loadStateFromStorage();
})();
