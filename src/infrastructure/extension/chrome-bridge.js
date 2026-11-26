export function isChromeExtension() {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}

export function openPlayerMapTab() {
  if (isChromeExtension()) {
    chrome.runtime.sendMessage({ type: 'RONDA_OPEN_PLAYER_MAP_TAB' });
  } else {
    window.open('player-map.html', '_blank');
  }
}

export function openDmMapTab() {
  if (isChromeExtension()) {
    chrome.runtime.sendMessage({ type: 'RONDA_OPEN_DM_MAP_TAB' });
  } else {
    window.open('index.html?view=map', '_blank');
  }
}

export function openMobileGuidePreview(roomCode) {
  const localPath = `player.html?room=${encodeURIComponent(roomCode || '')}`;
  const url = isChromeExtension() ? chrome.runtime.getURL(localPath) : localPath;
  window.open(url, '_blank', 'width=430,height=840');
}

export function requestNivel20Sync(onResult) {
  if (!isChromeExtension()) return;
  chrome.runtime.sendMessage({ type: 'RONDA_SYNC_FROM_NIVEL20' }, res => {
    if (chrome.runtime.lastError) {
      onResult({ ok: false, error: chrome.runtime.lastError.message });
      return;
    }
    onResult(res || { ok: false, error: 'Abre una ficha de personaje en nivel20.com primero' });
  });
}

export function subscribeNivel20Sync(onCharacters) {
  if (!isChromeExtension()) return;
  chrome.runtime.onMessage.addListener(msg => {
    if (msg?.type === 'RONDA_CHARACTERS_SYNCED' && Array.isArray(msg.characters)) {
      onCharacters(msg.characters);
      chrome.storage.local.remove('rondaPendingSync').catch(() => {});
    }
  });
  chrome.storage.local.get('rondaPendingSync', data => {
    const pending = data?.rondaPendingSync;
    if (pending?.characters?.length) {
      onCharacters(pending.characters);
      chrome.storage.local.remove('rondaPendingSync').catch(() => {});
    }
  });
}
