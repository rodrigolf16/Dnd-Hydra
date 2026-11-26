import {
  featureActivity,
  featureDescription,
  featureHint,
  hasFeature,
  hasHealingPotion,
  hasHuntersMark,
  hasLightWeapons
} from '../../domain/combat/combatant-features.js';
import { byId, emitToast, saveState } from '../../application/store/encounter-store.js';
import { activateSteadyAim, toggleRage, useCounter } from '../../application/use-cases/class-actions.js';
import { createActionCard } from './action-card-factory.js';

export function appendBonusClassCards(c, bonusRoot, handlers) {
  if (hasHuntersMark(c)) {
    const marked = c.markedTargetId ? byId(c.markedTargetId) : null;
    const freeUses = useCounter('free-hunters-mark', c);
    bonusRoot.append(createActionCard({
      icon: '◎',
      typeLabel: 'ACCIÓN ADICIONAL · ENEMIGO PREDILECTO',
      title: marked ? `Marca del cazador (${marked.name})` : 'Marca del cazador',
      description: marked
        ? (marked.hp <= 0
          ? `${marked.name} cayó a 0 PG. Traslada la marca gratis con su acción adicional.`
          : `Activa sobre ${marked.name} (+1d6 sumado automáticamente a los dados físicos).`)
        : `Marca a un enemigo para añadir +1d6 a los dados de daño. Gratis: ${freeUses ? `${freeUses.remaining}/${freeUses.max}` : '—'}.`,
      meta: 'Concentración · +1d6',
      featured: !marked && c.turnState.bonus,
      exhausted: !c.turnState.bonus && (!marked || marked.hp <= 0),
      onClick: () => handlers.openActionModal({ name: 'Marca del cazador', kind: 'spell', isMark: true })
    }));
  }

  if (hasFeature(c, /^furia$/i)) {
    const rageCounter = useCounter('rage', c);
    bonusRoot.append(createActionCard({
      icon: '🔥',
      typeLabel: 'ACCIÓN ADICIONAL · BÁRBARO',
      title: c.raging ? 'Terminar Furia' : 'Entrar en Furia',
      description: c.raging
        ? 'Furia activa (+2 daño cuerpo a cuerpo con Fuerza y resistencia física).'
        : `Activa Furia como acción adicional (${rageCounter ? `${rageCounter.remaining}/${rageCounter.max} usos` : ''}).`,
      meta: c.raging ? 'Activa ahora' : 'Gasta 1 uso',
      featured: !c.raging && c.turnState.bonus,
      exhausted: !c.raging && (!c.turnState.bonus || (rageCounter && rageCounter.remaining <= 0)),
      onClick: () => toggleRage(c)
    }));
  }

  if (hasFeature(c, /acción astuta/i)) {
    bonusRoot.append(createActionCard({
      icon: '⚡',
      typeLabel: 'ACCIÓN ADICIONAL · PÍCARO',
      title: 'Acción astuta: Correr / Destrabarse / Esconderse',
      description: 'Correr (+velocidad), Destrabarse o Esconderse (1×d20 + Sigilo).',
      meta: 'Usa acción adicional',
      exhausted: !c.turnState.bonus,
      onClick: () => handlers.openActionModal({ name: 'Acción astuta', kind: 'bonus', cunningAction: true })
    }));
  }

  if (hasFeature(c, /puntería certera/i)) {
    bonusRoot.append(createActionCard({
      icon: '◎',
      typeLabel: 'ACCIÓN ADICIONAL · PÍCARO',
      title: 'Puntería certera',
      description: c.turnMoved ? 'Ya se movió este turno; requiere no haberse movido.' : 'Velocidad a 0 m este turno y ventaja en su próximo ataque.',
      meta: c.turnMoved ? 'No disponible' : 'Ventaja próximo ataque',
      exhausted: !c.turnState.bonus || c.turnMoved || c.steadyAimActive,
      onClick: () => activateSteadyAim(c)
    }));
  }

  if (hasHealingPotion(c)) {
    bonusRoot.append(createActionCard({
      icon: '✚',
      typeLabel: 'ACCIÓN ADICIONAL · CONSUMIBLE',
      title: 'Poción de curación',
      description: 'Tira 2×d4 + 2 físicos y anota la curación para sumarla a sus PG.',
      meta: '2 dados físicos (2d4+2)',
      exhausted: !c.turnState.bonus,
      onClick: () => handlers.openActionModal({ name: 'Poción de curación', kind: 'bonus', isPotion: true })
    }));
  }

  if (hasLightWeapons(c)) {
    bonusRoot.append(createActionCard({
      icon: '⚔',
      dualIcon: true,
      typeLabel: 'ACCIÓN ADICIONAL · ARMA LIGERA',
      title: 'Ataque con mano secundaria',
      description: 'Tras atacar con un arma ligera, ataque extra con otra arma ligera.',
      meta: 'Usa acción adicional',
      exhausted: !c.turnState.bonus,
      onClick: () => handlers.openActionModal({ name: 'Ataque con mano secundaria', kind: 'attack', attackMode: 'offhand' })
    }));
  }
}

export function appendFeaturesAndCustomActions(c, roots, handlers) {
  const skip = new Set(['marca del cazador', 'ataque adicional', 'ataque temerario', 'furia', 'acción astuta', 'puntería certera']);
  const seen = new Set();
  [...(c.features || []), ...(c.feats || [])].forEach(name => {
    if (!name) return;
    const lower = name.toLowerCase();
    if (seen.has(lower) || skip.has(lower)) return;
    seen.add(lower);
    const group = featureActivity(name);
    if (group === 'passive') {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'passive-trait';
      pill.textContent = name;
      pill.title = featureDescription(name, c);
      pill.addEventListener('click', () => emitToast(`${name}: ${featureDescription(name, c)}`));
      roots.passive.append(pill);
    } else {
      roots[group].append(createActionCard({
        icon: '✦',
        typeLabel: 'RASGO ACTIVABLE',
        title: name,
        description: featureHint(name),
        meta: group === 'bonus' ? 'Acción adicional' : group === 'reaction' ? 'Reacción' : 'Acción',
        exhausted: !c.turnState[group],
        tooltip: featureDescription(name, c),
        onClick: () => handlers.openActionModal({ name, kind: group, isFeature: true })
      }));
    }
  });

  (c.customActions || []).forEach(custom => {
    if (custom.kind === 'passive') {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'passive-trait';
      pill.textContent = `${custom.name} ×`;
      pill.addEventListener('click', () => {
        if (confirm(`¿Quitar el rasgo personalizado «${custom.name}»?`)) {
          c.customActions = c.customActions.filter(x => x.id !== custom.id);
          saveState('actions');
        }
      });
      roots.passive.append(pill);
      return;
    }
    (roots[custom.kind] || roots.action).append(createActionCard({
      icon: '✧',
      typeLabel: 'ACCIÓN PERSONALIZADA',
      title: custom.name,
      description: custom.description || 'Opción personalizada guardada en esta ficha.',
      meta: custom.dice ? `Dados: ${custom.dice}` : `Usa ${custom.kind === 'bonus' ? 'acción adicional' : custom.kind === 'reaction' ? 'reacción' : 'acción'}`,
      exhausted: !c.turnState[custom.kind],
      onClick: () => handlers.openActionModal({ name: custom.name, kind: custom.kind, customDice: custom.dice, customDesc: custom.description }),
      onDelete: () => {
        c.customActions = c.customActions.filter(x => x.id !== custom.id);
        saveState('actions');
        emitToast(`Acción «${custom.name}» eliminada`);
      }
    }));
  });
}
