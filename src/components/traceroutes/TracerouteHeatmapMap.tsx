import { useMemo, useState, useCallback, useEffect } from 'react';
import { Map, useControl, useMap } from 'react-map-gl';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { ArcLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Link } from 'react-router-dom';
import { useConfig } from '@/providers/ConfigProvider';
import { useMapboxStyle } from '@/hooks/useMapboxStyle';
import { X } from 'lucide-react';
import type { HeatmapEdge, HeatmapNode } from '@/hooks/api/useHeatmapEdges';

const DEFAULT_CENTER = { longitude: -4.2518, latitude: 55.8642, zoom: 8 };
const NODE_COLOR: [number, number, number, number] = [134, 239, 172, 200]; // light green
// Packets: quiet = blue, busy = orange
const PACKETS_QUIET_COLOR: [number, number, number, number] = [59, 130, 246, 200]; // blue
const PACKETS_BUSY_COLOR: [number, number, number, number] = [249, 115, 22, 200]; // orange
// Link quality (SNR): unhealthy = red, healthy = green
const SNR_BAD_COLOR: [number, number, number, number] = [239, 68, 68, 200]; // red
const SNR_GOOD_COLOR: [number, number, number, number] = [34, 197, 94, 200]; // green

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

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export interface TracerouteHeatmapMapProps {
  edges: HeatmapEdge[];
  nodes: HeatmapNode[];
  intensity?: number;
  edgeMetric?: 'packets' | 'snr';
}

function getNodeLabel(node: HeatmapNode): string {
  return node.short_name || node.long_name || node.node_id_str || `!${node.node_id.toString(16)}`;
}

/** Custom popup overlay - avoids Mapbox Popup which can interfere with deck.gl layers */
function NodePopupOverlay({ node, onClose }: { node: HeatmapNode | null; onClose: () => void }) {
  const { current: mapRef } = useMap();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!node || !mapRef) {
      setPosition(null);
      return;
    }
    const map = mapRef.getMap?.();
    if (!map) return;

    const updatePosition = () => {
      try {
        const point = mapRef.project([node.lng, node.lat]);
        setPosition({ x: point.x, y: point.y });
      } catch {
        setPosition(null);
      }
    };

    updatePosition();
    map.on('move', updatePosition);
    map.on('zoom', updatePosition);
    return () => {
      map.off('move', updatePosition);
      map.off('zoom', updatePosition);
    };
  }, [mapRef, node?.lng, node?.lat, node]);

  if (!node || !position) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[10000]"
      style={{ position: 'absolute' }}
      data-testid="node-popup"
    >
      <div
        className="pointer-events-auto min-w-[120px] rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-lg"
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -100%)',
          marginTop: -8,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-1 top-1 rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
        <div className="pr-5">
          <div className="font-semibold">
            {node.long_name && node.short_name ? `${node.long_name} (${node.short_name})` : getNodeLabel(node)}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">{node.node_id_str || `!${node.node_id.toString(16)}`}</div>
          <Link
            to={`/nodes/${node.node_id}`}
            className="mt-1 inline-block text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            Open details
          </Link>
        </div>
      </div>
    </div>
  );
}

export function TracerouteHeatmapMap({
  edges,
  nodes,
  intensity = 0.7,
  edgeMetric = 'packets',
}: TracerouteHeatmapMapProps) {
  const config = useConfig();
  const mapboxToken = config.mapboxToken ?? (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined);
  const mapStyle = useMapboxStyle();
  const [selectedNode, setSelectedNode] = useState<HeatmapNode | null>(null);

  const handleClick = useCallback((info: PickingInfo) => {
    if (info.object && (info.layer?.id === 'heatmap-nodes' || info.layer?.id === 'heatmap-node-labels')) {
      setSelectedNode(info.object as HeatmapNode);
    } else {
      setSelectedNode(null);
    }
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
    return new ScatterplotLayer({
      id: 'heatmap-nodes',
      data: nodes,
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: () => NODE_COLOR,
      getRadius: 100,
      radiusMinPixels: 3,
      radiusMaxPixels: 8,
      pickable: true,
    });
  }, [nodes]);

  const textLayer = useMemo(() => {
    if (nodes.length === 0) return null;
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
  }, [nodes]);

  const layers = useMemo(
    () => [arcLayer, scatterLayer, textLayer].filter(Boolean) as (ArcLayer | ScatterplotLayer | TextLayer)[],
    [arcLayer, scatterLayer, textLayer]
  );

  if (!mapboxToken) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
        Mapbox token required. Set VITE_MAPBOX_TOKEN (dev) or MAPBOX_TOKEN (Docker) in your environment.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" data-testid="heatmap-map-container">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={DEFAULT_CENTER}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay interleaved={false} layers={layers} onClick={handleClick} />
        <NodePopupOverlay node={selectedNode} onClose={() => setSelectedNode(null)} />
      </Map>
    </div>
  );
}
