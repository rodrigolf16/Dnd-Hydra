import { signed } from '../../domain/shared/formatters.js';
import { analyzeDiceExpressions } from '../../domain/dice/dice-analyzer.js';
import { getAbilityMod, getSkillBonus } from '../../domain/combat/combatant-stats.js';
import { featureDescription, getSneakDiceCount, hasFeature, hasSneakAttack } from '../../domain/combat/combatant-features.js';
import { getSpellMeta, spellActionType } from '../../domain/combat/spell-rules.js';
import { byId } from '../../application/store/encounter-store.js';
import { useCounter } from '../../application/use-cases/class-actions.js';
import { $ } from '../shared/dom.js';
import {
  populateSpellSlotOptions,
  populateTargetOptions,
  populateWeaponOptions,
  setRollMode,
  updatePhysicalActionCards
} from './action-modal-view.js';

export function configureAttackDialog(c, attackMode) {
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

  $('#recklessToggle').hidden = !(hasFeature(c, /ataque temerario/i) && attackMode !== 'opportunity');
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
    $('#sneakToggle b').textContent = `Ataque furtivo (+${getSneakDiceCount(c)}d6 · 1/turno)`;
    $('#sneakToggle small').textContent = c.turnSneakUsed ? 'Ya usado este turno' : 'Con arma sutil o a distancia si tiene ventaja o aliado a 1,5 m.';
  }

  $('#critToggle').hidden = false;
  $('#physicalAtkInputLabel').textContent = 'Anota el d20 físico natural (1–20):';
  $('#physicalDmgInputLabel').textContent = 'Anota el daño físico total (se restará de los PG del objetivo):';
  $('#resolveAction').innerHTML = 'Registrar ataque <span>✓</span>';
  updatePhysicalActionCards();
}

