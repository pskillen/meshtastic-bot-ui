import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import type { DxEventsQueryParams } from '@/lib/types';

export const dxEventsQueryKey = (params: DxEventsQueryParams) => ['dx', 'events', params] as const;

export const dxEventDetailQueryKey = (id: string | null) => ['dx', 'event', id ?? ''] as const;

const DX_POLL_MS = 60_000;
const DX_STALE_MS = 30_000;

export function useDxEvents(params: DxEventsQueryParams, enabled: boolean) {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: dxEventsQueryKey(params),
    queryFn: () => api.getDxEvents(params),
    enabled,
    refetchInterval: DX_POLL_MS,
    staleTime: DX_STALE_MS,
  });
}

export function useDxEventDetail(id: string | null, enabled: boolean) {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: dxEventDetailQueryKey(id),
    queryFn: () => api.getDxEvent(id!),
    enabled: Boolean(enabled && id),
    refetchInterval: DX_POLL_MS,
    staleTime: DX_STALE_MS,
  });
}

export function useDxActiveEventCount(enabled: boolean) {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: ['dx', 'stats', 'active_now'] as const,
    queryFn: () => api.getDxEvents({ active_now: true, page_size: 1, page: 1 }),
    enabled,
    select: (d) => d.count,
    refetchInterval: DX_POLL_MS,
    staleTime: DX_STALE_MS,
  });
}

export function useDxRecentEventCount(enabled: boolean, recentDays = 7) {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: ['dx', 'stats', 'recent', recentDays] as const,
    queryFn: () =>
      api.getDxEvents({
        recent_only: true,
        recent_days: recentDays,
        page_size: 1,
        page: 1,
      }),
    enabled,
    select: (d) => d.count,
    refetchInterval: DX_POLL_MS,
    staleTime: DX_STALE_MS,
  });
}

export function useDxNodeExclusionMutation() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { node_id: number; exclude_from_detection: boolean; exclude_notes?: string }) =>
      api.postDxNodeExclusion(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dx'] });
    },
  });
}
