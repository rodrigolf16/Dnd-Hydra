// Final classic script injected by chrome.scripting.executeScript; returns extraction result
(async () => {
  const ns = globalThis.__rondaN20 || {};
  const bodyText = document.body?.innerText || '';

  if (/iniciar sesi[oó]n|reg[ií]strate para poder continuar/i.test(bodyText) && bodyText.length < 1500) {
    return { ok: false, error: 'La pestaña de Nivel20 está en la pantalla de inicio de sesión.' };
  }

  if (typeof ns.extractCampaignCharacters === 'function') {
    const campaignRes = await ns.extractCampaignCharacters();
    if (campaignRes) return campaignRes;
  }

  if (typeof ns.extractSingleSheet === 'function') {
    return ns.extractSingleSheet(bodyText);
  }

  return { ok: false, error: 'No se pudo inicializar el extractor de Nivel20.' };
})();
