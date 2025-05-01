import { useQueries } from '@tanstack/react-query';
import { useMeshBotApi } from './useApi';
import { NodeData } from '../models';
import { DateRange } from '@/types/types';

export function useMultiNodeMetrics(nodes: NodeData[], dateRange?: DateRange) {
  const api = useMeshBotApi();

  const queries = useQueries({
    queries: nodes.map((node) => ({
      queryKey: [
        'nodes',
        node.node_id,
        'metrics',
        dateRange?.startDate?.toISOString(),
        dateRange?.endDate?.toISOString(),
      ],
      queryFn: () => {
        const params: { startDate?: Date; endDate?: Date } = {};
        if (dateRange?.startDate) params.startDate = dateRange.startDate;
        if (dateRange?.endDate) params.endDate = dateRange.endDate;
        return api.getNodeDeviceMetrics(node.node_id, params);
      },
      enabled: !!node.node_id,
    })),
  });

  const isLoading = queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError);
  const errors = queries.map((query) => query.error).filter(Boolean);

  // Create a map of node ID to metrics data
  const metricsMap = Object.fromEntries(queries.map((query, index) => [nodes[index].node_id, query.data || []]));

  return {
    metricsMap,
    isLoading,
    isError,
    errors,
  };
}
