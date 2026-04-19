import { useCallback, useEffect, useMemo, useState } from 'react';
import { Map as MapboxMap, useControl, useMap } from 'react-map-gl';
import { MapboxOverlay, type MapboxOverlayProps } from '@deck.gl/mapbox';
import { PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import type { Layer, PickingInfo } from '@deck.gl/core';
import { latLngToCell } from 'h3-js';
import { concave, featureCollection, point as turfPoint } from '@turf/turf';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';

import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

import { useConfig } from '@/providers/ConfigProvider';
import { useMapboxStyle } from '@/hooks/useMapboxStyle';
import type { FeederReachFeeder, FeederReachTarget } from '@/lib/api/meshtastic-api';

export type CoverageLayerKey = 'dots' | 'hex' | 'polygon';

const DEFAULT_CENTER = { longitude: -4.2518, latitude: 55.8642, zoom: 8 };
const FEEDER_COLOR: [number, number, number, number] = [99, 102, 241, 230]; // indigo
const POLYGON_FILL: [number, number, number, number] = [99, 102, 241, 50];
const POLYGON_STROKE: [number, number, number, number] = [99, 102, 241, 200];
const LOW_CONFIDENCE_COLOR: [number, number, number, number] = [148, 163, 184, 140]; // slate
const H3_RESOLUTION = 6;

function smoothedRate(successes: number, attempts: number): number {
  return (successes + 1) / (attempts + 2);
}

/** Map a smoothed reliability (0..1) to red→amber→green. */
function reliabilityColor(rate: number, alpha = 220): [number, number, number, number] {
  const t = Math.max(0, Math.min(1, rate));
  // 0.0=red(239,68,68), 0.7=amber(245,158,11), 0.9+=green(34,197,94)
  let r: number;
  let g: number;
  let b: number;
  if (t < 0.7) {
    const k = t / 0.7;
    r = Math.round(239 + (245 - 239) * k);
    g = Math.round(68 + (158 - 68) * k);
    b = Math.round(68 + (11 - 68) * k);
  } else {
    const k = Math.min(1, (t - 0.7) / 0.2);
    r = Math.round(245 + (34 - 245) * k);
    g = Math.round(158 + (197 - 158) * k);
    b = Math.round(11 + (94 - 11) * k);
  }
  return [r, g, b, alpha];
}

/** Scale attempts to a pixel radius, clamped to [6, 30]. */
function attemptsToRadius(attempts: number): number {
  return Math.max(6, Math.min(30, 6 + Math.sqrt(attempts) * 3));
}

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

function getTargetLabel(t: FeederReachTarget): string {
  return t.short_name || t.long_name || t.node_id_str || `!${t.node_id.toString(16)}`;
}

function TargetPopupOverlay({ target, onClose }: { target: FeederReachTarget | null; onClose: () => void }) {
  const { current: mapRef } = useMap();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!target || !mapRef) {
      setPosition(null);
      return;
    }
    const map = mapRef.getMap?.();
    if (!map) return;

    const updatePosition = () => {
      try {
        const point = mapRef.project([target.lng, target.lat]);
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
  }, [mapRef, target]);

  if (!target || !position) return null;

  const rawRate = target.attempts > 0 ? target.successes / target.attempts : 0;
  const smoothed = smoothedRate(target.successes, target.attempts);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[10000]"
      style={{ position: 'absolute' }}
      data-testid="coverage-target-popup"
    >
      <div
        className="pointer-events-auto min-w-[180px] rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-lg"
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
            {target.long_name && target.short_name
              ? `${target.long_name} (${target.short_name})`
              : getTargetLabel(target)}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">{target.node_id_str || `!${target.node_id.toString(16)}`}</div>
          <div className="mt-1 text-xs">
            {target.successes} / {target.attempts} ({(rawRate * 100).toFixed(0)}% raw)
          </div>
          <div className="text-xs">Smoothed: {(smoothed * 100).toFixed(0)}%</div>
          <Link
            to={`/nodes/${target.node_id}`}
            className="mt-1 inline-block text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            Open details
          </Link>
        </div>
      </div>
    </div>
  );
}

interface HexBin {
  cell: string;
  attempts: number;
  successes: number;
  smoothed: number;
}

export interface FeederCoverageMapProps {
  feeder: FeederReachFeeder;
  targets: FeederReachTarget[];
  enabledLayers: CoverageLayerKey[];
  minAttempts: number;
}

