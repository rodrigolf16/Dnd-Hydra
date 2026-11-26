import { limitedUseKeyFor } from '../../domain/combat/combatant-features.js';
import { getSpellMeta, spellActionType } from '../../domain/combat/spell-rules.js';
import { copyToClipboard } from '../../infrastructure/browser/clipboard.js';
import { byId, emitToast, getState, uiState, viewed } from '../../application/store/encounter-store.js';
import { resolveAttackAction } from '../../application/use-cases/attack-resolver.js';
import {
  resolveCunningAction,
  resolveGenericAction,
  resolveHealingPotionAction,
  resolveHideAction,
  resolveHuntersMarkAction,
  resolveSpellAction
} from '../../application/use-cases/action-resolver.js';
import { cancelHuntersMark, useCounter } from '../../application/use-cases/class-actions.js';
import { $, $$, closeDialog, openDialog } from '../shared/dom.js';
import {
  readAttackFlags,
  selectedWeapon,
  setRollMode,
  updateAttackVerdict,
  updatePhysicalActionCards
} from './action-modal-view.js';
import { configureAttackDialog, configureSpecialActionDialog } from './action-modal-configurator.js';
import { clearPendingMobileAction } from './mobile-action-handler.js';

export function openSpellPicker(group) {
  const c = viewed();
  const spells = (c.spells?.names || []).filter(name => spellActionType(name, c) === group);
  $('#spellPickerTitle').textContent = `Conjuros · ${group === 'bonus' ? 'acción adicional' : group === 'reaction' ? 'reacción' : group === 'other' ? 'ritual o lanzamiento largo' : 'acción'}`;
  const list = $('#spellPickerList');
  list.replaceChildren();
  spells.forEach(name => {
    const meta = getSpellMeta(name);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'spell-picker-option';
    btn.innerHTML = '<b></b><small></small><span>Elegir →</span>';
    btn.querySelector('b').textContent = `${name}${meta.level === 0 ? ' (Truco)' : ` (Nv. ${meta.level})`}${meta.concentration ? ' · Conc.' : ''}`;
    btn.querySelector('small').textContent = meta.desc;
    btn.addEventListener('click', () => {
      closeDialog($('#spellPickerDialog'));
      openActionModal({ name, kind: 'spell', isMark: /marca del cazador/i.test(name) });
    });
    list.append(btn);
  });
  openDialog($('#spellPickerDialog'));
}

function validateActionAvailable(c, cfg) {
  const { name, kind, attackMode, isMark } = cfg;
  if (kind === 'attack') {
    if (attackMode === 'opportunity' && !c.turnState.reaction) return 'Ya gastó su Reacción';
    if (attackMode === 'offhand' && !c.turnState.bonus) return 'Ya gastó su Acción adicional';
    if (attackMode === 'nick') {
      if (c.turnNickUsed) return 'Mellar ya usado este turno (máx. 1/turno)';
      if (!c.turnBaseAttackMade) return 'Primero registra un ataque en Atacar para habilitar Mellar';
    }
    if (!attackMode || attackMode === 'normal') {
      if (!c.turnState.action && !(c.attackSequenceOpen && c.turnAttacksRemaining > 0)) return 'Ya gastó su Acción este turno';
      if (c.turnAttacksRemaining <= 0) return 'Ya resolvió todos los ataques de esta acción';
    }
    return null;
  }
  if (!isMark) {
    const resKey = kind === 'spell' ? spellActionType(name, c) : kind;
    if (['action', 'bonus', 'reaction'].includes(resKey) && !c.turnState[resKey]) {
      return `${resKey === 'bonus' ? 'Acción adicional' : resKey === 'reaction' ? 'Reacción' : 'Acción'} ya gastada este turno`;
    }
    const limKey = limitedUseKeyFor(name);
    const limCounter = limKey ? useCounter(limKey, c) : null;
    if (limCounter && limCounter.remaining <= 0) return `${name}: no quedan usos`;
  }
  return null;
}

