import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
  UseQueryOptions,
  useInfiniteQuery,
  InfiniteData,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import { DeviceMetrics, ObservedNode, Position, ManagedNode, OwnedManagedNode } from '@/lib/models';
import { DateRangeParams } from '@/lib/types';
import { PaginatedResponse } from '@/lib/models';
import React from 'react';
import { getKeyValue, roundDateParams } from './hooks-utils';

export interface UseNodesOptions {
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch and manage nodes data
 */
export function useNodes(options?: UseNodesOptions) {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  const pageSize = options?.pageSize || 25;

  // Query for observed nodes with automatic pagination
  const nodesQuery = useInfiniteQuery<
    PaginatedResponse<ObservedNode>,
    Error,
    InfiniteData<PaginatedResponse<ObservedNode>>,
    [string, number],
    number
  >({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: ['nodes', 0],
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

  // Query for managed nodes with pagination
  const managedNodesQuery = useInfiniteQuery<PaginatedResponse<ManagedNode>, Error>({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: ['managed-nodes', 0],
    queryFn: async ({ pageParam = 1 }) => api.getManagedNodes({ page: pageParam as number, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
    enabled: options?.enabled !== false,
  });

  const allManagedNodes = React.useMemo(
    () => managedNodesQuery.data?.pages.flatMap((page) => page.results) || [],
    [managedNodesQuery.data?.pages]
  );

  // Query for user's managed nodes with pagination
  const myManagedNodesQuery = useInfiniteQuery<PaginatedResponse<OwnedManagedNode>, Error>({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: ['managed-nodes', 'mine', pageSize],
    queryFn: async ({ pageParam = 1 }) => api.getMyManagedNodes({ page: pageParam as number, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
    enabled: options?.enabled !== false,
  });

  const allMyManagedNodes = React.useMemo(
    () => myManagedNodesQuery.data?.pages.flatMap((page) => page.results) || [],
    [myManagedNodesQuery.data?.pages]
  );

  // Query for user's claimed nodes with pagination
  const myClaimedNodesQuery = useInfiniteQuery<PaginatedResponse<ObservedNode>, Error>({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: ['observed-nodes', 'mine', 0],
    queryFn: async ({ pageParam = 1 }) => api.getMyClaimedNodes({ page: pageParam as number, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
    enabled: options?.enabled !== false,
  });

  const allMyClaimedNodes = React.useMemo(
    () => myClaimedNodesQuery.data?.pages.flatMap((page) => page.results) || [],
    [myClaimedNodesQuery.data?.pages]
  );

  // Mutation for searching nodes
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
    managedNodes: allManagedNodes,
    totalManagedNodes: managedNodesQuery.data?.pages[0]?.count || 0,
    isLoadingManagedNodes: managedNodesQuery.isLoading,
    isLoadingMoreManagedNodes: managedNodesQuery.isFetchingNextPage,
    hasNextPageManagedNodes: managedNodesQuery.hasNextPage,
    fetchNextPageManagedNodes: managedNodesQuery.fetchNextPage,
    managedNodesError: managedNodesQuery.error,
    myManagedNodes: allMyManagedNodes,
    totalMyManagedNodes: myManagedNodesQuery.data?.pages[0]?.count || 0,
    isLoadingMyManagedNodes: myManagedNodesQuery.isLoading,
    isLoadingMoreMyManagedNodes: myManagedNodesQuery.isFetchingNextPage,
    hasNextPageMyManagedNodes: myManagedNodesQuery.hasNextPage,
    fetchNextPageMyManagedNodes: myManagedNodesQuery.fetchNextPage,
    myManagedNodesError: myManagedNodesQuery.error,
    myClaimedNodes: allMyClaimedNodes,
    totalMyClaimedNodes: myClaimedNodesQuery.data?.pages[0]?.count || 0,
    isLoadingMyClaimedNodes: myClaimedNodesQuery.isLoading,
    isLoadingMoreMyClaimedNodes: myClaimedNodesQuery.isFetchingNextPage,
    hasNextPageMyClaimedNodes: myClaimedNodesQuery.hasNextPage,
    fetchNextPageMyClaimedNodes: myClaimedNodesQuery.fetchNextPage,
    myClaimedNodesError: myClaimedNodesQuery.error,
    searchNodes: searchNodesMutation.mutate,
    searchResults: searchNodesMutation.data,
    isSearching: searchNodesMutation.isPending,
  };
}

/**
 * Hook to fetch a single node by ID
 */
export function useNode(
  id: number,
  options?: Omit<UseQueryOptions<ObservedNode>, 'queryKey' | 'queryFn'>
): UseQueryResult<ObservedNode> {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: ['nodes', id],
    queryFn: () => api.getNode(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch a single managed node by ID
 */
export function useManagedNode(
  id: number,
  options?: Omit<UseQueryOptions<ManagedNode>, 'queryKey' | 'queryFn'>
): UseQueryResult<ManagedNode> {
  const api = useMeshtasticApi();
  return useQuery({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: ['managed-nodes', id],
    queryFn: () => api.getManagedNode(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to fetch device metrics for a node
 */
export function useNodeMetrics(id: number, params?: DateRangeParams): UseQueryResult<DeviceMetrics[]> {
  const api = useMeshtasticApi();
  params = roundDateParams(params);
  const keyValue = getKeyValue(params);
  const key = ['nodes', id, 'metrics', keyValue];

  return useQuery({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: key,
    queryFn: () => api.getNodeDeviceMetrics(id, params),
    enabled: !!id,
  });
}

/**
 * Hook to fetch positions for a node
 */
export function useNodePositions(id: number, params?: DateRangeParams): UseQueryResult<Position[]> {
  const api = useMeshtasticApi();
  params = roundDateParams(params);
  const keyValue = getKeyValue(params);
  const key = ['nodes', id, 'positions', keyValue];

  return useQuery({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: key,
    queryFn: () => api.getNodePositions(id, params),
    enabled: !!id,
  });
}

/**
 * Hook to search for nodes
 */
export function useNodeSearch() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();

  const searchMutation = useMutation({
    mutationFn: (query: string) => api.searchNodes(query),
    onSuccess: (data) => {
      queryClient.setQueryData(['nodes', 'search'], data);
    },
  });

  return {
    searchNodes: searchMutation.mutate,
    results: searchMutation.data,
    isSearching: searchMutation.isPending,
    error: searchMutation.error,
  };
}

/**
 * Suspense-enabled hook to fetch and manage observed nodes data
 * Use inside a <Suspense> boundary. No isLoading or error states are returned.
 * Note: Suspense hooks do not support the 'enabled' option.
 */
export function useNodesSuspense(options?: UseNodesOptions) {
  const api = useMeshtasticApi();
  const pageSize = options?.pageSize || 25;

  const nodesQuery = useSuspenseInfiniteQuery<PaginatedResponse<ObservedNode>, Error>({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: ['nodes', pageSize],
    queryFn: async ({ pageParam = 1 }) => api.getNodes({ page: pageParam as number, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
  });

  if (!nodesQuery.data) {
    return {
      nodes: [],
      totalNodes: 0,
      fetchNextPage: nodesQuery.fetchNextPage,
      hasNextPage: false,
    };
  }

  const allNodes = nodesQuery.data.pages.flatMap((page) => page.results);

  return {
    nodes: allNodes,
    totalNodes: nodesQuery.data.pages[0]?.count || 0,
    fetchNextPage: nodesQuery.fetchNextPage,
    hasNextPage: nodesQuery.hasNextPage,
  };
}

/**
 * Suspense-enabled hook to fetch managed nodes with pagination
 */
export function useManagedNodesSuspense(pageSize = 25) {
  const api = useMeshtasticApi();
  const managedNodesQuery = useSuspenseInfiniteQuery<PaginatedResponse<ManagedNode>, Error>({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: ['managed-nodes', pageSize],
    queryFn: async ({ pageParam = 1 }) => api.getManagedNodes({ page: pageParam as number, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
  });
  if (!managedNodesQuery.data) {
    return {
      managedNodes: [],
      totalManagedNodes: 0,
      fetchNextPage: managedNodesQuery.fetchNextPage,
      hasNextPage: false,
    };
  }
  const allManagedNodes = managedNodesQuery.data.pages.flatMap((page) => page.results);
  return {
    managedNodes: allManagedNodes,
    totalManagedNodes: managedNodesQuery.data.pages[0]?.count || 0,
    fetchNextPage: managedNodesQuery.fetchNextPage,
    hasNextPage: managedNodesQuery.hasNextPage,
  };
}

/**
 * Suspense-enabled hook to fetch user's managed nodes with pagination
 */
export function useMyManagedNodesSuspense(pageSize = 25) {
  const api = useMeshtasticApi();
  const myManagedNodesQuery = useSuspenseInfiniteQuery<PaginatedResponse<OwnedManagedNode>, Error>({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: ['managed-nodes', 'mine', pageSize],
    queryFn: async ({ pageParam = 1 }) => api.getMyManagedNodes({ page: pageParam as number, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
  });
  if (!myManagedNodesQuery.data) {
    return {
      myManagedNodes: [],
      totalMyManagedNodes: 0,
      fetchNextPage: myManagedNodesQuery.fetchNextPage,
      hasNextPage: false,
    };
  }
  const allMyManagedNodes = myManagedNodesQuery.data.pages.flatMap((page) => page.results);
  return {
    myManagedNodes: allMyManagedNodes,
    totalMyManagedNodes: myManagedNodesQuery.data.pages[0]?.count || 0,
    fetchNextPage: myManagedNodesQuery.fetchNextPage,
    hasNextPage: myManagedNodesQuery.hasNextPage,
  };
}

/**
 * Suspense-enabled hook to fetch user's claimed nodes with pagination
 */
export function useMyClaimedNodesSuspense(pageSize = 25) {
  const api = useMeshtasticApi();
  const myClaimedNodesQuery = useSuspenseInfiniteQuery<PaginatedResponse<ObservedNode>, Error>({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: ['observed-nodes', 'mine', pageSize],
    queryFn: async ({ pageParam = 1 }) => api.getMyClaimedNodes({ page: pageParam as number, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
  });
  if (!myClaimedNodesQuery.data) {
    return {
      myClaimedNodes: [],
      totalMyClaimedNodes: 0,
      fetchNextPage: myClaimedNodesQuery.fetchNextPage,
      hasNextPage: false,
    };
  }
  const allMyClaimedNodes = myClaimedNodesQuery.data.pages.flatMap((page) => page.results);
  return {
    myClaimedNodes: allMyClaimedNodes,
    totalMyClaimedNodes: myClaimedNodesQuery.data.pages[0]?.count || 0,
    fetchNextPage: myClaimedNodesQuery.fetchNextPage,
    hasNextPage: myClaimedNodesQuery.hasNextPage,
  };
}

/**
 * Suspense-enabled hook to fetch device metrics for a node
 * Use inside a <Suspense> boundary. No isLoading or error states are returned.
 */
export function useNodeMetricsSuspense(id: number, params?: DateRangeParams) {
  const api = useMeshtasticApi();
  params = roundDateParams(params);
  const keyValue = getKeyValue(params);
  const key = ['nodes', id, 'metrics', keyValue];

  const query = useSuspenseQuery<DeviceMetrics[], Error>({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: key,
    queryFn: () => api.getNodeDeviceMetrics(id, params),
  });
  return { metrics: query.data };
}

/**
 * Suspense-enabled hook to fetch a single node by ID
 * Use inside a <Suspense> boundary. No isLoading or error states are returned.
 */
export function useNodeSuspense(id: number) {
  const api = useMeshtasticApi();
  const query = useSuspenseQuery<ObservedNode, Error>({
    refetchInterval: 1000 * 60, // 1 minute
    queryKey: ['nodes', id],
    queryFn: () => api.getNode(id),
  });
  return query.data;
}
