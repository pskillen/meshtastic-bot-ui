import { subDays } from 'date-fns';
import type { ObservedNode } from '@/lib/models';

/** Battery reading older than this is treated as stale (separate from GPS freshness). */
export const STALE_BATTERY_TELEMETRY_DAYS = 3;

/** Below this percentage (inclusive of 0) counts as “low battery” when telemetry exists. */
export const LOW_BATTERY_THRESHOLD_PERCENT = 50;

export function getBatteryMetricsReportedAt(node: ObservedNode): Date | null {
  const m = node.latest_device_metrics;
  if (!m?.reported_time) return null;
  const t = m.reported_time;
  return t instanceof Date ? t : new Date(t);
}

export function isBatteryTelemetryStale(node: ObservedNode, now: Date = new Date()): boolean {
  const at = getBatteryMetricsReportedAt(node);
  if (!at) return true;
  return at < subDays(now, STALE_BATTERY_TELEMETRY_DAYS);
}

/** True if the node should appear in the low-battery section (union of low % and stale / missing telemetry). */
export function qualifiesLowBatterySection(node: ObservedNode, now: Date = new Date()): boolean {
  const m = node.latest_device_metrics;
  if (!m) return true;
  if (isBatteryTelemetryStale(node, now)) return true;
  return m.battery_level < LOW_BATTERY_THRESHOLD_PERCENT;
}

export type LowBatteryRowFlags = {
  /** Shown in the muted bottom group; telemetry often bogus at 0%. */
  isZeroPercent: boolean;
  showLowBatteryBadge: boolean;
  showStaleBatteryBadge: boolean;
};

export function getLowBatteryRowFlags(node: ObservedNode, now: Date = new Date()): LowBatteryRowFlags {
  const m = node.latest_device_metrics;
  const reportedAt = getBatteryMetricsReportedAt(node);
  const hasUsableMetrics = Boolean(m && reportedAt);
  const level = m?.battery_level;
  const isZeroPercent = hasUsableMetrics && level === 0;
  const showStaleBatteryBadge = !hasUsableMetrics || isBatteryTelemetryStale(node, now);
  const showLowBatteryBadge = hasUsableMetrics && level != null && level < LOW_BATTERY_THRESHOLD_PERCENT;
  return { isZeroPercent, showLowBatteryBadge, showStaleBatteryBadge };
}

function lastHeardTime(node: ObservedNode): number {
  if (!node.last_heard) return 0;
  return node.last_heard instanceof Date ? node.last_heard.getTime() : new Date(node.last_heard).getTime();
}

/**
 * Infrastructure “low battery” table: heuristic low/stale rows **plus** nodes with an active mesh
 * monitoring battery alert from the API (`battery_alert_active`), even when telemetry looks fine.
 */
export function partitionMeshInfraLowBatteryTableNodes(nodes: ObservedNode[], now: Date = new Date()): ObservedNode[] {
  const base = partitionLowBatteryNodes(nodes, now);
  const inBase = new Set(base.map((n) => n.node_id));
  const additions: ObservedNode[] = [];
  for (const n of nodes) {
    if (inBase.has(n.node_id)) continue;
    if (n.battery_alert_active) additions.push(n);
  }
  additions.sort((a, b) => lastHeardTime(b) - lastHeardTime(a));
  return [...additions, ...base];
}

/**
 * Deduplicates by node id, partitions 0% rows to the bottom, sorts by most recently heard within each group.
 */
export function partitionLowBatteryNodes(nodes: ObservedNode[], now: Date = new Date()): ObservedNode[] {
  const seen = new Set<number>();
  const candidates: ObservedNode[] = [];
  for (const n of nodes) {
    if (seen.has(n.node_id)) continue;
    if (!qualifiesLowBatterySection(n, now)) continue;
    seen.add(n.node_id);
    candidates.push(n);
  }

  const primary: ObservedNode[] = [];
  const zeroPercent: ObservedNode[] = [];
  for (const n of candidates) {
    if (getLowBatteryRowFlags(n, now).isZeroPercent) zeroPercent.push(n);
    else primary.push(n);
  }

  const byLastHeard = (a: ObservedNode, b: ObservedNode) => lastHeardTime(b) - lastHeardTime(a);
  primary.sort(byLastHeard);
  zeroPercent.sort(byLastHeard);
  return [...primary, ...zeroPercent];
}
