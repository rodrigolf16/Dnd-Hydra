import {
  initStoreSync,
  subscribe,
  subscribeToast,
  uiState,
  viewed
} from '../application/store/encounter-store.js';
import { showToast } from './shared/dom.js';
import { mountDmApp } from './templates/mount-dm-app.js';
import { renderInspectBanner, renderTopAndSidebar } from './renderers/header-renderer.js';
import { renderInitiative } from './renderers/initiative-renderer.js';
import { renderCharacter } from './renderers/character-renderer.js';
import { renderConditionBadges } from './renderers/turn-status-renderer.js';
import { renderActionGroups } from './renderers/action-groups-renderer.js';
import { renderTargets } from './renderers/targets-renderer.js';
import { renderLimitedUses, renderLog } from './renderers/uses-log-renderer.js';
import { renderPhysicalDicePool } from './renderers/dice-pool-renderer.js';
import { openActionModal, openSpellPicker, wireActionModalEvents } from './controllers/action-modal-controller.js';
import { setMainView, wireNavigationEvents } from './controllers/navigation-controller.js';
import { openHpDialog, openMovementDialog, wireCombatControlsEvents } from './controllers/combat-controls-controller.js';
import { wireCombatantModalsEvents } from './controllers/combatant-modals-controller.js';
import { wireSystemModalsEvents } from './controllers/system-modals-controller.js';
import { initMobileSyncController } from './controllers/mobile-sync-controller.js';
import { renderMapView } from './map/dm-map-renderer.js';
import { fitMapToViewport, syncBgTransformVisual } from './map/dm-map-viewport.js';
import { initDmMapController } from './map/dm-map-controller.js';

mountDmApp();

const actionHandlers = {
  openMovement: openMovementDialog,
  openActionModal,
  openSpellPicker
};

function renderAll() {
  renderTopAndSidebar();
  renderInitiative();
  renderInspectBanner();
  renderCharacter(c => renderActionGroups(c, actionHandlers));
  renderTargets(openHpDialog);
  renderLimitedUses();
  renderLog();
  renderPhysicalDicePool();
  if (uiState.currentMainView === 'map') renderMapView();
}

function handleStoreUpdate(scope) {
  if (scope === 'all') { renderAll(); return; }
  if (scope === 'header') { renderTopAndSidebar(); return; }
  if (scope === 'headerAndInit') { renderTopAndSidebar(); renderInitiative(); return; }
  if (scope === 'initiative') { renderInitiative(); return; }
  if (scope === 'character') { renderCharacter(c => renderActionGroups(c, actionHandlers)); return; }
  if (scope === 'actions') { renderActionGroups(viewed(), actionHandlers); return; }
  if (scope === 'targets') { renderTargets(openHpDialog); return; }
  if (scope === 'uses') { renderLimitedUses(); return; }
  if (scope === 'usesAndActions') { renderLimitedUses(); renderActionGroups(viewed(), actionHandlers); return; }
  if (scope === 'log') { renderLog(); return; }
  if (scope === 'dicePool') { renderPhysicalDicePool(); return; }
  if (scope === 'map') { renderMapView(); renderConditionBadges(viewed()); return; }
  if (scope === 'mapBg') { syncBgTransformVisual(); return; }
  renderAll();
}

const onEnterMapView = () => {
  renderMapView();
  if (!uiState.mapInitializedView) {
    uiState.mapInitializedView = true;
    requestAnimationFrame(() => fitMapToViewport());
  }
};

subscribe(handleStoreUpdate);
subscribeToast(msg => showToast(msg, '#toast'));

wireNavigationEvents(onEnterMapView);
wireCombatControlsEvents();
wireActionModalEvents();
wireCombatantModalsEvents();
wireSystemModalsEvents();
initDmMapController();
initMobileSyncController();
initStoreSync();

renderAll();
if (new URLSearchParams(location.search).get('view') === 'map') {
  setMainView('map', onEnterMapView);
}
