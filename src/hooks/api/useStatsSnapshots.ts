import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import { PaginatedResponse, StatsSnapshot } from '@/lib/models';
import { StatsSnapshotsParams } from '@/lib/types';
import { roundToNearestMinutes } from 'date-fns';

function getStatsSnapshotsKey(params?: StatsSnapshotsParams): string {
  if (!params) return 'default';
  const parts: string[] = [params.statType ?? '', params.constellationId?.toString() ?? ''];
  if (params.recordedAtAfter) {
    const rounded = roundToNearestMinutes(params.recordedAtAfter, { nearestTo: 5 });
    parts.push(rounded.toISOString());
  }
  if (params.recordedAtBefore) {
    const rounded = roundToNearestMinutes(params.recordedAtBefore, { nearestTo: 5 });
    parts.push(rounded.toISOString());
  }
  parts.push(params.page?.toString() ?? '', params.page_size?.toString() ?? '');
  return parts.join('-');
}

/**
 * Hook to fetch stats snapshots
 */
export function useStatsSnapshots(params?: StatsSnapshotsParams) {
  const api = useMeshtasticApi();
  const key = ['stats-snapshots', getStatsSnapshotsKey(params)];

  return useQuery<PaginatedResponse<StatsSnapshot>, Error>({
    refetchInterval: 5 * 1000 * 60, // 5 minutes
    queryKey: key,
    queryFn: () => api.getStatsSnapshots(params),
  });
}

/**
 * Suspense-enabled hook to fetch stats snapshots
 * Use inside a <Suspense> boundary.
 */
export function useStatsSnapshotsSuspense(params?: StatsSnapshotsParams) {
  const api = useMeshtasticApi();
  const key = ['stats-snapshots', getStatsSnapshotsKey(params)];

  const query = useSuspenseQuery<PaginatedResponse<StatsSnapshot>, Error>({
    refetchInterval: 5 * 1000 * 60, // 5 minutes
    queryKey: key,
    queryFn: () => api.getStatsSnapshots(params),
  });

  return {
    snapshots: query.data,
  };
}
