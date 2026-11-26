import { CAMPAIGN } from '../../data/campaign/index.js';
import { formatMeters } from '../../domain/shared/formatters.js';
import { $ } from '../shared/dom.js';
import { getAllCharacters, pwaState } from './pwa-state.js';

export function showScreen(which) {
  $('#pickerScreen').hidden = which !== 'picker';
  $('#playerShell').hidden = which !== 'player';
}

export function renderPicker(onSelectCharacter) {
  const chars = getAllCharacters();
  $('#pickerCampaignName').textContent = pwaState.livePayload?.campaignName || CAMPAIGN.name || 'Ronda · D&D 2024';
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
    [`PG ${c.hp}/${c.maxHp}`, `CA ${c.ac ?? '—'}`, `Vel ${formatMeters(c.speed || 9, true)} m`].forEach(t => {
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
    btn.addEventListener('click', () => onSelectCharacter(c.id));
    grid.append(btn);
  });
}
