import { CAMPAIGN } from '../../data/campaign/index.js';
import {
  activeTurnCombatant,
  getState,
  isViewingActiveTurn,
  uiState,
  viewed
} from '../../application/store/encounter-store.js';
import { $ } from '../shared/dom.js';

export function renderTopAndSidebar() {
  const state = getState();
  $('#campaignTitle').textContent = CAMPAIGN.name;
  $('#breadcrumbName').textContent = CAMPAIGN.name;
  $('#campaignSidebarName').textContent = CAMPAIGN.name;
  $('#encounterStatusLabel').textContent = state.paused ? 'ENCUENTRO EN PAUSA' : 'ENCUENTRO EN CURSO';
  $('#liveDot').classList.toggle('paused', !!state.paused);
  $('#finishBtn').innerHTML = state.paused ? '▶ <span>Reanudar encuentro</span>' : 'Ⅱ <span>Pausar encuentro</span>';
  $('#roundLabel').textContent = `RONDA ${state.round}`;
  $('#eyebrowRound').textContent = `RONDA ${state.round}`;
  $('#swapInitiativeBtn').classList.toggle('active-swap', uiState.swapMode);
  $('#swapBanner').hidden = !uiState.swapMode;
}

export function renderInspectBanner() {
  const banner = $('#inspectBanner');
  const viewingActive = isViewingActiveTurn();
  banner.hidden = viewingActive;
  if (!viewingActive) {
    $('#inspectBannerDetail').textContent = `Estás viendo a ${viewed().name}, pero el turno actual es de ${activeTurnCombatant().name}. Puedes registrar su Reacción o ajustar PG sin alterar el orden.`;
  }
}
