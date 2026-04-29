import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ObservedNode } from '@/lib/models';
import {
  getBatteryMetricsReportedAt,
  getLowBatteryRowFlags,
  isBatteryTelemetryStale,
  LOW_BATTERY_THRESHOLD_PERCENT,
  partitionLowBatteryNodes,
  qualifiesLowBatterySection,
} from './infrastructure-low-battery';

function baseNode(overrides: Partial<ObservedNode> = {}): ObservedNode {
  return {
    internal_id: 1,
    node_id: 100,
    node_id_str: '!00000064',
    mac_addr: null,
    long_name: 'Test',
    short_name: 'T',
    hw_model: null,
    public_key: null,
    last_heard: new Date('2026-01-15T12:00:00Z'),
    ...overrides,
  } as ObservedNode;
}

describe('infrastructure-low-battery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getBatteryMetricsReportedAt returns null without metrics', () => {
    expect(getBatteryMetricsReportedAt(baseNode())).toBeNull();
  });

  it('qualifiesLowBatterySection when metrics missing', () => {
    expect(qualifiesLowBatterySection(baseNode())).toBe(true);
  });

  it('qualifies when battery below threshold with fresh telemetry', () => {
    const n = baseNode({
      latest_device_metrics: {
        reported_time: new Date('2026-01-14T12:00:00Z'),
        logged_time: null,
        battery_level: 40,
        voltage: 3.5,
        channel_utilization: 0,
        air_util_tx: 0,
        uptime_seconds: 0,
      },
    });
    expect(qualifiesLowBatterySection(n)).toBe(true);
    expect(isBatteryTelemetryStale(n)).toBe(false);
  });

  it('qualifies when telemetry is stale (>3 days) even if battery reads high', () => {
    const n = baseNode({
      latest_device_metrics: {
        reported_time: new Date('2026-01-10T12:00:00Z'),
        logged_time: null,
        battery_level: 99,
        voltage: 4,
        channel_utilization: 0,
        air_util_tx: 0,
        uptime_seconds: 0,
      },
    });
    expect(qualifiesLowBatterySection(n)).toBe(true);
    expect(isBatteryTelemetryStale(n)).toBe(true);
  });

  it('does not qualify when fresh telemetry and battery healthy', () => {
    const n = baseNode({
      latest_device_metrics: {
        reported_time: new Date('2026-01-14T12:00:00Z'),
        logged_time: null,
        battery_level: LOW_BATTERY_THRESHOLD_PERCENT,
        voltage: 4,
        channel_utilization: 0,
        air_util_tx: 0,
        uptime_seconds: 0,
      },
    });
    expect(qualifiesLowBatterySection(n)).toBe(false);
  });

  it('partitionLowBatteryNodes dedupes by node_id and puts 0% last', () => {
    const dup = baseNode({
      node_id: 200,
      internal_id: 2,
      latest_device_metrics: {
        reported_time: new Date('2026-01-14T12:00:00Z'),
        logged_time: null,
        battery_level: 0,
        voltage: 0,
        channel_utilization: 0,
        air_util_tx: 0,
        uptime_seconds: 0,
      },
    });
    const lowFresh = baseNode({
      node_id: 201,
      internal_id: 3,
      last_heard: new Date('2026-01-15T10:00:00Z'),
      latest_device_metrics: {
        reported_time: new Date('2026-01-14T12:00:00Z'),
        logged_time: null,
        battery_level: 30,
        voltage: 3.4,
        channel_utilization: 0,
        air_util_tx: 0,
        uptime_seconds: 0,
      },
    });
    const out = partitionLowBatteryNodes([dup, dup, lowFresh]);
    expect(out.map((n) => n.node_id)).toEqual([201, 200]);
  });

  it('getLowBatteryRowFlags shows both badges when low and stale', () => {
    const n = baseNode({
      latest_device_metrics: {
        reported_time: new Date('2026-01-10T12:00:00Z'),
        logged_time: null,
        battery_level: 20,
        voltage: 3.2,
        channel_utilization: 0,
        air_util_tx: 0,
        uptime_seconds: 0,
      },
    });
    const f = getLowBatteryRowFlags(n);
    expect(f.showLowBatteryBadge).toBe(true);
    expect(f.showStaleBatteryBadge).toBe(true);
    expect(f.isZeroPercent).toBe(false);
  });

  it('stale threshold uses STALE_BATTERY_TELEMETRY_DAYS boundary', () => {
    const freshEdge = baseNode({
      latest_device_metrics: {
        reported_time: new Date('2026-01-12T12:00:01Z'),
        logged_time: null,
        battery_level: 99,
        voltage: 4,
        channel_utilization: 0,
        air_util_tx: 0,
        uptime_seconds: 0,
      },
    });
    expect(isBatteryTelemetryStale(freshEdge)).toBe(false);

    const staleEdge = baseNode({
      latest_device_metrics: {
        reported_time: new Date('2026-01-12T11:59:59Z'),
        logged_time: null,
        battery_level: 99,
        voltage: 4,
        channel_utilization: 0,
        air_util_tx: 0,
        uptime_seconds: 0,
      },
    });
    expect(isBatteryTelemetryStale(staleEdge)).toBe(true);
  });
});
