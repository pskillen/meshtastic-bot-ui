import { useQuery, useInfiniteQuery, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import { Constellation, MessageChannel, PaginatedResponse } from '@/lib/models';

/**
 * Hook to fetch all constellations with pagination
 * @param pageSize Number of items per page
 * @param enabled Whether the query is enabled
 * @returns Query result with constellations data and loading/error states
 */
export function useConstellations(pageSize = 25, enabled = true) {
  const api = useMeshtasticApi();

  const query = useInfiniteQuery<PaginatedResponse<Constellation>, Error>({
    queryKey: ['constellations', pageSize],
    queryFn: async ({ pageParam }) => api.getConstellations({ page: pageParam as number, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
    enabled,
  });

  // Combine all pages of constellations into a single array
  const allConstellations = query.data?.pages.flatMap((page) => page.results) || [];

  return {
    constellations: allConstellations,
    totalConstellations: query.data?.pages[0]?.count || 0,
    isLoading: query.isLoading,
    isLoadingInitial: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    isLoadingAny: query.isLoading || query.isFetchingNextPage,
    hasPartialData: !query.isLoading && query.isFetchingNextPage,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
  };
}

/**
 * Suspense-enabled hook to fetch all constellations with pagination
 * Use inside a <Suspense> boundary. No isLoading or error states are returned.
 * Note: Suspense hooks do not support the 'enabled' option.
 */
export function useConstellationsSuspense(pageSize = 25) {
  const api = useMeshtasticApi();

  const query = useSuspenseInfiniteQuery<PaginatedResponse<Constellation>, Error>({
    queryKey: ['constellations', pageSize],
    queryFn: async ({ pageParam = 1 }) => api.getConstellations({ page: pageParam as number, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
  });

  // Defensive: if query.data is undefined, return empty array and 0
  if (!query.data) {
    return {
      constellations: [],
      totalConstellations: 0,
      fetchNextPage: query.fetchNextPage,
      hasNextPage: false,
    };
  }

  const allConstellations = query.data.pages.flatMap((page) => page.results);

  return {
    constellations: allConstellations,
    totalConstellations: query.data.pages[0]?.count || 0,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
  };
}

/**
 * Hook to fetch channels for a specific constellation
 * @param constellationId ID of the constellation
 * @param enabled Whether the query is enabled
 * @returns Query result with channels data and loading/error states
 */
export function useConstellationChannels(constellationId: number, enabled = true) {
  const api = useMeshtasticApi();

  return useQuery<MessageChannel[], Error>({
    queryKey: ['constellations', constellationId, 'channels'],
    queryFn: () => api.getConstellationChannels(constellationId),
    enabled: !!constellationId && enabled,
  });
}
