import { useCallback, useEffect, useMemo, useState } from 'react';
import { Map, useControl, useMap } from 'react-map-gl';
import { MapboxOverlay, type MapboxOverlayProps } from '@deck.gl/mapbox';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import type { Layer, PickingInfo } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';

import { X } from 'lucide-react';

import { useConfig } from '@/providers/ConfigProvider';
import { useMapboxStyle } from '@/hooks/useMapboxStyle';
import type { ConstellationCoverageHex } from '@/lib/api/meshtastic-api';

const DEFAULT_CENTER = { longitude: -4.2518, latitude: 55.8642, zoom: 7 };
const LOW_CONFIDENCE_COLOR: [number, number, number, number] = [148, 163, 184, 140];

export interface SmoothedHex extends ConstellationCoverageHex {
  smoothed: number;
}

function smoothedRate(successes: number, attempts: number): number {
  return (successes + 1) / (attempts + 2);
}

function reliabilityColor(rate: number, alpha = 160): [number, number, number, number] {
  const t = Math.max(0, Math.min(1, rate));
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

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

function HexPopupOverlay({ hex, onClose }: { hex: SmoothedHex | null; onClose: () => void }) {
  const { current: mapRef } = useMap();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!hex || !mapRef) {
      setPosition(null);
      return;
    }
    const map = mapRef.getMap?.();
    if (!map) return;

    const updatePosition = () => {
      try {
        const point = mapRef.project([hex.centre_lng, hex.centre_lat]);
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
  }, [mapRef, hex]);

  if (!hex || !position) return null;

  const rawRate = hex.attempts > 0 ? hex.successes / hex.attempts : 0;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[10000]"
      style={{ position: 'absolute' }}
      data-testid="coverage-hex-popup"
    >
      <div
        className="pointer-events-auto min-w-[200px] rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-lg"
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
          <div className="font-mono text-xs text-slate-400">{hex.h3_index}</div>
          <div className="mt-1 text-xs">
            {hex.successes} / {hex.attempts} ({(rawRate * 100).toFixed(0)}% raw)
          </div>
          <div className="text-xs">Smoothed: {(hex.smoothed * 100).toFixed(0)}%</div>
          <div className="mt-1 text-xs text-slate-400">
            {hex.contributing_feeders} feeder{hex.contributing_feeders === 1 ? '' : 's'}, {hex.contributing_targets}{' '}
            target{hex.contributing_targets === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ConstellationCoverageMapProps {
  hexes: ConstellationCoverageHex[];
  minAttempts: number;
}

export function ConstellationCoverageMap({ hexes, minAttempts }: ConstellationCoverageMapProps) {
  const config = useConfig();
  const mapboxToken = config.mapboxToken ?? (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined);
  const mapStyle = useMapboxStyle();
  const [selectedHex, setSelectedHex] = useState<SmoothedHex | null>(null);

  const smoothedHexes: SmoothedHex[] = useMemo(
    () =>
      hexes.map((h) => ({
        ...h,
        smoothed: smoothedRate(h.successes, h.attempts),
      })),
    [hexes]
  );

  const layer = useMemo(() => {
    if (smoothedHexes.length === 0) return null;
    return new H3HexagonLayer<SmoothedHex>({
      id: 'constellation-coverage-hex',
      data: smoothedHexes,
      getHexagon: (d) => d.h3_index,
      extruded: false,
      stroked: true,
      filled: true,
      getFillColor: (d) => (d.attempts < minAttempts ? LOW_CONFIDENCE_COLOR : reliabilityColor(d.smoothed)),
      getLineColor: [15, 23, 42, 180],
      lineWidthMinPixels: 1,
      pickable: true,
    });
  }, [smoothedHexes, minAttempts]);

  const layers = useMemo(() => [layer].filter(Boolean) as Layer[], [layer]);

  const handleClick = useCallback((info: PickingInfo) => {
    if (info.object && info.layer?.id === 'constellation-coverage-hex') {
      setSelectedHex(info.object as SmoothedHex);
    } else {
      setSelectedHex(null);
    }
  }, []);

  if (!mapboxToken) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
        Mapbox token required. Set VITE_MAPBOX_TOKEN (dev) or MAPBOX_TOKEN (Docker) in your environment.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" data-testid="constellation-coverage-map-container">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={DEFAULT_CENTER}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay interleaved={false} layers={layers} onClick={handleClick} />
        <HexPopupOverlay hex={selectedHex} onClose={() => setSelectedHex(null)} />
      </Map>
    </div>
  );
}
