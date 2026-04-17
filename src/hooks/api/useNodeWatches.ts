import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import type { MonitoringOfflineAfterResponse, NodeWatch, PaginatedResponse } from '@/lib/models';

const watchesKey = ['monitoring', 'watches'] as const;

export const monitoringOfflineAfterQueryKey = (observedNodeId: string) =>
  ['monitoring', 'offline-after', observedNodeId] as const;

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

export function useMonitoringOfflineAfter(observedNodeId: string | undefined, enabled = true) {
  const api = useMeshtasticApi();
  return useQuery<MonitoringOfflineAfterResponse>({
    queryKey: monitoringOfflineAfterQueryKey(observedNodeId ?? ''),
    queryFn: () => api.getMonitoringOfflineAfter(observedNodeId!),
    enabled: Boolean(enabled && observedNodeId),
  });
}

export function usePatchMonitoringOfflineAfterMutation() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      observedNodeId,
      offline_after,
    }: {
      observedNodeId: string;
      offline_after: number;
      /** When set, invalidates single-node detail cache after threshold change. */
      nodeId?: number;
    }) => api.patchMonitoringOfflineAfter(observedNodeId, { offline_after }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(monitoringOfflineAfterQueryKey(variables.observedNodeId), data);
      queryClient.invalidateQueries({ queryKey: watchesKey });
      if (variables.nodeId != null) {
        queryClient.invalidateQueries({ queryKey: ['nodes', variables.nodeId] });
      }
    },
  });
}

export function useCreateNodeWatchMutation() {
  const api = useMeshtasticApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { observed_node_id: string; enabled?: boolean }) => api.createNodeWatch(body),
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
    mutationFn: ({ id, ...body }: { id: number; enabled?: boolean }) => api.patchNodeWatch(id, body),
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
