import { useQueries } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';
import { NodeData } from '@/lib/models';
import { DateRange } from '@/types/types';

/**
 * Hook to fetch metrics for multiple nodes in parallel
 * @param nodes Array of nodes to fetch metrics for
 * @param dateRange Optional date range to filter metrics
 * @returns Object with metricsMap and loading/error states
 */
export function useMultiNodeMetrics(nodes: NodeData[], dateRange?: DateRange) {
  const api = useMeshtasticApi();

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