export function configureSpecialActionDialog(c, cfg) {
  const { name, kind, isMark, isPotion, isHide, cunningAction, customDice, customDesc } = cfg;
  if (isMark) {
    $('#dialogKicker').textContent = 'ACCIÓN ADICIONAL · MARCA DEL CAZADOR';
    populateTargetOptions(false);
    populateSpellSlotOptions('Marca del cazador', c);
    const oldTarget = c.markedTargetId ? byId(c.markedTargetId) : null;
    if (oldTarget && oldTarget.hp > 0) {
      $('#dialogDesc').textContent = `Tiene marcada a ${oldTarget.name}. Puedes soltarla o cambiarla gastando un uso/espacio.`;
      $('#spellSlotField').hidden = false; $('#cancelMarkBtn').hidden = false; $('#resolveAction').innerHTML = 'Cambiar Marca <span>✓</span>';
    } else if (oldTarget && oldTarget.hp <= 0) {
      $('#dialogDesc').textContent = `${oldTarget.name} cayó a 0 PG. Traslada la marca gratis con su acción adicional.`;
      $('#cancelMarkBtn').hidden = false; $('#resolveAction').innerHTML = 'Trasladar Marca gratis <span>✓</span>';
    } else {
      $('#dialogDesc').textContent = 'Elige objetivo: sus ataques contra él añadirán automáticamente +1d6 en los dados físicos.';
      $('#spellSlotField').hidden = false; $('#resolveAction').innerHTML = 'Confirmar Marca <span>✓</span>';
    }
    if (!c.turnState.bonus) $('#resolveAction').disabled = true;
    return;
  }
  if (isPotion) {
    $('#dialogKicker').textContent = 'ACCIÓN ADICIONAL · POCIÓN DE CURACIÓN';
    $('#dialogDesc').textContent = 'Tira 2×d4 + 2 físicos en la mesa y anota el total para sumarlo a los PG.';
    populateTargetOptions(true);
    $('#physicalActionCards').hidden = false; $('#physicalDamageCard').hidden = false;
    $('#n20DamageLabel').textContent = 'DADOS FÍSICOS DE CURACIÓN'; $('#n20DamageFormula').textContent = '2d4+2';
    $('#n20DamageQty').textContent = '2 dados físicos'; $('#n20DamageSub').textContent = '2 × d4 (+2) · Poción de curación';
    $('#physicalDmgInputLabel').textContent = 'Anota la curación total obtenida (se sumará a PG):';
    $('#resolveAction').innerHTML = 'Registrar curación <span>✚</span>';
    return;
  }
  if (isHide) {
    const stealth = getSkillBonus(c, 'Sigilo') ?? getAbilityMod(c, 'Des');
    $('#dialogKicker').textContent = 'ACCIÓN · ESCONDERSE (SIGILO)';
    $('#dialogDesc').textContent = 'Tira 1×d20 físico + Sigilo (CD 15 en D&D 2024 para quedar Oculto) y anota el d20.';
    $('#physicalActionCards').hidden = false; $('#physicalAttackCard').hidden = false;
    $('#n20AttackLabel').textContent = 'PRUEBA DE SIGILO (DADO FÍSICO)'; $('#n20AttackFormula').textContent = `1d20${signed(stealth)}`;
    $('#n20AttackQty').textContent = '1 dado físico'; $('#n20AttackSub').textContent = `1 × d20 (${signed(stealth)}) · CD 15`;
    $('#physicalAtkInputLabel').textContent = 'Anota el d20 físico natural (1–20):';
    $('#resolveAction').innerHTML = 'Registrar Esconderse <span>✓</span>';
    return;
  }
  if (cunningAction) {
    $('#dialogKicker').textContent = 'ACCIÓN ADICIONAL · ACCIÓN ASTUTA';
    $('#dialogDesc').textContent = 'Elige qué acción astuta realiza:';
    $('#spellSlotField').hidden = false;
    const sel = $('#spellSlotSelect'); sel.replaceChildren();
    sel.add(new Option('Correr (+velocidad al movimiento)', 'dash'));
    sel.add(new Option('Destrabarse (sin ataques de oportunidad)', 'disengage'));
    sel.add(new Option('Esconderse (1×d20 + Sigilo)', 'hide'));
    updatePhysicalActionCards();
    $('#resolveAction').innerHTML = 'Registrar Acción astuta <span>✓</span>';
    return;
  }
  if (kind === 'spell') {
    const meta = getSpellMeta(name); const actType = spellActionType(name, c);
    $('#dialogKicker').textContent = `CONJURO NV. ${meta.level} · ${actType === 'bonus' ? 'ACCIÓN ADICIONAL' : actType === 'reaction' ? 'REACCIÓN' : actType === 'other' ? 'RITUAL / LARGO' : 'ACCIÓN'}`;
    let desc = `${meta.desc} (CD ${c.spells?.saveDc ?? '—'} · Ataque ${signed(c.spells?.attack || 0)}).`;
    if (meta.concentration && c.concentration && c.concentration.spell !== name) desc += ` ⚠ Perderá concentración en ${c.concentration.spell}.`;
    $('#dialogDesc').textContent = desc;
    populateTargetOptions(!!meta.heal); $('#spellSlotField').hidden = false; populateSpellSlotOptions(name, c);
    if (meta.attack || meta.damage || meta.heal) {
      $('#physicalActionCards').hidden = false;
      if (meta.attack) {
        $('#physicalAttackCard').hidden = false; $('#n20AttackLabel').textContent = 'ATAQUE DE CONJURO (DADO FÍSICO)';
        $('#n20AttackFormula').textContent = `1d20${signed(c.spells?.attack || 0)}`; $('#n20AttackQty').textContent = '1 dado físico';
        $('#n20AttackSub').textContent = `1 × d20 (${signed(c.spells?.attack || 0)})`; $('#physicalAtkInputLabel').textContent = 'Anota el d20 físico natural (1–20):';
      }
      if (meta.damage || meta.heal) {
        const castAbility = c.className.includes('Bardo') ? 'Car' : c.className.includes('Mago') ? 'Int' : 'Sab';
        const info = meta.heal ? analyzeDiceExpressions([meta.heal, String(getAbilityMod(c, castAbility))]) : analyzeDiceExpressions([meta.damage]);
        $('#physicalDamageCard').hidden = false; $('#n20DamageLabel').textContent = meta.heal ? 'DADOS FÍSICOS DE CURACIÓN' : 'DADOS FÍSICOS DE DAÑO DEL CONJURO';
        $('#n20DamageFormula').textContent = info.formula; $('#n20DamageQty').textContent = `${info.totalDice} ${info.totalDice === 1 ? 'dado físico' : 'dados físicos'}`;
        $('#n20DamageSub').textContent = `${info.breakdown}${meta.dmgType ? ` · ${meta.dmgType}` : ''}`;
        $('#physicalDmgInputLabel').textContent = meta.heal ? 'Anota la curación total obtenida (se sumará a PG):' : 'Anota el daño físico total (si impactó / falló salv., se restará de PG):';
      }
    }
    $('#resolveAction').innerHTML = 'Registrar conjuro <span>✓</span>';
    return;
  }
  $('#dialogKicker').textContent = kind === 'bonus' ? 'ACCIÓN ADICIONAL' : kind === 'reaction' ? 'REACCIÓN' : 'ACCIÓN';
  $('#dialogDesc').textContent = customDesc || featureDescription(name, c);
  if (customDice) {
    const info = analyzeDiceExpressions([customDice]);
    $('#physicalActionCards').hidden = false; $('#physicalDamageCard').hidden = false;
    $('#n20DamageLabel').textContent = 'DADOS FÍSICOS A TIRAR'; $('#n20DamageFormula').textContent = info.formula;
    $('#n20DamageQty').textContent = `${info.totalDice} ${info.totalDice === 1 ? 'dado físico' : 'dados físicos'}`;
    $('#n20DamageSub').textContent = info.breakdown; $('#physicalDmgInputLabel').textContent = 'Anota el resultado total obtenido:';
  }
  $('#resolveAction').innerHTML = 'Registrar actividad <span>✓</span>';
}
