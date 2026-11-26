const NICE_METER_STEPS = [1.5, 3, 4.5, 6, 9, 12, 15, 18, 24, 30, 45, 60, 75, 90, 120, 150];

export function getMetersPerSquare(map) {
  const val = Number(map?.metersPerSquare);
  return Number.isFinite(val) && val > 0 ? val : 1.5;
}

export function getGridSizePx(map) {
  const gs = Number(map?.gridSize);
  return Number.isFinite(gs) && gs >= 8 ? gs : 56;
}

export function getPxPerMeter(map) {
  return getGridSizePx(map) / getMetersPerSquare(map);
}

export function metersToPx(meters, map) {
  return (Number(meters) || 0) * getPxPerMeter(map);
}

export function pxToMeters(px, map) {
  const ppm = getPxPerMeter(map);
  return ppm > 0 ? (Number(px) || 0) / ppm : 0;
}

export function getMapWidthMeters(map) {
  const w = Number(map?.width) || 1280;
  return Math.round(pxToMeters(w, map) * 10) / 10;
}

export function getMapHeightMeters(map) {
  const h = Number(map?.height) || 840;
  return Math.round(pxToMeters(h, map) * 10) / 10;
}

export function setMapWidthMeters(map, targetWidthMeters) {
  const cleanM = Math.max(6, Math.min(500, Number(targetWidthMeters) || 35));
  const mps = getMetersPerSquare(map);
  const w = Number(map?.width) || 1280;
  const rawGs = (w / cleanM) * mps;
  map.gridSize = Math.max(12, Math.min(180, Math.round(rawGs * 10) / 10));
  return map.gridSize;
}

export function computeScaleBar(map, zoom = 1) {
  const ppm = getPxPerMeter(map);
  const screenPxPerMeter = ppm * Math.max(0.1, Number(zoom) || 1);
  const mps = getMetersPerSquare(map);

  let chosenMeters = NICE_METER_STEPS[0];
  for (const step of NICE_METER_STEPS) {
    const px = step * screenPxPerMeter;
    chosenMeters = step;
    if (px >= 78 && px <= 175) break;
    if (px > 175) break;
  }

  const barPx = Math.max(44, Math.min(200, Math.round(chosenMeters * screenPxPerMeter)));
  const squares = Math.round((chosenMeters / mps) * 10) / 10;
  const fmt = v => String(Math.round(v * 10) / 10).replace('.', ',');

  return {
    barPx,
    meters: chosenMeters,
    squares,
    label: `${fmt(chosenMeters)} m`,
    detail: `${fmt(squares)} ${squares === 1 ? 'casilla' : 'casillas'} · Mapa ${fmt(getMapWidthMeters(map))}×${fmt(getMapHeightMeters(map))} m`
  };
}
