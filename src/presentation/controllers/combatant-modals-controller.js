import { formatMeters } from '../../domain/shared/formatters.js';
import { getLevel } from '../../domain/combat/combatant-stats.js';
import { googleImagesUrl } from '../../infrastructure/browser/enemy-image-search.js';
import { readImageFileAsDataUrl, readJsonFile } from '../../infrastructure/browser/file-io.js';
import { emitToast, viewed } from '../../application/store/encounter-store.js';
import {
  createEnemies,
  parseSpeedValue,
  removeCombatant,
  updateCombatantFromForm
} from '../../application/use-cases/combatant-crud.js';
import { importCharacterJsonData } from '../../application/use-cases/encounter-io.js';
import { $, closeDialog, openDialog } from '../shared/dom.js';

let pendingEnemyUploadDataUrl = '';
let pendingEditAvatarDataUrl = '';

export function openAddEnemyDialog() {
  pendingEnemyUploadDataUrl = '';
  $('#enemyName').value = '';
  $('#enemyCount').value = '1';
  $('#enemyInitRoll').value = '';
  $('#enemyInit').value = '1';
  $('#enemyHp').value = '25/25';
  $('#enemyAc').value = '15';
  $('#enemySpeed').value = '9 m';
  $('#enemyAtk').value = '5';
  $('#enemyDmg').value = '1d8+3';
  $('#enemyImageUrl').value = '';
  const stageChk = $('#enemyStageCheck');
  if (stageChk) stageChk.checked = true;
  openDialog($('#combatantDialog'));
}

export function wireCombatantModalsEvents() {
  $('#addCombatant').addEventListener('click', openAddEnemyDialog);
  $('#addTarget').addEventListener('click', openAddEnemyDialog);
  $('#mapAddEnemySideBtn')?.addEventListener('click', openAddEnemyDialog);

  $('#uploadEnemyImgBtn').addEventListener('click', () => $('#enemyImageFile').click());
  $('#enemyImageFile').addEventListener('change', e => {
    readImageFileAsDataUrl(e.target.files[0], url => {
      pendingEnemyUploadDataUrl = url;
      $('#enemyImageUrl').value = '(Imagen local cargada)';
      emitToast('Imagen cargada');
    });
    e.target.value = '';
  });
  $('#searchEnemyGoogleBtn').addEventListener('click', () => {
    window.open(googleImagesUrl($('#enemyName').value.trim() || 'dnd monster'), '_blank', 'noopener,noreferrer');
  });

  $('#saveEnemy').addEventListener('click', () => {
    const hpParts = $('#enemyHp').value.split('/').map(x => parseInt(x, 10));
    const maxHp = Math.max(1, hpParts[1] || hpParts[0] || 25);
    const hp = Math.max(0, Math.min(maxHp, Number.isFinite(hpParts[0]) ? hpParts[0] : maxHp));
    const initRollRaw = $('#enemyInitRoll').value.trim();
    const urlInput = $('#enemyImageUrl').value.trim();

    createEnemies({
      rawName: $('#enemyName').value.trim(),
      count: Math.max(1, Math.min(20, parseInt($('#enemyCount')?.value, 10) || 1)),
      stageInReserve: $('#enemyStageCheck') ? $('#enemyStageCheck').checked : true,
      hp,
      maxHp,
      initMod: parseInt($('#enemyInit').value, 10) || 0,
      initRoll: initRollRaw !== '' && Number.isFinite(Number(initRollRaw)) ? Number(initRollRaw) : null,
      avatar: pendingEnemyUploadDataUrl || (urlInput && urlInput !== '(Imagen local cargada)' ? urlInput : ''),
      ac: Math.max(1, parseInt($('#enemyAc').value, 10) || 12),
      speed: parseSpeedValue($('#enemySpeed').value, 9),
      atk: parseInt($('#enemyAtk').value, 10) || 4,
      dmg: $('#enemyDmg').value.trim() || '1d8+2'
    });
    closeDialog($('#combatantDialog'));
  });

  $('#editCharacter').addEventListener('click', () => {
    const c = viewed();
    pendingEditAvatarDataUrl = '';
    $('#nameInput').value = c.name;
    $('#levelInput').value = getLevel(c);
    $('#classInput').value = c.className || '';
    $('#hpInput').value = `${c.hp}/${c.maxHp}`;
    $('#acInput').value = c.ac ?? 10;
    $('#speedInput').value = `${formatMeters(c.speed)} m`;
    $('#initModInput').value = c.initiative ?? 0;
    $('#avatarUrlInput').value = c.avatar && !c.avatar.startsWith('data:') ? c.avatar : '';
    openDialog($('#editDialog'));
  });

  $('#uploadAvatarBtn').addEventListener('click', () => $('#avatarFileInput').click());
  $('#avatarFileInput').addEventListener('change', e => {
    readImageFileAsDataUrl(e.target.files[0], url => {
      pendingEditAvatarDataUrl = url;
      $('#avatarUrlInput').value = '(Imagen local cargada)';
      emitToast('Imagen lista');
    });
    e.target.value = '';
  });
  $('#searchGoogleEditBtn').addEventListener('click', () => {
    window.open(googleImagesUrl($('#nameInput').value.trim() || viewed().name), '_blank', 'noopener,noreferrer');
  });

  $('#saveCharacter').addEventListener('click', () => {
    const hpParts = $('#hpInput').value.split('/').map(x => parseInt(x, 10));
    const c = viewed();
    const maxHp = Math.max(1, hpParts[1] || hpParts[0] || c.maxHp || 1);
    const hp = Math.max(0, Math.min(maxHp, Number.isFinite(hpParts[0]) ? hpParts[0] : c.hp));
    const avatarRaw = $('#avatarUrlInput').value.trim();
    updateCombatantFromForm({
      name: $('#nameInput').value.trim(),
      level: parseInt($('#levelInput').value, 10) || 1,
      className: $('#classInput').value.trim(),
      hp,
      maxHp,
      ac: parseInt($('#acInput').value, 10) || 10,
      speed: $('#speedInput').value,
      initiative: parseInt($('#initModInput').value, 10) || 0,
      avatar: pendingEditAvatarDataUrl || (avatarRaw && avatarRaw !== '(Imagen local cargada)' ? avatarRaw : '')
    });
    closeDialog($('#editDialog'));
  });

  $('#deleteCharacterBtn')?.addEventListener('click', () => {
    const c = viewed();
    if (c && removeCombatant(c.id, msg => confirm(msg))) closeDialog($('#editDialog'));
  });

  $('#jsonImport').addEventListener('click', () => $('#fileInput').click());
  $('#manualEntry').addEventListener('click', () => { closeDialog($('#importDialog')); $('#editCharacter').click(); });
  $('#fileInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await readJsonFile(file);
      importCharacterJsonData(data, $('#importModeSelect').value);
      closeDialog($('#importDialog'));
    } catch {
      emitToast('No se pudo leer ese archivo JSON');
    }
    e.target.value = '';
  });
}
