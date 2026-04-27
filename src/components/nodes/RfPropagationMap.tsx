/**
 * Minimal Leaflet map showing a single georeferenced PNG via L.imageOverlay.
 * Bounds use API order west/south/east/north; Leaflet expects [[south, west], [north, east]].
 */
import { useMapTileUrl } from '@/hooks/useMapTileUrl';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

/** Approximate km per degree latitude */
const KM_PER_DEG_LAT = 111;

/** Target on-screen diameter when API bounds span more than this (local coverage UX; see issue #191). */
const VIEWPORT_MAX_DIAMETER_KM = 200;

function approxBoundsSpanKm(bounds: { west: number; south: number; east: number; north: number }): number {
  const midLat = (bounds.south + bounds.north) / 2;
  const nsKm = Math.abs(bounds.north - bounds.south) * KM_PER_DEG_LAT;
  const ewKm = Math.abs(bounds.east - bounds.west) * KM_PER_DEG_LAT * Math.cos((midLat * Math.PI) / 180);
  return Math.max(nsKm, ewKm);
}

/** Axis-aligned bounds ~`radiusKm` from center (used when raw render bounds are continent-scale). */
function latLngBoundsRadiusKm(centerLat: number, centerLng: number, radiusKm: number): L.LatLngBounds {
  const latDelta = radiusKm / KM_PER_DEG_LAT;
  const cosLat = Math.cos((centerLat * Math.PI) / 180);
  const lngDelta = cosLat > 1e-6 ? radiusKm / (KM_PER_DEG_LAT * cosLat) : latDelta;
  return L.latLngBounds([centerLat - latDelta, centerLng - lngDelta], [centerLat + latDelta, centerLng + lngDelta]);
}

function fitBoundsForPropagation(
  map: L.Map,
  bounds: { west: number; south: number; east: number; north: number },
  overlaySw: L.LatLngTuple,
  overlayNe: L.LatLngTuple
): void {
  const spanKm = approxBoundsSpanKm(bounds);
  if (spanKm <= VIEWPORT_MAX_DIAMETER_KM) {
    map.fitBounds(L.latLngBounds(overlaySw, overlayNe), { padding: [24, 24], maxZoom: 14 });
    return;
  }
  const centerLat = (bounds.south + bounds.north) / 2;
  const centerLng = (bounds.west + bounds.east) / 2;
  const capped = latLngBoundsRadiusKm(centerLat, centerLng, VIEWPORT_MAX_DIAMETER_KM / 2);
  map.fitBounds(capped, { padding: [24, 24], maxZoom: 14 });
}

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

    const centerLat = (bounds.south + bounds.north) / 2;
    const centerLng = (bounds.west + bounds.east) / 2;
    const map = L.map(el, { zoomControl: true }).setView([centerLat, centerLng], 11);
    mapInstanceRef.current = map;
    L.tileLayer(tileUrl, { attribution }).addTo(map);

    const sw: L.LatLngTuple = [bounds.south, bounds.west];
    const ne: L.LatLngTuple = [bounds.north, bounds.east];
    const overlay = L.imageOverlay(assetUrl, [sw, ne], { opacity: 0.85 }).addTo(map);
    layersRef.current.push(overlay);

    fitBoundsForPropagation(map, bounds, sw, ne);

    /** Tabs (e.g. node Map) and dialogs mount the map at 0×0; refit once the container is measurable. */
    let prevTooSmall = true;
    const refitIfNeeded = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const tooSmall = w < 32 || h < 32;
      if (tooSmall) {
        prevTooSmall = true;
        return;
      }
      map.invalidateSize();
      if (prevTooSmall) {
        fitBoundsForPropagation(map, bounds, sw, ne);
      }
      prevTooSmall = false;
    };
    const ro = new ResizeObserver(() => refitIfNeeded());
    ro.observe(el);
    const t = window.setTimeout(() => refitIfNeeded(), 50);

    return () => {
      window.clearTimeout(t);
      ro.disconnect();
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
