import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
  UseQueryOptions,
  useInfiniteQuery,
  InfiniteData,
} from '@tanstack/react-query';
import { useMeshBotApi } from './useApi';
import { DeviceMetrics, NodeData, Position, ManagedNode } from '../models';
import { DateRange } from '@/types/types.ts';
import { PaginatedResponse } from '../models';
import React from 'react';

export interface UseNodesOptions {
  pageSize?: number;
  enabled?: boolean;
}

export function useNodes(options?: UseNodesOptions) {
  const api = useMeshBotApi();
  const queryClient = useQueryClient();
  const pageSize = options?.pageSize || 25;

  // Query for observed nodes with automatic pagination
  const nodesQuery = useInfiniteQuery<
    PaginatedResponse<NodeData>,
    Error,
    InfiniteData<PaginatedResponse<NodeData>>,
    [string, number],
    number
  >({
    queryKey: ['nodes', pageSize],
    queryFn: async ({ pageParam = 1 }) => {
      return api.getNodes({
        page: pageParam,
        page_size: pageSize,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) return undefined;
      return allPages.length + 1;
    },
    enabled: options?.enabled !== false,
  });

  // Automatically fetch next pages if available
  React.useEffect(() => {
    if (nodesQuery.hasNextPage && !nodesQuery.isFetchingNextPage && !nodesQuery.isError) {
      nodesQuery.fetchNextPage();
    }
  }, [nodesQuery.hasNextPage, nodesQuery.isFetchingNextPage, nodesQuery.isError]);

  // Combine all pages of nodes into a single array
  const allNodes = React.useMemo(() => {
    return nodesQuery.data?.pages.flatMap((page) => page.results) || [];
  }, [nodesQuery.data?.pages]);

  // Query for managed nodes (new in Meshflow API v2)
  const managedNodesQuery = useQuery({
    queryKey: ['managed-nodes'],
    queryFn: () => api.getManagedNodes(),
    enabled: options?.enabled !== false,
  });

  const useNode = (
    id: number,
    options?: Omit<UseQueryOptions<NodeData>, 'queryKey' | 'queryFn'>
  ): UseQueryResult<NodeData> => {
    return useQuery({
      queryKey: ['nodes', id],
      queryFn: () => api.getNode(id),
      enabled: !!id,
      ...options,
    });
  };

  const useManagedNode = (
    id: number,
    options?: Omit<UseQueryOptions<ManagedNode>, 'queryKey' | 'queryFn'>
  ): UseQueryResult<ManagedNode> => {
    return useQuery({
      queryKey: ['managed-nodes', id],
      queryFn: () => api.getManagedNode(id),
      enabled: !!id,
      ...options,
    });
  };

  const useNodeMetrics = (id: number, dateRange?: DateRange): UseQueryResult<DeviceMetrics[]> => {
    return useQuery({
      queryKey: ['nodes', id, 'metrics', dateRange?.startDate?.toISOString(), dateRange?.endDate?.toISOString()],
      queryFn: () => {
        const params: { startDate?: Date; endDate?: Date } = {};
        if (dateRange?.startDate) params.startDate = dateRange.startDate;
        if (dateRange?.endDate) params.endDate = dateRange.endDate;
        return api.getNodeDeviceMetrics(id, params);
      },
      enabled: !!id,
    });
  };

  const useNodePositions = (id: number, dateRange?: DateRange): UseQueryResult<Position[]> => {
    return useQuery({
      queryKey: ['nodes', id, 'positions', dateRange?.startDate?.toISOString(), dateRange?.endDate?.toISOString()],
      queryFn: () => {
        const params: { startDate?: Date; endDate?: Date } = {};
        if (dateRange?.startDate) params.startDate = dateRange.startDate;
        if (dateRange?.endDate) params.endDate = dateRange.endDate;
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
    nodes: allNodes,
    totalNodes: nodesQuery.data?.pages[0]?.count || 0,
    isLoading: nodesQuery.isLoading,
    isLoadingInitialNodes: nodesQuery.isLoading,
    isLoadingMoreNodes: nodesQuery.isFetchingNextPage,
    isLoadingAnyNodes: nodesQuery.isLoading || nodesQuery.isFetchingNextPage,
    hasPartialData: !nodesQuery.isLoading && nodesQuery.isFetchingNextPage,
    nodesError: nodesQuery.error,
    managedNodes: managedNodesQuery.data,
    isLoadingManagedNodes: managedNodesQuery.isLoading,
    managedNodesError: managedNodesQuery.error,
    useNode,
    useManagedNode,
    useNodeMetrics,
    useNodePositions,
    searchNodes: searchNodesMutation.mutate,
    searchResults: searchNodesMutation.data,
    isSearching: searchNodesMutation.isPending,
  };
}
