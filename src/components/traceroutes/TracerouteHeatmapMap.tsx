import { useMemo, useState, useCallback } from 'react';
import { Popup } from 'react-map-gl';
import { ArcLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { HeatmapEdge, HeatmapNode } from '@/hooks/api/useHeatmapEdges';

import { DeckMapboxMap } from '@/components/map/DeckMapboxMap';

const DEFAULT_CENTER = { longitude: -4.2518, latitude: 55.8642, zoom: 8 };
/** Hide name labels when zoomed out past this level (deck.gl zoom). */
const HEATMAP_LABEL_MIN_ZOOM = 9.5;

const NODE_COLOR: [number, number, number, number] = [134, 239, 172, 200]; // light green
// Packets: quiet = blue, busy = orange
const PACKETS_QUIET_COLOR: [number, number, number, number] = [59, 130, 246, 200]; // blue
const PACKETS_BUSY_COLOR: [number, number, number, number] = [249, 115, 22, 200]; // orange
// Link quality (SNR): unhealthy = red, healthy = green
const SNR_BAD_COLOR: [number, number, number, number] = [239, 68, 68, 200]; // red
const SNR_GOOD_COLOR: [number, number, number, number] = [34, 197, 94, 200]; // green

/** Default hours without mesh observation before nodes fade (client-side styling). */
const DEFAULT_STALE_THRESHOLD_HOURS = 6;

function interpolatePacketsColor(weight: number, minW: number, maxW: number): [number, number, number, number] {
  if (maxW <= minW) return PACKETS_QUIET_COLOR;
  const t = (weight - minW) / (maxW - minW);
  const r = Math.round(PACKETS_QUIET_COLOR[0] + (PACKETS_BUSY_COLOR[0] - PACKETS_QUIET_COLOR[0]) * t);
  const g = Math.round(PACKETS_QUIET_COLOR[1] + (PACKETS_BUSY_COLOR[1] - PACKETS_QUIET_COLOR[1]) * t);
  const b = Math.round(PACKETS_QUIET_COLOR[2] + (PACKETS_BUSY_COLOR[2] - PACKETS_QUIET_COLOR[2]) * t);
  return [r, g, b, 200];
}

function interpolateSnrColor(snr: number, minS: number, maxS: number): [number, number, number, number] {
  if (maxS <= minS) return SNR_GOOD_COLOR;
  const t = (snr - minS) / (maxS - minS);
  const r = Math.round(SNR_BAD_COLOR[0] + (SNR_GOOD_COLOR[0] - SNR_BAD_COLOR[0]) * t);
  const g = Math.round(SNR_BAD_COLOR[1] + (SNR_GOOD_COLOR[1] - SNR_BAD_COLOR[1]) * t);
  const b = Math.round(SNR_BAD_COLOR[2] + (SNR_GOOD_COLOR[2] - SNR_BAD_COLOR[2]) * t);
  return [r, g, b, 200];
}

function numericExtent(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 1 };
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (max <= min) return { min, max: min + 1e-9 };
  return { min, max };
}

/** Client-side stale window (hours); fades nodes not heard within this window. */
function staleThresholdMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

function isVisuallyStale(node: HeatmapNode, nowMs: number, staleMs: number): boolean {
  if (node.role === 'offline') return true;
  if (!node.last_seen) return true;
  const t = Date.parse(node.last_seen);
  if (Number.isNaN(t)) return true;
  return nowMs - t > staleMs;
}

/** Fill alpha by age within stale window (recent → opaque). */
function recencyAlpha(node: HeatmapNode, nowMs: number, staleMs: number): number {
  if (!node.last_seen) return 95;
  const t = Date.parse(node.last_seen);
  if (Number.isNaN(t)) return 95;
  const age = nowMs - t;
  if (age >= staleMs) return 88;
  const u = age / staleMs;
  return Math.round(255 - u * (255 - 155));
}

function degreeFillColor(
  node: HeatmapNode,
  degMin: number,
  degMax: number,
  nowMs: number,
  staleMs: number
): [number, number, number, number] {
  const grey: [number, number, number] = [148, 163, 184];
  if (isVisuallyStale(node, nowMs, staleMs)) {
    return [...grey, 100];
  }
  const t = degMax > degMin ? ((node.degree ?? 0) - degMin) / (degMax - degMin) : 0.5;
  const r = Math.round(59 + (249 - 59) * t);
  const g = Math.round(130 + (115 - 130) * t);
  const b = Math.round(246 + (22 - 246) * t);
  const alpha = recencyAlpha(node, nowMs, staleMs);
  return [r, g, b, alpha];
}

