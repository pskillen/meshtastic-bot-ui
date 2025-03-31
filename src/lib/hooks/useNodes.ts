import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';

export function useNodes() {
  const api = useApi();
  const queryClient = useQueryClient();

  const nodesQuery = useQuery({
    queryKey: ['nodes'],
    queryFn: () => api.getNodes(),
  });

  const nodeQuery = (id: number) => {
    return useQuery({
      queryKey: ['nodes', id],
      queryFn: () => api.getNode(id),
      enabled: !!id,
    });
  };

  const nodeMetricsQuery = (id: number) => {
    return useQuery({
      queryKey: ['nodes', id, 'metrics'],
      queryFn: () => api.getNodeDeviceMetrics(id),
      enabled: !!id,
    });
  };

  const nodePositionsQuery = (id: number) => {
    return useQuery({
      queryKey: ['nodes', id, 'positions'],
      queryFn: () => api.getNodePositions(id),
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
    getNode: nodeQuery,
    getNodeMetrics: nodeMetricsQuery,
    getNodePositions: nodePositionsQuery,
    searchNodes: searchNodesMutation.mutate,
    searchResults: searchNodesMutation.data,
    isSearching: searchNodesMutation.isPending,
  };
} 