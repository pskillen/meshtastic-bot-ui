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
import type { NodeTracerouteLinkEdge, NodeTracerouteLinkNode } from '@/hooks/api/useNodeTracerouteLinks';

const DEFAULT_CENTER = { longitude: -4.2518, latitude: 55.8642, zoom: 8 };
const FOCUS_NODE_COLOR: [number, number, number, number] = [34, 197, 94, 255]; // green - focus
const PEER_NODE_COLOR: [number, number, number, number] = [134, 239, 172, 200]; // light green
const LOW_SNR_COLOR: [number, number, number, number] = [239, 68, 68, 200]; // red - bad
const HIGH_SNR_COLOR: [number, number, number, number] = [34, 197, 94, 200]; // green - good

/** Interpolate color by SNR. Higher SNR = greener, lower = redder. */
function interpolateColorBySnr(snr: number, minSnr: number, maxSnr: number): [number, number, number, number] {
  if (maxSnr <= minSnr) return LOW_SNR_COLOR;
  const t = (snr - minSnr) / (maxSnr - minSnr);
  const r = Math.round(LOW_SNR_COLOR[0] + (HIGH_SNR_COLOR[0] - LOW_SNR_COLOR[0]) * t);
  const g = Math.round(LOW_SNR_COLOR[1] + (HIGH_SNR_COLOR[1] - LOW_SNR_COLOR[1]) * t);
  const b = Math.round(LOW_SNR_COLOR[2] + (HIGH_SNR_COLOR[2] - LOW_SNR_COLOR[2]) * t);
  return [r, g, b, 200];
}

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export interface NodeTracerouteLinksMapProps {
  edges: NodeTracerouteLinkEdge[];
  nodes: NodeTracerouteLinkNode[];
  focusNodeId: number;
  showLabels?: boolean;
}

function getNodeLabel(node: NodeTracerouteLinkNode): string {
  return node.short_name || node.long_name || node.node_id_str || `!${node.node_id.toString(16)}`;
}

function NodePopupOverlay({
  node,
  edge,
  onClose,
}: {
  node: NodeTracerouteLinkNode;
  edge?: NodeTracerouteLinkEdge;
  onClose: () => void;
}) {
  const { current: mapRef } = useMap();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const map = mapRef?.getMap?.();
    if (!map || !mapRef || !node) return;

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
  }, [mapRef, node?.lng, node?.lat]);

  if (!position) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[10000]" style={{ position: 'absolute' }}>
      <div
        className="pointer-events-auto min-w-[140px] rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-lg"
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
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="pr-5">
          <div className="font-semibold">
            {node.long_name && node.short_name ? `${node.long_name} (${node.short_name})` : getNodeLabel(node)}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">{node.node_id_str || `!${node.node_id.toString(16)}`}</div>
          {edge && (
            <div className="mt-1 space-y-0.5 text-xs">
              {edge.avg_snr_in != null && (
                <div>
                  <span className="text-slate-400">SNR in:</span> {edge.avg_snr_in.toFixed(1)} dB
                </div>
              )}
              {edge.avg_snr_out != null && (
                <div>
                  <span className="text-slate-400">SNR out:</span> {edge.avg_snr_out.toFixed(1)} dB
                </div>
              )}
            </div>
          )}
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