function nodeRadiusMeters(centrality: number | undefined, cMin: number, cMax: number): number {
  if (centrality == null) return 380;
  if (cMax <= cMin) return 380;
  const u = (centrality - cMin) / (cMax - cMin);
  return 140 + u * 760;
}

function nodeLineWidth(node: HeatmapNode, degMin: number, degMax: number): number {
  const t = degMax > degMin ? ((node.degree ?? 0) - degMin) / (degMax - degMin) : 0;
  let w = 1 + t * 6;
  if (node.role === 'backbone') w += 2.5;
  if (node.role === 'offline') w = Math.min(w, 1);
  return w;
}

function nodeLineColor(fill: [number, number, number, number]): [number, number, number, number] {
  const [r, g, b, a] = fill;
  return [Math.round(r * 0.35), Math.round(g * 0.38), Math.round(b * 0.42), Math.min(255, a + 35)];
}

function formatRecency(iso: string | null | undefined): string {
  if (!iso) return 'No recent mesh observation';
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export interface TracerouteHeatmapMapProps {
  edges: HeatmapEdge[];
  nodes: HeatmapNode[];
  intensity?: number;
  edgeMetric?: 'packets' | 'snr';
  /** Hours without last_seen before treating as stale for styling (default 6). */
  staleThresholdHours?: number;
}

function getNodeLabel(node: HeatmapNode): string {
  return node.short_name || node.long_name || node.node_id_str || `!${node.node_id.toString(16)}`;
}

export function TracerouteHeatmapMap({
  edges,
  nodes,
  intensity = 0.7,
  edgeMetric = 'packets',
  staleThresholdHours = DEFAULT_STALE_THRESHOLD_HOURS,
}: TracerouteHeatmapMapProps) {
  const [selectedNode, setSelectedNode] = useState<HeatmapNode | null>(null);
  const [zoom, setZoom] = useState<number>(typeof DEFAULT_CENTER.zoom === 'number' ? DEFAULT_CENTER.zoom : 8);

  const staleMs = staleThresholdMs(staleThresholdHours);

  const nodeMetrics = useMemo(() => {
    const hasSignal = nodes.some((n) => n.centrality != null && n.degree != null);
    const centralities = nodes.map((n) => n.centrality).filter((c): c is number => c != null && !Number.isNaN(c));
    const degrees = nodes.map((n) => n.degree).filter((d): d is number => d != null && !Number.isNaN(d));
    const cExt = numericExtent(centralities.length ? centralities : [0, 1]);
    const dExt = numericExtent(degrees.length ? degrees : [0, 1]);
    return { cExt, dExt, hasSignal };
  }, [nodes]);

  const handleClick = useCallback((info: PickingInfo) => {
    if (info.object && (info.layer?.id === 'heatmap-nodes' || info.layer?.id === 'heatmap-node-labels')) {
      setSelectedNode(info.object as HeatmapNode);
    } else {
      setSelectedNode(null);
    }
  }, []);

  const handleViewStateChange = useCallback((params: { viewState: { zoom?: number } }) => {
    const z = params.viewState?.zoom;
    if (typeof z === 'number' && !Number.isNaN(z)) setZoom(z);
  }, []);

  const arcLayer = useMemo(() => {
    if (edges.length === 0) return null;
    const preferSnr = edgeMetric === 'snr';
    const snrValues = edges.map((e) => e.avg_snr ?? -999).filter((v) => v > -999);
    const hasSnrData = snrValues.length > 0;
    const useSnrColors = preferSnr;
    const values = hasSnrData ? snrValues : edges.map((e) => e.weight);
    const valueKey = hasSnrData ? 'avg_snr' : 'weight';
    if (values.length === 0) return null;
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const baseWidth = 1 + intensity * 4;
    return new ArcLayer({
      id: `heatmap-arcs-${edgeMetric}`,
      data: edges,
      getSourcePosition: (d) => [d.from_lng, d.from_lat],
      getTargetPosition: (d) => [d.to_lng, d.to_lat],
      getSourceColor: (d) => {
        const v = valueKey === 'avg_snr' ? (d.avg_snr ?? minVal) : d.weight;
        return useSnrColors ? interpolateSnrColor(v, minVal, maxVal) : interpolatePacketsColor(v, minVal, maxVal);
      },
      getTargetColor: (d) => {
        const v = valueKey === 'avg_snr' ? (d.avg_snr ?? minVal) : d.weight;
        return useSnrColors ? interpolateSnrColor(v, minVal, maxVal) : interpolatePacketsColor(v, minVal, maxVal);
      },
      getWidth: (d) => {
        const v = valueKey === 'avg_snr' ? (d.avg_snr ?? minVal) : d.weight;
        return baseWidth * (0.5 + (v - minVal) / Math.max(maxVal - minVal, 0.001));
      },
      widthMinPixels: 1,
      widthMaxPixels: 20,
      getHeight: 0,
    });
  }, [edges, intensity, edgeMetric]);

  const scatterLayer = useMemo(() => {
    if (nodes.length === 0) return null;
    const nowMs = Date.now();
    const { cExt, dExt, hasSignal } = nodeMetrics;

    return new ScatterplotLayer({
      id: 'heatmap-nodes',
      data: nodes,
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: (d) => (hasSignal ? degreeFillColor(d, dExt.min, dExt.max, nowMs, staleMs) : NODE_COLOR),
      getRadius: (d) => (hasSignal ? nodeRadiusMeters(d.centrality, cExt.min, cExt.max) : 380),
      radiusMinPixels: 4,
      radiusMaxPixels: 22,
      stroked: true,
      lineWidthUnits: 'pixels',
      getLineWidth: (d) => (hasSignal ? nodeLineWidth(d, dExt.min, dExt.max) : 1),
      lineWidthMinPixels: 0.5,
      lineWidthMaxPixels: 8,
      getLineColor: (d) =>
        hasSignal ? nodeLineColor(degreeFillColor(d, dExt.min, dExt.max, nowMs, staleMs)) : [30, 60, 40, 180],
      pickable: true,
      updateTriggers: {
        getFillColor: [nowMs, staleMs, hasSignal, dExt.min, dExt.max, cExt.min, cExt.max],
        getRadius: [hasSignal, cExt.min, cExt.max],
        getLineWidth: [hasSignal, dExt.min, dExt.max],
        getLineColor: [nowMs, staleMs, hasSignal, dExt.min, dExt.max],
      },
    });
  }, [nodes, nodeMetrics, staleMs]);

  const textLayer = useMemo(() => {
    if (nodes.length === 0 || zoom < HEATMAP_LABEL_MIN_ZOOM) return null;
    return new TextLayer({
      id: 'heatmap-node-labels',
      data: nodes,
      getPosition: (d) => [d.lng, d.lat],
      getText: getNodeLabel,
      getSize: 11,
      sizeMinPixels: 9,
      sizeMaxPixels: 12,
      getColor: [220, 220, 220, 230],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      background: true,
      getBackgroundColor: [25, 25, 35, 200],
      backgroundPadding: [6, 3],
      backgroundBorderRadius: 2,
      pickable: true,
    });
  }, [nodes, zoom]);

  const layers = useMemo(
    () => [arcLayer, scatterLayer, textLayer].filter(Boolean) as (ArcLayer | ScatterplotLayer | TextLayer)[],
    [arcLayer, scatterLayer, textLayer]
  );

  return (
    <DeckMapboxMap
      layers={layers}
      initialViewState={DEFAULT_CENTER}
      onClick={handleClick}
      onViewStateChange={handleViewStateChange}
      data-testid="heatmap-map-container"
    >
      {selectedNode && (
        <Popup
          longitude={selectedNode.lng}
          latitude={selectedNode.lat}
          anchor="bottom"
          closeButton={false}
          closeOnClick={false}
          onClose={() => setSelectedNode(null)}
          maxWidth="320px"
          className="meshflow-map-popup"
        >
          <div className="relative min-w-[120px] rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-lg">
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="absolute right-1 top-1 rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
            <div className="pr-5">
              <div className="font-semibold">
                {selectedNode.long_name && selectedNode.short_name
                  ? `${selectedNode.long_name} (${selectedNode.short_name})`
                  : getNodeLabel(selectedNode)}
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                {selectedNode.node_id_str || `!${selectedNode.node_id.toString(16)}`}
              </div>
              {(selectedNode.centrality != null || selectedNode.degree != null) && (
                <dl className="mt-2 space-y-0.5 text-xs text-slate-300">
                  {selectedNode.centrality != null && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Centrality</dt>
                      <dd>{(selectedNode.centrality * 100).toFixed(1)}%</dd>
                    </div>
                  )}
                  {selectedNode.degree != null && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Degree</dt>
                      <dd>{selectedNode.degree}</dd>
                    </div>
                  )}
                  {selectedNode.role && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Role</dt>
                      <dd className="capitalize">{selectedNode.role}</dd>
                    </div>
                  )}
                </dl>
              )}
              <div className="mt-1.5 text-xs text-slate-400">
                Last seen: <span className="text-slate-300">{formatRecency(selectedNode.last_seen)}</span>
              </div>
              <Link
                to={`/nodes/${selectedNode.node_id}`}
                className="mt-1 inline-block text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                Open details
              </Link>
            </div>
          </div>
        </Popup>
      )}
    </DeckMapboxMap>
  );
}
