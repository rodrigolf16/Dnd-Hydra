// Validación automática CI para Ronda — Panel DM D&D 2024 (Clean Architecture)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const fail = msg => {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
};

function collectJsFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['.git', '.agents', 'assets', 'node_modules'].includes(entry.name)) continue;
      collectJsFiles(full, out);
    } else if (entry.name.endsWith('.js')) {
      out.push(path.relative(root, full));
    }
  }
  return out;
}

// 1. Syntax-check every JS file
const jsFiles = collectJsFiles(root);
for (const file of jsFiles) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
}
console.log(`✓ Syntax OK (${jsFiles.length} archivos JS)`);

// 2. Validate JSON manifests & referenced files
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3) fail('manifest.json must be Manifest V3');
for (const ref of [
  manifest.action?.default_popup,
  manifest.side_panel?.default_path,
  manifest.background?.service_worker,
  ...Object.values(manifest.icons || {})
]) {
  if (ref && !fs.existsSync(path.join(root, ref))) fail(`manifest.json references missing file: ${ref}`);
}
const pwa = JSON.parse(fs.readFileSync(path.join(root, 'player-manifest.webmanifest'), 'utf8'));
if (!pwa.name || !pwa.start_url) fail('player-manifest.webmanifest missing required fields');
console.log('✓ Manifests JSON válidos (MV3 + PWA)');

// 3. Enforce Manifest V3 CSP (no external <script src="http..."> in extension pages)
for (const htmlFile of ['index.html', 'player-map.html', 'player.html', 'src/extension/popup/popup.html']) {
  const html = fs.readFileSync(path.join(root, htmlFile), 'utf8');
  if (/<script[^>]+src=["']https?:\/\//i.test(html)) {
    fail(`${htmlFile} loads an external script (blocked by Manifest V3 CSP)`);
  }
}
console.log('✓ Cumplimiento CSP Manifest V3 (0 scripts remotos)');

// 4. Unit tests: player-payload sanitization & QR generation
const { CAMPAIGN } = await import(pathToFileURL(path.join(root, 'src/data/campaign/index.js')).href);
const { buildJoinUrl, buildPlayerPayload } = await import(pathToFileURL(path.join(root, 'src/domain/sync/player-payload.js')).href);
{
  const state = {
    round: 2,
    activeTurnId: 'khael',
    map: {
      bgImage: 'data:image/jpeg;base64,SECRET_MAP_PAYLOAD',
      tokens: {
        'e-hidden': { hidden: true, staged: false },
        'e-staged': { hidden: false, staged: true },
        'e-visible': { hidden: false, staged: false }
      }
    },
    combatants: [
      ...CAMPAIGN.characters.map(c => ({ ...c, type: 'pc' })),
      { id: 'e-hidden', name: 'Oculto', type: 'enemy', hp: 50, maxHp: 50 },
      { id: 'e-staged', name: 'EnReserva', type: 'enemy', hp: 40, maxHp: 40 },
      { id: 'e-visible', name: 'Goblin', type: 'enemy', hp: 7, maxHp: 12 }
    ]
  };
  const payload = buildPlayerPayload(state, CAMPAIGN.name);
  const raw = JSON.stringify(payload);
  if (raw.includes('SECRET_MAP_PAYLOAD')) fail('Map image leaked in mobile payload');
  if (raw.includes('Oculto') || raw.includes('EnReserva')) fail('Hidden or staged enemy leaked');
  const vis = payload.initiativeOrder.find(x => x.id === 'e-visible');
  if (!vis || 'hp' in vis || 'maxHp' in vis) fail('Visible enemy missing or HP leaked');
  if (payload.characters.length !== 6) fail(`Expected 6 PCs, got ${payload.characters.length}`);

  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'lib/qrcode.js'), 'utf8'), sandbox);
  const qr = sandbox.window.qrcode(0, 'M');
  qr.addData(buildJoinUrl('HYDRA1'));
  qr.make();
  if (!qr.createSvgTag({ scalable: true }).startsWith('<svg')) fail('QR SVG generation failed');
}
console.log('✓ Pruebas de sincronización móvil y privacidad OK');

