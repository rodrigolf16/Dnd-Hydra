import { formatMeters } from '../../domain/shared/formatters.js';
import { copyToClipboard } from '../../infrastructure/browser/clipboard.js';
import { exportPortraitFile } from '../../infrastructure/browser/file-io.js';
import { byId, emitToast, getState, uiState, viewed } from '../../application/store/encounter-store.js';
import { buildLogSummaryText, clearCombatLog } from '../../application/use-cases/combat-log.js';
import { adjustHp, setExactHp } from '../../application/use-cases/hp-actions.js';
import {
  advanceToTurn,
  applyAllInitiatives,
  inspectCombatant,
  nextTurn,
  recordMovement,
  recoverUses,
  resetMovement,
  restoreTurnResources
} from '../../application/use-cases/turn-flow.js';
import { addCustomAction, addLimitedUseCounter } from '../../application/use-cases/class-actions.js';
import {
  clearPhysicalDicePool,
  decrementPoolDie,
  incrementPoolDie,
  loadFormulaIntoPool,
  recordPhysicalPoolRoll,
  setPoolModifier
} from '../../application/use-cases/dice-pool.js';
import { $, $$, closeDialog, openDialog } from '../shared/dom.js';
import {
  openCharacterSheetDialog,
  openInitiativeEditorDialog,
  syncInitInputsToState
} from '../renderers/sheet-init-renderer.js';

export function openMovementDialog() {
  const c = viewed();
  $('#movementDesc').textContent = `${c.name}: quedan ${formatMeters(c.turnMovement)} m de ${formatMeters(c.speed || 0)} m disponibles.`;
  $('#movementInput').value = c.turnMovement > 0 ? String(Math.min(3, c.turnMovement)) : '0';
  $('#positionInput').value = '';
  openDialog($('#movementDialog'));
}

export function openHpDialog(targetId) {
  const c = byId(targetId);
  if (!c) return;
  uiState.hpDialogTargetId = targetId;
  $('#hpDialogTitle').textContent = `PG de ${c.name} (${c.hp}/${c.maxHp})`;
  $('#hpDeltaInput').value = '5';
  $('#hpDeltaType').value = 'damage';
  $('#hpDeltaReason').value = '';
  openDialog($('#hpDialog'));
}

