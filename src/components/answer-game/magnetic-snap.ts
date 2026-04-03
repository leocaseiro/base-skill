export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const MAGNETIC_RADIUS = 60;
const MAGNETIC_STRENGTH = 0.3;

export function magneticOffset(
  distance: number,
  currentPos: { x: number; y: number },
  zoneCenter: { x: number; y: number },
): { x: number; y: number } {
  if (distance >= MAGNETIC_RADIUS) return { x: 0, y: 0 };

  const t = (1 - distance / MAGNETIC_RADIUS) * MAGNETIC_STRENGTH;
  return {
    x: lerp(currentPos.x, zoneCenter.x, t) - currentPos.x,
    y: lerp(currentPos.y, zoneCenter.y, t) - currentPos.y,
  };
}
