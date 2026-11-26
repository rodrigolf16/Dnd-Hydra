import { formatMeters, signed } from '../../domain/shared/formatters.js';
import { featureDescription } from '../../domain/combat/combatant-features.js';
import { getSpellMeta } from '../../domain/combat/spell-rules.js';
import { byId, getState, viewed } from '../../application/store/encounter-store.js';
import { $, $$, openDialog } from '../shared/dom.js';

export function openCharacterSheetDialog() {
  const c = viewed();
  $('#sheetTitle').textContent = `${c.name} · ${c.className || 'Combatiente'}`;
  const content = $('#sheetContent');
  content.replaceChildren();
  const sections = [];
  if (c.details?.length) sections.push(['Trasfondo y personalidad', ...c.details]);
  sections.push(['Resumen', `${c.species || '—'} · ${c.background || 'Sin trasfondo'}`, `PG ${c.hp}/${c.maxHp} · CA ${c.ac ?? '—'} · Velocidad ${formatMeters(c.speed)} m · Iniciativa ${signed(c.initiative || 0)}`]);
  if (c.stats && Object.keys(c.stats).length) sections.push(['Características', ...Object.entries(c.stats).map(([k, v]) => `${k}: ${v}`)]);
  if (c.saves && Object.keys(c.saves).length) sections.push(['Salvaciones', ...Object.entries(c.saves).map(([k, v]) => `${k} ${signed(v)}`)]);
  if (c.skills && Object.keys(c.skills).length) sections.push(['Habilidades', ...Object.entries(c.skills).map(([k, v]) => `${k} ${signed(v)}`)]);
  if (c.features?.length) sections.push(['Rasgos', ...c.features.map(f => `${f} — ${featureDescription(f, c)}`)]);
  if (c.feats?.length) sections.push(['Dotes', ...c.feats.map(f => `${f} — ${featureDescription(f, c)}`)]);
  if (c.weapons?.length) sections.push(['Armas', ...c.weapons.map(w => `${w.name} (${w.attack != null ? signed(w.attack) : 'sin tirada'} · ${w.damage} ${w.type || ''}${w.mastery ? ` · ${w.mastery}` : ''})`)]);
  if (c.spells?.names?.length) {
    const slots = Object.entries(c.spells).filter(([k]) => /^level\d+Slots$/.test(k)).map(([k, v]) => `Nv.${k.replace('level', '').replace('Slots', '')}: ${v}`).join(', ');
    sections.push([`Conjuros (CD ${c.spells.saveDc ?? '—'} · Ataque ${signed(c.spells.attack || 0)}${slots ? ` · Espacios ${slots}` : ''})`, ...c.spells.names.map(s => `${s} (Nv.${getSpellMeta(s).level}): ${getSpellMeta(s).desc}`)]);
  }
  if (c.equipment?.length) sections.push(['Equipo', ...c.equipment]);
  if (c.proficiencies?.length || c.languages?.length) sections.push(['Competencias e idiomas', ...(c.proficiencies || []), ...(c.languages || [])]);
  if (c.companion) sections.push(['Compañero', c.companion]);

  sections.forEach(([title, ...items]) => {
    if (!items.length) return;
    const box = document.createElement('section');
    box.innerHTML = '<h3></h3><ul></ul>';
    box.querySelector('h3').textContent = title;
    items.filter(Boolean).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      box.querySelector('ul').append(li);
    });
    content.append(box);
  });
  $('#exportPortraitFromSheetBtn').hidden = !c.avatar;
  openDialog($('#sheetDialog'));
}

export function syncInitInputsToState() {
  $$('#initEditList input').forEach(inp => {
    const c = byId(inp.dataset.id);
    if (!c) return;
    const val = inp.value.trim();
    if (val === '') c.initiativeRoll = null;
    else if (Number.isFinite(Number(val))) c.initiativeRoll = Number(val);
  });
}

export function renderInitiativeEditorRows() {
  const state = getState();
  const list = $('#initEditList');
  list.replaceChildren();
  state.combatants.forEach((c, idx) => {
    const row = document.createElement('div');
    row.className = 'init-edit-row';
    row.innerHTML = '<div><b></b><small></small></div><input type="number" step="1"><div class="init-move-btns"><button type="button" class="up-btn" title="Subir">↑</button><button type="button" class="down-btn" title="Bajar">↓</button></div>';
    row.querySelector('b').textContent = c.name;
    row.querySelector('small').textContent = `${c.type === 'enemy' ? 'Adversario' : c.className} · Mod ${signed(c.initiative || 0)}`;
    const inp = row.querySelector('input');
    inp.dataset.id = c.id;
    inp.value = c.initiativeRoll != null ? String(c.initiativeRoll) : '';
    inp.placeholder = `Mod ${signed(c.initiative || 0)}`;

    row.querySelector('.up-btn').disabled = idx === 0;
    row.querySelector('.down-btn').disabled = idx === state.combatants.length - 1;
    row.querySelector('.up-btn').addEventListener('click', () => {
      syncInitInputsToState();
      if (idx > 0) {
        [state.combatants[idx - 1], state.combatants[idx]] = [state.combatants[idx], state.combatants[idx - 1]];
        renderInitiativeEditorRows();
      }
    });
    row.querySelector('.down-btn').addEventListener('click', () => {
      syncInitInputsToState();
      if (idx < state.combatants.length - 1) {
        [state.combatants[idx + 1], state.combatants[idx]] = [state.combatants[idx], state.combatants[idx + 1]];
        renderInitiativeEditorRows();
      }
    });
    list.append(row);
  });
}

export function openInitiativeEditorDialog() {
  renderInitiativeEditorRows();
  openDialog($('#initiativeDialog'));
}
