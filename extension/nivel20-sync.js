// Runs inside the user's open, already-authenticated nivel20.com tab when the user clicks "Sincronizar"
(async () => {
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const bodyText = document.body?.innerText || '';

  if (/iniciar sesi[oó]n|reg[ií]strate para poder continuar/i.test(bodyText) && bodyText.length < 1500) {
    return { ok: false, error: 'La pestaña de Nivel20 está en la pantalla de inicio de sesión.' };
  }

  function extractBgUrl(el) {
    try {
      const bg = getComputedStyle(el).backgroundImage || '';
      const m = bg.match(/url\(["']?([^"')]+)["']?\)/i);
      return m ? m[1] : '';
    } catch {
      return '';
    }
  }

  function isIgnoredImageUrl(src) {
    if (!src) return true;
    return /^data:image\/svg|logo|favicon|sprite|spinner|loading|google|recaptcha|facebook|twitter|discord|patreon|icon[_-]/i.test(src);
  }

  // Convert an image URL to a compact 256x256 JPEG data URL so it never expires and works offline.
  // Falls back to the direct URL if cross-origin CDN blocks canvas/fetch.
  async function toPermanentAvatar(url) {
    if (!url || url.startsWith('data:image/')) return url;
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return url;
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) return url;
      const bitmap = await createImageBitmap(blob);
      const maxDim = 256;
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      return canvas.toDataURL('image/jpeg', 0.86);
    } catch {
      return url;
    }
  }

  function findBestImageInRoot(root, charName = '', limitTop = 700) {
    const candidates = [];
    const normName = clean(charName).toLowerCase();

    root.querySelectorAll('img').forEach(img => {
      const src = img.currentSrc || img.src || '';
      if (isIgnoredImageUrl(src)) return;
      const rect = img.getBoundingClientRect();
      if (rect.width < 28 || rect.height < 28) return;
      // Ignore tiny top-right user navbar avatar when scanning full document
      if (root === document && rect.top < 64 && rect.width <= 42 && rect.right > window.innerWidth - 260) return;

      let score = 0;
      const alt = clean(img.alt).toLowerCase();
      const cls = `${img.className || ''} ${img.parentElement?.className || ''}`.toLowerCase();
      if (normName && alt && (alt.includes(normName) || normName.includes(alt))) score += 70;
      if (/character|avatar|portrait|profile|sheet|ficha|token|image|photo/i.test(cls)) score += 35;
      if (/active_storage|blobs|uploads|cloudinary|s3|cloudfront|avatar|character|portrait/i.test(src)) score += 40;
      if (rect.width >= 56 && rect.height >= 56) score += 20;
      if (root === document && rect.top >= 0 && rect.top < limitTop) score += 15;
      const ratio = rect.width / Math.max(1, rect.height);
      if (ratio >= 0.55 && ratio <= 1.8) score += 15;
      candidates.push({ src, score });
    });

    root.querySelectorAll('div, span, a, figure').forEach(el => {
      const cls = `${el.className || ''}`.toLowerCase();
      const styleAttr = el.getAttribute('style') || '';
      if (!styleAttr.includes('background') && !/avatar|portrait|image|photo|thumb|character|token|pic/i.test(cls)) return;
      const src = extractBgUrl(el);
      if (isIgnoredImageUrl(src)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 28 || rect.height < 28) return;
      if (root === document && rect.top < 64 && rect.width <= 42 && rect.right > window.innerWidth - 260) return;

      let score = 15;
      if (/character|avatar|portrait|profile|token|thumb/i.test(cls)) score += 40;
      if (/active_storage|blobs|uploads|cloudinary|s3|cloudfront|avatar|character/i.test(src)) score += 40;
      if (rect.width >= 48 && rect.height >= 48) score += 20;
      if (root === document && rect.top >= 0 && rect.top < limitTop) score += 15;
      candidates.push({ src, score });
    });

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.src || '';
  }

  // =========================================================================
  // CASE A: CAMPAIGN PAGE (sync ALL visible character portraits & basic stats!)
  // =========================================================================
  const isCampaignUrl = /\/campaigns\//i.test(location.pathname);
  const charLinks = [...document.querySelectorAll('a[href*="/characters/"]')];

  if (isCampaignUrl && charLinks.length >= 2) {
    const byHref = new Map();
    for (const link of charLinks) {
      const href = link.getAttribute('href') || '';
      if (!/\/characters\/\d+/i.test(href)) continue;
      const key = href.split('?')[0].split('#')[0];

      // Walk up to find the card/row container holding both name and avatar
      let container = link;
      for (let i = 0; i < 4 && container.parentElement; i++) {
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

    if (syncedList.length) {
      return { ok: true, mode: 'campaign', characters: syncedList };
    }
  }

  // =========================================================================
  // CASE B: SINGLE CHARACTER SHEET PAGE
  // =========================================================================
  const nameCandidates = [
    document.querySelector('h1.character-name, .character-header h1, .character-name h1, h1'),
    document.querySelector('[class*="character"] h1, [class*="character"] h2')
  ].filter(Boolean);

  let name = '';
  for (const el of nameCandidates) {
    const txt = clean(el.textContent);
    if (txt && txt.length >= 2 && txt.length <= 60 && !/nivel20|campa[ñn]a/i.test(txt)) {
      name = txt;
      break;
    }
  }
  if (!name) {
    const titlePart = clean(document.title.split('|')[0].split('—')[0].split('-')[0]);
    if (titlePart && !/nivel20/i.test(titlePart)) name = titlePart;
  }
  if (!name) {
    return { ok: false, error: 'Abre la página de campaña o la hoja de un personaje en nivel20.com y vuelve a intentar.' };
  }

  const rawAvatar = findBestImageInRoot(document, name, 650);
  const avatar = rawAvatar ? await toPermanentAvatar(rawAvatar) : '';

  let level = null;
  let className = '';
  let species = '';
  const lvlMatch = bodyText.match(/(?:nivel|nv\.?)\s*(\d{1,2})/i) ||
    bodyText.match(/(?:Explorador|Mago|B[aá]rbaro|Bardo|P[ií]caro|Druida|Guerrero|Cl[eé]rigo|Palad[ií]n|Monje|Hechicero|Brujo|Art[ií]fice)\s+(\d{1,2})/i);
  if (lvlMatch) level = Math.max(1, Math.min(20, parseInt(lvlMatch[1], 10)));

  const classMatch = bodyText.match(/((?:Explorador|Mago|B[aá]rbaro|Bardo|P[ií]caro|Druida|Guerrero|Cl[eé]rigo|Palad[ií]n|Monje|Hechicero|Brujo|Art[ií]fice)[^\n]{0,45})/i);
  if (classMatch) className = clean(classMatch[1]);

  const speciesMatch = bodyText.match(/(Elfo de los bosques|Alto elfo|Semielfo[^\n,]{0,30}|Gigante de fuego|Goliat|Mediano|Infernal|Tiefling|Humano|Enano|Drac[oó]nido|Gnomo|Orco|Aasimar)/i);
  if (speciesMatch) species = clean(speciesMatch[1]);

  let hp = null, maxHp = null;
  const hpMatch = bodyText.match(/(?:Puntos de golpe|PG|HP)\s*[:\n]?\s*(\d{1,3})\s*\/\s*(\d{1,3})/i) ||
    bodyText.match(/(\d{1,3})\s*\/\s*(\d{1,3})\s*(?:PG|HP|Puntos de golpe)/i);
  if (hpMatch) { hp = parseInt(hpMatch[1], 10); maxHp = parseInt(hpMatch[2], 10); }

  let ac = null;
  const acMatch = bodyText.match(/(?:Clase de armadura|CA|AC)\s*[:\n]?\s*(\d{1,2})/i);
  if (acMatch) ac = parseInt(acMatch[1], 10);

  let initiative = null;
  const initMatch = bodyText.match(/Iniciativa\s*[:\n]?\s*([+-]?\d{1,2})/i);
  if (initMatch) initiative = parseInt(initMatch[1], 10);

  let speed = null;
  const speedMeters = bodyText.match(/Velocidad\s*[:\n]?\s*(\d+(?:[.,]\d+)?)\s*m/i);
  const speedFeet = bodyText.match(/Velocidad\s*[:\n]?\s*(\d+)\s*(?:pies|ft)/i);
  if (speedMeters) speed = parseFloat(speedMeters[1].replace(',', '.'));
  else if (speedFeet) speed = Math.round((parseInt(speedFeet[1], 10) * 0.3) * 10) / 10;

  const stats = {};
  [
    ['Fue', 'Fuerza|FUE'], ['Des', 'Destreza|DES'], ['Con', 'Constituci[oó]n|CON'],
    ['Int', 'Inteligencia|INT'], ['Sab', 'Sabidur[ií]a|SAB'], ['Car', 'Carisma|CAR']
  ].forEach(([key, pat]) => {
    const m1 = bodyText.match(new RegExp(`(?:${pat})\\s*[:\\n]?\\s*(\\d{1,2})\\s*\\(?([+-]\\d|0)\\)?`, 'i'));
    const m2 = bodyText.match(new RegExp(`(?:${pat})\\s*[:\\n]?\\s*([+-]\\d|0)\\s*\\n\\s*(\\d{1,2})`, 'i'));
    const score = m1 ? parseInt(m1[1], 10) : m2 ? parseInt(m2[2], 10) : null;
    if (score && score >= 1 && score <= 30) {
      const mod = Math.floor((score - 10) / 2);
      stats[key] = `${score} (${mod >= 0 ? '+' : ''}${mod})`;
    }
  });

  const weapons = [];
  const seenWeapons = new Set();
  document.querySelectorAll('tr, .attack-row, [class*="weapon"], [class*="attack"]').forEach(row => {
    const txt = clean(row.textContent);
    if (!txt || txt.length > 140) return;
    const dmgMatch = txt.match(/\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/i);
    const atkMatch = txt.match(/([+-]\d{1,2})\b/);
    if (!dmgMatch) return;
    const firstCell = row.querySelector('td, strong, b, a, .name, [class*="name"]');
    const wName = clean(firstCell?.textContent || txt.split(atkMatch?.[0] || dmgMatch[0])[0]);
    if (!wName || wName.length < 2 || wName.length > 40 || seenWeapons.has(wName.toLowerCase())) return;
    seenWeapons.add(wName.toLowerCase());
    weapons.push({
      name: wName,
      attack: atkMatch ? parseInt(atkMatch[1], 10) : null,
      damage: dmgMatch[1].replace(/\s/g, ''),
      type: (txt.match(/cortante|perforante|contundente|fuego|fr[ií]o|rel[aá]mpago|ps[ií]quico|fuerza|trueno|radiante|necr[oó]tico|veneno|[aá]cido|curaci[oó]n/i)?.[0] || '').toLowerCase()
    });
  });

  const dcMatch = bodyText.match(/(?:CD de salvaci[oó]n|CD conjuros?|Save DC)\s*[:\n]?\s*(\d{1,2})/i);
  const spAtkMatch = bodyText.match(/(?:Ataque de conjuro|Bonificador de ataque de conjuro)\s*[:\n]?\s*([+-]?\d{1,2})/i);
  const spellsPatch = {};
  if (dcMatch) spellsPatch.saveDc = parseInt(dcMatch[1], 10);
  if (spAtkMatch) spellsPatch.attack = parseInt(spAtkMatch[1], 10);

  const character = { name };
  if (avatar) character.avatar = avatar;
  if (level !== null) character.level = level;
  if (className) character.className = className;
  if (species) character.species = species;
  if (hp !== null && maxHp !== null) { character.hp = hp; character.maxHp = maxHp; }
  if (ac !== null) character.ac = ac;
  if (initiative !== null) character.initiative = initiative;
  if (speed !== null) character.speed = speed;
  if (Object.keys(stats).length >= 3) character.stats = stats;
  if (weapons.length) character.weapons = weapons;
  if (Object.keys(spellsPatch).length) character.spells = spellsPatch;

  return { ok: true, mode: 'single', character };
})();
