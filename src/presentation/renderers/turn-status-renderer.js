import { formatMeters } from '../../domain/shared/formatters.js';
import {
  hasFeature,
  hasHealingPotion,
  hasHuntersMark,
  hasMellarAccess
} from '../../domain/combat/combatant-features.js';
import { spellActionType } from '../../domain/combat/spell-rules.js';
import { collectRealLightSources, isUmbralInvisible } from '../../domain/map/enemy-vision-rules.js';
import {
  activeTurnCombatant,
  byId,
  getState,
  isViewingActiveTurn,
  saveState
} from '../../application/store/encounter-store.js';
import { addLog } from '../../application/use-cases/combat-log.js';
import { $ } from '../shared/dom.js';

export function renderTurnGuide(c) {
  const ts = c.turnState;
  const parts = [];
  const chips = [];

  if (ts.action) {
    parts.push(c.turnMaxAttacks > 1
      ? `Acción disponible (${c.turnAttacksRemaining} ataques con Atacar${hasMellarAccess(c) && !c.turnNickUsed ? ' + Mellar' : ''})`
      : `Acción disponible (${hasMellarAccess(c) && !c.turnNickUsed ? 'Atacar + Mellar' : 'Atacar, conjuro o acción estándar'})`);
    chips.push({ text: 'Acción: disponible', spent: false });
  } else if (c.attackSequenceOpen && (c.turnAttacksRemaining > 0 || (hasMellarAccess(c) && c.turnBaseAttackMade && !c.turnNickUsed))) {
    const extraBits = [];
    if (c.turnAttacksRemaining > 0) extraBits.push(`${c.turnAttacksRemaining} ataque extra`);
    if (hasMellarAccess(c) && c.turnBaseAttackMade && !c.turnNickUsed) extraBits.push('Mellar disponible');
    parts.push(`sigue dentro de Atacar (${extraBits.join(' y ')})`);
    chips.push({ text: `Atacar en curso: ${extraBits.join(' + ')}`, spent: false });
  } else {
    chips.push({ text: 'Acción gastada', spent: true });
  }

  if (ts.bonus) {
    const hints = [];
    if (hasHuntersMark(c)) hints.push('Marca del cazador');
    if (hasFeature(c, /^furia$/i) && !c.raging) hints.push('Furia');
    if (hasFeature(c, /acción astuta/i)) hints.push('Acción astuta');
    if (hasFeature(c, /puntería certera/i) && !c.turnMoved) hints.push('Puntería certera');
    if (hasFeature(c, /inspiración bárdica/i)) hints.push('Inspiración bárdica');
    if (hasFeature(c, /^forma salvaje$/i)) hints.push('Forma salvaje');
    if (hasHealingPotion(c)) hints.push('Poción de curación');
    if ((c.spells?.names || []).some(s => spellActionType(s, c) === 'bonus')) hints.push('conjuro rápido');
    parts.push(`Acción adicional libre${hints.length ? ` (${hints.slice(0, 3).join(', ')})` : ''}`);
    chips.push({ text: 'Acción adicional: libre', spent: false });
  } else {
    chips.push({ text: 'Adicional gastada', spent: true });
  }

  if (c.turnMovement > 0) {
    parts.push(`${formatMeters(c.turnMovement)} m de movimiento`);
    chips.push({ text: `Movimiento: ${formatMeters(c.turnMovement)}/${formatMeters(c.speed)} m`, spent: false });
  } else {
    chips.push({ text: 'Movimiento agotado', spent: true });
  }

  chips.push({ text: ts.reaction ? 'Reacción: lista' : 'Reacción gastada', spent: !ts.reaction });

  const badge = $('#turnGuideStatus');
  const allSpent = !ts.action && !c.attackSequenceOpen && !ts.bonus && c.turnMovement <= 0;

  if (!isViewingActiveTurn()) {
    badge.textContent = 'Fuera de su turno';
    badge.className = 'guide-badge done';
    $('#turnGuideText').textContent = `Turno actual: ${activeTurnCombatant().name}. ${c.name} ${ts.reaction ? 'conserva su Reacción.' : 'ya gastó su Reacción hasta su próximo turno.'}`;
  } else if (allSpent) {
    badge.textContent = 'Turno completado';
    badge.className = 'guide-badge done';
    $('#turnGuideText').textContent = `${c.name} ya utilizó su acción, acción adicional y movimiento.${ts.reaction ? ' Conserva su Reacción hasta su próximo turno.' : ''}`;
  } else {
    badge.textContent = 'Opciones disponibles';
    badge.className = 'guide-badge';
    $('#turnGuideText').textContent = `Turno de ${c.name}: ${parts.join(' · ')}.`;
  }

  const chipContainer = $('#turnGuideChips');
  chipContainer.replaceChildren();
  chips.forEach(ch => {
    const span = document.createElement('span');
    span.className = `guide-chip${ch.spent ? ' spent' : ''}`;
    span.textContent = ch.text;
    chipContainer.append(span);
  });
}

export function renderConditionBadges(c) {
  const root = $('#conditionBadges');
  root.replaceChildren();
  const addPill = (text, cls = '', onRemove = null) => {
    const pill = document.createElement('span');
    pill.className = `condition-pill ${cls}`.trim();
    const label = document.createElement('span');
    label.textContent = text;
    pill.append(label);
    if (onRemove) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '×';
      btn.title = 'Quitar estado';
      btn.addEventListener('click', onRemove);
      pill.append(btn);
    }
    root.append(pill);
  };

  if (c.concentration) {
    const target = c.concentration.targetId ? byId(c.concentration.targetId) : null;
    addPill(`◎ Concentración: ${c.concentration.spell}${target ? ` (${target.name})` : ''}`, 'conc', () => {
      const spellName = c.concentration.spell;
      c.concentration = null;
      if (/marca del cazador/i.test(spellName)) c.markedTargetId = null;
      addLog(c.name, `pierde/suelta concentración en ${spellName}`, 'Concentración finalizada', '◌');
      saveState('all');
    });
  }
  if (c.raging) {
    addPill('🔥 Furia activa (+2 daño, resistencia física)', 'warn', () => {
      c.raging = false;
      addLog(c.name, 'termina su Furia', 'Bonificador desactivado', '◌');
      saveState('all');
    });
  }
  if (c.recklessUntilTurn) addPill('⚠ Ataque temerario (ventaja contra él hasta su turno)', 'warn');
  if (c.steadyAimActive) addPill('◎ Puntería certera (ventaja próximo ataque)', '');
  const state = getState();
  if (state.map && isUmbralInvisible(c, state.map.tokens?.[c.id], state, collectRealLightSources(state))) {
    addPill('👻 Invisible (oscuridad total · Visión en la umbra)', 'umbral');
  }
  if (c.defeated) addPill('✕ Fuera de combate', 'warn');

  (c.conditions || []).forEach(cond => {
    addPill(cond, '', () => {
      c.conditions = c.conditions.filter(x => x !== cond);
      saveState('all');
    });
  });
}
