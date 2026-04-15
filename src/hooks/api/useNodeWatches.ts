import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';

const watchesKey = ['monitoring', 'watches'] as const;

export function useNodeWatches(pageSize = 500) {
  const api = useMeshtasticApi();
  return useQuery({
    queryKey: [...watchesKey, pageSize],
    queryFn: () => api.getNodeWatches({ page: 1, page_size: pageSize }),
  });
}

export function useCreateNodeWatchMutation() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { observed_node_id: string; offline_after?: number; enabled?: boolean }) =>
      api.createNodeWatch(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchesKey });
      queryClient.invalidateQueries({ queryKey: ['observed-nodes', 'mine'] });
    },
  });
}

export function usePatchNodeWatchMutation() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; offline_after?: number; enabled?: boolean }) =>
      api.patchNodeWatch(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchesKey });
      queryClient.invalidateQueries({ queryKey: ['observed-nodes', 'mine'] });
    },
  });
}

export function useDeleteNodeWatchMutation() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteNodeWatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchesKey });
      queryClient.invalidateQueries({ queryKey: ['observed-nodes', 'mine'] });
    },
  });
}