// 5. Unit tests: domain map modules (scale, rotation, 2D walls, manual fog)
const { getMapWidthMeters, metersToPx, setMapWidthMeters } = await import(pathToFileURL(path.join(root, 'src/domain/map/map-scale.js')).href);
const { computeVisibilityPolygon, isBlockedByWalls } = await import(pathToFileURL(path.join(root, 'src/domain/map/map-walls.js')).href);
const { getManualFogStateAt } = await import(pathToFileURL(path.join(root, 'src/domain/map/map-fog-strokes.js')).href);
const { rotateMap90 } = await import(pathToFileURL(path.join(root, 'src/domain/map/map-rotation.js')).href);
const { computeVisionSources, getDefaultDarkvisionMeters, isPointVisibleToPlayers } = await import(pathToFileURL(path.join(root, 'src/domain/map/vision-rules.js')).href);
{
  const map = { width: 1280, height: 840, natWidth: 1280, natHeight: 840, rotation: 0, gridSize: 56, metersPerSquare: 1.5, tokens: { pc1: { x: 100, y: 200, staged: false } }, markers: [], walls: [{ x1: 500, y1: 0, x2: 500, y2: 840 }], fogStrokes: [] };
  setMapWidthMeters(map, 50);
  const wM = getMapWidthMeters(map);
  if (Math.abs(wM - 50) > 0.5) fail(`Expected ~50m map width, got ${wM}`);
  const v27 = metersToPx(27, map);
  if (v27 < 650 || v27 > 730) fail(`Expected 27m vision ~691px, got ${v27}`);

  if (!isBlockedByWalls(200, 400, 700, 400, map.walls)) fail('Wall failed to block line of sight');
  if (isBlockedByWalls(200, 400, 400, 400, map.walls)) fail('False wall intersection');
  const poly = computeVisibilityPolygon(200, 400, 800, map.walls);
  if (!poly || poly.length < 10) fail('Visibility polygon failed');
  if (poly.some(p => p.y >= 2 && p.y <= 838 && p.x > 501)) fail('Visibility polygon leaked through wall at x=500');

  const strokes = [
    { mode: 'cover', radius: 50, points: [{ x: 300, y: 300 }] },
    { mode: 'reveal', radius: 25, points: [{ x: 300, y: 300 }] }
  ];
  if (getManualFogStateAt(300, 300, strokes) !== 'reveal') fail('Manual reveal did not override cover');
  if (getManualFogStateAt(335, 300, strokes) !== 'cover') fail('Manual cover missed outer ring');

  rotateMap90(map, true);
  if (map.rotation !== 90 || map.width !== 840 || map.height !== 1280) fail('Map +90° rotation failed');
  if (map.tokens.pc1.x !== 640 || map.tokens.pc1.y !== 100) fail('Token rotation transform mismatch');

  // 0m darkvision (Doozer / Clive) must NOT illuminate surrounding squares or reveal enemies in darkness
  const doozer = CAMPAIGN.characters.find(c => c.id === 'doozer');
  const clive = CAMPAIGN.characters.find(c => c.id === 'clive');
  if (getDefaultDarkvisionMeters(doozer) !== 0 || getDefaultDarkvisionMeters(clive) !== 0) {
    fail('Doozer and Clive should default to 0m darkvision');
  }
  const darkState = {
    combatants: [{ ...doozer, type: 'pc' }, { ...clive, type: 'pc' }],
    map: {
      width: 1280, height: 840, gridSize: 56, metersPerSquare: 1.5,
      lighting: 'darkness', fogEnabled: true, walls: [], fogStrokes: [], markers: [],
      tokens: {
        doozer: { x: 200, y: 200, size: 1, hidden: false, staged: false, darkvision: 0, light: 'none' },
        clive: { x: 400, y: 200, size: 1, hidden: false, staged: false, darkvision: 0, light: 'none' }
      }
    }
  };
  const darkSources = computeVisionSources(darkState);
  if (darkSources.some(s => s.dimPx > 0 || !s.selfOnly)) fail('0m darkvision PC illuminated squares in total darkness');
  if (isPointVisibleToPlayers(256, 200, darkState, darkSources)) fail('Adjacent square revealed by 0m darkvision PC in total darkness');
}
console.log('✓ Pruebas de escala, visión en oscuridad, paredes 2D, niebla manual y rotación OK');

