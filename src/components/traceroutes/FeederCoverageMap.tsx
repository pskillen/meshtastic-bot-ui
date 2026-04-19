import { useCallback, useEffect, useMemo, useState } from 'react';

import type { PickingInfo } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X } from 'lucide-react';
import { Map, useControl, useMap } from 'react-map-gl';
import { Link } from 'react-router-dom';

import type { FeederRange, FeederRangeMetric, FeederRangeMode } from '@/hooks/api/useFeederRanges';
import { useMapboxStyle } from '@/hooks/useMapboxStyle';
import { useConfig } from '@/providers/ConfigProvider';

const DEFAULT_CENTER = { longitude: -4.2518, latitude: 55.8642, zoom: 8 };
// Neutral teal — to be replaced with the constellation palette when #157 lands.
const TEAL: [number, number, number] = [20, 184, 166];
const FEEDER_DOT: [number, number, number, number] = [134, 239, 172, 230];

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export interface FeederCoverageMapProps {
  feeders: FeederRange[];
  metric: FeederRangeMetric;
  mode: FeederRangeMode;
  showLowConfidence: boolean;
}

function getFeederLabel(f: FeederRange): string {
  return f.short_name || f.long_name || f.node_id_str || `!${f.node_id.toString(16)}`;
}

function pickRadiusKm(f: FeederRange, metric: FeederRangeMetric, mode: FeederRangeMode): number | null {
  const block = mode === 'direct' ? f.direct : f.any;
  if (block.sample_count === 0) return null;
  switch (metric) {
    case 'p50':
      return block.p50_km;
    case 'p90':
      return block.p90_km;
    case 'p95':
      return block.p95_km;
    case 'max':
      return block.max_km;
  }
}

interface PopupFeeder {
  feeder: FeederRange;
}

