import { CAMPAIGN_CONFIG } from './config.js';
import { KHAEL } from './characters/khael.js';
import { OJO } from './characters/ojo.js';
import { DOOZER } from './characters/doozer.js';
import { VOLSTAGG } from './characters/volstagg.js';
import { CLIVE } from './characters/clive.js';
import { KYGAN } from './characters/kygan.js';

export const CAMPAIGN = {
  ...CAMPAIGN_CONFIG,
  characters: [KHAEL, OJO, DOOZER, VOLSTAGG, CLIVE, KYGAN]
};