export function wireCombatControlsEvents() {
  $('#returnToActiveTurn').addEventListener('click', () => inspectCombatant(getState().activeTurnId));
  $('#setAsActiveTurn').addEventListener('click', () => advanceToTurn(viewed().id, { log: true, restore: true }));

  const handleExportPortrait = () => {
    const c = viewed();
    if (!exportPortraitFile(c)) emitToast(`${c?.name || 'Combatiente'} no tiene imagen asignada`);
    else emitToast(`Exportando retrato de ${c.name}`);
  };
  $('#exportPortraitBtn').addEventListener('click', handleExportPortrait);
  $('#exportPortraitFromSheetBtn').addEventListener('click', handleExportPortrait);
  $('#sheetDetails').addEventListener('click', openCharacterSheetDialog);
  $('#manageFeatures').addEventListener('click', openCharacterSheetDialog);

  $('#hpMinus5').addEventListener('click', () => adjustHp(viewed(), -5, 'Ajuste DM'));
  $('#hpMinus1').addEventListener('click', () => adjustHp(viewed(), -1, 'Ajuste DM'));
  $('#hpPlus1').addEventListener('click', () => adjustHp(viewed(), 1, 'Curación DM'));
  $('#hpPlus5').addEventListener('click', () => adjustHp(viewed(), 5, 'Curación DM'));
  $('#hpCustomBtn').addEventListener('click', () => openHpDialog(viewed().id));
  $('#applyHpDelta').addEventListener('click', () => {
    const c = byId(uiState.hpDialogTargetId);
    if (!c) return;
    const amount = Math.max(0, parseInt($('#hpDeltaInput').value, 10) || 0);
    const type = $('#hpDeltaType').value;
    const reason = $('#hpDeltaReason').value.trim();
    if (type === 'damage') adjustHp(c, -amount, reason);
    else if (type === 'heal') adjustHp(c, amount, reason);
    else setExactHp(c, amount, reason);
    closeDialog($('#hpDialog'));
  });

  $('#resetTurnResourcesBtn').addEventListener('click', restoreTurnResources);

  $$('.quick-dist-row button[data-dist]').forEach(btn => btn.addEventListener('click', () => { $('#movementInput').value = btn.dataset.dist; }));
  $('#moveAllBtn').addEventListener('click', () => { $('#movementInput').value = formatMeters(viewed().turnMovement); });
  $('#resetMovementBtn').addEventListener('click', () => { resetMovement(); closeDialog($('#movementDialog')); });
  $('#saveMovement').addEventListener('click', () => {
    const distance = Math.max(0, parseFloat(String($('#movementInput').value).replace(',', '.')) || 0);
    recordMovement(distance, $('#positionInput').value.trim());
    closeDialog($('#movementDialog'));
  });

  $$('.die-pick').forEach(btn => {
    const sides = Number(btn.dataset.die);
    btn.addEventListener('click', () => incrementPoolDie(sides));
    btn.addEventListener('contextmenu', e => { e.preventDefault(); decrementPoolDie(sides); });
  });
  $('#plusMod').addEventListener('click', () => setPoolModifier(uiState.poolModifier + 1));
  $('#minusMod').addEventListener('click', () => setPoolModifier(uiState.poolModifier - 1));
  $('#modifier').addEventListener('change', e => setPoolModifier(parseInt(e.target.value, 10) || 0));
  $('#clearDicePoolBtn').addEventListener('click', clearPhysicalDicePool);
  $('#copyPoolFormulaBtn').addEventListener('click', () => copyToClipboard($('#poolFormulaDisplay').textContent).then(ok => ok && emitToast(`Copiado: ${$('#poolFormulaDisplay').textContent}`)));
  $('#loadCustomDice').addEventListener('click', () => { if (loadFormulaIntoPool($('#customDice').value)) $('#customDice').value = ''; });
  $('#customDice').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (loadFormulaIntoPool($('#customDice').value)) $('#customDice').value = ''; } });

  const submitPool = mode => {
    const noteEl = $('#physicalResultNote');
    if (recordPhysicalPoolRoll($('#physicalResultInput').value, mode, noteEl ? noteEl.value.trim() : '')) {
      $('#physicalResultInput').value = '';
      if (noteEl) noteEl.value = '';
    }
  };
  $('#recordPhysicalRollBtn').addEventListener('click', () => submitPool('log'));
  $('#applyPhysicalDamageBtn').addEventListener('click', () => submitPool('damage'));
  $('#applyPhysicalHealBtn').addEventListener('click', () => submitPool('heal'));
  $('#physicalResultInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submitPool('log'); } });

  $('#customAction').addEventListener('click', () => {
    $('#customActionName').value = ''; $('#customActionKind').value = 'action';
    $('#customActionDice').value = ''; $('#customActionDesc').value = '';
    openDialog($('#customActionDialog'));
  });
  $('#saveCustomAction').addEventListener('click', () => {
    const name = $('#customActionName').value.trim();
    if (!name) { emitToast('Escribe un nombre'); return; }
    addCustomAction({ name, kind: $('#customActionKind').value, dice: $('#customActionDice').value.trim(), description: $('#customActionDesc').value.trim() });
    closeDialog($('#customActionDialog'));
  });

  $('#addUseCounter').addEventListener('click', () => {
    $('#useName').value = ''; $('#useMax').value = '3'; $('#useReset').value = 'long';
    openDialog($('#usesDialog'));
  });
  $('#saveUseCounter').addEventListener('click', () => {
    const name = $('#useName').value.trim();
    if (!name) { emitToast('Escribe el nombre'); return; }
    addLimitedUseCounter({ name, max: Math.max(1, parseInt($('#useMax').value, 10) || 1), reset: $('#useReset').value });
    closeDialog($('#usesDialog'));
  });
  $('#shortRest').addEventListener('click', () => recoverUses('short'));
  $('#longRest').addEventListener('click', () => recoverUses('long'));

  $('#nextTurn').addEventListener('click', nextTurn);
  $('#editInitiativeBtn').addEventListener('click', openInitiativeEditorDialog);
  $('#editInitiative').addEventListener('click', openInitiativeEditorDialog);
  $('#saveAllInitiatives').addEventListener('click', () => {
    syncInitInputsToState();
    applyAllInitiatives();
    closeDialog($('#initiativeDialog'));
  });

  $('#copyLogBtn').addEventListener('click', () => copyToClipboard(buildLogSummaryText()).then(ok => ok && emitToast('Historial copiado')));
  $('#clearLog').addEventListener('click', clearCombatLog);
}
