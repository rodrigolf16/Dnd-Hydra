import { getDefaultDarkvisionMeters, isPointVisibleToPlayers } from '../../domain/map/vision-rules.js';
import { getEnemyTokenDarkvision, hasUmbralInvisibility } from '../../domain/map/enemy-vision-rules.js';
import { emitToast, getState, saveState } from '../../application/store/encounter-store.js';
import { cloneEnemy } from '../../application/use-cases/combatant-crud.js';
import { inspectCombatant } from '../../application/use-cases/turn-flow.js';
import { $ } from '../shared/dom.js';
import { centerMapOnPoint } from './dm-map-viewport.js';

function buildVisionSubrow(c, tok, pcInfo = null) {
  const isEnemy = c.type === 'enemy';
  const subrow = document.createElement('div');
  subrow.className = 'map-roster-subrow';

  const dvLabel = document.createElement('label');
  dvLabel.innerHTML = '<span>Oscuridad (m)</span><input type="number" min="0" max="60" step="1.5">';
  const dvInp = dvLabel.querySelector('input');
  dvInp.value = String(isEnemy ? getEnemyTokenDarkvision(c, tok) : (tok.darkvision ?? getDefaultDarkvisionMeters(c)));
  dvInp.addEventListener('change', e => {
    tok.darkvision = Math.max(0, parseFloat(e.target.value) || 0);
    saveState('map');
  });

  const lightLabel = document.createElement('label');
  lightLabel.innerHTML = '<span>Luz</span><select><option value="none">Sin luz</option><option value="torch">🔥 Antorcha (6+6m)</option><option value="lantern">🏮 Linterna (9+9m)</option><option value="candle">🕯 Vela (1.5+1.5m)</option><option value="daylight">☀ Luz día (18+18m)</option></select>';
  const lSel = lightLabel.querySelector('select');
  lSel.value = tok.light || 'none';
  lSel.addEventListener('change', e => { tok.light = e.target.value; saveState('map'); });

  subrow.append(dvLabel, lightLabel);

  if (!isEnemy && hasUmbralInvisibility(c)) {
    const badge = document.createElement('span');
    const active = !!pcInfo?.isUmbralInvis;
    badge.className = `umbral-status-pill${active ? ' active' : ''}`;
    badge.title = 'Visión en la umbra (automático): en oscuridad total tiene el estado Invisible frente a criaturas que dependan de visión en la oscuridad';
    badge.textContent = active ? '👻 Invisible · Oscuridad total' : 'Visión en la umbra · auto';
    subrow.append(badge);
  }
  return subrow;
}

function buildSightNoteText(c, tok, isStaged, hiddenInDark, sightSummary) {
  if (c.type === 'enemy') {
    if (isStaged) return `PG ${c.hp}/${c.maxHp} · En reserva (arrastra al mapa)`;
    const eInfo = sightSummary?.enemySight?.[c.id];
    const visTag = tok?.hidden ? 'Oculto (DM)' : hiddenInDark ? '🌑 Oculto en oscuridad' : '👁 Visible a PJs';
    const sightBits = [];
    if (eInfo?.seen?.length) sightBits.push(`Ve: ${eInfo.seen.join(', ')}`);
    if (eInfo?.missedUmbral?.length) sightBits.push(`👻 No ve a ${eInfo.missedUmbral.join(', ')}`);
    return `PG ${c.hp}/${c.maxHp} · ${visTag}${sightBits.length ? ` · ${sightBits.join(' · ')}` : ''}`;
  }
  const pcInfo = sightSummary?.pcSight?.[c.id];
  const umbTag = pcInfo?.isUmbralInvis ? ' · 👻 Estado: Invisible' : '';
  return `PG ${c.hp}/${c.maxHp} · Vis. osc. ${tok?.darkvision ?? 0} m${umbTag}`;
}

