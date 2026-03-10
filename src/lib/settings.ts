/**
 * Local storage keys and helpers for browser-only settings.
 */

export const STORAGE_KEYS = {
  MAP_TILE_SOURCE: 'meshflow-map-tile-source',
} as const;

export const DEFAULT_MAP_TILE_SOURCE = 'osm';

export type MapTileSourceId = 'auto' | 'osm' | 'positron' | 'dark-matter' | 'voyager';

export function getMapTileSource(): MapTileSourceId {
  if (typeof window === 'undefined') return DEFAULT_MAP_TILE_SOURCE as MapTileSourceId;
  const stored = localStorage.getItem(STORAGE_KEYS.MAP_TILE_SOURCE);
  if (stored && ['auto', 'osm', 'positron', 'dark-matter', 'voyager'].includes(stored)) {
    return stored as MapTileSourceId;
  }
  return DEFAULT_MAP_TILE_SOURCE as MapTileSourceId;
}

export function setMapTileSource(source: MapTileSourceId): void {
  localStorage.setItem(STORAGE_KEYS.MAP_TILE_SOURCE, source);
  window.dispatchEvent(new Event('meshflow-settings-changed'));
}
