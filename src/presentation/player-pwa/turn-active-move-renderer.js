import { MASTERY_DESCRIPTIONS } from '../../data/rules/actions.js';
import { formatMeters, normalizeText, signed } from '../../domain/shared/formatters.js';
import { analyzeDiceExpressions } from '../../domain/dice/dice-analyzer.js';
import { getAbilityMod, getSkillBonus } from '../../domain/combat/combatant-stats.js';
import {
  getRageDamageBonus,
  getSneakDiceCount,
  hasFeature,
  hasHuntersMark,
  isMeleeStrengthWeapon,
  isSneakEligibleWeapon
} from '../../domain/combat/combatant-features.js';
import { getSpellcastingMod, getSpellMeta } from '../../domain/combat/spell-rules.js';
import { $, $$ } from '../shared/dom.js';
import { isLiveConnected, pwaState, renderDicePills } from './pwa-state.js';

function renderClassModsForAttack(c, onRerender) {
  const modBar = $('#classModsBar');
  modBar.replaceChildren();
  const defs = [];
  if (hasHuntersMark(c)) defs.push({ key: 'huntersMark', label: '◎ Marca (+1d6)' });
  if (hasFeature(c, /emboscador pavoroso/i)) defs.push({ key: 'dreadfulStrike', label: '🌑 Emboscador (+2d6)' });
  if (hasFeature(c, /^furia$/i)) defs.push({ key: 'rage', label: `🔥 Furia (+${getRageDamageBonus(c)})` });
  if (hasFeature(c, /ataque temerario/i)) defs.push({ key: 'reckless', label: '⚡ Temerario' });
  if (hasFeature(c, /frenes[ií]/i)) defs.push({ key: 'frenzy', label: '💢 Frenesí (+2d6)' });
  if (hasFeature(c, /ataque furtivo/i)) defs.push({ key: 'sneakAttack', label: `🗡 Furtivo (+${getSneakDiceCount(c)}d6)` });
  if (hasFeature(c, /punter[ií]a certera/i)) defs.push({ key: 'steadyAim', label: '🎯 Puntería' });

  modBar.hidden = defs.length === 0;
  defs.forEach(def => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `mod-pill${pwaState.classMods[def.key] ? ' active' : ''}`;
    b.textContent = def.label;
    b.addEventListener('click', () => {
      pwaState.classMods[def.key] = !pwaState.classMods[def.key];
      if ((def.key === 'reckless' || def.key === 'steadyAim') && pwaState.classMods[def.key]) pwaState.rollMode = 'advantage';
      if (def.key === 'frenzy' && pwaState.classMods.frenzy) {
        pwaState.classMods.rage = true;
        pwaState.classMods.reckless = true;
        pwaState.rollMode = 'advantage';
      }
      onRerender();
    });
    modBar.append(b);
  });
}

