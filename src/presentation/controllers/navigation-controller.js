import { copyToClipboard } from '../../infrastructure/browser/clipboard.js';
import { emitToast, getState, notify, uiState } from '../../application/store/encounter-store.js';
import { buildInitiativeSummaryText } from '../../application/use-cases/combat-log.js';
import { toggleEncounterPause } from '../../application/use-cases/turn-flow.js';
import { $, $$, closeDialog, openDialog } from '../shared/dom.js';

export function setMainView(view, onEnterMap) {
  uiState.currentMainView = view === 'map' ? 'map' : 'encounter';
  $('#encounterView').hidden = uiState.currentMainView !== 'encounter';
  $('#mapView').hidden = uiState.currentMainView !== 'map';
  $('#encounterNav').classList.toggle('active', uiState.currentMainView === 'encounter');
  $('#mapNav').classList.toggle('active', uiState.currentMainView === 'map');
  if (uiState.currentMainView === 'map' && onEnterMap) {
    onEnterMap();
  }
}

export function wireNavigationEvents(onEnterMap) {
  $$('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => {
    const d = btn.closest('dialog');
    if (d) closeDialog(d);
  }));

  $('#brandHome').addEventListener('click', e => {
    e.preventDefault();
    setMainView('encounter', onEnterMap);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('#encounterNav').addEventListener('click', () => {
    setMainView('encounter', onEnterMap);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('#mapNav').addEventListener('click', () => setMainView('map', onEnterMap));
  $('#charactersNav').addEventListener('click', () => openDialog($('#importDialog')));

  const openN20Modal = () => {
    $('#n20UrlInput').value = getState().nivel20.url || 'https://nivel20.com';
    openDialog($('#nivel20Dialog'));
  };
  $('#nivel20Nav').addEventListener('click', openN20Modal);
  $('#nivel20TopBtn').addEventListener('click', openN20Modal);
  $('#manualsNav').addEventListener('click', () => openDialog($('#manualDialog')));
  $('#helpBtn').addEventListener('click', () => openDialog($('#helpDialog')));

  const openSettings = () => {
    $('#skipDefeatedCheck').checked = !!getState().skipDefeated;
    openDialog($('#settingsDialog'));
  };
  $('#settingsBtnTop').addEventListener('click', openSettings);
  $('#campaignBtn').addEventListener('click', openSettings);
  $('#userOptionsBtn').addEventListener('click', openSettings);

  $('#shareBtn').addEventListener('click', () => {
    copyToClipboard(buildInitiativeSummaryText()).then(ok => ok && emitToast('Resumen de iniciativa copiado'));
  });
  $('#finishBtn').addEventListener('click', toggleEncounterPause);

  $('#swapInitiativeBtn').addEventListener('click', () => {
    uiState.swapMode = !uiState.swapMode;
    uiState.swapFirstId = null;
    $('#swapBannerText').textContent = 'Haz clic en el primer combatiente en la barra de iniciativa y luego en el segundo para intercambiar sus puestos.';
    notify('headerAndInit');
  });
  $('#cancelSwapBtn').addEventListener('click', () => {
    uiState.swapMode = false;
    uiState.swapFirstId = null;
    notify('headerAndInit');
  });

  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if ($$('dialog[open]').length) return;
    if (e.key === '1') setMainView('encounter', onEnterMap);
    if (e.key === '2') setMainView('map', onEnterMap);
  });
}
