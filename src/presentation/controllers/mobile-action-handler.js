import { STANDARD_ACTIONS } from '../../data/rules/actions.js';
import { byId, emitToast, getState, uiState } from '../../application/store/encounter-store.js';
import { addLog } from '../../application/use-cases/combat-log.js';
import { activateSteadyAim, resolveStandardAction, toggleRage } from '../../application/use-cases/class-actions.js';
import { inspectCombatant, nextTurn } from '../../application/use-cases/turn-flow.js';
import { $ } from '../shared/dom.js';
import { openActionModal } from './action-modal-controller.js';
import { setRollMode, updatePhysicalActionCards } from './action-modal-view.js';
import { openMovementDialog } from './combat-controls-controller.js';

let pendingMobileAction = null;

export function clearPendingMobileAction() {
  pendingMobileAction = null;
  const banner = $('#mobileActionBanner');
  if (banner) banner.hidden = true;
}

function renderMobileActionBanner() {
  const banner = $('#mobileActionBanner');
  if (!banner) return;
  if (!pendingMobileAction) {
    banner.hidden = true;
    return;
  }
  const { characterName, title, diceSummary, modifiersLabel } = pendingMobileAction;
  $('#mobileActionBannerTitle').textContent = `📱 ${characterName} eligió: ${title}`;
  const detailParts = [
    diceSummary ? `Dados físicos: ${diceSummary}` : null,
    modifiersLabel || null,
    'Anota el resultado que sacó en la mesa.'
  ].filter(Boolean);
  $('#mobileActionBannerDetail').textContent = detailParts.join(' · ');
  banner.hidden = false;
}

function applyPreselectedAttackModifiers(act) {
  if (act.weaponName) {
    const idx = uiState.currentWeaponOptions.findIndex(w => w.name === act.weaponName);
    if (idx >= 0) $('#weaponSelect').value = String(idx);
  }
  if (act.rollMode && ['normal', 'advantage', 'disadvantage'].includes(act.rollMode)) {
    setRollMode(act.rollMode);
  }
  if (typeof act.critMode === 'boolean' && !$('#critToggle').hidden) {
    $('#critDamageCheck').checked = act.critMode;
  }
  const m = act.classMods || {};
  if (!$('#dreadToggle').hidden && !$('#dreadDamage').disabled) $('#dreadDamage').checked = !!m.dreadfulStrike;
  if (!$('#sneakToggle').hidden && !$('#sneakDamage').disabled) $('#sneakDamage').checked = !!m.sneakAttack;
  if (!$('#rageDamageToggle').hidden) $('#rageDamageCheck').checked = !!m.rage;
  if (!$('#recklessToggle').hidden && !$('#recklessAttack').disabled) $('#recklessAttack').checked = !!m.reckless;
  if (!$('#frenzyToggle').hidden && !$('#frenzyCheck').disabled) $('#frenzyCheck').checked = !!m.frenzy;
  updatePhysicalActionCards();
}

function openPendingActionForDm() {
  if (!pendingMobileAction) return;
  const act = pendingMobileAction;
  const c = byId(act.characterId);
  if (!c) {
    clearPendingMobileAction();
    return;
  }
  if (getState().viewedId !== c.id) inspectCombatant(c.id);

  if (act.kind === 'attack') {
    openActionModal({ name: act.title || 'Ataque con arma', kind: 'attack', attackMode: act.attackMode || 'normal' });
    applyPreselectedAttackModifiers(act);
    return;
  }
  if (act.kind === 'mark') {
    openActionModal({ name: 'Marca del cazador', kind: 'spell', isMark: true });
    return;
  }
  if (act.kind === 'rage') {
    toggleRage(c);
    clearPendingMobileAction();
    return;
  }
  if (act.kind === 'steadyAim') {
    activateSteadyAim(c);
    clearPendingMobileAction();
    return;
  }
  if (act.kind === 'cunning') {
    openActionModal({ name: 'Acción astuta', kind: 'bonus', cunningAction: true });
    return;
  }
  if (act.kind === 'potion') {
    openActionModal({ name: 'Poción de curación', kind: 'bonus', isPotion: true });
    return;
  }
  if (act.kind === 'movement') {
    openMovementDialog();
    if (act.distanceMeters) $('#movementInput').value = String(act.distanceMeters);
    clearPendingMobileAction();
    return;
  }
  if (act.kind === 'standard') {
    const std = STANDARD_ACTIONS.find(s => s.id === act.standardId);
    if (std) {
      resolveStandardAction(std, cfg => openActionModal(cfg));
      if (std.id !== 'std-hide') clearPendingMobileAction();
    }
    return;
  }
  if (act.kind === 'spell') {
    openActionModal({ name: act.spellName || act.title, kind: 'spell', isMark: /marca del cazador/i.test(act.spellName || act.title) });
    return;
  }
  openActionModal({ name: act.title, kind: act.resourceKind || 'action', isFeature: true });
}

export function handleIncomingMobileMessage(msg, clientInfo) {
  if (!msg || typeof msg !== 'object') return;
  const state = getState();

  if (msg.type === 'PLAYER_ACTION' && msg.action) {
    const act = msg.action;
    const c = byId(act.characterId || clientInfo?.characterId);
    pendingMobileAction = {
      ...act,
      characterId: c?.id || act.characterId || clientInfo?.characterId || '',
      characterName: c?.name || act.characterName || clientInfo?.characterName || 'Jugador'
    };
    renderMobileActionBanner();
    emitToast(`📱 ${pendingMobileAction.characterName} eligió: ${pendingMobileAction.title}`);
    return;
  }

  if (msg.type === 'PLAYER_END_TURN') {
    const cid = msg.characterId || clientInfo?.characterId;
    const c = byId(cid);
    if (!c) return;
    if (state.activeTurnId !== c.id) {
      emitToast(`📱 ${c.name} pulsó Fin de turno, pero no es su turno activo`);
      return;
    }
    clearPendingMobileAction();
    addLog(c.name, 'finaliza su turno desde el celular', 'Avanzando al siguiente combatiente', '✓');
    nextTurn();
  }
}

export function initMobileActionBanner() {
  $('#mobileActionOpenBtn')?.addEventListener('click', openPendingActionForDm);
  $('#mobileActionDismissBtn')?.addEventListener('click', clearPendingMobileAction);
}
