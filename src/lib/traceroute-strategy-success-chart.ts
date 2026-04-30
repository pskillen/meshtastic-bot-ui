import { strategyLabel, type TracerouteStrategyDisplayValue } from '@/lib/traceroute-strategy';

/** Counts per strategy from GET /traceroutes/stats/ (e.g. ``by_strategy_excluding_external`` for success bars). */
export type TracerouteStrategyStatCounts = {
  completed: number;
  failed: number;
  pending: number;
  sent: number;
};

/** Stable column order; null target_strategy is aggregated under ``legacy`` where present in the payload. */
export const STRATEGY_SUCCESS_BAR_ORDER: TracerouteStrategyDisplayValue[] = [
  'intra_zone',
  'dx_across',
  'dx_same_side',
  'legacy',
  'manual',
];

const ZERO: TracerouteStrategyStatCounts = { completed: 0, failed: 0, pending: 0, sent: 0 };

export type StrategySuccessBarRow = {
  strategyKey: string;
  label: string;
  success_pct: number | null;
} & TracerouteStrategyStatCounts;

/** Row passed to Recharts after adding bar geometry and colour. */
export type StrategySuccessBarChartRow = StrategySuccessBarRow & { barHeight: number; fill: string };

/**
 * Rows for a bar chart: one column per known strategy (even when zero runs), then any extra keys from the API.
 */
export function buildStrategySuccessBarChartData(
  by_strategy: Record<string, TracerouteStrategyStatCounts> | undefined | null
): StrategySuccessBarRow[] {
  const raw = by_strategy ?? {};
  const keys: string[] = [...STRATEGY_SUCCESS_BAR_ORDER];
  const extras = Object.keys(raw)
    .filter((k) => !keys.includes(k))
    .sort();
  keys.push(...extras);

  return keys.map((strategyKey) => {
    const c = raw[strategyKey] ?? ZERO;
    const finished = c.completed + c.failed;
    const success_pct = finished > 0 ? (100 * c.completed) / finished : null;
    return {
      strategyKey,
      label: strategyLabel(strategyKey),
      success_pct,
      completed: c.completed,
      failed: c.failed,
      pending: c.pending,
      sent: c.sent,
    };
  });
}
