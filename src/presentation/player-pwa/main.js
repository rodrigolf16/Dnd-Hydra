import { getAbilityMod, getSkillBonus } from '../../domain/combat/combatant-stats.js';
import { hasFeature } from '../../domain/combat/combatant-features.js';
import { normalizeRoomCode } from '../../domain/sync/player-payload.js';
import {
  loadCachedSyncPayload,
  loadLastRoomCode,
  loadSelectedCharId,
  saveLastRoomCode,
  saveSelectedCharId
} from '../../infrastructure/storage/player-pwa-storage.js';
import { $, $$, showToast } from '../shared/dom.js';
import { mountPlayerApp } from './templates/mount-player-app.js';
import {
  getAllCharacters,
  getLocalTracker,
  getSelectedCharacter,
  getTurnResources,
  isLiveConnected,
  persistLocalTrackers,
  pwaState,
  resetLocalTurnTracker
} from './pwa-state.js';
import { renderPicker, showScreen } from './picker-renderer.js';
import { renderPlayerHeaderAndVitals } from './header-vitals-renderer.js';
import { renderActiveMovePanel } from './turn-active-move-renderer.js';
import { renderTurnChooser } from './turn-chooser-renderer.js';
import { wireTurnWizardEvents } from './turn-wizard-controller.js';
import { renderSpellsTab } from './spells-tab-renderer.js';
import { renderChecksTab, renderSheetTab, renderSpotlight } from './checks-sheet-renderer.js';
import { initPlayerSyncController, updateSyncBadges } from './sync-controller.js';

mountPlayerApp();

let lastActiveDiceMeta = null;

function renderTurnTab(c, res) {
  renderTurnChooser(c, res, move => {
    pwaState.selectedMove = move;
    pwaState.waitingForDm = false;
    renderTurnTab(c, res);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  lastActiveDiceMeta = renderActiveMovePanel(c, () => renderTurnTab(c, res));
}

function renderPlayerApp() {
  const c = getSelectedCharacter();
  if (!c) {
    showScreen('picker');
    renderPicker(selectCharacter);
    return;
  }
  const res = getTurnResources(c);
  renderPlayerHeaderAndVitals(c, res);
  renderTurnTab(c, res);
  renderSpellsTab(c);
  renderChecksTab(c);
  renderSheetTab(c);
}

function selectCharacter(id) {
  pwaState.selectedCharId = id;
  pwaState.selectedMove = null;
  pwaState.waitingForDm = false;
  saveSelectedCharId(id);
  const c = getSelectedCharacter();
  if (c) {
    pwaState.classMods = {
      huntersMark: !!c.markedTargetName,
      dreadfulStrike: false,
      rage: !!c.raging,
      reckless: !!c.turnRecklessActive,
      frenzy: !!(c.raging && c.turnRecklessActive),
      sneakAttack: hasFeature(c, /ataque furtivo/i),
      steadyAim: !!c.steadyAimActive
    };
    pwaState.rollMode = (c.turnRecklessActive || c.steadyAimActive) ? 'advantage' : 'normal';
    pwaState.critMode = false;
    const perc = getSkillBonus(c, 'Percepción') ?? c.perception ?? getAbilityMod(c, 'Sab');
    pwaState.selectedCheck = { label: 'Percepción', bonus: perc, kind: 'Habilidad' };
  }
  pwaState.liveClient?.sendHello();
  showScreen('player');
  renderPlayerApp();
}

const liveClient = initPlayerSyncController({
  onRenderApp: renderPlayerApp,
  onRenderPicker: () => renderPicker(selectCharacter)
});

wireTurnWizardEvents({
  liveClient,
  getActiveDiceMeta: () => lastActiveDiceMeta,
  onRenderApp: renderPlayerApp,
  onRenderTurn: renderTurnTab
});

$('#switchCharBtn').addEventListener('click', () => {
  showScreen('picker');
  renderPicker(selectCharacter);
});

$$('.nav-tab').forEach(btn => btn.addEventListener('click', () => {
  pwaState.activeTab = btn.dataset.tab;
  $$('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === pwaState.activeTab));
  $$('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === pwaState.activeTab));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}));

$$('.res-chip').forEach(btn => btn.addEventListener('click', () => {
  const c = getSelectedCharacter();
  if (!c) return;
  if (isLiveConnected()) {
    showToast('Estos recursos se actualizan en vivo desde el panel del DM', '#playerToast', 2800);
    return;
  }
  const loc = getLocalTracker(c);
  const k = btn.dataset.res;
  loc[k] = !loc[k];
  if (k === 'action') loc.attacksRemaining = loc.action ? loc.maxAttacks : 0;
  if (k === 'movement') loc.movementMeters = loc.movement ? (Number(c.speed) || 9) : 0;
  persistLocalTrackers();
  renderPlayerApp();
}));

$('#resetLocalTurnBtn').addEventListener('click', () => {
  const c = getSelectedCharacter();
  if (!c) return;
  resetLocalTurnTracker(c);
  pwaState.selectedMove = null;
  renderPlayerApp();
  showToast('Recursos restaurados para tu nuevo turno', '#playerToast', 2800);
});

$$('.filter-chip').forEach(btn => btn.addEventListener('click', () => {
  pwaState.spellFilter = btn.dataset.spellFilter;
  const c = getSelectedCharacter();
  if (c) renderSpellsTab(c);
}));

$$('.mini-seg-btn').forEach(btn => btn.addEventListener('click', () => {
  pwaState.checkMode = btn.dataset.checkMode;
  renderSpotlight();
}));

$('#skillSearch').addEventListener('input', () => {
  const c = getSelectedCharacter();
  if (c) renderChecksTab(c);
});

if ('serviceWorker' in navigator && /^https?:$/i.test(location.protocol)) {
  navigator.serviceWorker.register('./player-sw.js').catch(() => {});
}

const cached = loadCachedSyncPayload();
if (cached && Array.isArray(cached.characters) && cached.characters.length) pwaState.livePayload = cached;

const params = new URLSearchParams(location.search);
const urlRoom = normalizeRoomCode(params.get('room') || params.get('sala') || '');
const savedChar = params.get('char') || loadSelectedCharId();

if (savedChar && getAllCharacters().some(c => c.id === savedChar)) selectCharacter(savedChar);
else { showScreen('picker'); renderPicker(selectCharacter); }

if (urlRoom) {
  $('#roomCodeInput').value = urlRoom;
  saveLastRoomCode(urlRoom);
  liveClient.connect(urlRoom);
} else {
  const lastRoom = loadLastRoomCode();
  if (lastRoom) $('#roomCodeInput').value = lastRoom;
  updateSyncBadges({ status: 'offline', roomCode: '', error: '' });
}
