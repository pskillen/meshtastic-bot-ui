import { WebMercatorViewport } from '@deck.gl/core';

/** Nominal map size for fitBounds (actual canvas may differ slightly). */
const NOMINAL_WIDTH = 800;
const NOMINAL_HEIGHT = 320;

export type LngLatBBox = [west: number, south: number, east: number, north: number];

/**
 * Convert geographic bounds to DeckGL `initialViewState` lon/lat/zoom.
 * Uses {@link https://deck.gl/docs/api-reference/core/web-mercator-viewport | WebMercatorViewport.fitBounds}.
 */
export function viewStateFromLngLatBBox(
  bbox: LngLatBBox,
  options: { padding?: number; maxZoom?: number } = {}
): { longitude: number; latitude: number; zoom: number } {
  const [west, south, east, north] = bbox;
  const padding = options.padding ?? 40;
  const maxZoom = options.maxZoom ?? 14;

  const base = new WebMercatorViewport({
    width: NOMINAL_WIDTH,
    height: NOMINAL_HEIGHT,
    longitude: 0,
    latitude: 0,
    zoom: 1,
  });

  const fitted = base.fitBounds(
    [
      [west, south],
      [east, north],
    ],
    { padding, maxZoom, width: NOMINAL_WIDTH, height: NOMINAL_HEIGHT }
  );

  return {
    longitude: fitted.longitude,
    latitude: fitted.latitude,
    zoom: fitted.zoom,
  };
}
