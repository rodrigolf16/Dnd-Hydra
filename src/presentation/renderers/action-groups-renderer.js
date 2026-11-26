import { STANDARD_ACTIONS } from '../../data/rules/actions.js';
import { formatMeters } from '../../domain/shared/formatters.js';
import { hasMellarAccess } from '../../domain/combat/combatant-features.js';
import { spellActionType } from '../../domain/combat/spell-rules.js';
import { resolveStandardAction } from '../../application/use-cases/class-actions.js';
import { $, $$ } from '../shared/dom.js';
import { createActionCard } from './action-card-factory.js';
import { appendBonusClassCards, appendFeaturesAndCustomActions } from './action-bonus-features-renderer.js';

export function renderActionGroups(c, handlers) {
  const roots = {
    movement: $('#movementActions'),
    action: $('#mainActions'),
    standard: $('#standardActions'),
    bonus: $('#bonusActions'),
    reaction: $('#reactionActions'),
    other: $('#otherActions'),
    passive: $('#passiveTraits')
  };
  Object.values(roots).forEach(el => el.replaceChildren());

  roots.movement.append(createActionCard({
    icon: '⌁',
    typeLabel: 'MOVIMIENTO',
    title: 'Desplazarse',
    description: `Quedan ${formatMeters(c.turnMovement)} m de ${formatMeters(c.speed || 0)} m. Puede repartirse en el turno.`,
    meta: `Velocidad ${formatMeters(c.speed || 0)} m`,
    exhausted: c.turnMovement <= 0,
    onClick: () => handlers.openMovement()
  }));

  const hasExtra = c.turnMaxAttacks > 1;
  const canContinueAttacks = c.turnState.action || (c.attackSequenceOpen && c.turnAttacksRemaining > 0);
  $('#mainActionGroupHint').textContent = hasExtra
    ? `Una por turno · Ataque adicional (${c.turnAttacksRemaining}/${c.turnMaxAttacks} ataques)`
    : 'Una por turno';

  roots.action.append(createActionCard({
    icon: '⚔',
    typeLabel: hasExtra ? `ACCIÓN · ${c.turnAttacksRemaining}/${c.turnMaxAttacks} ATAQUES` : 'ACCIÓN · ATAQUE',
    title: c.attackSequenceOpen && c.turnAttacksRemaining > 0 ? 'Continuar ataque (Ataque adicional)' : 'Atacar con arma',
    description: 'Muestra los dados físicos exactos a tirar y permite anotar el d20 y daño para descontar PG.',
    meta: c.turnAttacksRemaining > 0 ? 'Ver dados y anotar' : 'Ataques agotados',
    featured: canContinueAttacks,
    exhausted: !canContinueAttacks,
    onClick: () => handlers.openActionModal({ name: 'Ataque con arma', kind: 'attack', attackMode: 'normal' })
  }));

  if (hasMellarAccess(c)) {
    const mellarReady = !c.turnNickUsed && c.turnBaseAttackMade && (c.attackSequenceOpen || !c.turnState.action);
    roots.action.append(createActionCard({
      icon: '⚔',
      dualIcon: true,
      typeLabel: 'MAESTRÍA · MELLAR (NICK)',
      title: 'Ataque ligero adicional',
      description: c.turnNickUsed
        ? 'Mellar ya usado este turno.'
        : c.turnBaseAttackMade
          ? 'Listo: ataque extra con arma ligera con Mellar (no gasta acción adicional).'
          : 'Primero registra un ataque en Atacar para habilitar Mellar.',
      meta: c.turnNickUsed ? 'Usado (1/turno)' : 'No gasta adicional',
      featured: mellarReady,
      exhausted: c.turnNickUsed,
      onClick: () => handlers.openActionModal({ name: 'Ataque ligero · Mellar (Nick)', kind: 'attack', attackMode: 'nick' })
    }));
  }

  STANDARD_ACTIONS.forEach(act => {
    roots.standard.append(createActionCard({
      icon: act.icon,
      typeLabel: 'ACCIÓN ESTÁNDAR',
      title: act.name,
      description: act.short,
      meta: act.meta,
      exhausted: !c.turnState.action,
      onClick: () => resolveStandardAction(act, handlers.openActionModal)
    }));
  });

  const spellGroups = { action: [], bonus: [], reaction: [], other: [] };
  (c.spells?.names || []).forEach(spell => spellGroups[spellActionType(spell, c)].push(spell));
  Object.entries(spellGroups).forEach(([group, spells]) => {
    if (!spells.length) return;
    const isExhausted = (group === 'action' && !c.turnState.action)
      || (group === 'bonus' && !c.turnState.bonus)
      || (group === 'reaction' && !c.turnState.reaction);
    roots[group].append(createActionCard({
      icon: '✧',
      typeLabel: `CONJUROS · ${spells.length} DISPONIBLES`,
      title: 'Lanzar conjuro',
      description: spells.slice(0, 4).join(', ') + (spells.length > 4 ? ` y ${spells.length - 4} más…` : ''),
      meta: 'Elegir conjuro',
      exhausted: isExhausted,
      onClick: () => handlers.openSpellPicker(group)
    }));
  });

  appendBonusClassCards(c, roots.bonus, handlers);

  roots.reaction.append(createActionCard({
    icon: 'ϟ',
    typeLabel: 'REACCIÓN · COMBATE',
    title: 'Ataque de oportunidad',
    description: 'Cuando un enemigo sale de su alcance sin Destrabarse, 1 ataque cuerpo a cuerpo.',
    meta: c.turnState.reaction ? 'Disponible' : 'Reacción gastada',
    exhausted: !c.turnState.reaction,
    onClick: () => handlers.openActionModal({ name: 'Ataque de oportunidad', kind: 'attack', attackMode: 'opportunity' })
  }));

  appendFeaturesAndCustomActions(c, roots, handlers);

  $$('.action-group').forEach(group => {
    const key = group.dataset.actionGroup;
    const items = group.querySelector('.action-grid, .passive-traits');
    const empty = !items || !items.children.length;
    group.hidden = !['movement', 'action'].includes(key) && empty;
  });
}
