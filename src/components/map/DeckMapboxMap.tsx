import type { ReactNode } from 'react';

import type { Layer, PickingInfo } from '@deck.gl/core';
import { DeckGL } from 'deck.gl';
import type { DeckGLProps } from 'deck.gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map } from 'react-map-gl';

import { useConfig } from '@/providers/ConfigProvider';
import { useMapboxStyle } from '@/hooks/useMapboxStyle';
import { cn } from '@/lib/utils';

/**
 * react-map-gl allows `bounds` + `fitBoundsOptions` on initial view state; DeckGL's typings
 * only list lon/lat/zoom. The Map child still applies bounds correctly at runtime.
 */
export type DeckMapboxInitialViewState =
  | NonNullable<DeckGLProps['initialViewState']>
  | {
      bounds: [number, number, number, number];
      fitBoundsOptions?: { padding?: number; maxZoom?: number; minZoom?: number };
    };

export type DeckMapboxMapProps = {
  layers: Layer[];
  initialViewState: DeckMapboxInitialViewState;
  onClick?: (info: PickingInfo) => void;
  getTooltip?: DeckGLProps['getTooltip'];
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
};

/**
 * Deck.gl owns the WebGL overlay lifecycle; Mapbox renders underneath as a child Map.
 * Replaces fragile `useControl(() => new MapboxOverlay(props))` + render-time `setProps`,
 * which could drop layers after unrelated React state updates (GitHub #150).
 */
export function DeckMapboxMap({
  layers,
  initialViewState,
  onClick,
  getTooltip,
  children,
  className,
  'data-testid': testId,
}: DeckMapboxMapProps) {
  const config = useConfig();
  const mapboxToken = config.mapboxToken ?? (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined);
  const mapStyle = useMapboxStyle();

  if (!mapboxToken) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-md border bg-muted/30 text-muted-foreground">
        Mapbox token required. Set VITE_MAPBOX_TOKEN (dev) or MAPBOX_TOKEN (Docker) in your environment.
      </div>
    );
  }

  return (
    <div className={cn('relative h-full w-full', className)} data-testid={testId}>
      <DeckGL
        controller
        layers={layers}
        initialViewState={initialViewState as DeckGLProps['initialViewState']}
        onClick={onClick}
        getTooltip={getTooltip}
        style={{ width: '100%', height: '100%' }}
      >
        <Map reuseMaps mapboxAccessToken={mapboxToken} mapStyle={mapStyle} style={{ width: '100%', height: '100%' }}>
          {children}
        </Map>
      </DeckGL>
    </div>
  );
}
