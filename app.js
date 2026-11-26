(() => {
  'use strict';

  const STORAGE_KEY = 'ronda-dm-physical-v4';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clone = obj => JSON.parse(JSON.stringify(obj));

  const campaign = window.CAMPAIGN;

  // =========================================================================
  // SPELL, MONSTER SEARCH & FEATURE KNOWLEDGE BASE (D&D 2024)
  // =========================================================================
  const SPELL_META = {
    'descarga de fuego': { level: 0, type: 'action', attack: true, damage: '2d10', dmgType: 'fuego', desc: 'Ataque de conjuro a distancia que inflige daño de fuego (2d10 a nivel 5).' },
    'rayo de escarcha': { level: 0, type: 'action', attack: true, damage: '2d8', dmgType: 'frío', desc: 'Ataque de conjuro a distancia; inflige frío y reduce la velocidad del objetivo en 3 m.' },
    'ilusión menor': { level: 0, type: 'action', desc: 'Crea un sonido o una imagen inmóvil pequeña durante 1 minuto.' },
    'mano de mago': { level: 0, type: 'action', desc: 'Invoca una mano espectral flotante para manipular objetos a distancia.' },
    'prestidigitación': { level: 0, type: 'action', desc: 'Pequeños efectos mágicos sensoriales o utilitarios.' },
    'saber druídico': { level: 0, type: 'action', desc: 'Efectos menores ligados a la naturaleza (clima, flores, aromas o luces).' },
    'burla dañina': { level: 0, type: 'action', damage: '2d4', dmgType: 'psíquico', desc: 'Salvación de Sabiduría; si falla, recibe 2d4 psíquico y tiene desventaja en su próximo ataque.' },
    'guía': { level: 0, type: 'action', concentration: true, desc: 'Una criatura tocada suma 1d4 a una prueba de característica elegida.' },
    'látigo de espinas': { level: 0, type: 'action', attack: true, damage: '2d6', dmgType: 'perforante', desc: 'Ataque de conjuro; inflige daño perforante y atrae hasta 3 m a una criatura Grande o menor.' },
    'shillelagh': { level: 0, type: 'bonus', desc: 'Imbuye un bastón o garrote para atacar con Sabiduría y mejorar su dado de daño.' },
    'taumaturgia': { level: 0, type: 'action', desc: 'Efectos sobrenaturales menores con voz, llamas, puertas o temblores.' },
    'voluta estelar': { level: 0, type: 'action', attack: true, damage: '2d8', dmgType: 'radiante', desc: 'Ataque de conjuro a distancia de daño radiante; el objetivo emite luz tenue.' },

    'marca del cazador': { level: 1, type: 'bonus', concentration: true, desc: 'Marca a una criatura: tus ataques con arma contra ella suman +1d6 de daño de fuerza.' },
    'armadura de mago': { level: 1, type: 'action', desc: 'Una criatura sin armadura obtiene CA base 13 + modificador de Destreza durante 8 horas.' },
    'detectar magia': { level: 1, type: 'action', concentration: true, ritual: true, desc: 'Percibes la presencia de magia a 9 m durante hasta 10 minutos.' },
    'dormir': { level: 1, type: 'action', concentration: true, desc: 'Las criaturas en el área hacen salvación de Sabiduría o quedan incapacitadas / inconscientes.' },
    'encontrar familiar': { level: 1, type: 'other', ritual: true, desc: 'Invoca un espíritu familiar con forma animal que actúa según tus órdenes.' },
    'escudo': { level: 1, type: 'reaction', desc: 'Reacción al ser impactado: +5 a tu CA hasta el inicio de tu próximo turno y bloquea Proyectil mágico.' },
    'proyectil mágico': { level: 1, type: 'action', damage: '3d4+3', dmgType: 'fuerza', desc: 'Crea 3 dardos de fuerza que impactan automáticamente (1d4+1 cada uno).' },
    'alarma': { level: 1, type: 'other', ritual: true, desc: 'Protege un área durante 8 horas y avisa cuando una criatura entra.' },
    'buenas bayas': { level: 1, type: 'action', desc: 'Crea hasta 10 bayas mágicas; cada una restaura 1 PG y nutre por un día.' },
    'curar heridas': { level: 1, type: 'action', heal: '2d8', desc: 'Una criatura que toques recupera 2d8 + mod. de lanzamiento PG (D&D 2024).' },
    'detectar venenos y enfermedades': { level: 1, type: 'action', concentration: true, ritual: true, desc: 'Detectas venenos, criaturas venenosas y enfermedades a 9 m.' },
    'disfrazarse': { level: 1, type: 'action', desc: 'Cambias mágicamente tu apariencia y vestimenta durante 1 hora.' },
    'encantar animal': { level: 1, type: 'action', desc: 'Una bestia hace salvación de Sabiduría o queda hechizada por ti.' },
    'enmarañar': { level: 1, type: 'action', concentration: true, desc: 'Enredaderas en un cuadrado de 6 m; salvación de Fuerza o quedan apresadas.' },
    'golpe apresador': { level: 1, type: 'bonus', concentration: true, desc: 'Al impactar con un arma, invoca enredaderas que pueden apresar y dañar al objetivo.' },
    'zancada prodigiosa': { level: 1, type: 'action', desc: 'Aumenta en +3 m la velocidad de una criatura durante 1 hora.' },
    'caída de pluma': { level: 1, type: 'reaction', desc: 'Reacción cuando tú o hasta 5 criaturas caen: descienden suavemente sin daño.' },
    'fuego feérico': { level: 1, type: 'action', concentration: true, desc: 'Ilumina criaturas que fallen salvación de Destreza; los ataques contra ellas tienen ventaja.' },
    'ola atronadora': { level: 1, type: 'action', damage: '2d8', dmgType: 'trueno', desc: 'Cubo de 4,5 m: salvación de Constitución o reciben 2d8 trueno y son empujadas 3 m.' },
    'palabra de curación': { level: 1, type: 'bonus', heal: '2d4', desc: 'Acción adicional a distancia: recupera 2d4 + mod. de lanzamiento PG (D&D 2024).' },
    'represión infernal': { level: 1, type: 'reaction', damage: '2d10', dmgType: 'fuego', desc: 'Reacción contra una criatura a 18 m que te dañó: salvación de Destreza o 2d10 fuego.' },
    'cuchillo de hielo': { level: 1, type: 'action', attack: true, damage: '1d10', dmgType: 'perforante', desc: 'Ataque de conjuro (1d10 perforante) y luego explota en 2d6 frío en 1,5 m (salvación de Destreza).' },

    'hacer añicos': { level: 2, type: 'action', damage: '3d8', dmgType: 'trueno', desc: 'Esfera de 3 m: salvación de Constitución o 3d8 trueno (mitad si supera).' },
    'pasar sin rastro': { level: 2, type: 'action', concentration: true, desc: 'Tú y tus aliados a 9 m ganan +10 a Sigilo y no dejan rastro durante 1 hora.' },
    'crecimiento espinoso': { level: 2, type: 'action', concentration: true, desc: 'Radio de 6 m de terreno difícil; cada 1,5 m recorridos infligen 2d4 perforante.' }
  };

  const STANDARD_ACTIONS = [
    { id: 'std-dash', name: 'Correr (Dash)', kind: 'action', icon: '⚡', short: 'Duplica su movimiento este turno (+velocidad).', meta: 'Usa acción' },
    { id: 'std-disengage', name: 'Destrabarse (Disengage)', kind: 'action', icon: '↺', short: 'Su movimiento no provoca ataques de oportunidad este turno.', meta: 'Usa acción' },
    { id: 'std-dodge', name: 'Esquivar (Dodge)', kind: 'action', icon: '⛨', short: 'Ataques contra él tienen desventaja hasta su próximo turno.', meta: 'Usa acción' },
    { id: 'std-hide', name: 'Esconderse (Hide)', kind: 'action', icon: '◐', short: 'Tira 1×d20 + Sigilo (CD 15) y anota el resultado.', meta: '1 dado físico (d20)' },
    { id: 'std-help', name: 'Ayudar (Help)', kind: 'action', icon: '✚', short: 'Otorga ventaja a un aliado en su próxima prueba o ataque.', meta: 'Usa acción' },
    { id: 'std-ready', name: 'Preparar acción (Ready)', kind: 'action', icon: '⧗', short: 'Define un desencadenante y ejecuta la acción con su Reacción.', meta: 'Usa acción + reacción' }
  ];

  const FEATURE_DESCRIPTIONS = {
    'ataque adicional': 'Cuando realiza la acción Atacar en su turno, puede hacer dos ataques en lugar de uno.',
    'enemigo predilecto': 'Siempre tiene Marca del cazador preparada y puede lanzarla varias veces sin gastar espacio de conjuro.',
    'explorador hábil': 'Obtiene pericia en habilidades e idiomas adicionales.',
    'lanzamiento de conjuros': 'Puede lanzar los conjuros preparados usando su característica de lanzamiento.',
    'emboscador pavoroso': 'Una vez por turno, al impactar con un arma puede añadir +2d6 de daño psíquico.',
    'visión en la umbra': 'Visión en la oscuridad ampliada; es invisible para criaturas que dependan de visión en la oscuridad.',
    'recuperación arcana': 'Una vez por descanso largo, durante un descanso corto recupera espacios de conjuro.',
    'cambio crónico': 'Reacción: obliga a una criatura a 9 m a repetir una tirada de ataque, prueba o salvación (2 usos/descanso largo).',
    'conciencia temporal': 'Suma su modificador de Inteligencia a sus tiradas de iniciativa.',
    'furia': 'Acción adicional: entra en Furia (+2 daño cuerpo a cuerpo con Fuerza y resistencia a daño físico).',
    'frenesí': 'Si usa Ataque temerario mientras está en Furia, su primer impacto del turno suma +2d6 de daño.',
    'ataque temerario': 'Ventaja en todos sus ataques cuerpo a cuerpo con Fuerza este turno; los ataques contra él tienen ventaja hasta su próximo turno.',
    'defensa sin armadura': 'Sin armadura, su CA es 10 + modificador de Destreza + modificador de Constitución.',
    'movimiento rápido': 'Su velocidad aumenta en +3 m mientras no lleve armadura pesada.',
    'sentir el peligro': 'Ventaja en salvaciones de Destreza contra efectos que pueda ver.',
    'acción astuta': 'Acción adicional para Correr, Destrabarse o Esconderte.',
    'ataque furtivo': 'Una vez por turno, añade daño adicional (3d6 a nivel 5) al impactar con arma sutil o a distancia.',
    'esquiva asombrosa': 'Reacción cuando le impactan: reduce el daño de ese ataque a la mitad.',
    'puntería certera': 'Acción adicional: ventaja en su próximo ataque este turno si no se movió (velocidad 0 m).',
    'golpe astuto': 'Al aplicar Ataque furtivo puede sacrificar 1d6 de daño para añadir Veneno, Tropiezo o Retirada.',
    'forma salvaje': 'Acción adicional (Círculo de la Luna): adopta forma de bestia.',
    'inspiración bárdica': 'Acción adicional: otorga un dado de inspiración (d8) a un aliado a 18 m.',
    'maestría con armas': 'Puede aplicar propiedades de maestría (Mellar, Molestar, Hender, Rozar, Empujar, Derribar, Ralentizar).',
    'maestro de armas': 'Concede dominio de la propiedad de maestría de un tipo de arma.',
    'alerta': 'Suma competencia a iniciativa y puede intercambiar su posición en iniciativa con un aliado dispuesto.'
  };

  const ENEMY_TRANSLATIONS = {
    trasgo: 'goblin', goblin: 'goblin', hobgoblin: 'hobgoblin', orco: 'orc', ogro: 'ogre',
    trol: 'troll', esqueleto: 'skeleton', zombi: 'zombie', lobo: 'wolf', oso: 'bear',
    'oso lechuza': 'owlbear', dragón: 'dragon', dragon: 'dragon', araña: 'spider',
    bandido: 'bandit', vampiro: 'vampire', fantasma: 'ghost', espectro: 'wraith',
    lich: 'lich', demonio: 'demon', diablo: 'devil', gólem: 'golem', golem: 'golem',
    hidra: 'hydra', minotauro: 'minotaur', medusa: 'medusa', gárgola: 'gargoyle',
    arpía: 'harpy', gigante: 'giant', serpiente: 'snake', kobold: 'kobold', gnoll: 'gnoll', mímico: 'mimic'
  };

  // =========================================================================
  // STATE
  // =========================================================================
  let state = null;
  let currentAction = null;
  let currentWeaponOptions = [];
  let rollMode = 'normal';
  let hpDialogTargetId = null;
  let swapMode = false;
  let swapFirstId = null;
  let toastTimer = null;
  let pendingEnemyUploadDataUrl = '';
  let pendingEditAvatarDataUrl = '';
  let currentMainView = 'encounter';
  let mapMeasureMode = false;
  let mapInitializedView = false;

  // Physical Dice Pool state (right sidebar)
  const dicePool = { 20: 0, 12: 0, 10: 0, 8: 0, 6: 0, 4: 0 };
  let poolModifier = 0;

  const dialogs = {
    action: $('#actionDialog'),
    spellPicker: $('#spellPickerDialog'),
    uses: $('#usesDialog'),
    customAction: $('#customActionDialog'),
    hp: $('#hpDialog'),
    initiative: $('#initiativeDialog'),
    nivel20: $('#nivel20Dialog'),
    import: $('#importDialog'),
    edit: $('#editDialog'),
    manual: $('#manualDialog'),
    movement: $('#movementDialog'),
    combatant: $('#combatantDialog'),
    help: $('#helpDialog'),
    settings: $('#settingsDialog'),
    sheet: $('#sheetDialog'),
    mapMarker: $('#mapMarkerDialog'),
    mapUrl: $('#mapUrlDialog'),
    mobileSync: $('#mobileSyncDialog')
  };

  // =========================================================================
  // HELPERS
  // =========================================================================
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function signed(n) {
    const num = Number(n) || 0;
    return `${num >= 0 ? '+' : ''}${num}`;
  }

  function formatMeters(val) {
    return String(Math.max(0, Math.round((Number(val) || 0) * 10) / 10));
  }

  function hpClass(hp, maxHp) {
    if (!maxHp || maxHp <= 0) return '';
    const pct = (hp / maxHp) * 100;
    return pct <= 25 ? 'hp-low' : pct <= 55 ? 'hp-mid' : '';
  }

  function getAbilityMod(c, key) {
    const raw = String(c.stats?.[key] || '');
    const explicit = raw.match(/\(([+-]?\d+)\)/)?.[1];
    if (explicit !== undefined) return Number(explicit);
    const score = Number(raw.match(/\d+/)?.[0]);
    return Number.isFinite(score) ? Math.floor((score - 10) / 2) : 0;
  }

  function getLevel(c) {
    const explicit = Number(c.level);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const match = String(c.className || '').match(/\d+/);
    return match ? Number(match[0]) : 1;
  }

  function getSkillBonus(c, skillName) {
    if (!c.skills) return null;
    const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const target = norm(skillName);
    for (const [k, v] of Object.entries(c.skills)) {
      if (norm(k) === target) return Number(v);
    }
    return null;
  }

  function getPerception(c) {
    const fromSkills = getSkillBonus(c, 'Percepción');
    return fromSkills !== null ? fromSkills : (c.perception ?? getAbilityMod(c, 'Sab'));
  }

  function getSpellMeta(name) {
    return SPELL_META[String(name || '').toLowerCase()] || {
      level: 1,
      type: 'action',
      desc: `Conjuro de ficha (${name}).`
    };
  }

  function spellActionType(name, c = viewed()) {
    const customTime = c?.spells?.castingTimes?.[name];
    if (customTime && /minuto|hora|ritual/i.test(customTime)) return 'other';
    return getSpellMeta(name).type;
  }

  function hasFeature(c, regex) {
    return [...(c.features || []), ...(c.feats || [])].some(f => regex.test(String(f)));
  }

  function hasWeaponMasteryAccess(c) {
    return hasFeature(c, /maestr[ií]a con armas|maestro de armas/i);
  }

  function hasMellarAccess(c) {
    if (!hasWeaponMasteryAccess(c)) return false;
    return (c.masteries || []).some(m => /mellar/i.test(m)) &&
      (c.weapons || []).some(w => /mellar/i.test(w.mastery || ''));
  }

  function hasLightWeapons(c) {
    return (c.weapons || []).some(w => w.attack != null && (w.tags || []).some(t => /ligera/i.test(t)));
  }

  function hasHealingPotion(c) {
    return (c.weapons || []).some(w => /poci[oó]n de curaci[oó]n/i.test(w.name)) ||
      (c.equipment || []).some(e => /poci[oó]n de curaci[oó]n/i.test(e));
  }

  function hasHuntersMark(c) {
    return hasFeature(c, /enemigo predilecto/i) || (c.spells?.names || []).some(s => /marca del cazador/i.test(s));
  }

  function hasSneakAttack(c) {
    return hasFeature(c, /ataque furtivo/i);
  }

  function getSneakDiceCount(c) {
    return Math.max(1, Math.ceil(getLevel(c) / 2));
  }

  function getRageDamageBonus(c) {
    const lvl = getLevel(c);
    return lvl >= 16 ? 4 : lvl >= 9 ? 3 : 2;
  }

  function isMeleeStrengthWeapon(w) {
    if (!w || w.range) return false;
    if (w.ability === 'Fue') return true;
    return !(w.tags || []).map(t => t.toLowerCase()).includes('distancia');
  }

  function isSneakEligibleWeapon(w) {
    if (!w) return false;
    if (w.range) return true;
    const tags = (w.tags || []).map(t => t.toLowerCase());
    return tags.includes('sutil') || tags.includes('distancia');
  }

  function ownerLabel(c) {
    return c.owner || (c.type === 'enemy' ? 'Adversario' : c.species || 'Combatiente');
  }

  function byId(id) {
    return state.combatants.find(c => c.id === id) || null;
  }

  function activeTurnCombatant() {
    return byId(state.activeTurnId) || state.combatants[0] || null;
  }

  function viewed() {
    return byId(state.viewedId) || activeTurnCombatant();
  }

  function isViewingActiveTurn() {
    return state.viewedId === state.activeTurnId;
  }

  function openDialog(d) {
    if (d && !d.open) d.showModal();
  }

  function closeDialog(d) {
    if (d && d.open) d.close();
  }

  async function copyToClipboard(text, successMsg = 'Copiado al portapapeles') {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast(successMsg);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      try { document.execCommand('copy'); toast(successMsg); } catch { toast('No se pudo copiar automáticamente'); }
      ta.remove();
    }
  }

  // Parses dice expressions & returns combined formula, total physical die count, and per-die breakdown
  function analyzeDiceExpressions(expressions, critical = false) {
    const diceMap = new Map();
    let flatBonus = 0;

    expressions.filter(Boolean).forEach(expr => {
      const normalized = String(expr).replace(/\s/g, '').toLowerCase();
      const tokens = normalized.match(/[+-]?[^+-]+/g) || [];
      tokens.forEach(rawTok => {
        let sign = 1;
        let tok = rawTok;
        if (tok[0] === '-') { sign = -1; tok = tok.slice(1); }
        else if (tok[0] === '+') { tok = tok.slice(1); }

        const m = tok.match(/^(\d*)d(\d+)$/);
        if (m) {
          let count = Math.max(1, Number(m[1] || 1)) * sign;
          if (critical) count *= 2;
          const sides = Number(m[2]);
          diceMap.set(sides, (diceMap.get(sides) || 0) + count);
        } else {
          const n = Number(tok);
          if (Number.isFinite(n)) flatBonus += n * sign;
        }
      });
    });

    const sortedSides = [...diceMap.keys()].sort((a, b) => b - a);
    const parts = [];
    const qtyParts = [];
    let totalDice = 0;

    sortedSides.forEach(sides => {
      const count = diceMap.get(sides);
      if (!count) return;
      totalDice += Math.abs(count);
      qtyParts.push(`${Math.abs(count)} × d${sides}`);
      if (parts.length === 0) parts.push(`${count}d${sides}`);
      else parts.push(`${count > 0 ? '+' : ''}${count}d${sides}`);
    });

    if (flatBonus !== 0) {
      if (parts.length === 0) parts.push(String(flatBonus));
      else parts.push(flatBonus > 0 ? `+${flatBonus}` : String(flatBonus));
    }

    const formula = parts.join('') || '0';
    const breakdown = qtyParts.length
      ? `${qtyParts.join(' + ')}${flatBonus ? ` (${signed(flatBonus)})` : ''}`
      : (flatBonus ? `Modificador ${signed(flatBonus)}` : 'Sin dados');

    return { formula, totalDice, breakdown, flatBonus, diceMap };
  }

  // =========================================================================
  // PHYSICAL DICE POOL (RIGHT SIDEBAR)
  // =========================================================================
  function renderPhysicalDicePool() {
    const exprs = [];
    [20, 12, 10, 8, 6, 4].forEach(sides => {
      const count = dicePool[sides] || 0;
      const btn = $(`.die-pick[data-die="${sides}"]`);
      const badge = $(`.die-badge[data-count="${sides}"]`);
      if (badge) badge.textContent = String(count);
      if (btn) btn.classList.toggle('has-qty', count > 0);
      if (count > 0) exprs.push(`${count}d${sides}`);
    });
    if (poolModifier !== 0) exprs.push(String(poolModifier));

    const info = analyzeDiceExpressions(exprs, false);
    $('#poolTotalDiceCount').textContent = `${info.totalDice} ${info.totalDice === 1 ? 'dado' : 'dados'}`;
    $('#poolFormulaDisplay').textContent = exprs.length ? info.formula : '—';
    $('#copyPoolFormulaBtn').hidden = !exprs.length;
    $('#poolBreakdownText').textContent = exprs.length
      ? `Tirar en mesa: ${info.breakdown}`
      : 'Selecciona dados arriba o escribe una fórmula (ej. 2d6+1d4+5).';
  }

  function clearPhysicalDicePool() {
    Object.keys(dicePool).forEach(k => { dicePool[k] = 0; });
    poolModifier = 0;
    $('#modifier').value = '0';
    $('#customDice').value = '';
    renderPhysicalDicePool();
  }

  function loadFormulaIntoPool(formula) {
    const clean = String(formula || '').trim();
    if (!/^(?:[1-9]\d*)?d[1-9]\d*(?:\s*[+-]\s*(?:\d+|(?:[1-9]\d*)?d[1-9]\d*))*$/i.test(clean)) {
      toast('Usa una expresión válida como 2d6+1d4+5');
      return;
    }
    Object.keys(dicePool).forEach(k => { dicePool[k] = 0; });
    const info = analyzeDiceExpressions([clean], false);
    info.diceMap.forEach((count, sides) => {
      if (dicePool[sides] !== undefined && count > 0) dicePool[sides] = count;
    });
    poolModifier = info.flatBonus;
    $('#modifier').value = (poolModifier > 0 ? '+' : '') + poolModifier;
    renderPhysicalDicePool();
    // If custom formula had non-standard die sides (e.g. d100), show it directly
    $('#poolFormulaDisplay').textContent = info.formula;
    $('#poolTotalDiceCount').textContent = `${info.totalDice} ${info.totalDice === 1 ? 'dado' : 'dados'}`;
    $('#poolBreakdownText').textContent = `Tirar en mesa: ${info.breakdown}`;
    $('#copyPoolFormulaBtn').hidden = false;
    toast(`Cargado: ${info.formula} (${info.totalDice} dados físicos)`);
  }

  function recordPhysicalPoolRoll(applyMode = 'log') {
    const rawVal = $('#physicalResultInput').value.trim();
    if (rawVal === '' || !Number.isFinite(Number(rawVal))) {
      toast('Escribe primero el resultado obtenido en los dados físicos');
      $('#physicalResultInput').focus();
      return;
    }
    const result = Number(rawVal);
    const note = $('#physicalResultNote').value.trim();
    const formula = $('#poolFormulaDisplay').textContent;
    const totalDiceText = $('#poolTotalDiceCount').textContent;
    const formulaPart = formula && formula !== '—' ? `${formula} (${totalDiceText})` : 'Tirada física';
    const actor = viewed()?.name || 'DM';
    const target = state.currentTargetId ? byId(state.currentTargetId) : null;

    $('#rollResult b').textContent = String(result);
    $('#rollResult small').textContent = `${formulaPart}${note ? ` · ${note}` : ''} → ${result}`;

    if (applyMode === 'damage') {
      if (!target) { toast('Selecciona un objetivo en «Objetivos y PG»'); return; }
      adjustHp(target, -Math.max(0, result), `${note || formulaPart} (${actor})`);
    } else if (applyMode === 'heal') {
      const recipient = target || viewed();
      if (!recipient) return;
      adjustHp(recipient, Math.max(0, result), `${note || formulaPart} (${actor})`);
    } else {
      addLog(actor, `anota tirada física: ${result}`, `${formulaPart}${note ? ` · ${note}` : ''}`, '⚄');
      toast(`Resultado ${result} anotado en el historial`);
    }

    $('#physicalResultInput').value = '';
    $('#physicalResultNote').value = '';
  }

  // =========================================================================
  // AUTO IMAGE LOOKUP FOR ENEMIES + PORTRAIT EXPORT
  // =========================================================================
  function googleImagesUrl(name) {
    return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${name} dnd 5e monster token`)}`;
  }

  async function fetchAutoEnemyImage(enemy) {
    const rawName = String(enemy.name || '').trim();
    if (!rawName) return;
    const cleaned = rawName.toLowerCase().replace(/\s+\d+$/, '').trim();
    const translated = ENEMY_TRANSLATIONS[cleaned] || Object.entries(ENEMY_TRANSLATIONS).find(([k]) => cleaned.includes(k))?.[1] || cleaned;

    const trySummary = async (lang, title) => {
      try {
        const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (!res.ok) return null;
        const json = await res.json();
        return json.thumbnail?.source || json.originalimage?.source || null;
      } catch { return null; }
    };

    const tryCommons = async query => {
      try {
        const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=4&prop=imageinfo&iiprop=url&iiurlwidth=360&format=json&origin=*`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        for (const p of Object.values(json.query?.pages || {})) {
          const src = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url;
          if (src && /\.(jpe?g|png|webp|svg)/i.test(src)) return src;
        }
        return null;
      } catch { return null; }
    };

    let found = await trySummary('es', cleaned);
    if (!found) found = await trySummary('en', `${translated} (Dungeons & Dragons)`);
    if (!found) found = await trySummary('en', translated);
    if (!found) found = await tryCommons(`${translated} monster fantasy`);
    if (!found) found = await tryCommons(cleaned);

    if (found) {
      const target = byId(enemy.id);
      if (target && !target.avatar) {
        target.avatar = found;
        saveState();
        renderAll();
        toast(`Imagen encontrada automáticamente para ${target.name}`);
      }
    }
  }

  function exportPortrait(c) {
    if (!c || !c.avatar) { toast(`${c?.name || 'Combatiente'} no tiene imagen asignada`); return; }
    const safeName = c.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'personaje';
    const ext = c.avatar.endsWith('.svg') ? 'svg' : c.avatar.startsWith('data:image/jpeg') ? 'jpg' : 'png';
    const a = document.createElement('a');
    a.href = c.avatar;
    a.download = `${safeName}-retrato.${ext}`;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.append(a);
    a.click();
    a.remove();
    toast(`Exportando retrato de ${c.name}`);
  }

  function readImageFileAsDataUrl(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  // =========================================================================
  // STATE & PERSISTENCE
  // =========================================================================
  function ensureUseCounters(c) {
    if (!Array.isArray(c.limitedUses)) c.limitedUses = [];
    const add = (key, name, max, reset = 'long', extra = {}) => {
      if (!c.limitedUses.some(x => x.key === key)) {
        c.limitedUses.push({ key, name, max, remaining: max, reset, custom: false, ...extra });
      }
    };
    const level = getLevel(c);
    Object.entries(c.spells || {}).forEach(([key, value]) => {
      const m = key.match(/^level(\d+)Slots$/);
      if (m && Number(value) > 0) add(`spell-slot-${m[1]}`, `Espacios de conjuro · nivel ${m[1]}`, Number(value), 'long');
    });
    if (c.spells?.freeHuntersMark > 0) add('free-hunters-mark', 'Marca del cazador · usos gratuitos', c.spells.freeHuntersMark, 'long');
    if (hasFeature(c, /emboscador pavoroso/i)) add('dreadful-strike', 'Emboscador pavoroso', Math.max(1, getAbilityMod(c, 'Sab') || 3), 'long');
    if (hasFeature(c, /^furia$/i)) add('rage', 'Furia', level >= 17 ? 6 : level >= 12 ? 5 : level >= 6 ? 4 : level >= 3 ? 3 : 2, 'short', { shortRestore: 1 });
    if (hasFeature(c, /inspiración bárdica/i)) add('bardic-inspiration', 'Inspiración bárdica', Math.max(1, getAbilityMod(c, 'Car') || 1), level >= 5 ? 'either' : 'long');
    if (hasFeature(c, /^forma salvaje$/i)) add('wild-shape', 'Forma salvaje', level >= 17 ? 4 : level >= 6 ? 3 : 2, 'short', { shortRestore: 1 });
    if (hasFeature(c, /recuperación arcana/i)) add('arcane-recovery', 'Recuperación arcana', 1, 'long');
    if (hasFeature(c, /cambio crónico/i)) add('chronal-shift', 'Cambio crónico', 2, 'long');
  }

  function freshTurn(c) {
    const maxAtk = hasFeature(c, /ataque adicional|ataque extra/i) ? 2 : 1;
    c.turnState = { action: true, bonus: true, movement: true, reaction: true };
    c.turnMovement = Number(c.speed) || 0;
    c.turnMoved = false;
    c.turnMaxAttacks = maxAtk;
    c.turnAttacksRemaining = maxAtk;
    c.turnNickUsed = false;
    c.turnBaseAttackMade = false;
    c.attackSequenceOpen = false;
    c.turnDreadUsed = false;
    c.turnSneakUsed = false;
    c.turnFrenzyUsed = false;
    c.turnRecklessActive = false;
    c.recklessUntilTurn = false;
    c.steadyAimActive = false;
    c.conditions = (c.conditions || []).filter(cond => !['Esquivando', 'Destrabado', 'Preparando acción'].includes(cond));
  }

  function hydrateCombatant(c) {
    if (!c.type) c.type = 'pc';
    if (!Array.isArray(c.customActions)) c.customActions = [];
    if (!Array.isArray(c.conditions)) c.conditions = [];
    if (c.markedTargetId === undefined) c.markedTargetId = null;
    if (c.concentration === undefined) c.concentration = null;
    if (c.raging === undefined) c.raging = false;
    if (c.defeated === undefined) c.defeated = c.type === 'enemy' && c.hp <= 0;
    if (!c.avatar && c.type !== 'enemy') {
      const orig = campaign.characters.find(x => x.id === c.id);
      if (orig?.avatar) c.avatar = orig.avatar;
    }
    ensureUseCounters(c);
    if (!c.turnState) freshTurn(c);
    return c;
  }

  function defaultMapState() {
    return {
      bgImage: '',
      width: 1280,
      height: 840,
      gridSize: 56,
      showGrid: true,
      snap: true,
      trackMove: true,
      lighting: 'day',
      fogEnabled: true,
      fogMemory: true,
      showVisionRings: true,
      fogResetStamp: 0,
      zoom: 1,
      panX: 0,
      panY: 0,
      tokens: {},
      markers: []
    };
  }

  function ensureMapState(obj) {
    if (!obj.map || typeof obj.map !== 'object') obj.map = defaultMapState();
    const def = defaultMapState();
    Object.keys(def).forEach(k => {
      if (obj.map[k] === undefined) obj.map[k] = def[k];
    });
    if (!obj.map.tokens || typeof obj.map.tokens !== 'object') obj.map.tokens = {};
    if (!Array.isArray(obj.map.markers)) obj.map.markers = [];
  }

  function buildDefaultState() {
    const combatants = clone(campaign.characters).map(hydrateCombatant);
    const defaultId = combatants.some(c => c.id === 'khael') ? 'khael' : combatants[0]?.id || null;
    const defaultTarget = combatants.find(c => c.id !== defaultId)?.id || null;
    return {
      combatants,
      activeTurnId: defaultId,
      viewedId: defaultId,
      currentTargetId: defaultTarget,
      round: 1,
      initiativeRolled: false,
      paused: false,
      skipDefeated: true,
      enabledManuals: ['Manual del jugador'],
      nivel20: { url: campaign.nivel20Url || 'https://nivel20.com' },
      map: defaultMapState(),
      logEntries: [
        {
          time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          actor: 'DM',
          text: `panel listo para ${campaign.name}`,
          detail: 'Carga las iniciativas físicas, registra movimientos y usa el Mapa 2D con pines',
          symbol: '⇧'
        }
      ]
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildDefaultState();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.combatants) || !parsed.combatants.length) return buildDefaultState();
      parsed.combatants.forEach(hydrateCombatant);
      ensureMapState(parsed);
      if (!parsed.nivel20) parsed.nivel20 = { url: campaign.nivel20Url || 'https://nivel20.com' };
      if (!Array.isArray(parsed.logEntries)) parsed.logEntries = [];
      if (!Array.isArray(parsed.enabledManuals)) parsed.enabledManuals = ['Manual del jugador'];
      if (parsed.skipDefeated === undefined) parsed.skipDefeated = true;
      if (!parsed.combatants.some(c => c.id === parsed.activeTurnId)) parsed.activeTurnId = parsed.combatants[0].id;
      if (!parsed.combatants.some(c => c.id === parsed.viewedId)) parsed.viewedId = parsed.activeTurnId;
      return parsed;
    } catch {
      return buildDefaultState();
    }
  }

  const vttChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ronda-vtt-sync') : null;
  let broadcastTimer = null;
  let mobileHost = null;

  function broadcastStateNow() {
    if (!state) return;
    if (vttChannel) {
      try { vttChannel.postMessage({ type: 'STATE_UPDATE', state }); } catch {}
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ rondaLiveState: state }).catch(() => {});
    }
    if (mobileHost) {
      mobileHost.broadcastThrottled();
    }
  }

  function broadcastStateThrottled() {
    if (broadcastTimer) return;
    broadcastTimer = setTimeout(() => {
      broadcastTimer = null;
      broadcastStateNow();
    }, 45);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      try {
        const slim = { ...state, map: { ...state.map, bgImage: '' } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      } catch {}
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local && state.map?.bgImage) {
      chrome.storage.local.set({ rondaMapBgImage: state.map.bgImage }).catch(() => {});
    }
    broadcastStateNow();
  }

  state = loadState();

  // =========================================================================
  // LOGGING & LIMITED USES
  // =========================================================================
  function addLog(actor, text, detail = '', symbol = '✦') {
    state.logEntries.unshift({
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      actor,
      text,
      detail,
      symbol
    });
    if (state.logEntries.length > 100) state.logEntries.length = 100;
    saveState();
    renderLog();
  }

  function renderLog() {
    const list = $('#logList');
    list.replaceChildren();
    if (!state.logEntries.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-targets';
      empty.textContent = 'Todavía no hay eventos en el registro de combate.';
      list.append(empty);
      return;
    }
    state.logEntries.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'log-entry';
      row.innerHTML = '<span class="log-time"></span><span class="log-symbol"></span><span><b class="log-actor"></b> <span class="log-text"></span><small class="log-detail"></small></span>';
      row.querySelector('.log-time').textContent = entry.time;
      const sym = row.querySelector('.log-symbol');
      sym.textContent = entry.symbol || '✦';
      if (entry.symbol === '⚔') sym.classList.add('hit');
      row.querySelector('.log-actor').textContent = entry.actor;
      row.querySelector('.log-text').textContent = entry.text;
      row.querySelector('.log-detail').textContent = entry.detail || '';
      list.append(row);
    });
  }

  function useCounter(key, c = viewed()) {
    if (!c) return null;
    ensureUseCounters(c);
    return c.limitedUses.find(item => item.key === key) || null;
  }

  function limitedUseKeyFor(name) {
    const n = String(name || '').toLowerCase();
    if (/^furia$/.test(n)) return 'rage';
    if (/inspiración bárdica/.test(n)) return 'bardic-inspiration';
    if (/^forma salvaje$/.test(n)) return 'wild-shape';
    if (/cambio crónico/.test(n)) return 'chronal-shift';
    if (/recuperación arcana/.test(n)) return 'arcane-recovery';
    return null;
  }

  function spendFeatureUse(name, c = viewed()) {
    const key = limitedUseKeyFor(name);
    if (!key) return true;
    const counter = useCounter(key, c);
    if (!counter) return true;
    if (counter.remaining <= 0) return false;
    counter.remaining--;
    saveState();
    renderLimitedUses();
    return true;
  }

  function featureActivity(name) {
    const n = String(name || '').toLowerCase();
    if (/^furia$|inspiración bárdica|acción astuta|puntería certera|^forma salvaje$/.test(n)) return 'bonus';
    if (/cambio crónico|esquiva asombrosa/.test(n)) return 'reaction';
    if (/compañero salvaje/.test(n)) return 'action';
    return 'passive';
  }

  function featureDescription(name, c = viewed()) {
    const n = String(name || '').toLowerCase();
    if (FEATURE_DESCRIPTIONS[n]) return FEATURE_DESCRIPTIONS[n];
    if (/marca del cazador/.test(n)) return SPELL_META['marca del cazador'].desc;
    return `Rasgo o dote de ${c?.name || 'la ficha'}.`;
  }

  function featureHint(name) {
    const n = String(name || '').toLowerCase();
    if (/inspiración bárdica/.test(n)) return 'Otorga un dado d8 de inspiración a un aliado como acción adicional.';
    if (/^forma salvaje$/.test(n)) return 'Adopta forma de bestia como acción adicional.';
    if (/cambio crónico/.test(n)) return 'Reacción: obliga a repetir una tirada a 9 m (gasta 1 uso).';
    if (/esquiva asombrosa/.test(n)) return 'Reacción: reduce a la mitad el daño de un ataque que impactó.';
    if (/compañero salvaje/.test(n)) return 'Acción: gasta 1 uso de Forma salvaje para invocar un familiar.';
    return 'Opción activable de ficha.';
  }

  // =========================================================================
  // HP ADJUSTMENT
  // =========================================================================
  function adjustHp(c, delta, reason = '') {
    if (!c) return;
    const prev = c.hp;
    const next = Math.max(0, Math.min(c.maxHp, prev + delta));
    c.hp = next;

    if (c.type === 'enemy') {
      if (next <= 0) c.defeated = true;
      else if (prev <= 0 && next > 0) c.defeated = false;
    }

    const diff = next - prev;
    if (diff < 0) {
      const dmg = Math.abs(diff);
      let extra = `${next}/${c.maxHp} PG`;
      if (c.concentration) {
        const dc = Math.max(10, Math.floor(dmg / 2));
        extra += ` · ¡Salv. CON CD ${dc} para mantener ${c.concentration.spell}!`;
        toast(`${c.name} recibe ${dmg} daño — Salv. CON CD ${dc} (${c.concentration.spell})`);
      } else if (next === 0) {
        extra += c.type === 'enemy' ? ' · Fuera de combate' : ' · ¡Inconsciente (0 PG)!';
        toast(`${c.name} cae a 0 PG`);
      } else {
        toast(`${c.name}: -${dmg} PG (${next}/${c.maxHp})`);
      }
      if (next === 0 && c.concentration) {
        c.concentration = null;
        c.markedTargetId = null;
      }
      addLog(c.name, `recibe ${dmg} de daño`, `${reason ? `${reason} · ` : ''}${extra}`, '✕');
    } else if (diff > 0) {
      addLog(c.name, `recupera ${diff} PG`, `${reason ? `${reason} · ` : ''}${next}/${c.maxHp} PG`, '✚');
      toast(`${c.name}: +${diff} PG (${next}/${c.maxHp})`);
    }

    saveState();
    renderAll();
  }

  function setExactHp(c, exactHp, reason = '') {
    if (!c) return;
    const clamped = Math.max(0, Math.min(c.maxHp, exactHp));
    adjustHp(c, clamped - c.hp, reason);
  }

  // =========================================================================
  // RENDERING
  // =========================================================================
  function renderTopAndSidebar() {
    $('#campaignTitle').textContent = campaign.name;
    $('#breadcrumbName').textContent = campaign.name;
    $('#campaignSidebarName').textContent = campaign.name;
    $('#encounterStatusLabel').textContent = state.paused ? 'ENCUENTRO EN PAUSA' : 'ENCUENTRO EN CURSO';
    $('#liveDot').classList.toggle('paused', !!state.paused);
    $('#finishBtn').innerHTML = state.paused ? '▶ <span>Reanudar encuentro</span>' : 'Ⅱ <span>Pausar encuentro</span>';
    $('#roundLabel').textContent = `RONDA ${state.round}`;
    $('#eyebrowRound').textContent = `RONDA ${state.round}`;
    $('#swapInitiativeBtn').classList.toggle('active-swap', swapMode);
    $('#swapBanner').hidden = !swapMode;
  }

  function renderInitiative() {
    const list = $('#initiativeList');
    list.replaceChildren();

    state.combatants.forEach((c, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'turn-chip';
      if (c.id === state.activeTurnId) btn.classList.add('active-turn');
      if (c.id === state.viewedId) btn.classList.add('inspected-turn');
      if (c.defeated) btn.classList.add('defeated-chip');
      if (swapMode && c.id === swapFirstId) btn.classList.add('swap-selected');
      btn.dataset.id = c.id;

      const initial = (c.name.match(/[A-ZÁÉÍÓÚÑa-záéíóúñ]/g) || ['?'])[0].toUpperCase();
      const badge = document.createElement('span');
      badge.className = `chip-avatar ${c.type === 'enemy' ? 'enemy' : 'ally'}`;
      if (c.avatar) {
        const img = document.createElement('img');
        img.src = c.avatar;
        img.alt = c.name;
        img.onerror = () => { img.remove(); badge.textContent = initial; };
        badge.append(img);
      } else {
        badge.textContent = initial;
      }

      const label = document.createElement('span');
      label.innerHTML = '<b></b><small></small>';
      label.querySelector('b').textContent = c.name;
      label.querySelector('small').textContent = c.defeated
        ? 'Fuera de combate'
        : c.id === state.activeTurnId
          ? '● Turno actual'
          : c.id === state.viewedId
            ? '👁 Viendo ficha'
            : ownerLabel(c);

      const score = document.createElement('strong');
      score.textContent = c.initiativeRoll == null ? signed(c.initiative || 0) : String(c.initiativeRoll);
      score.title = c.initiativeRoll == null ? 'Bonificador de iniciativa' : 'Iniciativa física cargada';

      btn.append(badge, label, score);

      const bar = document.createElement('span');
      bar.className = 'chip-hp-bar';
      const pct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
      const fill = document.createElement('i');
      fill.style.width = `${pct}%`;
      const cls = hpClass(c.hp, c.maxHp);
      if (cls) fill.className = cls;
      bar.append(fill);
      btn.append(bar);

      btn.addEventListener('click', () => handleChipClick(c.id));
      list.append(btn);

      if (index < state.combatants.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'turn-arrow';
        arrow.textContent = '›';
        list.append(arrow);
      }
    });

    const focusChip = list.querySelector(`.turn-chip[data-id="${state.viewedId}"]`) || list.querySelector('.turn-chip.active-turn');
    if (focusChip && typeof focusChip.scrollIntoView === 'function') {
      focusChip.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }

  function handleChipClick(id) {
    if (swapMode) {
      if (!swapFirstId) {
        swapFirstId = id;
        $('#swapBannerText').textContent = `Seleccionado: ${byId(id).name}. Ahora haz clic en el otro combatiente para intercambiar sus puestos.`;
        renderInitiative();
        return;
      }
      if (swapFirstId === id) {
        swapFirstId = null;
        $('#swapBannerText').textContent = 'Haz clic en el primer combatiente en la barra de iniciativa y luego en el segundo para intercambiar sus puestos.';
        renderInitiative();
        return;
      }
      swapInitiativePositions(swapFirstId, id);
      swapMode = false;
      swapFirstId = null;
      renderAll();
      return;
    }
    inspectCombatant(id);
  }

  function swapInitiativePositions(idA, idB) {
    const idxA = state.combatants.findIndex(c => c.id === idA);
    const idxB = state.combatants.findIndex(c => c.id === idB);
    if (idxA < 0 || idxB < 0 || idxA === idxB) return;
    const a = state.combatants[idxA];
    const b = state.combatants[idxB];
    const tmpRoll = a.initiativeRoll;
    a.initiativeRoll = b.initiativeRoll;
    b.initiativeRoll = tmpRoll;
    state.combatants[idxA] = b;
    state.combatants[idxB] = a;
    addLog('Iniciativa', `${a.name} ⇄ ${b.name} intercambian lugar`, 'Orden actualizado (dote Alerta / ajuste DM)', '⇄');
    saveState();
    toast(`Intercambiados: ${a.name} ⇄ ${b.name}`);
  }

  function renderInspectBanner() {
    const banner = $('#inspectBanner');
    const viewingActive = isViewingActiveTurn();
    banner.hidden = viewingActive;
    if (!viewingActive) {
      $('#inspectBannerDetail').textContent = `Estás viendo a ${viewed().name}, pero el turno actual es de ${activeTurnCombatant().name}. Puedes registrar su Reacción o ajustar PG sin alterar el orden.`;
    }
  }

  function renderTurnGuide(c) {
    const ts = c.turnState;
    const parts = [];
    const chips = [];

    if (ts.action) {
      parts.push(c.turnMaxAttacks > 1
        ? `Acción disponible (${c.turnAttacksRemaining} ataques con Atacar${hasMellarAccess(c) && !c.turnNickUsed ? ' + Mellar' : ''})`
        : `Acción disponible (${hasMellarAccess(c) && !c.turnNickUsed ? 'Atacar + Mellar' : 'Atacar, conjuro o acción estándar'})`);
      chips.push({ text: 'Acción: disponible', spent: false });
    } else if (c.attackSequenceOpen && (c.turnAttacksRemaining > 0 || (hasMellarAccess(c) && c.turnBaseAttackMade && !c.turnNickUsed))) {
      const extraBits = [];
      if (c.turnAttacksRemaining > 0) extraBits.push(`${c.turnAttacksRemaining} ataque extra`);
      if (hasMellarAccess(c) && c.turnBaseAttackMade && !c.turnNickUsed) extraBits.push('Mellar disponible');
      parts.push(`sigue dentro de Atacar (${extraBits.join(' y ')})`);
      chips.push({ text: `Atacar en curso: ${extraBits.join(' + ')}`, spent: false });
    } else {
      chips.push({ text: 'Acción gastada', spent: true });
    }

    if (ts.bonus) {
      const hints = [];
      if (hasHuntersMark(c)) hints.push('Marca del cazador');
      if (hasFeature(c, /^furia$/i) && !c.raging) hints.push('Furia');
      if (hasFeature(c, /acción astuta/i)) hints.push('Acción astuta');
      if (hasFeature(c, /puntería certera/i) && !c.turnMoved) hints.push('Puntería certera');
      if (hasFeature(c, /inspiración bárdica/i)) hints.push('Inspiración bárdica');
      if (hasFeature(c, /^forma salvaje$/i)) hints.push('Forma salvaje');
      if (hasHealingPotion(c)) hints.push('Poción de curación');
      if ((c.spells?.names || []).some(s => spellActionType(s, c) === 'bonus')) hints.push('conjuro rápido');
      parts.push(`Acción adicional libre${hints.length ? ` (${hints.slice(0, 3).join(', ')})` : ''}`);
      chips.push({ text: 'Acción adicional: libre', spent: false });
    } else {
      chips.push({ text: 'Adicional gastada', spent: true });
    }

    if (c.turnMovement > 0) {
      parts.push(`${formatMeters(c.turnMovement)} m de movimiento`);
      chips.push({ text: `Movimiento: ${formatMeters(c.turnMovement)}/${formatMeters(c.speed)} m`, spent: false });
    } else {
      chips.push({ text: 'Movimiento agotado', spent: true });
    }

    chips.push({ text: ts.reaction ? 'Reacción: lista' : 'Reacción gastada', spent: !ts.reaction });

    const badge = $('#turnGuideStatus');
    const allSpent = !ts.action && !c.attackSequenceOpen && !ts.bonus && c.turnMovement <= 0;

    if (!isViewingActiveTurn()) {
      badge.textContent = 'Fuera de su turno';
      badge.className = 'guide-badge done';
      $('#turnGuideText').textContent = `Turno actual: ${activeTurnCombatant().name}. ${c.name} ${ts.reaction ? 'conserva su Reacción.' : 'ya gastó su Reacción hasta su próximo turno.'}`;
    } else if (allSpent) {
      badge.textContent = 'Turno completado';
      badge.className = 'guide-badge done';
      $('#turnGuideText').textContent = `${c.name} ya utilizó su acción, acción adicional y movimiento.${ts.reaction ? ' Conserva su Reacción hasta su próximo turno.' : ''}`;
    } else {
      badge.textContent = 'Opciones disponibles';
      badge.className = 'guide-badge';
      $('#turnGuideText').textContent = `Turno de ${c.name}: ${parts.join(' · ')}.`;
    }

    const chipContainer = $('#turnGuideChips');
    chipContainer.replaceChildren();
    chips.forEach(ch => {
      const span = document.createElement('span');
      span.className = `guide-chip${ch.spent ? ' spent' : ''}`;
      span.textContent = ch.text;
      chipContainer.append(span);
    });
  }

  function renderConditionBadges(c) {
    const root = $('#conditionBadges');
    root.replaceChildren();
    const addPill = (text, cls = '', onRemove = null) => {
      const pill = document.createElement('span');
      pill.className = `condition-pill ${cls}`.trim();
      const label = document.createElement('span');
      label.textContent = text;
      pill.append(label);
      if (onRemove) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = '×';
        btn.title = 'Quitar estado';
        btn.addEventListener('click', onRemove);
        pill.append(btn);
      }
      root.append(pill);
    };

    if (c.concentration) {
      const target = c.concentration.targetId ? byId(c.concentration.targetId) : null;
      addPill(`◎ Concentración: ${c.concentration.spell}${target ? ` (${target.name})` : ''}`, 'conc', () => {
        const spellName = c.concentration.spell;
        c.concentration = null;
        if (/marca del cazador/i.test(spellName)) c.markedTargetId = null;
        addLog(c.name, `pierde/suelta concentración en ${spellName}`, 'Concentración finalizada', '◌');
        saveState();
        renderAll();
      });
    }
    if (c.raging) {
      addPill('🔥 Furia activa (+2 daño, resistencia física)', 'warn', () => {
        c.raging = false;
        addLog(c.name, 'termina su Furia', 'Bonificador desactivado', '◌');
        saveState();
        renderAll();
      });
    }
    if (c.recklessUntilTurn) addPill('⚠ Ataque temerario (ventaja contra él hasta su turno)', 'warn');
    if (c.steadyAimActive) addPill('◎ Puntería certera (ventaja próximo ataque)', '');
    if (c.defeated) addPill('✕ Fuera de combate', 'warn');

    (c.conditions || []).forEach(cond => {
      addPill(cond, '', () => {
        c.conditions = c.conditions.filter(x => x !== cond);
        saveState();
        renderAll();
      });
    });
  }

  function renderCharacter() {
    const c = viewed();
    if (!c) return;

    const lvl = getLevel(c);
    $('#turnKicker').textContent = isViewingActiveTurn() ? 'TURNO ACTUAL' : 'INSPECCIONANDO FICHA';
    $('#characterHeading').innerHTML = '';
    $('#characterHeading').append(document.createTextNode(`${c.name} `));
    const tag = document.createElement('span');
    tag.className = 'level-tag';
    tag.textContent = c.type === 'enemy' ? 'ADVERSARIO' : `NV. ${lvl}`;
    $('#characterHeading').append(tag);

    const portraitBox = $('#charPortraitBox');
    const portraitImg = $('#charPortraitImg');
    const rune = $('#charRune');
    portraitBox.classList.toggle('enemy-portrait', c.type === 'enemy');
    if (c.avatar) {
      portraitImg.src = c.avatar;
      portraitImg.alt = `Retrato de ${c.name}`;
      portraitImg.hidden = false;
      rune.hidden = true;
      portraitImg.onerror = () => { portraitImg.hidden = true; rune.hidden = false; };
    } else {
      portraitImg.hidden = true;
      rune.hidden = false;
      rune.textContent = c.type === 'enemy' ? '⚔' : '✳';
    }
    $('#portraitCaption').textContent = (c.className || 'COMBATIENTE').replace(/ · /g, '\n').toUpperCase();
    $('#portraitLevel').textContent = c.type === 'enemy' ? 'PNJ' : `NV ${String(lvl).padStart(2, '0')}`;
    $('#exportPortraitBtn').hidden = !c.avatar;

    $('#charCardName').textContent = c.name;
    $('#charCardMeta').textContent = `${c.species || 'Criatura'} · ${c.className || 'Sin clase'}${c.owner ? ` · Jugador: ${c.owner}` : ''}`;

    $('#hpText').innerHTML = `${c.hp} <small>/ ${c.maxHp}</small>`;
    const hpPct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
    const hpBar = $('#hpBar');
    hpBar.style.width = `${hpPct}%`;
    hpBar.className = hpClass(c.hp, c.maxHp);

    $('#statAc').textContent = c.ac ?? '—';
    $('#statMove').textContent = `${formatMeters(c.turnMovement)} m`;
    $('#statInit').textContent = signed(c.initiative || 0);
    $('#statPerc').textContent = signed(getPerception(c));
    $('#resourceSummary').textContent = `Se marcan automáticamente · ${formatMeters(c.turnMovement)}/${formatMeters(c.speed || 0)} m`;

    const abilityRow = $('#abilityRow');
    abilityRow.replaceChildren();
    const names = { Fue: 'FUE', Des: 'DES', Con: 'CON', Int: 'INT', Sab: 'SAB', Car: 'CAR' };
    Object.entries(c.stats || {}).forEach(([key, value]) => {
      const raw = String(value);
      const score = Number(raw.match(/\d+/)?.[0]);
      const mod = getAbilityMod(c, key);
      const box = document.createElement('span');
      box.innerHTML = '<small></small><b></b><i></i>';
      box.querySelector('small').textContent = names[key] || key;
      box.querySelector('b').textContent = Number.isFinite(score) ? String(score) : raw;
      box.querySelector('i').textContent = signed(mod);
      abilityRow.append(box);
    });

    renderConditionBadges(c);
    renderTurnGuide(c);
    renderResourcesOnly(c);
    renderActionGroups(c);
  }

  function renderResourcesOnly(c) {
    const ts = c.turnState;
    $$('.resource').forEach(el => {
      const key = el.dataset.resource;
      if (!key) return;
      const available = key === 'movement' ? c.turnMovement > 0 : !!ts[key];
      el.classList.toggle('used', !available);
      const small = el.querySelector('small');
      if (key === 'movement') {
        small.textContent = c.turnMovement > 0
          ? `${formatMeters(c.turnMovement)} m de ${formatMeters(c.speed || 0)} m restantes`
          : '0 m restantes este turno';
      } else if (key === 'action') {
        if (ts.action) small.textContent = c.turnMaxAttacks > 1 ? `Disponible (${c.turnAttacksRemaining} ataques con Atacar)` : 'Disponible';
        else if (c.attackSequenceOpen && (c.turnAttacksRemaining > 0 || (hasMellarAccess(c) && c.turnBaseAttackMade && !c.turnNickUsed))) {
          small.textContent = `Atacar en curso (${c.turnAttacksRemaining} restantes)`;
        } else small.textContent = 'Gastada en este turno';
      } else if (key === 'bonus') {
        small.textContent = ts.bonus ? 'Disponible si un rasgo/conjuro la usa' : 'Gastada en este turno';
      } else if (key === 'reaction') {
        small.textContent = ts.reaction ? 'Disponible dentro o fuera del turno' : 'Gastada · vuelve en su próximo turno';
      }
      el.querySelector('i').textContent = available ? '' : '✓';
    });
  }

  function createActionCard({ icon = '✦', typeLabel, title, description, meta, featured = false, exhausted = false, dualIcon = false, onClick, onDelete = null, tooltip = '' }) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `action-card${featured ? ' featured' : ''}${exhausted ? ' exhausted' : ''}`;
    if (tooltip) card.title = tooltip;
    card.innerHTML = `<span class="action-icon${dualIcon ? ' dual' : ''}"></span><span class="action-type"></span><b></b><small></small><span class="action-meta"><span></span><i>↗</i></span>`;
    card.querySelector('.action-icon').textContent = icon;
    card.querySelector('.action-type').textContent = typeLabel;
    card.querySelector('b').textContent = title;
    card.querySelector('small').textContent = description;
    card.querySelector('.action-meta span').textContent = meta;
    card.addEventListener('click', onClick);
    if (onDelete) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'card-delete-btn';
      del.textContent = '×';
      del.title = 'Eliminar acción personalizada';
      del.addEventListener('click', e => { e.stopPropagation(); onDelete(); });
      card.append(del);
    }
    return card;
  }

  function renderActionGroups(c) {
    const movementRoot = $('#movementActions');
    const mainRoot = $('#mainActions');
    const standardRoot = $('#standardActions');
    const bonusRoot = $('#bonusActions');
    const reactionRoot = $('#reactionActions');
    const otherRoot = $('#otherActions');
    const passiveRoot = $('#passiveTraits');

    [movementRoot, mainRoot, standardRoot, bonusRoot, reactionRoot, otherRoot, passiveRoot].forEach(el => el.replaceChildren());

    movementRoot.append(createActionCard({
      icon: '⌁',
      typeLabel: 'MOVIMIENTO',
      title: 'Desplazarse',
      description: `Quedan ${formatMeters(c.turnMovement)} m de ${formatMeters(c.speed || 0)} m. Puede repartirse en el turno.`,
      meta: `Velocidad ${formatMeters(c.speed || 0)} m`,
      exhausted: c.turnMovement <= 0,
      onClick: () => openMovement()
    }));

    const hasExtra = c.turnMaxAttacks > 1;
    const canContinueAttacks = c.turnState.action || (c.attackSequenceOpen && c.turnAttacksRemaining > 0);
    $('#mainActionGroupHint').textContent = hasExtra
      ? `Una por turno · Ataque adicional (${c.turnAttacksRemaining}/${c.turnMaxAttacks} ataques)`
      : 'Una por turno';

    mainRoot.append(createActionCard({
      icon: '⚔',
      typeLabel: hasExtra ? `ACCIÓN · ${c.turnAttacksRemaining}/${c.turnMaxAttacks} ATAQUES` : 'ACCIÓN · ATAQUE',
      title: c.attackSequenceOpen && c.turnAttacksRemaining > 0 ? 'Continuar ataque (Ataque adicional)' : 'Atacar con arma',
      description: 'Muestra los dados físicos exactos a tirar y permite anotar el d20 y daño para descontar PG.',
      meta: c.turnAttacksRemaining > 0 ? 'Ver dados y anotar' : 'Ataques agotados',
      featured: canContinueAttacks,
      exhausted: !canContinueAttacks,
      onClick: () => openActionModal({ name: 'Ataque con arma', kind: 'attack', attackMode: 'normal' })
    }));

    if (hasMellarAccess(c)) {
      const mellarReady = !c.turnNickUsed && c.turnBaseAttackMade && (c.attackSequenceOpen || !c.turnState.action);
      mainRoot.append(createActionCard({
        icon: '⚔',
        dualIcon: true,
        typeLabel: 'MAESTRÍA · MELLAR (NICK)',
        title: 'Ataque ligero adicional',
        description: c.turnNickUsed
          ? 'Mellar ya usado este turno.'
          : c.turnBaseAttackMade
            ? 'Listo: ataque extra con arma ligera con Mellar (no gasta acción adicional).'
            : 'Primero registra un ataque en Atacar para habilitar Mellar.',
        meta: c.turnNickUsed ? 'Usado (1/turno)' : 'No gasta adicional',
        featured: mellarReady,
        exhausted: c.turnNickUsed,
        onClick: () => openActionModal({ name: 'Ataque ligero · Mellar (Nick)', kind: 'attack', attackMode: 'nick' })
      }));
    }

    STANDARD_ACTIONS.forEach(act => {
      standardRoot.append(createActionCard({
        icon: act.icon,
        typeLabel: 'ACCIÓN ESTÁNDAR',
        title: act.name,
        description: act.short,
        meta: act.meta,
        exhausted: !c.turnState.action,
        onClick: () => resolveStandardAction(act)
      }));
    });

    const spellGroups = { action: [], bonus: [], reaction: [], other: [] };
    (c.spells?.names || []).forEach(spell => spellGroups[spellActionType(spell, c)].push(spell));
    const groupContainers = { action: mainRoot, bonus: bonusRoot, reaction: reactionRoot, other: otherRoot };

    Object.entries(spellGroups).forEach(([group, spells]) => {
      if (!spells.length) return;
      const isExhausted = (group === 'action' && !c.turnState.action) ||
        (group === 'bonus' && !c.turnState.bonus) ||
        (group === 'reaction' && !c.turnState.reaction);
      groupContainers[group].append(createActionCard({
        icon: '✧',
        typeLabel: `CONJUROS · ${spells.length} DISPONIBLES`,
        title: 'Lanzar conjuro',
        description: spells.slice(0, 4).join(', ') + (spells.length > 4 ? ` y ${spells.length - 4} más…` : ''),
        meta: 'Elegir conjuro',
        exhausted: isExhausted,
        onClick: () => openSpellPicker(group)
      }));
    });

    if (hasHuntersMark(c)) {
      const marked = c.markedTargetId ? byId(c.markedTargetId) : null;
      const freeUses = useCounter('free-hunters-mark', c);
      bonusRoot.append(createActionCard({
        icon: '◎',
        typeLabel: 'ACCIÓN ADICIONAL · ENEMIGO PREDILECTO',
        title: marked ? `Marca del cazador (${marked.name})` : 'Marca del cazador',
        description: marked
          ? marked.hp <= 0
            ? `${marked.name} cayó a 0 PG. Traslada la marca gratis con su acción adicional.`
            : `Activa sobre ${marked.name} (+1d6 sumado automáticamente a los dados físicos).`
          : `Marca a un enemigo para añadir +1d6 a los dados de daño. Gratis: ${freeUses ? `${freeUses.remaining}/${freeUses.max}` : '—'}.`,
        meta: 'Concentración · +1d6',
        featured: !marked && c.turnState.bonus,
        exhausted: !c.turnState.bonus && (!marked || marked.hp <= 0),
        onClick: () => openActionModal({ name: 'Marca del cazador', kind: 'spell', isMark: true })
      }));
    }

    if (hasFeature(c, /^furia$/i)) {
      const rageCounter = useCounter('rage', c);
      bonusRoot.append(createActionCard({
        icon: '🔥',
        typeLabel: 'ACCIÓN ADICIONAL · BÁRBARO',
        title: c.raging ? 'Terminar Furia' : 'Entrar en Furia',
        description: c.raging
          ? 'Furia activa (+2 daño cuerpo a cuerpo con Fuerza y resistencia física).'
          : `Activa Furia como acción adicional (${rageCounter ? `${rageCounter.remaining}/${rageCounter.max} usos` : ''}).`,
        meta: c.raging ? 'Activa ahora' : 'Gasta 1 uso',
        featured: !c.raging && c.turnState.bonus,
        exhausted: !c.raging && (!c.turnState.bonus || (rageCounter && rageCounter.remaining <= 0)),
        onClick: () => toggleRage(c)
      }));
    }

    if (hasFeature(c, /acción astuta/i)) {
      bonusRoot.append(createActionCard({
        icon: '⚡',
        typeLabel: 'ACCIÓN ADICIONAL · PÍCARO',
        title: 'Acción astuta: Correr / Destrabarse / Esconderse',
        description: 'Correr (+velocidad), Destrabarse o Esconderse (1×d20 + Sigilo).',
        meta: 'Usa acción adicional',
        exhausted: !c.turnState.bonus,
        onClick: () => openActionModal({ name: 'Acción astuta', kind: 'bonus', cunningAction: true })
      }));
    }

    if (hasFeature(c, /puntería certera/i)) {
      bonusRoot.append(createActionCard({
        icon: '◎',
        typeLabel: 'ACCIÓN ADICIONAL · PÍCARO',
        title: 'Puntería certera',
        description: c.turnMoved
          ? 'Ya se movió este turno; requiere no haberse movido.'
          : 'Velocidad a 0 m este turno y ventaja en su próximo ataque.',
        meta: c.turnMoved ? 'No disponible' : 'Ventaja próximo ataque',
        exhausted: !c.turnState.bonus || c.turnMoved || c.steadyAimActive,
        onClick: () => activateSteadyAim(c)
      }));
    }

    if (hasHealingPotion(c)) {
      bonusRoot.append(createActionCard({
        icon: '✚',
        typeLabel: 'ACCIÓN ADICIONAL · CONSUMIBLE',
        title: 'Poción de curación',
        description: 'Tira 2×d4 + 2 físicos y anota la curación para sumarla a sus PG.',
        meta: '2 dados físicos (2d4+2)',
        exhausted: !c.turnState.bonus,
        onClick: () => openActionModal({ name: 'Poción de curación', kind: 'bonus', isPotion: true })
      }));
    }

    if (hasLightWeapons(c)) {
      bonusRoot.append(createActionCard({
        icon: '⚔',
        dualIcon: true,
        typeLabel: 'ACCIÓN ADICIONAL · ARMA LIGERA',
        title: 'Ataque con mano secundaria',
        description: 'Tras atacar con un arma ligera, ataque extra con otra arma ligera.',
        meta: 'Usa acción adicional',
        exhausted: !c.turnState.bonus,
        onClick: () => openActionModal({ name: 'Ataque con mano secundaria', kind: 'attack', attackMode: 'offhand' })
      }));
    }

    reactionRoot.append(createActionCard({
      icon: 'ϟ',
      typeLabel: 'REACCIÓN · COMBATE',
      title: 'Ataque de oportunidad',
      description: 'Cuando un enemigo sale de su alcance sin Destrabarse, 1 ataque cuerpo a cuerpo.',
      meta: c.turnState.reaction ? 'Disponible' : 'Reacción gastada',
      exhausted: !c.turnState.reaction,
      onClick: () => openActionModal({ name: 'Ataque de oportunidad', kind: 'attack', attackMode: 'opportunity' })
    }));

    const alreadyHandled = new Set(['marca del cazador', 'ataque adicional', 'ataque temerario', 'furia', 'acción astuta', 'puntería certera']);
    const seen = new Set();
    [...(c.features || []), ...(c.feats || [])].forEach(name => {
      if (!name) return;
      const lower = name.toLowerCase();
      if (seen.has(lower) || alreadyHandled.has(lower)) return;
      seen.add(lower);

      const group = featureActivity(name);
      if (group === 'passive') {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'passive-trait';
        pill.textContent = name;
        pill.title = featureDescription(name, c);
        pill.addEventListener('click', () => toast(`${name}: ${featureDescription(name, c)}`));
        passiveRoot.append(pill);
      } else {
        groupContainers[group].append(createActionCard({
          icon: '✦',
          typeLabel: 'RASGO ACTIVABLE',
          title: name,
          description: featureHint(name),
          meta: group === 'bonus' ? 'Acción adicional' : group === 'reaction' ? 'Reacción' : 'Acción',
          exhausted: !c.turnState[group],
          tooltip: featureDescription(name, c),
          onClick: () => openActionModal({ name, kind: group, isFeature: true })
        }));
      }
    });

    (c.customActions || []).forEach(custom => {
      if (custom.kind === 'passive') {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'passive-trait';
        pill.textContent = `${custom.name} ×`;
        pill.addEventListener('click', () => {
          if (confirm(`¿Quitar el rasgo personalizado «${custom.name}»?`)) {
            c.customActions = c.customActions.filter(x => x.id !== custom.id);
            saveState();
            renderActionGroups(c);
          }
        });
        passiveRoot.append(pill);
        return;
      }
      const container = groupContainers[custom.kind] || mainRoot;
      container.append(createActionCard({
        icon: '✧',
        typeLabel: 'ACCIÓN PERSONALIZADA',
        title: custom.name,
        description: custom.description || 'Opción personalizada guardada en esta ficha.',
        meta: custom.dice ? `Dados: ${custom.dice}` : `Usa ${custom.kind === 'bonus' ? 'acción adicional' : custom.kind === 'reaction' ? 'reacción' : 'acción'}`,
        exhausted: !c.turnState[custom.kind],
        onClick: () => openActionModal({ name: custom.name, kind: custom.kind, customDice: custom.dice, customDesc: custom.description }),
        onDelete: () => {
          c.customActions = c.customActions.filter(x => x.id !== custom.id);
          saveState();
          renderActionGroups(c);
          toast(`Acción «${custom.name}» eliminada`);
        }
      }));
    });

    $$('.action-group').forEach(group => {
      const key = group.dataset.actionGroup;
      const items = group.querySelector('.action-grid, .passive-traits');
      const empty = !items || !items.children.length;
      group.hidden = !['movement', 'action'].includes(key) && empty;
    });
  }

  function renderTargets() {
    const root = $('#targetList');
    root.replaceChildren();
    const v = viewed();
    const others = state.combatants.filter(c => c.id !== v?.id);

    if (!others.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-targets';
      empty.textContent = 'Añade un adversario para empezar el encuentro.';
      root.append(empty);
      return;
    }

    others.forEach(c => {
      const wrap = document.createElement('div');
      wrap.className = 'target-wrapper';

      const isMarkedByViewed = v && v.markedTargetId === c.id;
      const markedByAny = state.combatants.find(x => x.markedTargetId === c.id);

      const row = document.createElement('button');
      row.type = 'button';
      row.className = `target-row${c.id === state.currentTargetId ? ' selected' : ''}${c.defeated ? ' defeated' : ''}`;

      const token = document.createElement('span');
      token.className = `target-token${c.type === 'enemy' ? '' : ' ally'}`;
      if (c.avatar) {
        const img = document.createElement('img');
        img.src = c.avatar;
        img.alt = c.name;
        img.onerror = () => { img.remove(); token.textContent = c.name.slice(0, 1).toUpperCase(); };
        token.append(img);
      } else {
        token.textContent = c.name.slice(0, 1).toUpperCase();
      }

      const name = document.createElement('span');
      name.className = 'target-name';
      name.innerHTML = '<b></b><small></small>';
      name.querySelector('b').textContent = c.name;
      name.querySelector('small').textContent = `${c.type === 'enemy' ? 'Adversario' : c.species || 'Aliado'} · CA ${c.ac ?? '—'}`;

      const hp = document.createElement('span');
      hp.className = `target-hp${isMarkedByViewed || markedByAny ? ' marked' : ''}`;
      hp.innerHTML = '<i></i><small></small>';
      hp.querySelector('i').textContent = `${c.hp}/${c.maxHp} PG`;

      let subStatus = 'Sin marca';
      if (isMarkedByViewed) subStatus = '◎ Marca activa (+1d6)';
      else if (markedByAny) subStatus = `◎ Marca de ${markedByAny.name}`;
      else if (c.defeated || c.hp <= 0) subStatus = 'Fuera de combate';
      else if (c.hp < c.maxHp) subStatus = 'Herido';
      hp.querySelector('small').textContent = subStatus;

      row.append(token, name, hp);
      row.addEventListener('click', () => {
        state.currentTargetId = c.id;
        saveState();
        renderTargets();
        toast(`${c.name} seleccionado como objetivo`);
      });
      wrap.append(row);

      // Proportional HP bar
      const bar = document.createElement('div');
      bar.className = 'target-hp-bar';
      const pct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
      const fill = document.createElement('i');
      fill.style.width = `${pct}%`;
      const cls = hpClass(c.hp, c.maxHp);
      if (cls) fill.className = cls;
      bar.append(fill);
      wrap.append(bar);

      // DM quick HP & enemy controls
      const sub = document.createElement('div');
      sub.className = 'target-subcontrols';
      const hpBtns = document.createElement('div');
      hpBtns.className = 'target-hp-mini';

      const makeMini = (txt, title, fn, clsBtn = '') => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = txt;
        b.title = title;
        if (clsBtn) b.className = clsBtn;
        b.addEventListener('click', e => { e.stopPropagation(); fn(); });
        return b;
      };

      hpBtns.append(
        makeMini('-5', 'Restar 5 PG', () => adjustHp(c, -5, 'Ajuste DM')),
        makeMini('-1', 'Restar 1 PG', () => adjustHp(c, -1, 'Ajuste DM')),
        makeMini('±', 'Daño o curación exacta', () => openHpDialog(c.id)),
        makeMini('+1', 'Sumar 1 PG', () => adjustHp(c, 1, 'Curación DM'))
      );

      if (c.type === 'enemy') {
        hpBtns.append(makeMini('🔍', 'Buscar imagen en Google', () => window.open(googleImagesUrl(c.name), '_blank', 'noopener')));
      }
      hpBtns.append(makeMini('✕', c.type === 'enemy' ? 'Eliminar adversario' : 'Eliminar personaje', () => removeCombatant(c.id), 'remove-enemy-btn'));
      sub.append(hpBtns);

      if (c.type === 'enemy') {
        const label = document.createElement('label');
        label.className = 'enemy-defeated';
        label.innerHTML = '<input type="checkbox"><span>Derrotado</span>';
        const chk = label.querySelector('input');
        chk.checked = !!c.defeated;
        chk.addEventListener('change', e => {
          c.defeated = e.target.checked;
          if (c.defeated) c.hp = 0;
          else if (c.hp <= 0) c.hp = 1;
          saveState();
          renderAll();
        });
        sub.append(label);
      }

      wrap.append(sub);
      root.append(wrap);
    });
  }

  function renderLimitedUses() {
    const c = viewed();
    if (!c) return;
    ensureUseCounters(c);
    const root = $('#limitedUsesList');
    root.replaceChildren();

    if (!c.limitedUses.length) {
      const empty = document.createElement('p');
      empty.className = 'uses-empty';
      empty.textContent = 'Sin contadores de ficha. Pulsa ＋ para añadir uno.';
      root.append(empty);
      return;
    }

    c.limitedUses.forEach(counter => {
      const row = document.createElement('div');
      row.className = 'limited-use-row';

      const info = document.createElement('span');
      info.innerHTML = '<b></b><small></small>';
      info.querySelector('b').textContent = counter.name;
      info.querySelector('small').textContent =
        counter.reset === 'short'
          ? counter.shortRestore ? `Descanso corto (+${counter.shortRestore}) / largo (todos)` : 'Descanso corto'
          : counter.reset === 'either' ? 'Descanso corto o largo'
            : counter.reset === 'never' ? 'Manual' : 'Descanso largo';

      const controls = document.createElement('span');
      controls.className = 'use-controls';

      const spend = document.createElement('button');
      spend.type = 'button'; spend.textContent = '−'; spend.disabled = counter.remaining <= 0;
      const value = document.createElement('b');
      value.className = 'use-count'; value.textContent = `${counter.remaining}/${counter.max}`;
      const restore = document.createElement('button');
      restore.type = 'button'; restore.textContent = '+'; restore.disabled = counter.remaining >= counter.max;

      spend.addEventListener('click', () => { counter.remaining = Math.max(0, counter.remaining - 1); saveState(); renderLimitedUses(); renderActionGroups(c); });
      restore.addEventListener('click', () => { counter.remaining = Math.min(counter.max, counter.remaining + 1); saveState(); renderLimitedUses(); renderActionGroups(c); });

      controls.append(spend, value, restore);
      row.append(info, controls);

      if (counter.custom) {
        const remove = document.createElement('button');
        remove.type = 'button'; remove.className = 'remove-use'; remove.textContent = '×';
        remove.addEventListener('click', () => { c.limitedUses = c.limitedUses.filter(x => x !== counter); saveState(); renderLimitedUses(); });
        row.append(remove);
      }
      root.append(row);
    });
  }

  function renderAll() {
    renderTopAndSidebar();
    renderInitiative();
    renderInspectBanner();
    renderCharacter();
    renderTargets();
    renderLimitedUses();
    renderLog();
    renderPhysicalDicePool();
    renderMapView();
  }

  // =========================================================================
  // TURN MANAGEMENT
  // =========================================================================
  function inspectCombatant(id) {
    if (!byId(id)) return;
    state.viewedId = id;
    if (!state.currentTargetId || state.currentTargetId === id || !byId(state.currentTargetId)) {
      state.currentTargetId = state.combatants.find(c => c.id !== id && !c.defeated)?.id ||
        state.combatants.find(c => c.id !== id)?.id || null;
    }
    saveState();
    renderAll();
  }

  function advanceToTurn(id, { log = true, restore = true } = {}) {
    const c = byId(id);
    if (!c) return;
    state.activeTurnId = id;
    state.viewedId = id;
    if (restore || !c.turnState) freshTurn(c);
    if (!state.currentTargetId || state.currentTargetId === id || !byId(state.currentTargetId)) {
      state.currentTargetId = state.combatants.find(x => x.id !== id && !x.defeated)?.id ||
        state.combatants.find(x => x.id !== id)?.id || null;
    }
    saveState();
    renderAll();
    if (log) addLog(c.name, 'comienza su turno', `Ronda ${state.round} · recursos y movimiento (${formatMeters(c.speed)} m) restaurados`, '✦');
    toast(`Turno de ${c.name} (Ronda ${state.round})`);
  }

  function nextTurn() {
    if (!state.combatants.length) return;
    const currentIdx = state.combatants.findIndex(c => c.id === state.activeTurnId);
    const total = state.combatants.length;
    let nextIdx = currentIdx;
    let wrapped = false;

    for (let step = 1; step <= total; step++) {
      const candidate = (currentIdx + step) % total;
      if (candidate === 0) wrapped = true;
      if (!state.skipDefeated || !state.combatants[candidate].defeated) {
        nextIdx = candidate;
        break;
      }
    }
    if (wrapped) state.round++;
    advanceToTurn(state.combatants[nextIdx].id, { log: true, restore: true });
  }

  // =========================================================================
  // CLASS & STANDARD ACTIONS
  // =========================================================================
  function toggleRage(c) {
    if (c.raging) {
      c.raging = false;
      addLog(c.name, 'termina su Furia', 'Bonificador desactivado', '◌');
      saveState(); renderAll(); toast(`${c.name} termina su Furia`); return;
    }
    if (!c.turnState.bonus) { toast('Ya gastó su Acción adicional este turno'); return; }
    const counter = useCounter('rage', c);
    if (counter && counter.remaining <= 0) { toast('No quedan usos de Furia'); return; }
    if (counter) counter.remaining--;
    c.raging = true;
    c.turnState.bonus = false;
    addLog(c.name, 'entra en Furia', `+${getRageDamageBonus(c)} daño cuerpo a cuerpo con Fuerza y resistencia física`, '🔥');
    saveState(); renderAll(); toast(`${c.name} entra en Furia (+${getRageDamageBonus(c)} daño)`);
  }

  function activateSteadyAim(c) {
    if (!c.turnState.bonus) { toast('Ya gastó su Acción adicional este turno'); return; }
    if (c.turnMoved) { toast('Puntería certera requiere no haberse movido este turno'); return; }
    c.turnState.bonus = false;
    c.turnMovement = 0;
    c.turnState.movement = false;
    c.steadyAimActive = true;
    addLog(c.name, 'usa Puntería certera', 'Velocidad 0 m este turno · ventaja en su próximo ataque', '◎');
    saveState(); renderAll(); toast('Puntería certera activa');
  }

  function resolveStandardAction(act) {
    const c = viewed();
    if (!c.turnState.action) { toast('Ya gastó su Acción este turno'); return; }
    if (act.id === 'std-hide') { openActionModal({ name: 'Esconderse (Hide)', kind: 'action', isHide: true }); return; }

    c.turnState.action = false;
    const speed = Number(c.speed) || 9;
    if (act.id === 'std-dash') {
      c.turnMovement = Math.round((c.turnMovement + speed) * 10) / 10;
      c.turnState.movement = c.turnMovement > 0;
      addLog(c.name, 'usa Correr (Dash)', `Suma +${formatMeters(speed)} m · quedan ${formatMeters(c.turnMovement)} m`, '⚡');
      toast(`Correr: +${formatMeters(speed)} m`);
    } else if (act.id === 'std-disengage') {
      if (!c.conditions.includes('Destrabado')) c.conditions.push('Destrabado');
      addLog(c.name, 'usa Destrabarse', 'Sin ataques de oportunidad este turno', '↺');
      toast(`${c.name} se destraba`);
    } else if (act.id === 'std-dodge') {
      if (!c.conditions.includes('Esquivando')) c.conditions.push('Esquivando');
      addLog(c.name, 'usa Esquivar', 'Desventaja en ataques contra él hasta su próximo turno', '⛨');
      toast(`${c.name} está Esquivando`);
    } else if (act.id === 'std-ready') {
      if (!c.conditions.includes('Preparando acción')) c.conditions.push('Preparando acción');
      addLog(c.name, 'prepara una acción (Ready)', 'Usará su Reacción al cumplirse el desencadenante', '⧗');
      toast(`${c.name} prepara una acción`);
    } else {
      addLog(c.name, act.name, act.short, act.icon);
      toast(`${act.name} registrada`);
    }
    saveState(); renderAll();
  }

  // =========================================================================
  // ACTION MODAL (PHYSICAL DICE QUANTITIES + RESULT ENTRY)
  // =========================================================================
  function populateTargetOptions(includeSelf = false) {
    const sel = $('#targetSelect');
    sel.replaceChildren();
    const v = viewed();
    const list = includeSelf ? state.combatants : state.combatants.filter(c => c.id !== v.id);
    list.forEach(c => {
      const marked = v.markedTargetId === c.id;
      sel.add(new Option(`${c.name}${c.id === v.id ? ' (propio)' : ''} · CA ${c.ac ?? '—'} · ${c.hp}/${c.maxHp} PG${marked ? ' · MARCADO' : ''}${c.defeated ? ' · DERROTADO' : ''}`, c.id));
    });
    if (includeSelf && list.some(c => c.id === v.id)) sel.value = v.id;
    else if (state.currentTargetId && list.some(c => c.id === state.currentTargetId)) sel.value = state.currentTargetId;
  }

  function populateWeaponOptions(attackMode) {
    const c = viewed();
    const sel = $('#weaponSelect');
    sel.replaceChildren();
    const all = (c.weapons || []).filter(w => w.attack != null);
    let filtered = all;
    if (attackMode === 'nick') filtered = all.filter(w => /mellar/i.test(w.mastery || ''));
    else if (attackMode === 'offhand') filtered = all.filter(w => (w.tags || []).some(t => /ligera/i.test(t)));
    else if (attackMode === 'opportunity') { filtered = all.filter(w => !w.range); if (!filtered.length) filtered = all; }
    currentWeaponOptions = filtered;
    filtered.forEach((w, i) => sel.add(new Option(`${w.name} · ${signed(w.attack)} · ${w.damage} ${w.type || ''}${w.mastery ? ` · ${w.mastery}` : ''}`, String(i))));
    if (!filtered.length) sel.add(new Option('Sin armas compatibles', ''));
    return filtered;
  }

  function selectedWeapon() {
    const idx = Number($('#weaponSelect').value);
    return Number.isFinite(idx) ? currentWeaponOptions[idx] || null : null;
  }

  function populateSpellSlotOptions(spellName, c) {
    const sel = $('#spellSlotSelect');
    sel.replaceChildren();
    const meta = getSpellMeta(spellName);
    if (meta.level === 0) { sel.add(new Option('Truco (no gasta espacio)', 'cantrip')); return; }
    if (/marca del cazador/i.test(spellName)) {
      const free = useCounter('free-hunters-mark', c);
      if (free && free.remaining > 0) sel.add(new Option(`Uso gratuito · Enemigo predilecto (${free.remaining}/${free.max})`, 'free-hunters-mark'));
    }
    (c.limitedUses || []).filter(u => /^spell-slot-(\d+)$/.test(u.key)).forEach(u => {
      const slotLvl = Number(u.key.match(/^spell-slot-(\d+)$/)[1]);
      if (slotLvl >= meta.level) {
        const opt = new Option(`Espacio nivel ${slotLvl} (${u.remaining}/${u.max} restantes)`, u.key);
        if (u.remaining <= 0) opt.disabled = true;
        sel.add(opt);
      }
    });
    if (meta.ritual || c.spells?.castingTimes?.[spellName]) sel.add(new Option('Lanzar como ritual (sin gastar espacio)', 'ritual'));
    sel.add(new Option('No descontar espacio (solo registrar)', 'none'));
    const first = [...sel.options].find(o => !o.disabled);
    if (first) sel.value = first.value;
  }

  function setRollMode(mode) {
    rollMode = mode;
    $$('#rollModeGroup button').forEach(btn => btn.classList.toggle('active', btn.dataset.rollMode === mode));
    updatePhysicalActionCards();
  }

  function openSpellPicker(group) {
    const c = viewed();
    const spells = (c.spells?.names || []).filter(name => spellActionType(name, c) === group);
    $('#spellPickerTitle').textContent = `Conjuros · ${group === 'bonus' ? 'acción adicional' : group === 'reaction' ? 'reacción' : group === 'other' ? 'ritual o lanzamiento largo' : 'acción'}`;
    const list = $('#spellPickerList');
    list.replaceChildren();
    spells.forEach(name => {
      const meta = getSpellMeta(name);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'spell-picker-option';
      btn.innerHTML = '<b></b><small></small><span>Elegir →</span>';
      btn.querySelector('b').textContent = `${name}${meta.level === 0 ? ' (Truco)' : ` (Nv. ${meta.level})`}${meta.concentration ? ' · Conc.' : ''}`;
      btn.querySelector('small').textContent = meta.desc;
      btn.addEventListener('click', () => {
        closeDialog(dialogs.spellPicker);
        openActionModal({ name, kind: 'spell', isMark: /marca del cazador/i.test(name) });
      });
      list.append(btn);
    });
    openDialog(dialogs.spellPicker);
  }

  function openActionModal(actionCfg) {
    const c = viewed();
    const { name, kind, attackMode, isMark, isPotion, isHide, cunningAction, customDice, customDesc } = actionCfg;
    const isAttack = kind === 'attack';

    if (isAttack) {
      if (attackMode === 'opportunity' && !c.turnState.reaction) { toast('Ya gastó su Reacción'); return; }
      if (attackMode === 'offhand' && !c.turnState.bonus) { toast('Ya gastó su Acción adicional'); return; }
      if (attackMode === 'nick') {
        if (c.turnNickUsed) { toast('Mellar ya usado este turno (máx. 1/turno)'); return; }
        if (!c.turnBaseAttackMade) { toast('Primero registra un ataque en Atacar para habilitar Mellar'); return; }
      }
      if (!attackMode || attackMode === 'normal') {
        if (!c.turnState.action && !(c.attackSequenceOpen && c.turnAttacksRemaining > 0)) { toast('Ya gastó su Acción este turno'); return; }
        if (c.turnAttacksRemaining <= 0) { toast('Ya resolvió todos los ataques de esta acción'); return; }
      }
    } else if (!isMark) {
      const resKey = kind === 'spell' ? spellActionType(name, c) : kind;
      if (['action', 'bonus', 'reaction'].includes(resKey) && !c.turnState[resKey]) {
        toast(`${resKey === 'bonus' ? 'Acción adicional' : resKey === 'reaction' ? 'Reacción' : 'Acción'} ya gastada este turno`);
        return;
      }
      const limKey = limitedUseKeyFor(name);
      const limCounter = limKey ? useCounter(limKey, c) : null;
      if (limCounter && limCounter.remaining <= 0) { toast(`${name}: no quedan usos`); return; }
    }

    currentAction = { ...actionCfg };

    $('#dialogTitle').textContent = name;
    $('#resolveAction').disabled = false;
    $('#cancelMarkBtn').hidden = true;
    $('#spellSlotField').hidden = true;
    $('#rollModeField').hidden = !isAttack;
    $('#weaponField').hidden = !isAttack;
    $('#targetField').hidden = !isAttack && !isMark && kind !== 'spell' && !isPotion;
    $('#physicalActionCards').hidden = true;
    $('#physicalAttackCard').hidden = true;
    $('#physicalDamageCard').hidden = true;
    $('#physicalAtkInput').value = '';
    $('#physicalDmgInput').value = '';
    $('#attackVerdictBadge').textContent = 'Sin anotar';
    $('#attackVerdictBadge').className = 'hit-verdict';

    ['#recklessToggle', '#rageDamageToggle', '#frenzyToggle', '#dreadToggle', '#sneakToggle', '#critToggle'].forEach(sel => { $(sel).hidden = true; });
    $('#critDamageCheck').checked = false;

    if (isAttack) {
      const kickerMap = {
        nick: 'PARTE DE ATACAR · MELLAR (NICK)',
        offhand: 'ACCIÓN ADICIONAL · MANO SECUNDARIA',
        opportunity: 'REACCIÓN · ATAQUE DE OPORTUNIDAD',
        normal: `ACCIÓN · ATACAR (${c.turnAttacksRemaining}/${c.turnMaxAttacks})`
      };
      $('#dialogKicker').textContent = kickerMap[attackMode] || 'ACCIÓN · ATACAR';
      $('#dialogDesc').textContent = 'Indica al jugador los dados físicos a tirar y anota aquí el d20 y el daño obtenido.';

      populateWeaponOptions(attackMode);
      populateTargetOptions(false);
      setRollMode(c.turnRecklessActive || c.steadyAimActive ? 'advantage' : 'normal');

      const hasReckless = hasFeature(c, /ataque temerario/i) && attackMode !== 'opportunity';
      $('#recklessToggle').hidden = !hasReckless;
      $('#recklessAttack').checked = !!c.turnRecklessActive;
      $('#recklessAttack').disabled = !!c.turnRecklessActive;

      $('#rageDamageToggle').hidden = !hasFeature(c, /^furia$/i);
      $('#rageDamageCheck').checked = !!c.raging;

      $('#frenzyToggle').hidden = !hasFeature(c, /frenes[ií]/i);
      $('#frenzyCheck').checked = !!(c.raging && c.turnRecklessActive && !c.turnFrenzyUsed);
      $('#frenzyCheck').disabled = !!c.turnFrenzyUsed;

      const dreadCounter = useCounter('dreadful-strike', c);
      $('#dreadToggle').hidden = !dreadCounter;
      $('#dreadDamage').checked = false;
      $('#dreadDamage').disabled = !dreadCounter || dreadCounter.remaining <= 0 || !!c.turnDreadUsed;
      if (dreadCounter) {
        $('#dreadToggle small').textContent = c.turnDreadUsed
          ? 'Ya usado este turno (máximo 1/turno)'
          : `+2d6 psíquico · ${dreadCounter.remaining}/${dreadCounter.max} usos restantes`;
      }

      const canSneak = hasSneakAttack(c);
      $('#sneakToggle').hidden = !canSneak;
      $('#sneakDamage').checked = false;
      $('#sneakDamage').disabled = !!c.turnSneakUsed;
      if (canSneak) {
        const n = getSneakDiceCount(c);
        $('#sneakToggle b').textContent = `Ataque furtivo (+${n}d6 · 1/turno)`;
        $('#sneakToggle small').textContent = c.turnSneakUsed ? 'Ya usado este turno' : 'Con arma sutil o a distancia si tiene ventaja o aliado a 1,5 m.';
      }

      $('#critToggle').hidden = false;
      $('#physicalAtkInputLabel').textContent = 'Anota el d20 físico natural (1–20):';
      $('#physicalDmgInputLabel').textContent = 'Anota el daño físico total (se restará de los PG del objetivo):';
      $('#resolveAction').innerHTML = 'Registrar ataque <span>✓</span>';
      updatePhysicalActionCards();
    } else if (isMark) {
      $('#dialogKicker').textContent = 'ACCIÓN ADICIONAL · MARCA DEL CAZADOR';
      populateTargetOptions(false);
      populateSpellSlotOptions('Marca del cazador', c);
      const oldTarget = c.markedTargetId ? byId(c.markedTargetId) : null;
      if (oldTarget && oldTarget.hp > 0) {
        $('#dialogDesc').textContent = `Tiene marcada a ${oldTarget.name}. Puedes soltarla o cambiarla gastando un uso/espacio.`;
        $('#spellSlotField').hidden = false;
        $('#cancelMarkBtn').hidden = false;
        $('#resolveAction').innerHTML = 'Cambiar Marca <span>✓</span>';
      } else if (oldTarget && oldTarget.hp <= 0) {
        $('#dialogDesc').textContent = `${oldTarget.name} cayó a 0 PG. Traslada la marca gratis con su acción adicional.`;
        $('#cancelMarkBtn').hidden = false;
        $('#resolveAction').innerHTML = 'Trasladar Marca gratis <span>✓</span>';
      } else {
        $('#dialogDesc').textContent = 'Elige objetivo: sus ataques contra él añadirán automáticamente +1d6 en los dados físicos.';
        $('#spellSlotField').hidden = false;
        $('#resolveAction').innerHTML = 'Confirmar Marca <span>✓</span>';
      }
      if (!c.turnState.bonus) $('#resolveAction').disabled = true;
    } else if (isPotion) {
      $('#dialogKicker').textContent = 'ACCIÓN ADICIONAL · POCIÓN DE CURACIÓN';
      $('#dialogDesc').textContent = 'Tira 2×d4 + 2 físicos en la mesa y anota el total para sumarlo a los PG.';
      populateTargetOptions(true);
      $('#physicalActionCards').hidden = false;
      $('#physicalDamageCard').hidden = false;
      $('#n20DamageLabel').textContent = 'DADOS FÍSICOS DE CURACIÓN';
      $('#n20DamageFormula').textContent = '2d4+2';
      $('#n20DamageQty').textContent = '2 dados físicos';
      $('#n20DamageSub').textContent = '2 × d4 (+2) · Poción de curación';
      $('#physicalDmgInputLabel').textContent = 'Anota la curación total obtenida (se sumará a PG):';
      $('#resolveAction').innerHTML = 'Registrar curación <span>✚</span>';
    } else if (isHide) {
      const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
      $('#dialogKicker').textContent = 'ACCIÓN · ESCONDERSE (SIGILO)';
      $('#dialogDesc').textContent = 'Tira 1×d20 físico + Sigilo (CD 15 en D&D 2024 para quedar Oculto) y anota el d20.';
      $('#physicalActionCards').hidden = false;
      $('#physicalAttackCard').hidden = false;
      $('#n20AttackLabel').textContent = 'PRUEBA DE SIGILO (DADO FÍSICO)';
      $('#n20AttackFormula').textContent = `1d20${signed(stealth)}`;
      $('#n20AttackQty').textContent = '1 dado físico';
      $('#n20AttackSub').textContent = `1 × d20 (${signed(stealth)}) · CD 15`;
      $('#physicalAtkInputLabel').textContent = 'Anota el d20 físico natural (1–20):';
      $('#resolveAction').innerHTML = 'Registrar Esconderse <span>✓</span>';
    } else if (cunningAction) {
      $('#dialogKicker').textContent = 'ACCIÓN ADICIONAL · ACCIÓN ASTUTA';
      $('#dialogDesc').textContent = 'Elige qué acción astuta realiza:';
      $('#spellSlotField').hidden = false;
      const sel = $('#spellSlotSelect');
      sel.replaceChildren();
      sel.add(new Option('Correr (+velocidad al movimiento)', 'dash'));
      sel.add(new Option('Destrabarse (sin ataques de oportunidad)', 'disengage'));
      sel.add(new Option('Esconderse (1×d20 + Sigilo)', 'hide'));
      updatePhysicalActionCards();
      $('#resolveAction').innerHTML = 'Registrar Acción astuta <span>✓</span>';
    } else if (kind === 'spell') {
      const meta = getSpellMeta(name);
      const actType = spellActionType(name, c);
      $('#dialogKicker').textContent = `CONJURO NV. ${meta.level} · ${actType === 'bonus' ? 'ACCIÓN ADICIONAL' : actType === 'reaction' ? 'REACCIÓN' : actType === 'other' ? 'RITUAL / LARGO' : 'ACCIÓN'}`;
      let desc = `${meta.desc} (CD ${c.spells?.saveDc ?? '—'} · Ataque ${signed(c.spells?.attack || 0)}).`;
      if (meta.concentration && c.concentration && c.concentration.spell !== name) desc += ` ⚠ Perderá concentración en ${c.concentration.spell}.`;
      $('#dialogDesc').textContent = desc;
      populateTargetOptions(!!meta.heal);
      $('#spellSlotField').hidden = false;
      populateSpellSlotOptions(name, c);

      if (meta.attack || meta.damage || meta.heal) {
        $('#physicalActionCards').hidden = false;
        if (meta.attack) {
          $('#physicalAttackCard').hidden = false;
          $('#n20AttackLabel').textContent = 'ATAQUE DE CONJURO (DADO FÍSICO)';
          $('#n20AttackFormula').textContent = `1d20${signed(c.spells?.attack || 0)}`;
          $('#n20AttackQty').textContent = '1 dado físico';
          $('#n20AttackSub').textContent = `1 × d20 (${signed(c.spells?.attack || 0)})`;
          $('#physicalAtkInputLabel').textContent = 'Anota el d20 físico natural (1–20):';
        }
        if (meta.damage || meta.heal) {
          const castAbility = c.className.includes('Bardo') ? 'Car' : c.className.includes('Mago') ? 'Int' : 'Sab';
          const info = meta.heal
            ? analyzeDiceExpressions([meta.heal, String(getAbilityMod(c, castAbility))])
            : analyzeDiceExpressions([meta.damage]);
          $('#physicalDamageCard').hidden = false;
          $('#n20DamageLabel').textContent = meta.heal ? 'DADOS FÍSICOS DE CURACIÓN' : 'DADOS FÍSICOS DE DAÑO DEL CONJURO';
          $('#n20DamageFormula').textContent = info.formula;
          $('#n20DamageQty').textContent = `${info.totalDice} ${info.totalDice === 1 ? 'dado físico' : 'dados físicos'}`;
          $('#n20DamageSub').textContent = `${info.breakdown}${meta.dmgType ? ` · ${meta.dmgType}` : ''}`;
          $('#physicalDmgInputLabel').textContent = meta.heal
            ? 'Anota la curación total obtenida (se sumará a PG):'
            : 'Anota el daño físico total (si impactó / falló salv., se restará de PG):';
        }
      }
      $('#resolveAction').innerHTML = 'Registrar conjuro <span>✓</span>';
    } else {
      $('#dialogKicker').textContent = kind === 'bonus' ? 'ACCIÓN ADICIONAL' : kind === 'reaction' ? 'REACCIÓN' : 'ACCIÓN';
      $('#dialogDesc').textContent = customDesc || featureDescription(name, c);
      if (customDice) {
        const info = analyzeDiceExpressions([customDice]);
        $('#physicalActionCards').hidden = false;
        $('#physicalDamageCard').hidden = false;
        $('#n20DamageLabel').textContent = 'DADOS FÍSICOS A TIRAR';
        $('#n20DamageFormula').textContent = info.formula;
        $('#n20DamageQty').textContent = `${info.totalDice} ${info.totalDice === 1 ? 'dado físico' : 'dados físicos'}`;
        $('#n20DamageSub').textContent = info.breakdown;
        $('#physicalDmgInputLabel').textContent = 'Anota el resultado total obtenido:';
      }
      $('#resolveAction').innerHTML = 'Registrar actividad <span>✓</span>';
    }

    openDialog(dialogs.action);
  }

  function buildDamageSpec(c, weapon, target) {
    const terms = [weapon.damage];
    const tags = [`${weapon.name} (${weapon.damage})`];
    const markExtra = target && c.markedTargetId === target.id;
    const dreadExtra = !c.turnDreadUsed && $('#dreadDamage').checked && (useCounter('dreadful-strike', c)?.remaining || 0) > 0;
    const sneakExtra = !c.turnSneakUsed && $('#sneakDamage').checked && isSneakEligibleWeapon(weapon);
    const rageExtra = $('#rageDamageCheck').checked && isMeleeStrengthWeapon(weapon);
    const frenzyExtra = !c.turnFrenzyUsed && $('#frenzyCheck').checked && c.raging && ($('#recklessAttack').checked || c.turnRecklessActive) && isMeleeStrengthWeapon(weapon);
    const critical = $('#critDamageCheck').checked;

    if (markExtra) { terms.push('1d6'); tags.push('Marca +1d6'); }
    if (dreadExtra) { terms.push('2d6'); tags.push('Emboscador +2d6'); }
    if (sneakExtra) { const n = getSneakDiceCount(c); terms.push(`${n}d6`); tags.push(`Furtivo +${n}d6`); }
    if (rageExtra) { const r = getRageDamageBonus(c); terms.push(String(r)); tags.push(`Furia +${r}`); }
    if (frenzyExtra) { terms.push('2d6'); tags.push('Frenesí +2d6'); }

    const info = analyzeDiceExpressions(terms, critical);
    return { ...info, tags, markExtra, dreadExtra, sneakExtra, rageExtra, frenzyExtra, critical };
  }

  function updateAttackVerdict() {
    if (!currentAction) return;
    const c = viewed();
    const raw = $('#physicalAtkInput').value.trim();
    const badge = $('#attackVerdictBadge');

    if (raw === '') {
      badge.textContent = 'Sin anotar';
      badge.className = 'hit-verdict';
      return;
    }

    const d20 = parseInt(raw, 10);
    if (!Number.isFinite(d20)) return;

    if (currentAction.isHide || (currentAction.cunningAction && $('#spellSlotSelect').value === 'hide')) {
      const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
      const total = d20 + stealth;
      badge.textContent = `${total} vs CD 15 · ${total >= 15 ? 'Oculto' : 'Falla'}`;
      badge.className = `hit-verdict ${total >= 15 ? 'hit' : 'miss'}`;
      return;
    }

    const tgt = byId($('#targetSelect').value);
    const targetAc = tgt?.ac ?? 10;
    const bonus = currentAction.kind === 'attack' ? (selectedWeapon()?.attack || 0) : (c.spells?.attack || 0);
    const total = d20 + bonus;

    if (d20 === 20) {
      badge.textContent = `20 NAT · ¡CRÍTICO! (${total})`;
      badge.className = 'hit-verdict crit';
      if (currentAction.kind === 'attack' && !$('#critDamageCheck').checked) {
        $('#critDamageCheck').checked = true;
        updatePhysicalActionCards(false);
      }
    } else if (d20 === 1) {
      badge.textContent = `1 NAT · ¡PIFIA! (${total})`;
      badge.className = 'hit-verdict miss';
    } else if (total >= targetAc) {
      badge.textContent = `${total} vs CA ${targetAc} · ¡IMPACTA!`;
      badge.className = 'hit-verdict hit';
    } else {
      badge.textContent = `${total} vs CA ${targetAc} · FALLA`;
      badge.className = 'hit-verdict miss';
    }
  }

  function updatePhysicalActionCards(refreshVerdict = true) {
    if (!currentAction) return;
    const c = viewed();

    if (currentAction.cunningAction) {
      const choice = $('#spellSlotSelect').value;
      if (choice === 'hide') {
        const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
        $('#physicalActionCards').hidden = false;
        $('#physicalAttackCard').hidden = false;
        $('#physicalDamageCard').hidden = true;
        $('#n20AttackLabel').textContent = 'SIGILO (ACCIÓN ASTUTA · DADO FÍSICO)';
        $('#n20AttackFormula').textContent = `1d20${signed(stealth)}`;
        $('#n20AttackQty').textContent = '1 dado físico';
        $('#n20AttackSub').textContent = `1 × d20 (${signed(stealth)}) · CD 15`;
        $('#physicalAtkInputLabel').textContent = 'Anota el d20 físico natural (1–20):';
      } else {
        $('#physicalActionCards').hidden = true;
      }
      if (refreshVerdict) updateAttackVerdict();
      return;
    }

    if (currentAction.kind !== 'attack') return;
    const w = selectedWeapon();
    const tgt = byId($('#targetSelect').value);
    if (!w) return;

    if (!$('#sneakToggle').hidden) {
      const eligible = isSneakEligibleWeapon(w);
      $('#sneakDamage').disabled = !!c.turnSneakUsed || !eligible;
      if (!eligible) $('#sneakDamage').checked = false;
    }

    const d20Count = rollMode === 'normal' ? 1 : 2;
    const atkFormula = `${rollMode === 'advantage' ? '2d20kh1' : rollMode === 'disadvantage' ? '2d20kl1' : '1d20'}${w.attack !== 0 ? signed(w.attack) : ''}`;
    const dmgSpec = buildDamageSpec(c, w, tgt);

    $('#physicalActionCards').hidden = false;
    $('#physicalAttackCard').hidden = false;
    $('#physicalDamageCard').hidden = false;

    const modeLabel = rollMode === 'advantage' ? 'Ventaja (quédate con el mayor)' : rollMode === 'disadvantage' ? 'Desventaja (quédate con el menor)' : 'Normal';
    $('#n20AttackLabel').textContent = `DADOS FÍSICOS DE ATAQUE · ${modeLabel.toUpperCase()}`;
    $('#n20AttackFormula').textContent = atkFormula;
    $('#n20AttackQty').textContent = `${d20Count} ${d20Count === 1 ? 'dado físico (d20)' : 'dados físicos (2×d20)'}`;
    const needed = tgt?.ac ? Math.max(2, tgt.ac - w.attack) : null;
    $('#n20AttackSub').textContent = `${d20Count} × d20 (${signed(w.attack)})${needed ? ` · Impacta con ${needed}+ contra CA ${tgt.ac}` : ''}`;

    $('#n20DamageLabel').textContent = dmgSpec.critical ? 'DADOS FÍSICOS DE DAÑO · ¡CRÍTICO (×2 DADOS)!' : 'DADOS FÍSICOS DE DAÑO (CANTIDADES TOTALES)';
    $('#n20DamageFormula').textContent = dmgSpec.formula;
    $('#n20DamageQty').textContent = `${dmgSpec.totalDice} ${dmgSpec.totalDice === 1 ? 'dado físico' : 'dados físicos'}`;
    $('#n20DamageSub').textContent = `${dmgSpec.breakdown} · [${dmgSpec.tags.join(' + ')}]`;

    if (refreshVerdict) updateAttackVerdict();
  }

  function registerPhysicalAction() {
    if (!currentAction) return;
    const c = viewed();
    const { name, kind, attackMode, isMark, isPotion, isHide, cunningAction, customDice } = currentAction;
    const target = byId($('#targetSelect').value);
    if (target && target.id !== c.id) state.currentTargetId = target.id;

    // 1. ATTACK WITH PHYSICAL RESULTS
    if (kind === 'attack') {
      const weapon = selectedWeapon();
      if (!weapon) { toast('Selecciona un arma'); return; }

      if (attackMode === 'opportunity') c.turnState.reaction = false;
      else if (attackMode === 'offhand') c.turnState.bonus = false;
      else if (attackMode === 'nick') c.turnNickUsed = true;
      else {
        c.turnState.action = false;
        c.attackSequenceOpen = true;
        c.turnAttacksRemaining = Math.max(0, c.turnAttacksRemaining - 1);
        c.turnBaseAttackMade = true;
      }

      if (c.turnAttacksRemaining <= 0 && (!hasMellarAccess(c) || c.turnNickUsed)) c.attackSequenceOpen = false;

      const recklessNow = !$('#recklessToggle').hidden && $('#recklessAttack').checked;
      if (recklessNow && !c.turnRecklessActive) {
        c.turnRecklessActive = true;
        c.recklessUntilTurn = true;
      }
      if (c.steadyAimActive) c.steadyAimActive = false;

      const dmgSpec = buildDamageSpec(c, weapon, target);
      const d20Raw = $('#physicalAtkInput').value.trim();
      const dmgRaw = $('#physicalDmgInput').value.trim();
      const hasD20 = d20Raw !== '' && Number.isFinite(Number(d20Raw));
      const hasDmg = dmgRaw !== '' && Number.isFinite(Number(dmgRaw));
      const d20Val = hasD20 ? Number(d20Raw) : null;
      const dmgVal = hasDmg ? Math.max(0, Number(dmgRaw)) : null;

      // Consume once-per-turn hit extras only if damage was dealt or attack hit
      const targetAc = target?.ac ?? 10;
      const didHit = hasDmg && dmgVal > 0 ? true : (hasD20 ? (d20Val === 20 || (d20Val !== 1 && d20Val + weapon.attack >= targetAc)) : false);
      if (didHit) {
        if (dmgSpec.dreadExtra) {
          c.turnDreadUsed = true;
          const counter = useCounter('dreadful-strike', c);
          if (counter && counter.remaining > 0) counter.remaining--;
        }
        if (dmgSpec.sneakExtra) c.turnSneakUsed = true;
        if (dmgSpec.frenzyExtra) c.turnFrenzyUsed = true;
      }

      const atkPart = hasD20 ? `d20 (${d20Val}) ${signed(weapon.attack)} = ${d20Val + weapon.attack} vs CA ${targetAc}` : $('#n20AttackFormula').textContent;
      const dmgPart = hasDmg ? `Daño físico: ${dmgVal} (${dmgSpec.formula})` : `Dados: ${dmgSpec.formula}`;

      if (hasDmg && dmgVal > 0 && target) {
        // Apply physical damage directly to HP bar (with concentration check!)
        const prevHp = target.hp;
        target.hp = Math.max(0, prevHp - dmgVal);
        let concNote = '';
        if (target.type === 'enemy' && target.hp <= 0) target.defeated = true;
        if (target.concentration) {
          const dc = Math.max(10, Math.floor(dmgVal / 2));
          concNote = ` · ¡Salv. CON CD ${dc} (${target.concentration.spell})!`;
          if (target.hp <= 0) { target.concentration = null; target.markedTargetId = null; }
        }
        addLog(c.name, `impacta a ${target.name} con ${weapon.name}`, `${atkPart} · ${dmgPart} · ${target.name}: ${target.hp}/${target.maxHp} PG${concNote}`, '⚔');
        toast(`${dmgVal} de daño aplicado a ${target.name}${concNote}`);
      } else if (hasD20 && !didHit) {
        addLog(c.name, `falla el ataque con ${weapon.name}`, `${target ? `${target.name} · ` : ''}${atkPart}`, '◌');
        toast(`Fallo registrado (${atkPart})`);
      } else {
        addLog(c.name, `realiza ${name} (${weapon.name}${target ? ` → ${target.name}` : ''})`, `${atkPart} · ${dmgPart}`, '⚔');
        toast(`Ataque registrado (${weapon.name})`);
      }

      saveState(); renderAll(); closeDialog(dialogs.action); return;
    }

    // 2. HUNTER'S MARK
    if (isMark) {
      if (!target) { toast('Selecciona un objetivo'); return; }
      const oldTarget = c.markedTargetId ? byId(c.markedTargetId) : null;
      const isFree = oldTarget && oldTarget.hp <= 0;
      if (!isFree) {
        const slotKey = $('#spellSlotSelect').value;
        if (slotKey && !['none', 'ritual', 'cantrip'].includes(slotKey)) {
          const counter = useCounter(slotKey, c);
          if (counter && counter.remaining > 0) counter.remaining--;
        }
      }
      c.markedTargetId = target.id;
      c.concentration = { spell: 'Marca del cazador', targetId: target.id };
      c.turnState.bonus = false;
      addLog(c.name, isFree ? 'traslada Marca del cazador' : 'lanza Marca del cazador', `${target.name} marcado (+1d6 sumado a los dados físicos)`, '◎');
      saveState(); renderAll(); closeDialog(dialogs.action); toast(`${target.name} marcado (+1d6)`); return;
    }

    // 3. HEALING POTION
    if (isPotion) {
      c.turnState.bonus = false;
      const recipient = target || c;
      const healRaw = $('#physicalDmgInput').value.trim();
      const healVal = healRaw !== '' && Number.isFinite(Number(healRaw)) ? Math.max(0, Number(healRaw)) : null;
      if (healVal !== null && healVal > 0) {
        adjustHp(recipient, healVal, `Poción de curación (${c.name} · 2d4+2 físico)`);
      } else {
        addLog(c.name, 'usa Poción de curación', `${recipient.name} · 2d4+2 (sin resultado anotado)`, '✚');
        saveState(); renderAll(); toast('Poción registrada');
      }
      closeDialog(dialogs.action); return;
    }

    // 4. HIDE
    if (isHide) {
      c.turnState.action = false;
      const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
      const d20Raw = $('#physicalAtkInput').value.trim();
      if (d20Raw !== '' && Number.isFinite(Number(d20Raw))) {
        const d20 = Number(d20Raw);
        const total = d20 + stealth;
        if (total >= 15 && !c.conditions.includes('Oculto')) c.conditions.push('Oculto');
        addLog(c.name, 'intenta Esconderse', `d20 físico (${d20}) ${signed(stealth)} = ${total} vs CD 15 (${total >= 15 ? 'Oculto' : 'Falla'})`, '◐');
        toast(`Sigilo ${total} (${total >= 15 ? 'Oculto' : 'No oculto'})`);
      } else {
        addLog(c.name, 'intenta Esconderse', `1d20${signed(stealth)} vs CD 15`, '◐');
        toast('Esconderse registrado');
      }
      saveState(); renderAll(); closeDialog(dialogs.action); return;
    }

    // 5. CUNNING ACTION
    if (cunningAction) {
      const choice = $('#spellSlotSelect').value;
      c.turnState.bonus = false;
      const speed = Number(c.speed) || 9;
      if (choice === 'dash') {
        c.turnMovement = Math.round((c.turnMovement + speed) * 10) / 10;
        c.turnState.movement = c.turnMovement > 0;
        addLog(c.name, 'usa Acción astuta: Correr', `+${formatMeters(speed)} m (${formatMeters(c.turnMovement)} m restantes)`, '⚡');
        toast(`Correr: +${formatMeters(speed)} m`);
      } else if (choice === 'disengage') {
        if (!c.conditions.includes('Destrabado')) c.conditions.push('Destrabado');
        addLog(c.name, 'usa Acción astuta: Destrabarse', 'Sin ataques de oportunidad este turno', '↺');
        toast(`${c.name} se destraba`);
      } else {
        const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
        const d20Raw = $('#physicalAtkInput').value.trim();
        if (d20Raw !== '' && Number.isFinite(Number(d20Raw))) {
          const d20 = Number(d20Raw);
          const total = d20 + stealth;
          if (total >= 15 && !c.conditions.includes('Oculto')) c.conditions.push('Oculto');
          addLog(c.name, 'usa Acción astuta: Esconderse', `d20 físico (${d20}) ${signed(stealth)} = ${total} vs CD 15`, '◐');
        } else {
          addLog(c.name, 'usa Acción astuta: Esconderse', `1d20${signed(stealth)}`, '◐');
        }
        toast('Acción astuta registrada');
      }
      saveState(); renderAll(); closeDialog(dialogs.action); return;
    }

    // 6. SPELLS
    if (kind === 'spell') {
      const meta = getSpellMeta(name);
      const actType = spellActionType(name, c);
      const slotKey = $('#spellSlotSelect').value;
      let slotText = meta.level === 0 ? 'Truco' : 'Sin espacio';
      if (slotKey && !['cantrip', 'ritual', 'none'].includes(slotKey)) {
        const counter = useCounter(slotKey, c);
        if (counter && counter.remaining > 0) { counter.remaining--; slotText = counter.name; }
      } else if (slotKey === 'ritual') slotText = 'Ritual';

      if (['action', 'bonus', 'reaction'].includes(actType)) c.turnState[actType] = false;
      if (meta.concentration) {
        if (c.concentration && /marca del cazador/i.test(c.concentration.spell)) c.markedTargetId = null;
        c.concentration = { spell: name, targetId: target?.id || null };
      }

      const d20Raw = $('#physicalAtkInput').value.trim();
      const valRaw = $('#physicalDmgInput').value.trim();
      const bits = [target ? target.name : null, slotText, meta.concentration ? 'Concentración' : null];
      if (d20Raw !== '' && Number.isFinite(Number(d20Raw))) {
        const d20 = Number(d20Raw);
        bits.push(`Ataque d20 (${d20})${signed(c.spells?.attack || 0)} = ${d20 + (c.spells?.attack || 0)}`);
      }
      if (valRaw !== '' && Number.isFinite(Number(valRaw))) {
        const val = Math.max(0, Number(valRaw));
        if (meta.heal) {
          adjustHp(target || c, val, `${name} (${c.name})`);
          closeDialog(dialogs.action); return;
        } else if (meta.damage && target && val > 0) {
          bits.push(`Daño físico: ${val}`);
          addLog(c.name, `lanza ${name}`, bits.filter(Boolean).join(' · '), '✧');
          adjustHp(target, -val, `${name} (${c.name})`);
          closeDialog(dialogs.action); return;
        } else {
          bits.push(`Resultado físico: ${val}`);
        }
      }

      addLog(c.name, `lanza ${name}`, bits.filter(Boolean).join(' · '), '✧');
      saveState(); renderAll(); closeDialog(dialogs.action); toast(`${name} registrado`); return;
    }

    // 7. FEATURES & CUSTOM ACTIONS
    spendFeatureUse(name, c);
    if (['action', 'bonus', 'reaction'].includes(kind)) c.turnState[kind] = false;
    const resRaw = $('#physicalDmgInput').value.trim();
    const detail = resRaw !== '' ? `Resultado físico: ${resRaw}${customDice ? ` (${customDice})` : ''}` : (customDice ? `Dados físicos: ${customDice}` : 'Actividad registrada');
    addLog(c.name, name, detail, '✦');
    saveState(); renderAll(); closeDialog(dialogs.action); toast(`${name} registrada`);
  }

  // =========================================================================
  // MOVEMENT, ENEMIES, INITIATIVE, RESTS, SHEET
  // =========================================================================
  function openMovement() {
    const c = viewed();
    $('#movementDesc').textContent = `${c.name}: quedan ${formatMeters(c.turnMovement)} m de ${formatMeters(c.speed || 0)} m disponibles.`;
    $('#movementInput').value = c.turnMovement > 0 ? String(Math.min(3, c.turnMovement)) : '0';
    $('#positionInput').value = '';
    openDialog(dialogs.movement);
  }

  function openHpDialog(targetId) {
    const c = byId(targetId);
    if (!c) return;
    hpDialogTargetId = targetId;
    $('#hpDialogTitle').textContent = `PG de ${c.name} (${c.hp}/${c.maxHp})`;
    $('#hpDeltaInput').value = '5';
    $('#hpDeltaType').value = 'damage';
    $('#hpDeltaReason').value = '';
    openDialog(dialogs.hp);
  }

  function removeCombatant(id) {
    const c = byId(id);
    if (!c) return false;
    if (state.combatants.length <= 1) {
      toast('Debe quedar al menos un combatiente en el encuentro');
      return false;
    }
    const isPc = c.type !== 'enemy';
    const msg = isPc
      ? `¿Eliminar al personaje «${c.name}» del encuentro?\n\n(Si lo necesitas de vuelta más adelante, puedes restaurar el grupo desde ⚙ Ajustes → Reiniciar encuentro o sincronizarlo desde Nivel20).`
      : `¿Eliminar a «${c.name}» del encuentro?`;
    if (!confirm(msg)) return false;

    state.combatants = state.combatants.filter(x => x.id !== id);
    state.combatants.forEach(x => { if (x.markedTargetId === id) x.markedTargetId = null; });
    if (state.map?.tokens?.[id]) delete state.map.tokens[id];
    if (state.activeTurnId === id) state.activeTurnId = state.combatants[0]?.id || null;
    if (state.viewedId === id) state.viewedId = state.activeTurnId;
    if (state.currentTargetId === id) state.currentTargetId = state.combatants.find(x => x.id !== state.viewedId)?.id || null;
    addLog('DM', `retira a ${c.name}`, isPc ? 'Personaje eliminado del encuentro' : 'Adversario eliminado del encuentro', '−');
    saveState(); renderAll(); toast(`${c.name} eliminado`);
    return true;
  }

  function syncInitInputsToState() {
    $$('#initEditList input').forEach(inp => {
      const c = byId(inp.dataset.id);
      if (!c) return;
      const val = inp.value.trim();
      if (val === '') c.initiativeRoll = null;
      else if (Number.isFinite(Number(val))) c.initiativeRoll = Number(val);
    });
  }

  function renderInitiativeEditorRows() {
    const list = $('#initEditList');
    list.replaceChildren();
    state.combatants.forEach((c, idx) => {
      const row = document.createElement('div');
      row.className = 'init-edit-row';
      row.innerHTML = '<div><b></b><small></small></div><input type="number" step="1"><div class="init-move-btns"><button type="button" class="up-btn" title="Subir">↑</button><button type="button" class="down-btn" title="Bajar">↓</button></div>';
      row.querySelector('b').textContent = c.name;
      row.querySelector('small').textContent = `Mod: ${signed(c.initiative || 0)}`;
      const input = row.querySelector('input');
      input.dataset.id = c.id;
      input.value = c.initiativeRoll == null ? '' : String(c.initiativeRoll);
      input.placeholder = signed(c.initiative || 0);

      const upBtn = row.querySelector('.up-btn');
      const downBtn = row.querySelector('.down-btn');
      upBtn.disabled = idx === 0;
      downBtn.disabled = idx === state.combatants.length - 1;
      upBtn.addEventListener('click', () => { syncInitInputsToState(); swapInitiativePositions(state.combatants[idx].id, state.combatants[idx - 1].id); renderInitiativeEditorRows(); renderAll(); });
      downBtn.addEventListener('click', () => { syncInitInputsToState(); swapInitiativePositions(state.combatants[idx].id, state.combatants[idx + 1].id); renderInitiativeEditorRows(); renderAll(); });
      list.append(row);
    });
  }

  function openInitiativeEditor() {
    renderInitiativeEditorRows();
    openDialog(dialogs.initiative);
  }

  function recoverUses(rest) {
    const c = viewed();
    ensureUseCounters(c);
    let recovered = 0;
    c.limitedUses.forEach(counter => {
      if (counter.reset === 'never') return;
      if (rest === 'long') {
        if (counter.remaining < counter.max) { counter.remaining = counter.max; recovered++; }
      } else if (counter.reset === 'short' || counter.reset === 'either') {
        if (counter.remaining < counter.max) {
          counter.remaining = counter.shortRestore ? Math.min(counter.max, counter.remaining + counter.shortRestore) : counter.max;
          recovered++;
        }
      }
    });
    let hpMsg = '';
    if (rest === 'long') {
      if (c.hp < c.maxHp) { c.hp = c.maxHp; hpMsg = ` · PG restaurados (${c.hp}/${c.maxHp})`; }
      c.raging = false; c.concentration = null; c.markedTargetId = null; c.conditions = []; freshTurn(c);
    }
    addLog(c.name, rest === 'long' ? 'completa un Descanso largo' : 'completa un Descanso corto', `${recovered} contador${recovered === 1 ? '' : 'es'} recuperado${recovered === 1 ? '' : 's'}${hpMsg}`, '☾');
    saveState(); renderAll(); toast(`${rest === 'long' ? 'Descanso largo' : 'Descanso corto'}: ${recovered} recuperados${hpMsg}`);
  }

  function openCharacterSheet() {
    const c = viewed();
    $('#sheetTitle').textContent = `${c.name} · ${c.className || 'Combatiente'}`;
    const content = $('#sheetContent');
    content.replaceChildren();
    const sections = [];
    if (c.details?.length) sections.push(['Trasfondo y personalidad', ...c.details]);
    sections.push(['Resumen', `${c.species || '—'} · ${c.background || 'Sin trasfondo'}`, `PG ${c.hp}/${c.maxHp} · CA ${c.ac ?? '—'} · Velocidad ${formatMeters(c.speed)} m · Iniciativa ${signed(c.initiative || 0)}`]);
    if (c.stats && Object.keys(c.stats).length) sections.push(['Características', ...Object.entries(c.stats).map(([k, v]) => `${k}: ${v}`)]);
    if (c.saves && Object.keys(c.saves).length) sections.push(['Salvaciones', ...Object.entries(c.saves).map(([k, v]) => `${k} ${signed(v)}`)]);
    if (c.skills && Object.keys(c.skills).length) sections.push(['Habilidades', ...Object.entries(c.skills).map(([k, v]) => `${k} ${signed(v)}`)]);
    if (c.features?.length) sections.push(['Rasgos', ...c.features.map(f => `${f} — ${featureDescription(f, c)}`)]);
    if (c.feats?.length) sections.push(['Dotes', ...c.feats.map(f => `${f} — ${featureDescription(f, c)}`)]);
    if (c.weapons?.length) sections.push(['Armas', ...c.weapons.map(w => `${w.name} (${w.attack != null ? signed(w.attack) : 'sin tirada'} · ${w.damage} ${w.type || ''}${w.mastery ? ` · ${w.mastery}` : ''})`)]);
    if (c.spells?.names?.length) {
      const slots = Object.entries(c.spells).filter(([k]) => /^level\d+Slots$/.test(k)).map(([k, v]) => `Nv.${k.replace('level', '').replace('Slots', '')}: ${v}`).join(', ');
      sections.push([`Conjuros (CD ${c.spells.saveDc ?? '—'} · Ataque ${signed(c.spells.attack || 0)}${slots ? ` · Espacios ${slots}` : ''})`, ...c.spells.names.map(s => `${s} (Nv.${getSpellMeta(s).level}): ${getSpellMeta(s).desc}`)]);
    }
    if (c.equipment?.length) sections.push(['Equipo', ...c.equipment]);
    if (c.proficiencies?.length || c.languages?.length) sections.push(['Competencias e idiomas', ...(c.proficiencies || []), ...(c.languages || [])]);
    if (c.companion) sections.push(['Compañero', c.companion]);

    sections.forEach(([title, ...items]) => {
      if (!items.length) return;
      const box = document.createElement('section');
      box.innerHTML = '<h3></h3><ul></ul>';
      box.querySelector('h3').textContent = title;
      items.filter(Boolean).forEach(item => { const li = document.createElement('li'); li.textContent = item; box.querySelector('ul').append(li); });
      content.append(box);
    });
    $('#exportPortraitFromSheetBtn').hidden = !c.avatar;
    openDialog(dialogs.sheet);
  }

  function buildInitiativeSummaryText() {
    const lines = [`=== ${campaign.name} · Ronda ${state.round} ===`];
    state.combatants.forEach((c, idx) => {
      const turnMark = c.id === state.activeTurnId ? ' ◀ TURNO ACTUAL' : '';
      const initTxt = c.initiativeRoll != null ? `Init ${c.initiativeRoll}` : `Mod ${signed(c.initiative || 0)}`;
      lines.push(`${idx + 1}. ${c.name} (${initTxt} · PG ${c.hp}/${c.maxHp})${c.defeated ? ' [DERROTADO]' : ''}${turnMark}`);
    });
    return lines.join('\n');
  }

  function parseSpeedValue(raw, fallback = 9) {
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    const parsed = parseFloat(String(raw ?? '').replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  // =========================================================================
  // EVENT WIRING
  // =========================================================================
  $$('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => { const d = btn.closest('dialog'); if (d) closeDialog(d); }));

  // Sidebar & topbar
  $('#brandHome').addEventListener('click', e => { e.preventDefault(); setMainView('encounter'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#encounterNav').addEventListener('click', () => { setMainView('encounter'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#mapNav').addEventListener('click', () => { setMainView('map'); });
  $('#charactersNav').addEventListener('click', () => openDialog(dialogs.import));
  const openN20Modal = () => { $('#n20UrlInput').value = state.nivel20.url || 'https://nivel20.com'; openDialog(dialogs.nivel20); };
  $('#nivel20Nav').addEventListener('click', openN20Modal);
  $('#nivel20TopBtn').addEventListener('click', openN20Modal);
  $('#manualsNav').addEventListener('click', () => openDialog(dialogs.manual));
  $('#helpBtn').addEventListener('click', () => openDialog(dialogs.help));
  const openSettings = () => { $('#skipDefeatedCheck').checked = !!state.skipDefeated; openDialog(dialogs.settings); };
  $('#settingsBtnTop').addEventListener('click', openSettings);
  $('#campaignBtn').addEventListener('click', openSettings);
  $('#userOptionsBtn').addEventListener('click', openSettings);
  $('#shareBtn').addEventListener('click', () => copyToClipboard(buildInitiativeSummaryText(), 'Resumen de iniciativa copiado'));
  $('#finishBtn').addEventListener('click', () => { state.paused = !state.paused; saveState(); renderTopAndSidebar(); toast(state.paused ? 'Encuentro pausado' : 'Encuentro reanudado'); });

  // Swap mode (Alert feat)
  $('#swapInitiativeBtn').addEventListener('click', () => {
    swapMode = !swapMode;
    swapFirstId = null;
    $('#swapBannerText').textContent = 'Haz clic en el primer combatiente en la barra de iniciativa y luego en el segundo para intercambiar sus puestos.';
    renderTopAndSidebar(); renderInitiative();
  });
  $('#cancelSwapBtn').addEventListener('click', () => { swapMode = false; swapFirstId = null; renderTopAndSidebar(); renderInitiative(); });

  // Inspect banner
  $('#returnToActiveTurn').addEventListener('click', () => inspectCombatant(state.activeTurnId));
  $('#setAsActiveTurn').addEventListener('click', () => advanceToTurn(viewed().id, { log: true, restore: true }));

  // Portrait export & sheet
  $('#exportPortraitBtn').addEventListener('click', () => exportPortrait(viewed()));
  $('#exportPortraitFromSheetBtn').addEventListener('click', () => exportPortrait(viewed()));
  $('#sheetDetails').addEventListener('click', openCharacterSheet);
  $('#manageFeatures').addEventListener('click', openCharacterSheet);

  // Quick HP controls
  $('#hpMinus5').addEventListener('click', () => adjustHp(viewed(), -5, 'Ajuste DM'));
  $('#hpMinus1').addEventListener('click', () => adjustHp(viewed(), -1, 'Ajuste DM'));
  $('#hpPlus1').addEventListener('click', () => adjustHp(viewed(), 1, 'Curación DM'));
  $('#hpPlus5').addEventListener('click', () => adjustHp(viewed(), 5, 'Curación DM'));
  $('#hpCustomBtn').addEventListener('click', () => openHpDialog(viewed().id));
  $('#applyHpDelta').addEventListener('click', () => {
    const c = byId(hpDialogTargetId); if (!c) return;
    const amount = Math.max(0, parseInt($('#hpDeltaInput').value, 10) || 0);
    const type = $('#hpDeltaType').value;
    const reason = $('#hpDeltaReason').value.trim();
    if (type === 'damage') adjustHp(c, -amount, reason);
    else if (type === 'heal') adjustHp(c, amount, reason);
    else setExactHp(c, amount, reason);
    closeDialog(dialogs.hp);
  });

  // Restore turn resources (DM)
  $('#resetTurnResourcesBtn').addEventListener('click', () => { freshTurn(viewed()); saveState(); renderAll(); toast(`Recursos del turno restaurados para ${viewed().name}`); });

  // Movement dialog
  $$('.quick-dist-row button[data-dist]').forEach(btn => btn.addEventListener('click', () => { $('#movementInput').value = btn.dataset.dist; }));
  $('#moveAllBtn').addEventListener('click', () => { $('#movementInput').value = formatMeters(viewed().turnMovement); });
  $('#resetMovementBtn').addEventListener('click', () => {
    const c = viewed(); c.turnMovement = Number(c.speed) || 0; c.turnState.movement = c.turnMovement > 0; c.turnMoved = false;
    saveState(); renderCharacter(); closeDialog(dialogs.movement); toast(`Movimiento restaurado a ${formatMeters(c.turnMovement)} m`);
  });
  $('#saveMovement').addEventListener('click', () => {
    const c = viewed();
    const distance = Math.max(0, parseFloat(String($('#movementInput').value).replace(',', '.')) || 0);
    const note = $('#positionInput').value.trim();
    if (distance > 0) {
      c.turnMovement = Math.max(0, Math.round((c.turnMovement - distance) * 10) / 10);
      c.turnMoved = true;
      c.turnState.movement = c.turnMovement > 0;
      addLog(c.name, `se desplaza ${formatMeters(distance)} m`, `${formatMeters(c.turnMovement)} m restantes${note ? ` · ${note}` : ''}`, '⌁');
      toast(`Movimiento registrado · quedan ${formatMeters(c.turnMovement)} m`);
    }
    saveState(); renderAll(); closeDialog(dialogs.movement);
  });

  // Action modal events (physical dice)
  $$('#rollModeGroup button').forEach(btn => btn.addEventListener('click', () => setRollMode(btn.dataset.rollMode)));
  $('#weaponSelect').addEventListener('change', () => updatePhysicalActionCards());
  $('#targetSelect').addEventListener('change', () => { const v = $('#targetSelect').value; if (v && v !== viewed().id) state.currentTargetId = v; updatePhysicalActionCards(); });
  $('#spellSlotSelect').addEventListener('change', () => updatePhysicalActionCards());
  $('#recklessAttack').addEventListener('change', e => {
    setRollMode(e.target.checked ? 'advantage' : 'normal');
    if (viewed().raging && !viewed().turnFrenzyUsed) $('#frenzyCheck').checked = e.target.checked;
    updatePhysicalActionCards();
  });
  ['#rageDamageCheck', '#frenzyCheck', '#dreadDamage', '#sneakDamage', '#critDamageCheck'].forEach(sel => $(sel).addEventListener('change', () => updatePhysicalActionCards()));
  $('#physicalAtkInput').addEventListener('input', updateAttackVerdict);
  $('#copyAttackFormulaBtn').addEventListener('click', () => copyToClipboard($('#n20AttackFormula').textContent, `Copiado: ${$('#n20AttackFormula').textContent}`));
  $('#copyDamageFormulaBtn').addEventListener('click', () => copyToClipboard($('#n20DamageFormula').textContent, `Copiado: ${$('#n20DamageFormula').textContent}`));
  $('#cancelMarkBtn').addEventListener('click', () => {
    const c = viewed(); c.markedTargetId = null;
    if (c.concentration && /marca del cazador/i.test(c.concentration.spell)) c.concentration = null;
    addLog(c.name, 'suelta Marca del cazador', 'Concentración finalizada', '◌');
    saveState(); renderAll(); closeDialog(dialogs.action); toast('Marca del cazador retirada');
  });
  $('#resolveAction').addEventListener('click', registerPhysicalAction);

  // Physical Dice Pool Sidebar controls
  $$('.die-pick').forEach(btn => {
    const sides = Number(btn.dataset.die);
    btn.addEventListener('click', () => { dicePool[sides] = (dicePool[sides] || 0) + 1; renderPhysicalDicePool(); });
    btn.addEventListener('contextmenu', e => { e.preventDefault(); dicePool[sides] = Math.max(0, (dicePool[sides] || 0) - 1); renderPhysicalDicePool(); });
  });
  function setPoolMod(n) { poolModifier = Number.isFinite(n) ? n : 0; $('#modifier').value = (poolModifier > 0 ? '+' : '') + poolModifier; renderPhysicalDicePool(); }
  $('#plusMod').addEventListener('click', () => setPoolMod(poolModifier + 1));
  $('#minusMod').addEventListener('click', () => setPoolMod(poolModifier - 1));
  $('#modifier').addEventListener('change', e => setPoolMod(parseInt(e.target.value, 10) || 0));
  $('#clearDicePoolBtn').addEventListener('click', clearPhysicalDicePool);
  $('#copyPoolFormulaBtn').addEventListener('click', () => copyToClipboard($('#poolFormulaDisplay').textContent, `Copiado: ${$('#poolFormulaDisplay').textContent}`));
  $('#loadCustomDice').addEventListener('click', () => loadFormulaIntoPool($('#customDice').value));
  $('#customDice').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); loadFormulaIntoPool($('#customDice').value); } });
  $('#recordPhysicalRollBtn').addEventListener('click', () => recordPhysicalPoolRoll('log'));
  $('#applyPhysicalDamageBtn').addEventListener('click', () => recordPhysicalPoolRoll('damage'));
  $('#applyPhysicalHealBtn').addEventListener('click', () => recordPhysicalPoolRoll('heal'));
  $('#physicalResultInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); recordPhysicalPoolRoll('log'); } });

  // Custom action modal
  $('#customAction').addEventListener('click', () => { $('#customActionName').value = ''; $('#customActionKind').value = 'action'; $('#customActionDice').value = ''; $('#customActionDesc').value = ''; openDialog(dialogs.customAction); });
  $('#saveCustomAction').addEventListener('click', () => {
    const name = $('#customActionName').value.trim(); if (!name) { toast('Escribe un nombre'); return; }
    const c = viewed();
    c.customActions.push({ id: `custom-${Date.now()}`, name, kind: $('#customActionKind').value, dice: $('#customActionDice').value.trim(), description: $('#customActionDesc').value.trim() });
    saveState(); renderActionGroups(c); closeDialog(dialogs.customAction); toast(`Acción «${name}» guardada`);
  });

  // Limited uses & rests
  $('#addUseCounter').addEventListener('click', () => { $('#useName').value = ''; $('#useMax').value = '3'; $('#useReset').value = 'long'; openDialog(dialogs.uses); });
  $('#saveUseCounter').addEventListener('click', () => {
    const name = $('#useName').value.trim(); if (!name) { toast('Escribe el nombre'); return; }
    const max = Math.max(1, parseInt($('#useMax').value, 10) || 1);
    const c = viewed(); ensureUseCounters(c);
    c.limitedUses.push({ key: `custom-${Date.now()}`, name, max, remaining: max, reset: $('#useReset').value, custom: true });
    saveState(); renderLimitedUses(); closeDialog(dialogs.uses); toast(`Contador «${name}» añadido`);
  });
  $('#shortRest').addEventListener('click', () => recoverUses('short'));
  $('#longRest').addEventListener('click', () => recoverUses('long'));

  // Initiative controls
  $('#nextTurn').addEventListener('click', nextTurn);
  $('#editInitiativeBtn').addEventListener('click', openInitiativeEditor);
  $('#editInitiative').addEventListener('click', openInitiativeEditor);
  $('#saveAllInitiatives').addEventListener('click', () => {
    syncInitInputsToState();
    state.initiativeRolled = true;
    state.combatants.sort((a, b) => {
      const av = a.initiativeRoll ?? -999, bv = b.initiativeRoll ?? -999;
      if (bv !== av) return bv - av;
      if ((b.initiative || 0) !== (a.initiative || 0)) return (b.initiative || 0) - (a.initiative || 0);
      return getAbilityMod(b, 'Des') - getAbilityMod(a, 'Des');
    });
    state.round = 1;
    state.combatants.forEach(c => freshTurn(c));
    const first = state.combatants.find(c => !state.skipDefeated || !c.defeated) || state.combatants[0];
    if (first) { state.activeTurnId = first.id; state.viewedId = first.id; }
    addLog('DM', 'carga y ordena las iniciativas físicas', state.combatants.map(c => `${c.name} (${c.initiativeRoll ?? '—'})`).join(' · '), '✎');
    saveState(); renderAll(); closeDialog(dialogs.initiative); toast('Iniciativas ordenadas de mayor a menor');
  });

  // Add Enemy
  const openAddEnemy = () => {
    pendingEnemyUploadDataUrl = '';
    $('#enemyName').value = ''; $('#enemyInitRoll').value = ''; $('#enemyInit').value = '1';
    $('#enemyHp').value = '25/25'; $('#enemyAc').value = '15'; $('#enemySpeed').value = '9 m';
    $('#enemyAtk').value = '5'; $('#enemyDmg').value = '1d8+3'; $('#enemyImageUrl').value = '';
    openDialog(dialogs.combatant);
  };
  $('#addCombatant').addEventListener('click', openAddEnemy);
  $('#addTarget').addEventListener('click', openAddEnemy);
  $('#uploadEnemyImgBtn').addEventListener('click', () => $('#enemyImageFile').click());
  $('#enemyImageFile').addEventListener('change', e => {
    readImageFileAsDataUrl(e.target.files[0], url => { pendingEnemyUploadDataUrl = url; $('#enemyImageUrl').value = '(Imagen local cargada)'; toast('Imagen cargada'); });
    e.target.value = '';
  });
  $('#searchEnemyGoogleBtn').addEventListener('click', () => window.open(googleImagesUrl($('#enemyName').value.trim() || 'dnd monster'), '_blank', 'noopener,noreferrer'));

  $('#saveEnemy').addEventListener('click', () => {
    const name = $('#enemyName').value.trim() || `Adversario ${state.combatants.filter(x => x.type === 'enemy').length + 1}`;
    const hpParts = $('#enemyHp').value.split('/').map(x => parseInt(x, 10));
    const maxHp = Math.max(1, hpParts[1] || hpParts[0] || 25);
    const hp = Math.max(0, Math.min(maxHp, Number.isFinite(hpParts[0]) ? hpParts[0] : maxHp));
    const initMod = parseInt($('#enemyInit').value, 10) || 0;
    const initRollRaw = $('#enemyInitRoll').value.trim();
    const initRoll = initRollRaw !== '' && Number.isFinite(Number(initRollRaw)) ? Number(initRollRaw) : null;
    const urlInput = $('#enemyImageUrl').value.trim();
    const avatar = pendingEnemyUploadDataUrl || (urlInput && urlInput !== '(Imagen local cargada)' ? urlInput : '');

    const enemy = hydrateCombatant({
      id: `enemy-${Date.now()}`, name, avatar, owner: 'Adversario', type: 'enemy', species: 'Enemigo', level: 1,
      className: 'Adversario', hp, maxHp, ac: Math.max(1, parseInt($('#enemyAc').value, 10) || 12),
      initiative: initMod, initiativeRoll: initRoll, speed: parseSpeedValue($('#enemySpeed').value, 9),
      weapons: [{ name: 'Ataque principal', attack: parseInt($('#enemyAtk').value, 10) || 4, damage: $('#enemyDmg').value.trim() || '1d8+2', type: 'daño' }]
    });

    state.combatants.push(enemy);
    if (initRoll !== null) { state.initiativeRolled = true; state.combatants.sort((a, b) => (b.initiativeRoll ?? -999) - (a.initiativeRoll ?? -999)); }
    state.currentTargetId = enemy.id;
    addLog('DM', `añade a ${name}`, `${enemy.hp} PG · CA ${enemy.ac}${initRoll !== null ? ` · Iniciativa ${initRoll}` : ''}`, '＋');
    saveState(); renderAll(); closeDialog(dialogs.combatant);
    toast(avatar ? `${name} añadido` : `${name} añadido · buscando imagen automáticamente…`);
    if (!avatar) fetchAutoEnemyImage(enemy);
  });

  // Log
  $('#copyLogBtn').addEventListener('click', () => {
    const lines = state.logEntries.slice(0, 25).reverse().map(e => `[${e.time}] ${e.actor} ${e.text}${e.detail ? ` — ${e.detail}` : ''}`);
    copyToClipboard(lines.join('\n'), 'Historial copiado');
  });
  $('#clearLog').addEventListener('click', () => { state.logEntries = []; saveState(); renderLog(); toast('Registro limpiado'); });

  // Edit character
  $('#editCharacter').addEventListener('click', () => {
    const c = viewed(); pendingEditAvatarDataUrl = '';
    $('#nameInput').value = c.name; $('#levelInput').value = getLevel(c); $('#classInput').value = c.className || '';
    $('#hpInput').value = `${c.hp}/${c.maxHp}`; $('#acInput').value = c.ac ?? 10; $('#speedInput').value = `${formatMeters(c.speed)} m`;
    $('#initModInput').value = c.initiative ?? 0; $('#avatarUrlInput').value = c.avatar && !c.avatar.startsWith('data:') ? c.avatar : '';
    openDialog(dialogs.edit);
  });
  $('#uploadAvatarBtn').addEventListener('click', () => $('#avatarFileInput').click());
  $('#avatarFileInput').addEventListener('change', e => {
    readImageFileAsDataUrl(e.target.files[0], url => { pendingEditAvatarDataUrl = url; $('#avatarUrlInput').value = '(Imagen local cargada)'; toast('Imagen lista'); });
    e.target.value = '';
  });
  $('#searchGoogleEditBtn').addEventListener('click', () => window.open(googleImagesUrl($('#nameInput').value.trim() || viewed().name), '_blank', 'noopener,noreferrer'));
  $('#saveCharacter').addEventListener('click', () => {
    const c = viewed(); const prevSpeed = Number(c.speed) || 9;
    c.name = $('#nameInput').value.trim() || c.name;
    c.level = Math.max(1, Math.min(20, parseInt($('#levelInput').value, 10) || 1));
    c.className = $('#classInput').value.trim() || c.className;
    const hpParts = $('#hpInput').value.split('/').map(x => parseInt(x, 10));
    c.maxHp = Math.max(1, hpParts[1] || hpParts[0] || c.maxHp || 1);
    c.hp = Math.max(0, Math.min(c.maxHp, Number.isFinite(hpParts[0]) ? hpParts[0] : c.hp));
    if (c.type === 'enemy') c.defeated = c.hp <= 0;
    c.ac = Math.max(1, parseInt($('#acInput').value, 10) || 10);
    c.speed = parseSpeedValue($('#speedInput').value, prevSpeed);
    c.initiative = parseInt($('#initModInput').value, 10) || 0;
    const avatarRaw = $('#avatarUrlInput').value.trim();
    if (pendingEditAvatarDataUrl) c.avatar = pendingEditAvatarDataUrl;
    else if (avatarRaw && avatarRaw !== '(Imagen local cargada)') c.avatar = avatarRaw;
    if (c.speed !== prevSpeed) { c.turnMovement = Math.min(c.speed, c.turnMovement + Math.max(0, c.speed - prevSpeed)); c.turnState.movement = c.turnMovement > 0; }
    saveState(); renderAll(); closeDialog(dialogs.edit); toast(`Ficha de ${c.name} actualizada`);
  });
  $('#deleteCharacterBtn')?.addEventListener('click', () => {
    const c = viewed();
    if (!c) return;
    if (removeCombatant(c.id)) closeDialog(dialogs.edit);
  });

  // Import character JSON
  $('#jsonImport').addEventListener('click', () => $('#fileInput').click());
  $('#manualEntry').addEventListener('click', () => { closeDialog(dialogs.import); $('#editCharacter').click(); });
  $('#fileInput').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      const mode = $('#importModeSelect').value;
      const base = mode === 'replace' ? viewed() : {
        id: `char-${Date.now()}`, type: 'pc', name: 'Personaje importado', level: 1, className: 'Aventurero 1',
        hp: 20, maxHp: 20, ac: 12, initiative: 0, speed: 9,
        stats: { Fue: '10 (0)', Des: '10 (0)', Con: '10 (0)', Int: '10 (0)', Sab: '10 (0)', Car: '10 (0)' },
        features: [], feats: [], weapons: []
      };
      base.name = d.name || d.nombre || base.name;
      if (d.avatar || d.image || d.imagen) base.avatar = d.avatar || d.image || d.imagen;
      base.level = Number(d.level ?? d.nivel ?? base.level) || 1;
      base.className = d.class || d.clase || d.className || base.className;
      base.species = d.species || d.especie || base.species;
      base.hp = Number(d.hp?.current ?? d.hp?.actual ?? d.currentHp ?? (typeof d.hp === 'number' ? d.hp : base.hp));
      base.maxHp = Number(d.hp?.max ?? d.hp?.maximo ?? d.maxHp ?? base.maxHp ?? base.hp);
      base.ac = Number(d.ac ?? d.ca ?? base.ac);
      base.initiative = Number(d.initiative ?? d.iniciativa ?? base.initiative) || 0;
      base.speed = parseSpeedValue(d.speed ?? d.velocidad, base.speed || 9);
      if (d.stats || d.atributos) base.stats = d.stats || d.atributos;
      if (d.saves || d.salvaciones) base.saves = d.saves || d.salvaciones;
      if (d.skills || d.habilidades) base.skills = d.skills || d.habilidades;
      if (Array.isArray(d.weapons || d.armas)) base.weapons = d.weapons || d.armas;
      if (Array.isArray(d.features || d.rasgos)) base.features = d.features || d.rasgos;
      if (Array.isArray(d.feats || d.dotes)) base.feats = d.feats || d.dotes;
      if (d.spells || d.conjuros) base.spells = d.spells || d.conjuros;
      hydrateCombatant(base);
      if (mode === 'add') { state.combatants.push(base); state.viewedId = base.id; }
      addLog(base.name, mode === 'add' ? 'se une desde JSON' : 'actualiza ficha desde JSON', `${base.className} · PG ${base.hp}/${base.maxHp}`, '⇧');
      saveState(); renderAll(); closeDialog(dialogs.import); toast(`Ficha de ${base.name} importada`);
    } catch { toast('No se pudo leer ese archivo JSON'); }
    e.target.value = '';
  });

  // Manuals
  function syncManualButtons() {
    $$('.manual-add[data-manual]').forEach(btn => {
      const enabled = state.enabledManuals.includes(btn.dataset.manual);
      btn.textContent = enabled ? '✓ Activo' : '＋ Activar';
      btn.style.opacity = enabled ? '.75' : '1';
    });
  }
  syncManualButtons();
  $$('.manual-add[data-manual]').forEach(btn => btn.addEventListener('click', () => {
    const name = btn.dataset.manual;
    if (state.enabledManuals.includes(name)) state.enabledManuals = state.enabledManuals.filter(x => x !== name);
    else state.enabledManuals.push(name);
    saveState(); syncManualButtons();
  }));
  $('#customManual').addEventListener('click', () => $('#manualFile').click());
  $('#manualFile').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const d = JSON.parse(await file.text());
      const items = d.actions || d.acciones || d.features || d.rasgos || [];
      const c = viewed(); let added = 0;
      items.forEach((item, idx) => {
        const name = typeof item === 'string' ? item : item.name || item.nombre; if (!name) return;
        const rawKind = typeof item === 'object' ? (item.kind || item.tipo) : 'action';
        const kind = ['action', 'bonus', 'reaction', 'passive'].includes(rawKind) ? rawKind : 'action';
        c.customActions.push({ id: `json-${Date.now()}-${idx}`, name, kind, dice: typeof item === 'object' ? (item.dice || item.dados || '') : '', description: typeof item === 'object' ? (item.description || item.descripcion || '') : 'Importado desde JSON.' });
        added++;
      });
      saveState(); renderActionGroups(c); closeDialog(dialogs.manual); toast(`${added} opciones guardadas`);
    } catch { toast('No se pudo leer el archivo JSON'); }
    e.target.value = '';
  });

  // Nivel20 & Settings
  $('#openN20SiteBtn').addEventListener('click', () => window.open($('#n20UrlInput').value.trim() || state.nivel20.url || 'https://nivel20.com', '_blank', 'noopener,noreferrer'));
  $('#copyInitOrderBtn').addEventListener('click', () => copyToClipboard(buildInitiativeSummaryText(), 'Orden de iniciativa copiado'));
  $('#saveN20Settings').addEventListener('click', () => { state.nivel20.url = $('#n20UrlInput').value.trim() || 'https://nivel20.com'; saveState(); closeDialog(dialogs.nivel20); toast('Enlace guardado'); });
  $('#skipDefeatedCheck').addEventListener('change', e => { state.skipDefeated = e.target.checked; saveState(); });
  $('#exportEncounterBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ronda-dm-r${state.round}.json`; a.click(); URL.revokeObjectURL(url);
    toast('Encuentro exportado como JSON');
  });
  $('#importEncounterBtn').addEventListener('click', () => $('#encounterFileInput').click());
  $('#encounterFileInput').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const loaded = JSON.parse(await file.text());
      if (!Array.isArray(loaded.combatants) || !loaded.combatants.length) throw new Error('invalid');
      loaded.combatants.forEach(hydrateCombatant);
      ensureMapState(loaded);
      state = loaded; saveState(); renderAll(); closeDialog(dialogs.settings); toast('Encuentro cargado');
    } catch { toast('Archivo JSON inválido'); }
    e.target.value = '';
  });
  $('#resetEncounterBtn').addEventListener('click', () => {
    if (!confirm('¿Reiniciar todo el encuentro a las fichas iniciales?')) return;
    state = buildDefaultState(); saveState(); renderAll(); closeDialog(dialogs.settings); toast('Encuentro reiniciado');
  });

  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if ($$('dialog[open]').length) return;
    if (e.key === '1') setMainView('encounter');
    if (e.key === '2') setMainView('map');
  });

  // =========================================================================
  // 2D TACTICAL BATTLE MAP ENGINE
  // =========================================================================
  function setMainView(view) {
    currentMainView = view === 'map' ? 'map' : 'encounter';
    $('#encounterView').hidden = currentMainView !== 'encounter';
    $('#mapView').hidden = currentMainView !== 'map';
    $('#encounterNav').classList.toggle('active', currentMainView === 'encounter');
    $('#mapNav').classList.toggle('active', currentMainView === 'map');
    if (currentMainView === 'map') {
      renderMapView();
      if (!mapInitializedView) {
        mapInitializedView = true;
        requestAnimationFrame(() => fitMapToViewport());
      }
    }
  }

  function getDefaultDarkvisionMeters(c) {
    if (!c || c.type === 'enemy') return 0;
    const feats = [...(c.features || []), ...(c.feats || [])].join(' ').toLowerCase();
    const sp = String(c.species || '').toLowerCase();
    const cls = String(c.className || '').toLowerCase();
    if (/visi[oó]n en la umbra|acechador en la penumbra/i.test(feats + ' ' + cls)) {
      return /elfo|enano|gnomo|infernal|tiefling|orco|semielfo|aasimar/i.test(sp) ? 27 : 18;
    }
    if (/visi[oó]n en la oscuridad/i.test(feats)) return 18;
    if (/elfo|semielfo|enano|gnomo|infernal|tiefling|orco|aasimar|drow/i.test(sp)) return 18;
    return 0;
  }

  function getLightRadiusMeters(lightType) {
    switch (lightType) {
      case 'torch': return { bright: 6, dim: 12 };
      case 'lantern': return { bright: 9, dim: 18 };
      case 'candle': return { bright: 1.5, dim: 3 };
      case 'daylight': return { bright: 18, dim: 36 };
      default: return { bright: 0, dim: 0 };
    }
  }

  function computePlayerVisionSourcesForDm() {
    const m = state.map;
    const gs = m.gridSize || 56;
    const light = m.lighting || 'day';
    const mToPx = meters => (meters / 1.5) * gs;
    const sources = [];

    state.combatants.forEach(c => {
      if (c.type === 'enemy') return;
      const tok = m.tokens[c.id];
      if (!tok || tok.hidden || c.hp <= 0) return;
      const dv = typeof tok.darkvision === 'number' ? tok.darkvision : getDefaultDarkvisionMeters(c);
      const carried = getLightRadiusMeters(tok.light || 'none');
      let brightM = 0, dimM = 0;
      if (light === 'day') { brightM = Math.max(36, dv, carried.bright); dimM = Math.max(48, carried.dim); }
      else if (light === 'dim') { brightM = Math.max(dv, carried.bright, 4.5); dimM = Math.max(dv + 6, carried.dim, 18); }
      else if (light === 'night') { brightM = Math.max(carried.bright, dv > 0 ? dv * 0.75 : 1.5); dimM = Math.max(carried.dim, dv > 0 ? dv : 3); }
      else { brightM = Math.max(carried.bright, dv > 0 ? dv * 0.65 : 1.2); dimM = Math.max(carried.dim, dv > 0 ? dv : 1.8); }
      sources.push({ x: tok.x, y: tok.y, brightPx: mToPx(brightM), dimPx: mToPx(dimM), hasLight: carried.bright > 0, dv });
    });

    (m.markers || []).forEach(mk => {
      if (mk.dmOnly) return;
      if (mk.icon === '🔥' || /antorcha|fuego|fogata|luz|linterna/i.test(mk.label || '')) {
        sources.push({ x: mk.x, y: mk.y, brightPx: mToPx(6), dimPx: mToPx(12), hasLight: true, dv: 0 });
      }
    });
    return sources;
  }

  function isEnemyVisibleToPlayers(tok, sources) {
    if (!tok || tok.hidden) return false;
    const m = state.map;
    if (!m.fogEnabled || (m.lighting || 'day') === 'day') return true;
    return sources.some(s => Math.hypot(tok.x - s.x, tok.y - s.y) <= s.dimPx);
  }

  function ensureTokenPositions() {
    ensureMapState(state);
    const m = state.map;
    const gs = m.gridSize || 56;
    const validIds = new Set(state.combatants.map(c => c.id));
    Object.keys(m.tokens).forEach(id => { if (!validIds.has(id)) delete m.tokens[id]; });

    let pcIdx = 0;
    let enemyIdx = 0;
    state.combatants.forEach(c => {
      if (m.tokens[c.id]) {
        if (m.tokens[c.id].darkvision === undefined && c.type !== 'enemy') {
          m.tokens[c.id].darkvision = getDefaultDarkvisionMeters(c);
        }
        if (!m.tokens[c.id].light) m.tokens[c.id].light = 'none';
        return;
      }
      if (c.type === 'enemy') {
        const col = Math.max(4, Math.floor(m.width / gs) - 3 - Math.floor(enemyIdx / 5));
        const row = 2 + (enemyIdx % 5);
        m.tokens[c.id] = { x: col * gs + gs / 2, y: row * gs + gs / 2, size: 1, hidden: false, darkvision: 0, light: 'none' };
        enemyIdx++;
      } else {
        const col = 2 + Math.floor(pcIdx / 4);
        const row = 2 + (pcIdx % 4);
        m.tokens[c.id] = { x: col * gs + gs / 2, y: row * gs + gs / 2, size: 1, hidden: false, darkvision: getDefaultDarkvisionMeters(c), light: 'none' };
        pcIdx++;
      }
    });
  }

  function snapCoord(val, gridSize, tokenSize = 1) {
    if (tokenSize % 2 === 0) return Math.round(val / gridSize) * gridSize;
    return Math.floor(val / gridSize) * gridSize + gridSize / 2;
  }

  function clampToStage(x, y) {
    const m = state.map;
    return {
      x: Math.max(18, Math.min(m.width - 18, x)),
      y: Math.max(18, Math.min(m.height - 18, y))
    };
  }

  function clientToStageCoords(clientX, clientY) {
    const vp = $('#mapViewport');
    const rect = vp.getBoundingClientRect();
    const m = state.map;
    return {
      x: (clientX - rect.left - m.panX) / m.zoom,
      y: (clientY - rect.top - m.panY) / m.zoom
    };
  }

  function calcGridDistanceMeters(x1, y1, x2, y2) {
    const gs = state.map.gridSize || 56;
    const dx = Math.abs(x2 - x1) / gs;
    const dy = Math.abs(y2 - y1) / gs;
    // D&D 5e/2024 standard diagonal movement = Chebyshev (max of dx, dy)
    const squares = Math.round(Math.max(dx, dy) * 2) / 2;
    const meters = Math.round(squares * 1.5 * 10) / 10;
    return { squares, meters };
  }

  function applyStageTransform() {
    const m = state.map;
    const stage = $('#mapStage');
    stage.style.width = `${m.width}px`;
    stage.style.height = `${m.height}px`;
    stage.style.transform = `translate(${m.panX}px, ${m.panY}px) scale(${m.zoom})`;
    $('#mapZoomLabel').textContent = `${Math.round(m.zoom * 100)}%`;
  }

  function fitMapToViewport() {
    const vp = $('#mapViewport');
    if (!vp || vp.clientWidth === 0) return;
    const m = state.map;
    const pad = 20;
    const zx = (vp.clientWidth - pad * 2) / m.width;
    const zy = (vp.clientHeight - pad * 2) / m.height;
    m.zoom = Math.max(0.3, Math.min(1.5, Math.min(zx, zy)));
    m.panX = Math.round((vp.clientWidth - m.width * m.zoom) / 2);
    m.panY = Math.round((vp.clientHeight - m.height * m.zoom) / 2);
    applyStageTransform();
  }

  function centerMapOnPoint(stageX, stageY) {
    const vp = $('#mapViewport');
    if (!vp || vp.clientWidth === 0) return;
    const m = state.map;
    m.panX = Math.round(vp.clientWidth / 2 - stageX * m.zoom);
    m.panY = Math.round(vp.clientHeight / 2 - stageY * m.zoom);
    applyStageTransform();
  }

  function renderMapView() {
    ensureTokenPositions();
    const m = state.map;

    // Sync toolbar controls
    $('#mapGridToggle').checked = !!m.showGrid;
    $('#mapSnapToggle').checked = !!m.snap;
    $('#mapTrackMoveToggle').checked = !!m.trackMove;
    $('#mapGridSize').value = String(m.gridSize || 56);
    $('#mapLightingSelect').value = m.lighting || 'day';
    $('#mapFogToggle').checked = m.fogEnabled !== false;
    $('#mapFogMemoryToggle').checked = m.fogMemory !== false;
    $('#mapShowVisionRingsToggle').checked = m.showVisionRings !== false;
    $('#mapMeasureBtn').classList.toggle('tool-active', mapMeasureMode);
    $('#mapViewport').classList.toggle('measuring', mapMeasureMode);

    // Background image & grid
    const bgImg = $('#mapBgImg');
    if (m.bgImage) {
      bgImg.src = m.bgImage;
      bgImg.hidden = false;
      $('#mapEmptyHint').hidden = true;
    } else {
      bgImg.hidden = true;
      bgImg.removeAttribute('src');
      $('#mapEmptyHint').hidden = false;
    }
    const gridEl = $('#mapGridOverlay');
    gridEl.hidden = !m.showGrid;
    gridEl.style.setProperty('--grid-size', `${m.gridSize}px`);

    applyStageTransform();

    // Compute player vision sources & draw DM preview vision rings
    const visionSources = computePlayerVisionSourcesForDm();
    const visionSvg = $('#mapVisionSvg');
    visionSvg.replaceChildren();
    if (m.showVisionRings && (m.lighting || 'day') !== 'day') {
      visionSources.forEach(s => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(s.x));
        circle.setAttribute('cy', String(s.y));
        circle.setAttribute('r', String(s.dimPx));
        circle.setAttribute('class', s.hasLight ? 'vision-ring-light' : 'vision-ring-dv');
        visionSvg.append(circle);
      });
    }

    // Render Tokens & Custom Markers on stage
    const layer = $('#mapTokensLayer');
    layer.replaceChildren();

    state.combatants.forEach(c => {
      const tok = m.tokens[c.id];
      if (!tok) return;
      const sizeMult = Number(tok.size) || 1;
      const px = Math.max(30, Math.round(m.gridSize * sizeMult * 0.92));
      const hiddenInDark = c.type === 'enemy' && !isEnemyVisibleToPlayers(tok, visionSources);

      const el = document.createElement('div');
      el.className = 'map-token';
      if (c.type === 'enemy') el.classList.add('enemy-token');
      if (c.id === state.activeTurnId) el.classList.add('active-token');
      if (c.defeated || c.hp <= 0) el.classList.add('defeated-token');
      if (tok.hidden || hiddenInDark) el.classList.add('in-darkness-dm');
      if (tok.hidden) el.style.opacity = '0.5';
      el.dataset.tokenId = c.id;
      el.style.left = `${tok.x}px`;
      el.style.top = `${tok.y}px`;
      el.style.setProperty('--token-px', `${px}px`);
      el.title = `${c.name} · PG ${c.hp}/${c.maxHp} · CA ${c.ac ?? '—'}${tok.hidden ? ' · Oculto manualmente (solo DM)' : hiddenInDark ? ' · En oscuridad (invisible para jugadores)' : ''}`;

      const disc = document.createElement('div');
      disc.className = 'map-token-disc';
      if (c.avatar) {
        const img = document.createElement('img');
        img.src = c.avatar;
        img.alt = c.name;
        img.onerror = () => { img.remove(); disc.textContent = c.name.slice(0, 1).toUpperCase(); };
        disc.append(img);
      } else {
        disc.textContent = c.name.slice(0, 1).toUpperCase();
      }

      const hpWrap = document.createElement('span');
      hpWrap.className = 'map-token-hp';
      const hpFill = document.createElement('i');
      const pct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
      hpFill.style.width = `${pct}%`;
      const cls = hpClass(c.hp, c.maxHp);
      if (cls) hpFill.className = cls;
      hpWrap.append(hpFill);

      const label = document.createElement('span');
      label.className = 'map-token-label';
      label.textContent = c.name;

      el.append(disc, hpWrap, label);

      // Indicator for DM showing when enemy is invisible to players (darkness / hidden)
      if (tok.hidden || hiddenInDark) {
        const darkPill = document.createElement('span');
        darkPill.className = 'map-token-dark-pill';
        darkPill.textContent = tok.hidden ? '◌' : '🌑';
        el.append(darkPill);
      }

      const isMarked = state.combatants.some(x => x.markedTargetId === c.id);
      if (isMarked || c.raging || (tok.light && tok.light !== 'none')) {
        const b = document.createElement('span');
        b.className = 'map-token-badge';
        b.textContent = tok.light && tok.light !== 'none' ? '🔥' : c.raging ? '⚡' : '◎';
        el.append(b);
      }

      attachTokenDrag(el, c, tok);
      layer.append(el);
    });

    // Free Markers
    m.markers.forEach(mk => {
      const el = document.createElement('div');
      el.className = `map-marker-pin${mk.dmOnly ? ' dm-only-pin' : ''}`;
      el.style.left = `${mk.x}px`;
      el.style.top = `${mk.y}px`;
      el.style.setProperty('--pin-color', mk.color || '#d3b878');
      el.innerHTML = '<div class="map-marker-head"><span></span></div><span class="map-marker-label"></span>';
      el.querySelector('.map-marker-head span').textContent = mk.icon || '📍';
      el.querySelector('.map-marker-label').textContent = `${mk.dmOnly ? '🔒 ' : ''}${mk.label || 'Pin'}`;
      attachMarkerDrag(el, mk);
      layer.append(el);
    });

    // Render Map Side Panel: Combatant Roster (with Darkvision & Torch/Light controls for PCs!)
    const rosterRoot = $('#mapRosterList');
    rosterRoot.replaceChildren();
    state.combatants.forEach(c => {
      const tok = m.tokens[c.id];
      const hiddenInDark = c.type === 'enemy' && !isEnemyVisibleToPlayers(tok, visionSources);
      const row = document.createElement('div');
      row.className = `map-roster-row${c.id === state.activeTurnId ? ' active-row' : ''}`;

      const av = document.createElement('div');
      av.className = 'map-roster-avatar';
      if (c.avatar) {
        const img = document.createElement('img');
        img.src = c.avatar; img.alt = c.name;
        img.onerror = () => { img.remove(); av.textContent = c.name.slice(0, 1).toUpperCase(); };
        av.append(img);
      } else {
        av.textContent = c.name.slice(0, 1).toUpperCase();
      }

      const info = document.createElement('div');
      info.className = 'map-roster-info';
      info.innerHTML = '<b></b><small></small>';
      info.querySelector('b').textContent = c.name;
      info.querySelector('small').textContent = c.type === 'enemy'
        ? `PG ${c.hp}/${c.maxHp} · ${tok?.hidden ? 'Oculto (DM)' : hiddenInDark ? '🌑 Invisible en oscuridad' : '👁 Visible a jugadores'}`
        : `PG ${c.hp}/${c.maxHp} · Vis. osc. ${tok?.darkvision ?? 0} m`;
      info.addEventListener('click', () => {
        if (tok) centerMapOnPoint(tok.x, tok.y);
        inspectCombatant(c.id);
      });

      const ctrls = document.createElement('div');
      ctrls.className = 'map-roster-controls';

      const sizeSel = document.createElement('select');
      sizeSel.title = 'Tamaño del pin en casillas';
      [1, 2, 3].forEach(sz => sizeSel.add(new Option(`${sz}×${sz}`, String(sz))));
      sizeSel.value = String(tok?.size || 1);
      sizeSel.addEventListener('change', e => {
        if (tok) tok.size = Number(e.target.value) || 1;
        saveState();
        renderMapView();
      });

      const visBtn = document.createElement('button');
      visBtn.type = 'button';
      visBtn.textContent = tok?.hidden ? '◌' : '👁';
      visBtn.title = tok?.hidden ? 'Mostrar a los jugadores (si está en visión)' : 'Ocultar a los jugadores (solo DM)';
      if (tok?.hidden) visBtn.className = 'pin-hidden-btn';
      visBtn.addEventListener('click', () => {
        if (tok) tok.hidden = !tok.hidden;
        saveState();
        renderMapView();
      });

      ctrls.append(sizeSel, visBtn);
      row.append(av, info, ctrls);

      // Vision & Light source controls for PCs
      if (c.type !== 'enemy' && tok) {
        const subrow = document.createElement('div');
        subrow.className = 'map-roster-subrow';

        const dvLabel = document.createElement('label');
        dvLabel.innerHTML = '<span>Oscuridad (m)</span><input type="number" min="0" max="60" step="1.5">';
        const dvInp = dvLabel.querySelector('input');
        dvInp.value = String(tok.darkvision ?? getDefaultDarkvisionMeters(c));
        dvInp.addEventListener('change', e => {
          tok.darkvision = Math.max(0, parseFloat(e.target.value) || 0);
          saveState();
          renderMapView();
        });

        const lightLabel = document.createElement('label');
        lightLabel.innerHTML = '<span>Luz</span><select><option value="none">Sin luz</option><option value="torch">🔥 Antorcha (6+6m)</option><option value="lantern">🏮 Linterna (9+9m)</option><option value="candle">🕯 Vela (1.5+1.5m)</option><option value="daylight">☀ Luz día (18+18m)</option></select>';
        const lSel = lightLabel.querySelector('select');
        lSel.value = tok.light || 'none';
        lSel.addEventListener('change', e => {
          tok.light = e.target.value;
          saveState();
          renderMapView();
        });

        subrow.append(dvLabel, lightLabel);
        row.append(subrow);
      }

      rosterRoot.append(row);
    });

    // Render Map Side Panel: Custom Markers
    const mkRoot = $('#mapMarkersList');
    mkRoot.replaceChildren();
    if (!m.markers.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-targets';
      empty.textContent = 'Sin pines libres. Pulsa «📍 Añadir pin libre» para marcar trampas, puertas o tesoros.';
      mkRoot.append(empty);
    } else {
      m.markers.forEach(mk => {
        const row = document.createElement('div');
        row.className = 'map-roster-row';
        const av = document.createElement('div');
        av.className = 'map-roster-avatar';
        av.style.background = mk.color || '#d3b878';
        av.style.color = '#141812';
        av.textContent = mk.icon || '📍';

        const info = document.createElement('div');
        info.className = 'map-roster-info';
        info.innerHTML = '<b></b><small>Pin libre · clic para centrar</small>';
        info.querySelector('b').textContent = mk.label;
        info.addEventListener('click', () => centerMapOnPoint(mk.x, mk.y));

        const ctrls = document.createElement('div');
        ctrls.className = 'map-roster-controls';
        const del = document.createElement('button');
        del.type = 'button';
        del.textContent = '×';
        del.title = 'Eliminar pin';
        del.addEventListener('click', () => {
          m.markers = m.markers.filter(x => x.id !== mk.id);
          saveState();
          renderMapView();
        });
        ctrls.append(del);
        row.append(av, info, ctrls);
        mkRoot.append(row);
      });
    }
  }

  function attachTokenDrag(el, combatant, tok) {
    el.addEventListener('pointerdown', e => {
      if (mapMeasureMode || e.button !== 0) return;
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      const startPt = clientToStageCoords(e.clientX, e.clientY);
      const origX = tok.x;
      const origY = tok.y;
      let movedPx = 0;

      const onMove = ev => {
        const cur = clientToStageCoords(ev.clientX, ev.clientY);
        const dx = cur.x - startPt.x;
        const dy = cur.y - startPt.y;
        movedPx = Math.hypot(dx, dy);
        const clamped = clampToStage(origX + dx, origY + dy);
        tok.x = clamped.x;
        tok.y = clamped.y;
        el.style.left = `${tok.x}px`;
        el.style.top = `${tok.y}px`;
        const dist = calcGridDistanceMeters(origX, origY, tok.x, tok.y);
        const badge = $('#mapDragDistance');
        badge.hidden = false;
        badge.textContent = `${combatant.name}: ${formatMeters(dist.meters)} m (${dist.squares} casillas)`;
        broadcastStateThrottled();
      };

      const onUp = ev => {
        el.classList.remove('dragging');
        el.releasePointerCapture(ev.pointerId);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
        $('#mapDragDistance').hidden = true;

        if (movedPx < 4) {
          inspectCombatant(combatant.id);
          return;
        }

        if (state.map.snap) {
          const snapped = clampToStage(
            snapCoord(tok.x, state.map.gridSize, tok.size || 1),
            snapCoord(tok.y, state.map.gridSize, tok.size || 1)
          );
          tok.x = snapped.x;
          tok.y = snapped.y;
        }

        const dist = calcGridDistanceMeters(origX, origY, tok.x, tok.y);
        if (state.map.trackMove && dist.meters > 0 && combatant.id === state.activeTurnId) {
          combatant.turnMovement = Math.max(0, Math.round((combatant.turnMovement - dist.meters) * 10) / 10);
          combatant.turnMoved = true;
          combatant.turnState.movement = combatant.turnMovement > 0;
          addLog(combatant.name, `se mueve ${formatMeters(dist.meters)} m en el Mapa 2D`, `${formatMeters(combatant.turnMovement)} m restantes`, '⌁');
          toast(`${combatant.name} movido ${formatMeters(dist.meters)} m (quedan ${formatMeters(combatant.turnMovement)} m)`);
        }

        saveState();
        renderAll();
      };

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
    });
  }

  function attachMarkerDrag(el, mk) {
    el.addEventListener('pointerdown', e => {
      if (mapMeasureMode || e.button !== 0) return;
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      const startPt = clientToStageCoords(e.clientX, e.clientY);
      const origX = mk.x;
      const origY = mk.y;

      const onMove = ev => {
        const cur = clientToStageCoords(ev.clientX, ev.clientY);
        const clamped = clampToStage(origX + (cur.x - startPt.x), origY + (cur.y - startPt.y));
        mk.x = clamped.x;
        mk.y = clamped.y;
        el.style.left = `${mk.x}px`;
        el.style.top = `${mk.y}px`;
      };

      const onUp = ev => {
        el.classList.remove('dragging');
        el.releasePointerCapture(ev.pointerId);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
        saveState();
      };

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
    });
  }

  // Viewport Panning, Wheel Zoom & Measuring Ruler
  (() => {
    const vp = $('#mapViewport');
    vp.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      if (e.target.closest('.map-token, .map-marker-pin')) return;
      vp.setPointerCapture(e.pointerId);

      if (mapMeasureMode) {
        const p0 = clientToStageCoords(e.clientX, e.clientY);
        const svg = $('#mapMeasureSvg');
        const line = $('#mapMeasureLine');
        const c1 = $('#mapMeasureStart');
        const c2 = $('#mapMeasureEnd');
        const badge = $('#mapMeasureBadge');
        svg.hidden = false;
        badge.hidden = false;
        c1.setAttribute('cx', p0.x); c1.setAttribute('cy', p0.y);
        c2.setAttribute('cx', p0.x); c2.setAttribute('cy', p0.y);
        line.setAttribute('x1', p0.x); line.setAttribute('y1', p0.y);
        line.setAttribute('x2', p0.x); line.setAttribute('y2', p0.y);

        const onMeasure = ev => {
          const p1 = clientToStageCoords(ev.clientX, ev.clientY);
          c2.setAttribute('cx', p1.x); c2.setAttribute('cy', p1.y);
          line.setAttribute('x2', p1.x); line.setAttribute('y2', p1.y);
          const dist = calcGridDistanceMeters(p0.x, p0.y, p1.x, p1.y);
          badge.style.left = `${(p0.x + p1.x) / 2}px`;
          badge.style.top = `${(p0.y + p1.y) / 2}px`;
          badge.textContent = `${formatMeters(dist.meters)} m (${dist.squares} casillas)`;
        };

        const endMeasure = ev => {
          vp.releasePointerCapture(ev.pointerId);
          vp.removeEventListener('pointermove', onMeasure);
          vp.removeEventListener('pointerup', endMeasure);
          vp.removeEventListener('pointercancel', endMeasure);
          setTimeout(() => { svg.hidden = true; badge.hidden = true; }, 1600);
        };

        vp.addEventListener('pointermove', onMeasure);
        vp.addEventListener('pointerup', endMeasure);
        vp.addEventListener('pointercancel', endMeasure);
        return;
      }

      vp.classList.add('panning');
      const startX = e.clientX;
      const startY = e.clientY;
      const origPanX = state.map.panX;
      const origPanY = state.map.panY;

      const onPan = ev => {
        state.map.panX = origPanX + (ev.clientX - startX);
        state.map.panY = origPanY + (ev.clientY - startY);
        applyStageTransform();
      };

      const endPan = ev => {
        vp.classList.remove('panning');
        vp.releasePointerCapture(ev.pointerId);
        vp.removeEventListener('pointermove', onPan);
        vp.removeEventListener('pointerup', endPan);
        vp.removeEventListener('pointercancel', endPan);
        saveState();
      };

      vp.addEventListener('pointermove', onPan);
      vp.addEventListener('pointerup', endPan);
      vp.addEventListener('pointercancel', endPan);
    });

    vp.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      const rect = vp.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prevZoom = state.map.zoom;
      const nextZoom = Math.max(0.3, Math.min(2.6, prevZoom * factor));
      state.map.panX = mx - ((mx - state.map.panX) / prevZoom) * nextZoom;
      state.map.panY = my - ((my - state.map.panY) / prevZoom) * nextZoom;
      state.map.zoom = nextZoom;
      applyStageTransform();
    }, { passive: false });
  })();

  // Map Toolbar & Dialog Events
  $('#mapUploadBtn').addEventListener('click', () => $('#mapBgFileInput').click());
  $('#mapBgFileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(320, Math.round(img.width * scale));
        const h = Math.max(240, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        state.map.bgImage = canvas.toDataURL('image/jpeg', 0.84);
        state.map.width = w;
        state.map.height = h;
        saveState();
        renderMapView();
        requestAnimationFrame(() => fitMapToViewport());
        toast(`Mapa cargado (${w}×${h}px)`);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  $('#mapUrlBtn').addEventListener('click', () => {
    $('#mapBgUrlInput').value = state.map.bgImage && !state.map.bgImage.startsWith('data:') ? state.map.bgImage : '';
    openDialog(dialogs.mapUrl);
  });

  $('#applyMapUrlBtn').addEventListener('click', () => {
    const url = $('#mapBgUrlInput').value.trim();
    if (!url) { toast('Escribe una URL de imagen válida'); return; }
    const img = new Image();
    img.onload = () => {
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1280, img.naturalHeight || 840));
      state.map.width = Math.max(320, Math.round((img.naturalWidth || 1280) * scale));
      state.map.height = Math.max(240, Math.round((img.naturalHeight || 840) * scale));
      state.map.bgImage = url;
      saveState();
      renderMapView();
      requestAnimationFrame(() => fitMapToViewport());
      closeDialog(dialogs.mapUrl);
      toast('Imagen de fondo aplicada al Mapa 2D');
    };
    img.onerror = () => {
      state.map.bgImage = url;
      saveState();
      renderMapView();
      closeDialog(dialogs.mapUrl);
      toast('URL aplicada (si no carga, revisa que sea un enlace directo a imagen)');
    };
    img.src = url;
  });

  $('#mapClearBgBtn').addEventListener('click', () => {
    state.map.bgImage = '';
    state.map.width = 1280;
    state.map.height = 840;
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove('rondaMapBgImage').catch(() => {});
    }
    saveState();
    renderMapView();
    fitMapToViewport();
    toast('Fondo del mapa eliminado');
  });

  $('#mapGridToggle').addEventListener('change', e => { state.map.showGrid = e.target.checked; saveState(); renderMapView(); });
  $('#mapSnapToggle').addEventListener('change', e => { state.map.snap = e.target.checked; saveState(); });
  $('#mapTrackMoveToggle').addEventListener('change', e => { state.map.trackMove = e.target.checked; saveState(); });
  $('#mapGridSize').addEventListener('input', e => { state.map.gridSize = Number(e.target.value) || 56; renderMapView(); });
  $('#mapGridSize').addEventListener('change', () => saveState());
  $('#mapZoomIn').addEventListener('click', () => { state.map.zoom = Math.min(2.6, state.map.zoom * 1.18); applyStageTransform(); saveState(); });
  $('#mapZoomOut').addEventListener('click', () => { state.map.zoom = Math.max(0.3, state.map.zoom * 0.85); applyStageTransform(); saveState(); });
  $('#mapResetViewBtn').addEventListener('click', () => { fitMapToViewport(); saveState(); });
  $('#mapMeasureBtn').addEventListener('click', () => {
    mapMeasureMode = !mapMeasureMode;
    renderMapView();
    toast(mapMeasureMode ? 'Regla activa: arrastra sobre el mapa para medir distancia en metros' : 'Regla desactivada');
  });

  $('#mapResetPinsBtn').addEventListener('click', () => {
    state.map.tokens = {};
    ensureTokenPositions();
    saveState();
    renderMapView();
    toast('Pines realineados en formación inicial');
  });

  const openNewMarker = () => {
    $('#markerLabelInput').value = '';
    $('#markerIconSelect').value = '📍';
    $('#markerColorSelect').value = '#d3b878';
    $('#markerDmOnlyCheck').checked = false;
    openDialog(dialogs.mapMarker);
  };
  $('#mapAddMarkerBtn').addEventListener('click', openNewMarker);
  $('#mapAddMarkerSideBtn').addEventListener('click', openNewMarker);
  $('#saveMapMarkerBtn').addEventListener('click', () => {
    const label = $('#markerLabelInput').value.trim() || 'Punto de interés';
    const vp = $('#mapViewport');
    const center = vp && vp.clientWidth
      ? clampToStage((vp.clientWidth / 2 - state.map.panX) / state.map.zoom, (vp.clientHeight / 2 - state.map.panY) / state.map.zoom)
      : { x: state.map.width / 2, y: state.map.height / 2 };
    state.map.markers.push({
      id: `mk-${Date.now()}`,
      label,
      icon: $('#markerIconSelect').value,
      color: $('#markerColorSelect').value,
      dmOnly: $('#markerDmOnlyCheck').checked,
      x: center.x,
      y: center.y
    });
    saveState();
    renderMapView();
    closeDialog(dialogs.mapMarker);
    toast(`Pin «${label}» colocado en el mapa`);
  });

  // Lighting, Fog of War & Dual-Tab Controls
  $('#mapLightingSelect').addEventListener('change', e => {
    state.map.lighting = e.target.value;
    saveState();
    renderMapView();
    toast(`Iluminación cambiada: ${e.target.selectedOptions[0]?.textContent || e.target.value}`);
  });
  $('#mapFogToggle').addEventListener('change', e => { state.map.fogEnabled = e.target.checked; saveState(); renderMapView(); });
  $('#mapFogMemoryToggle').addEventListener('change', e => { state.map.fogMemory = e.target.checked; saveState(); });
  $('#mapShowVisionRingsToggle').addEventListener('change', e => { state.map.showVisionRings = e.target.checked; saveState(); renderMapView(); });
  $('#mapResetFogBtn').addEventListener('click', () => {
    state.map.fogResetStamp = Date.now();
    saveState();
    toast('Niebla de guerra reiniciada en la pantalla de jugadores');
  });

  $('#syncPlayerCameraBtn').addEventListener('click', () => {
    if (vttChannel) {
      vttChannel.postMessage({
        type: 'SYNC_CAMERA',
        camera: { zoom: state.map.zoom, panX: state.map.panX, panY: state.map.panY }
      });
    }
    toast('Cámara sincronizada con la Pantalla de Jugadores');
  });

  $('#openPlayerMapBtn').addEventListener('click', () => {
    saveState();
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      chrome.runtime.sendMessage({ type: 'RONDA_OPEN_PLAYER_MAP_TAB' });
    } else {
      window.open('player-map.html', '_blank');
    }
    toast('Abriendo Pantalla de Jugadores (con Niebla de Guerra)…');
  });

  $('#openDmMapTabBtn').addEventListener('click', () => {
    saveState();
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      chrome.runtime.sendMessage({ type: 'RONDA_OPEN_DM_MAP_TAB' });
    } else {
      window.open('index.html?view=map', '_blank');
    }
  });

  // Respond to Player Map / other DM tabs requesting live state
  if (vttChannel) {
    vttChannel.addEventListener('message', ev => {
      const msg = ev.data;
      if (!msg) return;
      if (msg.type === 'REQUEST_STATE') {
        broadcastStateNow();
      } else if (msg.type === 'STATE_UPDATE' && msg.state && Array.isArray(msg.state.combatants)) {
        msg.state.combatants.forEach(hydrateCombatant);
        ensureMapState(msg.state);
        state = msg.state;
        renderAll();
      }
    });
  }

  // Restore large map background from chrome.storage.local if localStorage trimmed it
  if (typeof chrome !== 'undefined' && chrome.storage?.local && !state.map.bgImage) {
    chrome.storage.local.get('rondaMapBgImage', data => {
      if (data?.rondaMapBgImage) {
        state.map.bgImage = data.rondaMapBgImage;
        renderMapView();
      }
    });
  }

  // =========================================================================
  // CHROME EXTENSION INTEGRATION (NIVEL20 TAB SYNC)
  // =========================================================================
  const isChromeExtension = typeof chrome !== 'undefined' && !!chrome.runtime?.id;

  function applySyncedNivel20Character(incoming) {
    if (!incoming || !incoming.name) return;
    const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const incomingKey = norm(incoming.name);
    let target = state.combatants.find(c => {
      const ck = norm(c.name);
      return ck === incomingKey || (ck.length >= 4 && incomingKey.includes(ck)) || (incomingKey.length >= 4 && ck.includes(incomingKey));
    });

    const isNew = !target;
    if (!target) {
      target = {
        id: `n20-${Date.now()}`,
        type: 'pc',
        name: incoming.name,
        level: incoming.level || 1,
        className: incoming.className || 'Aventurero',
        species: incoming.species || 'Personaje',
        hp: incoming.hp ?? 20,
        maxHp: incoming.maxHp ?? incoming.hp ?? 20,
        ac: incoming.ac ?? 12,
        initiative: incoming.initiative ?? 0,
        speed: incoming.speed ?? 9,
        stats: incoming.stats || { Fue: '10 (0)', Des: '10 (0)', Con: '10 (0)', Int: '10 (0)', Sab: '10 (0)', Car: '10 (0)' },
        features: [],
        feats: [],
        weapons: []
      };
      state.combatants.push(target);
    }

    if (incoming.avatar) target.avatar = incoming.avatar;
    if (incoming.level) target.level = incoming.level;
    if (incoming.className) target.className = incoming.className;
    if (incoming.species) target.species = incoming.species;
    if (incoming.hp != null && incoming.maxHp != null) {
      target.hp = incoming.hp;
      target.maxHp = Math.max(1, incoming.maxHp);
    }
    if (incoming.ac != null) target.ac = incoming.ac;
    if (incoming.initiative != null) target.initiative = incoming.initiative;
    if (incoming.speed != null) target.speed = incoming.speed;
    if (incoming.stats && Object.keys(incoming.stats).length >= 3) {
      target.stats = { ...(target.stats || {}), ...incoming.stats };
    }
    if (Array.isArray(incoming.weapons) && incoming.weapons.length) {
      // Preserve existing masteries/tags on matching weapon names
      const oldMap = new Map((target.weapons || []).map(w => [norm(w.name), w]));
      target.weapons = incoming.weapons.map(w => {
        const prev = oldMap.get(norm(w.name));
        return prev ? { ...prev, ...w, tags: prev.tags, mastery: prev.mastery, range: prev.range, ability: prev.ability } : w;
      });
    }
    if (incoming.spells) {
      target.spells = { ...(target.spells || {}), ...incoming.spells };
    }

    hydrateCombatant(target);
    state.viewedId = target.id;
    addLog(
      'Nivel20',
      isNew ? `importa nuevo personaje: ${target.name}` : `sincroniza ficha de ${target.name}`,
      `PG ${target.hp}/${target.maxHp} · CA ${target.ac}${incoming.avatar ? ' · Retrato actualizado' : ''}`,
      '⟳'
    );
    saveState();
    renderAll();
    toast(`✓ ${target.name} actualizado desde Nivel20`);
  }

  if (isChromeExtension) {
    const syncBtn = $('#syncNivel20TabBtn');
    if (syncBtn) {
      syncBtn.hidden = false;
      syncBtn.addEventListener('click', () => {
        toast('Leyendo ficha abierta en Nivel20…');
        chrome.runtime.sendMessage({ type: 'RONDA_SYNC_FROM_NIVEL20' }, res => {
          if (chrome.runtime.lastError) {
            toast(chrome.runtime.lastError.message);
            return;
          }
          if (!res?.ok) {
            toast(res?.error || 'Abre una ficha de personaje en nivel20.com primero');
          }
        });
      });
    }

    chrome.runtime.onMessage.addListener(msg => {
      if (msg?.type === 'RONDA_CHARACTERS_SYNCED' && Array.isArray(msg.characters)) {
        msg.characters.forEach(applySyncedNivel20Character);
        if (msg.characters.length > 1) {
          const withImgs = msg.characters.filter(c => c.avatar).length;
          toast(`✓ ${msg.characters.length} personajes actualizados desde Nivel20 (${withImgs} retratos reales)`);
        }
        chrome.storage.local.remove('rondaPendingSync').catch(() => {});
      }
    });

    chrome.storage.local.get('rondaPendingSync', data => {
      const pending = data?.rondaPendingSync;
      if (pending?.characters?.length) {
        pending.characters.forEach(applySyncedNivel20Character);
        chrome.storage.local.remove('rondaPendingSync').catch(() => {});
      }
    });
  }

  // =========================================================================
  // MOBILE PLAYER LIVE SYNC (HYBRID QR / WEBRTC)
  // =========================================================================
  function renderMobileQrCode(joinUrl) {
    const box = $('#msQrBox');
    if (!box) return;
    if (typeof window.qrcode !== 'function') {
      box.textContent = 'QR no disponible';
      return;
    }
    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(joinUrl);
      qr.make();
      box.innerHTML = qr.createSvgTag({ scalable: true, margin: 2 });
    } catch {
      box.textContent = 'URL demasiado larga para QR';
    }
  }

  function initMobileSyncUI() {
    if (!window.RondaSync) return;
    const baseInput = $('#msBaseUrlInput');
    const codeEl = $('#msRoomCode');
    const topBtn = $('#mobileSyncTopBtn');

    // If running over http/https (e.g. local preview or GitHub Pages), prefer current origin's player.html as default
    const defaultUrl = /^https?:$/i.test(location.protocol)
      ? new URL('player.html', location.href).toString()
      : window.RondaSync.getSavedPlayerBaseUrl();
    if (baseInput) baseInput.value = defaultUrl;

    const refreshJoinTargets = code => {
      const cleanCode = code || window.RondaSync.getSavedRoomCode();
      if (codeEl) codeEl.textContent = cleanCode;
      const base = (baseInput?.value || defaultUrl).trim();
      const joinUrl = window.RondaSync.buildJoinUrl(cleanCode, base);
      renderMobileQrCode(joinUrl);
      return joinUrl;
    };

    const renderHostStatus = info => {
      const dot = $('#msStatusDot');
      const title = $('#msStatusTitle');
      const sub = $('#msStatusSub');
      const toggleBtn = $('#msToggleHostBtn');
      const countEl = $('#msClientsCount');
      const listEl = $('#msClientsList');
      const count = info.clients?.length || 0;

      if (dot) dot.className = `ms-dot ${info.status}`;
      if (topBtn) {
        topBtn.classList.toggle('live', info.status === 'open');
        const span = topBtn.querySelector('span');
        if (span) {
          span.textContent = info.status === 'open'
            ? (count > 0 ? `Celulares · ${count}` : 'Celulares · En vivo')
            : 'Celulares';
        }
      }

      if (info.status === 'open') {
        if (title) title.textContent = `Sala activa · Código ${info.code}`;
        if (sub) sub.textContent = 'Cualquier cambio de turno, PG o ficha de Nivel20 se envía al instante.';
        if (toggleBtn) toggleBtn.textContent = 'Detener sala';
      } else if (info.status === 'connecting') {
        if (title) title.textContent = 'Abriendo sala en vivo…';
        if (sub) sub.textContent = 'Conectando con el enlace P2P…';
        if (toggleBtn) toggleBtn.textContent = 'Cancelar';
      } else if (info.status === 'error') {
        if (title) title.textContent = 'Error de conexión';
        if (sub) sub.textContent = info.error || 'No se pudo abrir la sala P2P.';
        if (toggleBtn) toggleBtn.textContent = 'Reintentar sala';
      } else {
        if (title) title.textContent = 'Sala apagada';
        if (sub) sub.textContent = 'Los celulares igual pueden usar la guía offline con las fichas base.';
        if (toggleBtn) toggleBtn.textContent = 'Iniciar sala en vivo';
      }

      if (countEl) countEl.textContent = `${count} ${count === 1 ? 'conectado' : 'conectados'}`;
      if (listEl) {
        listEl.replaceChildren();
        if (!count) {
          const empty = document.createElement('small');
          empty.className = 'muted';
          empty.textContent = info.status === 'open'
            ? 'Esperando que los jugadores escaneen el QR o ingresen el código…'
            : 'Aún no hay celulares conectados. Activa la sala para recibir jugadores en vivo.';
          listEl.append(empty);
        } else {
          info.clients.forEach(cl => {
            const chip = document.createElement('span');
            chip.className = 'ms-client-chip';
            chip.textContent = `✓ ${cl.characterName}`;
            listEl.append(chip);
          });
        }
      }

      refreshJoinTargets(info.code);
    };

    mobileHost = new window.RondaSync.RondaLiveHost({
      getPayload: () => window.RondaSync.buildPlayerPayload(state, campaign?.name || 'Las Grietas de Aethelgard'),
      onStatusChange: renderHostStatus
    });

    renderHostStatus({ status: 'idle', code: mobileHost.code, error: '', clients: [] });

    topBtn?.addEventListener('click', () => {
      refreshJoinTargets(mobileHost.code);
      openDialog(dialogs.mobileSync);
    });

    $('#msToggleHostBtn')?.addEventListener('click', () => {
      if (mobileHost.isActive()) {
        mobileHost.stop();
        toast('Sala móvil detenida');
      } else {
        mobileHost.start(mobileHost.code);
      }
    });

    $('#msCopyCodeBtn')?.addEventListener('click', () => {
      copyToClipboard(mobileHost.code, `Código ${mobileHost.code} copiado`);
    });

    $('#msRegenCodeBtn')?.addEventListener('click', () => {
      const next = mobileHost.regenerateCode();
      refreshJoinTargets(next);
      toast(`Nuevo código de sala: ${next}`);
    });

    baseInput?.addEventListener('input', () => {
      window.RondaSync.savePlayerBaseUrl(baseInput.value);
      refreshJoinTargets(mobileHost.code);
    });

    $('#msCopyLinkBtn')?.addEventListener('click', () => {
      const url = refreshJoinTargets(mobileHost.code);
      copyToClipboard(url, 'Enlace con código de sala copiado');
    });

    $('#msPreviewBtn')?.addEventListener('click', () => {
      if (!mobileHost.isActive()) mobileHost.start(mobileHost.code);
      const localPath = `player.html?room=${encodeURIComponent(mobileHost.code)}`;
      if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
        window.open(chrome.runtime.getURL(localPath), '_blank', 'width=430,height=840');
      } else {
        window.open(localPath, '_blank', 'width=430,height=840');
      }
    });
  }

  initMobileSyncUI();

  renderAll();
  if (new URLSearchParams(location.search).get('view') === 'map') {
    setMainView('map');
  }
})();
