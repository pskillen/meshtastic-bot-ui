import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import type { NodeWatch, PaginatedResponse } from '@/lib/models';

const watchesKey = ['monitoring', 'watches'] as const;

function mergeWatchIntoWatchesCache(
  old: PaginatedResponse<NodeWatch> | undefined,
  watch: NodeWatch
): PaginatedResponse<NodeWatch> | undefined {
  if (!old) return old;
  const idx = old.results.findIndex((w) => w.id === watch.id);
  if (idx >= 0) {
    const next = [...old.results];
    next[idx] = watch;
    return { ...old, results: next };
  }
  return {
    ...old,
    count: old.count + 1,
    results: [...old.results, watch],
  };
}

function removeWatchFromWatchesCache(
  old: PaginatedResponse<NodeWatch> | undefined,
  id: number
): PaginatedResponse<NodeWatch> | undefined {
  if (!old) return old;
  const filtered = old.results.filter((w) => w.id !== id);
  if (filtered.length === old.results.length) return old;
  return {
    ...old,
    count: Math.max(0, old.count - 1),
    results: filtered,
  };
}

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
    onSuccess: (newWatch) => {
      queryClient.setQueriesData<PaginatedResponse<NodeWatch>>({ queryKey: watchesKey }, (old) =>
        mergeWatchIntoWatchesCache(old, newWatch)
      );
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
    onSuccess: (updated) => {
      queryClient.setQueriesData<PaginatedResponse<NodeWatch>>({ queryKey: watchesKey }, (old) =>
        mergeWatchIntoWatchesCache(old, updated)
      );
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
    onSuccess: (_, id) => {
      queryClient.setQueriesData<PaginatedResponse<NodeWatch>>({ queryKey: watchesKey }, (old) =>
        removeWatchFromWatchesCache(old, id)
      );
      queryClient.invalidateQueries({ queryKey: watchesKey });
      queryClient.invalidateQueries({ queryKey: ['observed-nodes', 'mine'] });
    },
  });
}
