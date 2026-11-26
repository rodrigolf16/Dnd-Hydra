import { $, $$, showToast } from '../shared/dom.js';
import {
  consumeLocalMove,
  getSelectedCharacter,
  getTurnResources,
  isLiveConnected,
  pwaState,
  resetLocalTurnTracker
} from './pwa-state.js';

export function wireTurnWizardEvents({ liveClient, getActiveDiceMeta, onRenderApp, onRenderTurn }) {
  const returnToChoices = () => {
    pwaState.selectedMove = null;
    pwaState.waitingForDm = false;
    onRenderApp();
  };
  $('#backToChoicesBtn').addEventListener('click', returnToChoices);
  $('#continueTurnBtn').addEventListener('click', returnToChoices);

  $('#sendMoveBtn').addEventListener('click', () => {
    const c = getSelectedCharacter();
    const move = pwaState.selectedMove;
    if (!c || !move) return;
    if (isLiveConnected()) {
      const diceMeta = getActiveDiceMeta();
      const sent = liveClient.sendPlayerAction({
        characterId: c.id,
        characterName: c.name,
        kind: move.kind,
        attackMode: move.attackMode || 'normal',
        resourceKind: move.resourceKind || 'action',
        title: move.title,
        weaponName: move.weaponName || '',
        spellName: move.spellName || '',
        standardId: move.standardId || '',
        distanceMeters: move.distanceMeters || 0,
        rollMode: pwaState.rollMode,
        critMode: pwaState.critMode,
        classMods: { ...pwaState.classMods },
        diceSummary: diceMeta?.diceSummary || move.preview || '',
        modifiersLabel: diceMeta?.modifiersLabel || ''
      });
      if (sent) {
        pwaState.waitingForDm = true;
        onRenderApp();
        showToast('📤 Movimiento enviado al DM — tirá los dados físicos y cantale el resultado', '#playerToast', 3200);
      }
    } else {
      consumeLocalMove(c, move);
      pwaState.selectedMove = null;
      pwaState.waitingForDm = false;
      onRenderApp();
      showToast(`✓ ${move.title} marcado · revisá tus opciones restantes`, '#playerToast', 2600);
    }
  });

  $('#toggleSpentMovesBtn').addEventListener('click', () => {
    pwaState.showSpentOptions = !pwaState.showSpentOptions;
    onRenderApp();
  });

  $('#endTurnBtn').addEventListener('click', () => {
    const c = getSelectedCharacter();
    if (!c) return;
    if (isLiveConnected()) {
      if (pwaState.livePayload?.activeTurnId !== c.id) {
        showToast('Todavía no es tu turno activo en la mesa', '#playerToast', 2600);
        return;
      }
      if (liveClient.sendEndTurn(c.id, c.name)) {
        pwaState.selectedMove = null;
        pwaState.waitingForDm = false;
        onRenderApp();
        showToast('✓ Fin de turno enviado al DM', '#playerToast', 2600);
      }
    } else {
      resetLocalTurnTracker(c);
      pwaState.selectedMove = null;
      pwaState.waitingForDm = false;
      onRenderApp();
      showToast('✓ Turno finalizado — recursos listos para la próxima ronda', '#playerToast', 2600);
    }
  });

  $$('.seg-btn').forEach(btn => btn.addEventListener('click', () => {
    pwaState.rollMode = btn.dataset.rollMode;
    const c = getSelectedCharacter();
    if (c) onRenderTurn(c, getTurnResources(c));
  }));

  $('#critToggleBtn').addEventListener('click', () => {
    pwaState.critMode = !pwaState.critMode;
    const c = getSelectedCharacter();
    if (c) onRenderTurn(c, getTurnResources(c));
  });
}
