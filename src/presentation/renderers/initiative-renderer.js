import { hpClass, ownerLabel, signed } from '../../domain/shared/formatters.js';
import { byId, getState, notify, uiState } from '../../application/store/encounter-store.js';
import { inspectCombatant, swapInitiativePositions } from '../../application/use-cases/turn-flow.js';
import { $ } from '../shared/dom.js';

function handleChipClick(id) {
  if (uiState.swapMode) {
    if (!uiState.swapFirstId) {
      uiState.swapFirstId = id;
      $('#swapBannerText').textContent = `Seleccionado: ${byId(id).name}. Ahora haz clic en el otro combatiente para intercambiar sus puestos.`;
      notify('initiative');
      return;
    }
    if (uiState.swapFirstId === id) {
      uiState.swapFirstId = null;
      $('#swapBannerText').textContent = 'Haz clic en el primer combatiente en la barra de iniciativa y luego en el segundo para intercambiar sus puestos.';
      notify('initiative');
      return;
    }
    swapInitiativePositions(uiState.swapFirstId, id);
    return;
  }
  inspectCombatant(id);
}

export function renderInitiative() {
  const state = getState();
  const list = $('#initiativeList');
  list.replaceChildren();

  state.combatants.forEach((c, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'turn-chip';
    if (c.id === state.activeTurnId) btn.classList.add('active-turn');
    if (c.id === state.viewedId) btn.classList.add('inspected-turn');
    if (c.defeated) btn.classList.add('defeated-chip');
    if (uiState.swapMode && c.id === uiState.swapFirstId) btn.classList.add('swap-selected');
    btn.dataset.id = c.id;

    const initial = (c.name.match(/[A-ZÁÉÍÓÚÑa-záéíóúñ]/g) || ['?'])[0].toUpperCase();
    const badge = document.createElement('span');
    badge.className = `chip-avatar ${c.type === 'enemy' ? 'enemy' : 'ally'}`;
    if (c.avatar) {
      const img = document.createElement('img');
      img.src = c.avatar;
      img.alt = c.name;
      img.onerror = () => { img.remove(); badge.textContent = initial; };
      badge.append(img);
    } else {
      badge.textContent = initial;
    }

    const label = document.createElement('span');
    label.innerHTML = '<b></b><small></small>';
    label.querySelector('b').textContent = c.name;
    label.querySelector('small').textContent = c.defeated
      ? 'Fuera de combate'
      : c.id === state.activeTurnId
        ? '● Turno actual'
        : c.id === state.viewedId
          ? '👁 Viendo ficha'
          : ownerLabel(c);

    const score = document.createElement('strong');
    score.textContent = c.initiativeRoll == null ? signed(c.initiative || 0) : String(c.initiativeRoll);
    score.title = c.initiativeRoll == null ? 'Bonificador de iniciativa' : 'Iniciativa física cargada';

    btn.append(badge, label, score);

    const bar = document.createElement('span');
    bar.className = 'chip-hp-bar';
    const pct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
    const fill = document.createElement('i');
    fill.style.width = `${pct}%`;
    const cls = hpClass(c.hp, c.maxHp);
    if (cls) fill.className = cls;
    bar.append(fill);
    btn.append(bar);

    btn.addEventListener('click', () => handleChipClick(c.id));
    list.append(btn);

    if (index < state.combatants.length - 1) {
      const arrow = document.createElement('span');
      arrow.className = 'turn-arrow';
      arrow.textContent = '›';
      list.append(arrow);
    }
  });

  const focusChip = list.querySelector(`.turn-chip[data-id="${state.viewedId}"]`) || list.querySelector('.turn-chip.active-turn');
  if (focusChip && typeof focusChip.scrollIntoView === 'function') {
    focusChip.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }
}