export function renderMapRoster(visionSources, sightSummary = null) {
  const state = getState();
  const m = state.map;
  const rosterRoot = $('#mapRosterList');
  rosterRoot.replaceChildren();

  state.combatants.forEach(c => {
    const tok = m.tokens[c.id];
    const isStaged = !!tok?.staged;
    const hiddenInDark = c.type === 'enemy' && (!tok || tok.hidden || tok.staged || !isPointVisibleToPlayers(tok.x, tok.y, state, visionSources));
    const row = document.createElement('div');
    row.className = `map-roster-row${c.id === state.activeTurnId ? ' active-row' : ''}${isStaged ? ' staged-row' : ''}`;

    const av = document.createElement('div');
    av.className = 'map-roster-avatar';
    if (c.avatar) {
      const img = document.createElement('img');
      img.src = c.avatar; img.alt = c.name;
      img.onerror = () => { img.remove(); av.textContent = c.name.slice(0, 1).toUpperCase(); };
      av.append(img);
    } else {
      av.textContent = c.name.slice(0, 1).toUpperCase();
    }

    const info = document.createElement('div');
    info.className = 'map-roster-info';
    info.innerHTML = '<b></b><small></small>';
    info.querySelector('b').textContent = c.name;
    info.querySelector('small').textContent = buildSightNoteText(c, tok, isStaged, hiddenInDark, sightSummary);
    info.addEventListener('click', () => {
      if (tok && !tok.staged) centerMapOnPoint(tok.x, tok.y);
      inspectCombatant(c.id);
    });

    const ctrls = document.createElement('div');
    ctrls.className = 'map-roster-controls';
    const sizeSel = document.createElement('select');
    sizeSel.title = 'Tamaño del pin en casillas';
    [1, 2, 3].forEach(sz => sizeSel.add(new Option(`${sz}×${sz}`, String(sz))));
    sizeSel.value = String(tok?.size || 1);
    sizeSel.addEventListener('change', e => { if (tok) tok.size = Number(e.target.value) || 1; saveState('map'); });
    ctrls.append(sizeSel);

    if (c.type === 'enemy') {
      const cloneBtn = document.createElement('button');
      cloneBtn.type = 'button'; cloneBtn.textContent = '⧉'; cloneBtn.title = 'Clonar adversario (en reserva)';
      cloneBtn.addEventListener('click', () => cloneEnemy(c.id));
      ctrls.append(cloneBtn);

      if (!isStaged && tok) {
        const backBtn = document.createElement('button');
        backBtn.type = 'button'; backBtn.textContent = '↩'; backBtn.title = 'Quitar del mapa y devolver a la reserva (oculto)';
        backBtn.addEventListener('click', () => {
          tok.staged = true; tok.hidden = true;
          saveState('map');
          emitToast(`${c.name} devuelto a la Reserva del DM`);
        });
        ctrls.append(backBtn);
      }
    }

    if (!isStaged) {
      const visBtn = document.createElement('button');
      visBtn.type = 'button';
      visBtn.textContent = tok?.hidden ? '◌' : '👁';
      visBtn.title = tok?.hidden ? 'Mostrar a los jugadores (si está en visión)' : 'Ocultar a los jugadores (solo DM)';
      if (tok?.hidden) visBtn.className = 'pin-hidden-btn';
      visBtn.addEventListener('click', () => { if (tok) tok.hidden = !tok.hidden; saveState('map'); });
      ctrls.append(visBtn);
    }

    row.append(av, info, ctrls);
    if (tok && !isStaged) row.append(buildVisionSubrow(c, tok, sightSummary?.pcSight?.[c.id]));
    rosterRoot.append(row);
  });
}

export function renderMapMarkersList() {
  const m = getState().map;
  const mkRoot = $('#mapMarkersList');
  mkRoot.replaceChildren();
  if (!m.markers.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-targets';
    empty.textContent = 'Sin pines libres. Pulsa «📍 Añadir pin libre» para marcar trampas, puertas o tesoros.';
    mkRoot.append(empty);
    return;
  }
  m.markers.forEach(mk => {
    const row = document.createElement('div');
    row.className = 'map-roster-row';
    const av = document.createElement('div');
    av.className = 'map-roster-avatar';
    av.style.background = mk.color || '#d3b878';
    av.style.color = '#141812';
    av.textContent = mk.icon || '📍';

    const info = document.createElement('div');
    info.className = 'map-roster-info';
    info.innerHTML = '<b></b><small>Pin libre · clic para centrar</small>';
    info.querySelector('b').textContent = mk.label;
    info.addEventListener('click', () => centerMapOnPoint(mk.x, mk.y));

    const ctrls = document.createElement('div');
    ctrls.className = 'map-roster-controls';
    const del = document.createElement('button');
    del.type = 'button'; del.textContent = '×'; del.title = 'Eliminar pin';
    del.addEventListener('click', () => { m.markers = m.markers.filter(x => x.id !== mk.id); saveState('map'); });
    ctrls.append(del);
    row.append(av, info, ctrls);
    mkRoot.append(row);
  });
}