export function NodeTracerouteLinksMap({ edges, nodes, focusNodeId, showLabels = true }: NodeTracerouteLinksMapProps) {
  const config = useConfig();
  const mapboxToken = config.mapboxToken ?? (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined);
  const mapStyle = useMapboxStyle();
  const [selectedNode, setSelectedNode] = useState<NodeTracerouteLinkNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<NodeTracerouteLinkEdge | null>(null);

  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (info.object && (info.layer?.id === 'links-nodes' || info.layer?.id === 'links-node-labels')) {
        const node = info.object as NodeTracerouteLinkNode;
        setSelectedNode(node);
        setSelectedEdge(edges.find((e) => e.to_node_id === node.node_id) ?? null);
      } else {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    },
    [edges]
  );

  const edgesWithSnr = useMemo(() => {
    return edges.map((e) => {
      const avgSnr =
        e.avg_snr_in != null && e.avg_snr_out != null
          ? (e.avg_snr_in + e.avg_snr_out) / 2
          : (e.avg_snr_in ?? e.avg_snr_out ?? -999);
      return { ...e, _avgSnr: avgSnr };
    });
  }, [edges]);

  const arcLayer = useMemo(() => {
    if (edgesWithSnr.length === 0) return null;
    const snrValues = edgesWithSnr.map((e) => e._avgSnr).filter((s) => s > -999);
    const minSnr = snrValues.length ? Math.min(...snrValues) : -20;
    const maxSnr = snrValues.length ? Math.max(...snrValues) : 10;
    return new ArcLayer({
      id: 'links-arcs',
      data: edgesWithSnr,
      getSourcePosition: (d) => [d.from_lng, d.from_lat],
      getTargetPosition: (d) => [d.to_lng, d.to_lat],
      getSourceColor: (d) => interpolateColorBySnr(d._avgSnr, minSnr, maxSnr),
      getTargetColor: (d) => interpolateColorBySnr(d._avgSnr, minSnr, maxSnr),
      getWidth: 2,
      widthMinPixels: 2,
      widthMaxPixels: 8,
      getHeight: 0,
    });
  }, [edgesWithSnr]);

  const scatterLayer = useMemo(() => {
    if (nodes.length === 0) return null;
    return new ScatterplotLayer({
      id: 'links-nodes',
      data: nodes,
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: (d) => (d.node_id === focusNodeId ? FOCUS_NODE_COLOR : PEER_NODE_COLOR),
      getRadius: (d) => (d.node_id === focusNodeId ? 150 : 100),
      radiusMinPixels: 4,
      radiusMaxPixels: 12,
      pickable: true,
    });
  }, [nodes, focusNodeId]);

  const textLayer = useMemo(() => {
    if (nodes.length === 0) return null;
    return new TextLayer({
      id: 'links-node-labels',
      data: showLabels ? nodes : [],
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
  }, [nodes, showLabels]);

  const layers = useMemo(
    () => [arcLayer, scatterLayer, textLayer].filter(Boolean) as (ArcLayer | ScatterplotLayer | TextLayer)[],
    [arcLayer, scatterLayer, textLayer]
  );

  const initialViewState = useMemo(() => {
    const lats = nodes.map((n) => n.lat).filter((v) => typeof v === 'number');
    const lngs = nodes.map((n) => n.lng).filter((v) => typeof v === 'number');
    if (lats.length > 0 && lngs.length > 0) {
      const padding = 0.02;
      const bounds: [number, number, number, number] = [
        Math.min(...lngs) - padding,
        Math.min(...lats) - padding,
        Math.max(...lngs) + padding,
        Math.max(...lats) + padding,
      ];
      return { bounds, fitBoundsOptions: { padding: 40, maxZoom: 14 } };
    }
    const focusNode = nodes.find((n) => n.node_id === focusNodeId);
    if (focusNode && focusNode.lat != null && focusNode.lng != null) {
      return { longitude: focusNode.lng, latitude: focusNode.lat, zoom: 10 };
    }
    return DEFAULT_CENTER;
  }, [nodes, focusNodeId]);

  if (!mapboxToken) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
        Mapbox token required. Set VITE_MAPBOX_TOKEN (dev) or MAPBOX_TOKEN (Docker) in your environment.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={initialViewState}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay interleaved={false} layers={layers} onClick={handleClick} />
        {selectedNode && (
          <NodePopupOverlay
            node={selectedNode}
            edge={selectedEdge ?? undefined}
            onClose={() => {
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
          />
        )}
      </Map>
    </div>
  );
}
