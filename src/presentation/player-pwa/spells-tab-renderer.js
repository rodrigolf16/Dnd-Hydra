import { signed } from '../../domain/shared/formatters.js';
import { analyzeDiceExpressions } from '../../domain/dice/dice-analyzer.js';
import { getSpellcastingMod, getSpellMeta, spellActionType } from '../../domain/combat/spell-rules.js';
import { $, $$ } from '../shared/dom.js';
import {
  getDefaultLimitedUses,
  getLocalTracker,
  isLiveConnected,
  persistLocalTrackers,
  pwaState,
  renderDicePills
} from './pwa-state.js';

export function renderSpellsTab(c) {
  const usesRoot = $('#playerUsesList');
  usesRoot.replaceChildren();
  const uses = getDefaultLimitedUses(c);
  const synced = isLiveConnected();
  $('#usesBlockWrap').hidden = uses.length === 0;
  $('#usesHint').textContent = synced ? 'Sincronizado en vivo con el DM' : 'Toca − / + para llevar tu cuenta';

  const loc = getLocalTracker(c);
  uses.forEach(u => {
    const remaining = synced ? u.remaining : (loc.uses[u.key] !== undefined ? loc.uses[u.key] : u.remaining);
    const row = document.createElement('div');
    row.className = 'use-row';
    row.innerHTML = `<div class="use-info"><b></b><small></small></div><div class="use-stepper"><button type="button" class="dec" aria-label="Gastar">−</button><b class="${remaining <= 0 ? 'empty' : ''}">${remaining}/${u.max}</b><button type="button" class="inc" aria-label="Recuperar">+</button></div>`;
    row.querySelector('.use-info b').textContent = u.name;
    row.querySelector('.use-info small').textContent = (u.rest === 'short' || u.reset === 'short') ? 'Recupera en descanso corto' : 'Recupera en descanso largo';

    const decBtn = row.querySelector('.dec');
    const incBtn = row.querySelector('.inc');
    if (synced) {
      decBtn.hidden = true;
      incBtn.hidden = true;
    } else {
      decBtn.addEventListener('click', () => { loc.uses[u.key] = Math.max(0, remaining - 1); persistLocalTrackers(); renderSpellsTab(c); });
      incBtn.addEventListener('click', () => { loc.uses[u.key] = Math.min(u.max, remaining + 1); persistLocalTrackers(); renderSpellsTab(c); });
    }
    usesRoot.append(row);
  });

  const spellNames = c.spells?.names || [];
  const hasSpells = spellNames.length > 0;
  $('#spellsBlockWrap').hidden = !hasSpells;
  $('#noSpellsCard').hidden = hasSpells;
  if (!hasSpells) return;

  $('#spellSaveDc').textContent = c.spells?.saveDc ?? '—';
  $('#spellAtkBonus').textContent = `1×d20 ${signed(c.spells?.attack || 0)}`;
  $('#spellPreparedCount').textContent = c.spells?.prepared ?? spellNames.length;
  $$('.filter-chip').forEach(ch => ch.classList.toggle('active', ch.dataset.spellFilter === pwaState.spellFilter));

  const castMod = getSpellcastingMod(c);
  const cardsRoot = $('#spellCards');
  cardsRoot.replaceChildren();

  const filtered = spellNames.filter(name => {
    const meta = getSpellMeta(name);
    const actType = spellActionType(name, c);
    const f = pwaState.spellFilter;
    if (f === 'all') return true;
    if (f === '0') return meta.level === 0;
    if (f === '1') return meta.level === 1;
    if (f === '2') return meta.level >= 2;
    if (f === 'bonus') return actType === 'bonus';
    if (f === 'reaction') return actType === 'reaction';
    return true;
  });

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-card';
    empty.innerHTML = '<b>Sin conjuros en este filtro</b><p>Prueba seleccionar «Todos» arriba.</p>';
    cardsRoot.append(empty);
    return;
  }

  filtered.forEach(name => {
    const meta = getSpellMeta(name);
    const actType = spellActionType(name, c);
    const typeLabel = actType === 'bonus' ? 'Adicional' : actType === 'reaction' ? 'Reacción' : actType === 'other' ? 'Ritual / Largo' : 'Acción';

    const card = document.createElement('article');
    card.className = 'spell-card';
    const head = document.createElement('div');
    head.className = 'spell-card-head';
    const left = document.createElement('div');
    const b = document.createElement('b');
    b.textContent = name;
    const tags = document.createElement('div');
    tags.className = 'weapon-tags';

    const addTag = (txt, cls = '') => {
      const s = document.createElement('span');
      s.className = `mini-tag ${cls}`.trim();
      s.textContent = txt;
      tags.append(s);
    };
    addTag(meta.level === 0 ? 'Truco' : `Nivel ${meta.level}`, 'blue');
    addTag(typeLabel);
    if (meta.concentration) addTag('Concentración', 'mastery');
    if (meta.ritual) addTag('Ritual', 'green');

    left.append(b, tags);
    head.append(left);
    card.append(head);

    const p = document.createElement('p');
    p.textContent = meta.desc;
    card.append(p);

    if (meta.attack || meta.save || meta.damage || meta.heal) {
      const steps = document.createElement('div');
      steps.className = 'dice-steps';
      if (meta.attack) {
        const atkBox = document.createElement('div');
        atkBox.className = 'dice-box atk';
        atkBox.innerHTML = `<span class="dice-box-label">ATAQUE CONJURO</span><div class="dice-formula-big">1×d20 ${signed(c.spells?.attack || 0)}</div><span class="dice-box-sub">Tira 1×d20 y suma ${signed(c.spells?.attack || 0)}</span>`;
        steps.append(atkBox);
      } else if (meta.save) {
        const svBox = document.createElement('div');
        svBox.className = 'dice-box atk';
        svBox.innerHTML = `<span class="dice-box-label">SALVACIÓN ENEMIGO</span><div class="dice-formula-big">${meta.save} CD ${c.spells?.saveDc ?? '—'}</div><span class="dice-box-sub">El DM tira salvación del objetivo</span>`;
        steps.append(svBox);
      }
      if (meta.heal) {
        const info = analyzeDiceExpressions([meta.heal, String(castMod)]);
        const hBox = document.createElement('div');
        hBox.className = 'dice-box heal';
        hBox.innerHTML = `<span class="dice-box-label">CURACIÓN</span><div class="dice-formula-big">${info.formula}</div><div class="dice-pills-row"></div><span class="dice-box-sub">${info.breakdown} PG</span>`;
        hBox.querySelector('.dice-pills-row').append(renderDicePills(info.diceList, info.flatBonus));
        steps.append(hBox);
      } else if (meta.damage) {
        const info = analyzeDiceExpressions([meta.damage]);
        const dBox = document.createElement('div');
        dBox.className = 'dice-box dmg';
        dBox.innerHTML = `<span class="dice-box-label">DADOS A TIRAR</span><div class="dice-formula-big">${info.formula}</div><div class="dice-pills-row"></div><span class="dice-box-sub">${info.breakdown}${meta.dmgType ? ` · ${meta.dmgType}` : ''}${meta.extraDamage ? ` (+ ${meta.extraDamage})` : ''}</span>`;
        dBox.querySelector('.dice-pills-row').append(renderDicePills(info.diceList, info.flatBonus));
        steps.append(dBox);
      }
      card.append(steps);
    }
    cardsRoot.append(card);
  });
}
