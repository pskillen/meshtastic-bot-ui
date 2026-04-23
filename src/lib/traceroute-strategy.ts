/** Target selection strategy (`AutoTraceRoute.target_strategy`). */

/** Hypothesis + legacy tokens used in filters and coverage (not `manual`). */
export type TracerouteStrategyValue = 'intra_zone' | 'dx_across' | 'dx_same_side' | 'legacy';

/** Full set including server-persisted manual target runs. */
export type TracerouteStrategyDisplayValue = TracerouteStrategyValue | 'manual';

export const TRACEROUTE_STRATEGIES = [
  'intra_zone',
  'dx_across',
  'dx_same_side',
  'legacy',
] as const satisfies readonly TracerouteStrategyValue[];

export const STRATEGY_META: Record<
  TracerouteStrategyDisplayValue,
  { label: string; shortDescription: string; badgeVariant: 'default' | 'secondary' | 'outline' }
> = {
  intra_zone: {
    label: 'Intra-zone',
    shortDescription: 'Target inside the constellation envelope — tests intra-mesh continuity.',
    badgeVariant: 'default',
  },
  dx_across: {
    label: 'DX across',
    shortDescription: 'Distant target on the opposite side of centroid — tests long paths across the zone.',
    badgeVariant: 'secondary',
  },
  dx_same_side: {
    label: 'DX same side',
    shortDescription: 'Distant target outside the envelope on your side — tests outreach past the perimeter.',
    badgeVariant: 'outline',
  },
  legacy: {
    label: 'Legacy',
    shortDescription: 'Recorded before strategy tracking or unspecified.',
    badgeVariant: 'outline',
  },
  manual: {
    label: 'Manual target',
    shortDescription: 'User picked an explicit target node; no automated hypothesis selection.',
    badgeVariant: 'outline',
  },
};

export function strategyLabel(value: TracerouteStrategyDisplayValue | string | null | undefined): string {
  if (value == null || value === '') return '—';
  const k = value as TracerouteStrategyDisplayValue;
  return STRATEGY_META[k]?.label ?? String(value);
}

export function applicableStrategiesFromGeo(
  geo:
    | {
        applicable_strategies?: string[];
      }
    | null
    | undefined
): TracerouteStrategyValue[] {
  const raw = geo?.applicable_strategies ?? [];
  return raw.filter((s): s is TracerouteStrategyValue => TRACEROUTE_STRATEGIES.includes(s as TracerouteStrategyValue));
}

/** Initial coverage UI state: every strategy checked (= no `target_strategy` filter on the API). */
export function createCoverageStrategiesAllSelected(): Record<TracerouteStrategyValue, boolean> {
  return Object.fromEntries(TRACEROUTE_STRATEGIES.map((k) => [k, true])) as Record<TracerouteStrategyValue, boolean>;
}

/**
 * Comma-separated `target_strategy` query value, or `undefined` when all or none are selected
 * (backend treats omitted param as all strategies).
 */
export function coverageTargetStrategyQueryParam(strategies: Record<string, boolean>): string | undefined {
  const selected = TRACEROUTE_STRATEGIES.filter((k) => strategies[k]);
  if (selected.length === 0 || selected.length === TRACEROUTE_STRATEGIES.length) {
    return undefined;
  }
  return selected.join(',');
}

/** Human-readable line for coverage stats cards. */
export function coverageTargetStrategySummary(strategies: Record<string, boolean>): string {
  const selected = TRACEROUTE_STRATEGIES.filter((k) => strategies[k]);
  if (selected.length === 0 || selected.length === TRACEROUTE_STRATEGIES.length) return 'All strategies';
  return selected.map((k) => STRATEGY_META[k].label).join(', ');
}
