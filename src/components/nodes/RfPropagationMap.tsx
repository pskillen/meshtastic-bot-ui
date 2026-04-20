/**
 * Minimal Leaflet map showing a single georeferenced PNG via L.imageOverlay.
 * Bounds use API order west/south/east/north; Leaflet expects [[south, west], [north, east]].
 */
import { useMapTileUrl } from '@/hooks/useMapTileUrl';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface RfPropagationMapProps {
  assetUrl: string | null | undefined;
  bounds: { west: number; south: number; east: number; north: number } | null | undefined;
  /** Minimum height for the map container */
  minHeight?: number;
  className?: string;
}

export function RfPropagationMap({ assetUrl, bounds, minHeight = 280, className }: RfPropagationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const { url: tileUrl, attribution } = useMapTileUrl();

  useEffect(() => {
    const el = mapRef.current;
    if (!el || !assetUrl || !bounds) return;

    const map = L.map(el, { zoomControl: true }).setView(
      [(bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2],
      10
    );
    mapInstanceRef.current = map;
    L.tileLayer(tileUrl, { attribution }).addTo(map);

    const sw: L.LatLngTuple = [bounds.south, bounds.west];
    const ne: L.LatLngTuple = [bounds.north, bounds.east];
    const overlay = L.imageOverlay(assetUrl, [sw, ne], { opacity: 0.85 }).addTo(map);
    layersRef.current.push(overlay);

    map.fitBounds(L.latLngBounds(sw, ne), { padding: [24, 24], maxZoom: 14 });
    const t = setTimeout(() => map.invalidateSize(), 50);

    return () => {
      clearTimeout(t);
      layersRef.current.forEach((layer) => {
        try {
          map.removeLayer(layer);
        } catch {
          /* noop */
        }
      });
      layersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [assetUrl, bounds, tileUrl, attribution]);

  if (!assetUrl || !bounds) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border bg-muted/40 text-muted-foreground text-sm ${className ?? ''}`}
        style={{ minHeight }}
      >
        Map not rendered yet
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`map-container w-full rounded-md border ${className ?? ''}`}
      style={{ minHeight, position: 'relative', zIndex: 1 }}
    />
  );
}
