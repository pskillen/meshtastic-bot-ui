import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useMeshBotApi } from './useApi';
import { DeviceMetrics, NodeData, Position } from '../models';
import { DateRange } from "@/types/types.ts";


export function useNodes() {
  const api = useMeshBotApi();
  const queryClient = useQueryClient();

  const nodesQuery = useQuery({
    queryKey: ['nodes'],
    queryFn: () => api.getNodes(),
  });

  const useNode = (id: number): UseQueryResult<NodeData> => {
    return useQuery({
      queryKey: ['nodes', id],
      queryFn: () => api.getNode(id),
      enabled: !!id,
    });
  };

  const useNodeMetrics = (id: number, dateRange?: DateRange): UseQueryResult<DeviceMetrics[]> => {
    return useQuery({
      queryKey: ['nodes', id, 'metrics', dateRange?.startDate?.toISOString(), dateRange?.endDate?.toISOString()],
      queryFn: () => {
        const params: { startDate?: string; endDate?: string } = {};
        if (dateRange?.startDate) params.startDate = dateRange.startDate.toISOString();
        if (dateRange?.endDate) params.endDate = dateRange.endDate.toISOString();
        return api.getNodeDeviceMetrics(id, params);
      },
      enabled: !!id,
    });
  };

  const useNodePositions = (id: number, dateRange?: DateRange): UseQueryResult<Position[]> => {
    return useQuery({
      queryKey: ['nodes', id, 'positions', dateRange?.startDate?.toISOString(), dateRange?.endDate?.toISOString()],
      queryFn: () => {
        const params: { startDate?: string; endDate?: string } = {};
        if (dateRange?.startDate) params.startDate = dateRange.startDate.toISOString();
        if (dateRange?.endDate) params.endDate = dateRange.endDate.toISOString();
        return api.getNodePositions(id, params);
      },
      enabled: !!id,
    });
  };

  const searchNodesMutation = useMutation({
    mutationFn: (query: string) => api.searchNodes(query),
    onSuccess: (data) => {
      queryClient.setQueryData(['nodes', 'search'], data);
    },
  });

  return {
    nodes: nodesQuery.data,
    isLoading: nodesQuery.isLoading,
    error: nodesQuery.error,
    useNode,
    useNodeMetrics,
    useNodePositions,
    searchNodes: searchNodesMutation.mutate,
    searchResults: searchNodesMutation.data,
    isSearching: searchNodesMutation.isPending,
  };
}
