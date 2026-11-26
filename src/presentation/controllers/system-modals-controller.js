import { copyToClipboard } from '../../infrastructure/browser/clipboard.js';
import { downloadJsonFile, readJsonFile } from '../../infrastructure/browser/file-io.js';
import {
  isChromeExtension,
  requestNivel20Sync,
  subscribeNivel20Sync
} from '../../infrastructure/extension/chrome-bridge.js';
import { emitToast, getState, saveState, viewed } from '../../application/store/encounter-store.js';
import { buildInitiativeSummaryText } from '../../application/use-cases/combat-log.js';
import {
  applySyncedNivel20Characters,
  importEncounterData,
  resetEncounter
} from '../../application/use-cases/encounter-io.js';
import { $, $$, closeDialog } from '../shared/dom.js';

function syncManualButtons() {
  const enabledList = getState().enabledManuals || [];
  $$('.manual-add[data-manual]').forEach(btn => {
    const enabled = enabledList.includes(btn.dataset.manual);
    btn.textContent = enabled ? '✓ Activo' : '＋ Activar';
    btn.style.opacity = enabled ? '.75' : '1';
  });
}

export function wireSystemModalsEvents() {
  syncManualButtons();

  $$('.manual-add[data-manual]').forEach(btn => btn.addEventListener('click', () => {
    const state = getState();
    const name = btn.dataset.manual;
    if (state.enabledManuals.includes(name)) state.enabledManuals = state.enabledManuals.filter(x => x !== name);
    else state.enabledManuals.push(name);
    saveState();
    syncManualButtons();
  }));

  $('#customManual').addEventListener('click', () => $('#manualFile').click());
  $('#manualFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const d = await readJsonFile(file);
      const items = d.actions || d.acciones || d.features || d.rasgos || [];
      const c = viewed();
      let added = 0;
      items.forEach((item, idx) => {
        const name = typeof item === 'string' ? item : item.name || item.nombre;
        if (!name) return;
        const rawKind = typeof item === 'object' ? (item.kind || item.tipo) : 'action';
        const kind = ['action', 'bonus', 'reaction', 'passive'].includes(rawKind) ? rawKind : 'action';
        c.customActions.push({
          id: `json-${Date.now()}-${idx}`,
          name,
          kind,
          dice: typeof item === 'object' ? (item.dice || item.dados || '') : '',
          description: typeof item === 'object' ? (item.description || item.descripcion || '') : 'Importado desde JSON.'
        });
        added += 1;
      });
      saveState('actions');
      closeDialog($('#manualDialog'));
      emitToast(`${added} opciones guardadas`);
    } catch {
      emitToast('No se pudo leer el archivo JSON');
    }
    e.target.value = '';
  });

  $('#openN20SiteBtn').addEventListener('click', () => {
    window.open($('#n20UrlInput').value.trim() || getState().nivel20.url || 'https://nivel20.com', '_blank', 'noopener,noreferrer');
  });
  $('#copyInitOrderBtn').addEventListener('click', () => {
    copyToClipboard(buildInitiativeSummaryText()).then(ok => ok && emitToast('Orden de iniciativa copiado'));
  });
  $('#saveN20Settings').addEventListener('click', () => {
    getState().nivel20.url = $('#n20UrlInput').value.trim() || 'https://nivel20.com';
    saveState();
    closeDialog($('#nivel20Dialog'));
    emitToast('Enlace guardado');
  });

  $('#skipDefeatedCheck').addEventListener('change', e => {
    getState().skipDefeated = e.target.checked;
    saveState();
  });

  $('#exportEncounterBtn').addEventListener('click', () => {
    const state = getState();
    downloadJsonFile(state, `ronda-dm-r${state.round}.json`);
    emitToast('Encuentro exportado como JSON');
  });

  $('#importEncounterBtn').addEventListener('click', () => $('#encounterFileInput').click());
  $('#encounterFileInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      importEncounterData(await readJsonFile(file));
      closeDialog($('#settingsDialog'));
    } catch {
      emitToast('Archivo JSON inválido');
    }
    e.target.value = '';
  });

  $('#resetEncounterBtn').addEventListener('click', () => {
    if (!confirm('¿Reiniciar todo el encuentro a las fichas iniciales?')) return;
    resetEncounter();
    closeDialog($('#settingsDialog'));
  });

  if (isChromeExtension()) {
    const syncBtn = $('#syncNivel20TabBtn');
    if (syncBtn) {
      syncBtn.hidden = false;
      syncBtn.addEventListener('click', () => {
        emitToast('Leyendo ficha abierta en Nivel20…');
        requestNivel20Sync(res => {
          if (!res?.ok) emitToast(res?.error || 'Abre una ficha de personaje en nivel20.com primero');
        });
      });
    }
    subscribeNivel20Sync(applySyncedNivel20Characters);
  }
}
