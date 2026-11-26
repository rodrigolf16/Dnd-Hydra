// Validación automática CI para Ronda — Panel DM D&D 2024
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const fail = msg => {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
};

// 1. Syntax-check every JS file
const jsFiles = [
  'app.js',
  'campaign-data.js',
  'map-engine.js',
  'player.js',
  'player-map.js',
  'player-sw.js',
  'sync-bridge.js',
  'extension/background.js',
  'extension/popup.js',
  'extension/nivel20-sync.js',
  'lib/peerjs.min.js',
  'lib/qrcode.js'
];

for (const file of jsFiles) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) fail(`Missing JS file: ${file}`);
  execFileSync(process.execPath, ['--check', full], { stdio: 'inherit' });
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
  if (ref && !fs.existsSync(path.join(root, ref))) {
    fail(`manifest.json references missing file: ${ref}`);
  }
}
const pwa = JSON.parse(fs.readFileSync(path.join(root, 'player-manifest.webmanifest'), 'utf8'));
if (!pwa.name || !pwa.start_url) fail('player-manifest.webmanifest missing required fields');
console.log('✓ Manifests JSON válidos (MV3 + PWA)');

// 3. Enforce Manifest V3 CSP (no external <script src="http..."> in extension pages)
for (const htmlFile of ['index.html', 'player-map.html', 'player.html', 'extension/popup.html']) {
  const html = fs.readFileSync(path.join(root, htmlFile), 'utf8');
  if (/<script[^>]+src=["']https?:\/\//i.test(html)) {
    fail(`${htmlFile} loads an external script (blocked by Manifest V3 CSP)`);
  }
}
console.log('✓ Cumplimiento CSP Manifest V3 (0 scripts remotos)');

// 4. Unit tests: sync-bridge.js payload sanitization & QR generation
{
  const sandbox = {
    URL,
    localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = String(v); } },
    setTimeout,
    clearTimeout
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'campaign-data.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'lib/qrcode.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'sync-bridge.js'), 'utf8'), sandbox);

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
      ...sandbox.window.CAMPAIGN.characters.map(c => ({ ...c, type: 'pc' })),
      { id: 'e-hidden', name: 'Oculto', type: 'enemy', hp: 50, maxHp: 50 },
      { id: 'e-staged', name: 'EnReserva', type: 'enemy', hp: 40, maxHp: 40 },
      { id: 'e-visible', name: 'Goblin', type: 'enemy', hp: 7, maxHp: 12 }
    ]
  };
  const payload = sandbox.window.RondaSync.buildPlayerPayload(state, sandbox.window.CAMPAIGN.name);
  const raw = JSON.stringify(payload);
  if (raw.includes('SECRET_MAP_PAYLOAD')) fail('Map image leaked in mobile payload');
  if (raw.includes('Oculto') || raw.includes('EnReserva')) fail('Hidden or staged enemy leaked');
  const vis = payload.initiativeOrder.find(x => x.id === 'e-visible');
  if (!vis || 'hp' in vis || 'maxHp' in vis) fail('Visible enemy missing or HP leaked');
  if (payload.characters.length !== 6) fail(`Expected 6 PCs, got ${payload.characters.length}`);

  const qr = sandbox.window.qrcode(0, 'M');
  qr.addData(sandbox.window.RondaSync.buildJoinUrl('HYDRA1'));
  qr.make();
  if (!qr.createSvgTag({ scalable: true }).startsWith('<svg')) fail('QR SVG generation failed');
}
console.log('✓ Pruebas de sincronización móvil y privacidad OK');

// 5. Unit tests: map-engine.js (distance scale, rotation, 2D walls, manual fog)
{
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'map-engine.js'), 'utf8'), sandbox);
  const ME = sandbox.window.RondaMapEngine;

  // Scale: 1280px wide map representing 50m -> 27m vision must be ~691.2px (< 1280px)
  const map = { width: 1280, height: 840, natWidth: 1280, natHeight: 840, rotation: 0, gridSize: 56, metersPerSquare: 1.5, tokens: { pc1: { x: 100, y: 200, staged: false } }, markers: [], walls: [{ x1: 500, y1: 0, x2: 500, y2: 840 }], fogStrokes: [] };
  ME.setMapWidthMeters(map, 50);
  const wM = ME.getMapWidthMeters(map);
  if (Math.abs(wM - 50) > 0.5) fail(`Expected ~50m map width, got ${wM}`);
  const v27 = ME.metersToPx(27, map);
  if (v27 < 650 || v27 > 730) fail(`Expected 27m vision ~691px, got ${v27}`);

  // 2D Wall line-of-sight
  if (!ME.isBlockedByWalls(200, 400, 700, 400, map.walls)) fail('Wall failed to block line of sight');
  if (ME.isBlockedByWalls(200, 400, 400, 400, map.walls)) fail('False wall intersection');
  const poly = ME.computeVisibilityPolygon(200, 400, 800, map.walls);
  if (!poly || poly.length < 10) fail('Visibility polygon failed');
  if (poly.some(p => p.y >= 2 && p.y <= 838 && p.x > 501)) fail('Visibility polygon leaked through wall at x=500');

  // Manual fog cover vs reveal order
  const strokes = [
    { mode: 'cover', radius: 50, points: [{ x: 300, y: 300 }] },
    { mode: 'reveal', radius: 25, points: [{ x: 300, y: 300 }] }
  ];
  if (ME.getManualFogStateAt(300, 300, strokes) !== 'reveal') fail('Manual reveal did not override cover');
  if (ME.getManualFogStateAt(335, 300, strokes) !== 'cover') fail('Manual cover missed outer ring');

  // Lossless 90° rotation
  ME.rotateMap90(map, true);
  if (map.rotation !== 90 || map.width !== 840 || map.height !== 1280) fail('Map +90° rotation failed');
  if (map.tokens.pc1.x !== 640 || map.tokens.pc1.y !== 100) fail('Token rotation transform mismatch');
}
console.log('✓ Pruebas de escala, paredes 2D, niebla manual y rotación OK');
console.log('ALL CI VALIDATIONS PASSED');
