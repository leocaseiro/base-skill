import { describe, expect, it } from 'vitest';
import { lerp, magneticOffset } from './magnetic-snap';

describe('lerp', () => {
  it('returns a at t=0', () => expect(lerp(0, 100, 0)).toBe(0));
  it('returns b at t=1', () => expect(lerp(0, 100, 1)).toBe(100));
  it('returns midpoint at t=0.5', () =>
    expect(lerp(0, 100, 0.5)).toBe(50));
});

describe('magneticOffset', () => {
  const zoneCenter = { x: 200, y: 300 };

  it('returns (0, 0) when distance is outside 60 px radius', () => {
    const result = magneticOffset(61, { x: 100, y: 200 }, zoneCenter);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('returns (0, 0) at exactly the boundary (60 px)', () => {
    const result = magneticOffset(60, { x: 100, y: 200 }, zoneCenter);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });

  it('applies lerp pull at 30 px distance', () => {
    const currentPos = { x: 170, y: 300 };
    const result = magneticOffset(30, currentPos, zoneCenter);
    const t = (1 - 30 / 60) * 0.3;
    const expectedX =
      lerp(currentPos.x, zoneCenter.x, t) - currentPos.x;
    const expectedY =
      lerp(currentPos.y, zoneCenter.y, t) - currentPos.y;
    expect(result.x).toBeCloseTo(expectedX);
    expect(result.y).toBeCloseTo(expectedY);
  });

  it('pulls strongly at 0 px distance (on top of zone center)', () => {
    const currentPos = { x: 200, y: 300 };
    const result = magneticOffset(0, currentPos, zoneCenter);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });
});