export function openActionModal(actionCfg) {
  const c = viewed();
  const blockMsg = validateActionAvailable(c, actionCfg);
  if (blockMsg) { emitToast(blockMsg); return; }

  const isAttack = actionCfg.kind === 'attack';
  uiState.currentAction = { ...actionCfg };

  $('#dialogTitle').textContent = actionCfg.name;
  $('#resolveAction').disabled = false;
  $('#cancelMarkBtn').hidden = true;
  $('#spellSlotField').hidden = true;
  $('#rollModeField').hidden = !isAttack;
  $('#weaponField').hidden = !isAttack;
  $('#targetField').hidden = !isAttack && !actionCfg.isMark && actionCfg.kind !== 'spell' && !actionCfg.isPotion;
  $('#physicalActionCards').hidden = true;
  $('#physicalAttackCard').hidden = true;
  $('#physicalDamageCard').hidden = true;
  $('#physicalAtkInput').value = '';
  $('#physicalDmgInput').value = '';
  $('#attackVerdictBadge').textContent = 'Sin anotar';
  $('#attackVerdictBadge').className = 'hit-verdict';
  ['#recklessToggle', '#rageDamageToggle', '#frenzyToggle', '#dreadToggle', '#sneakToggle', '#critToggle'].forEach(sel => { $(sel).hidden = true; });
  $('#critDamageCheck').checked = false;

  if (isAttack) configureAttackDialog(c, actionCfg.attackMode);
  else configureSpecialActionDialog(c, actionCfg);

  openDialog($('#actionDialog'));
}

export function wireActionModalEvents() {
  $$('#rollModeGroup button').forEach(btn => btn.addEventListener('click', () => setRollMode(btn.dataset.rollMode)));
  $('#weaponSelect').addEventListener('change', () => updatePhysicalActionCards());
  $('#targetSelect').addEventListener('change', () => {
    const v = $('#targetSelect').value;
    if (v && v !== viewed().id) getState().currentTargetId = v;
    updatePhysicalActionCards();
  });
  $('#spellSlotSelect').addEventListener('change', () => updatePhysicalActionCards());
  $('#recklessAttack').addEventListener('change', e => {
    setRollMode(e.target.checked ? 'advantage' : 'normal');
    if (viewed().raging && !viewed().turnFrenzyUsed) $('#frenzyCheck').checked = e.target.checked;
    updatePhysicalActionCards();
  });
  ['#rageDamageCheck', '#frenzyCheck', '#dreadDamage', '#sneakDamage', '#critDamageCheck'].forEach(sel => $(sel).addEventListener('change', () => updatePhysicalActionCards()));
  $('#physicalAtkInput').addEventListener('input', updateAttackVerdict);
  $('#copyAttackFormulaBtn').addEventListener('click', () => copyToClipboard($('#n20AttackFormula').textContent).then(ok => ok && emitToast(`Copiado: ${$('#n20AttackFormula').textContent}`)));
  $('#copyDamageFormulaBtn').addEventListener('click', () => copyToClipboard($('#n20DamageFormula').textContent).then(ok => ok && emitToast(`Copiado: ${$('#n20DamageFormula').textContent}`)));
  $('#cancelMarkBtn').addEventListener('click', () => { cancelHuntersMark(); closeDialog($('#actionDialog')); });
  $('#resolveAction').addEventListener('click', () => {
    const act = uiState.currentAction;
    if (!act) return;
    const c = viewed();
    const target = byId($('#targetSelect').value);
    if (target && target.id !== c.id) getState().currentTargetId = target.id;
    let ok = false;
    if (act.kind === 'attack') ok = resolveAttackAction({ c, actionName: act.name, attackMode: act.attackMode, weapon: selectedWeapon(), target, flags: readAttackFlags(), d20Raw: $('#physicalAtkInput').value.trim(), dmgRaw: $('#physicalDmgInput').value.trim(), atkFormulaLabel: $('#n20AttackFormula').textContent });
    else if (act.isMark) ok = resolveHuntersMarkAction({ c, target, slotKey: $('#spellSlotSelect').value });
    else if (act.isPotion) ok = resolveHealingPotionAction({ c, target, healRaw: $('#physicalDmgInput').value.trim() });
    else if (act.isHide) ok = resolveHideAction({ c, d20Raw: $('#physicalAtkInput').value.trim() });
    else if (act.cunningAction) ok = resolveCunningAction({ c, choice: $('#spellSlotSelect').value, d20Raw: $('#physicalAtkInput').value.trim() });
    else if (act.kind === 'spell') ok = resolveSpellAction({ c, name: act.name, target, slotKey: $('#spellSlotSelect').value, d20Raw: $('#physicalAtkInput').value.trim(), valRaw: $('#physicalDmgInput').value.trim() });
    else ok = resolveGenericAction({ c, name: act.name, kind: act.kind, customDice: act.customDice, resRaw: $('#physicalDmgInput').value.trim() });
    if (ok) {
      clearPendingMobileAction();
      closeDialog($('#actionDialog'));
    }
  });
}
