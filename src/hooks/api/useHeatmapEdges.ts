import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMeshtasticApi } from './useApi';

export interface HeatmapEdge {
  from_node_id: number;
  to_node_id: number;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  weight: number;
  avg_snr?: number;
}

export interface HeatmapNode {
  node_id: number;
  node_id_str: string;
  lat: number;
  lng: number;
  short_name?: string;
  long_name?: string;
}

export interface HeatmapEdgesData {
  edges: HeatmapEdge[];
  nodes: HeatmapNode[];
  meta: {
    active_nodes_count: number;
    total_trace_routes_count: number;
  };
}

export interface UseHeatmapEdgesParams {
  triggeredAtAfter?: Date;
  constellationId?: number;
  bbox?: [number, number, number, number];
  edgeMetric?: 'packets' | 'snr';
}

export function useHeatmapEdges(params?: UseHeatmapEdgesParams) {
  const api = useMeshtasticApi();
  const triggeredAtAfter = params?.triggeredAtAfter?.toISOString();

  return useQuery({
    queryKey: [
      'heatmap-edges',
      {
        triggeredAtAfter,
        constellationId: params?.constellationId,
        bbox: params?.bbox,
        edgeMetric: params?.edgeMetric,
      },
    ],
    placeholderData: keepPreviousData,
    queryFn: () =>
      api.getHeatmapEdges({
        triggered_at_after: triggeredAtAfter,
        constellation_id: params?.constellationId,
        bbox: params?.bbox,
        edge_metric: params?.edgeMetric,
      }),
  });
}
