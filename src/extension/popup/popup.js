const statusEl = document.getElementById('statusMsg');
const hintEl = document.getElementById('tabHint');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('err', isError);
}

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  const tab = tabs?.[0];
  if (tab && /nivel20\.com/i.test(tab.url || '')) {
    hintEl.innerHTML = 'Pestaña de <b>Nivel20</b> detectada. Pulsa el botón para actualizar el personaje abierto en Ronda:';
  }
});

document.getElementById('openSidePanel').addEventListener('click', async () => {
  try {
    const win = await chrome.windows.getCurrent();
    await chrome.sidePanel.open({ windowId: win.id });
    window.close();
  } catch (err) {
    setStatus('No se pudo abrir el Panel Lateral: ' + (err?.message || ''), true);
  }
});

document.getElementById('openFullTab').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'RONDA_OPEN_FULL_TAB' }, () => window.close());
});

document.getElementById('openDmMapPopupBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'RONDA_OPEN_DM_MAP_TAB' }, () => window.close());
});

document.getElementById('openPlayerMapPopupBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'RONDA_OPEN_PLAYER_MAP_TAB' }, () => window.close());
});

document.getElementById('openMobileGuidePopupBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'RONDA_OPEN_MOBILE_GUIDE_TAB' }, () => window.close());
});

document.getElementById('syncBtn').addEventListener('click', async () => {
  setStatus('Leyendo ficha abierta en Nivel20…');
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.runtime.sendMessage(
    { type: 'RONDA_SYNC_FROM_NIVEL20', tabId: activeTab?.id },
    res => {
      if (chrome.runtime.lastError) {
        setStatus(chrome.runtime.lastError.message, true);
        return;
      }
      if (res?.ok && Array.isArray(res.characters) && res.characters.length) {
        if (res.mode === 'campaign' && res.characters.length > 1) {
          const withImgs = res.characters.filter(c => c.avatar).length;
          setStatus(`✓ ${res.characters.length} personajes sincronizados desde la campaña (${withImgs} retratos reales de Nivel20).`);
        } else {
          const c = res.characters[0];
          const bits = [c.hp != null ? `PG ${c.hp}/${c.maxHp}` : null, c.ac != null ? `CA ${c.ac}` : null, c.avatar ? 'retrato de Nivel20' : null].filter(Boolean);
          setStatus(`✓ ${c.name} sincronizado (${bits.join(' · ') || 'datos actualizados'}).`);
        }
      } else {
        setStatus(res?.error || 'No se pudo sincronizar la ficha.', true);
      }
    }
  );
});
