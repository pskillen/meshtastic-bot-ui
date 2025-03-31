import { useQuery } from '@tanstack/react-query';
import { useMeshBotApi } from './useApi';
import { PacketStatsParams, PacketStatsResponse } from '../models';

export function usePacketStats(params?: PacketStatsParams) {
  const api = useMeshBotApi();

  return useQuery<PacketStatsResponse>({
    queryKey: ['packet-stats', params],
    queryFn: () => api.getPacketStats(params),
  });
} 