import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useMeshtasticApi } from './useApi';

export type FeederRangeMetric = 'p50' | 'p90' | 'p95' | 'max';
export type FeederRangeMode = 'direct' | 'any';

export interface FeederRangeBlock {
  sample_count: number;
  p50_km: number | null;
  p90_km: number | null;
  p95_km: number | null;
  max_km: number | null;
  low_confidence: boolean;
}

export interface FeederRange {
  managed_node_id: string;
  node_id: number;
  node_id_str: string;
  short_name?: string | null;
  long_name?: string | null;
  lat: number;
  lng: number;
  direct: FeederRangeBlock;
  any: FeederRangeBlock;
}

export interface FeederRangesData {
  feeders: FeederRange[];
  meta: {
    min_samples: number;
    window: { start: string | null; end: string | null };
  };
}

export interface UseFeederRangesParams {
  triggeredAtAfter?: Date;
  triggeredAtBefore?: Date;
  constellationId?: number;
  minSamples?: number;
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/** Round a Date down to the nearest 5 minutes for stable cache keys. */
function roundToFiveMinutes(d: Date): string {
  return new Date(Math.floor(d.getTime() / FIVE_MINUTES_MS) * FIVE_MINUTES_MS).toISOString();
}

export function useFeederRanges(params?: UseFeederRangesParams) {
  const api = useMeshtasticApi();
  const triggeredAtAfter = params?.triggeredAtAfter ? params.triggeredAtAfter.toISOString() : undefined;
  const triggeredAtBefore = params?.triggeredAtBefore ? params.triggeredAtBefore.toISOString() : undefined;

  // Stable cache keys: round timestamps to the nearest 5 minutes so a continuously
  // re-rendering "now" doesn't churn the query.
  const triggeredAtAfterKey = params?.triggeredAtAfter ? roundToFiveMinutes(params.triggeredAtAfter) : undefined;
  const triggeredAtBeforeKey = params?.triggeredAtBefore ? roundToFiveMinutes(params.triggeredAtBefore) : undefined;

  return useQuery<FeederRangesData>({
    queryKey: [
      'feeder-ranges',
      {
        triggeredAtAfterKey,
        triggeredAtBeforeKey,
        constellationId: params?.constellationId,
        minSamples: params?.minSamples,
      },
    ],
    placeholderData: keepPreviousData,
    queryFn: () =>
      api.getFeederRanges({
        triggered_at_after: triggeredAtAfter,
        triggered_at_before: triggeredAtBefore,
        constellation_id: params?.constellationId,
        min_samples: params?.minSamples,
      }) as Promise<FeederRangesData>,
  });
}
