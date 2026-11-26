// Ronda — Guía Móvil de Jugador (D&D 2024 · Dados físicos)
// Modo Híbrido: 100% funcional offline con campaign-data.js + sincronización en vivo con la extensión del DM vía QR/WebRTC.
(() => {
  'use strict';

  const CHAR_PREF_KEY = 'ronda-player-selected-char';
  const ROOM_PREF_KEY = 'ronda-player-last-room';
  const CACHE_SYNC_KEY = 'ronda-player-cached-sync';
  const LOCAL_STATE_KEY = 'ronda-player-local-trackers';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // =========================================================================
  // D&D 2024 KNOWLEDGE BASE (ESPAÑOL · DADOS FÍSICOS)
  // =========================================================================
  const SPELL_META = {
    'descarga de fuego': { level: 0, type: 'action', attack: true, damage: '2d10', dmgType: 'fuego', desc: 'Ataque de conjuro a distancia que inflige daño de fuego (2d10 a nivel 5).' },
    'rayo de escarcha': { level: 0, type: 'action', attack: true, damage: '2d8', dmgType: 'frío', desc: 'Ataque de conjuro a distancia; inflige frío y reduce la velocidad del objetivo en 3 m.' },
    'ilusión menor': { level: 0, type: 'action', desc: 'Crea un sonido o una imagen inmóvil pequeña durante 1 minuto.' },
    'mano de mago': { level: 0, type: 'action', desc: 'Invoca una mano espectral flotante para manipular objetos a distancia.' },
    'prestidigitación': { level: 0, type: 'action', desc: 'Pequeños efectos mágicos sensoriales o utilitarios.' },
    'saber druídico': { level: 0, type: 'action', desc: 'Efectos menores ligados a la naturaleza (clima, flores, aromas o luces).' },
    'burla dañina': { level: 0, type: 'action', save: 'SAB', damage: '2d4', dmgType: 'psíquico', desc: 'El enemigo hace salvación de Sabiduría; si falla, recibe 2d4 psíquico y tiene desventaja en su próximo ataque.' },
    'guía': { level: 0, type: 'action', concentration: true, damage: '1d4', dmgType: 'bono a prueba', desc: 'Una criatura tocada suma 1d4 a una prueba de característica elegida.' },
    'látigo de espinas': { level: 0, type: 'action', attack: true, damage: '2d6', dmgType: 'perforante', desc: 'Ataque de conjuro; inflige daño perforante y atrae hasta 3 m a una criatura Grande o menor.' },
    'shillelagh': { level: 0, type: 'bonus', desc: 'Imbuye un bastón o garrote para atacar con Sabiduría y mejorar su dado de daño.' },
    'taumaturgia': { level: 0, type: 'action', desc: 'Efectos sobrenaturales menores con voz, llamas, puertas o temblores.' },
    'voluta estelar': { level: 0, type: 'action', attack: true, damage: '2d8', dmgType: 'radiante', desc: 'Ataque de conjuro a distancia de daño radiante; el objetivo emite luz tenue.' },

    'marca del cazador': { level: 1, type: 'bonus', concentration: true, desc: 'Marca a una criatura: tus ataques con arma contra ella suman +1d6 de daño de fuerza.' },
    'armadura de mago': { level: 1, type: 'action', desc: 'Una criatura sin armadura obtiene CA base 13 + modificador de Destreza durante 8 horas.' },
    'detectar magia': { level: 1, type: 'action', concentration: true, ritual: true, desc: 'Percibes la presencia de magia a 9 m durante hasta 10 minutos.' },
    'dormir': { level: 1, type: 'action', concentration: true, save: 'SAB', desc: 'Las criaturas en el área hacen salvación de Sabiduría o quedan incapacitadas / inconscientes.' },
    'encontrar familiar': { level: 1, type: 'other', ritual: true, desc: 'Invoca un espíritu familiar con forma animal que actúa según tus órdenes.' },
    'escudo': { level: 1, type: 'reaction', desc: 'Reacción al ser impactado: +5 a tu CA hasta el inicio de tu próximo turno y bloquea Proyectil mágico.' },
    'proyectil mágico': { level: 1, type: 'action', damage: '3d4+3', dmgType: 'fuerza (impacta seguro)', desc: 'Crea 3 dardos de fuerza que impactan automáticamente (1d4+1 cada uno).' },
    'alarma': { level: 1, type: 'other', ritual: true, desc: 'Protege un área durante 8 horas y avisa cuando una criatura entra.' },
    'buenas bayas': { level: 1, type: 'action', desc: 'Crea hasta 10 bayas mágicas; cada una restaura 1 PG y nutre por un día.' },
    'curar heridas': { level: 1, type: 'action', heal: '2d8', desc: 'Una criatura que toques recupera 2d8 + tu mod. de lanzamiento PG (D&D 2024).' },
    'detectar venenos y enfermedades': { level: 1, type: 'action', concentration: true, ritual: true, desc: 'Detectas venenos, criaturas venenosas y enfermedades a 9 m.' },
    'disfrazarse': { level: 1, type: 'action', desc: 'Cambias mágicamente tu apariencia y vestimenta durante 1 hora.' },
    'encantar animal': { level: 1, type: 'action', save: 'SAB', desc: 'Una bestia hace salvación de Sabiduría o queda hechizada por ti.' },
    'enmarañar': { level: 1, type: 'action', concentration: true, save: 'FUE', desc: 'Enredaderas en un cuadrado de 6 m; salvación de Fuerza o quedan apresadas.' },
    'golpe apresador': { level: 1, type: 'bonus', concentration: true, save: 'FUE', desc: 'Al impactar con un arma, invoca enredaderas que pueden apresar y dañar al objetivo.' },
    'zancada prodigiosa': { level: 1, type: 'action', desc: 'Aumenta en +3 m la velocidad de una criatura durante 1 hora.' },
    'caída de pluma': { level: 1, type: 'reaction', desc: 'Reacción cuando tú o hasta 5 criaturas caen: descienden suavemente sin daño.' },
    'fuego feérico': { level: 1, type: 'action', concentration: true, save: 'DES', desc: 'Ilumina criaturas que fallen salvación de Destreza; los ataques contra ellas tienen ventaja.' },
    'ola atronadora': { level: 1, type: 'action', save: 'CON', damage: '2d8', dmgType: 'trueno', desc: 'Cubo de 4,5 m: salvación de Constitución o reciben 2d8 trueno y son empujadas 3 m.' },
    'palabra de curación': { level: 1, type: 'bonus', heal: '2d4', desc: 'Acción adicional a distancia: recupera 2d4 + tu mod. de lanzamiento PG (D&D 2024).' },
    'represión infernal': { level: 1, type: 'reaction', save: 'DES', damage: '2d10', dmgType: 'fuego', desc: 'Reacción contra una criatura a 18 m que te dañó: salvación de Destreza o 2d10 fuego.' },
    'cuchillo de hielo': { level: 1, type: 'action', attack: true, save: 'DES', damage: '1d10', extraDamage: '2d6 frío en 1,5 m', dmgType: 'perforante', desc: 'Ataque de conjuro (1d10 perforante) y luego explota en 2d6 frío en 1,5 m (salvación DES).' },

    'hacer añicos': { level: 2, type: 'action', save: 'CON', damage: '3d8', dmgType: 'trueno', desc: 'Esfera de 3 m: salvación de Constitución o 3d8 trueno (mitad si supera).' },
    'pasar sin rastro': { level: 2, type: 'action', concentration: true, desc: 'Tú y tus aliados a 9 m ganan +10 a Sigilo y no dejan rastro durante 1 hora.' },
    'crecimiento espinoso': { level: 2, type: 'action', concentration: true, damage: '2d4', dmgType: 'perforante c/1,5m', desc: 'Radio de 6 m de terreno difícil; cada 1,5 m recorridos infligen 2d4 perforante.' }
  };

  const MASTERY_DESCRIPTIONS = {
    mellar: 'Mellar (Nick): cuando atacas con un arma ligera, haces el ataque extra con otra arma ligera dentro de la misma Acción Atacar (sin gastar tu Acción adicional, 1/turno).',
    molestar: 'Molestar (Vex): si impactas y haces daño, tienes Ventaja en tu próximo ataque contra esa criatura antes del final de tu siguiente turno.',
    hender: 'Hender (Cleave): al impactar cuerpo a cuerpo, puedes hacer un ataque extra contra otra criatura a 1,5 m de la primera (sin sumar mod. al daño, 1/turno).',
    rozar: 'Rozar (Graze): si fallas el ataque, igual haces daño igual a tu modificador de característica (FUE).',
    empujar: 'Empujar (Push): al impactar, puedes empujar a una criatura Grande o menor hasta 3 m en línea recta.',
    derribar: 'Derribar (Topple): al impactar, el objetivo hace salvación de CON (CD 8 + comp. + mod.) o cae Derribado.',
    ralentizar: 'Ralentizar (Slow): al impactar y hacer daño, reduces la velocidad del objetivo en 3 m hasta el inicio de tu próximo turno.'
  };

  const FEATURE_DESCRIPTIONS = {
    'ataque adicional': 'Cuando usas la acción Atacar en tu turno, puedes hacer dos ataques en lugar de uno.',
    'enemigo predilecto': 'Siempre tienes Marca del cazador preparada y varios usos gratis sin gastar espacios de conjuro.',
    'explorador hábil': 'Pericia en habilidades e idiomas adicionales.',
    'lanzamiento de conjuros': 'Lanzas tus conjuros preparados usando tu característica de lanzamiento.',
    'emboscador pavoroso': 'Una vez por turno, al impactar con un arma puedes sumar +2d6 psíquico (usos = mod. Sabiduría).',
    'visión en la umbra': 'Visión en la oscuridad ampliada (27 m); eres invisible para criaturas que dependan de visión en la oscuridad.',
    'recuperación arcana': 'Una vez por descanso largo, durante un descanso corto recuperas espacios de conjuro.',
    'cambio crónico': 'Reacción: obligas a una criatura a 9 m a repetir una tirada de ataque, prueba o salvación (2 usos/descanso largo).',
    'conciencia temporal': 'Sumas tu modificador de Inteligencia a tus tiradas de iniciativa.',
    'furia': 'Acción adicional: entras en Furia (+2 daño cuerpo a cuerpo con Fuerza y resistencia a daño contundente/perforante/cortante).',
    'frenesí': 'Si usas Ataque temerario mientras estás en Furia, tu primer impacto del turno suma +2d6 de daño.',
    'ataque temerario': 'Ventaja en tus ataques cuerpo a cuerpo con Fuerza este turno; los ataques contra ti también tienen ventaja hasta tu próximo turno.',
    'defensa sin armadura': 'Sin armadura, tu CA es 10 + mod. Destreza + mod. Constitución.',
    'movimiento rápido': 'Tu velocidad aumenta en +3 m mientras no lleves armadura pesada.',
    'sentir el peligro': 'Ventaja en salvaciones de Destreza contra efectos que puedas ver.',
    'acción astuta': 'Acción adicional para Correr, Destrabarse o Esconderte.',
    'ataque furtivo': 'Una vez por turno, añades daño extra (+3d6 a nivel 5) con arma sutil o a distancia si tienes ventaja o un aliado a 1,5 m del objetivo.',
    'esquiva asombrosa': 'Reacción cuando te impacta un ataque que puedes ver: reduces el daño de ese ataque a la mitad.',
    'puntería certera': 'Acción adicional: te da Ventaja en tu próximo ataque este turno si no te moviste (tu velocidad pasa a 0 m).',
    'golpe astuto': 'Al aplicar Ataque furtivo puedes sacrificar 1d6 de daño para añadir Veneno, Tropiezo o Retirada.',
    'forma salvaje': 'Acción adicional (Círculo de la Luna): te transformas en bestia.',
    'inspiración bárdica': 'Acción adicional: das 1 dado de inspiración (1×d8) a un aliado a 18 m.',
    'maestría con armas': 'Aplicas las propiedades de maestría de tus armas (Mellar, Molestar, Hender, Rozar, Empujar, Derribar, Ralentizar).',
    'maestro de armas': 'Te permite aplicar la propiedad de maestría de un tipo de arma.',
    'alerta': 'Sumas competencia a tu iniciativa y puedes intercambiar tu puesto en iniciativa con un aliado dispuesto.'
  };

  const STANDARD_ACTIONS = [
    { icon: '⚡', name: 'Correr (Dash)', desc: 'Duplicas tu movimiento este turno (+tu velocidad completa).', dice: '' },
    { icon: '↺', name: 'Destrabarse (Disengage)', desc: 'Tu movimiento no provoca ataques de oportunidad por el resto del turno.', dice: '' },
    { icon: '⛨', name: 'Esquivar (Dodge)', desc: 'Hasta tu próximo turno, los ataques contra ti tienen Desventaja y tienes Ventaja en salvaciones de DES.', dice: '' },
    { icon: '◐', name: 'Esconderse (Hide)', desc: 'Tira Sigilo (CD 15 en D&D 2024) para quedar Oculto fuera de la vista.', diceKind: 'stealth' },
    { icon: '✚', name: 'Ayudar (Help)', desc: 'Das Ventaja a un aliado en su próxima prueba de habilidad o en su próximo ataque a 1,5 m.', dice: '' },
    { icon: '⧗', name: 'Preparar acción (Ready)', desc: 'Eliges un desencadenante y guardas tu acción para ejecutarla con tu Reacción.', dice: '' }
  ];

  // =========================================================================
  // APP STATE
  // =========================================================================
  let livePayload = null;
  let selectedCharId = '';
  let activeTab = 'turn';
  let rollMode = 'normal'; // normal | advantage | disadvantage
  let critMode = false;
  let classMods = {
    huntersMark: false,
    dreadfulStrike: false,
    rage: false,
    reckless: false,
    frenzy: false,
    sneakAttack: false,
    steadyAim: false
  };
  let spellFilter = 'all';
  let checkMode = 'normal';
  let selectedCheck = { label: 'Percepción', bonus: 0, kind: 'Habilidad' };
  let lastNotifiedTurnKey = '';
  let toastTimer = null;

  // Local offline trackers (per character) when not synced live with DM
  let localTrackers = loadLocalTrackers();

  function loadLocalTrackers() {
    try {
      const raw = localStorage.getItem(LOCAL_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveLocalTrackers() {
    try { localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(localTrackers)); } catch {}
  }

  function getLocalTracker(c) {
    if (!localTrackers[c.id]) {
      localTrackers[c.id] = {
        action: true,
        bonus: true,
        movement: true,
        reaction: true,
        uses: {}
      };
    }
    return localTrackers[c.id];
  }

  // =========================================================================
  // HELPERS
  // =========================================================================
  function toast(msg) {
    const el = $('#playerToast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function signed(n) {
    const num = Number(n) || 0;
    return `${num >= 0 ? '+' : ''}${num}`;
  }

  function formatMeters(val) {
    return String(Math.max(0, Math.round((Number(val) || 0) * 10) / 10)).replace('.', ',');
  }

  function normText(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
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
    const m = String(c.className || '').match(/\d+/);
    return m ? Number(m[0]) : 1;
  }

  function getSkillBonus(c, skillName) {
    if (!c.skills) return null;
    const target = normText(skillName);
    for (const [k, v] of Object.entries(c.skills)) {
      if (normText(k) === target) return Number(v);
    }
    return null;
  }

  function hasFeature(c, regex) {
    return [...(c.features || []), ...(c.feats || [])].some(f => regex.test(String(f)));
  }

  function hasMellarAccess(c) {
    return hasFeature(c, /maestr[ií]a con armas|maestro de armas/i) &&
      (c.masteries || []).some(m => /mellar/i.test(m)) &&
      (c.weapons || []).some(w => /mellar/i.test(w.mastery || ''));
  }

  function hasHuntersMark(c) {
    return hasFeature(c, /enemigo predilecto/i) || (c.spells?.names || []).some(s => /marca del cazador/i.test(s));
  }

  function hasHealingPotion(c) {
    return (c.weapons || []).some(w => /poci[oó]n de curaci[oó]n/i.test(w.name)) ||
      (c.equipment || []).some(e => /poci[oó]n de curaci[oó]n/i.test(e));
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

  function getSpellMeta(name) {
    return SPELL_META[String(name || '').toLowerCase()] || {
      level: 1,
      type: 'action',
      desc: `Conjuro de tu ficha (${name}).`
    };
  }

  function spellActionType(name, c) {
    const customTime = c?.spells?.castingTimes?.[name];
    if (customTime && /minuto|hora|ritual/i.test(customTime)) return 'other';
    return getSpellMeta(name).type;
  }

  function getCastAbility(c) {
    const cls = String(c.className || '');
    if (/bardo|hechicero|brujo|palad[ií]n/i.test(cls)) return 'Car';
    if (/mago|art[ií]fice/i.test(cls)) return 'Int';
    return 'Sab';
  }

  // Parses dice expressions & combines them into clear physical dice instructions
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
    const diceList = [];
    let totalDice = 0;

    sortedSides.forEach(sides => {
      const count = diceMap.get(sides);
      if (!count) return;
      totalDice += Math.abs(count);
      diceList.push({ count: Math.abs(count), sides });
      if (parts.length === 0) parts.push(`${count}d${sides}`);
      else parts.push(`${count > 0 ? '+' : ''}${count}d${sides}`);
    });

    if (flatBonus !== 0) {
      if (parts.length === 0) parts.push(String(flatBonus));
      else parts.push(flatBonus > 0 ? `+${flatBonus}` : String(flatBonus));
    }

    const formula = parts.join('') || '0';
    const breakdown = diceList.length
      ? `${diceList.map(d => `${d.count}×d${d.sides}`).join(' + ')}${flatBonus ? ` (${signed(flatBonus)})` : ''}`
      : (flatBonus ? `Modificador ${signed(flatBonus)}` : 'Sin dados');

    return { formula, totalDice, breakdown, flatBonus, diceList };
  }

  function renderDicePills(diceList, flatBonus) {
    const frag = document.createDocumentFragment();
    diceList.forEach(d => {
      const span = document.createElement('span');
      span.className = `die-chip d${d.sides}`;
      span.textContent = `${d.count} × d${d.sides}`;
      frag.append(span);
    });
    if (flatBonus) {
      const mod = document.createElement('span');
      mod.className = 'die-chip mod';
      mod.textContent = `sumar ${signed(flatBonus)}`;
      frag.append(mod);
    }
    return frag;
  }

  // =========================================================================
  // CHARACTER SOURCE (LIVE SYNC MERGED OVER BASE CAMPAIGN DATA)
  // =========================================================================
  function getAllCharacters() {
    if (livePayload && Array.isArray(livePayload.characters) && livePayload.characters.length) {
      return livePayload.characters;
    }
    return window.CAMPAIGN?.characters || [];
  }

  function getSelectedCharacter() {
    const chars = getAllCharacters();
    if (!selectedCharId) return null;
    return chars.find(c => c.id === selectedCharId) || null;
  }

  function getDefaultLimitedUses(c) {
    if (Array.isArray(c.limitedUses) && c.limitedUses.length) return c.limitedUses;
    const list = [];
    const s = c.spells || {};
    if (s.level1Slots) list.push({ key: 'slot-1', name: 'Espacios Nv. 1', remaining: s.level1Slots, max: s.level1Slots, rest: 'long' });
    if (s.level2Slots) list.push({ key: 'slot-2', name: 'Espacios Nv. 2', remaining: s.level2Slots, max: s.level2Slots, rest: 'long' });
    if (s.level3Slots) list.push({ key: 'slot-3', name: 'Espacios Nv. 3', remaining: s.level3Slots, max: s.level3Slots, rest: 'long' });
    if (s.freeHuntersMark) list.push({ key: 'free-hunters-mark', name: 'Marca del cazador gratis', remaining: s.freeHuntersMark, max: s.freeHuntersMark, rest: 'long' });
    if (hasFeature(c, /emboscador pavoroso/i)) {
      const max = Math.max(1, getAbilityMod(c, 'Sab'));
      list.push({ key: 'dreadful-strike', name: 'Emboscador pavoroso (+2d6)', remaining: max, max, rest: 'long' });
    }
    if (hasFeature(c, /^furia$/i)) list.push({ key: 'rage', name: 'Furia', remaining: 3, max: 3, rest: 'long' });
    if (hasFeature(c, /cambio cr[oó]nico/i)) list.push({ key: 'chronal-shift', name: 'Cambio crónico', remaining: 2, max: 2, rest: 'long' });
    if (hasFeature(c, /inspiraci[oó]n b[aá]rdica/i)) {
      const max = Math.max(1, getAbilityMod(c, 'Car'));
      list.push({ key: 'bardic', name: 'Inspiración bárdica (1×d8)', remaining: max, max, rest: 'short' });
    }
    if (hasFeature(c, /^forma salvaje$/i)) list.push({ key: 'wild-shape', name: 'Forma salvaje', remaining: 2, max: 2, rest: 'short' });
    return list;
  }

  function isLiveConnected() {
    return liveClient && liveClient.status === 'connected' && !!livePayload;
  }

  function getTurnResources(c) {
    if (isLiveConnected() && c.turnState) {
      return {
        action: !!c.turnState.action,
        bonus: !!c.turnState.bonus,
        movement: (c.turnMovement ?? c.speed ?? 9) > 0,
        movementMeters: c.turnMovement ?? c.speed ?? 9,
        reaction: !!c.turnState.reaction,
        synced: true
      };
    }
    const loc = getLocalTracker(c);
    return {
      action: loc.action,
      bonus: loc.bonus,
      movement: loc.movement,
      movementMeters: loc.movement ? (c.speed ?? 9) : 0,
      reaction: loc.reaction,
      synced: false
    };
  }

  // =========================================================================
  // RENDERING: PICKER SCREEN
  // =========================================================================
  function renderPicker() {
    const chars = getAllCharacters();
    $('#pickerCampaignName').textContent = livePayload?.campaignName || window.CAMPAIGN?.name || 'Ronda · D&D 2024';
    const grid = $('#pickerGrid');
    grid.replaceChildren();

    chars.forEach(c => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'picker-card';

      const avatar = document.createElement('div');
      avatar.className = 'picker-avatar';
      if (c.avatar) {
        const img = document.createElement('img');
        img.src = c.avatar;
        img.alt = c.name;
        img.onerror = () => { img.remove(); avatar.textContent = c.name.slice(0, 1).toUpperCase(); };
        avatar.append(img);
      } else {
        avatar.textContent = c.name.slice(0, 1).toUpperCase();
      }

      const info = document.createElement('div');
      info.className = 'picker-info';
      const title = document.createElement('b');
      title.textContent = c.name;
      const sub = document.createElement('small');
      sub.textContent = `${c.className || 'Aventurero'}${c.owner ? ` · ${c.owner}` : ''}`;

      const meta = document.createElement('div');
      meta.className = 'picker-meta';
      const tags = [
        `PG ${c.hp}/${c.maxHp}`,
        `CA ${c.ac ?? '—'}`,
        `Vel ${formatMeters(c.speed || 9)} m`
      ];
      tags.forEach(t => {
        const span = document.createElement('span');
        span.className = 'picker-tag';
        span.textContent = t;
        meta.append(span);
      });

      info.append(title, sub, meta);

      const arrow = document.createElement('span');
      arrow.className = 'picker-arrow';
      arrow.textContent = '→';

      btn.append(avatar, info, arrow);
      btn.addEventListener('click', () => selectCharacter(c.id));
      grid.append(btn);
    });
  }

  function selectCharacter(id) {
    selectedCharId = id;
    try { localStorage.setItem(CHAR_PREF_KEY, id); } catch {}
    const c = getSelectedCharacter();
    if (c) {
      // Pre-populate class modifiers from live state if active
      classMods = {
        huntersMark: !!c.markedTargetName,
        dreadfulStrike: false,
        rage: !!c.raging,
        reckless: !!c.turnRecklessActive,
        frenzy: !!(c.raging && c.turnRecklessActive),
        sneakAttack: hasFeature(c, /ataque furtivo/i),
        steadyAim: !!c.steadyAimActive
      };
      rollMode = (c.turnRecklessActive || c.steadyAimActive) ? 'advantage' : 'normal';
      critMode = false;
      const perc = getSkillBonus(c, 'Percepción') ?? c.perception ?? getAbilityMod(c, 'Sab');
      selectedCheck = { label: 'Percepción', bonus: perc, kind: 'Habilidad' };
    }
    if (liveClient) liveClient.sendHello();
    showScreen('player');
    renderPlayerApp();
  }

  function showScreen(which) {
    $('#pickerScreen').hidden = which !== 'picker';
    $('#playerShell').hidden = which !== 'player';
  }

  // =========================================================================
  // RENDERING: PLAYER APP
  // =========================================================================
  function renderPlayerApp() {
    const c = getSelectedCharacter();
    if (!c) {
      showScreen('picker');
      renderPicker();
      return;
    }

    // Header
    $('#topCharName').textContent = c.name;
    $('#topCharSub').textContent = `${c.className || 'Aventurero'} · Nv. ${getLevel(c)}`;
    const topImg = $('#topAvatarImg');
    const topFb = $('#topAvatarFallback');
    if (c.avatar) {
      topImg.src = c.avatar;
      topImg.alt = c.name;
      topImg.hidden = false;
      topFb.hidden = true;
      topImg.onerror = () => { topImg.hidden = true; topFb.hidden = false; topFb.textContent = c.name.slice(0, 1).toUpperCase(); };
    } else {
      topImg.hidden = true;
      topFb.hidden = false;
      topFb.textContent = c.name.slice(0, 1).toUpperCase();
    }

    // Live Turn Banner
    const turnBanner = $('#turnBanner');
    if (livePayload && livePayload.activeTurnId) {
      const isMine = livePayload.activeTurnId === c.id;
      const res = getTurnResources(c);
      turnBanner.hidden = false;
      turnBanner.classList.toggle('is-my-turn', isMine);
      $('#turnBannerBadge').textContent = `RONDA ${livePayload.round || 1}`;
      $('#turnBannerTitle').textContent = isMine
        ? '⚔ ¡ES TU TURNO!'
        : `Turno actual: ${livePayload.activeTurnName || 'En curso'}`;
      $('#turnBannerSub').textContent = livePayload.paused
        ? 'Encuentro en pausa por el DM'
        : isMine
          ? 'Revisa abajo tus acciones disponibles y qué dados agarrar.'
          : res.reaction
            ? 'Tu Reacción está lista si pasa algo fuera de tu turno.'
            : 'Ya gastaste tu Reacción hasta tu próximo turno.';

      const turnKey = `${livePayload.round}:${livePayload.activeTurnId}`;
      if (isMine && turnKey !== lastNotifiedTurnKey && isLiveConnected()) {
        lastNotifiedTurnKey = turnKey;
        if (navigator.vibrate) {
          try { navigator.vibrate([120, 60, 120]); } catch {}
        }
        toast('⚔ ¡Es tu turno!');
      }
    } else {
      turnBanner.hidden = true;
    }

    // Vitals
    $('#pHpText').innerHTML = `${c.hp} <small>/ ${c.maxHp}</small>`;
    const pct = c.maxHp > 0 ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 0;
    const hpBar = $('#pHpBar');
    hpBar.style.width = `${pct}%`;
    hpBar.className = 'hp-fill' + (pct <= 25 ? ' hp-low' : pct <= 55 ? ' hp-mid' : '');
    $('#pStatAc').textContent = c.ac ?? '—';
    $('#pStatSpeed').textContent = `${formatMeters(c.speed || 9)} m`;
    $('#pStatInit').textContent = signed(c.initiative || 0);

    // Conditions / Active buffs
    const condWrap = $('#pConditionPills');
    condWrap.replaceChildren();
    const badges = [];
    if (c.raging) badges.push({ text: '🔥 En Furia', cls: 'rage' });
    if (c.markedTargetName) badges.push({ text: `◎ Marca: ${c.markedTargetName}`, cls: '' });
    if (c.concentration?.spell) badges.push({ text: `✦ Conc.: ${c.concentration.spell}`, cls: 'conc' });
    if (c.steadyAimActive) badges.push({ text: '🎯 Puntería certera', cls: '' });
    (c.conditions || []).forEach(cond => badges.push({ text: cond, cls: '' }));
    if (badges.length) {
      condWrap.hidden = false;
      badges.forEach(b => {
        const s = document.createElement('span');
        s.className = `status-tag ${b.cls}`.trim();
        s.textContent = b.text;
        condWrap.append(s);
      });
    } else {
      condWrap.hidden = true;
    }

    // Turn Resources
    const res = getTurnResources(c);
    $('#resAction').classList.toggle('used', !res.action);
    $('#resBonus').classList.toggle('used', !res.bonus);
    $('#resMovement').classList.toggle('used', !res.movement);
    $('#resReaction').classList.toggle('used', !res.reaction);
    $('#resMoveLabel').textContent = `${formatMeters(res.movementMeters)} m`;
    $('#resetLocalTurnBtn').hidden = res.synced;

    // Adjust tab label if character has no spells
    const hasSpells = Array.isArray(c.spells?.names) && c.spells.names.length > 0;
    $('#spellsNavLabel').textContent = hasSpells ? 'Conjuros' : 'Usos';

    renderTurnTab(c, res);
    renderSpellsTab(c);
    renderChecksTab(c);
    renderSheetTab(c);
  }

  // =========================================================================
  // TAB 1: TURN GUIDE & PHYSICAL DICE
  // =========================================================================
  function renderTurnTab(c, res) {
    // 1. Dynamic Turn Summary
    const hasExtra = hasFeature(c, /ataque adicional/i);
    const hasMellar = hasMellarAccess(c);
    const maxAtks = hasExtra ? 2 : 1;
    const parts = [];

    if (res.action) {
      parts.push(hasExtra
        ? `Acción (${maxAtks} ataques${hasMellar ? ' + 1 extra con Mellar' : ''})`
        : `Acción (${hasMellar ? 'Atacar + Mellar' : 'Atacar, conjuro o acción estándar'})`);
    }
    if (res.bonus) {
      const bHints = [];
      if (hasHuntersMark(c)) bHints.push('Marca del cazador');
      if (hasFeature(c, /^furia$/i) && !c.raging) bHints.push('Furia');
      if (hasFeature(c, /acción astuta/i)) bHints.push('Acción astuta');
      if (hasFeature(c, /puntería certera/i)) bHints.push('Puntería certera');
      if (hasFeature(c, /inspiración bárdica/i)) bHints.push('Inspiración bárdica');
      if (hasFeature(c, /^forma salvaje$/i)) bHints.push('Forma salvaje');
      if ((c.spells?.names || []).some(s => spellActionType(s, c) === 'bonus')) bHints.push('conjuro rápido');
      parts.push(`Adicional${bHints.length ? ` (${bHints.slice(0, 2).join(', ')})` : ''}`);
    }
    if (res.movement) parts.push(`${formatMeters(res.movementMeters)} m de movimiento`);

    const allSpent = !res.action && !res.bonus && !res.movement;
    const badge = $('#turnGuideBadge');
    badge.textContent = allSpent ? 'Turno usado' : 'Disponible';
    badge.className = `guide-tag${allSpent ? ' done' : ''}`;
    $('#turnGuideText').textContent = allSpent
      ? `Ya usaste tu acción, adicional y movimiento.${res.reaction ? ' Aún conservas tu Reacción.' : ''}`
      : `Puedes usar: ${parts.join(' · ')}.`;

    // 2. Roll Mode & Class Modifiers
    $$('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rollMode === rollMode);
    });
    $('#critToggleBtn').classList.toggle('active', critMode);

    const modBar = $('#classModsBar');
    modBar.replaceChildren();
    const modDefs = [];
    if (hasHuntersMark(c)) modDefs.push({ key: 'huntersMark', label: '◎ Marca cazador (+1d6)' });
    if (hasFeature(c, /emboscador pavoroso/i)) modDefs.push({ key: 'dreadfulStrike', label: '🌑 Emboscador (+2d6)' });
    if (hasFeature(c, /^furia$/i)) modDefs.push({ key: 'rage', label: `🔥 Furia (+${getRageDamageBonus(c)} daño)` });
    if (hasFeature(c, /ataque temerario/i)) modDefs.push({ key: 'reckless', label: '⚡ Temerario (Ventaja)' });
    if (hasFeature(c, /frenes[ií]/i)) modDefs.push({ key: 'frenzy', label: '💢 Frenesí (+2d6)' });
    if (hasFeature(c, /ataque furtivo/i)) modDefs.push({ key: 'sneakAttack', label: `🗡 Furtivo (+${getSneakDiceCount(c)}d6)` });
    if (hasFeature(c, /punter[ií]a certera/i)) modDefs.push({ key: 'steadyAim', label: '🎯 Puntería certera (Ventaja)' });

    if (modDefs.length) {
      modBar.hidden = false;
      modDefs.forEach(def => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `mod-pill${classMods[def.key] ? ' active' : ''}`;
        b.textContent = def.label;
        b.addEventListener('click', () => {
          classMods[def.key] = !classMods[def.key];
          if ((def.key === 'reckless' || def.key === 'steadyAim') && classMods[def.key]) {
            rollMode = 'advantage';
          }
          if (def.key === 'frenzy' && classMods.frenzy) {
            classMods.rage = true;
            classMods.reckless = true;
            rollMode = 'advantage';
          }
          renderTurnTab(c, res);
        });
        modBar.append(b);
      });
    } else {
      modBar.hidden = true;
    }

    // 3. Weapons & Physical Dice Breakdown
    $('#attackBlockHint').textContent = hasExtra
      ? `1 Acción = ${maxAtks} ataques${hasMellar ? ' (+1 Mellar)' : ''}`
      : hasMellar
        ? '1 Acción (+1 Mellar con arma ligera)'
        : '1 Acción';

    const weaponRoot = $('#weaponCards');
    weaponRoot.replaceChildren();
    const attackWeapons = (c.weapons || []).filter(w => !w.consumable && w.attack != null);

    if (!attackWeapons.length) {
      const empty = document.createElement('div');
      empty.className = 'action-item';
      empty.innerHTML = '<div class="action-item-title">Sin armas registradas</div><p>Revisa tus conjuros de ataque en la pestaña ✧ Conjuros.</p>';
      weaponRoot.append(empty);
    }

    attackWeapons.forEach(w => {
      const card = document.createElement('article');
      card.className = `weapon-card${res.action ? ' highlight' : ''}`;

      const head = document.createElement('div');
      head.className = 'weapon-head';
      const titleBox = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = w.name;
      const tagsRow = document.createElement('div');
      tagsRow.className = 'weapon-tags';

      if (w.mastery) {
        const mTag = document.createElement('span');
        mTag.className = 'mini-tag mastery';
        mTag.textContent = `★ Maestría: ${w.mastery}`;
        tagsRow.append(mTag);
      }
      if (w.type) {
        const tTag = document.createElement('span');
        tTag.className = 'mini-tag';
        tTag.textContent = w.type;
        tagsRow.append(tTag);
      }
      (w.tags || []).slice(0, 3).forEach(tg => {
        const s = document.createElement('span');
        s.className = 'mini-tag';
        s.textContent = tg;
        tagsRow.append(s);
      });
      titleBox.append(b, tagsRow);
      head.append(titleBox);
      card.append(head);

      // Compute Attack Roll
      const effectiveMode = (classMods.reckless && isMeleeStrengthWeapon(w)) || classMods.steadyAim
        ? 'advantage'
        : rollMode;
      const d20Qty = effectiveMode === 'normal' ? 1 : 2;
      const atkText = effectiveMode === 'advantage'
        ? `2×d20 (mayor) ${signed(w.attack)}`
        : effectiveMode === 'disadvantage'
          ? `2×d20 (menor) ${signed(w.attack)}`
          : `1×d20 ${signed(w.attack)}`;

      // Compute Damage Roll with active class bonuses
      const dmgTerms = [w.damage];
      const appliedNotes = [];
      if (classMods.huntersMark && hasHuntersMark(c)) {
        dmgTerms.push('1d6');
        appliedNotes.push('+1d6 Marca');
      }
      if (classMods.dreadfulStrike && hasFeature(c, /emboscador pavoroso/i)) {
        dmgTerms.push('2d6');
        appliedNotes.push('+2d6 Emboscador');
      }
      if (classMods.rage && hasFeature(c, /^furia$/i) && isMeleeStrengthWeapon(w)) {
        const rb = getRageDamageBonus(c);
        dmgTerms.push(String(rb));
        appliedNotes.push(`+${rb} Furia`);
      }
      if (classMods.frenzy && hasFeature(c, /frenes[ií]/i) && isMeleeStrengthWeapon(w)) {
        dmgTerms.push('2d6');
        appliedNotes.push('+2d6 Frenesí');
      }
      if (classMods.sneakAttack && hasFeature(c, /ataque furtivo/i) && isSneakEligibleWeapon(w)) {
        const n = getSneakDiceCount(c);
        dmgTerms.push(`${n}d6`);
        appliedNotes.push(`+${n}d6 Furtivo`);
      }

      const dmgInfo = analyzeDiceExpressions(dmgTerms, critMode);

      const steps = document.createElement('div');
      steps.className = 'dice-steps';

      // Step 1: Impactar
      const atkBox = document.createElement('div');
      atkBox.className = 'dice-box atk';
      atkBox.innerHTML = `<span class="dice-box-label">1. IMPACTAR</span><div class="dice-formula-big">${atkText}</div><div class="dice-pills-row"></div><span class="dice-box-sub"></span>`;
      const atkPills = atkBox.querySelector('.dice-pills-row');
      atkPills.append(renderDicePills([{ count: d20Qty, sides: 20 }], Number(w.attack) || 0));
      atkBox.querySelector('.dice-box-sub').textContent = effectiveMode === 'advantage'
        ? 'Tira 2×d20, quédate el más alto y suma ' + signed(w.attack)
        : effectiveMode === 'disadvantage'
          ? 'Tira 2×d20, quédate el más bajo y suma ' + signed(w.attack)
          : `Tira 1×d20 y suma ${signed(w.attack)} contra CA`;

      // Step 2: Daño
      const dmgBox = document.createElement('div');
      dmgBox.className = `dice-box dmg${critMode ? ' crit' : ''}`;
      dmgBox.innerHTML = `<span class="dice-box-label">${critMode ? '2. DAÑO CRÍTICO (×2 DADOS)' : '2. SI IMPACTA (DAÑO)'}</span><div class="dice-formula-big">${dmgInfo.formula}</div><div class="dice-pills-row"></div><span class="dice-box-sub"></span>`;
      const dmgPills = dmgBox.querySelector('.dice-pills-row');
      dmgPills.append(renderDicePills(dmgInfo.diceList, dmgInfo.flatBonus));
      const extrasStr = appliedNotes.length ? ` · Incluye ${appliedNotes.join(', ')}` : '';
      dmgBox.querySelector('.dice-box-sub').textContent = `Agarra ${dmgInfo.totalDice} ${dmgInfo.totalDice === 1 ? 'dado' : 'dados'} (${dmgInfo.breakdown})${w.type ? ` · ${w.type}` : ''}${extrasStr}`;

      steps.append(atkBox, dmgBox);
      card.append(steps);

      if (w.mastery) {
        const mDesc = MASTERY_DESCRIPTIONS[normText(w.mastery)];
        if (mDesc) {
          const note = document.createElement('div');
          note.className = 'mastery-note';
          note.textContent = mDesc;
          card.append(note);
        }
      }

      weaponRoot.append(card);
    });

    // 4. Bonus Actions
    const bonusRoot = $('#bonusCards');
    bonusRoot.replaceChildren();
    const bonusItems = [];

    if (hasHuntersMark(c)) {
      bonusItems.push({
        icon: '◎',
        title: 'Marca del cazador',
        tag: 'Concentración',
        desc: 'Marca a un enemigo (o traslada la marca gratis si cayó a 0 PG). Suma +1d6 a tus ataques contra él.',
        dice: '+1 × d6 por cada impacto'
      });
    }
    if (hasFeature(c, /^furia$/i)) {
      bonusItems.push({
        icon: '🔥',
        title: c.raging ? 'Furia (Activa)' : 'Entrar en Furia',
        tag: 'Bárbaro',
        desc: `+${getRageDamageBonus(c)} al daño cuerpo a cuerpo con Fuerza y resistencia a daño físico.`,
        dice: `+${getRageDamageBonus(c)} daño fijo`
      });
    }
    if (hasFeature(c, /acción astuta/i)) {
      const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
      bonusItems.push({
        icon: '◈',
        title: 'Acción astuta',
        tag: 'Pícaro',
        desc: 'Usa tu acción adicional para Correr, Destrabarse o Esconderte.',
        dice: `Si te escondes: 1 × d20 ${signed(stealth)} (CD 15)`
      });
    }
    if (hasFeature(c, /punter[ií]a certera/i)) {
      bonusItems.push({
        icon: '🎯',
        title: 'Puntería certera',
        tag: 'Pícaro',
        desc: 'Si no te moviste este turno, ganas Ventaja en tu próximo ataque (tu velocidad pasa a 0 m).',
        dice: '2 × d20 (el mayor) al atacar'
      });
    }
    if (hasFeature(c, /^forma salvaje$/i)) {
      bonusItems.push({
        icon: '🐾',
        title: 'Forma salvaje',
        tag: 'Círculo de la Luna',
        desc: 'Te transformas en bestia como acción adicional.',
        dice: ''
      });
    }
    if (hasFeature(c, /inspiraci[oó]n b[aá]rdica/i)) {
      bonusItems.push({
        icon: '♪',
        title: 'Inspiración bárdica',
        tag: 'Bardo',
        desc: 'Otorgas un dado de inspiración a un aliado a 18 m para sumar a una prueba, ataque o salvación.',
        dice: '1 × d8 para tu aliado'
      });
    }
    if (hasHealingPotion(c)) {
      bonusItems.push({
        icon: '✚',
        title: 'Poción de curación',
        tag: 'D&D 2024',
        desc: 'Beber una poción ahora es Acción adicional en D&D 2024.',
        dice: 'Tira 2 × d4 + 2 de curación'
      });
    }
    // Bonus spells
    (c.spells?.names || []).forEach(spellName => {
      if (spellActionType(spellName, c) !== 'bonus') return;
      if (/marca del cazador/i.test(spellName)) return; // Already shown above
      const meta = getSpellMeta(spellName);
      let dice = '';
      if (meta.heal) {
        const mod = getAbilityMod(c, getCastAbility(c));
        const info = analyzeDiceExpressions([meta.heal, String(mod)]);
        dice = `Curación: ${info.breakdown}`;
      } else if (meta.damage) {
        dice = `Daño: ${analyzeDiceExpressions([meta.damage]).breakdown}`;
      }
      bonusItems.push({
        icon: '✧',
        title: spellName,
        tag: meta.level === 0 ? 'Truco' : `Conjuro Nv.${meta.level}`,
        desc: meta.desc,
        dice
      });
    });

    if ((c.weapons || []).some(w => (w.tags || []).some(t => /ligera/i.test(t))) && !hasMellar) {
      bonusItems.push({
        icon: '⚔',
        title: 'Ataque con arma ligera secundaria',
        tag: 'Dos armas',
        desc: 'Si atacaste con un arma ligera, puedes hacer un ataque extra con otra arma ligera en la otra mano (sin sumar modificador al daño salvo dote).',
        dice: '1 × d20 + ataque · dado del arma'
      });
    }

    if (!bonusItems.length) {
      bonusItems.push({
        icon: '—',
        title: 'Sin acciones adicionales fijas',
        tag: 'Opcional',
        desc: 'Solo se usa si un conjuro rápido, poción o rasgo te lo indica.',
        dice: ''
      });
    }

    bonusItems.forEach(item => bonusRoot.append(createGuideCard(item)));

    // 5. Reactions
    const reactRoot = $('#reactionCards');
    reactRoot.replaceChildren();
    const reactItems = [
      {
        icon: '↺',
        title: 'Ataque de oportunidad',
        tag: 'Siempre disponible',
        desc: 'Cuando un enemigo sale de tu alcance cuerpo a cuerpo sin Destrabarse, haces 1 ataque cuerpo a cuerpo.',
        dice: attackWeapons[0] ? `Ej. ${attackWeapons[0].name}: 1×d20 ${signed(attackWeapons[0].attack)} · ${attackWeapons[0].damage}` : '1 ataque cuerpo a cuerpo'
      }
    ];

    if (hasFeature(c, /esquiva asombrosa/i)) {
      reactItems.push({
        icon: '🛡',
        title: 'Esquiva asombrosa',
        tag: 'Pícaro',
        desc: 'Cuando te impacta un ataque de alguien que puedes ver, reduces el daño de ese golpe a la mitad.',
        dice: 'Mitad de daño (sin dados)'
      });
    }
    if (hasFeature(c, /cambio cr[oó]nico/i)) {
      reactItems.push({
        icon: '⏳',
        title: 'Cambio crónico',
        tag: 'Cronoturgo',
        desc: 'Obligas a una criatura a 9 m a repetir una tirada de ataque, prueba o salvación y quedarse el nuevo resultado.',
        dice: 'Re-tirar 1 × d20'
      });
    }
    (c.spells?.names || []).forEach(spellName => {
      if (spellActionType(spellName, c) !== 'reaction') return;
      const meta = getSpellMeta(spellName);
      reactItems.push({
        icon: '✧',
        title: spellName,
        tag: `Conjuro Nv.${meta.level}`,
        desc: meta.desc,
        dice: meta.damage ? `${analyzeDiceExpressions([meta.damage]).breakdown} · CD ${c.spells?.saveDc ?? '—'}` : ''
      });
    });

    reactItems.forEach(item => reactRoot.append(createGuideCard(item)));

    // 6. Standard Actions
    const stdRoot = $('#standardCards');
    stdRoot.replaceChildren();
    const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
    STANDARD_ACTIONS.forEach(act => {
      stdRoot.append(createGuideCard({
        icon: act.icon,
        title: act.name,
        tag: '1 Acción',
        desc: act.desc,
        dice: act.diceKind === 'stealth' ? `1 × d20 ${signed(stealth)} (CD 15)` : ''
      }));
    });
  }

  function createGuideCard({ icon, title, tag, desc, dice }) {
    const el = document.createElement('article');
    el.className = 'action-item';
    el.innerHTML = `<div class="action-item-head"><div class="action-item-title"><span class="action-ico"></span><span></span></div>${tag ? '<span class="mini-tag"></span>' : ''}</div><p></p>`;
    el.querySelector('.action-ico').textContent = icon || '✦';
    el.querySelector('.action-item-title span:last-child').textContent = title;
    if (tag) el.querySelector('.mini-tag').textContent = tag;
    el.querySelector('p').textContent = desc;
    if (dice) {
      const box = document.createElement('div');
      box.className = 'action-dice-inline';
      box.innerHTML = '<span>🎲</span><b></b>';
      box.querySelector('b').textContent = dice;
      el.append(box);
    }
    return el;
  }

  // =========================================================================
  // TAB 2: SPELLS & LIMITED USES
  // =========================================================================
  function renderSpellsTab(c) {
    // 1. Limited Uses
    const usesRoot = $('#playerUsesList');
    usesRoot.replaceChildren();
    const uses = getDefaultLimitedUses(c);
    const synced = isLiveConnected();
    $('#usesBlockWrap').hidden = uses.length === 0;
    $('#usesHint').textContent = synced ? 'Sincronizado en vivo con el DM' : 'Toca − / + para llevar tu cuenta';

    const loc = getLocalTracker(c);
    uses.forEach(u => {
      const remaining = synced
        ? u.remaining
        : (loc.uses[u.key] !== undefined ? loc.uses[u.key] : u.remaining);

      const row = document.createElement('div');
      row.className = 'use-row';
      row.innerHTML = `<div class="use-info"><b></b><small></small></div><div class="use-stepper"><button type="button" class="dec" aria-label="Gastar">−</button><b class="${remaining <= 0 ? 'empty' : ''}">${remaining}/${u.max}</b><button type="button" class="inc" aria-label="Recuperar">+</button></div>`;
      row.querySelector('.use-info b').textContent = u.name;
      row.querySelector('.use-info small').textContent = u.rest === 'short' ? 'Recupera en descanso corto' : 'Recupera en descanso largo';

      const decBtn = row.querySelector('.dec');
      const incBtn = row.querySelector('.inc');
      if (synced) {
        decBtn.hidden = true;
        incBtn.hidden = true;
      } else {
        decBtn.addEventListener('click', () => {
          loc.uses[u.key] = Math.max(0, remaining - 1);
          saveLocalTrackers();
          renderSpellsTab(c);
        });
        incBtn.addEventListener('click', () => {
          loc.uses[u.key] = Math.min(u.max, remaining + 1);
          saveLocalTrackers();
          renderSpellsTab(c);
        });
      }
      usesRoot.append(row);
    });

    // 2. Spells
    const spellNames = c.spells?.names || [];
    const hasSpells = spellNames.length > 0;
    $('#spellsBlockWrap').hidden = !hasSpells;
    $('#noSpellsCard').hidden = hasSpells;
    if (!hasSpells) return;

    $('#spellSaveDc').textContent = c.spells?.saveDc ?? '—';
    $('#spellAtkBonus').textContent = `1×d20 ${signed(c.spells?.attack || 0)}`;
    $('#spellPreparedCount').textContent = c.spells?.prepared ?? spellNames.length;

    $$('.filter-chip').forEach(ch => {
      ch.classList.toggle('active', ch.dataset.spellFilter === spellFilter);
    });

    const castMod = getAbilityMod(c, getCastAbility(c));
    const cardsRoot = $('#spellCards');
    cardsRoot.replaceChildren();

    const filtered = spellNames.filter(name => {
      const meta = getSpellMeta(name);
      const actType = spellActionType(name, c);
      if (spellFilter === 'all') return true;
      if (spellFilter === '0') return meta.level === 0;
      if (spellFilter === '1') return meta.level === 1;
      if (spellFilter === '2') return meta.level >= 2;
      if (spellFilter === 'bonus') return actType === 'bonus';
      if (spellFilter === 'reaction') return actType === 'reaction';
      return true;
    });

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-card';
      empty.innerHTML = '<b>Sin conjuros en este filtro</b><p>Prueba seleccionar «Todos» arriba.</p>';
      cardsRoot.append(empty);
      return;
    }

    filtered.forEach(name => {
      const meta = getSpellMeta(name);
      const actType = spellActionType(name, c);
      const typeLabel = actType === 'bonus' ? 'Adicional' : actType === 'reaction' ? 'Reacción' : actType === 'other' ? 'Ritual / Largo' : 'Acción';

      const card = document.createElement('article');
      card.className = 'spell-card';

      const head = document.createElement('div');
      head.className = 'spell-card-head';
      const left = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = name;
      const tags = document.createElement('div');
      tags.className = 'weapon-tags';

      const lvlTag = document.createElement('span');
      lvlTag.className = 'mini-tag blue';
      lvlTag.textContent = meta.level === 0 ? 'Truco' : `Nivel ${meta.level}`;
      tags.append(lvlTag);

      const tTag = document.createElement('span');
      tTag.className = 'mini-tag';
      tTag.textContent = typeLabel;
      tags.append(tTag);

      if (meta.concentration) {
        const cTag = document.createElement('span');
        cTag.className = 'mini-tag mastery';
        cTag.textContent = 'Concentración';
        tags.append(cTag);
      }
      if (meta.ritual) {
        const rTag = document.createElement('span');
        rTag.className = 'mini-tag green';
        rTag.textContent = 'Ritual';
        tags.append(rTag);
      }

      left.append(b, tags);
      head.append(left);
      card.append(head);

      const p = document.createElement('p');
      p.textContent = meta.desc;
      card.append(p);

      // Physical dice boxes for the spell
      if (meta.attack || meta.save || meta.damage || meta.heal) {
        const steps = document.createElement('div');
        steps.className = 'dice-steps';

        if (meta.attack) {
          const atkBox = document.createElement('div');
          atkBox.className = 'dice-box atk';
          atkBox.innerHTML = `<span class="dice-box-label">ATAQUE CONJURO</span><div class="dice-formula-big">1×d20 ${signed(c.spells?.attack || 0)}</div><span class="dice-box-sub">Tira 1×d20 y suma ${signed(c.spells?.attack || 0)}</span>`;
          steps.append(atkBox);
        } else if (meta.save) {
          const svBox = document.createElement('div');
          svBox.className = 'dice-box atk';
          svBox.innerHTML = `<span class="dice-box-label">SALVACIÓN ENEMIGO</span><div class="dice-formula-big">${meta.save} CD ${c.spells?.saveDc ?? '—'}</div><span class="dice-box-sub">El DM tira salvación del objetivo</span>`;
          steps.append(svBox);
        }

        if (meta.heal) {
          const info = analyzeDiceExpressions([meta.heal, String(castMod)]);
          const hBox = document.createElement('div');
          hBox.className = 'dice-box heal';
          hBox.innerHTML = `<span class="dice-box-label">CURACIÓN</span><div class="dice-formula-big">${info.formula}</div><div class="dice-pills-row"></div><span class="dice-box-sub">${info.breakdown} PG</span>`;
          hBox.querySelector('.dice-pills-row').append(renderDicePills(info.diceList, info.flatBonus));
          steps.append(hBox);
        } else if (meta.damage) {
          const info = analyzeDiceExpressions([meta.damage]);
          const dBox = document.createElement('div');
          dBox.className = 'dice-box dmg';
          dBox.innerHTML = `<span class="dice-box-label">DADOS A TIRAR</span><div class="dice-formula-big">${info.formula}</div><div class="dice-pills-row"></div><span class="dice-box-sub">${info.breakdown}${meta.dmgType ? ` · ${meta.dmgType}` : ''}${meta.extraDamage ? ` (+ ${meta.extraDamage})` : ''}</span>`;
          dBox.querySelector('.dice-pills-row').append(renderDicePills(info.diceList, info.flatBonus));
          steps.append(dBox);
        }

        card.append(steps);
      }

      cardsRoot.append(card);
    });
  }

  // =========================================================================
  // TAB 3: CHECKS, SAVES & SKILLS
  // =========================================================================
  function renderSpotlight() {
    $$('.mini-seg-btn').forEach(b => b.classList.toggle('active', b.dataset.checkMode === checkMode));
    $('#spotlightKicker').textContent = `${selectedCheck.kind.toUpperCase()} · TIRA EN LA MESA`;
    $('#spotlightName').textContent = selectedCheck.label;
    const b = signed(selectedCheck.bonus);
    if (checkMode === 'advantage') {
      $('#spotlightDice').textContent = `2 × d20 (mayor) ${b}`;
      $('#spotlightHint').textContent = `Agarra 2 dados de 20 caras, quédate el resultado más alto y suma ${b}.`;
    } else if (checkMode === 'disadvantage') {
      $('#spotlightDice').textContent = `2 × d20 (menor) ${b}`;
      $('#spotlightHint').textContent = `Agarra 2 dados de 20 caras, quédate el resultado más bajo y suma ${b}.`;
    } else {
      $('#spotlightDice').textContent = `1 × d20 ${b}`;
      $('#spotlightHint').textContent = `Agarra 1 dado de 20 caras y suma ${b} al número que salga.`;
    }
  }

  function renderChecksTab(c) {
    renderSpotlight();

    const abNames = { Fue: 'Fuerza', Des: 'Destreza', Con: 'Constitución', Int: 'Inteligencia', Sab: 'Sabiduría', Car: 'Carisma' };
    const abShort = { Fue: 'FUE', Des: 'DES', Con: 'CON', Int: 'INT', Sab: 'SAB', Car: 'CAR' };

    const abGrid = $('#abilitiesGrid');
    abGrid.replaceChildren();
    Object.entries(c.stats || {}).forEach(([k, val]) => {
      const mod = getAbilityMod(c, k);
      const score = String(val).match(/\d+/)?.[0] || val;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ability-btn${selectedCheck.label === abNames[k] && selectedCheck.kind === 'Prueba de atributo' ? ' selected' : ''}`;
      btn.innerHTML = `<small>${abShort[k] || k}</small><b>${signed(mod)}</b><i>${score}</i>`;
      btn.addEventListener('click', () => {
        selectedCheck = { label: abNames[k] || k, bonus: mod, kind: 'Prueba de atributo' };
        renderChecksTab(c);
      });
      abGrid.append(btn);
    });

    const svGrid = $('#savesGrid');
    svGrid.replaceChildren();
    Object.entries(abNames).forEach(([k, full]) => {
      const bonus = c.saves?.[k] ?? getAbilityMod(c, k);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `save-btn${selectedCheck.label === `Salvación de ${full}` ? ' selected' : ''}`;
      btn.innerHTML = `<span>${full}</span><b>${signed(bonus)}</b>`;
      btn.addEventListener('click', () => {
        selectedCheck = { label: `Salvación de ${full}`, bonus, kind: 'Salvación' };
        renderChecksTab(c);
      });
      svGrid.append(btn);
    });

    const query = normText($('#skillSearch').value);
    const skList = $('#skillsList');
    skList.replaceChildren();
    Object.entries(c.skills || {})
      .filter(([name]) => !query || normText(name).includes(query))
      .forEach(([name, bonus]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `skill-btn${selectedCheck.label === name && selectedCheck.kind === 'Habilidad' ? ' selected' : ''}`;
        btn.innerHTML = `<span></span><b>${signed(bonus)}</b>`;
        btn.querySelector('span').textContent = name;
        btn.addEventListener('click', () => {
          selectedCheck = { label: name, bonus: Number(bonus) || 0, kind: 'Habilidad' };
          renderChecksTab(c);
        });
        skList.append(btn);
      });
  }

  // =========================================================================
  // TAB 4: SHEET, MASTERIES & LIVE INITIATIVE
  // =========================================================================
  function renderSheetTab(c) {
    // Live initiative order (if connected to DM)
    const initSec = $('#liveInitSection');
    if (livePayload && Array.isArray(livePayload.initiativeOrder) && livePayload.initiativeOrder.length) {
      initSec.hidden = false;
      $('#liveInitRound').textContent = `Ronda ${livePayload.round || 1}`;
      const list = $('#liveInitList');
      list.replaceChildren();
      livePayload.initiativeOrder.forEach(item => {
        const row = document.createElement('div');
        row.className = `init-row${item.active ? ' active' : ''}${item.defeated ? ' defeated' : ''}`;
        row.innerHTML = `<div class="init-row-left"><span class="init-num">${item.initRoll ?? '—'}</span><b></b></div><span class="mini-tag">${item.active ? 'Turno actual' : item.type === 'enemy' ? 'Adversario' : 'Aliado'}</span>`;
        row.querySelector('b').textContent = item.name + (item.id === c.id ? ' (Tú)' : '');
        list.append(row);
      });
    } else {
      initSec.hidden = true;
    }

    // Masteries
    const mRoot = $('#masteriesList');
    mRoot.replaceChildren();
    const masteries = c.masteries || [];
    if (!masteries.length) {
      mRoot.append(createGuideCard({ icon: '★', title: 'Sin maestrías de arma', desc: 'Este personaje no usa propiedades de maestría de armas.' }));
    } else {
      masteries.forEach(m => {
        const desc = MASTERY_DESCRIPTIONS[normText(m)] || `Propiedad de maestría: ${m}.`;
        mRoot.append(createGuideCard({ icon: '★', title: m, tag: 'Maestría', desc }));
      });
    }

    // Features & Feats
    const fRoot = $('#featuresList');
    fRoot.replaceChildren();
    const allTraits = [
      ...(c.feats || []).map(f => ({ name: f, tag: 'Dote' })),
      ...(c.features || []).map(f => ({ name: f, tag: 'Rasgo' }))
    ];
    allTraits.forEach(t => {
      const desc = FEATURE_DESCRIPTIONS[String(t.name).toLowerCase()] || 'Rasgo de tu ficha en Nivel20.';
      fRoot.append(createGuideCard({ icon: t.tag === 'Dote' ? '◆' : '✦', title: t.name, tag: t.tag, desc }));
    });

    // Profile & Equipment
    const prof = $('#sheetProfileCard');
    prof.replaceChildren();
    const addBlock = (heading, content) => {
      if (!content) return;
      const div = document.createElement('div');
      const h3 = document.createElement('h3');
      h3.textContent = heading;
      div.append(h3);
      if (Array.isArray(content)) {
        const p = document.createElement('p');
        p.textContent = content.join(' · ');
        div.append(p);
      } else {
        const p = document.createElement('p');
        p.textContent = content;
        div.append(p);
      }
      prof.append(div);
    };

    addBlock('Trasfondo', c.background || `${c.species || ''} · ${c.className || ''}`);
    if (c.companion) addBlock('Compañero', c.companion);
    if (c.equipment?.length) addBlock('Equipo', c.equipment);
    if (c.proficiencies?.length) addBlock('Competencias', c.proficiencies);
    if (c.languages?.length) addBlock('Idiomas', c.languages);
  }

  // =========================================================================
  // LIVE SYNC CLIENT (HYBRID MODE)
  // =========================================================================
  function updateSyncBadges(info) {
    const pills = [$('#pickerSyncBtn'), $('#liveSyncBtn')];
    const map = {
      offline: { text: 'Offline', title: 'Modo Offline', detail: 'Usando fichas guardadas en tu celular.' },
      connecting: { text: 'Conectando…', title: `Conectando a ${info.roomCode}…`, detail: 'Buscando la extensión del DM…' },
      connected: { text: 'En vivo', title: `Conectado · Sala ${info.roomCode}`, detail: 'Recibiendo turnos, PG y fichas de Nivel20 en tiempo real.' },
      reconnecting: { text: 'Reconectando…', title: 'Reconectando…', detail: info.error || 'Esperando señal de la mesa del DM.' },
      error: { text: 'Sin sala', title: 'No conectado', detail: info.error || 'Sigues teniendo tu guía completa offline.' }
    };
    const meta = map[info.status] || map.offline;

    pills.forEach(p => {
      if (!p) return;
      p.className = `sync-pill ${info.status}`;
      const span = p.querySelector('span');
      if (span) span.textContent = meta.text;
    });

    const box = $('#syncStatusBox');
    if (box) box.className = `sync-status-box ${info.status}`;
    $('#syncModalTitle').textContent = meta.title;
    $('#syncModalDetail').textContent = meta.detail;
    $('#disconnectRoomBtn').hidden = info.status === 'offline';
    $('#connectRoomBtn').innerHTML = info.status === 'connected' ? 'Reconectar <span>⟳</span>' : 'Conectar en vivo <span>→</span>';
  }

  const liveClient = window.RondaSync
    ? new window.RondaSync.RondaLiveClient({
        getSelectedCharacter: () => {
          const c = getSelectedCharacter();
          return c ? { id: c.id, name: c.name } : { id: '', name: 'Eligiendo personaje…' };
        },
        onStatusChange: info => {
          updateSyncBadges(info);
          if (info.status === 'connected') {
            toast(`✓ Conectado en vivo a la sala ${info.roomCode}`);
            if ($('#connectDialog').open) $('#connectDialog').close();
          }
          if (getSelectedCharacter()) renderPlayerApp();
        },
        onSync: payload => {
          livePayload = payload;
          try { localStorage.setItem(CACHE_SYNC_KEY, JSON.stringify(payload)); } catch {}
          const c = getSelectedCharacter();
          if (c) {
            // Sync live class state flags (raging / mark) automatically
            if (c.raging) classMods.rage = true;
            if (c.markedTargetName) classMods.huntersMark = true;
            renderPlayerApp();
          } else {
            renderPicker();
          }
        }
      })
    : null;

  // =========================================================================
  // EVENT WIRING
  // =========================================================================
  $('#switchCharBtn').addEventListener('click', () => {
    showScreen('picker');
    renderPicker();
  });

  // Bottom tabs
  $$('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      $$('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));
      $$('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === activeTab));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Turn resource chips (interactive in offline mode; synced in live mode)
  $$('.res-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = getSelectedCharacter();
      if (!c) return;
      if (isLiveConnected()) {
        toast('Estos recursos se actualizan en vivo desde el panel del DM');
        return;
      }
      const key = btn.dataset.res;
      const loc = getLocalTracker(c);
      loc[key] = !loc[key];
      saveLocalTrackers();
      renderPlayerApp();
    });
  });

  $('#resetLocalTurnBtn').addEventListener('click', () => {
    const c = getSelectedCharacter();
    if (!c) return;
    const loc = getLocalTracker(c);
    loc.action = true;
    loc.bonus = true;
    loc.movement = true;
    loc.reaction = true;
    saveLocalTrackers();
    renderPlayerApp();
    toast('Recursos restaurados para tu nuevo turno');
  });

  // Roll mode & Crit toggles
  $$('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      rollMode = btn.dataset.rollMode;
      const c = getSelectedCharacter();
      if (c) renderTurnTab(c, getTurnResources(c));
    });
  });

  $('#critToggleBtn').addEventListener('click', () => {
    critMode = !critMode;
    const c = getSelectedCharacter();
    if (c) renderTurnTab(c, getTurnResources(c));
  });

  // Spell filters
  $$('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      spellFilter = btn.dataset.spellFilter;
      const c = getSelectedCharacter();
      if (c) renderSpellsTab(c);
    });
  });

  // Check spotlight mode & skill search
  $$('.mini-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      checkMode = btn.dataset.checkMode;
      renderSpotlight();
    });
  });

  $('#skillSearch').addEventListener('input', () => {
    const c = getSelectedCharacter();
    if (c) renderChecksTab(c);
  });

  // Connect Modal
  const connectDialog = $('#connectDialog');
  const openConnectModal = () => {
    const saved = localStorage.getItem(ROOM_PREF_KEY) || '';
    if (!$('#roomCodeInput').value && saved) $('#roomCodeInput').value = saved;
    if (!connectDialog.open) connectDialog.showModal();
  };
  $('#pickerSyncBtn').addEventListener('click', openConnectModal);
  $('#liveSyncBtn').addEventListener('click', openConnectModal);
  $$('[data-close-dialog]').forEach(btn => btn.addEventListener('click', () => connectDialog.close()));

  $('#connectRoomBtn').addEventListener('click', () => {
    const code = window.RondaSync.normalizeRoomCode($('#roomCodeInput').value);
    if (!code || code.length < 4) {
      toast('Escribe el código de sala del DM (mín. 4 caracteres)');
      return;
    }
    $('#roomCodeInput').value = code;
    try { localStorage.setItem(ROOM_PREF_KEY, code); } catch {}
    liveClient?.connect(code);
  });

  $('#disconnectRoomBtn').addEventListener('click', () => {
    liveClient?.disconnect();
    livePayload = null;
    try { localStorage.removeItem(ROOM_PREF_KEY); } catch {}
    toast('Volviste al modo offline');
    renderPlayerApp();
  });

  // Auto-reconnect when phone wakes up from lock screen or regains network
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      liveClient?.reconnectIfNeeded();
      liveClient?.requestSync();
    }
  });
  window.addEventListener('online', () => liveClient?.reconnectIfNeeded());

  // Register offline Service Worker (only on http/https, not chrome-extension://)
  if ('serviceWorker' in navigator && /^https?:$/i.test(location.protocol)) {
    navigator.serviceWorker.register('./player-sw.js').catch(() => {});
  }

  // =========================================================================
  // BOOTSTRAP
  // =========================================================================
  try {
    const cached = localStorage.getItem(CACHE_SYNC_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.characters) && parsed.characters.length) {
        livePayload = parsed;
      }
    }
  } catch {}

  const params = new URLSearchParams(location.search);
  const urlRoom = window.RondaSync?.normalizeRoomCode(params.get('room') || params.get('sala') || '');
  const urlChar = params.get('char') || '';
  const savedChar = urlChar || localStorage.getItem(CHAR_PREF_KEY) || '';

  if (savedChar && getAllCharacters().some(c => c.id === savedChar)) {
    selectCharacter(savedChar);
  } else {
    showScreen('picker');
    renderPicker();
  }

  if (urlRoom && liveClient) {
    $('#roomCodeInput').value = urlRoom;
    try { localStorage.setItem(ROOM_PREF_KEY, urlRoom); } catch {}
    liveClient.connect(urlRoom);
  } else {
    const lastRoom = localStorage.getItem(ROOM_PREF_KEY);
    if (lastRoom) $('#roomCodeInput').value = lastRoom;
    updateSyncBadges({ status: 'offline', roomCode: '', error: '' });
  }
})();