function buildAttackDiceView(c, move, diceRoot) {
  const w = move.weapon;
  const mods = pwaState.classMods;
  const effectiveMode = (mods.reckless && isMeleeStrengthWeapon(w)) || mods.steadyAim ? 'advantage' : pwaState.rollMode;
  const d20Qty = effectiveMode === 'normal' ? 1 : 2;
  const atkText = effectiveMode === 'advantage'
    ? `2×d20 (mayor) ${signed(w.attack)}`
    : effectiveMode === 'disadvantage'
      ? `2×d20 (menor) ${signed(w.attack)}`
      : `1×d20 ${signed(w.attack)}`;

  const dmgTerms = [w.damage];
  const appliedNotes = [];
  if (mods.huntersMark && hasHuntersMark(c)) { dmgTerms.push('1d6'); appliedNotes.push('+1d6 Marca'); }
  if (mods.dreadfulStrike && hasFeature(c, /emboscador pavoroso/i)) { dmgTerms.push('2d6'); appliedNotes.push('+2d6 Emboscador'); }
  if (mods.rage && hasFeature(c, /^furia$/i) && isMeleeStrengthWeapon(w)) { const rb = getRageDamageBonus(c); dmgTerms.push(String(rb)); appliedNotes.push(`+${rb} Furia`); }
  if (mods.frenzy && hasFeature(c, /frenes[ií]/i) && isMeleeStrengthWeapon(w)) { dmgTerms.push('2d6'); appliedNotes.push('+2d6 Frenesí'); }
  if (mods.sneakAttack && hasFeature(c, /ataque furtivo/i) && isSneakEligibleWeapon(w)) { const n = getSneakDiceCount(c); dmgTerms.push(`${n}d6`); appliedNotes.push(`+${n}d6 Furtivo`); }

  const dmgInfo = analyzeDiceExpressions(dmgTerms, pwaState.critMode);
  const steps = document.createElement('div');
  steps.className = 'dice-steps';

  const atkBox = document.createElement('div');
  atkBox.className = 'dice-box atk';
  atkBox.innerHTML = `<span class="dice-box-label">1. IMPACTAR (DADO FÍSICO)</span><div class="dice-formula-big">${atkText}</div><div class="dice-pills-row"></div><span class="dice-box-sub"></span>`;
  atkBox.querySelector('.dice-pills-row').append(renderDicePills([{ count: d20Qty, sides: 20 }], Number(w.attack) || 0));
  atkBox.querySelector('.dice-box-sub').textContent = 'Tirá en la mesa y decile al DM el número del d20.';

  const dmgBox = document.createElement('div');
  dmgBox.className = `dice-box dmg${pwaState.critMode ? ' crit' : ''}`;
  dmgBox.innerHTML = `<span class="dice-box-label">${pwaState.critMode ? '2. DAÑO CRÍTICO (×2 DADOS)' : '2. SI IMPACTA (DAÑO)'}</span><div class="dice-formula-big">${dmgInfo.formula}</div><div class="dice-pills-row"></div><span class="dice-box-sub"></span>`;
  dmgBox.querySelector('.dice-pills-row').append(renderDicePills(dmgInfo.diceList, dmgInfo.flatBonus));
  dmgBox.querySelector('.dice-box-sub').textContent = `Agarrá ${dmgInfo.totalDice} ${dmgInfo.totalDice === 1 ? 'dado' : 'dados'} (${dmgInfo.breakdown})${w.type ? ` · ${w.type}` : ''}`;

  steps.append(atkBox, dmgBox);
  diceRoot.append(steps);

  return {
    diceSummary: `${atkText} / Daño ${dmgInfo.formula}`,
    modifiersLabel: [effectiveMode !== 'normal' ? effectiveMode : '', pwaState.critMode ? 'Crítico ×2' : '', ...appliedNotes].filter(Boolean).join(' · ')
  };
}

