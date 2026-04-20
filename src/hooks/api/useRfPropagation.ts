import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import type { RfProfileUpdateBody } from '@/lib/models';

export function useRfProfile(nodeId: number | null, options?: { enabled?: boolean }) {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: ['rf-profile', nodeId],
    queryFn: () => api.getRfProfile(nodeId!),
    enabled: nodeId != null && (options?.enabled ?? true),
  });
}

export function useRfPropagation(nodeId: number | null, options?: { enabled?: boolean }) {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: ['rf-propagation', nodeId],
    queryFn: () => api.getRfPropagation(nodeId!),
    enabled: nodeId != null && (options?.enabled ?? true),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d || d.status === 'none') return false;
      if (d.status === 'pending' || d.status === 'running') return 5000;
      return false;
    },
  });
}

export function useUpdateRfProfile(nodeId: number) {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RfProfileUpdateBody) => api.updateRfProfile(nodeId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['nodes', nodeId] });
      void queryClient.invalidateQueries({ queryKey: ['rf-profile', nodeId] });
    },
  });
}

export function useRecomputeRfPropagation(nodeId: number) {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.recomputeRfPropagation(nodeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rf-propagation', nodeId] });
      void queryClient.invalidateQueries({ queryKey: ['nodes', nodeId] });
    },
  });
}
