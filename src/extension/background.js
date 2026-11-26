// Background service worker for Ronda DM Chrome Extension (Manifest V3)

const NIVEL20_EXTRACTOR_FILES = [
  'src/extension/nivel20/image-utils.js',
  'src/extension/nivel20/campaign-extractor.js',
  'src/extension/nivel20/sheet-extractor.js',
  'src/extension/nivel20/sync-entry.js'
];

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
});

function focusOrCreateTab(targetUrl, sendResponse) {
  chrome.tabs.query({ url: targetUrl }, tabs => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      chrome.tabs.create({ url: targetUrl });
    }
    sendResponse({ ok: true });
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'RONDA_OPEN_FULL_TAB') {
    focusOrCreateTab(chrome.runtime.getURL('index.html'), sendResponse);
    return true;
  }
  if (message?.type === 'RONDA_OPEN_DM_MAP_TAB') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?view=map') });
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === 'RONDA_OPEN_PLAYER_MAP_TAB') {
    focusOrCreateTab(chrome.runtime.getURL('player-map.html'), sendResponse);
    return true;
  }
  if (message?.type === 'RONDA_OPEN_MOBILE_GUIDE_TAB') {
    chrome.tabs.create({ url: chrome.runtime.getURL('player.html') });
    sendResponse({ ok: true });
    return true;
  }
  if (message?.type === 'RONDA_SYNC_FROM_NIVEL20') {
    syncActiveNivel20Tab(message.tabId)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ ok: false, error: err?.message || 'No se pudo leer la pestaña de Nivel20' }));
    return true;
  }
});

async function resolveNivel20Tab(explicitTabId) {
  if (explicitTabId) {
    const tab = await chrome.tabs.get(explicitTabId).catch(() => null);
    if (tab && /nivel20\.com/i.test(tab.url || '')) return tab;
  }
  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTabs[0] && /nivel20\.com/i.test(activeTabs[0].url || '')) return activeTabs[0];

  const n20Tabs = await chrome.tabs.query({ url: ['https://nivel20.com/*', 'https://*.nivel20.com/*'] });
  return n20Tabs.find(t => /characters|personajes|character/i.test(t.url || '')) || n20Tabs[0] || null;
}

async function syncActiveNivel20Tab(explicitTabId) {
  const targetTab = await resolveNivel20Tab(explicitTabId);
  if (!targetTab || !targetTab.id) {
    return { ok: false, error: 'Abre primero una ficha de personaje en nivel20.com' };
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: targetTab.id },
    files: NIVEL20_EXTRACTOR_FILES
  });

  const extracted = results?.[results.length - 1]?.result;
  if (!extracted || !extracted.ok) {
    return { ok: false, error: extracted?.error || 'No se detectó una ficha o campaña visible en esa pestaña de Nivel20' };
  }

  const characters = extracted.mode === 'campaign'
    ? (extracted.characters || [])
    : (extracted.character ? [extracted.character] : []);

  if (!characters.length) {
    return { ok: false, error: 'No se encontraron personajes visibles para sincronizar.' };
  }

  await chrome.storage.local.set({
    rondaPendingSync: {
      timestamp: Date.now(),
      sourceUrl: targetTab.url,
      mode: extracted.mode || 'single',
      characters
    }
  });

  chrome.runtime.sendMessage({
    type: 'RONDA_CHARACTERS_SYNCED',
    mode: extracted.mode || 'single',
    characters,
    sourceUrl: targetTab.url
  }).catch(() => {});

  return { ok: true, mode: extracted.mode || 'single', characters, sourceUrl: targetTab.url };
}
