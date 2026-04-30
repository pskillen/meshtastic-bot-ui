import { describe, expect, it } from 'vitest';
import {
  STRATEGY_SUCCESS_BAR_ORDER,
  buildStrategySuccessBarChartData,
  type TracerouteStrategyStatCounts,
} from './traceroute-strategy-success-chart';

describe('buildStrategySuccessBarChartData', () => {
  it('returns rows in stable order with zeros when by_strategy is empty', () => {
    const rows = buildStrategySuccessBarChartData({});
    expect(rows.map((r) => r.strategyKey)).toEqual([...STRATEGY_SUCCESS_BAR_ORDER]);
    for (const r of rows) {
      expect(r.completed).toBe(0);
      expect(r.failed).toBe(0);
      expect(r.success_pct).toBeNull();
    }
  });

  it('computes success_pct from completed and failed only', () => {
    const by: Record<string, TracerouteStrategyStatCounts> = {
      intra_zone: { completed: 3, failed: 1, pending: 2, sent: 0 },
    };
    const rows = buildStrategySuccessBarChartData(by);
    const intra = rows.find((r) => r.strategyKey === 'intra_zone');
    expect(intra?.success_pct).toBeCloseTo(75, 5);
    expect(intra?.completed).toBe(3);
    expect(intra?.failed).toBe(1);
  });

  it('appends unknown strategy keys after the canonical order', () => {
    const by: Record<string, TracerouteStrategyStatCounts> = {
      zz_future: { completed: 1, failed: 0, pending: 0, sent: 0 },
      intra_zone: { completed: 1, failed: 0, pending: 0, sent: 0 },
    };
    const keys = buildStrategySuccessBarChartData(by).map((r) => r.strategyKey);
    expect(keys.slice(0, STRATEGY_SUCCESS_BAR_ORDER.length)).toEqual([...STRATEGY_SUCCESS_BAR_ORDER]);
    expect(keys[keys.length - 1]).toBe('zz_future');
  });

  it('returns null success_pct when there are no finished runs', () => {
    const by: Record<string, TracerouteStrategyStatCounts> = {
      manual: { completed: 0, failed: 0, pending: 1, sent: 1 },
    };
    const manual = buildStrategySuccessBarChartData(by).find((r) => r.strategyKey === 'manual');
    expect(manual?.success_pct).toBeNull();
    expect(manual?.pending).toBe(1);
    expect(manual?.sent).toBe(1);
  });
});
