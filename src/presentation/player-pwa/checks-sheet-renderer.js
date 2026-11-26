import { MASTERY_DESCRIPTIONS } from '../../data/rules/actions.js';
import { ABILITY_NAMES, FEATURE_DESCRIPTIONS } from '../../data/rules/features.js';
import { normalizeText, signed } from '../../domain/shared/formatters.js';
import { getAbilityMod } from '../../domain/combat/combatant-stats.js';
import { $, $$ } from '../shared/dom.js';
import { createGuideCard, pwaState } from './pwa-state.js';

const ABILITY_SHORT = { Fue: 'FUE', Des: 'DES', Con: 'CON', Int: 'INT', Sab: 'SAB', Car: 'CAR' };

export function renderSpotlight() {
  $$('.mini-seg-btn').forEach(b => b.classList.toggle('active', b.dataset.checkMode === pwaState.checkMode));
  const sel = pwaState.selectedCheck;
  $('#spotlightKicker').textContent = `${sel.kind.toUpperCase()} · TIRA EN LA MESA`;
  $('#spotlightName').textContent = sel.label;
  const b = signed(sel.bonus);
  if (pwaState.checkMode === 'advantage') {
    $('#spotlightDice').textContent = `2 × d20 (mayor) ${b}`;
    $('#spotlightHint').textContent = `Agarra 2 dados de 20 caras, quédate el resultado más alto y suma ${b}.`;
  } else if (pwaState.checkMode === 'disadvantage') {
    $('#spotlightDice').textContent = `2 × d20 (menor) ${b}`;
    $('#spotlightHint').textContent = `Agarra 2 dados de 20 caras, quédate el resultado más bajo y suma ${b}.`;
  } else {
    $('#spotlightDice').textContent = `1 × d20 ${b}`;
    $('#spotlightHint').textContent = `Agarra 1 dado de 20 caras y suma ${b} al número que salga.`;
  }
}

export function renderChecksTab(c) {
  renderSpotlight();

  const abGrid = $('#abilitiesGrid');
  abGrid.replaceChildren();
  Object.entries(c.stats || {}).forEach(([k, val]) => {
    const mod = getAbilityMod(c, k);
    const score = String(val).match(/\d+/)?.[0] || val;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `ability-btn${pwaState.selectedCheck.label === ABILITY_NAMES[k] && pwaState.selectedCheck.kind === 'Prueba de atributo' ? ' selected' : ''}`;
    btn.innerHTML = `<small>${ABILITY_SHORT[k] || k}</small><b>${signed(mod)}</b><i>${score}</i>`;
    btn.addEventListener('click', () => {
      pwaState.selectedCheck = { label: ABILITY_NAMES[k] || k, bonus: mod, kind: 'Prueba de atributo' };
      renderChecksTab(c);
    });
    abGrid.append(btn);
  });

  const svGrid = $('#savesGrid');
  svGrid.replaceChildren();
  Object.entries(ABILITY_NAMES).forEach(([k, full]) => {
    const bonus = c.saves?.[k] ?? getAbilityMod(c, k);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `save-btn${pwaState.selectedCheck.label === `Salvación de ${full}` ? ' selected' : ''}`;
    btn.innerHTML = `<span>${full}</span><b>${signed(bonus)}</b>`;
    btn.addEventListener('click', () => {
      pwaState.selectedCheck = { label: `Salvación de ${full}`, bonus, kind: 'Salvación' };
      renderChecksTab(c);
    });
    svGrid.append(btn);
  });

  const query = normalizeText($('#skillSearch').value);
  const skList = $('#skillsList');
  skList.replaceChildren();
  Object.entries(c.skills || {})
    .filter(([name]) => !query || normalizeText(name).includes(query))
    .forEach(([name, bonus]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `skill-btn${pwaState.selectedCheck.label === name && pwaState.selectedCheck.kind === 'Habilidad' ? ' selected' : ''}`;
      btn.innerHTML = `<span></span><b>${signed(bonus)}</b>`;
      btn.querySelector('span').textContent = name;
      btn.addEventListener('click', () => {
        pwaState.selectedCheck = { label: name, bonus: Number(bonus) || 0, kind: 'Habilidad' };
        renderChecksTab(c);
      });
      skList.append(btn);
    });
}

export function renderSheetTab(c) {
  const initSec = $('#liveInitSection');
  const payload = pwaState.livePayload;
  if (payload && Array.isArray(payload.initiativeOrder) && payload.initiativeOrder.length) {
    initSec.hidden = false;
    $('#liveInitRound').textContent = `Ronda ${payload.round || 1}`;
    const list = $('#liveInitList');
    list.replaceChildren();
    payload.initiativeOrder.forEach(item => {
      const row = document.createElement('div');
      row.className = `init-row${item.active ? ' active' : ''}${item.defeated ? ' defeated' : ''}`;
      row.innerHTML = `<div class="init-row-left"><span class="init-num">${item.initRoll ?? '—'}</span><b></b></div><span class="mini-tag">${item.active ? 'Turno actual' : item.type === 'enemy' ? 'Adversario' : 'Aliado'}</span>`;
      row.querySelector('b').textContent = item.name + (item.id === c.id ? ' (Tú)' : '');
      list.append(row);
    });
  } else {
    initSec.hidden = true;
  }

  const mRoot = $('#masteriesList');
  mRoot.replaceChildren();
  const masteries = c.masteries || [];
  if (!masteries.length) {
    mRoot.append(createGuideCard({ icon: '★', title: 'Sin maestrías de arma', desc: 'Este personaje no usa propiedades de maestría de armas.' }));
  } else {
    masteries.forEach(m => {
      const desc = MASTERY_DESCRIPTIONS[normalizeText(m)] || `Propiedad de maestría: ${m}.`;
      mRoot.append(createGuideCard({ icon: '★', title: m, tag: 'Maestría', desc }));
    });
  }

  const fRoot = $('#featuresList');
  fRoot.replaceChildren();
  [...(c.feats || []).map(f => ({ name: f, tag: 'Dote' })), ...(c.features || []).map(f => ({ name: f, tag: 'Rasgo' }))].forEach(t => {
    const desc = FEATURE_DESCRIPTIONS[String(t.name).toLowerCase()] || 'Rasgo de tu ficha en Nivel20.';
    fRoot.append(createGuideCard({ icon: t.tag === 'Dote' ? '◆' : '✦', title: t.name, tag: t.tag, desc }));
  });

  const prof = $('#sheetProfileCard');
  prof.replaceChildren();
  const addBlock = (heading, content) => {
    if (!content) return;
    const div = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = heading;
    const p = document.createElement('p');
    p.textContent = Array.isArray(content) ? content.join(' · ') : content;
    div.append(h3, p);
    prof.append(div);
  };
  addBlock('Trasfondo', c.background || `${c.species || ''} · ${c.className || ''}`);
  if (c.companion) addBlock('Compañero', c.companion);
  if (c.equipment?.length) addBlock('Equipo', c.equipment);
  if (c.proficiencies?.length) addBlock('Competencias', c.proficiencies);
  if (c.languages?.length) addBlock('Idiomas', c.languages);
}
