/**
 * Map tile URLs and metadata for Leaflet.
 */

export type ThemeCompatibility = 'light' | 'dark' | 'both';

export interface MapTileSource {
  id: string;
  label: string;
  url: string | null;
  themeCompatibility: ThemeCompatibility;
}

export const MAP_TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
} as const;

export const MAP_TILE_SOURCES: MapTileSource[] = [
  { id: 'auto', label: 'Auto (theme-aware)', url: null, themeCompatibility: 'both' },
  { id: 'osm', label: 'OpenStreetMap', url: MAP_TILE_URLS.osm, themeCompatibility: 'both' },
  { id: 'positron', label: 'CartoDB Positron', url: MAP_TILE_URLS.light, themeCompatibility: 'light' },
  { id: 'dark-matter', label: 'CartoDB Dark Matter', url: MAP_TILE_URLS.dark, themeCompatibility: 'dark' },
  { id: 'voyager', label: 'CartoDB Voyager', url: MAP_TILE_URLS.voyager, themeCompatibility: 'both' },
];

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const MAP_TILE_ATTRIBUTION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function getMapTileUrl(isDark: boolean): string {
  return isDark ? MAP_TILE_URLS.dark : MAP_TILE_URLS.light;
}

export function getMapTileUrlForSource(source: string, isDark: boolean): string {
  switch (source) {
    case 'auto':
      return isDark ? MAP_TILE_URLS.dark : MAP_TILE_URLS.light;
    case 'osm':
      return MAP_TILE_URLS.osm;
    case 'positron':
      return MAP_TILE_URLS.light;
    case 'dark-matter':
      return MAP_TILE_URLS.dark;
    case 'voyager':
      return MAP_TILE_URLS.voyager;
    default:
      return isDark ? MAP_TILE_URLS.dark : MAP_TILE_URLS.light;
  }
}

export function getMapTileAttributionForSource(source: string): string {
  return source === 'osm' ? MAP_TILE_ATTRIBUTION_OSM : MAP_TILE_ATTRIBUTION;
}
