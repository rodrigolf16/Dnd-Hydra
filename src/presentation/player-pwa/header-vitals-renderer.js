import { formatMeters, signed } from '../../domain/shared/formatters.js';
import { getLevel } from '../../domain/combat/combatant-stats.js';
import { $, showToast } from '../shared/dom.js';
import { isLiveConnected, pwaState } from './pwa-state.js';

export function renderPlayerHeaderAndVitals(c, res) {
  $('#topCharName').textContent = c.name;
  $('#topCharSub').textContent = `${c.className || 'Aventurero'} · Nv. ${getLevel(c)}`;
  const topImg = $('#topAvatarImg');
  const topFb = $('#topAvatarFallback');
  if (c.avatar) {
    topImg.src = c.avatar;
    topImg.alt = c.name;
    topImg.hidden = false;
    topFb.hidden = true;
    topImg.onerror = () => {
      topImg.hidden = true;
      topFb.hidden = false;
      topFb.textContent = c.name.slice(0, 1).toUpperCase();
    };
  } else {
    topImg.hidden = true;
    topFb.hidden = false;
    topFb.textContent = c.name.slice(0, 1).toUpperCase();
  }

  const turnBanner = $('#turnBanner');
  const payload = pwaState.livePayload;
  if (payload && payload.activeTurnId) {
    const isMine = payload.activeTurnId === c.id;
    turnBanner.hidden = false;
    turnBanner.classList.toggle('is-my-turn', isMine);
    $('#turnBannerBadge').textContent = `RONDA ${payload.round || 1}`;
    $('#turnBannerTitle').textContent = isMine
      ? '⚔ ¡ES TU TURNO!'
      : `Turno actual: ${payload.activeTurnName || 'En curso'}`;
    $('#turnBannerSub').textContent = payload.paused
      ? 'Encuentro en pausa por el DM'
      : isMine
        ? 'Revisa abajo tus acciones disponibles y qué dados agarrar.'
        : res.reaction
          ? 'Tu Reacción está lista si pasa algo fuera de tu turno.'
          : 'Ya gastaste tu Reacción hasta tu próximo turno.';

    const turnKey = `${payload.round}:${payload.activeTurnId}`;
    if (isMine && turnKey !== pwaState.lastNotifiedTurnKey && isLiveConnected()) {
      pwaState.lastNotifiedTurnKey = turnKey;
      if (navigator.vibrate) {
        try { navigator.vibrate([120, 60, 120]); } catch {}
      }
      showToast('⚔ ¡Es tu turno!', '#playerToast', 2800);
    }
  } else {
    turnBanner.hidden = true;
  }

  $('#pHpText').innerHTML = `${c.hp} <small>/ ${c.maxHp}</small>`;
  const pct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
  const hpBar = $('#pHpBar');
  hpBar.style.width = `${pct}%`;
  hpBar.className = 'hp-fill' + (pct <= 25 ? ' hp-low' : pct <= 55 ? ' hp-mid' : '');
  $('#pStatAc').textContent = c.ac ?? '—';
  $('#pStatSpeed').textContent = `${formatMeters(c.speed || 9, true)} m`;
  $('#pStatInit').textContent = signed(c.initiative || 0);

  const condWrap = $('#pConditionPills');
  condWrap.replaceChildren();
  const badges = [];
  if (c.raging) badges.push({ text: '🔥 En Furia', cls: 'rage' });
  if (c.markedTargetName) badges.push({ text: `◎ Marca: ${c.markedTargetName}`, cls: '' });
  if (c.concentration?.spell) badges.push({ text: `✦ Conc.: ${c.concentration.spell}`, cls: 'conc' });
  if (c.steadyAimActive) badges.push({ text: '🎯 Puntería certera', cls: '' });
  (c.conditions || []).forEach(cond => badges.push({ text: cond, cls: '' }));
  if (badges.length) {
    condWrap.hidden = false;
    badges.forEach(b => {
      const s = document.createElement('span');
      s.className = `status-tag ${b.cls}`.trim();
      s.textContent = b.text;
      condWrap.append(s);
    });
  } else {
    condWrap.hidden = true;
  }

  $('#resAction').classList.toggle('used', !res.action);
  $('#resBonus').classList.toggle('used', !res.bonus);
  $('#resMovement').classList.toggle('used', !res.movement);
  $('#resReaction').classList.toggle('used', !res.reaction);
  $('#resMoveLabel').textContent = `${formatMeters(res.movementMeters, true)} m`;
  $('#resetLocalTurnBtn').hidden = res.synced;

  const hasSpells = Array.isArray(c.spells?.names) && c.spells.names.length > 0;
  $('#spellsNavLabel').textContent = hasSpells ? 'Conjuros' : 'Usos';
}