export function renderActiveMovePanel(c, onRerender) {
  const move = pwaState.selectedMove;
  const panel = $('#activeMovePanel');
  const choices = $('#turnChoicesPanel');
  if (!move) {
    panel.hidden = true;
    choices.hidden = false;
    return null;
  }

  panel.hidden = false;
  choices.hidden = true;

  $('#activeMoveCostBadge').textContent = move.costLabel || 'Acción';
  $('#activeMoveKicker').textContent = move.kind === 'attack' ? 'ATAQUE CON ARMA' : move.kind === 'spell' ? 'CONJURO' : 'MOVIMIENTO ELEGIDO';
  $('#activeMoveTitle').textContent = `${move.icon || '✦'} ${move.title}`;
  $('#activeMoveDesc').textContent = move.desc || '';

  const isAttack = move.kind === 'attack' && !!move.weapon;
  $('#activeMoveModsWrap').hidden = !isAttack;
  if (isAttack) {
    $$('.seg-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.rollMode === pwaState.rollMode));
    $('#critToggleBtn').classList.toggle('active', pwaState.critMode);
    renderClassModsForAttack(c, onRerender);
  }

  const diceRoot = $('#activeMoveDiceBox');
  diceRoot.replaceChildren();
  let summaryMeta = { diceSummary: '', modifiersLabel: '' };

  if (isAttack) {
    summaryMeta = buildAttackDiceView(c, move, diceRoot);
  } else if (move.kind === 'spell') {
    const meta = getSpellMeta(move.spellName);
    const steps = document.createElement('div');
    steps.className = 'dice-steps';
    if (meta.attack) {
      const box = document.createElement('div');
      box.className = 'dice-box atk';
      box.innerHTML = `<span class="dice-box-label">ATAQUE CONJURO</span><div class="dice-formula-big">1×d20 ${signed(c.spells?.attack || 0)}</div><span class="dice-box-sub">Tirá 1×d20 y decile el resultado al DM</span>`;
      steps.append(box);
      summaryMeta.diceSummary = `1×d20 ${signed(c.spells?.attack || 0)}`;
    } else if (meta.save) {
      const box = document.createElement('div');
      box.className = 'dice-box atk';
      box.innerHTML = `<span class="dice-box-label">SALVACIÓN ENEMIGO</span><div class="dice-formula-big">${meta.save} CD ${c.spells?.saveDc ?? '—'}</div><span class="dice-box-sub">El DM tira la salvación del objetivo</span>`;
      steps.append(box);
    }
    if (meta.heal || meta.damage) {
      const info = meta.heal
        ? analyzeDiceExpressions([meta.heal, String(getSpellcastingMod(c))])
        : analyzeDiceExpressions([meta.damage]);
      const box = document.createElement('div');
      box.className = `dice-box ${meta.heal ? 'heal' : 'dmg'}`;
      box.innerHTML = `<span class="dice-box-label">${meta.heal ? 'DADOS DE CURACIÓN' : 'DADOS DE DAÑO'}</span><div class="dice-formula-big">${info.formula}</div><div class="dice-pills-row"></div><span class="dice-box-sub">${info.breakdown}${meta.dmgType ? ` · ${meta.dmgType}` : ''}</span>`;
      box.querySelector('.dice-pills-row').append(renderDicePills(info.diceList, info.flatBonus));
      steps.append(box);
      summaryMeta.diceSummary = [summaryMeta.diceSummary, info.formula].filter(Boolean).join(' / ');
    }
    if (steps.children.length) diceRoot.append(steps);
  } else if (move.kind === 'potion') {
    const info = analyzeDiceExpressions(['2d4+2']);
    const box = document.createElement('div');
    box.className = 'dice-box heal';
    box.innerHTML = `<span class="dice-box-label">DADOS DE CURACIÓN</span><div class="dice-formula-big">${info.formula}</div><div class="dice-pills-row"></div><span class="dice-box-sub">Tirá 2×d4 + 2 y decile el total al DM</span>`;
    box.querySelector('.dice-pills-row').append(renderDicePills(info.diceList, info.flatBonus));
    diceRoot.append(box);
    summaryMeta.diceSummary = '2d4+2 curación';
  } else if (move.standardId === 'std-hide') {
    const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
    const box = document.createElement('div');
    box.className = 'dice-box atk';
    box.innerHTML = `<span class="dice-box-label">PRUEBA DE SIGILO (CD 15)</span><div class="dice-formula-big">1×d20 ${signed(stealth)}</div><div class="dice-pills-row"></div><span class="dice-box-sub">Tirá 1×d20 físico y decile el número al DM</span>`;
    box.querySelector('.dice-pills-row').append(renderDicePills([{ count: 1, sides: 20 }], stealth));
    diceRoot.append(box);
    summaryMeta.diceSummary = `1×d20 ${signed(stealth)} (CD 15)`;
  } else if (move.kind === 'movement') {
    const box = document.createElement('div');
    box.className = 'dice-box neutral';
    box.innerHTML = `<span class="dice-box-label">DESPLAZAMIENTO</span><div class="dice-formula-big">${formatMeters(move.distanceMeters, true)} m</div><span class="dice-box-sub">Indicá al DM hacia dónde movés tu ficha en el mapa.</span>`;
    diceRoot.append(box);
    summaryMeta.diceSummary = `${formatMeters(move.distanceMeters, true)} m`;
  } else {
    const box = document.createElement('div');
    box.className = 'dice-box neutral';
    box.innerHTML = `<span class="dice-box-label">SIN TIRADA DE DADOS</span><div class="dice-formula-big">${move.preview || 'Efecto directo'}</div><span class="dice-box-sub">Confirmá para avisar al DM y continuar tu turno.</span>`;
    diceRoot.append(box);
  }

  const noteEl = $('#activeMoveNote');
  const mDesc = isAttack && move.weapon.mastery ? MASTERY_DESCRIPTIONS[normalizeText(move.weapon.mastery)] : '';
  noteEl.hidden = !mDesc;
  if (mDesc) noteEl.textContent = mDesc;

  const live = isLiveConnected();
  $('#activeMoveWaitingBox').hidden = !pwaState.waitingForDm;
  const sendBtn = $('#sendMoveBtn');
  if (pwaState.waitingForDm) {
    sendBtn.textContent = '↻ Reenviar aviso al DM';
    $('#continueTurnBtn').hidden = false;
  } else {
    sendBtn.textContent = live ? '📤 Enviar al DM (el DM anota el resultado)' : '✓ Marcar movimiento realizado';
    $('#continueTurnBtn').hidden = true;
  }

  return summaryMeta;
}
