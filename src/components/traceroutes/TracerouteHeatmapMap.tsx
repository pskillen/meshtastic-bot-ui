import { useMemo } from 'react';
import { Map, useControl } from 'react-map-gl';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { ArcLayer, ScatterplotLayer } from '@deck.gl/layers';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { HeatmapEdge, HeatmapNode } from '@/hooks/api/useHeatmapEdges';

const DEFAULT_CENTER = { longitude: -4.2518, latitude: 55.8642, zoom: 8 };
const NODE_COLOR: [number, number, number, number] = [134, 239, 172, 200]; // light green
const LOW_COLOR: [number, number, number, number] = [59, 130, 246, 200]; // blue
const HIGH_COLOR: [number, number, number, number] = [239, 68, 68, 200]; // red

function interpolateColor(weight: number, minW: number, maxW: number): [number, number, number, number] {
  if (maxW <= minW) return LOW_COLOR;
  const t = (weight - minW) / (maxW - minW);
  const r = Math.round(LOW_COLOR[0] + (HIGH_COLOR[0] - LOW_COLOR[0]) * t);
  const g = Math.round(LOW_COLOR[1] + (HIGH_COLOR[1] - LOW_COLOR[1]) * t);
  const b = Math.round(LOW_COLOR[2] + (HIGH_COLOR[2] - LOW_COLOR[2]) * t);
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
}

export function TracerouteHeatmapMap({ edges, nodes, intensity = 0.7 }: TracerouteHeatmapMapProps) {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const layers = useMemo(() => {
    const result: (ArcLayer | ScatterplotLayer)[] = [];

    const minWeight = edges.length ? Math.min(...edges.map((e) => e.weight)) : 0;
    const maxWeight = edges.length ? Math.max(...edges.map((e) => e.weight)) : 1;
    const baseWidth = 1 + intensity * 4;

    if (edges.length > 0) {
      result.push(
        new ArcLayer({
          id: 'heatmap-arcs',
          data: edges,
          getSourcePosition: (d) => [d.from_lng, d.from_lat],
          getTargetPosition: (d) => [d.to_lng, d.to_lat],
          getSourceColor: (d) => interpolateColor(d.weight, minWeight, maxWeight),
          getTargetColor: (d) => interpolateColor(d.weight, minWeight, maxWeight),
          getWidth: (d) => baseWidth * (0.5 + (d.weight - minWeight) / Math.max(maxWeight - minWeight, 1)),
          widthMinPixels: 1,
          widthMaxPixels: 20,
          getHeight: 0.75, // 3D arch
        })
      );
    }

    if (nodes.length > 0) {
      result.push(
        new ScatterplotLayer({
          id: 'heatmap-nodes',
          data: nodes,
          getPosition: (d) => [d.lng, d.lat],
          getFillColor: () => NODE_COLOR,
          getRadius: 100,
          radiusMinPixels: 3,
          radiusMaxPixels: 8,
        })
      );
    }

    return result;
  }, [edges, nodes, intensity]);

  if (!mapboxToken) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
        Mapbox token required. Set VITE_MAPBOX_TOKEN in your environment.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={DEFAULT_CENTER}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay interleaved={false} layers={layers} />
      </Map>
    </div>
  );
}
