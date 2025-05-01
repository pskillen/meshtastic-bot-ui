import { useQuery } from '@tanstack/react-query';
import { useMeshBotApi } from './useApi';
import { GlobalStats, PacketStats } from '../models';
import { DateRangeIntervalParams } from '../types';

interface StatsQueryParams extends DateRangeIntervalParams {
  nodeId?: number;
}

export function usePacketStats(params?: StatsQueryParams) {
  const api = useMeshBotApi();

  return useQuery<GlobalStats | PacketStats>({
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
