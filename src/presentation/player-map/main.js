import { ENCOUNTER_STORAGE_KEY } from '../../infrastructure/storage/constants.js';
import { readRawEncounterState, restoreChromeLiveState } from '../../infrastructure/storage/state-storage.js';
import { createVttChannel } from '../../infrastructure/storage/vtt-channel.js';
import { createPlayerCamera } from './camera-controller.js';
import { renderPlayerMap } from './player-map-renderer.js';
import { updateTurnsPanelVisibility } from './turns-sidebar-renderer.js';

let state = null;
let turnsMode = 'auto';

const updateTurnsVis = (refit = true) => {
  updateTurnsPanelVisibility(state, turnsMode, camera.isUserMoved(), () => camera.fitCamera(), refit);
};

const camera = createPlayerCamera(() => state, updateTurnsVis);

const render = () => renderPlayerMap(state, camera, updateTurnsVis);

function loadStateFromStorage() {
  state = readRawEncounterState();
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    restoreChromeLiveState(st => {
      state = st;
      render();
    });
  }
  render();
}

const channel = createVttChannel();
channel.subscribe(msg => {
  if (!msg) return;
  if (msg.type === 'STATE_UPDATE' && msg.state) {
    state = msg.state;
    render();
  } else if (msg.type === 'SYNC_CAMERA' && msg.camera) {
    camera.syncFromDm(msg.camera);
  } else if (msg.type === 'FIT_CAMERA') {
    camera.resetFit();
  }
});
channel.post({ type: 'REQUEST_STATE' });

window.addEventListener('storage', e => {
  if (e.key === ENCOUNTER_STORAGE_KEY) loadStateFromStorage();
});

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.rondaLiveState?.newValue) {
      state = changes.rondaLiveState.newValue;
      render();
    } else if (changes.rondaMapBgImage && state?.map) {
      state.map.bgImage = changes.rondaMapBgImage.newValue || '';
      render();
    }
  });
}

camera.wireControls(() => {
  turnsMode = turnsMode === 'auto' ? 'show' : turnsMode === 'show' ? 'hide' : 'auto';
  updateTurnsVis(true);
});

loadStateFromStorage();
