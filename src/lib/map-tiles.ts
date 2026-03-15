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
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
} as const;

export const MAP_TILE_SOURCES: MapTileSource[] = [
  { id: 'auto', label: 'Follow theme', url: null, themeCompatibility: 'both' },
  { id: 'osm', label: 'Streets', url: MAP_TILE_URLS.osm, themeCompatibility: 'both' },
  { id: 'positron', label: 'Light (minimal)', url: MAP_TILE_URLS.light, themeCompatibility: 'light' },
  { id: 'dark-matter', label: 'Dark', url: MAP_TILE_URLS.dark, themeCompatibility: 'dark' },
  { id: 'voyager', label: 'Colorful streets', url: MAP_TILE_URLS.voyager, themeCompatibility: 'both' },
  { id: 'satellite', label: 'Satellite', url: MAP_TILE_URLS.satellite, themeCompatibility: 'both' },
  { id: 'terrain', label: 'Terrain', url: MAP_TILE_URLS.terrain, themeCompatibility: 'both' },
];

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const MAP_TILE_ATTRIBUTION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const MAP_TILE_ATTRIBUTION_ESRI =
  '&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

export const MAP_TILE_ATTRIBUTION_OPENTOPOMAP =
  'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)';

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
    case 'satellite':
      return MAP_TILE_URLS.satellite;
    case 'terrain':
      return MAP_TILE_URLS.terrain;
    default:
      return isDark ? MAP_TILE_URLS.dark : MAP_TILE_URLS.light;
  }
}

export function getMapTileAttributionForSource(source: string): string {
  switch (source) {
    case 'osm':
      return MAP_TILE_ATTRIBUTION_OSM;
    case 'satellite':
      return MAP_TILE_ATTRIBUTION_ESRI;
    case 'terrain':
      return MAP_TILE_ATTRIBUTION_OPENTOPOMAP;
    default:
      return MAP_TILE_ATTRIBUTION;
  }
}

export function getMapboxStyleForSource(source: string, isDark: boolean): string {
  switch (source) {
    case 'auto':
      return isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
    case 'positron':
      return 'mapbox://styles/mapbox/light-v11';
    case 'dark-matter':
      return 'mapbox://styles/mapbox/dark-v11';
    case 'osm':
    case 'voyager':
      return 'mapbox://styles/mapbox/streets-v12';
    case 'satellite':
      return 'mapbox://styles/mapbox/satellite-streets-v12';
    case 'terrain':
      return 'mapbox://styles/mapbox/outdoors-v12';
    default:
      return isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
  }
}
