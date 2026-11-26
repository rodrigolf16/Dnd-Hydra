// Classic content-script extractor for Nivel20 campaign pages
(() => {
  const ns = (globalThis.__rondaN20 = globalThis.__rondaN20 || {});

  ns.extractCampaignCharacters = async function extractCampaignCharacters() {
    const { clean, findBestImageInRoot, toPermanentAvatar } = ns;
    const isCampaignUrl = /\/campaigns\//i.test(location.pathname);
    const charLinks = [...document.querySelectorAll('a[href*="/characters/"]')];
    if (!isCampaignUrl || charLinks.length < 2) return null;

    const byHref = new Map();
    for (const link of charLinks) {
      const href = link.getAttribute('href') || '';
      if (!/\/characters\/\d+/i.test(href)) continue;
      const key = href.split('?')[0].split('#')[0];

      let container = link;
      for (let i = 0; i < 4 && container.parentElement; i += 1) {
        const parent = container.parentElement;
        if (parent.querySelectorAll('a[href*="/characters/"]').length > 2) break;
        container = parent;
        if (/card|item|character|member|player|row|media|col/i.test(container.className || '')) break;
      }

      const txtName = clean(link.textContent) || clean(container.querySelector('h1, h2, h3, h4, strong, b, .name, [class*="name"]')?.textContent);
      const rawImg = findBestImageInRoot(container, txtName, 9999);

      const prev = byHref.get(key) || { name: '', rawImg: '', text: '' };
      if (txtName && txtName.length >= 2 && txtName.length <= 60 && !prev.name) prev.name = txtName;
      if (rawImg && !prev.rawImg) prev.rawImg = rawImg;
      prev.text = clean(container.innerText || prev.text);
      byHref.set(key, prev);
    }

    const syncedList = [];
    for (const item of byHref.values()) {
      if (!item.name) continue;
      const entry = { name: item.name };
      if (item.rawImg) entry.avatar = await toPermanentAvatar(item.rawImg);
      const hpM = item.text.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
      if (hpM) { entry.hp = parseInt(hpM[1], 10); entry.maxHp = parseInt(hpM[2], 10); }
      const acM = item.text.match(/(?:CA|AC)\s*[:\s]*(\d{1,2})/i);
      if (acM) entry.ac = parseInt(acM[1], 10);
      syncedList.push(entry);
    }

    return syncedList.length ? { ok: true, mode: 'campaign', characters: syncedList } : null;
  };
})();
