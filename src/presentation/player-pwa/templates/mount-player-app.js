import { PICKER_HTML } from './picker-template.js';
import { SHELL_HEADER_HTML } from './shell-header-template.js';
import { TURN_TAB_HTML } from './turn-tab-template.js';
import { SPELLS_TAB_HTML } from './spells-tab-template.js';
import { CHECKS_SHEET_MODALS_HTML } from './checks-sheet-modals-template.js';

export function mountPlayerApp(root = document.getElementById('playerAppRoot')) {
  if (!root) return;
  root.innerHTML = [
    PICKER_HTML,
    SHELL_HEADER_HTML,
    TURN_TAB_HTML,
    SPELLS_TAB_HTML,
    CHECKS_SHEET_MODALS_HTML
  ].join('\n');
}
