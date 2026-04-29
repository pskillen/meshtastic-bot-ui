import { describe, it, expect } from 'vitest';
import type { ObservedNode } from '@/lib/models';
import { partitionMeshInfraLowBatteryTableNodes, partitionLowBatteryNodes } from './infrastructure-low-battery';

function node(partial: Partial<ObservedNode>): ObservedNode {
  return {
    internal_id: 1,
    node_id: 1,
    node_id_str: '!00000001',
    mac_addr: null,
    long_name: 'A',
    short_name: 'A',
    hw_model: null,
    public_key: null,
    last_heard: new Date(),
    latest_position: null,
    latest_device_metrics: null,
    latest_environment_metrics: null,
    latest_power_metrics: null,
    ...partial,
  } as ObservedNode;
}

describe('partitionMeshInfraLowBatteryTableNodes', () => {
  it('includes nodes with battery_alert_active even when not in heuristic low-battery list', () => {
    const okBattery = node({
      node_id: 1,
      latest_device_metrics: {
        battery_level: 90,
        reported_time: new Date(),
        logged_time: null,
      } as ObservedNode['latest_device_metrics'],
      battery_alert_active: false,
    });
    const alertOnly = node({
      node_id: 2,
      latest_device_metrics: {
        battery_level: 90,
        reported_time: new Date(),
        logged_time: null,
      } as ObservedNode['latest_device_metrics'],
      battery_alert_active: true,
    });
    const low = node({
      node_id: 3,
      latest_device_metrics: {
        battery_level: 10,
        reported_time: new Date(),
        logged_time: null,
      } as ObservedNode['latest_device_metrics'],
    });
    const out = partitionMeshInfraLowBatteryTableNodes([okBattery, alertOnly, low]);
    expect(out.map((n) => n.node_id)).toContain(2);
    expect(out.map((n) => n.node_id)).toContain(3);
    expect(out[0].node_id).toBe(2);
    expect(partitionLowBatteryNodes([okBattery, alertOnly, low]).some((n) => n.node_id === 2)).toBe(false);
  });
});
