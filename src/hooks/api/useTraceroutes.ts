import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useCanTriggerTraceroute() {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: ['traceroutes', 'can-trigger'],
    queryFn: () => api.canTriggerTraceroute(),
  });
}

export function useTriggerTraceroute() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ managedNodeId, targetNodeId }: { managedNodeId: number; targetNodeId?: number }) =>
      api.triggerTraceroute(managedNodeId, targetNodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traceroutes'] });
    },
  });
}
