import { emitToast, saveState } from '../store/encounter-store.js';
import { addLog } from './combat-log.js';

export function adjustHp(c, delta, reason = '') {
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
      emitToast(`${c.name} recibe ${dmg} daño — Salv. CON CD ${dc} (${c.concentration.spell})`);
    } else if (next === 0) {
      extra += c.type === 'enemy' ? ' · Fuera de combate' : ' · ¡Inconsciente (0 PG)!';
      emitToast(`${c.name} cae a 0 PG`);
    } else {
      emitToast(`${c.name}: -${dmg} PG (${next}/${c.maxHp})`);
    }
    if (next === 0 && c.concentration) {
      c.concentration = null;
      c.markedTargetId = null;
    }
    addLog(c.name, `recibe ${dmg} de daño`, `${reason ? `${reason} · ` : ''}${extra}`, '✕');
  } else if (diff > 0) {
    addLog(c.name, `recupera ${diff} PG`, `${reason ? `${reason} · ` : ''}${next}/${c.maxHp} PG`, '✚');
    emitToast(`${c.name}: +${diff} PG (${next}/${c.maxHp})`);
  }

  saveState('all');
}

export function setExactHp(c, exactHp, reason = '') {
  if (!c) return;
  const clamped = Math.max(0, Math.min(c.maxHp, exactHp));
  adjustHp(c, clamped - c.hp, reason);
}
