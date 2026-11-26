import { signed } from '../../domain/shared/formatters.js';
import { getAbilityMod, getSkillBonus } from '../../domain/combat/combatant-stats.js';
import { isSneakEligibleWeapon } from '../../domain/combat/combatant-features.js';
import { getSpellMeta } from '../../domain/combat/spell-rules.js';
import { byId, getState, uiState, viewed } from '../../application/store/encounter-store.js';
import { buildDamageSpec } from '../../application/use-cases/attack-resolver.js';
import { useCounter } from '../../application/use-cases/class-actions.js';
import { $, $$ } from '../shared/dom.js';

export function populateTargetOptions(includeSelf = false) {
  const state = getState();
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

export function populateWeaponOptions(attackMode) {
  const c = viewed();
  const sel = $('#weaponSelect');
  sel.replaceChildren();
  const all = (c.weapons || []).filter(w => w.attack != null);
  let filtered = all;
  if (attackMode === 'nick') filtered = all.filter(w => /mellar/i.test(w.mastery || ''));
  else if (attackMode === 'offhand') filtered = all.filter(w => (w.tags || []).some(t => /ligera/i.test(t)));
  else if (attackMode === 'opportunity') { filtered = all.filter(w => !w.range); if (!filtered.length) filtered = all; }
  uiState.currentWeaponOptions = filtered;
  filtered.forEach((w, i) => sel.add(new Option(`${w.name} · ${signed(w.attack)} · ${w.damage} ${w.type || ''}${w.mastery ? ` · ${w.mastery}` : ''}`, String(i))));
  if (!filtered.length) sel.add(new Option('Sin armas compatibles', ''));
  return filtered;
}

export function selectedWeapon() {
  const idx = Number($('#weaponSelect').value);
  return Number.isFinite(idx) ? uiState.currentWeaponOptions[idx] || null : null;
}

export function populateSpellSlotOptions(spellName, c) {
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

export function readAttackFlags() {
  return {
    dread: $('#dreadDamage').checked,
    sneak: $('#sneakDamage').checked,
    rage: $('#rageDamageCheck').checked,
    frenzy: $('#frenzyCheck').checked,
    reckless: $('#recklessAttack').checked,
    recklessActive: !$('#recklessToggle').hidden && $('#recklessAttack').checked,
    critical: $('#critDamageCheck').checked
  };
}

export function setRollMode(mode) {
  uiState.rollMode = mode;
  $$('#rollModeGroup button').forEach(btn => btn.classList.toggle('active', btn.dataset.rollMode === mode));
  updatePhysicalActionCards();
}

export function updateAttackVerdict() {
  const currentAction = uiState.currentAction;
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

export function updatePhysicalActionCards(refreshVerdict = true) {
  const currentAction = uiState.currentAction;
  if (!currentAction) return;
  const c = viewed();

  if (currentAction.cunningAction) {
    if ($('#spellSlotSelect').value === 'hide') {
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

  const mode = uiState.rollMode;
  const d20Count = mode === 'normal' ? 1 : 2;
  const atkFormula = `${mode === 'advantage' ? '2d20kh1' : mode === 'disadvantage' ? '2d20kl1' : '1d20'}${w.attack !== 0 ? signed(w.attack) : ''}`;
  const dmgSpec = buildDamageSpec(c, w, tgt, readAttackFlags());

  $('#physicalActionCards').hidden = false;
  $('#physicalAttackCard').hidden = false;
  $('#physicalDamageCard').hidden = false;

  const modeLabel = mode === 'advantage' ? 'Ventaja (quédate con el mayor)' : mode === 'disadvantage' ? 'Desventaja (quédate con el menor)' : 'Normal';
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