// 6. Unit tests: Umbral Invisibility (Khael) & Enemy Vision
const {
  canEnemySeeTarget, collectRealLightSources, computeEnemyVisionSources,
  getDefaultEnemyDarkvisionMeters, hasUmbralInvisibility, isUmbralInvisible
} = await import(pathToFileURL(path.join(root, 'src/domain/map/enemy-vision-rules.js')).href);
{
  const khael = CAMPAIGN.characters.find(c => c.id === 'khael');
  const doozer = CAMPAIGN.characters.find(c => c.id === 'doozer');
  const goblin = { id: 'e-gob', name: 'Goblin explorador', type: 'enemy', hp: 10, maxHp: 10 };
  if (getDefaultDarkvisionMeters(khael) !== 36) fail(`Khael should default to 36m darkvision, got ${getDefaultDarkvisionMeters(khael)}`);
  if (!hasUmbralInvisibility(khael)) fail('Khael must auto-detect Umbral Invisibility');
  if (getDefaultEnemyDarkvisionMeters(goblin) !== 18) fail('Goblin should default to 18m darkvision');

  const st = {
    combatants: [{ ...khael, type: 'pc' }, { ...doozer, type: 'pc' }, goblin],
    map: {
      width: 1280, height: 840, gridSize: 56, metersPerSquare: 1.5,
      lighting: 'darkness', fogEnabled: true, walls: [], fogStrokes: [], markers: [],
      tokens: {
        khael: { x: 200, y: 200, size: 1, hidden: false, staged: false, darkvision: 36, light: 'none' },
        doozer: { x: 240, y: 200, size: 1, hidden: false, staged: false, darkvision: 0, light: 'none' },
        'e-gob': { x: 310, y: 200, size: 1, hidden: false, staged: false, darkvision: 18, light: 'none' }
      }
    }
  };
  let lights = collectRealLightSources(st);
  let eSources = computeEnemyVisionSources(st);
  if (!isUmbralInvisible(khael, st.map.tokens.khael, st, lights)) fail('Khael must be automatically umbral-invisible in total darkness');
  if (!buildPlayerPayload(st).characters.find(c => c.id === 'khael')?.conditions.some(x => /invisible/i.test(x))) {
    fail('Mobile payload must include automatic Invisible status for Khael in total darkness');
  }
  if (canEnemySeeTarget(eSources[0], khael, st.map.tokens.khael, st, lights)) fail('Goblin darkvision must NOT see umbral-invisible Khael');
  if (!canEnemySeeTarget(eSources[0], doozer, st.map.tokens.doozer, st, lights)) fail('Goblin darkvision must see Doozer');

  st.map.tokens.doozer.light = 'torch';
  lights = collectRealLightSources(st);
  if (isUmbralInvisible(khael, st.map.tokens.khael, st, lights)) fail('Torch light must break Khael umbral invisibility');
  if (!canEnemySeeTarget(eSources[0], khael, st.map.tokens.khael, st, lights)) fail('Goblin must see Khael once illuminated by torch');

  st.map.walls = [{ x1: 275, y1: 0, x2: 275, y2: 840 }];
  eSources = computeEnemyVisionSources(st);
  if (canEnemySeeTarget(eSources[0], doozer, st.map.tokens.doozer, st, lights)) fail('2D wall must block enemy line of sight');
}
console.log('✓ Pruebas de invisibilidad en la oscuridad (Khael) y visión de enemigos OK');
console.log('ALL CI VALIDATIONS PASSED');
