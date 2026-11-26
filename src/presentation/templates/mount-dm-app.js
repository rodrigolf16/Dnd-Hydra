import { SHELL_HTML } from './shell-template.js';
import { ENCOUNTER_LEFT_HTML } from './encounter-left-template.js';
import { ENCOUNTER_RIGHT_HTML } from './encounter-right-template.js';
import { MAP_TOOLBAR_HTML } from './map-toolbar-template.js';
import { MAP_WORKSPACE_HTML } from './map-workspace-template.js';
import { MODALS_ACTION_HTML } from './modals-action-template.js';
import { MODALS_COMBAT_HTML } from './modals-combat-template.js';
import { MODALS_ENTITY_HTML } from './modals-entity-template.js';
import { MODALS_SYSTEM_HTML } from './modals-system-template.js';
import { MODALS_MOBILE_SYNC_HTML } from './modals-mobile-sync-template.js';

export function mountDmApp(root = document.getElementById('appRoot')) {
  if (!root) return;
  root.innerHTML = [
    SHELL_HTML,
    ENCOUNTER_LEFT_HTML,
    ENCOUNTER_RIGHT_HTML,
    MAP_TOOLBAR_HTML,
    MAP_WORKSPACE_HTML,
    MODALS_ACTION_HTML,
    MODALS_COMBAT_HTML,
    MODALS_ENTITY_HTML,
    MODALS_SYSTEM_HTML,
    MODALS_MOBILE_SYNC_HTML
  ].join('\n');
}
