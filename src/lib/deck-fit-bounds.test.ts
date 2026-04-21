import { describe, it, expect } from 'vitest';
import { viewStateFromLngLatBBox } from './deck-fit-bounds';

describe('viewStateFromLngLatBBox', () => {
  it('returns longitude, latitude, and zoom within maxZoom', () => {
    const vs = viewStateFromLngLatBBox([-4.3, 55.85, -4.1, 55.95], { padding: 40, maxZoom: 14 });
    expect(typeof vs.longitude).toBe('number');
    expect(typeof vs.latitude).toBe('number');
    expect(typeof vs.zoom).toBe('number');
    expect(Number.isFinite(vs.longitude)).toBe(true);
    expect(Number.isFinite(vs.latitude)).toBe(true);
    expect(Number.isFinite(vs.zoom)).toBe(true);
    expect(vs.zoom).toBeLessThanOrEqual(14);
    expect(vs.longitude).toBeCloseTo(-4.2, 0);
    expect(vs.latitude).toBeCloseTo(55.9, 0);
  });
});
