import { useQuery } from '@tanstack/react-query';
import { useMeshBotApi } from './useApi';
import { PacketStatsParams, PacketStatsResponse } from '../models';

export function usePacketStats(params?: PacketStatsParams) {
  const api = useMeshBotApi();

  // Note: The endpoint for packet stats might need to be updated in the API client
  // based on the actual implementation of the Meshflow API v2
  return useQuery<PacketStatsResponse>({
    queryKey: ['packet-stats', params],
    queryFn: () => api.getPacketStats(params),
  });
}
