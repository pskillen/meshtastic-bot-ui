import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';

export interface UseTraceroutesParams {
  managed_node?: number;
  source_node?: number;
  target_node?: number;
  status?: string;
  trigger_type?: string;
  triggered_after?: string;
  triggered_before?: string;
  page?: number;
  page_size?: number;
}

export function useTraceroutes(params?: UseTraceroutesParams) {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: ['traceroutes', params],
    queryFn: () => api.getTraceroutes(params),
  });
}

export function useTraceroute(id: number | null) {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: ['traceroutes', 'detail', id],
    queryFn: () => api.getTraceroute(id!),
    enabled: id != null,
  });
}

export function useCanTriggerTraceroute() {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: ['traceroutes', 'can-trigger'],
    queryFn: () => api.canTriggerTraceroute(),
  });
}

export function useTracerouteTriggerableNodes() {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: ['traceroutes', 'triggerable-nodes'],
    queryFn: () => api.getTracerouteTriggerableNodes(),
  });
}

export interface UseTracerouteStatsParams {
  triggeredAtAfter?: Date;
}

export function useTracerouteStats(params?: UseTracerouteStatsParams) {
  const api = useMeshtasticApi();
  const triggeredAtAfter = params?.triggeredAtAfter?.toISOString();
  return useQuery({
    queryKey: ['traceroutes', 'stats', { triggeredAtAfter }],
    queryFn: () =>
      api.getTracerouteStats({
        triggered_at_after: triggeredAtAfter,
      }),
  });
}

export function useTracerouteTriggerableNodesSuspense() {
  const api = useMeshtasticApi();
  const { data } = useSuspenseQuery({
    queryKey: ['traceroutes', 'triggerable-nodes'],
    queryFn: () => api.getTracerouteTriggerableNodes(),
  });
  return { triggerableNodes: data ?? [] };
}

export function useTriggerTraceroute() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ managedNodeId, targetNodeId }: { managedNodeId: number; targetNodeId?: number }) =>
      api.triggerTraceroute(managedNodeId, targetNodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traceroutes'] });
      queryClient.invalidateQueries({ queryKey: ['traceroutes', 'triggerable-nodes'] });
    },
  });
}
