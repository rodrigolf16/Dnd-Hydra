import { ensureUseCounters } from '../../domain/combat/combatant-lifecycle.js';
import { emitToast, getState, saveState, viewed } from '../../application/store/encounter-store.js';
import { $ } from '../shared/dom.js';

export function renderLog() {
  const state = getState();
  const list = $('#logList');
  list.replaceChildren();
  if (!state.logEntries.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-targets';
    empty.textContent = 'Todavía no hay eventos en el registro de combate.';
    list.append(empty);
    return;
  }
  state.logEntries.slice(0, 35).forEach(entry => {
    const row = document.createElement('div');
    row.className = 'log-item';
    row.innerHTML = '<span class="log-icon"></span><div><b></b><small></small></div>';
    row.querySelector('.log-icon').textContent = entry.symbol || '✦';
    row.querySelector('b').textContent = `${entry.actor} ${entry.text}`;
    row.querySelector('small').textContent = `${entry.time}${entry.detail ? ` · ${entry.detail}` : ''}`;
    list.append(row);
  });
}

export function renderLimitedUses() {
  const c = viewed();
  if (!c) return;
  ensureUseCounters(c);
  const root = $('#limitedUsesList');
  root.replaceChildren();

  if (!c.limitedUses.length) {
    const empty = document.createElement('p');
    empty.className = 'uses-empty';
    empty.textContent = 'Sin contadores de ficha. Pulsa ＋ para añadir uno.';
    root.append(empty);
    return;
  }

  c.limitedUses.forEach(counter => {
    const row = document.createElement('div');
    row.className = 'limited-use-row';

    const info = document.createElement('span');
    info.innerHTML = '<b></b><small></small>';
    info.querySelector('b').textContent = counter.name;
    info.querySelector('small').textContent =
      counter.reset === 'short'
        ? (counter.shortRestore ? `Descanso corto (+${counter.shortRestore}) / largo (todos)` : 'Descanso corto')
        : counter.reset === 'either'
          ? 'Descanso corto o largo'
          : counter.reset === 'never'
            ? 'Manual'
            : 'Descanso largo';

    const controls = document.createElement('span');
    controls.className = 'use-controls';

    const spend = document.createElement('button');
    spend.type = 'button';
    spend.textContent = '−';
    spend.disabled = counter.remaining <= 0;
    const value = document.createElement('b');
    value.className = 'use-count';
    value.textContent = `${counter.remaining}/${counter.max}`;
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.textContent = '+';
    restore.disabled = counter.remaining >= counter.max;

    spend.addEventListener('click', () => {
      counter.remaining = Math.max(0, counter.remaining - 1);
      saveState('usesAndActions');
    });
    restore.addEventListener('click', () => {
      counter.remaining = Math.min(counter.max, counter.remaining + 1);
      saveState('usesAndActions');
    });

    controls.append(spend, value, restore);
    if (counter.custom) {
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = '×';
      del.title = 'Eliminar contador';
      del.addEventListener('click', () => {
        c.limitedUses = c.limitedUses.filter(x => x.key !== counter.key);
        saveState('uses');
        emitToast(`Contador «${counter.name}» eliminado`);
      });
      controls.append(del);
    }

    row.append(info, controls);
    root.append(row);
  });
}
