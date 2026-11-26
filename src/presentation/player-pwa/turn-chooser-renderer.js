import { formatMeters } from '../../domain/shared/formatters.js';
import { hasMellarAccess } from '../../domain/combat/combatant-features.js';
import { $ } from '../shared/dom.js';
import { isLiveConnected, pwaState } from './pwa-state.js';
import { buildTurnMoveCatalog } from './turn-move-builder.js';

function createMoveChoiceButton(move, onPick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `move-choice-card${move.available ? '' : ' spent'}`;
  btn.innerHTML = `<span class="move-choice-ico"></span><div class="move-choice-body"><b></b><small></small></div><div class="move-choice-right"><span class="move-preview"></span><i class="move-arrow">→</i></div>`;
  btn.querySelector('.move-choice-ico').textContent = move.icon || '✦';
  btn.querySelector('b').textContent = move.title;
  btn.querySelector('small').textContent = move.desc;
  btn.querySelector('.move-preview').textContent = move.preview || move.costLabel;
  btn.addEventListener('click', () => onPick(move));
  return btn;
}

function renderChoiceSection(wrapSel, rootSel, items, showSpent, onPick) {
  const wrap = $(wrapSel);
  const root = $(rootSel);
  if (!wrap || !root) return 0;
  root.replaceChildren();
  const visible = showSpent ? items : items.filter(x => x.available);
  const spentCount = items.filter(x => !x.available).length;
  wrap.hidden = visible.length === 0;
  visible.forEach(item => root.append(createMoveChoiceButton(item, onPick)));
  return spentCount;
}

export function renderTurnChooser(c, res, onPickMove) {
  const hasMellar = hasMellarAccess(c);
  const canAttack = res.action || (res.attackSequenceOpen && res.attacksRemaining > 0);
  const parts = [];
  if (canAttack) {
    parts.push(res.maxAttacks > 1
      ? `Atacar (${res.attacksRemaining}/${res.maxAttacks} ataques${hasMellar && !res.nickUsed ? ' + Mellar' : ''})`
      : 'Acción principal');
  } else if (hasMellar && res.baseAttackMade && !res.nickUsed) {
    parts.push('Ataque gratis con Mellar');
  }
  if (res.bonus) parts.push('Acción adicional');
  if (res.movement) parts.push(`${formatMeters(res.movementMeters, true)} m de movimiento`);

  const allMainSpent = parts.length === 0;
  const badge = $('#turnGuideBadge');
  badge.textContent = allMainSpent ? 'Listo para cerrar' : 'Elegí tu movimiento';
  badge.className = `guide-tag${allMainSpent ? ' done' : ''}`;
  $('#turnGuideText').textContent = allMainSpent
    ? `Ya usaste tus movimientos de este turno.${res.reaction ? ' Tu Reacción queda lista fuera de turno.' : ''}`
    : `Todavía podés usar: ${parts.join(' · ')}. Tocá una opción para ver tus dados físicos.`;

  $('#attackBlockHint').textContent = res.maxAttacks > 1
    ? `Quedan ${res.attacksRemaining}/${res.maxAttacks} ataques`
    : '1 Acción';

  const catalog = buildTurnMoveCatalog(c, res);
  const showSpent = pwaState.showSpentOptions;

  let totalSpent = 0;
  totalSpent += renderChoiceSection('#weaponChoicesWrap', '#weaponCards', catalog.weapons, showSpent, onPickMove);
  totalSpent += renderChoiceSection('#turnSpellsWrap', '#turnSpellCards', catalog.spells, showSpent, onPickMove);
  totalSpent += renderChoiceSection('#bonusChoicesWrap', '#bonusCards', catalog.bonus, showSpent, onPickMove);
  totalSpent += renderChoiceSection('#stdChoicesWrap', '#standardCards', catalog.standard, showSpent, onPickMove);
  totalSpent += renderChoiceSection('#reactionChoicesWrap', '#reactionCards', catalog.reactions, showSpent, onPickMove);

  const moveWrap = $('#moveChoicesWrap');
  const moveRoot = $('#moveCards');
  moveRoot.replaceChildren();
  const rem = Number(res.movementMeters) || 0;
  moveWrap.hidden = rem <= 0 && !showSpent;
  $('#moveBlockHint').textContent = `${formatMeters(rem, true)} m restantes`;
  const distOptions = [1.5, 3, 4.5, 6].filter(d => d < rem);
  if (rem > 0) distOptions.push(rem);
  distOptions.forEach(d => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'move-dist-pill';
    b.textContent = d === rem ? `Todo (${formatMeters(d, true)} m)` : `${formatMeters(d, true)} m`;
    b.addEventListener('click', () => onPickMove({
      id: `move-${d}`,
      kind: 'movement',
      resourceKind: 'movement',
      icon: '⌁',
      title: `Desplazarse ${formatMeters(d, true)} m`,
      distanceMeters: d,
      costLabel: 'Movimiento',
      preview: `${formatMeters(d, true)} m`,
      desc: `Consume ${formatMeters(d, true)} m de tus ${formatMeters(rem, true)} m disponibles.`,
      available: true
    }));
    moveRoot.append(b);
  });

  $('#turnDoneCallout').hidden = !allMainSpent;
  const spentBtn = $('#toggleSpentMovesBtn');
  spentBtn.hidden = totalSpent === 0;
  spentBtn.textContent = showSpent ? 'Ocultar movimientos gastados' : `Ver movimientos ya gastados (${totalSpent})`;

  // End Turn button state
  const live = isLiveConnected();
  const isMyTurn = !live || pwaState.livePayload?.activeTurnId === c.id;
  const endBtn = $('#endTurnBtn');
  const endHint = $('#endTurnHint');
  endBtn.classList.toggle('ready', allMainSpent && isMyTurn);
  endBtn.disabled = live && !isMyTurn;
  if (live) {
    endBtn.textContent = isMyTurn ? '✓ Fin de turno' : '⏳ Esperando tu turno…';
    endHint.textContent = isMyTurn
      ? 'Avisa al DM y pasa al siguiente combatiente en iniciativa.'
      : `Turno actual: ${pwaState.livePayload?.activeTurnName || 'otro combatiente'}. Podés usar tu Reacción si hace falta.`;
  } else {
    endBtn.textContent = '✓ Fin de turno (nuevo turno)';
    endHint.textContent = 'Reinicia tus acciones y movimiento para tu próxima ronda.';
  }
}
