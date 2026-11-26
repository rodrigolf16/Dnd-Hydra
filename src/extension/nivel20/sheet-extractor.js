// Classic content-script extractor for single Nivel20 character sheets
(() => {
  const ns = (globalThis.__rondaN20 = globalThis.__rondaN20 || {});

  ns.extractSingleSheet = async function extractSingleSheet(bodyText) {
    const { clean, findBestImageInRoot, toPermanentAvatar } = ns;
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

    const lvlMatch = bodyText.match(/(?:nivel|nv\.?)\s*(\d{1,2})/i)
      || bodyText.match(/(?:Explorador|Mago|B[aá]rbaro|Bardo|P[ií]caro|Druida|Guerrero|Cl[eé]rigo|Palad[ií]n|Monje|Hechicero|Brujo|Art[ií]fice)\s+(\d{1,2})/i);
    const level = lvlMatch ? Math.max(1, Math.min(20, parseInt(lvlMatch[1], 10))) : null;

    const classMatch = bodyText.match(/((?:Explorador|Mago|B[aá]rbaro|Bardo|P[ií]caro|Druida|Guerrero|Cl[eé]rigo|Palad[ií]n|Monje|Hechicero|Brujo|Art[ií]fice)[^\n]{0,45})/i);
    const className = classMatch ? clean(classMatch[1]) : '';

    const speciesMatch = bodyText.match(/(Elfo de los bosques|Alto elfo|Semielfo[^\n,]{0,30}|Gigante de fuego|Goliat|Mediano|Infernal|Tiefling|Humano|Enano|Drac[oó]nido|Gnomo|Orco|Aasimar)/i);
    const species = speciesMatch ? clean(speciesMatch[1]) : '';

    const hpMatch = bodyText.match(/(?:Puntos de golpe|PG|HP)\s*[:\n]?\s*(\d{1,3})\s*\/\s*(\d{1,3})/i)
      || bodyText.match(/(\d{1,3})\s*\/\s*(\d{1,3})\s*(?:PG|HP|Puntos de golpe)/i);
    const hp = hpMatch ? parseInt(hpMatch[1], 10) : null;
    const maxHp = hpMatch ? parseInt(hpMatch[2], 10) : null;

    const acMatch = bodyText.match(/(?:Clase de armadura|CA|AC)\s*[:\n]?\s*(\d{1,2})/i);
    const ac = acMatch ? parseInt(acMatch[1], 10) : null;

    const initMatch = bodyText.match(/Iniciativa\s*[:\n]?\s*([+-]?\d{1,2})/i);
    const initiative = initMatch ? parseInt(initMatch[1], 10) : null;

    const speedMeters = bodyText.match(/Velocidad\s*[:\n]?\s*(\d+(?:[.,]\d+)?)\s*m/i);
    const speedFeet = bodyText.match(/Velocidad\s*[:\n]?\s*(\d+)\s*(?:pies|ft)/i);
    const speed = speedMeters
      ? parseFloat(speedMeters[1].replace(',', '.'))
      : speedFeet ? Math.round((parseInt(speedFeet[1], 10) * 0.3) * 10) / 10 : null;

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
  };
})();
