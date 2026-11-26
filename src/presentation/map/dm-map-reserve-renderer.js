import { getState } from '../../application/store/encounter-store.js';
import { cloneEnemy, removeCombatant } from '../../application/use-cases/combatant-crud.js';
import { $ } from '../shared/dom.js';
import { attachReserveDrag } from './dm-map-drag.js';

export function renderReserveTray() {
  const state = getState();
  const m = state.map;
  const reserveRoot = $('#mapReserveList');
  if (!reserveRoot) return;
  reserveRoot.replaceChildren();
  const stagedEnemies = state.combatants.filter(c => c.type === 'enemy' && m.tokens[c.id]?.staged);
  const countEl = $('#mapReserveCount');
  if (countEl) countEl.textContent = String(stagedEnemies.length);

  if (!stagedEnemies.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-targets reserve-empty';
    empty.textContent = 'Sin enemigos en espera. Al añadir o clonar adversarios aparecen aquí ocultos para que los arrastres al mapa.';
    reserveRoot.append(empty);
    return;
  }

  stagedEnemies.forEach(c => {
    const tok = m.tokens[c.id];
    const chip = document.createElement('div');
    chip.className = 'reserve-enemy-chip';
    chip.title = 'Arrastra hacia el mapa para ubicar este enemigo';

    const grip = document.createElement('span');
    grip.className = 'reserve-grip';
    grip.textContent = '⠿';

    const av = document.createElement('div');
    av.className = 'map-roster-avatar enemy-reserve-av';
    if (c.avatar) {
      const img = document.createElement('img');
      img.src = c.avatar; img.alt = c.name; img.draggable = false;
      img.onerror = () => { img.remove(); av.textContent = c.name.slice(0, 1).toUpperCase(); };
      av.append(img);
    } else {
      av.textContent = c.name.slice(0, 1).toUpperCase();
    }

    const info = document.createElement('div');
    info.className = 'reserve-enemy-info';
    info.innerHTML = '<b></b><small></small>';
    info.querySelector('b').textContent = c.name;
    info.querySelector('small').textContent = `PG ${c.hp}/${c.maxHp} · CA ${c.ac ?? '—'} · Arrastra al mapa`;

    const actions = document.createElement('div');
    actions.className = 'reserve-enemy-actions';

    const cloneBtn = document.createElement('button');
    cloneBtn.type = 'button'; cloneBtn.textContent = '⧉'; cloneBtn.title = 'Clonar enemigo';
    cloneBtn.addEventListener('pointerdown', e => e.stopPropagation());
    cloneBtn.addEventListener('click', e => { e.stopPropagation(); cloneEnemy(c.id); });

    const delBtn = document.createElement('button');
    delBtn.type = 'button'; delBtn.className = 'reserve-del-btn'; delBtn.textContent = '×'; delBtn.title = 'Eliminar enemigo';
    delBtn.addEventListener('pointerdown', e => e.stopPropagation());
    delBtn.addEventListener('click', e => { e.stopPropagation(); removeCombatant(c.id, msg => confirm(msg)); });

    actions.append(cloneBtn, delBtn);
    chip.append(grip, av, info, actions);
    attachReserveDrag(chip, c, tok);
    reserveRoot.append(chip);
  });
}
