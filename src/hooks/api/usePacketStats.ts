import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import { GlobalStats } from '@/lib/models';
import { DateRangeIntervalParams } from '@/lib/types';

interface StatsQueryParams extends DateRangeIntervalParams {
  nodeId?: number;
}

/**
 * Hook to fetch packet statistics
 * @param params Optional parameters for the query (date range, interval, node ID)
 * @returns Query result with packet statistics
 */
export function usePacketStats(params?: StatsQueryParams) {
  const api = useMeshtasticApi();

  return useQuery<GlobalStats>({
    queryKey: ['stats', params],
    queryFn: async () => {
      const { startDate, endDate, nodeId, interval = 1, intervalType = 'hour' } = params || {};

      if (nodeId) {
        return await api.getNodeStats(nodeId, { startDate, endDate, interval, intervalType });
      } else {
        return await api.getGlobalStats({ startDate, endDate, interval, intervalType });
      }
    },
  });
}

/**
 * Suspense-enabled hook to fetch packet statistics
 * Use inside a <Suspense> boundary. No isLoading or error states are returned.
 * Note: Suspense hooks do not support the 'enabled' option.
 */
export function usePacketStatsSuspense(params?: StatsQueryParams) {
  const api = useMeshtasticApi();

  const query = useSuspenseQuery<GlobalStats, Error>({
    queryKey: ['stats', params],
    queryFn: async () => {
      const { startDate, endDate, nodeId, interval = 1, intervalType = 'hour' } = params || {};
      if (nodeId) {
        return await api.getNodeStats(nodeId, { startDate, endDate, interval, intervalType });
      } else {
        return await api.getGlobalStats({ startDate, endDate, interval, intervalType });
      }
    },
  });

  return {
    stats: query.data,
  };
}
