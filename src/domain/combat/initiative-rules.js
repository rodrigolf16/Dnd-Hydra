export function sortCombatantsByInitiative(combatants) {
  return [...combatants].sort((a, b) => {
    const aRoll = a.initiativeRoll ?? -999;
    const bRoll = b.initiativeRoll ?? -999;
    if (bRoll !== aRoll) return bRoll - aRoll;
    return (b.initiative ?? 0) - (a.initiative ?? 0);
  });
}

export function swapCombatantPositions(combatants, idA, idB) {
  const idxA = combatants.findIndex(c => c.id === idA);
  const idxB = combatants.findIndex(c => c.id === idB);
  if (idxA < 0 || idxB < 0 || idxA === idxB) return false;
  [combatants[idxA], combatants[idxB]] = [combatants[idxB], combatants[idxA]];
  return true;
}

export function findNextActiveCombatant(combatants, activeTurnId, skipDefeated) {
  if (!combatants.length) return { next: null, wrapped: false };
  let idx = combatants.findIndex(c => c.id === activeTurnId);
  if (idx < 0) idx = 0;
  let wrapped = false;
  for (let step = 0; step < combatants.length; step += 1) {
    idx += 1;
    if (idx >= combatants.length) {
      idx = 0;
      wrapped = true;
    }
    const candidate = combatants[idx];
    if (!skipDefeated || !(candidate.type === 'enemy' && (candidate.defeated || candidate.hp <= 0))) {
      return { next: candidate, wrapped };
    }
  }
  return { next: combatants[0], wrapped };
}
