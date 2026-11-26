import { hpClass } from '../../domain/shared/formatters.js';
import { isPointVisibleToPlayers } from '../../domain/map/vision-rules.js';
import { $ } from '../shared/dom.js';

export const LIGHT_LABELS = {
  day: '☀ Día · Visión plena',
  dim: '⛅ Luz tenue · Penumbra',
  night: '🌙 Noche · Oscuridad parcial',
  darkness: '🌑 Oscuridad total · Mazmorra'
};

export function updateTurnsPanelVisibility(state, turnsMode, userMovedCamera, onRefit, refit = true) {
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
    const W = ws.clientWidth || window.innerWidth;
    const H = ws.clientHeight || window.innerHeight;
    if (W >= 820 && H > 0) {
      const m = state?.map;
      if (!m || !m.bgImage) {
        shouldShow = true;
      } else {
        const mapRatio = (m.width || 1280) / Math.max(1, m.height || 840);
        shouldShow = (W - H * mapRatio) >= 140;
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

  if (changed && refit && !userMovedCamera && onRefit) {
    requestAnimationFrame(() => onRefit());
  }
}

export function renderUpcomingTurns(st, sources) {
  const list = $('#playerTurnsList');
  if (!list || !st || !Array.isArray(st.combatants)) return;

  const m = st.map || {};
  const light = m.lighting || 'day';
  const asideRound = $('#asideRoundBadge');
  const asideLight = $('#asideLightFooter');
  if (asideRound) asideRound.textContent = `RONDA ${st.round || 1}`;
  if (asideLight) asideLight.textContent = LIGHT_LABELS[light] || LIGHT_LABELS.day;

  const visibleCombatants = st.combatants.filter(c => {
    if (c.type !== 'enemy') return true;
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

  let startIdx = visibleCombatants.findIndex(c => c.id === st.activeTurnId);
  if (startIdx < 0) {
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

  const ordered = [...visibleCombatants.slice(startIdx), ...visibleCombatants.slice(0, startIdx)];
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
      img.src = c.avatar; img.alt = c.name;
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
    if (isCurrent) { badge.classList.add('now'); badge.textContent = 'AHORA'; }
    else if (isNext) { badge.classList.add('next'); badge.textContent = 'SIGUIENTE'; }
    else badge.textContent = `#${idx + 1}`;
    topRow.append(nameEl, badge);
    body.append(topRow);

    if (!isEnemy) {
      const hpLine = document.createElement('div');
      hpLine.className = 'pturn-hp-row';
      const hpLabel = document.createElement('span');
      hpLabel.textContent = isDown ? `0 / ${c.maxHp} PG · Caído` : `${c.hp} / ${c.maxHp} PG`;
      const hpTrack = document.createElement('div');
      hpTrack.className = 'pturn-hp-track';
      const hpFill = document.createElement('i');
      hpFill.style.width = `${c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0}%`;
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
      const sub = document.createElement('span');
      sub.className = 'pturn-enemy-sub';
      sub.textContent = isDown ? 'Adversario · Fuera de combate' : 'Adversario';
      body.append(sub);
    }

    card.append(avatar, body);
    list.append(card);
  });
}
