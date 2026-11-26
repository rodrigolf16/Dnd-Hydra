import { CAMPAIGN } from '../../data/campaign/index.js';
import { clone } from '../shared/formatters.js';
import { getAbilityMod, getLevel } from './combatant-stats.js';
import { hasFeature } from './combatant-features.js';
import { defaultMapState } from '../map/map-geometry.js';

export function ensureUseCounters(c) {
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

export function freshTurn(c) {
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

export function hydrateCombatant(c) {
  if (!c.type) c.type = 'pc';
  if (!Array.isArray(c.customActions)) c.customActions = [];
  if (!Array.isArray(c.conditions)) c.conditions = [];
  if (c.markedTargetId === undefined) c.markedTargetId = null;
  if (c.concentration === undefined) c.concentration = null;
  if (c.raging === undefined) c.raging = false;
  if (c.defeated === undefined) c.defeated = c.type === 'enemy' && c.hp <= 0;
  if (!c.avatar && c.type !== 'enemy') {
    const orig = CAMPAIGN.characters.find(x => x.id === c.id);
    if (orig?.avatar) c.avatar = orig.avatar;
  }
  ensureUseCounters(c);
  if (!c.turnState) freshTurn(c);
  return c;
}

export function nextNumberedEnemyName(baseName, combatants, usedNames = null) {
  const cleanBase = String(baseName || 'Adversario').trim().replace(/\s+\d+$/, '') || 'Adversario';
  const existing = usedNames || new Set((combatants || []).map(x => String(x.name || '').trim().toLowerCase()));
  let n = existing.has(cleanBase.toLowerCase()) ? 2 : 1;
  while (existing.has(`${cleanBase} ${n}`.toLowerCase())) n += 1;
  const result = `${cleanBase} ${n}`;
  existing.add(result.toLowerCase());
  return result;
}

export function buildClonedEnemy(src, combatants) {
  const cloneName = nextNumberedEnemyName(src.name, combatants);
  return hydrateCombatant({
    ...clone(src),
    id: `enemy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: cloneName,
    hp: src.maxHp,
    defeated: false,
    conditions: [],
    concentration: null,
    markedTargetId: null
  });
}

export function buildDefaultState() {
  const combatants = clone(CAMPAIGN.characters).map(hydrateCombatant);
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
    nivel20: { url: CAMPAIGN.nivel20Url || 'https://nivel20.com' },
    map: defaultMapState(),
    logEntries: [
      {
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        actor: 'DM',
        text: `panel listo para ${CAMPAIGN.name}`,
        detail: 'Carga las iniciativas físicas, registra movimientos y usa el Mapa 2D con pines',
        symbol: '⇧'
      }
    ]
  };
}
