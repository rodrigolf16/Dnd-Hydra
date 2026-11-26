import { signed } from '../../domain/shared/formatters.js';
import { getAbilityMod } from '../../domain/combat/combatant-stats.js';
import { hasFeature } from '../../domain/combat/combatant-features.js';

export function getDefaultLimitedUses(c) {
  if (Array.isArray(c.limitedUses) && c.limitedUses.length) return c.limitedUses;
  const list = [];
  const s = c.spells || {};
  if (s.level1Slots) list.push({ key: 'slot-1', name: 'Espacios Nv. 1', remaining: s.level1Slots, max: s.level1Slots, rest: 'long' });
  if (s.level2Slots) list.push({ key: 'slot-2', name: 'Espacios Nv. 2', remaining: s.level2Slots, max: s.level2Slots, rest: 'long' });
  if (s.level3Slots) list.push({ key: 'slot-3', name: 'Espacios Nv. 3', remaining: s.level3Slots, max: s.level3Slots, rest: 'long' });
  if (s.freeHuntersMark) list.push({ key: 'free-hunters-mark', name: 'Marca del cazador gratis', remaining: s.freeHuntersMark, max: s.freeHuntersMark, rest: 'long' });
  if (hasFeature(c, /emboscador pavoroso/i)) {
    const max = Math.max(1, getAbilityMod(c, 'Sab'));
    list.push({ key: 'dreadful-strike', name: 'Emboscador pavoroso (+2d6)', remaining: max, max, rest: 'long' });
  }
  if (hasFeature(c, /^furia$/i)) list.push({ key: 'rage', name: 'Furia', remaining: 3, max: 3, rest: 'long' });
  if (hasFeature(c, /cambio cr[oó]nico/i)) list.push({ key: 'chronal-shift', name: 'Cambio crónico', remaining: 2, max: 2, rest: 'long' });
  if (hasFeature(c, /inspiraci[oó]n b[aá]rdica/i)) {
    const max = Math.max(1, getAbilityMod(c, 'Car'));
    list.push({ key: 'bardic', name: 'Inspiración bárdica (1×d8)', remaining: max, max, rest: 'short' });
  }
  if (hasFeature(c, /^forma salvaje$/i)) list.push({ key: 'wild-shape', name: 'Forma salvaje', remaining: 2, max: 2, rest: 'short' });
  return list;
}

export function renderDicePills(diceList, flatBonus) {
  const frag = document.createDocumentFragment();
  diceList.forEach(d => {
    const span = document.createElement('span');
    span.className = `die-chip d${d.sides}`;
    span.textContent = `${d.count} × d${d.sides}`;
    frag.append(span);
  });
  if (flatBonus) {
    const mod = document.createElement('span');
    mod.className = 'die-chip mod';
    mod.textContent = `sumar ${signed(flatBonus)}`;
    frag.append(mod);
  }
  return frag;
}

export function createGuideCard({ icon, title, tag, desc, dice }) {
  const el = document.createElement('article');
  el.className = 'action-item';
  el.innerHTML = `<div class="action-item-head"><div class="action-item-title"><span class="action-ico"></span><span></span></div>${tag ? '<span class="mini-tag"></span>' : ''}</div><p></p>`;
  el.querySelector('.action-ico').textContent = icon || '✦';
  el.querySelector('.action-item-title span:last-child').textContent = title;
  if (tag) el.querySelector('.mini-tag').textContent = tag;
  el.querySelector('p').textContent = desc;
  if (dice) {
    const box = document.createElement('div');
    box.className = 'action-dice-inline';
    box.innerHTML = '<span>🎲</span><b></b>';
    box.querySelector('b').textContent = dice;
    el.append(box);
  }
  return el;
}
