/** Target selection strategy (`AutoTraceRoute.target_strategy`). */

export type TracerouteStrategyValue = 'intra_zone' | 'dx_across' | 'dx_same_side' | 'legacy';

export const TRACEROUTE_STRATEGIES = [
  'intra_zone',
  'dx_across',
  'dx_same_side',
  'legacy',
] as const satisfies readonly TracerouteStrategyValue[];

export const STRATEGY_META: Record<
  TracerouteStrategyValue,
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
};

export function strategyLabel(value: TracerouteStrategyValue | string | null | undefined): string {
  if (value == null || value === '') return STRATEGY_META.legacy.label;
  const k = value as TracerouteStrategyValue;
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