function FeederPopupOverlay({
  popup,
  mode,
  onClose,
}: {
  popup: PopupFeeder | null;
  mode: FeederRangeMode;
  onClose: () => void;
}) {
  const { current: mapRef } = useMap();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!popup || !mapRef) {
      setPosition(null);
      return;
    }
    const map = mapRef.getMap?.();
    if (!map) return;

    const updatePosition = () => {
      try {
        const point = mapRef.project([popup.feeder.lng, popup.feeder.lat]);
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
  }, [mapRef, popup]);

  if (!popup || !position) return null;
  const { feeder } = popup;
  const block = mode === 'direct' ? feeder.direct : feeder.any;

  return (
    <div className="pointer-events-none absolute inset-0 z-[10000]" data-testid="feeder-popup">
      <div
        className="pointer-events-auto min-w-[220px] max-w-[280px] rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-lg"
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
            {feeder.long_name && feeder.short_name
              ? `${feeder.long_name} (${feeder.short_name})`
              : getFeederLabel(feeder)}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">{feeder.node_id_str}</div>
          <div className="mt-2 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Mode</span>
              <span>{mode === 'direct' ? 'Direct only' : 'Any path'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Samples</span>
              <span>
                {block.sample_count}
                {block.low_confidence && (
                  <span className="ml-1 rounded bg-amber-500/20 px-1 text-amber-300">low confidence</span>
                )}
              </span>
            </div>
            {block.sample_count > 0 && (
              <div className="mt-1 grid grid-cols-4 gap-1 text-center text-xs">
                <div>
                  <div className="text-slate-400">p50</div>
                  <div>{block.p50_km?.toFixed(1)} km</div>
                </div>
                <div>
                  <div className="text-slate-400">p90</div>
                  <div>{block.p90_km?.toFixed(1)} km</div>
                </div>
                <div>
                  <div className="text-slate-400">p95</div>
                  <div>{block.p95_km?.toFixed(1)} km</div>
                </div>
                <div>
                  <div className="text-slate-400">max</div>
                  <div>{block.max_km?.toFixed(1)} km</div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs italic text-slate-400">
            Circle = radius containing the chosen percentile of successful TR targets. Not &ldquo;N% of attempts succeed
            at this range&rdquo;. Round-trip; lower bound on real reach.
          </div>
          <Link
            to={`/nodes/${feeder.node_id}`}
            className="mt-1 inline-block text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
          >
            Open node details
          </Link>
        </div>
      </div>
    </div>
  );
}

export function FeederCoverageMap({ feeders, metric, mode, showLowConfidence }: FeederCoverageMapProps) {
  const config = useConfig();
  const mapboxToken = config.mapboxToken ?? (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined);
  const mapStyle = useMapboxStyle();
  const [selected, setSelected] = useState<PopupFeeder | null>(null);

  // Pre-compute renderable rows: anything with a usable radius for the chosen metric/mode.
  const rows = useMemo(() => {
    return feeders
      .map((f) => {
        const block = mode === 'direct' ? f.direct : f.any;
        const radiusKm = pickRadiusKm(f, metric, mode);
        return {
          feeder: f,
          block,
          radiusKm,
        };
      })
      .filter((r) => r.radiusKm != null && r.radiusKm > 0);
  }, [feeders, metric, mode]);

  const visible = useMemo(
    () => (showLowConfidence ? rows : rows.filter((r) => !r.block.low_confidence)),
    [rows, showLowConfidence]
  );

  const handleClick = useCallback((info: PickingInfo) => {
    if (info.object && info.layer?.id?.startsWith('feeder-')) {
      const obj = info.object as { feeder?: FeederRange } | FeederRange;
      const feeder = (obj as { feeder?: FeederRange }).feeder ?? (obj as FeederRange);
      setSelected({ feeder });
    } else {
      setSelected(null);
    }
  }, []);

  const circleLayer = useMemo(() => {
    if (visible.length === 0) return null;
    return new ScatterplotLayer({
      id: 'feeder-circles',
      data: visible,
      getPosition: (d) => [d.feeder.lng, d.feeder.lat],
      // Radius is in metres; deck.gl handles correct geographic scaling at any zoom.
      radiusUnits: 'meters',
      getRadius: (d) => (d.radiusKm ?? 0) * 1000,
      stroked: true,
      filled: true,
      lineWidthUnits: 'pixels',
      // Stroke is solid; low-confidence rows get a thinner / fainter look.
      getLineColor: (d) => (d.block.low_confidence ? [...TEAL, 120] : [...TEAL, 220]),
      getLineWidth: (d) => (d.block.low_confidence ? 1 : 2),
      getFillColor: (d) =>
        d.block.low_confidence
          ? ([...TEAL, 12] as [number, number, number, number])
          : ([...TEAL, 28] as [number, number, number, number]),
      pickable: true,
    });
  }, [visible]);

  const dotLayer = useMemo(() => {
    if (visible.length === 0) return null;
    return new ScatterplotLayer({
      id: 'feeder-dots',
      data: visible,
      getPosition: (d) => [d.feeder.lng, d.feeder.lat],
      getFillColor: () => FEEDER_DOT,
      getRadius: 100,
      radiusMinPixels: 4,
      radiusMaxPixels: 9,
      pickable: true,
    });
  }, [visible]);

  const labelLayer = useMemo(() => {
    if (visible.length === 0) return null;
    return new TextLayer({
      id: 'feeder-labels',
      data: visible,
      getPosition: (d) => [d.feeder.lng, d.feeder.lat],
      getText: (d) => getFeederLabel(d.feeder),
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
  }, [visible]);

  const layers = useMemo(
    () => [circleLayer, dotLayer, labelLayer].filter(Boolean) as (ScatterplotLayer | TextLayer)[],
    [circleLayer, dotLayer, labelLayer]
  );

  if (!mapboxToken) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
        Mapbox token required. Set VITE_MAPBOX_TOKEN (dev) or MAPBOX_TOKEN (Docker) in your environment.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" data-testid="feeder-coverage-map-container">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={DEFAULT_CENTER}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay interleaved={false} layers={layers} onClick={handleClick} />
        <FeederPopupOverlay popup={selected} mode={mode} onClose={() => setSelected(null)} />
      </Map>
    </div>
  );
}
