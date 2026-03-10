/**
 * Theme-aware map tile URLs for Leaflet.
 * Dark: CartoDB Dark Matter
 * Light: CartoDB Positron
 */

export const MAP_TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const;

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function getMapTileUrl(isDark: boolean): string {
  return isDark ? MAP_TILE_URLS.dark : MAP_TILE_URLS.light;
}
