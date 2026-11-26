import { formatMeters, hpClass, signed } from '../../domain/shared/formatters.js';
import { getAbilityMod, getLevel, getPerception } from '../../domain/combat/combatant-stats.js';
import { hasMellarAccess } from '../../domain/combat/combatant-features.js';
import { isViewingActiveTurn, viewed } from '../../application/store/encounter-store.js';
import { $, $$ } from '../shared/dom.js';
import { renderConditionBadges, renderTurnGuide } from './turn-status-renderer.js';

export function renderResourcesOnly(c) {
  const ts = c.turnState;
  $$('.resource').forEach(el => {
    const key = el.dataset.resource;
    if (!key) return;
    const available = key === 'movement' ? c.turnMovement > 0 : !!ts[key];
    el.classList.toggle('used', !available);
    const small = el.querySelector('small');
    if (key === 'movement') {
      small.textContent = c.turnMovement > 0
        ? `${formatMeters(c.turnMovement)} m de ${formatMeters(c.speed || 0)} m restantes`
        : '0 m restantes este turno';
    } else if (key === 'action') {
      if (ts.action) small.textContent = c.turnMaxAttacks > 1 ? `Disponible (${c.turnAttacksRemaining} ataques con Atacar)` : 'Disponible';
      else if (c.attackSequenceOpen && (c.turnAttacksRemaining > 0 || (hasMellarAccess(c) && c.turnBaseAttackMade && !c.turnNickUsed))) {
        small.textContent = `Atacar en curso (${c.turnAttacksRemaining} restantes)`;
      } else {
        small.textContent = 'Gastada en este turno';
      }
    } else if (key === 'bonus') {
      small.textContent = ts.bonus ? 'Disponible si un rasgo/conjuro la usa' : 'Gastada en este turno';
    } else if (key === 'reaction') {
      small.textContent = ts.reaction ? 'Disponible dentro o fuera del turno' : 'Gastada · vuelve en su próximo turno';
    }
    el.querySelector('i').textContent = available ? '' : '✓';
  });
}

export function renderCharacter(onRenderActions) {
  const c = viewed();
  if (!c) return;

  const lvl = getLevel(c);
  $('#turnKicker').textContent = isViewingActiveTurn() ? 'TURNO ACTUAL' : 'INSPECCIONANDO FICHA';
  $('#characterHeading').innerHTML = '';
  $('#characterHeading').append(document.createTextNode(`${c.name} `));
  const tag = document.createElement('span');
  tag.className = 'level-tag';
  tag.textContent = c.type === 'enemy' ? 'ADVERSARIO' : `NV. ${lvl}`;
  $('#characterHeading').append(tag);

  const portraitBox = $('#charPortraitBox');
  const portraitImg = $('#charPortraitImg');
  const rune = $('#charRune');
  portraitBox.classList.toggle('enemy-portrait', c.type === 'enemy');
  if (c.avatar) {
    portraitImg.src = c.avatar;
    portraitImg.alt = `Retrato de ${c.name}`;
    portraitImg.hidden = false;
    rune.hidden = true;
    portraitImg.onerror = () => { portraitImg.hidden = true; rune.hidden = false; };
  } else {
    portraitImg.hidden = true;
    rune.hidden = false;
    rune.textContent = c.type === 'enemy' ? '⚔' : '✳';
  }
  $('#portraitCaption').textContent = (c.className || 'COMBATIENTE').replace(/ · /g, '\n').toUpperCase();
  $('#portraitLevel').textContent = c.type === 'enemy' ? 'PNJ' : `NV ${String(lvl).padStart(2, '0')}`;
  $('#exportPortraitBtn').hidden = !c.avatar;

  $('#charCardName').textContent = c.name;
  $('#charCardMeta').textContent = `${c.species || 'Criatura'} · ${c.className || 'Sin clase'}${c.owner ? ` · Jugador: ${c.owner}` : ''}`;

  $('#hpText').innerHTML = `${c.hp} <small>/ ${c.maxHp}</small>`;
  const hpPct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
  const hpBar = $('#hpBar');
  hpBar.style.width = `${hpPct}%`;
  hpBar.className = hpClass(c.hp, c.maxHp);

  $('#statAc').textContent = c.ac ?? '—';
  $('#statMove').textContent = `${formatMeters(c.turnMovement)} m`;
  $('#statInit').textContent = signed(c.initiative || 0);
  $('#statPerc').textContent = signed(getPerception(c));
  $('#resourceSummary').textContent = `Se marcan automáticamente · ${formatMeters(c.turnMovement)}/${formatMeters(c.speed || 0)} m`;

  const abilityRow = $('#abilityRow');
  abilityRow.replaceChildren();
  const names = { Fue: 'FUE', Des: 'DES', Con: 'CON', Int: 'INT', Sab: 'SAB', Car: 'CAR' };
  Object.entries(c.stats || {}).forEach(([key, value]) => {
    const raw = String(value);
    const score = Number(raw.match(/\d+/)?.[0]);
    const mod = getAbilityMod(c, key);
    const box = document.createElement('span');
    box.innerHTML = '<small></small><b></b><i></i>';
    box.querySelector('small').textContent = names[key] || key;
    box.querySelector('b').textContent = Number.isFinite(score) ? String(score) : raw;
    box.querySelector('i').textContent = signed(mod);
    abilityRow.append(box);
  });

  renderConditionBadges(c);
  renderTurnGuide(c);
  renderResourcesOnly(c);
  if (onRenderActions) onRenderActions(c);
}