export function FeederCoverageMap({ feeder, targets, enabledLayers, minAttempts }: FeederCoverageMapProps) {
  const config = useConfig();
  const mapboxToken = config.mapboxToken ?? (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined);
  const mapStyle = useMapboxStyle();
  const [selectedTarget, setSelectedTarget] = useState<FeederReachTarget | null>(null);

  const enabledSet = useMemo(() => new Set(enabledLayers), [enabledLayers]);

  // Layer A: per-target dots with smoothed-rate fill, attempts-scaled radius.
  const dotsLayer = useMemo(() => {
    if (!enabledSet.has('dots') || targets.length === 0) return null;
    return new ScatterplotLayer({
      id: 'feeder-coverage-dots',
      data: targets,
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: (d) =>
        d.attempts < minAttempts ? LOW_CONFIDENCE_COLOR : reliabilityColor(smoothedRate(d.successes, d.attempts)),
      getRadius: (d) => attemptsToRadius(d.attempts),
      radiusUnits: 'pixels',
      stroked: true,
      lineWidthMinPixels: 1,
      getLineColor: [15, 23, 42, 200],
      pickable: true,
    });
  }, [enabledSet, targets, minAttempts]);

  // Layer B: client-side H3 binning at res 6, smoothed rate.
  const hexBins: HexBin[] = useMemo(() => {
    const acc = new Map<string, { attempts: number; successes: number }>();
    for (const t of targets) {
      if (t.attempts < 1) continue;
      const cell = latLngToCell(t.lat, t.lng, H3_RESOLUTION);
      const existing = acc.get(cell);
      if (existing) {
        existing.attempts += t.attempts;
        existing.successes += t.successes;
      } else {
        acc.set(cell, { attempts: t.attempts, successes: t.successes });
      }
    }
    return Array.from(acc.entries()).map(([cell, agg]) => ({
      cell,
      attempts: agg.attempts,
      successes: agg.successes,
      smoothed: smoothedRate(agg.successes, agg.attempts),
    }));
  }, [targets]);

  const hexLayer = useMemo(() => {
    if (!enabledSet.has('hex') || hexBins.length === 0) return null;
    return new H3HexagonLayer({
      id: 'feeder-coverage-hex',
      data: hexBins,
      getHexagon: (d: HexBin) => d.cell,
      extruded: false,
      stroked: true,
      filled: true,
      getFillColor: (d: HexBin) =>
        d.attempts < minAttempts ? LOW_CONFIDENCE_COLOR : reliabilityColor(d.smoothed, 130),
      getLineColor: [15, 23, 42, 180],
      lineWidthMinPixels: 1,
      pickable: false,
    });
  }, [enabledSet, hexBins, minAttempts]);

  // Layer C: concave hull around successfully-reached targets.
  const polygonFeature = useMemo<Feature<Polygon | MultiPolygon> | null>(() => {
    if (!enabledSet.has('polygon')) return null;
    const successPoints = targets.filter((t) => t.successes > 0);
    if (successPoints.length < 3) return null;
    try {
      const fc = featureCollection(successPoints.map((t) => turfPoint([t.lng, t.lat])));
      const hull = concave(fc, { maxEdge: 2, units: 'kilometers' });
      return (hull as Feature<Polygon | MultiPolygon> | null) ?? null;
    } catch {
      return null;
    }
  }, [enabledSet, targets]);

  const polygonLayer = useMemo(() => {
    if (!polygonFeature) return null;
    const features = [polygonFeature];
    return new PolygonLayer({
      id: 'feeder-coverage-polygon',
      data: features,
      getPolygon: (f: Feature<Polygon | MultiPolygon>) => {
        if (f.geometry.type === 'Polygon') {
          return f.geometry.coordinates as number[][][];
        }
        // MultiPolygon: deck.gl PolygonLayer expects one polygon per feature; flatten to outer rings.
        return (f.geometry.coordinates as number[][][][]).flat() as unknown as number[][][];
      },
      getFillColor: POLYGON_FILL,
      getLineColor: POLYGON_STROKE,
      lineWidthMinPixels: 2,
      stroked: true,
      filled: true,
      pickable: false,
    });
  }, [polygonFeature]);

  // Feeder marker (always shown, on top so the user can locate the feeder).
  const feederLayer = useMemo(() => {
    if (feeder.lat == null || feeder.lng == null) return null;
    return new ScatterplotLayer({
      id: 'feeder-coverage-feeder',
      data: [feeder],
      getPosition: (d) => [d.lng as number, d.lat as number],
      getFillColor: () => FEEDER_COLOR,
      getRadius: 10,
      radiusUnits: 'pixels',
      stroked: true,
      lineWidthMinPixels: 2,
      getLineColor: [255, 255, 255, 230],
      pickable: false,
    });
  }, [feeder]);

  const layers = useMemo(
    () => [polygonLayer, hexLayer, dotsLayer, feederLayer].filter(Boolean) as Layer[],
    [polygonLayer, hexLayer, dotsLayer, feederLayer]
  );

  const handleClick = useCallback((info: PickingInfo) => {
    if (info.object && info.layer?.id === 'feeder-coverage-dots') {
      setSelectedTarget(info.object as FeederReachTarget);
    } else {
      setSelectedTarget(null);
    }
  }, []);

  const initialView = useMemo(() => {
    if (feeder.lat != null && feeder.lng != null) {
      return { longitude: feeder.lng, latitude: feeder.lat, zoom: 9 };
    }
    return DEFAULT_CENTER;
  }, [feeder.lat, feeder.lng]);

  if (!mapboxToken) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
        Mapbox token required. Set VITE_MAPBOX_TOKEN (dev) or MAPBOX_TOKEN (Docker) in your environment.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" data-testid="feeder-coverage-map-container">
      <MapboxMap
        mapboxAccessToken={mapboxToken}
        initialViewState={initialView}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay interleaved={false} layers={layers} onClick={handleClick} />
        <TargetPopupOverlay target={selectedTarget} onClose={() => setSelectedTarget(null)} />
      </MapboxMap>
    </div>
  );
}
