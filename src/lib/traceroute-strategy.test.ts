import { describe, it, expect } from 'vitest';
import { applicableStrategiesFromGeo, strategyLabel } from '@/lib/traceroute-strategy';

describe('traceroute-strategy', () => {
  it('strategyLabel maps known keys and falls back', () => {
    expect(strategyLabel(null)).toBe('—');
    expect(strategyLabel('')).toBe('—');
    expect(strategyLabel('dx_across')).toBe('DX across');
    expect(strategyLabel('manual')).toBe('Manual target');
    expect(strategyLabel('unknown_xyz')).toBe('unknown_xyz');
  });

  it('applicableStrategiesFromGeo filters invalid tokens', () => {
    expect(
      applicableStrategiesFromGeo({
        applicable_strategies: ['intra_zone', 'bogus', 'dx_same_side'],
      })
    ).toEqual(['intra_zone', 'dx_same_side']);
    expect(applicableStrategiesFromGeo(null)).toEqual([]);
  });
});
