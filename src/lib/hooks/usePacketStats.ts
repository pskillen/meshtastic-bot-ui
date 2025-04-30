import { useQuery } from '@tanstack/react-query';
import { useMeshBotApi } from './useApi';
import { PacketStatsParams, GlobalStats } from '../models';

export function usePacketStats(params?: PacketStatsParams) {
  const api = useMeshBotApi();

  return useQuery<GlobalStats>({
    queryKey: ['global-stats', params],
    queryFn: async () => {
      const { startDate, endDate } = params || {};
      const queryParams = new URLSearchParams();

      if (startDate) {
        queryParams.append('start_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        queryParams.append('end_date', endDate.toISOString().split('T')[0]);
      }

      // Default to hourly intervals
      queryParams.append('interval_type', 'hour');
      queryParams.append('interval', '1');

      return await api.getGlobalStats(queryParams.toString());
    },
  });
}
