import { hpClass } from '../../domain/shared/formatters.js';
import { googleImagesUrl } from '../../infrastructure/browser/enemy-image-search.js';
import { emitToast, getState, saveState, viewed } from '../../application/store/encounter-store.js';
import { adjustHp } from '../../application/use-cases/hp-actions.js';
import { cloneEnemy, removeCombatant } from '../../application/use-cases/combatant-crud.js';
import { $ } from '../shared/dom.js';

function makeMiniButton(txt, title, fn, clsBtn = '') {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = txt;
  b.title = title;
  if (clsBtn) b.className = clsBtn;
  b.addEventListener('click', e => { e.stopPropagation(); fn(); });
  return b;
}

export function renderTargets(openHpDialog) {
  const state = getState();
  const root = $('#targetList');
  root.replaceChildren();
  const v = viewed();
  const others = state.combatants.filter(c => c.id !== v?.id);

  if (!others.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-targets';
    empty.textContent = 'Añade un adversario para empezar el encuentro.';
    root.append(empty);
    return;
  }

  others.forEach(c => {
    const wrap = document.createElement('div');
    wrap.className = 'target-wrapper';
    const isMarkedByViewed = v && v.markedTargetId === c.id;
    const markedByAny = state.combatants.find(x => x.markedTargetId === c.id);

    const row = document.createElement('button');
    row.type = 'button';
    row.className = `target-row${c.id === state.currentTargetId ? ' selected' : ''}${c.defeated ? ' defeated' : ''}`;

    const token = document.createElement('span');
    token.className = `target-token${c.type === 'enemy' ? '' : ' ally'}`;
    if (c.avatar) {
      const img = document.createElement('img');
      img.src = c.avatar;
      img.alt = c.name;
      img.onerror = () => { img.remove(); token.textContent = c.name.slice(0, 1).toUpperCase(); };
      token.append(img);
    } else {
      token.textContent = c.name.slice(0, 1).toUpperCase();
    }

    const name = document.createElement('span');
    name.className = 'target-name';
    name.innerHTML = '<b></b><small></small>';
    name.querySelector('b').textContent = c.name;
    name.querySelector('small').textContent = `${c.type === 'enemy' ? 'Adversario' : c.species || 'Aliado'} · CA ${c.ac ?? '—'}`;

    const hp = document.createElement('span');
    hp.className = `target-hp${isMarkedByViewed || markedByAny ? ' marked' : ''}`;
    hp.innerHTML = '<i></i><small></small>';
    hp.querySelector('i').textContent = `${c.hp}/${c.maxHp} PG`;

    let subStatus = 'Sin marca';
    if (isMarkedByViewed) subStatus = '◎ Marca activa (+1d6)';
    else if (markedByAny) subStatus = `◎ Marca de ${markedByAny.name}`;
    else if (c.defeated || c.hp <= 0) subStatus = 'Fuera de combate';
    else if (c.hp < c.maxHp) subStatus = 'Herido';
    hp.querySelector('small').textContent = subStatus;

    row.append(token, name, hp);
    row.addEventListener('click', () => {
      state.currentTargetId = c.id;
      saveState('targets');
      emitToast(`${c.name} seleccionado como objetivo`);
    });
    wrap.append(row);

    const bar = document.createElement('div');
    bar.className = 'target-hp-bar';
    const pct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
    const fill = document.createElement('i');
    fill.style.width = `${pct}%`;
    const cls = hpClass(c.hp, c.maxHp);
    if (cls) fill.className = cls;
    bar.append(fill);
    wrap.append(bar);

    const sub = document.createElement('div');
    sub.className = 'target-subcontrols';
    const hpBtns = document.createElement('div');
    hpBtns.className = 'target-hp-mini';

    hpBtns.append(
      makeMiniButton('-5', 'Restar 5 PG', () => adjustHp(c, -5, 'Ajuste DM')),
      makeMiniButton('-1', 'Restar 1 PG', () => adjustHp(c, -1, 'Ajuste DM')),
      makeMiniButton('±', 'Daño o curación exacta', () => openHpDialog(c.id)),
      makeMiniButton('+1', 'Sumar 1 PG', () => adjustHp(c, 1, 'Curación DM'))
    );

    if (c.type === 'enemy') {
      hpBtns.append(makeMiniButton('⧉', 'Clonar adversario (en reserva del mapa)', () => cloneEnemy(c.id)));
      hpBtns.append(makeMiniButton('🔍', 'Buscar imagen en Google', () => window.open(googleImagesUrl(c.name), '_blank', 'noopener')));
    }
    hpBtns.append(makeMiniButton('✕', c.type === 'enemy' ? 'Eliminar adversario' : 'Eliminar personaje', () => removeCombatant(c.id, msg => confirm(msg)), 'remove-enemy-btn'));
    sub.append(hpBtns);

    if (c.type === 'enemy') {
      const label = document.createElement('label');
      label.className = 'enemy-defeated';
      label.innerHTML = '<input type="checkbox"><span>Derrotado</span>';
      const chk = label.querySelector('input');
      chk.checked = !!c.defeated;
      chk.addEventListener('change', e => {
        c.defeated = e.target.checked;
        if (c.defeated) c.hp = 0;
        else if (c.hp <= 0) c.hp = 1;
        saveState('all');
      });
      sub.append(label);
    }

    wrap.append(sub);
    root.append(wrap);
  });
}
