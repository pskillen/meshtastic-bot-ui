import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import { GlobalStats } from '@/lib/models';
import { StatsQueryParams } from '@/lib/types';
import { getKeyValue, roundDateParams } from './hooks-utils';

/**
 * Hook to fetch packet statistics
 * @param params Optional parameters for the query (date range, interval, node ID)
 * @returns Query result with packet statistics
 */
export function usePacketStats(params?: StatsQueryParams) {
  const api = useMeshtasticApi();
  params = roundDateParams(params);

  const keyValue = getKeyValue(params);
  const key = ['stats', keyValue];

  return useQuery<GlobalStats>({
    refetchInterval: 5 * 1000 * 60, // 5 minutes
    queryKey: key,
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
  params = roundDateParams(params);
  const keyValue = getKeyValue(params);
  const key = ['stats', keyValue];

  const query = useSuspenseQuery<GlobalStats, Error>({
    refetchInterval: 5 * 1000 * 60, // 5 minutes
    queryKey: key,
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
