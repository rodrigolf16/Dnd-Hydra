import { uiState } from '../../application/store/encounter-store.js';
import { getDicePoolSummary } from '../../application/use-cases/dice-pool.js';
import { $, $$ } from '../shared/dom.js';

export function renderPhysicalDicePool() {
  $$('.die-pick').forEach(btn => {
    const sides = Number(btn.dataset.die);
    const count = uiState.dicePool[sides] || 0;
    btn.classList.toggle('active-die', count > 0);
    const badge = btn.querySelector('.die-badge');
    if (badge) badge.textContent = String(count);
  });

  const info = getDicePoolSummary();
  const hasAny = info.totalDice > 0 || uiState.poolModifier !== 0;
  $('#poolFormulaDisplay').textContent = hasAny ? info.formula : '—';
  $('#poolTotalDiceCount').textContent = `${info.totalDice} ${info.totalDice === 1 ? 'dado' : 'dados'}`;
  $('#poolBreakdownText').textContent = hasAny
    ? info.breakdown
    : 'Selecciona dados arriba o escribe una fórmula (ej. 2d6+1d4+5).';
  $('#copyPoolFormulaBtn').hidden = !hasAny;
  $('#modifier').value = (uiState.poolModifier > 0 ? '+' : '') + uiState.poolModifier;
}
