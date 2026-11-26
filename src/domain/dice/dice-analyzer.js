import { signed } from '../shared/formatters.js';

export function analyzeDiceExpressions(expressions, critical = false) {
  const diceMap = new Map();
  let flatBonus = 0;

  expressions.filter(Boolean).forEach(expr => {
    const normalized = String(expr).replace(/\s/g, '').toLowerCase();
    const tokens = normalized.match(/[+-]?[^+-]+/g) || [];
    tokens.forEach(rawTok => {
      let sign = 1;
      let tok = rawTok;
      if (tok[0] === '-') {
        sign = -1;
        tok = tok.slice(1);
      } else if (tok[0] === '+') {
        tok = tok.slice(1);
      }

      const match = tok.match(/^(\d*)d(\d+)$/);
      if (match) {
        let count = Math.max(1, Number(match[1] || 1)) * sign;
        if (critical) count *= 2;
        const sides = Number(match[2]);
        diceMap.set(sides, (diceMap.get(sides) || 0) + count);
      } else {
        const num = Number(tok);
        if (Number.isFinite(num)) flatBonus += num * sign;
      }
    });
  });

  const sortedSides = [...diceMap.keys()].sort((a, b) => b - a);
  const parts = [];
  const qtyParts = [];
  const diceList = [];
  let totalDice = 0;

  sortedSides.forEach(sides => {
    const count = diceMap.get(sides);
    if (!count) return;
    const absCount = Math.abs(count);
    totalDice += absCount;
    diceList.push({ sides, count: absCount, signedCount: count });
    qtyParts.push(`${absCount} × d${sides}`);
    parts.push(parts.length === 0 ? `${count}d${sides}` : `${count > 0 ? '+' : ''}${count}d${sides}`);
  });

  if (flatBonus !== 0) {
    if (parts.length === 0) parts.push(String(flatBonus));
    else parts.push(flatBonus > 0 ? `+${flatBonus}` : String(flatBonus));
  }

  const formula = parts.join('') || '0';
  const breakdown = qtyParts.length
    ? `${qtyParts.join(' + ')}${flatBonus ? ` (${signed(flatBonus)})` : ''}`
    : (flatBonus ? `Modificador ${signed(flatBonus)}` : 'Sin dados');

  return { formula, totalDice, breakdown, flatBonus, diceMap, diceList };
}
